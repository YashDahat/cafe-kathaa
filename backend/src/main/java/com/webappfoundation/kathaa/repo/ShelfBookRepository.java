package com.webappfoundation.kathaa.repo;

import com.webappfoundation.kathaa.model.ShelfBook;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShelfBookRepository extends JpaRepository<ShelfBook, Long> {
    List<ShelfBook> findByActiveTrueOrderByStaffPickDescTitleAsc();
    List<ShelfBook> findAllByOrderByTitleAsc();
}
