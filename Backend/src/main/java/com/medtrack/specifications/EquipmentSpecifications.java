package com.medtrack.specifications;

import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.EquipmentStatus;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

/**
 * Factories for {@link Specification} instances over {@link Equipment}.
 *
 * <p>Every specification produced here is tenant-scoped: the hospital predicate is applied
 * unconditionally and combined with {@code AND}, so a caller cannot widen the result set beyond
 * their own hospital by omitting or manipulating filters.</p>
 */
public final class EquipmentSpecifications {

    /**
     * Escape character for {@code LIKE} patterns. Backslash would be a poor choice: on MySQL it is
     * also the string-literal escape and would need doubling. {@code !} is unambiguous on both
     * MySQL and H2.
     */
    private static final char LIKE_ESCAPE = '!';

    private EquipmentSpecifications() {
        // Static factory holder; not instantiable.
    }

    /**
     * Matches equipment owned by the given hospital, narrowed by whichever filters are supplied.
     * A {@code null} or blank filter is ignored rather than matched against {@code null}.
     *
     * @param hospitalId owning hospital; always applied
     * @param department exact department name, matched case-insensitively
     * @param category   equipment category
     * @param status     lifecycle status
     * @param model      substring of the model name, matched case-insensitively
     * @return a tenant-scoped specification
     */
    public static Specification<Equipment> filterEquipment(
            Long hospitalId,
            String department,
            EquipmentCategory category,
            EquipmentStatus status,
            String model
    ) {
        return (root, query, cb) -> {
            Predicate predicate = cb.equal(root.get("hospital").get("id"), hospitalId);

            if (hasText(department)) {
                // Case-insensitive so this endpoint agrees with /api/equipment/department, which
                // uses findByHospitalIdAndDepartmentIgnoreCase. Before this, "ICU" and "icu"
                // returned different results depending on which endpoint the UI called.
                predicate = cb.and(predicate, cb.equal(
                        cb.lower(root.get("department")),
                        department.trim().toLowerCase()));
            }

            if (category != null) {
                predicate = cb.and(predicate, cb.equal(root.get("category"), category));
            }

            if (status != null) {
                predicate = cb.and(predicate, cb.equal(root.get("status"), status));
            }

            if (hasText(model)) {
                predicate = cb.and(predicate, containsIgnoreCase(cb, root.get("model"), model));
            }

            return predicate;
        };
    }

    /**
     * Matches equipment owned by the given hospital where the keyword appears in any
     * human-searchable identifying field: name, model, serial number, equipment code or department.
     *
     * <p>Those fields are {@code OR}-ed together and the whole disjunction is {@code AND}-ed with
     * the hospital predicate, so tenant scoping cannot be escaped by a crafted keyword.</p>
     *
     * @param hospitalId owning hospital; always applied
     * @param keyword    substring to look for, matched case-insensitively
     * @return a tenant-scoped specification
     */
    public static Specification<Equipment> keywordMatches(Long hospitalId, String keyword) {
        return (root, query, cb) -> {
            Predicate tenant = cb.equal(root.get("hospital").get("id"), hospitalId);

            if (!hasText(keyword)) {
                return tenant;
            }

            Predicate anyField = cb.or(
                    containsIgnoreCase(cb, root.get("name"), keyword),
                    containsIgnoreCase(cb, root.get("model"), keyword),
                    containsIgnoreCase(cb, root.get("serialNumber"), keyword),
                    containsIgnoreCase(cb, root.get("equipmentCode"), keyword),
                    containsIgnoreCase(cb, root.get("department"), keyword)
            );

            return cb.and(tenant, anyField);
        };
    }

    private static Predicate containsIgnoreCase(
            CriteriaBuilder cb, Expression<String> field, String value) {
        return cb.like(
                cb.lower(field),
                "%" + escapeLike(value.trim().toLowerCase()) + "%",
                LIKE_ESCAPE);
    }

    /**
     * Escapes the {@code LIKE} metacharacters {@code %} and {@code _} in user input.
     *
     * <p>Without this, searching for {@code "%"} matches the entire inventory, and searching for
     * {@code "MRI_1"} also matches {@code "MRI-1"} and {@code "MRIX1"} because {@code _} is a
     * single-character wildcard rather than a literal. The escape character itself is escaped
     * first, otherwise escaping would introduce new metacharacters.</p>
     *
     * @param value raw user input
     * @return the same text with {@code LIKE} metacharacters neutralised
     */
    static String escapeLike(String value) {
        StringBuilder escaped = new StringBuilder(value.length());
        for (char character : value.toCharArray()) {
            if (character == LIKE_ESCAPE || character == '%' || character == '_') {
                escaped.append(LIKE_ESCAPE);
            }
            escaped.append(character);
        }
        return escaped.toString();
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
