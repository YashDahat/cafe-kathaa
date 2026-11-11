package com.webappfoundation.kathaa.catalog;

import com.webappfoundation.catalog.CatalogItemResolver;
import com.webappfoundation.dto.CatalogItemDto;
import com.webappfoundation.kathaa.model.MenuDish;
import com.webappfoundation.kathaa.repo.MenuDishRepository;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/** MENU_DISH → CatalogItemDto so dishes ride the fenced cart / recommendation / order spine. */
@Component
public class MenuDishCatalogResolver implements CatalogItemResolver {

    private final MenuDishRepository repository;

    public MenuDishCatalogResolver(MenuDishRepository repository) {
        this.repository = repository;
    }

    @Override
    public String itemType() {
        return KathaaTypes.MENU_DISH;
    }

    @Override
    public List<CatalogItemDto> resolve(Collection<Long> ids) {
        return repository.findByIdIn(ids).stream().filter(MenuDish::isActive).map(this::toDto).toList();
    }

    private CatalogItemDto toDto(MenuDish d) {
        return CatalogItemDto.builder()
                .itemType(KathaaTypes.MENU_DISH)
                .itemId(d.getId())
                .name(d.getName())
                .description(d.getDescription())
                .price(d.getPrice())
                .imageUrl(d.getImageUrl())
                .slug(d.getSlug())
                .detailPath("/menu#" + d.getSlug())
                .category(d.getCategory())
                .active(d.isActive())
                .cartable(true)
                .workflowCode(d.getWorkflowCode() == null ? KathaaTypes.WF_TAKEAWAY : d.getWorkflowCode())
                .attributes(Map.of("diet", d.getDiet().name(), "signature", d.isSignature()))
                .build();
    }
}
