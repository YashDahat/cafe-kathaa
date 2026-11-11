package com.webappfoundation.kathaa.service;

import com.webappfoundation.dto.BulkUploadResult;
import com.webappfoundation.exception.ResourceNotFoundException;
import com.webappfoundation.kathaa.dto.KathaaDtos.StoryChapterDto;
import com.webappfoundation.kathaa.dto.KathaaDtos.UpsertStoryChapterRequest;
import com.webappfoundation.kathaa.model.StoryChapter;
import com.webappfoundation.kathaa.repo.StoryChapterRepository;
import com.webappfoundation.service.AuditService;
import com.webappfoundation.service.SpreadsheetParser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
public class StoryService {

    private final StoryChapterRepository repository;
    private final SpreadsheetParser parser;
    private final AuditService audit;

    public StoryService(StoryChapterRepository repository, SpreadsheetParser parser, AuditService audit) {
        this.repository = repository;
        this.parser = parser;
        this.audit = audit;
    }

    public List<StoryChapterDto> listActive() {
        return repository.findByActiveTrueOrderBySortOrderAsc().stream().map(StoryService::toDto).toList();
    }

    public List<StoryChapterDto> listAll() {
        return repository.findAllByOrderBySortOrderAsc().stream().map(StoryService::toDto).toList();
    }

    @Transactional
    public StoryChapterDto create(UpsertStoryChapterRequest r) {
        validate(r);
        StoryChapter c = new StoryChapter();
        c.setCreatedAt(Instant.now());
        apply(c, r);
        c = repository.save(c);
        audit.record("STORY_CHAPTER_CREATED", "SUCCESS", "STORY_CHAPTER", String.valueOf(c.getId()), c.getTitle());
        return toDto(c);
    }

    @Transactional
    public StoryChapterDto update(Long id, UpsertStoryChapterRequest r) {
        validate(r);
        StoryChapter c = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Chapter not found"));
        apply(c, r);
        c = repository.save(c);
        audit.record("STORY_CHAPTER_UPDATED", "SUCCESS", "STORY_CHAPTER", String.valueOf(id), c.getTitle());
        return toDto(c);
    }

    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
        audit.record("STORY_CHAPTER_DELETED", "SUCCESS", "STORY_CHAPTER", String.valueOf(id), null);
    }

    @Transactional
    public BulkUploadResult bulkImport(MultipartFile file) {
        BulkUploadResult result = BulkUploadResult.builder().build();
        int rowNo = 1;
        for (Map<String, String> row : parser.parse(file)) {
            rowNo++;
            try {
                UpsertStoryChapterRequest r = new UpsertStoryChapterRequest(BulkRows.str(row, "marker"),
                        BulkRows.str(row, "title"), BulkRows.str(row, "body"), BulkRows.str(row, "imageurl"),
                        BulkRows.intVal(row, "sortorder", 100), true);
                validate(r);
                StoryChapter c = new StoryChapter();
                c.setCreatedAt(Instant.now());
                apply(c, r);
                repository.save(c);
                result.setCreated(result.getCreated() + 1);
            } catch (ResponseStatusException e) {
                result.addError(rowNo, e.getReason());
            } catch (RuntimeException e) {
                result.addError(rowNo, "Could not read row: " + e.getClass().getSimpleName());
            }
        }
        audit.record("STORY_CHAPTER_BULK_IMPORT", "SUCCESS", "STORY_CHAPTER", null, "created=" + result.getCreated());
        return result;
    }

    private void validate(UpsertStoryChapterRequest r) {
        if (r.marker() == null || r.marker().isBlank() || r.marker().length() > 24) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Marker is required (max 24 characters)");
        }
        if (r.title() == null || r.title().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required");
        }
    }

    private void apply(StoryChapter c, UpsertStoryChapterRequest r) {
        c.setMarker(r.marker().trim());
        c.setTitle(r.title().trim());
        c.setBody(r.body());
        c.setImageUrl(r.imageUrl() == null || r.imageUrl().isBlank() ? null : r.imageUrl());
        c.setSortOrder(r.sortOrder() == null ? 100 : r.sortOrder());
        c.setActive(r.active() == null || r.active());
        c.setUpdatedAt(Instant.now());
    }

    static StoryChapterDto toDto(StoryChapter c) {
        return new StoryChapterDto(c.getId(), c.getMarker(), c.getTitle(), c.getBody(), c.getImageUrl(),
                c.getSortOrder(), c.isActive());
    }
}
