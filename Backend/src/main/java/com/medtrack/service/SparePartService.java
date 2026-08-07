package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.*;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Hospital;
import com.medtrack.model.SparePart;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.SparePartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SparePartService {

    private final SparePartRepository sparePartRepository;
    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;

    private Hospital getHospitalForUser(String username) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username is required");
        }
        User user = userRepository.findByUsername(username.trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return hospitalRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found"));
    }

    public List<SparePartResponse> getAllSpareParts(String username) {
        Hospital hospital = getHospitalForUser(username);
        return sparePartRepository.findByHospitalId(hospital.getId()).stream()
                .map(SparePartResponse::from)
                .toList();
    }

    public List<SparePartResponse> getLowStockAlerts(String username) {
        Hospital hospital = getHospitalForUser(username);
        return sparePartRepository.findLowStockPartsByHospitalId(hospital.getId()).stream()
                .map(SparePartResponse::from)
                .toList();
    }

    @Transactional
    public SparePartResponse createSparePart(SparePartCreateRequest request, String username) {
        Hospital hospital = getHospitalForUser(username);
        validateCreate(request.getPartNumber(), request.getDescription(), request.getStockLevel(), request.getReorderPoint(), request.getUnitCost(), hospital.getId());

        SparePart sparePart = SparePart.builder()
                .hospitalId(hospital.getId())
                .partNumber(request.getPartNumber().trim())
                .description(request.getDescription().trim())
                .compatibleModels(trimToNull(request.getCompatibleModels()))
                .stockLevel(request.getStockLevel())
                .reorderPoint(request.getReorderPoint())
                .unitCost(request.getUnitCost())
                .createdAt(LocalDateTime.now())
                .build();

        return SparePartResponse.from(sparePartRepository.save(sparePart));
    }

    @Transactional
    public SparePart createSparePart(SparePart sparePart, String username) {
        if (sparePart == null) throw new IllegalArgumentException("Spare part details are required");
        Hospital hospital = getHospitalForUser(username);
        validateCreate(sparePart.getPartNumber(), sparePart.getDescription(), sparePart.getStockLevel(), sparePart.getReorderPoint(), sparePart.getUnitCost(), hospital.getId());
        sparePart.setHospitalId(hospital.getId());
        sparePart.setPartNumber(sparePart.getPartNumber().trim());
        sparePart.setDescription(sparePart.getDescription().trim());
        sparePart.setCompatibleModels(trimToNull(sparePart.getCompatibleModels()));
        return sparePartRepository.save(sparePart);
    }

    @Transactional
    public SparePartResponse updateSparePart(Long id, SparePartUpdateRequest request, String username) {
        Hospital hospital = getHospitalForUser(username);
        SparePart existing = sparePartRepository.findByIdAndHospitalIdForUpdate(id, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Spare Part not found or access denied"));

        validateUpdate(id, request.getPartNumber(), request.getDescription(), request.getStockLevel(), request.getReorderPoint(), request.getUnitCost(), hospital.getId());

        existing.setPartNumber(request.getPartNumber().trim());
        existing.setDescription(request.getDescription().trim());
        existing.setCompatibleModels(trimToNull(request.getCompatibleModels()));
        existing.setStockLevel(request.getStockLevel());
        existing.setReorderPoint(request.getReorderPoint());
        existing.setUnitCost(request.getUnitCost());

        return SparePartResponse.from(sparePartRepository.save(existing));
    }

    @Transactional
    public SparePart updateSparePart(Long id, SparePart updateRequest, String username) {
        if (updateRequest == null) throw new IllegalArgumentException("Update details are required");
        Hospital hospital = getHospitalForUser(username);
        SparePart existing = sparePartRepository.findByIdAndHospitalIdForUpdate(id, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Spare Part not found or access denied"));

        validateUpdate(id, updateRequest.getPartNumber(), updateRequest.getDescription(), updateRequest.getStockLevel(), updateRequest.getReorderPoint(), updateRequest.getUnitCost(), hospital.getId());

        existing.setPartNumber(updateRequest.getPartNumber().trim());
        existing.setDescription(updateRequest.getDescription().trim());
        existing.setCompatibleModels(trimToNull(updateRequest.getCompatibleModels()));
        existing.setStockLevel(updateRequest.getStockLevel());
        existing.setReorderPoint(updateRequest.getReorderPoint());
        existing.setUnitCost(updateRequest.getUnitCost());

        return sparePartRepository.save(existing);
    }

    @Transactional
    public void deleteSparePart(Long id, String username) {
        Hospital hospital = getHospitalForUser(username);
        SparePart existing = sparePartRepository.findByIdAndHospitalIdForUpdate(id, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Spare Part not found or access denied"));

        existing.setDeleted(true);
        existing.setDeletedAt(LocalDateTime.now());
        existing.setDeletedBy(username);
        sparePartRepository.save(existing);
    }

    @Transactional
    public SparePartResponse deductStock(SparePartDeductRequest request, String username) {
        if (request == null) throw new IllegalArgumentException("Stock deduction request is required");
        return SparePartResponse.from(deductStockInternal(request.getPartNumber(), request.getQuantity(), username));
    }

    @Transactional
    public void deductStock(String partNumber, int quantity, String username) {
        deductStockInternal(partNumber, quantity, username);
    }

    private SparePart deductStockInternal(String partNumber, int quantity, String username) {
        if (partNumber == null || partNumber.isBlank()) throw new IllegalArgumentException("Part number is required for stock deduction");
        if (quantity <= 0) throw new IllegalArgumentException("Deduction quantity must be strictly greater than zero");

        Hospital hospital = getHospitalForUser(username);
        SparePart partToDeduct = sparePartRepository
                .findByHospitalIdAndPartNumberForUpdate(hospital.getId(), partNumber.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Spare part not found: " + partNumber));

        if (partToDeduct.getStockLevel() == null || partToDeduct.getStockLevel() < quantity) {
            int available = partToDeduct.getStockLevel() != null ? partToDeduct.getStockLevel() : 0;
            throw new IllegalArgumentException("Insufficient stock for part: " + partNumber + ". Requested: " + quantity + ", Available: " + available);
        }

        partToDeduct.setStockLevel(partToDeduct.getStockLevel() - quantity);
        return sparePartRepository.save(partToDeduct);
    }

    private void validateCreate(String partNumber, String desc, Integer stock, Integer reorder, Double cost, Long hospitalId) {
        validateFields(partNumber, desc, stock, reorder, cost);
        if (sparePartRepository.existsByHospitalIdAndPartNumberIgnoreCase(hospitalId, partNumber.trim())) {
            throw new IllegalArgumentException("A spare part with number '" + partNumber.trim() + "' already exists for this hospital");
        }
    }

    private void validateUpdate(Long id, String partNumber, String desc, Integer stock, Integer reorder, Double cost, Long hospitalId) {
        validateFields(partNumber, desc, stock, reorder, cost);
        if (sparePartRepository.existsByHospitalIdAndPartNumberIgnoreCaseAndIdNot(hospitalId, partNumber.trim(), id)) {
            throw new IllegalArgumentException("Another spare part with number '" + partNumber.trim() + "' already exists for this hospital");
        }
    }

    private void validateFields(String partNumber, String description, Integer stockLevel, Integer reorderPoint, Double unitCost) {
        if (partNumber == null || partNumber.isBlank()) throw new IllegalArgumentException("Part number is required");
        if (description == null || description.isBlank()) throw new IllegalArgumentException("Description is required");
        if (stockLevel == null || stockLevel < 0) throw new IllegalArgumentException("Stock level cannot be negative");
        if (reorderPoint == null || reorderPoint < 0) throw new IllegalArgumentException("Reorder point cannot be negative");
        if (unitCost == null || unitCost < 0) throw new IllegalArgumentException("Unit cost cannot be negative");
    }

    private String trimToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
