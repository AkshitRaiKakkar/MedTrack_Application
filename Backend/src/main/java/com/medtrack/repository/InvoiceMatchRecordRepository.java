package com.medtrack.repository;

import com.medtrack.model.InvoiceMatchRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceMatchRecordRepository extends JpaRepository<InvoiceMatchRecord, Long> {

    List<InvoiceMatchRecord> findByRequestIdOrderByCreatedAtDesc(Long requestId);

    List<InvoiceMatchRecord> findByHospitalIdOrderByCreatedAtDesc(Long hospitalId);
}
