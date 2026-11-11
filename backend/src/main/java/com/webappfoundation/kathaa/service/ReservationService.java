package com.webappfoundation.kathaa.service;

import com.webappfoundation.dto.CartLineInput;
import com.webappfoundation.dto.OrderDto;
import com.webappfoundation.dto.PlaceOrderRequest;
import com.webappfoundation.kathaa.catalog.KathaaTypes;
import com.webappfoundation.kathaa.dto.KathaaDtos.*;
import com.webappfoundation.kathaa.model.ReservationDetail;
import com.webappfoundation.kathaa.model.SeatingZone;
import com.webappfoundation.kathaa.model.ShelfBook;
import com.webappfoundation.kathaa.repo.ReservationDetailRepository;
import com.webappfoundation.model.FulfillmentType;
import com.webappfoundation.model.PaymentMode;
import com.webappfoundation.repository.BranchRepository;
import com.webappfoundation.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Table booking = a ₹0 order on the kathaa-table workflow placed through the fenced OrderService (seats held by
 * SeatingInventoryProvider via InventoryService), plus a ReservationDetail row for the cafe extras
 * (book to keep at the table, pet, occasion, note). Cancellation runs through the order spine's stage policy.
 */
@Service
public class ReservationService {

    private final OrderService orderService;
    private final SeatingService seatingService;
    private final ShelfService shelfService;
    private final ReservationDetailRepository details;
    private final BranchRepository branches;

    public ReservationService(OrderService orderService, SeatingService seatingService, ShelfService shelfService,
                              ReservationDetailRepository details, BranchRepository branches) {
        this.orderService = orderService;
        this.seatingService = seatingService;
        this.shelfService = shelfService;
        this.details = details;
        this.branches = branches;
    }

    @Transactional
    public ReservationView create(Integer userId, CreateReservationRequest req) {
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in to book");
        if (req.zoneId() == null) bad("Pick where you'd like to sit");
        if (req.guests() == null || req.guests() < 1) bad("How many of you are coming?");
        if (req.note() != null && req.note().length() > 280) bad("Keep the note under 280 characters");
        if (req.petName() != null && req.petName().length() > 40) bad("Pet name is too long");
        SeatingZone zone = seatingService.require(req.zoneId());
        if (!zone.isActive()) bad("That seating area isn't taking bookings");
        if (Boolean.TRUE.equals(req.withPet()) && !zone.isPetFriendly()) {
            bad(zone.getName() + " isn't pet-friendly — the Garden Verandah welcomes pets");
        }
        String slotKey = (req.date() == null ? "" : req.date()) + "T" + (req.time() == null ? "" : req.time());
        LocalDateTime slot = SlotRules.requireBookable(zone, slotKey);

        ShelfBook book = null;
        if (req.bookId() != null) {
            book = shelfService.require(req.bookId());
            if (!book.isActive()) bad("That book is no longer on the shelf");
            if (shelfService.copiesFree(book, slot.toLocalDate()) <= 0) {
                bad("“" + book.getTitle() + "” is already promised to another table that day — pick another?");
            }
        }

        Long branchId = branches.findBySlug(KathaaTypes.BRANCH_SLUG).map(b -> b.getId()).orElse(null);
        PlaceOrderRequest place = PlaceOrderRequest.builder()
                .items(List.of(CartLineInput.builder().itemType(KathaaTypes.SEATING).itemId(zone.getId())
                        .variantKey(slotKey).quantity(req.guests()).build()))
                .branchId(branchId)
                .fulfillmentType(FulfillmentType.SELF_PICKUP)
                .paymentMode(PaymentMode.PAY_AT_COUNTER)
                .build();
        OrderDto order = orderService.placeOrder(userId, place);

        ReservationDetail d = details.save(ReservationDetail.builder()
                .orderId(order.getId()).userId(userId).zoneId(zone.getId()).zoneName(zone.getName())
                .slotKey(slotKey).slotDate(slot.toLocalDate()).guests(req.guests())
                .bookId(book == null ? null : book.getId()).bookTitle(book == null ? null : book.getTitle())
                .withPet(Boolean.TRUE.equals(req.withPet()))
                .petName(blankToNull(req.petName())).occasion(blankToNull(req.occasion()))
                .note(blankToNull(req.note())).createdAt(Instant.now())
                .build());
        return view(d, order);
    }

    public List<ReservationView> mine(Integer userId) {
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in");
        Map<Long, OrderDto> orders = orderService.myOrders(userId).stream()
                .collect(Collectors.toMap(OrderDto::getId, Function.identity(), (a, b) -> a));
        return details.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(d -> view(d, orders.get(d.getOrderId())))
                .toList();
    }

    public List<AdminReservationRow> adminUpcoming() {
        return details.findAllByOrderByCreatedAtDesc().stream()
                .map(d -> new AdminReservationRow(d.getId(), d.getOrderId(), d.getZoneName(), d.getSlotKey(),
                        d.getGuests(), d.getBookTitle(), d.isWithPet(), d.getPetName(), d.getOccasion(), d.getNote(),
                        d.getCreatedAt()))
                .toList();
    }

    private ReservationView view(ReservationDetail d, OrderDto o) {
        return new ReservationView(d.getOrderId(), o == null ? null : o.getOrderNumber(), d.getZoneId(),
                d.getZoneName(), d.getSlotKey(), d.getGuests(), o == null ? null : o.getCurrentStageCode(),
                o != null && o.isCancellable(), d.getBookId(), d.getBookTitle(), d.isWithPet(), d.getPetName(),
                d.getOccasion(), d.getNote(), d.getCreatedAt());
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static void bad(String msg) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }
}
