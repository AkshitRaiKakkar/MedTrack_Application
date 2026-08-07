package com.medtrack.repository;

import com.medtrack.model.FacilityLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacilityLocationRepository extends JpaRepository<FacilityLocation, Long> {

    List<FacilityLocation> findByHospitalId(Long hospitalId);

    long countByParentId(Long parentId);
}