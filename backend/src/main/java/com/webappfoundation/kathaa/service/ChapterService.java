package com.webappfoundation.kathaa.service;

import com.webappfoundation.dto.OrderDto;
import com.webappfoundation.kathaa.catalog.KathaaTypes;
import com.webappfoundation.kathaa.dto.KathaaDtos.*;
import com.webappfoundation.kathaa.model.ChapterSettings;
import com.webappfoundation.kathaa.repo.ChapterSettingsRepository;
import com.webappfoundation.service.AuditService;
import com.webappfoundation.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

/**
 * "Chapters" — a hanko stamp card read straight off the order spine: every FINISHED table visit and every
 * COLLECTED takeaway is a stamp; N stamps fill a chapter. Nothing to game: stamps exist only for orders staff
 * moved to a completed stage on the board.
 */
@Service
public class ChapterService {

    private final OrderService orderService;
    private final ChapterSettingsRepository settingsRepository;
    private final AuditService audit;

    public ChapterService(OrderService orderService, ChapterSettingsRepository settingsRepository, AuditService audit) {
        this.orderService = orderService;
        this.settingsRepository = settingsRepository;
        this.audit = audit;
    }

    public ChapterSettings settings() {
        return settingsRepository.findById(1L).orElseGet(() -> ChapterSettings.builder().id(1L).build());
    }

    public ChaptersMeDto me(Integer userId) {
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in");
        ChapterSettings s = settings();
        List<StampDto> stamps = orderService.myOrders(userId).stream()
                .filter(ChapterService::earnsStamp)
                .sorted(Comparator.comparing((OrderDto o) -> o.getUpdatedAt() == null ? o.getCreatedAt() : o.getUpdatedAt()))
                .map(o -> new StampDto(o.getId(), o.getOrderNumber(),
                        KathaaTypes.WF_TABLE.equals(o.getWorkflowCode()) ? "VISIT" : "TAKEAWAY",
                        o.getUpdatedAt() == null ? o.getCreatedAt() : o.getUpdatedAt()))
                .toList();
        int per = Math.max(1, s.getStampsPerChapter());
        int total = stamps.size();
        int inCurrent = total % per;
        List<StampDto> recent = stamps.subList(Math.max(0, total - inCurrent), total);
        return new ChaptersMeDto(s.isEnabled(), per, s.getRewardText(), total, total / per, inCurrent,
                per - inCurrent, recent);
    }

    private static boolean earnsStamp(OrderDto o) {
        return (KathaaTypes.WF_TABLE.equals(o.getWorkflowCode()) && KathaaTypes.STAGE_FINISHED.equals(o.getCurrentStageCode()))
                || (KathaaTypes.WF_TAKEAWAY.equals(o.getWorkflowCode()) && KathaaTypes.STAGE_COLLECTED.equals(o.getCurrentStageCode()));
    }

    @Transactional
    public ChapterSettingsDto update(ChapterSettingsDto req) {
        if (req.stampsPerChapter() == null || req.stampsPerChapter() < 2 || req.stampsPerChapter() > 30) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stamps per chapter must be 2–30");
        }
        if (req.rewardText() == null || req.rewardText().isBlank() || req.rewardText().length() > 120) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reward text is required (max 120 characters)");
        }
        ChapterSettings s = settings();
        s.setStampsPerChapter(req.stampsPerChapter());
        s.setRewardText(req.rewardText().trim());
        s.setEnabled(req.enabled() == null || req.enabled());
        settingsRepository.save(s);
        audit.record("CHAPTER_SETTINGS_UPDATED", "SUCCESS", "CHAPTER_SETTINGS", "1",
                "stamps=" + s.getStampsPerChapter() + " enabled=" + s.isEnabled());
        return dto();
    }

    public ChapterSettingsDto dto() {
        ChapterSettings s = settings();
        return new ChapterSettingsDto(s.getStampsPerChapter(), s.getRewardText(), s.isEnabled());
    }
}
