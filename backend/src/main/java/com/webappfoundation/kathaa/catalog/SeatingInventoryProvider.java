package com.webappfoundation.kathaa.catalog;

import com.webappfoundation.inventory.InventoryProvider;
import com.webappfoundation.kathaa.model.SeatingZone;
import com.webappfoundation.kathaa.model.SlotHold;
import com.webappfoundation.kathaa.repo.SeatingZoneRepository;
import com.webappfoundation.kathaa.repo.SlotHoldRepository;
import com.webappfoundation.kathaa.service.SlotRules;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Seats-per-slot inventory for SEATING. variantKey = slot "yyyy-MM-ddTHH:mm". Reserve locks the (zone, slot)
 * row and refuses with 409 when the party would overflow the zone — so two guests can never take the last table.
 * Called only through the fenced InventoryService.
 */
@Component
public class SeatingInventoryProvider implements InventoryProvider {

    private final SeatingZoneRepository zones;
    private final SlotHoldRepository holds;

    public SeatingInventoryProvider(SeatingZoneRepository zones, SlotHoldRepository holds) {
        this.zones = zones;
        this.holds = holds;
    }

    @Override
    public String itemType() {
        return KathaaTypes.SEATING;
    }

    @Override
    public boolean availableAt(Long itemId, Long branchId) {
        return zones.findById(itemId).map(SeatingZone::isActive).orElse(false);
    }

    @Override
    @Transactional
    public void reserve(Long itemId, String variantKey, Long branchId, int qty) {
        SeatingZone zone = zones.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown seating area"));
        SlotRules.requireBookable(zone, variantKey);
        if (qty < 1 || qty > zone.getMaxParty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Party size must be between 1 and " + zone.getMaxParty() + " for " + zone.getName());
        }
        SlotHold hold = holds.lockByZoneAndSlot(itemId, variantKey)
                .orElseGet(() -> holds.saveAndFlush(SlotHold.builder().zoneId(itemId).slotKey(variantKey).reserved(0).build()));
        int left = zone.getSeatsPerSlot() - hold.getReserved();
        if (qty > left) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    left <= 0 ? "That slot just filled up — please pick another time"
                              : "Only " + left + " seats left in " + zone.getName() + " at that time");
        }
        hold.setReserved(hold.getReserved() + qty);
        holds.save(hold);
    }

    @Override
    public void commit(Long itemId, String variantKey, Long branchId, int qty) {
        // Seats stay held until the booking is cancelled; nothing to convert.
    }

    @Override
    @Transactional
    public void release(Long itemId, String variantKey, Long branchId, int qty) {
        holds.lockByZoneAndSlot(itemId, variantKey).ifPresent(h -> {
            h.setReserved(Math.max(0, h.getReserved() - qty));
            holds.save(h);
        });
    }
}
