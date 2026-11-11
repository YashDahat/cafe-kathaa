package com.webappfoundation.kathaa.dto;

import com.webappfoundation.kathaa.model.Diet;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** Request/response shapes for the Cafe Kathaa domain (records keep them compact). */
public final class KathaaDtos {
    private KathaaDtos() {}

    public record MenuDishDto(Long id, String name, String slug, String description, String pageNote, String category,
                              BigDecimal price, Diet diet, boolean signature, String imageUrl, boolean active,
                              Integer sortOrder, String workflowCode) {}

    public record UpsertMenuDishRequest(String name, String slug, String description, String pageNote, String category,
                                        BigDecimal price, Diet diet, Boolean signature, String imageUrl, Boolean active,
                                        Integer sortOrder) {}

    public record SeatingZoneDto(Long id, String name, String slug, String description, String tagline,
                                 Integer seatsPerSlot, Integer maxParty, String firstSlot, String lastSlot,
                                 Integer slotMinutes, boolean petFriendly, boolean workFriendly, String imageUrl,
                                 boolean active, Integer sortOrder) {}

    public record UpsertSeatingZoneRequest(String name, String slug, String description, String tagline,
                                           Integer seatsPerSlot, Integer maxParty, String firstSlot, String lastSlot,
                                           Integer slotMinutes, Boolean petFriendly, Boolean workFriendly,
                                           String imageUrl, Boolean active, Integer sortOrder) {}

    public record SlotDto(String slotKey, String time, int seatsLeft, boolean bookable) {}

    public record ZoneAvailabilityDto(Long zoneId, String zoneName, int maxParty, List<SlotDto> slots) {}

    public record CreateReservationRequest(Long zoneId, String date, String time, Integer guests, Long bookId,
                                           Boolean withPet, String petName, String occasion, String note) {}

    public record ReservationView(Long orderId, String orderNumber, Long zoneId, String zoneName, String slotKey,
                                  Integer guests, String stageCode, boolean cancellable, Long bookId,
                                  String bookTitle, boolean withPet, String petName, String occasion, String note,
                                  Instant createdAt) {}

    public record AdminReservationRow(Long id, Long orderId, String zoneName, String slotKey, Integer guests,
                                      String bookTitle, boolean withPet, String petName, String occasion,
                                      String note, Instant createdAt) {}

    public record ShelfBookDto(Long id, String title, String author, String language, String genre, String blurb,
                               String coverUrl, Integer copies, boolean staffPick, boolean active, long noteCount) {}

    public record UpsertShelfBookRequest(String title, String author, String language, String genre, String blurb,
                                         String coverUrl, Integer copies, Boolean staffPick, Boolean active) {}

    public record BookDayAvailability(Long bookId, String date, int copiesFree) {}

    public record MarginNoteDto(Long id, Long bookId, String bookTitle, String authorName, String text,
                                boolean approved, Instant createdAt) {}

    public record CreateMarginNoteRequest(String text) {}

    public record StoryChapterDto(Long id, String marker, String title, String body, String imageUrl,
                                  Integer sortOrder, boolean active) {}

    public record UpsertStoryChapterRequest(String marker, String title, String body, String imageUrl,
                                            Integer sortOrder, Boolean active) {}

    public record StampDto(Long orderId, String orderNumber, String kind, Instant at) {}

    public record ChaptersMeDto(boolean enabled, int stampsPerChapter, String rewardText, int totalStamps,
                                int chaptersCompleted, int stampsInCurrentChapter, int stampsToNextReward,
                                List<StampDto> recentStamps) {}

    public record ChapterSettingsDto(Integer stampsPerChapter, String rewardText, Boolean enabled) {}
}
