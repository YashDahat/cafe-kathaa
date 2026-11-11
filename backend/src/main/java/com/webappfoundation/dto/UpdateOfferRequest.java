package com.webappfoundation.dto;

import com.webappfoundation.model.OfferTrigger;
import com.webappfoundation.model.OfferType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Admin edit payload for an existing discount code. Referenced by the foundation's AdminOfferController and
 * OfferAdminService but missing from the foundation repo (suspected foundation bug — reported in the build
 * summary). Shape mirrors frontend types/loyalty.ts UpdateOfferRequest and CreateOfferRequest minus code/userId.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOfferRequest {
    private OfferTrigger trigger;
    private OfferType type;
    private BigDecimal value;
    private BigDecimal minSpend;
    private BigDecimal maxDiscount;
    private Integer maxUses;
    private Instant startsAt;
    private Instant expiresAt;
    private String campaignId;
}
