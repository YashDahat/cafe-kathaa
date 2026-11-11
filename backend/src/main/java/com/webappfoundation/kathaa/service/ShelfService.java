package com.webappfoundation.kathaa.service;

import com.webappfoundation.dto.BulkUploadResult;
import com.webappfoundation.exception.ResourceNotFoundException;
import com.webappfoundation.kathaa.dto.KathaaDtos.*;
import com.webappfoundation.kathaa.model.MarginNote;
import com.webappfoundation.kathaa.model.ReservationDetail;
import com.webappfoundation.kathaa.model.ShelfBook;
import com.webappfoundation.kathaa.repo.MarginNoteRepository;
import com.webappfoundation.kathaa.repo.ReservationDetailRepository;
import com.webappfoundation.kathaa.repo.ShelfBookRepository;
import com.webappfoundation.repository.OrderRepository;
import com.webappfoundation.repository.UserRepository;
import com.webappfoundation.service.AuditService;
import com.webappfoundation.service.SpreadsheetParser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** The Shelf: the cafe's reading library, day-level holds for table bookings, and moderated margin notes. */
@Service
public class ShelfService {

    private final ShelfBookRepository books;
    private final MarginNoteRepository notes;
    private final ReservationDetailRepository reservations;
    private final OrderRepository orders;
    private final UserRepository users;
    private final SpreadsheetParser parser;
    private final AuditService audit;

    public ShelfService(ShelfBookRepository books, MarginNoteRepository notes, ReservationDetailRepository reservations,
                        OrderRepository orders, UserRepository users, SpreadsheetParser parser, AuditService audit) {
        this.books = books;
        this.notes = notes;
        this.reservations = reservations;
        this.orders = orders;
        this.users = users;
        this.parser = parser;
        this.audit = audit;
    }

    public ShelfBook require(Long id) {
        return books.findById(id).orElseThrow(() -> new ResourceNotFoundException("Book not found"));
    }

    public List<ShelfBookDto> listActive() {
        Map<Long, Long> counts = notes.findByApprovedTrueOrderByCreatedAtDesc().stream()
                .collect(Collectors.groupingBy(MarginNote::getBookId, Collectors.counting()));
        return books.findByActiveTrueOrderByStaffPickDescTitleAsc().stream()
                .map(b -> toDto(b, counts.getOrDefault(b.getId(), 0L))).toList();
    }

    public List<ShelfBookDto> listAll() {
        return books.findAllByOrderByTitleAsc().stream().map(b -> toDto(b, 0)).toList();
    }

    /** Copies not yet promised to a (non-cancelled) table booking on that date. */
    public int copiesFree(ShelfBook book, LocalDate date) {
        List<ReservationDetail> held = reservations.findByBookIdAndSlotDate(book.getId(), date);
        long live = held.stream()
                .filter(r -> orders.findById(r.getOrderId())
                        .map(o -> !"CANCELLED".equals(o.getCurrentStageCode())).orElse(false))
                .count();
        int copies = book.getCopies() == null ? 1 : book.getCopies();
        return (int) Math.max(0, copies - live);
    }

    public BookDayAvailability dayAvailability(Long bookId, String date) {
        LocalDate d = SeatingService.parseDate(date);
        return new BookDayAvailability(bookId, d.toString(), copiesFree(require(bookId), d));
    }

    // ── Margin notes ──

    public List<MarginNoteDto> approvedNotes(Long bookId) {
        ShelfBook b = require(bookId);
        return notes.findByBookIdAndApprovedTrueOrderByCreatedAtDesc(bookId).stream()
                .map(n -> noteDto(n, b.getTitle())).toList();
    }

    @Transactional
    public MarginNoteDto addNote(Integer userId, Long bookId, CreateMarginNoteRequest req) {
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Log in to leave a margin note");
        ShelfBook b = require(bookId);
        String text = req == null || req.text() == null ? "" : req.text().trim();
        if (text.length() < 3 || text.length() > 160) bad("A margin note is 3–160 characters");
        if (notes.countByUserIdAndBookId(userId, bookId) >= 3) bad("You've pencilled three notes on this book already");
        String first = users.findById(userId).map(u -> u.getFirstName()).orElse("A reader");
        MarginNote n = notes.save(MarginNote.builder().bookId(bookId).userId(userId).authorName(first)
                .text(text).approved(false).createdAt(Instant.now()).build());
        return noteDto(n, b.getTitle());
    }

    public List<MarginNoteDto> adminNotes() {
        Map<Long, String> titles = books.findAll().stream()
                .collect(Collectors.toMap(ShelfBook::getId, ShelfBook::getTitle, (a, b) -> a));
        return notes.findAllByOrderByCreatedAtDesc().stream()
                .map(n -> noteDto(n, titles.get(n.getBookId()))).toList();
    }

    @Transactional
    public MarginNoteDto setApproved(Long noteId, boolean approved) {
        MarginNote n = notes.findById(noteId).orElseThrow(() -> new ResourceNotFoundException("Note not found"));
        n.setApproved(approved);
        n = notes.save(n);
        audit.record(approved ? "MARGIN_NOTE_APPROVED" : "MARGIN_NOTE_HIDDEN", "SUCCESS", "MARGIN_NOTE",
                String.valueOf(noteId), null);
        return noteDto(n, books.findById(n.getBookId()).map(ShelfBook::getTitle).orElse(null));
    }

    @Transactional
    public void deleteNote(Long noteId) {
        notes.deleteById(noteId);
        audit.record("MARGIN_NOTE_DELETED", "SUCCESS", "MARGIN_NOTE", String.valueOf(noteId), null);
    }

    // ── Admin CRUD ──

    @Transactional
    public ShelfBookDto create(UpsertShelfBookRequest r) {
        validate(r);
        ShelfBook b = new ShelfBook();
        b.setCreatedAt(Instant.now());
        apply(b, r);
        b = books.save(b);
        audit.record("SHELF_BOOK_CREATED", "SUCCESS", "SHELF_BOOK", String.valueOf(b.getId()), b.getTitle());
        return toDto(b, 0);
    }

    @Transactional
    public ShelfBookDto update(Long id, UpsertShelfBookRequest r) {
        validate(r);
        ShelfBook b = require(id);
        apply(b, r);
        b = books.save(b);
        audit.record("SHELF_BOOK_UPDATED", "SUCCESS", "SHELF_BOOK", String.valueOf(id), b.getTitle());
        return toDto(b, 0);
    }

    @Transactional
    public void delete(Long id) {
        ShelfBook b = require(id);
        b.setActive(false);
        b.setUpdatedAt(Instant.now());
        books.save(b);
        audit.record("SHELF_BOOK_DELETED", "SUCCESS", "SHELF_BOOK", String.valueOf(id), b.getTitle());
    }

    @Transactional
    public BulkUploadResult bulkImport(MultipartFile file) {
        BulkUploadResult result = BulkUploadResult.builder().build();
        Map<String, ShelfBook> existing = books.findAll().stream()
                .collect(Collectors.toMap(b -> (b.getTitle() + "|" + b.getAuthor()).toLowerCase(), Function.identity(), (a, b) -> a));
        int rowNo = 1;
        for (Map<String, String> row : parser.parse(file)) {
            rowNo++;
            try {
                String title = BulkRows.str(row, "title");
                String author = BulkRows.str(row, "author");
                if (title == null || author == null) {
                    result.addError(rowNo, "title and author are required");
                    continue;
                }
                if (existing.containsKey((title + "|" + author).toLowerCase())) {
                    result.setSkipped(result.getSkipped() + 1);
                    continue;
                }
                UpsertShelfBookRequest r = new UpsertShelfBookRequest(title, author,
                        BulkRows.str(row, "language") == null ? "English" : BulkRows.str(row, "language"),
                        BulkRows.str(row, "genre"), BulkRows.str(row, "blurb"), BulkRows.str(row, "coverurl"),
                        BulkRows.intVal(row, "copies", 1), BulkRows.bool(row, "staffpick", false), true);
                validate(r);
                ShelfBook b = new ShelfBook();
                b.setCreatedAt(Instant.now());
                apply(b, r);
                existing.put((title + "|" + author).toLowerCase(), books.save(b));
                result.setCreated(result.getCreated() + 1);
            } catch (ResponseStatusException e) {
                result.addError(rowNo, e.getReason());
            } catch (RuntimeException e) {
                result.addError(rowNo, "Could not read row: " + e.getClass().getSimpleName());
            }
        }
        audit.record("SHELF_BOOK_BULK_IMPORT", "SUCCESS", "SHELF_BOOK", null, "created=" + result.getCreated());
        return result;
    }

    private void validate(UpsertShelfBookRequest r) {
        if (r.title() == null || r.title().isBlank()) bad("Title is required");
        if (r.author() == null || r.author().isBlank()) bad("Author is required");
        if (r.copies() != null && (r.copies() < 0 || r.copies() > 50)) bad("Copies must be 0–50");
    }

    private void apply(ShelfBook b, UpsertShelfBookRequest r) {
        b.setTitle(r.title().trim());
        b.setAuthor(r.author().trim());
        b.setLanguage(r.language() == null || r.language().isBlank() ? "English" : r.language().trim());
        b.setGenre(r.genre());
        b.setBlurb(r.blurb());
        b.setCoverUrl(r.coverUrl() == null || r.coverUrl().isBlank() ? null : r.coverUrl());
        b.setCopies(r.copies() == null ? 1 : r.copies());
        b.setStaffPick(Boolean.TRUE.equals(r.staffPick()));
        b.setActive(r.active() == null || r.active());
        b.setUpdatedAt(Instant.now());
    }

    private static ShelfBookDto toDto(ShelfBook b, long noteCount) {
        return new ShelfBookDto(b.getId(), b.getTitle(), b.getAuthor(), b.getLanguage(), b.getGenre(), b.getBlurb(),
                b.getCoverUrl(), b.getCopies(), b.isStaffPick(), b.isActive(), noteCount);
    }

    private static MarginNoteDto noteDto(MarginNote n, String title) {
        return new MarginNoteDto(n.getId(), n.getBookId(), title, n.getAuthorName(), n.getText(), n.isApproved(),
                n.getCreatedAt());
    }

    private static void bad(String msg) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }
}
