package com.webappfoundation.kathaa.repo;

import com.webappfoundation.kathaa.model.SeatingZone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface SeatingZoneRepository extends JpaRepository<SeatingZone, Long> {
    List<SeatingZone> findByActiveTrueOrderBySortOrderAsc();
    List<SeatingZone> findAllByOrderBySortOrderAsc();
    List<SeatingZone> findByIdIn(Collection<Long> ids);
    boolean existsBySlug(String slug);
}
