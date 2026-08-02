package com.medtrack.repository;

import com.medtrack.model.ReceivingRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReceivingRecordRepository extends JpaRepository<ReceivingRecord, Long> {

    List<ReceivingRecord> findByRequestIdOrderByReceivedAtDesc(Long requestId);

    List<ReceivingRecord> findByHospitalIdOrderByReceivedAtDesc(Long hospitalId);

    List<ReceivingRecord> findByOrderIdOrderByReceivedAtDesc(Long orderId);
}
