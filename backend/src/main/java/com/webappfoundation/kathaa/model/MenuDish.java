package com.webappfoundation.kathaa.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

/** A dish or drink on Cafe Kathaa's menu — sellable as itemType MENU_DISH (takeaway workflow). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "kathaa_menu_dish")
public class MenuDish {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(columnDefinition = "text")
    private String description;

    /** "Page note" — one line of story printed beside the dish, like a margin annotation. */
    @Column(columnDefinition = "text")
    private String pageNote;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Diet diet = Diet.VEG;

    @Builder.Default
    private boolean signature = false;

    private String imageUrl;

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private Integer sortOrder = 0;

    @Builder.Default
    private String workflowCode = "kathaa-takeaway";

    private Instant createdAt;
    private Instant updatedAt;
}
