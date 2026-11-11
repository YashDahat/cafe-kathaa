package com.webappfoundation.kathaa.repo;

import com.webappfoundation.kathaa.model.MarginNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarginNoteRepository extends JpaRepository<MarginNote, Long> {
    List<MarginNote> findByBookIdAndApprovedTrueOrderByCreatedAtDesc(Long bookId);
    List<MarginNote> findByApprovedTrueOrderByCreatedAtDesc();
    List<MarginNote> findAllByOrderByCreatedAtDesc();
    long countByUserIdAndBookId(Integer userId, Long bookId);
}
