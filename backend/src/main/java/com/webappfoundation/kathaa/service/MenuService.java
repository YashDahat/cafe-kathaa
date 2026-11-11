package com.webappfoundation.kathaa.service;

import com.webappfoundation.dto.BulkUploadResult;
import com.webappfoundation.exception.ResourceNotFoundException;
import com.webappfoundation.kathaa.dto.KathaaDtos.MenuDishDto;
import com.webappfoundation.kathaa.dto.KathaaDtos.UpsertMenuDishRequest;
import com.webappfoundation.kathaa.model.Diet;
import com.webappfoundation.kathaa.model.MenuDish;
import com.webappfoundation.kathaa.repo.MenuDishRepository;
import com.webappfoundation.service.AuditService;
import com.webappfoundation.service.SpreadsheetParser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
public class MenuService {

    private final MenuDishRepository repository;
    private final SpreadsheetParser parser;
    private final AuditService audit;

    public MenuService(MenuDishRepository repository, SpreadsheetParser parser, AuditService audit) {
        this.repository = repository;
        this.parser = parser;
        this.audit = audit;
    }

    public List<MenuDishDto> listActive() {
        return repository.findByActiveTrueOrderBySortOrderAscNameAsc().stream().map(MenuService::toDto).toList();
    }

    public List<MenuDishDto> listAll() {
        return repository.findAllByOrderBySortOrderAscNameAsc().stream().map(MenuService::toDto).toList();
    }

    public List<MenuDishDto> byIds(List<Long> ids) {
        return repository.findByIdIn(ids).stream().filter(MenuDish::isActive).map(MenuService::toDto).toList();
    }

    @Transactional
    public MenuDishDto create(UpsertMenuDishRequest req) {
        validate(req);
        MenuDish d = new MenuDish();
        d.setCreatedAt(Instant.now());
        apply(d, req);
        d = repository.save(d);
        audit.record("MENU_DISH_CREATED", "SUCCESS", "MENU_DISH", String.valueOf(d.getId()), d.getName());
        return toDto(d);
    }

    @Transactional
    public MenuDishDto update(Long id, UpsertMenuDishRequest req) {
        validate(req);
        MenuDish d = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Dish not found"));
        apply(d, req);
        d = repository.save(d);
        audit.record("MENU_DISH_UPDATED", "SUCCESS", "MENU_DISH", String.valueOf(id), d.getName());
        return toDto(d);
    }

    @Transactional
    public void delete(Long id) {
        MenuDish d = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Dish not found"));
        // Soft-delete keeps past orders' item references meaningful.
        d.setActive(false);
        d.setUpdatedAt(Instant.now());
        repository.save(d);
        audit.record("MENU_DISH_DELETED", "SUCCESS", "MENU_DISH", String.valueOf(id), d.getName());
    }

    @Transactional
    public BulkUploadResult bulkImport(MultipartFile file) {
        BulkUploadResult result = BulkUploadResult.builder().build();
        List<Map<String, String>> rows = parser.parse(file);
        int rowNo = 1;
        for (Map<String, String> row : rows) {
            rowNo++;
            try {
                String name = BulkRows.str(row, "name");
                BigDecimal price = BulkRows.dec(row, "price");
                String category = BulkRows.str(row, "category");
                if (name == null || price == null || category == null) {
                    result.addError(rowNo, "name, price and category are required");
                    continue;
                }
                String slug = BulkRows.slugify(name);
                if (repository.existsBySlug(slug)) {
                    result.setSkipped(result.getSkipped() + 1);
                    continue;
                }
                String diet = BulkRows.str(row, "diet");
                UpsertMenuDishRequest req = new UpsertMenuDishRequest(name, slug, BulkRows.str(row, "description"),
                        BulkRows.str(row, "pagenote"), category, price,
                        diet == null ? Diet.VEG : Diet.valueOf(diet.toUpperCase().replace('-', '_')),
                        BulkRows.bool(row, "signature", false), BulkRows.str(row, "imageurl"), true,
                        BulkRows.intVal(row, "sortorder", 100));
                validate(req);
                MenuDish d = new MenuDish();
                d.setCreatedAt(Instant.now());
                apply(d, req);
                repository.save(d);
                result.setCreated(result.getCreated() + 1);
            } catch (ResponseStatusException e) {
                result.addError(rowNo, e.getReason());
            } catch (RuntimeException e) {
                result.addError(rowNo, "Could not read row: " + e.getClass().getSimpleName());
            }
        }
        audit.record("MENU_DISH_BULK_IMPORT", "SUCCESS", "MENU_DISH", null,
                "created=" + result.getCreated() + " failed=" + result.getFailed());
        return result;
    }

    private void validate(UpsertMenuDishRequest r) {
        if (r.name() == null || r.name().isBlank()) bad("Dish name is required");
        if (r.category() == null || r.category().isBlank()) bad("Category is required");
        if (r.price() == null || r.price().signum() < 0) bad("Price must be zero or more");
        if (r.price() != null && r.price().compareTo(new BigDecimal("100000")) > 0) bad("Price looks too high");
    }

    private static void bad(String msg) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }

    private void apply(MenuDish d, UpsertMenuDishRequest r) {
        d.setName(r.name().trim());
        String slug = r.slug() == null || r.slug().isBlank() ? BulkRows.slugify(r.name()) : BulkRows.slugify(r.slug());
        if (!slug.equals(d.getSlug()) && repository.existsBySlug(slug)) {
            slug = slug + "-" + (System.currentTimeMillis() % 10000);
        }
        d.setSlug(slug);
        d.setDescription(r.description());
        d.setPageNote(r.pageNote());
        d.setCategory(r.category().trim());
        d.setPrice(r.price());
        d.setDiet(r.diet() == null ? Diet.VEG : r.diet());
        d.setSignature(Boolean.TRUE.equals(r.signature()));
        d.setImageUrl(r.imageUrl() == null || r.imageUrl().isBlank() ? null : r.imageUrl());
        d.setActive(r.active() == null || r.active());
        d.setSortOrder(r.sortOrder() == null ? 100 : r.sortOrder());
        if (d.getWorkflowCode() == null) d.setWorkflowCode("kathaa-takeaway");
        d.setUpdatedAt(Instant.now());
    }

    static MenuDishDto toDto(MenuDish d) {
        return new MenuDishDto(d.getId(), d.getName(), d.getSlug(), d.getDescription(), d.getPageNote(),
                d.getCategory(), d.getPrice(), d.getDiet(), d.isSignature(), d.getImageUrl(), d.isActive(),
                d.getSortOrder(), d.getWorkflowCode());
    }
}
