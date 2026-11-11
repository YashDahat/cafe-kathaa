package com.webappfoundation.kathaa.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** One entry of the Our Story timeline — admin-editable. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "kathaa_story_chapter")
public class StoryChapter {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Short marker shown on the spine, e.g. "Before", "2018", "Today". */
    @Column(nullable = false)
    private String marker;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "text")
    private String body;

    private String imageUrl;

    @Builder.Default
    private Integer sortOrder = 0;

    @Builder.Default
    private boolean active = true;

    private Instant createdAt;
    private Instant updatedAt;
}
