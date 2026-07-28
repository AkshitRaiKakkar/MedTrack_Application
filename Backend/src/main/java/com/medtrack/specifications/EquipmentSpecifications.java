package com.medtrack.specification;

import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.EquipmentStatus;
import org.springframework.data.jpa.domain.Specification;

public class EquipmentSpecification {

    public static Specification<Equipment> filterEquipment(
            Long hospitalId,
            String department,
            EquipmentCategory category,
            EquipmentStatus status,
            String model
    ) {

        return (root, query, cb) -> {

            var predicate = cb.equal(root.get("hospital").get("id"), hospitalId);

            if (department != null && !department.isBlank()) {
                predicate = cb.and(predicate,
                        cb.equal(root.get("department"), department));
            }

            if (category != null) {
                predicate = cb.and(predicate,
                        cb.equal(root.get("category"), category));
            }

            if (status != null) {
                predicate = cb.and(predicate,
                        cb.equal(root.get("status"), status));
            }

            if (model != null && !model.isBlank()) {
                predicate = cb.and(predicate,
                        cb.like(
                                cb.lower(root.get("model")),
                                "%" + model.toLowerCase() + "%"
                        ));
            }

            return predicate;
        };
    }
}