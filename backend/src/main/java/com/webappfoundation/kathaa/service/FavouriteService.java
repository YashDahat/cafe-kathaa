package com.webappfoundation.kathaa.service;

import com.webappfoundation.kathaa.dto.KathaaDtos.MenuDishDto;
import com.webappfoundation.kathaa.model.FavouriteDish;
import com.webappfoundation.kathaa.repo.FavouriteDishRepository;
import com.webappfoundation.kathaa.repo.MenuDishRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
public class FavouriteService {

    private final FavouriteDishRepository favourites;
    private final MenuDishRepository dishes;
    private final MenuService menuService;

    public FavouriteService(FavouriteDishRepository favourites, MenuDishRepository dishes, MenuService menuService) {
        this.favourites = favourites;
        this.dishes = dishes;
        this.menuService = menuService;
    }

    public List<MenuDishDto> mine(Integer userId) {
        requireUser(userId);
        List<Long> ids = favourites.findByUserIdOrderByCreatedAtDesc(userId).stream().map(FavouriteDish::getDishId).toList();
        return ids.isEmpty() ? List.of() : menuService.byIds(ids);
    }

    /** Toggle; returns true when the dish is now a favourite. */
    @Transactional
    public boolean toggle(Integer userId, Long dishId) {
        requireUser(userId);
        if (!dishes.existsById(dishId)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Dish not found");
        return favourites.findByUserIdAndDishId(userId, dishId).map(f -> {
            favourites.delete(f);
            return false;
        }).orElseGet(() -> {
            favourites.save(FavouriteDish.builder().userId(userId).dishId(dishId).createdAt(Instant.now()).build());
            return true;
        });
    }

    private static void requireUser(Integer userId) {
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in");
    }
}
