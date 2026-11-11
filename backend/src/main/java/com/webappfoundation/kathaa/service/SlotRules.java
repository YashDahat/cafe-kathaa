package com.webappfoundation.kathaa.service;

import com.webappfoundation.kathaa.catalog.KathaaTypes;
import com.webappfoundation.kathaa.model.SeatingZone;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

/** Slot maths shared by availability, booking and the seat inventory provider. */
public final class SlotRules {
    private SlotRules() {}

    public static final int BOOKING_WINDOW_DAYS = 30;
    /** Bookings close this many minutes before the slot starts. */
    public static final int LEAD_MINUTES = 30;

    public static List<LocalTime> slotTimes(SeatingZone z) {
        List<LocalTime> out = new ArrayList<>();
        LocalTime t = LocalTime.parse(z.getFirstSlot());
        LocalTime last = LocalTime.parse(z.getLastSlot());
        int step = Math.max(15, z.getSlotMinutes() == null ? 90 : z.getSlotMinutes());
        int guard = 0;
        while (!t.isAfter(last) && guard++ < 96) {
            out.add(t);
            LocalTime next = t.plusMinutes(step);
            if (next.isBefore(t)) break; // wrapped past midnight
            t = next;
        }
        return out;
    }

    public static String key(LocalDate date, LocalTime time) {
        return date + "T" + String.format("%02d:%02d", time.getHour(), time.getMinute());
    }

    public static boolean isBookable(LocalDateTime slot) {
        LocalDateTime now = LocalDateTime.now(KathaaTypes.ZONE);
        return slot.isAfter(now.plusMinutes(LEAD_MINUTES))
                && !slot.toLocalDate().isAfter(now.toLocalDate().plusDays(BOOKING_WINDOW_DAYS));
    }

    /** Validates the slot key belongs to the zone's grid and is inside the booking window; 400 otherwise. */
    public static LocalDateTime requireBookable(SeatingZone zone, String slotKey) {
        if (slotKey == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pick a time slot");
        }
        LocalDateTime slot;
        try {
            slot = LocalDateTime.parse(slotKey);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid time slot");
        }
        if (!slotTimes(zone).contains(slot.toLocalTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That time isn't a bookable slot for " + zone.getName());
        }
        if (!isBookable(slot)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Slots open up to " + BOOKING_WINDOW_DAYS + " days ahead and close " + LEAD_MINUTES + " minutes before");
        }
        return slot;
    }
}
