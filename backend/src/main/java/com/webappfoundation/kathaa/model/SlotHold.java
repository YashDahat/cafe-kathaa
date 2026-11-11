package com.webappfoundation.kathaa.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Seats held in one zone for one slot. Mutated only by SeatingInventoryProvider (via InventoryService). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "kathaa_slot_hold", uniqueConstraints = @UniqueConstraint(columnNames = {"zoneId", "slotKey"}))
public class SlotHold {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long zoneId;

    @Column(nullable = false, length = 20)
    private String slotKey;

    @Column(nullable = false)
    @Builder.Default
    private Integer reserved = 0;
}
