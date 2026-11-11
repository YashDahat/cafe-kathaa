package com.webappfoundation.kathaa.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

/** The cafe-specific extras of a table booking; the booking itself is an order on the kathaa-table workflow. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "kathaa_reservation_detail")
public class ReservationDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long orderId;

    @Column(nullable = false)
    private Integer userId;

    @Column(nullable = false)
    private Long zoneId;

    private String zoneName;

    @Column(nullable = false, length = 20)
    private String slotKey;

    @Column(nullable = false)
    private LocalDate slotDate;

    @Column(nullable = false)
    private Integer guests;

    /** A book from The Shelf the guest asked us to keep at their table. */
    private Long bookId;
    private String bookTitle;

    @Builder.Default
    private boolean withPet = false;
    private String petName;

    private String occasion;

    @Column(length = 280)
    private String note;

    private Instant createdAt;
}
