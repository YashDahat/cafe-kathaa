package com.webappfoundation.kathaa.catalog;

import com.webappfoundation.catalog.CatalogItemResolver;
import com.webappfoundation.dto.CatalogItemDto;
import com.webappfoundation.kathaa.model.SeatingZone;
import com.webappfoundation.kathaa.repo.SeatingZoneRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * SEATING → CatalogItemDto. A booking is free (₹0) so it settles through the order spine's ₹0 path straight to
 * CONFIRMED. Not cartable — bookings are placed from the booking page, never mixed into a food cart.
 */
@Component
public class SeatingCatalogResolver implements CatalogItemResolver {

    private final SeatingZoneRepository repository;

    public SeatingCatalogResolver(SeatingZoneRepository repository) {
        this.repository = repository;
    }

    @Override
    public String itemType() {
        return KathaaTypes.SEATING;
    }

    @Override
    public List<CatalogItemDto> resolve(Collection<Long> ids) {
        return repository.findByIdIn(ids).stream().filter(SeatingZone::isActive).map(this::toDto).toList();
    }

    private CatalogItemDto toDto(SeatingZone z) {
        return CatalogItemDto.builder()
                .itemType(KathaaTypes.SEATING)
                .itemId(z.getId())
                .name("Table · " + z.getName())
                .description(z.getDescription())
                .price(BigDecimal.ZERO)
                .priceUnit("per guest")
                .imageUrl(z.getImageUrl())
                .slug(z.getSlug())
                .detailPath("/book")
                .category("Seating")
                .active(z.isActive())
                .cartable(false)
                .workflowCode(KathaaTypes.WF_TABLE)
                .attributes(Map.of("petFriendly", z.isPetFriendly(), "workFriendly", z.isWorkFriendly()))
                .build();
    }
}
