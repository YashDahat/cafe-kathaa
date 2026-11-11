package com.webappfoundation.kathaa.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** A reader's one-line note pencilled against a shelf book; public only after staff approve it. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "kathaa_margin_note")
public class MarginNote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long bookId;

    @Column(nullable = false)
    private Integer userId;

    /** First name only — never email/phone. */
    private String authorName;

    @Column(nullable = false, length = 160)
    private String text;

    @Builder.Default
    private boolean approved = false;

    private Instant createdAt;
}
