package com.webappfoundation.kathaa.repo;

import com.webappfoundation.kathaa.model.SlotHold;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SlotHoldRepository extends JpaRepository<SlotHold, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select h from SlotHold h where h.zoneId = :zoneId and h.slotKey = :slotKey")
    Optional<SlotHold> lockByZoneAndSlot(@Param("zoneId") Long zoneId, @Param("slotKey") String slotKey);

    List<SlotHold> findBySlotKeyStartingWith(String datePrefix);
}
