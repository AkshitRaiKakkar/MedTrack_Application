package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
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
        sparePart.setHospitalId(hospital.getId());
        return sparePartRepository.save(sparePart);
    }

    @Transactional
    public SparePart updateSparePart(Long id, SparePart updateRequest, String username) {
        Hospital hospital = getHospitalForUser(username);
        SparePart existing = sparePartRepository.findByIdAndHospitalId(id, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Spare Part not found or access denied"));

        existing.setPartNumber(updateRequest.getPartNumber());
        existing.setDescription(updateRequest.getDescription());
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
    public void deductStock(String partNumber, int quantity, String username) {
        Hospital hospital = getHospitalForUser(username);
        List<SparePart> parts = sparePartRepository.findByHospitalId(hospital.getId());
        SparePart partToDeduct = parts.stream()
                .filter(p -> p.getPartNumber().equals(partNumber))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Spare part not found: " + partNumber));

        if (partToDeduct.getStockLevel() < quantity) {
            throw new IllegalArgumentException("Insufficient stock for part: " + partNumber);
        }
        
        partToDeduct.setStockLevel(partToDeduct.getStockLevel() - quantity);
        sparePartRepository.save(partToDeduct);
    }

    @Transactional
    public void restockStock(String partNumber, int quantity, String username) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Restock quantity must be positive");
        }
        Hospital hospital = getHospitalForUser(username);
        List<SparePart> parts = sparePartRepository.findByHospitalId(hospital.getId());
        SparePart partToRestock = parts.stream()
                .filter(p -> p.getPartNumber().equals(partNumber))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Spare part not found: " + partNumber));

        partToRestock.setStockLevel(partToRestock.getStockLevel() + quantity);
        sparePartRepository.save(partToRestock);
    }
}
