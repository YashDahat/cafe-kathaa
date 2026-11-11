package com.webappfoundation.kathaa.web;

import com.webappfoundation.kathaa.dto.KathaaDtos.*;
import com.webappfoundation.kathaa.service.*;
import com.webappfoundation.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Public reads + signed-in guest actions for Cafe Kathaa. Identity always comes from @CurrentUser. */
@RestController
@RequestMapping("/api/v1/kathaa")
public class KathaaController {

    private final MenuService menuService;
    private final SeatingService seatingService;
    private final ReservationService reservationService;
    private final ShelfService shelfService;
    private final StoryService storyService;
    private final ChapterService chapterService;
    private final FavouriteService favouriteService;

    public KathaaController(MenuService menuService, SeatingService seatingService,
                            ReservationService reservationService, ShelfService shelfService,
                            StoryService storyService, ChapterService chapterService,
                            FavouriteService favouriteService) {
        this.menuService = menuService;
        this.seatingService = seatingService;
        this.reservationService = reservationService;
        this.shelfService = shelfService;
        this.storyService = storyService;
        this.chapterService = chapterService;
        this.favouriteService = favouriteService;
    }

    // ── Public ──

    @GetMapping("/menu")
    public List<MenuDishDto> menu() {
        return menuService.listActive();
    }

    @GetMapping("/seating")
    public List<SeatingZoneDto> seating() {
        return seatingService.listActive();
    }

    @GetMapping("/seating/availability")
    public List<ZoneAvailabilityDto> availability(@RequestParam(required = false) String date) {
        return seatingService.availability(date);
    }

    @GetMapping("/shelf")
    public List<ShelfBookDto> shelf() {
        return shelfService.listActive();
    }

    @GetMapping("/shelf/{id}/availability")
    public BookDayAvailability bookAvailability(@PathVariable Long id, @RequestParam(required = false) String date) {
        return shelfService.dayAvailability(id, date);
    }

    @GetMapping("/shelf/{id}/notes")
    public List<MarginNoteDto> notes(@PathVariable Long id) {
        return shelfService.approvedNotes(id);
    }

    @GetMapping("/story")
    public List<StoryChapterDto> story() {
        return storyService.listActive();
    }

    // ── Signed-in guest ──

    @PostMapping("/shelf/{id}/notes")
    @ResponseStatus(HttpStatus.CREATED)
    public MarginNoteDto addNote(@CurrentUser Integer userId, @PathVariable Long id,
                                 @RequestBody CreateMarginNoteRequest req) {
        return shelfService.addNote(userId, id, req);
    }

    @PostMapping("/reservations")
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationView book(@CurrentUser Integer userId, @RequestBody CreateReservationRequest req) {
        return reservationService.create(userId, req);
    }

    @GetMapping("/reservations/mine")
    public List<ReservationView> myReservations(@CurrentUser Integer userId) {
        return reservationService.mine(userId);
    }

    @GetMapping("/chapters/me")
    public ChaptersMeDto chapters(@CurrentUser Integer userId) {
        return chapterService.me(userId);
    }

    @GetMapping("/favourites")
    public List<MenuDishDto> favourites(@CurrentUser Integer userId) {
        return favouriteService.mine(userId);
    }

    @PostMapping("/favourites/{dishId}/toggle")
    public Map<String, Boolean> toggleFavourite(@CurrentUser Integer userId, @PathVariable Long dishId) {
        return Map.of("favourite", favouriteService.toggle(userId, dishId));
    }
}
