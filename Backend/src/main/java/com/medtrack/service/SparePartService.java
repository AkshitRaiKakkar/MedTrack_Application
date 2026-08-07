package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.SparePartStockRequest;
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
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return hospitalRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found"));
    }

    public List<SparePart> getAllSpareParts(String username) {
        Hospital hospital = getHospitalForUser(username);
        return sparePartRepository.findByHospitalId(hospital.getId());
    }

    public List<SparePart> getLowStockAlerts(String username) {
        Hospital hospital = getHospitalForUser(username);
        return sparePartRepository.findLowStockPartsByHospitalId(hospital.getId());
    }

    @Transactional
    public SparePart createSparePart(SparePart sparePart, String username) {
        Hospital hospital = getHospitalForUser(username);
        validateSparePart(sparePart);

        String trimmedPartNumber = sparePart.getPartNumber().trim();
        if (sparePartRepository.existsByHospitalIdAndPartNumberAndDeletedFalse(hospital.getId(), trimmedPartNumber)) {
            throw new IllegalArgumentException("Spare part with part number already exists: " + trimmedPartNumber);
        }

        sparePart.setHospitalId(hospital.getId());
        sparePart.setPartNumber(trimmedPartNumber);
        sparePart.setDescription(sparePart.getDescription().trim());
        return sparePartRepository.save(sparePart);
    }

    @Transactional
    public SparePart updateSparePart(Long id, SparePart updateRequest, String username) {
        Hospital hospital = getHospitalForUser(username);
        SparePart existing = sparePartRepository.findByIdAndHospitalId(id, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Spare Part not found or access denied"));

        validateSparePart(updateRequest);

        String updatedPartNumber = updateRequest.getPartNumber().trim();
        if (!existing.getPartNumber().equalsIgnoreCase(updatedPartNumber)
                && sparePartRepository.existsByHospitalIdAndPartNumberAndDeletedFalse(hospital.getId(), updatedPartNumber)) {
            throw new IllegalArgumentException("Spare part with part number already exists: " + updatedPartNumber);
        }

        existing.setPartNumber(updatedPartNumber);
        existing.setDescription(updateRequest.getDescription().trim());
        existing.setCompatibleModels(updateRequest.getCompatibleModels());
        existing.setStockLevel(updateRequest.getStockLevel());
        existing.setReorderPoint(updateRequest.getReorderPoint());
        existing.setUnitCost(updateRequest.getUnitCost());

        return sparePartRepository.save(existing);
    }

    @Transactional
    public void deleteSparePart(Long id, String username) {
        Hospital hospital = getHospitalForUser(username);
        SparePart existing = sparePartRepository.findByIdAndHospitalId(id, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Spare Part not found or access denied"));

        existing.setDeleted(true);
        existing.setDeletedAt(LocalDateTime.now());
        existing.setDeletedBy(username);
        sparePartRepository.save(existing);
    }

    @Transactional
    public SparePart deductStock(SparePartStockRequest request, String username) {
        if (request == null) {
            throw new IllegalArgumentException("Stock request details are required");
        }
        return deductStock(request.getPartNumber(), request.getQuantity(), username);
    }

    @Transactional
    public SparePart deductStock(String partNumber, int quantity, String username) {
        if (partNumber == null || partNumber.isBlank()) {
            throw new IllegalArgumentException("Part number is required for stock deduction");
        }
        if (quantity <= 0) {
            throw new IllegalArgumentException("Deduction quantity must be greater than zero");
        }

        Hospital hospital = getHospitalForUser(username);
        String trimmedPartNumber = partNumber.trim();

        SparePart partToDeduct = sparePartRepository
                .findByHospitalIdAndPartNumberAndDeletedFalse(hospital.getId(), trimmedPartNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Active spare part not found: " + trimmedPartNumber));

        if (partToDeduct.getStockLevel() < quantity) {
            throw new IllegalArgumentException("Insufficient stock for part: " + trimmedPartNumber
                    + ". Available: " + partToDeduct.getStockLevel() + ", Requested: " + quantity);
        }

        partToDeduct.setStockLevel(partToDeduct.getStockLevel() - quantity);
        return sparePartRepository.save(partToDeduct);
    }

    @Transactional
    public SparePart restockSparePart(SparePartStockRequest request, String username) {
        if (request == null) {
            throw new IllegalArgumentException("Stock request details are required");
        }
        return restockSparePart(request.getPartNumber(), request.getQuantity(), username);
    }

    @Transactional
    public SparePart restockSparePart(String partNumber, int quantity, String username) {
        if (partNumber == null || partNumber.isBlank()) {
            throw new IllegalArgumentException("Part number is required for restocking");
        }
        if (quantity <= 0) {
            throw new IllegalArgumentException("Restock quantity must be greater than zero");
        }

        Hospital hospital = getHospitalForUser(username);
        String trimmedPartNumber = partNumber.trim();

        SparePart partToRestock = sparePartRepository
                .findByHospitalIdAndPartNumberAndDeletedFalse(hospital.getId(), trimmedPartNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Active spare part not found: " + trimmedPartNumber));

        partToRestock.setStockLevel(partToRestock.getStockLevel() + quantity);
        return sparePartRepository.save(partToRestock);
    }

    private void validateSparePart(SparePart sparePart) {
        if (sparePart == null) {
            throw new IllegalArgumentException("Spare part payload is required");
        }
        if (sparePart.getPartNumber() == null || sparePart.getPartNumber().isBlank()) {
            throw new IllegalArgumentException("Part number is required");
        }
        if (sparePart.getDescription() == null || sparePart.getDescription().isBlank()) {
            throw new IllegalArgumentException("Description is required");
        }
        if (sparePart.getStockLevel() == null || sparePart.getStockLevel() < 0) {
            throw new IllegalArgumentException("Stock level cannot be negative");
        }
        if (sparePart.getReorderPoint() == null || sparePart.getReorderPoint() < 0) {
            throw new IllegalArgumentException("Reorder point cannot be negative");
        }
        if (sparePart.getUnitCost() == null || sparePart.getUnitCost() < 0.0) {
            throw new IllegalArgumentException("Unit cost cannot be negative");
        }
    }
}
