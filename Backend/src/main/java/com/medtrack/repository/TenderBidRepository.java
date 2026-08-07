package com.medtrack.repository;

import com.medtrack.model.TenderBid;
import com.medtrack.model.TenderBidStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TenderBidRepository extends JpaRepository<TenderBid, Long> {

    List<TenderBid> findByTenderIdOrderByRoundNumberDescSubmittedAtAsc(Long tenderId);

    List<TenderBid> findByTenderIdAndRoundNumberOrderByBidAmountAsc(Long tenderId, Integer roundNumber);

    List<TenderBid> findByTenderIdAndRoundNumberOrderBySubmittedAtAsc(Long tenderId, Integer roundNumber);

    List<TenderBid> findBySupplierIdOrderBySubmittedAtDesc(Long supplierId);

    Optional<TenderBid> findByIdAndTenderId(Long id, Long tenderId);

    Optional<TenderBid> findByIdAndTenderIdAndSupplierId(Long id, Long tenderId, Long supplierId);

    Optional<TenderBid> findByTenderIdAndSupplierIdAndRoundNumberAndStatus(
            Long tenderId, Long supplierId, Integer roundNumber, TenderBidStatus status);

    long countByTenderIdAndRoundNumber(Long tenderId, Integer roundNumber);

    boolean existsByTenderIdAndSupplierIdAndRoundNumberAndStatus(
            Long tenderId, Long supplierId, Integer roundNumber, TenderBidStatus status);
}
