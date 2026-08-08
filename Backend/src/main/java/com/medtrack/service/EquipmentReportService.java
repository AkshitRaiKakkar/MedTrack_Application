package com.medtrack.service;

import com.medtrack.dto.EquipmentReportRequest;
import com.medtrack.dto.EquipmentReportResponse;
import com.medtrack.dto.EquipmentReportSummary;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EquipmentReportService {

    private final EquipmentRepository equipmentRepository;
    private final HospitalRepository hospitalRepository;

    public EquipmentReportResponse generateReport(
            EquipmentReportRequest request,
            String username
    ) {

        Hospital hospital = hospitalRepository
                .findByUsername(username)
                .orElseThrow();

        EquipmentReportSummary summary = new EquipmentReportSummary();

        EquipmentReportResponse response = new EquipmentReportResponse();
        List<Equipment> filtered = equipment.stream()

                .filter(e -> request.getDepartment() == null ||
                        e.getDepartment().equalsIgnoreCase(request.getDepartment()))

                .filter(e -> request.getCategory() == null ||
                        e.getCategory() == request.getCategory())

                .filter(e -> request.getStatus() == null ||
                        e.getStatus() == request.getStatus())

                .filter(e -> request.getManufacturer() == null ||
                        e.getManufacturer().equalsIgnoreCase(request.getManufacturer()))

                .filter(e -> request.getPurchaseStartDate() == null ||
                        !e.getPurchaseDate().isBefore(request.getPurchaseStartDate()))

                .filter(e -> request.getPurchaseEndDate() == null ||
                        !e.getPurchaseDate().isAfter(request.getPurchaseEndDate()))

                .filter(e -> request.getWarrantyExpired() == null ||
                        request.getWarrantyExpired() ==
                                e.getWarrantyExpiry().isBefore(LocalDate.now()))

                .toList();

        EquipmentReportSummary summary = new EquipmentReportSummary();
        summary.setTotalEquipment(filtered.size());

        summary.setActive(
                filtered.stream()
                        .filter(e -> e.getStatus() == EquipmentStatus.ACTIVE)
                        .count());

        summary.setMaintenance(
                filtered.stream()
                        .filter(e -> e.getStatus() == EquipmentStatus.UNDER_MAINTENANCE)
                        .count());

        summary.setRetired(
                filtered.stream()
                        .filter(e -> e.getStatus() == EquipmentStatus.RETIRED)
                        .count());

        summary.setExpiredWarranty(
                filtered.stream()
                        .filter(e -> e.getWarrantyExpiry() != null)
                        .filter(e -> e.getWarrantyExpiry().isBefore(LocalDate.now()))
                        .count());

        summary.setExpiringSoon(
                filtered.stream()
                        .filter(e -> e.getWarrantyExpiry() != null)
                        .filter(e ->
                                !e.getWarrantyExpiry().isBefore(LocalDate.now()) &&
                                        !e.getWarrantyExpiry().isAfter(LocalDate.now().plusDays(30)))
                        .count());

        summary.setLowStock(
                filtered.stream()
                        .filter(e -> e.getQuantity() <= e.getMinimumStock())
                        .count());
        EquipmentReportResponse response = new EquipmentReportResponse();

        response.setSummary(summary);

        response.setEquipment(filtered);

        return response;

        response.setSummary(summary);

        return response;
    }
}