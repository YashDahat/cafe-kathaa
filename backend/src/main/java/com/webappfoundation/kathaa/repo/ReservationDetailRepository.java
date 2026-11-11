package com.webappfoundation.kathaa.repo;

import com.webappfoundation.kathaa.model.ReservationDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ReservationDetailRepository extends JpaRepository<ReservationDetail, Long> {
    List<ReservationDetail> findByUserIdOrderByCreatedAtDesc(Integer userId);
    List<ReservationDetail> findByBookIdAndSlotDate(Long bookId, LocalDate slotDate);
    List<ReservationDetail> findAllByOrderByCreatedAtDesc();
}
