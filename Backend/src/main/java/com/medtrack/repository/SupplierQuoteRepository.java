package com.medtrack.repository;

import com.medtrack.model.SupplierQuote;
import com.medtrack.model.SupplierQuoteStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierQuoteRepository extends JpaRepository<SupplierQuote, Long> {

    List<SupplierQuote> findByRequestIdOrderBySubmittedAtAsc(Long requestId);

    List<SupplierQuote> findByHospitalIdOrderBySubmittedAtDesc(Long hospitalId);

    List<SupplierQuote> findBySupplierIdOrderBySubmittedAtDesc(Long supplierId);

    Optional<SupplierQuote> findByIdAndHospitalId(Long id, Long hospitalId);

    Optional<SupplierQuote> findByIdAndSupplierId(Long id, Long supplierId);

    List<SupplierQuote> findByRequestIdAndStatusOrderByQuoteAmountAsc(
            Long requestId, SupplierQuoteStatus status);
}
