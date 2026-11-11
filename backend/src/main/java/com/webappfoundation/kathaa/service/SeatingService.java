package com.webappfoundation.kathaa.service;

import com.webappfoundation.dto.BulkUploadResult;
import com.webappfoundation.exception.ResourceNotFoundException;
import com.webappfoundation.kathaa.catalog.KathaaTypes;
import com.webappfoundation.kathaa.dto.KathaaDtos.*;
import com.webappfoundation.kathaa.model.SeatingZone;
import com.webappfoundation.kathaa.model.SlotHold;
import com.webappfoundation.kathaa.repo.SeatingZoneRepository;
import com.webappfoundation.kathaa.repo.SlotHoldRepository;
import com.webappfoundation.service.AuditService;
import com.webappfoundation.service.SpreadsheetParser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SeatingService {

    private final SeatingZoneRepository zones;
    private final SlotHoldRepository holds;
    private final SpreadsheetParser parser;
    private final AuditService audit;

    public SeatingService(SeatingZoneRepository zones, SlotHoldRepository holds, SpreadsheetParser parser,
                          AuditService audit) {
        this.zones = zones;
        this.holds = holds;
        this.parser = parser;
        this.audit = audit;
    }

    public List<SeatingZoneDto> listActive() {
        return zones.findByActiveTrueOrderBySortOrderAsc().stream().map(SeatingService::toDto).toList();
    }

    public List<SeatingZoneDto> listAll() {
        return zones.findAllByOrderBySortOrderAsc().stream().map(SeatingService::toDto).toList();
    }

    public SeatingZone require(Long id) {
        return zones.findById(id).orElseThrow(() -> new ResourceNotFoundException("Seating area not found"));
    }

    /** Seats left per slot, per active zone, for one date. */
    public List<ZoneAvailabilityDto> availability(String dateStr) {
        LocalDate date = parseDate(dateStr);
        Map<String, Integer> reserved = holds.findBySlotKeyStartingWith(date.toString()).stream()
                .collect(Collectors.toMap(h -> h.getZoneId() + "|" + h.getSlotKey(), SlotHold::getReserved, Integer::sum));
        List<ZoneAvailabilityDto> out = new ArrayList<>();
        for (SeatingZone z : zones.findByActiveTrueOrderBySortOrderAsc()) {
            List<SlotDto> slots = new ArrayList<>();
            for (LocalTime t : SlotRules.slotTimes(z)) {
                String key = SlotRules.key(date, t);
                int left = Math.max(0, z.getSeatsPerSlot() - reserved.getOrDefault(z.getId() + "|" + key, 0));
                boolean bookable = left > 0 && SlotRules.isBookable(LocalDateTime.of(date, t));
                slots.add(new SlotDto(key, key.substring(11), left, bookable));
            }
            out.add(new ZoneAvailabilityDto(z.getId(), z.getName(), z.getMaxParty(), slots));
        }
        return out;
    }

    static LocalDate parseDate(String s) {
        try {
            return s == null || s.isBlank() ? LocalDate.now(KathaaTypes.ZONE) : LocalDate.parse(s);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Date must be YYYY-MM-DD");
        }
    }

    @Transactional
    public SeatingZoneDto create(UpsertSeatingZoneRequest r) {
        validate(r);
        SeatingZone z = new SeatingZone();
        z.setCreatedAt(Instant.now());
        apply(z, r);
        z = zones.save(z);
        audit.record("SEATING_ZONE_CREATED", "SUCCESS", "SEATING_ZONE", String.valueOf(z.getId()), z.getName());
        return toDto(z);
    }

    @Transactional
    public SeatingZoneDto update(Long id, UpsertSeatingZoneRequest r) {
        validate(r);
        SeatingZone z = require(id);
        apply(z, r);
        z = zones.save(z);
        audit.record("SEATING_ZONE_UPDATED", "SUCCESS", "SEATING_ZONE", String.valueOf(id), z.getName());
        return toDto(z);
    }

    @Transactional
    public void delete(Long id) {
        SeatingZone z = require(id);
        z.setActive(false);
        z.setUpdatedAt(Instant.now());
        zones.save(z);
        audit.record("SEATING_ZONE_DELETED", "SUCCESS", "SEATING_ZONE", String.valueOf(id), z.getName());
    }

    @Transactional
    public BulkUploadResult bulkImport(MultipartFile file) {
        BulkUploadResult result = BulkUploadResult.builder().build();
        int rowNo = 1;
        for (Map<String, String> row : parser.parse(file)) {
            rowNo++;
            try {
                String name = BulkRows.str(row, "name");
                if (name == null) {
                    result.addError(rowNo, "name is required");
                    continue;
                }
                String slug = BulkRows.slugify(name);
                if (zones.existsBySlug(slug)) {
                    result.setSkipped(result.getSkipped() + 1);
                    continue;
                }
                UpsertSeatingZoneRequest r = new UpsertSeatingZoneRequest(name, slug, BulkRows.str(row, "description"),
                        BulkRows.str(row, "tagline"), BulkRows.intVal(row, "seatsperslot", null),
                        BulkRows.intVal(row, "maxparty", 6), Optional.ofNullable(BulkRows.str(row, "firstslot")).orElse("10:00"),
                        Optional.ofNullable(BulkRows.str(row, "lastslot")).orElse("21:00"),
                        BulkRows.intVal(row, "slotminutes", 90), BulkRows.bool(row, "petfriendly", false),
                        BulkRows.bool(row, "workfriendly", false), BulkRows.str(row, "imageurl"), true,
                        BulkRows.intVal(row, "sortorder", 100));
                validate(r);
                SeatingZone z = new SeatingZone();
                z.setCreatedAt(Instant.now());
                apply(z, r);
                zones.save(z);
                result.setCreated(result.getCreated() + 1);
            } catch (ResponseStatusException e) {
                result.addError(rowNo, e.getReason());
            } catch (RuntimeException e) {
                result.addError(rowNo, "Could not read row: " + e.getClass().getSimpleName());
            }
        }
        audit.record("SEATING_ZONE_BULK_IMPORT", "SUCCESS", "SEATING_ZONE", null, "created=" + result.getCreated());
        return result;
    }

    private void validate(UpsertSeatingZoneRequest r) {
        if (r.name() == null || r.name().isBlank()) bad("Name is required");
        if (r.seatsPerSlot() == null || r.seatsPerSlot() < 1 || r.seatsPerSlot() > 500) bad("Seats per slot must be 1–500");
        if (r.maxParty() == null || r.maxParty() < 1 || r.maxParty() > r.seatsPerSlot()) bad("Max party must be 1 to seats per slot");
        if (r.slotMinutes() == null || r.slotMinutes() < 15 || r.slotMinutes() > 480) bad("Slot length must be 15–480 minutes");
        try {
            LocalTime first = LocalTime.parse(r.firstSlot());
            LocalTime last = LocalTime.parse(r.lastSlot());
            if (last.isBefore(first)) bad("Last slot must be after the first slot");
        } catch (DateTimeParseException | NullPointerException e) {
            bad("Slot times must be HH:mm");
        }
    }

    private static void bad(String msg) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }

    private void apply(SeatingZone z, UpsertSeatingZoneRequest r) {
        z.setName(r.name().trim());
        String slug = r.slug() == null || r.slug().isBlank() ? BulkRows.slugify(r.name()) : BulkRows.slugify(r.slug());
        if (!slug.equals(z.getSlug()) && zones.existsBySlug(slug)) slug = slug + "-" + (System.currentTimeMillis() % 10000);
        z.setSlug(slug);
        z.setDescription(r.description());
        z.setTagline(r.tagline());
        z.setSeatsPerSlot(r.seatsPerSlot());
        z.setMaxParty(r.maxParty());
        z.setFirstSlot(r.firstSlot());
        z.setLastSlot(r.lastSlot());
        z.setSlotMinutes(r.slotMinutes());
        z.setPetFriendly(Boolean.TRUE.equals(r.petFriendly()));
        z.setWorkFriendly(Boolean.TRUE.equals(r.workFriendly()));
        z.setImageUrl(r.imageUrl() == null || r.imageUrl().isBlank() ? null : r.imageUrl());
        z.setActive(r.active() == null || r.active());
        z.setSortOrder(r.sortOrder() == null ? 100 : r.sortOrder());
        z.setUpdatedAt(Instant.now());
    }

    static SeatingZoneDto toDto(SeatingZone z) {
        return new SeatingZoneDto(z.getId(), z.getName(), z.getSlug(), z.getDescription(), z.getTagline(),
                z.getSeatsPerSlot(), z.getMaxParty(), z.getFirstSlot(), z.getLastSlot(), z.getSlotMinutes(),
                z.isPetFriendly(), z.isWorkFriendly(), z.getImageUrl(), z.isActive(), z.getSortOrder());
    }
}
