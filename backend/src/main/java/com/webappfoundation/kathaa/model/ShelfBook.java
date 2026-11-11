package com.webappfoundation.kathaa.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** A book on the cafe's reading shelf — browsable online and holdable for a table booking. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "kathaa_shelf_book")
public class ShelfBook {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author;

    /** English / मराठी / हिंदी … */
    @Column(nullable = false)
    @Builder.Default
    private String language = "English";

    private String genre;

    @Column(columnDefinition = "text")
    private String blurb;

    private String coverUrl;

    /** Copies on the shelf; a held copy on a given day reduces what's free that day. */
    @Builder.Default
    private Integer copies = 1;

    @Builder.Default
    private boolean staffPick = false;

    @Builder.Default
    private boolean active = true;

    private Instant createdAt;
    private Instant updatedAt;
}
