package com.webappfoundation.kathaa.repo;

import com.webappfoundation.kathaa.model.MenuDish;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MenuDishRepository extends JpaRepository<MenuDish, Long> {
    List<MenuDish> findByActiveTrueOrderBySortOrderAscNameAsc();
    List<MenuDish> findAllByOrderBySortOrderAscNameAsc();
    List<MenuDish> findByIdIn(Collection<Long> ids);
    Optional<MenuDish> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
