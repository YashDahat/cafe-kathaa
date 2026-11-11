package com.webappfoundation.kathaa.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * A bookable corner of the bungalow (library room, garden verandah, writing desks). Sellable as itemType
 * SEATING at ₹0; the time slot is the order line's variantKey ("yyyy-MM-ddTHH:mm") and seats are held
 * per (zone, slot) through the SeatingInventoryProvider.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "kathaa_seating_zone")
public class SeatingZone {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(columnDefinition = "text")
    private String description;

    /** Short mood line, e.g. "Pets welcome" or "Wi-Fi · 3-hour desk". */
    private String tagline;

    /** Seats bookable per slot across the zone. */
    @Column(nullable = false)
    private Integer seatsPerSlot;

    /** Largest party one booking may bring. */
    @Column(nullable = false)
    private Integer maxParty;

    /** First and last slot start, "HH:mm" (local Asia/Kolkata). */
    @Column(nullable = false)
    private String firstSlot;

    @Column(nullable = false)
    private String lastSlot;

    @Column(nullable = false)
    private Integer slotMinutes;

    @Builder.Default
    private boolean petFriendly = false;

    @Builder.Default
    private boolean workFriendly = false;

    private String imageUrl;

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private Integer sortOrder = 0;

    private Instant createdAt;
    private Instant updatedAt;
}
