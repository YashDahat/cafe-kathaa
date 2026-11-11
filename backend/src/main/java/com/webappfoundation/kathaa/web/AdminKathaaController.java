package com.webappfoundation.kathaa.web;

import com.webappfoundation.dto.BulkUploadResult;
import com.webappfoundation.kathaa.dto.KathaaDtos.*;
import com.webappfoundation.kathaa.service.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/** Admin CMS for the cafe (ADMIN-gated by SecurityConfig's /api/v1/admin/** rule). All writes are audited. */
@RestController
@RequestMapping("/api/v1/admin/kathaa")
public class AdminKathaaController {

    private final MenuService menuService;
    private final SeatingService seatingService;
    private final ShelfService shelfService;
    private final StoryService storyService;
    private final ChapterService chapterService;
    private final ReservationService reservationService;

    public AdminKathaaController(MenuService menuService, SeatingService seatingService, ShelfService shelfService,
                                 StoryService storyService, ChapterService chapterService,
                                 ReservationService reservationService) {
        this.menuService = menuService;
        this.seatingService = seatingService;
        this.shelfService = shelfService;
        this.storyService = storyService;
        this.chapterService = chapterService;
        this.reservationService = reservationService;
    }

    // Menu
    @GetMapping("/menu") public List<MenuDishDto> menu() { return menuService.listAll(); }
    @PostMapping("/menu") @ResponseStatus(HttpStatus.CREATED)
    public MenuDishDto createDish(@RequestBody UpsertMenuDishRequest r) { return menuService.create(r); }
    @PutMapping("/menu/{id}") public MenuDishDto updateDish(@PathVariable Long id, @RequestBody UpsertMenuDishRequest r) { return menuService.update(id, r); }
    @DeleteMapping("/menu/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteDish(@PathVariable Long id) { menuService.delete(id); }
    @PostMapping("/menu/bulk-upload") public BulkUploadResult bulkMenu(@RequestParam("file") MultipartFile file) { return menuService.bulkImport(file); }

    // Seating
    @GetMapping("/seating") public List<SeatingZoneDto> seating() { return seatingService.listAll(); }
    @PostMapping("/seating") @ResponseStatus(HttpStatus.CREATED)
    public SeatingZoneDto createZone(@RequestBody UpsertSeatingZoneRequest r) { return seatingService.create(r); }
    @PutMapping("/seating/{id}") public SeatingZoneDto updateZone(@PathVariable Long id, @RequestBody UpsertSeatingZoneRequest r) { return seatingService.update(id, r); }
    @DeleteMapping("/seating/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteZone(@PathVariable Long id) { seatingService.delete(id); }
    @PostMapping("/seating/bulk-upload") public BulkUploadResult bulkSeating(@RequestParam("file") MultipartFile file) { return seatingService.bulkImport(file); }

    // Shelf
    @GetMapping("/shelf") public List<ShelfBookDto> shelf() { return shelfService.listAll(); }
    @PostMapping("/shelf") @ResponseStatus(HttpStatus.CREATED)
    public ShelfBookDto createBook(@RequestBody UpsertShelfBookRequest r) { return shelfService.create(r); }
    @PutMapping("/shelf/{id}") public ShelfBookDto updateBook(@PathVariable Long id, @RequestBody UpsertShelfBookRequest r) { return shelfService.update(id, r); }
    @DeleteMapping("/shelf/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteBook(@PathVariable Long id) { shelfService.delete(id); }
    @PostMapping("/shelf/bulk-upload") public BulkUploadResult bulkShelf(@RequestParam("file") MultipartFile file) { return shelfService.bulkImport(file); }

    // Margin notes (user content — moderation only)
    @GetMapping("/notes") public List<MarginNoteDto> notes() { return shelfService.adminNotes(); }
    @PostMapping("/notes/{id}/approve") public MarginNoteDto approve(@PathVariable Long id) { return shelfService.setApproved(id, true); }
    @PostMapping("/notes/{id}/hide") public MarginNoteDto hide(@PathVariable Long id) { return shelfService.setApproved(id, false); }
    @DeleteMapping("/notes/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteNote(@PathVariable Long id) { shelfService.deleteNote(id); }

    // Story
    @GetMapping("/story") public List<StoryChapterDto> story() { return storyService.listAll(); }
    @PostMapping("/story") @ResponseStatus(HttpStatus.CREATED)
    public StoryChapterDto createChapter(@RequestBody UpsertStoryChapterRequest r) { return storyService.create(r); }
    @PutMapping("/story/{id}") public StoryChapterDto updateChapter(@PathVariable Long id, @RequestBody UpsertStoryChapterRequest r) { return storyService.update(id, r); }
    @DeleteMapping("/story/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteChapter(@PathVariable Long id) { storyService.delete(id); }
    @PostMapping("/story/bulk-upload") public BulkUploadResult bulkStory(@RequestParam("file") MultipartFile file) { return storyService.bulkImport(file); }

    // Chapters stamp card
    @GetMapping("/chapters/settings") public ChapterSettingsDto chapterSettings() { return chapterService.dto(); }
    @PutMapping("/chapters/settings") public ChapterSettingsDto updateChapterSettings(@RequestBody ChapterSettingsDto r) { return chapterService.update(r); }

    // Booking extras (read-only; lifecycle lives on the order board)
    @GetMapping("/reservations") public List<AdminReservationRow> reservations() { return reservationService.adminUpcoming(); }
}
