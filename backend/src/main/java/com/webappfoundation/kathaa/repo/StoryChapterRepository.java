package com.webappfoundation.kathaa.repo;

import com.webappfoundation.kathaa.model.StoryChapter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StoryChapterRepository extends JpaRepository<StoryChapter, Long> {
    List<StoryChapter> findByActiveTrueOrderBySortOrderAsc();
    List<StoryChapter> findAllByOrderBySortOrderAsc();
}
