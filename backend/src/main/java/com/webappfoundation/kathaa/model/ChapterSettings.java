package com.webappfoundation.kathaa.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** The "Chapters" stamp card: N finished visits/takeaways fill a chapter, which earns the reward text. Single row. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "kathaa_chapter_settings")
public class ChapterSettings {
    @Id
    private Long id;

    @Column(nullable = false)
    @Builder.Default
    private Integer stampsPerChapter = 8;

    @Column(nullable = false)
    @Builder.Default
    private String rewardText = "A beverage of your choice, on the house";

    @Builder.Default
    private boolean enabled = true;
}
