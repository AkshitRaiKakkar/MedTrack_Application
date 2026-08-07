package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.EquipmentDashboardResponse;
import com.medtrack.dto.EquipmentImportPreviewResponse;
import com.medtrack.dto.EquipmentImportSummary;
import com.medtrack.dto.EquipmentStatisticsResponse;
import com.medtrack.dto.EquipmentValuationResponse;
import com.medtrack.dto.LowStockSummaryResponse;
import com.medtrack.dto.StockAdjustmentRequest;
import com.medtrack.dto.WarrantySummaryResponse;
import com.medtrack.model.DepreciationMethod;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentImportAuditLog;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.FacilityLocation;
import com.medtrack.model.Hospital;
import com.medtrack.model.OperationsEvent;
import com.medtrack.model.WarrantyCoverageType;
import com.medtrack.repository.EquipmentImportAuditLogRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.FacilityLocationRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.specifications.EquipmentSpecifications;
import com.medtrack.util.CsvSupport;
import lombok.RequiredArgsConstructor;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.medtrack.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.Map;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.dto.EquipmentUtilizationResponse;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Service layer for Equipment-related business logic.
 * Handles CRUD operations, CSV bulk uploads, and asset QR code generation.
 */
@Service
@RequiredArgsConstructor
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;
    private final EquipmentImportAuditLogRepository equipmentImportAuditLogRepository;
    private final FacilityLocationRepository facilityLocationRepository;
    private final EventPublisherService eventPublisherService;

    private static final Logger logger = LoggerFactory.getLogger(EquipmentService.class);

    /**
     * Column order for both the export and the import template.
     *
     * <p>Shared so the two cannot drift again. Previously the export emitted
     * "Equipment Code, Name, Department, Category, Status, Purchase Date, Warranty Expiry" while
     * the template offered by the UI used a different set, and neither matched the other.</p>
     */
    static final String[] EQUIPMENT_CSV_HEADERS = {
            "Equipment Code", "Name", "Model", "Serial Number", "Department",
            "Category", "Status", "Purchase Date", "Warranty Expiry",
            "Purchase Cost", "Useful Life (Years)", "Depreciation Method",
            "Warranty Provider", "Warranty Contract Number", "Warranty Start Date",
            "Warranty Coverage Type", "Warranty Terms"
    };

    private Hospital getHospitalForUser(String username) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username or email is required");
        }
        String identifier = username.trim();
        User user = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier.toLowerCase(java.util.Locale.ROOT)))
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        return hospitalRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found for user"));
    }

    public EquipmentDashboardResponse getDashboardOverview(String username) {

        Hospital hospital = getHospitalForUser(username);

        long total =
                equipmentRepository.countByHospitalId(hospital.getId());

        long active =
                equipmentRepository.countByHospitalIdAndStatus(
                        hospital.getId(),
                        EquipmentStatus.ACTIVE
                );

        long maintenance =
                equipmentRepository.countByHospitalIdAndStatus(
                        hospital.getId(),
                        EquipmentStatus.UNDER_MAINTENANCE
                );

        long retired =
                equipmentRepository.countByHospitalIdAndStatus(
                        hospital.getId(),
                        EquipmentStatus.RETIRED
                );

        long expired =
                equipmentRepository.countByHospitalIdAndWarrantyExpiryBefore(
                        hospital.getId(),
                        LocalDate.now()
                );

        long expiringSoon =
                equipmentRepository.countByHospitalIdAndWarrantyExpiryBetween(
                        hospital.getId(),
                        LocalDate.now(),
                        LocalDate.now().plusDays(30)
                );

        long lowStock =
                equipmentRepository.findLowStockEquipment(
                        hospital.getId()
                ).size();

        return new EquipmentDashboardResponse(
                total,
                active,
                maintenance,
                retired,
                expired,
                expiringSoon,
                lowStock
        );
    }

    /**
     * Every equipment record belonging to the caller's hospital, unpaged.
     *
     * <p>Retained next to the paged overload for the callers that genuinely need the whole
     * inventory in one pass - the CSV export and the aggregate reports - where handing back a
     * single page would silently produce a partial answer rather than a smaller one.</p>
     *
     * @param username authenticated user's username
     * @return the hospital's full inventory
     */
    public List<Equipment> getAllEquipment(String username) {
        Hospital hospital = getHospitalForUser(username);
        return equipmentRepository.findByHospitalId(hospital.getId());
    }

    /**
     * Fetches one page of the caller's equipment records.
     *
     * @param username authenticated user's username
     * @param locationId optional facility-location node; when set, only assets placed at that
     *                   node or any of its descendants are returned (issue #745)
     * @param pageable the page to fetch
     * @return the requested page of equipment
     */
    public Page<Equipment> getAllEquipment(String username, Long locationId, Pageable pageable) {
        Hospital hospital = getHospitalForUser(username);
        if (locationId != null) {
            return equipmentRepository.findByHospitalIdAndLocationIn(
                    hospital.getId(),
                    resolveLocationSubtree(locationId, hospital.getId()),
                    pageable);
        }
        return equipmentRepository.findByHospitalId(hospital.getId(), pageable);
    }

    /**
     * The selected node plus every descendant, so filtering on a floor or facility also matches
     * assets in the rooms beneath it.
     */
    private Set<Long> resolveLocationSubtree(Long rootId, Long hospitalId) {
        List<FacilityLocation> all = facilityLocationRepository.findByHospitalId(hospitalId);
        boolean rootExistsInHospital = all.stream().anyMatch(loc -> loc.getId().equals(rootId));
        if (!rootExistsInHospital) {
            throw new ResourceNotFoundException("Facility location not found with ID: " + rootId);
        }
        Set<Long> ids = new HashSet<>();
        Set<Long> pending = new HashSet<>();
        pending.add(rootId);
        while (!pending.isEmpty()) {
            Set<Long> next = new HashSet<>();
            for (Long parent : pending) {
                for (FacilityLocation location : all) {
                    if (parent.equals(location.getParentId())) {
                        ids.add(location.getId());
                        next.add(location.getId());
                    }
                }
            }
            pending = next;
        }
        ids.add(rootId);
        return ids;
    }

    public List<Equipment> getEquipmentByDepartment(String department, String username) {
        Hospital hospital = getHospitalForUser(username);
        return equipmentRepository.findByHospitalIdAndDepartmentIgnoreCase(
                hospital.getId(),
                department
        );
    }

    public List<Equipment> getLowStockEquipment(String username) {
        Hospital hospital = getHospitalForUser(username);
        return equipmentRepository.findLowStockEquipment(hospital.getId());
    }

    /**
     * Applies a signed stock movement to one asset owned by the caller's hospital.
     *
     * <p>Expressed as a delta rather than an absolute quantity so that two concurrent movements
     * compose instead of overwriting each other. The row is re-read inside the transaction and the
     * resulting quantity is validated before the write, so stock can never go negative.</p>
     *
     * @param id       equipment identifier, scoped to the caller's hospital
     * @param request  the movement to apply
     * @param username authenticated user's username
     * @return the updated equipment record
     * @throws ResourceNotFoundException if the asset does not exist or belongs to another hospital
     * @throws IllegalArgumentException  if the delta is zero, or would drive quantity negative
     */
    @Transactional
    public Equipment adjustStock(Long id, StockAdjustmentRequest request, String username) {
        if (request == null || request.getDelta() == null) {
            throw new IllegalArgumentException("Stock delta is required");
        }
        if (request.getDelta() == 0) {
            throw new IllegalArgumentException("Stock delta must not be zero");
        }
        if (request.getMinimumStock() != null && request.getMinimumStock() < 0) {
            throw new IllegalArgumentException("Minimum stock cannot be negative");
        }

        Hospital hospital = getHospitalForUser(username);
        Equipment equipment = equipmentRepository.findByIdAndHospitalId(id, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Equipment not found or you don't have access"));

        int currentQuantity = equipment.getQuantity() != null ? equipment.getQuantity() : 0;
        long adjusted = (long) currentQuantity + request.getDelta();

        if (adjusted < 0) {
            throw new IllegalArgumentException(
                    "Insufficient stock: cannot remove " + Math.abs(request.getDelta())
                            + " unit(s) from a quantity of " + currentQuantity);
        }
        // Guard the upper bound too. A caller sending Integer.MAX_VALUE as the delta would
        // otherwise silently overflow the column on narrowing back to int.
        if (adjusted > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("Resulting quantity exceeds the supported maximum");
        }

        equipment.setQuantity((int) adjusted);
        if (request.getMinimumStock() != null) {
            equipment.setMinimumStock(request.getMinimumStock());
        }

        int minimumStock = equipment.getMinimumStock() != null ? equipment.getMinimumStock() : 0;
        boolean crossedIntoLowStock = currentQuantity > minimumStock && (int) adjusted <= minimumStock;

        Equipment savedEquipment = equipmentRepository.save(equipment);

        if (crossedIntoLowStock) {
            publishLowStockEvent(savedEquipment, minimumStock);
        }

        logger.info(
                "Equipment stock adjusted | User: {} | Equipment ID: {} | Delta: {} | "
                        + "Quantity: {} -> {} | Reason: {}",
                username,
                savedEquipment.getId(),
                request.getDelta(),
                currentQuantity,
                savedEquipment.getQuantity(),
                request.getReason() != null ? request.getReason() : "not supplied"
        );

        return savedEquipment;
    }

    /**
     * Raises an {@code EQUIPMENT_LOW_STOCK} operations event the moment a stock adjustment
     * drives quantity down to or below the minimum threshold. Fired only on the crossing
     * (see the caller), so repeated adjustments while already low do not spam the feed.
     */
    private void publishLowStockEvent(Equipment equipment, int minimumStock) {
        if (equipment.getHospital() == null) {
            return;
        }
        String title = equipment.getQuantity() == 0
                ? "Out of stock: " + equipment.getName()
                : "Low stock: " + equipment.getName();
        String detail = "{"
                + "\"equipmentCode\":\"" + escapeJson(equipment.getEquipmentCode()) + "\","
                + "\"quantity\":" + equipment.getQuantity() + ","
                + "\"minimumStock\":" + minimumStock
                + "}";
        OperationsEvent.EventSeverity severity = equipment.getQuantity() == 0
                ? OperationsEvent.EventSeverity.CRITICAL
                : OperationsEvent.EventSeverity.WARNING;

        eventPublisherService.publishEvent(
                equipment.getHospital().getId(),
                OperationsEvent.EventCategory.EQUIPMENT,
                OperationsEvent.EventType.EQUIPMENT_LOW_STOCK,
                title,
                detail,
                equipment.getId(),
                OperationsEvent.EntityType.EQUIPMENT,
                "system",
                severity);
    }

    public EquipmentUtilizationResponse getEquipmentUtilization(String username) {

        Hospital hospital = getHospitalForUser(username);

        List<Equipment> equipmentList =
                equipmentRepository.findByHospitalId(hospital.getId());

        long total = equipmentList.size();

        long active = equipmentList.stream()
                .filter(e -> e.getStatus() == EquipmentStatus.ACTIVE)
                .count();

        long underMaintenance = equipmentList.stream()
                .filter(e -> e.getStatus() == EquipmentStatus.UNDER_MAINTENANCE)
                .count();

        long retired = equipmentList.stream()
                .filter(e -> e.getStatus() == EquipmentStatus.RETIRED)
                .count();

        double utilization = total == 0
                ? 0.0
                : Math.round((active * 100.0 / total) * 100.0) / 100.0;

        return new EquipmentUtilizationResponse(
                total,
                active,
                underMaintenance,
                retired,
                utilization
        );
    }

    /**
     * Counts of tracked, low and out-of-stock items for the caller's hospital.
     *
     * <p>Serves the dashboard tiles without transferring every low-stock row on each poll.</p>
     *
     * @param username authenticated user's username
     * @return aggregate stock counters
     */
    public LowStockSummaryResponse getLowStockSummary(String username) {
        Hospital hospital = getHospitalForUser(username);

        List<Equipment> inventory = equipmentRepository.findByHospitalId(hospital.getId());

        long lowStock = 0;
        long outOfStock = 0;
        long totalUnits = 0;

        for (Equipment equipment : inventory) {
            int quantity = equipment.getQuantity() != null ? equipment.getQuantity() : 0;
            int threshold = equipment.getMinimumStock() != null ? equipment.getMinimumStock() : 0;

            totalUnits += quantity;
            if (quantity <= threshold) {
                lowStock++;
            }
            if (quantity == 0) {
                outOfStock++;
            }
        }

        return LowStockSummaryResponse.builder()
                .totalTrackedItems(inventory.size())
                .lowStockItems(lowStock)
                .outOfStockItems(outOfStock)
                .totalUnitsInStock(totalUnits)
                .build();
    }

    public Map<EquipmentStatus, Long> getEquipmentStatusSummary(String username) {

        Hospital hospital = getHospitalForUser(username);

        Map<EquipmentStatus, Long> summary = new EnumMap<>(EquipmentStatus.class);

        for (EquipmentStatus status : EquipmentStatus.values()) {
            long count = equipmentRepository.countByHospitalIdAndStatus(
                    hospital.getId(),
                    status
            );
            summary.put(status, count);
        }

        return summary;
    }

    /**
     * Retrieves all equipment whose warranty has already expired.
     *
     * @param username authenticated user's username
     * @return list of equipment with expired warranties
     */
    public List<Equipment> getExpiredWarrantyEquipment(String username) {
        Hospital hospital = getHospitalForUser(username);
        LocalDate today = LocalDate.now();

        return equipmentRepository.findByHospitalIdAndWarrantyExpiryBefore(
                hospital.getId(),
                today
        );
    }

    public List<Equipment> getEquipmentByPurchaseDateRange(
            String username,
            LocalDate startDate,
            LocalDate endDate) {

        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException(
                    "Start date cannot be after end date."
            );
        }

        Hospital hospital = getHospitalForUser(username);

        return equipmentRepository.findByHospitalIdAndPurchaseDateBetween(
                hospital.getId(),
                startDate,
                endDate
        );
    }



    public Map<String, Long> getCategorySummary(String username) {

        Hospital hospital = getHospitalForUser(username);

        List<Object[]> results =
                equipmentRepository.countEquipmentByCategory(hospital.getId());

        Map<String, Long> summary = new LinkedHashMap<>();

        for (Object[] row : results) {
            summary.put(
                    row[0].toString(),
                    ((Number) row[1]).longValue()
            );
        }

        return summary;
    }


    /** Horizon used to classify a warranty as "expiring soon". */
    static final int WARRANTY_EXPIRY_HORIZON_DAYS = 30;

    /**
     * Warranty coverage breakdown for the caller's hospital.
     *
     * <p>The four buckets are disjoint and exhaustive:
     * {@code expired + expiringSoon + valid + unknown == total}.</p>
     *
     * <p>Three things were wrong with the previous implementation:</p>
     *
     * <ul>
     *   <li>{@code valid} was computed as {@code total - expired}. Both comparison queries translate
     *       to SQL comparisons, and {@code NULL < today} is UNKNOWN, so equipment with no warranty
     *       date was excluded from {@code expired} and absorbed into {@code valid}. Assets with no
     *       warranty on record were reported as covered - for a warranty-tracking system, the wrong
     *       direction to be wrong in. Those now land in {@code unknown}.</li>
     *   <li>{@code expiringSoon} is a subset of "not yet expired", so it was double-counted against
     *       {@code valid} while being returned as a peer key. Three assets - one expired, one
     *       expiring in 10 days, one expiring in 3 years - reported
     *       {@code expired=1, expiringSoon=1, valid=2} for a total of 3. {@code valid} now means
     *       "expires beyond the horizon", so the buckets partition the inventory.</li>
     *   <li>Each figure came from loading a {@code List<Equipment>} and calling {@code size()}, so
     *       every matching row was selected, hydrated into a managed entity and attached to the
     *       persistence context just to be counted and discarded. The {@code count...} queries used
     *       here already existed on the repository and are what {@code getEquipmentStatistics}, in
     *       this same class, has always used.</li>
     * </ul>
     *
     * @param username authenticated user's username
     * @return the warranty breakdown
     */
    public WarrantySummaryResponse getWarrantySummary(String username) {

        Hospital hospital = getHospitalForUser(username);
        Long hospitalId = hospital.getId();

        // Captured once. Four separate LocalDate.now() calls could straddle midnight and classify
        // the same asset into two buckets, or none.
        LocalDate today = LocalDate.now();
        LocalDate horizon = today.plusDays(WARRANTY_EXPIRY_HORIZON_DAYS);

        long total = equipmentRepository.countByHospitalId(hospitalId);
        long expired = equipmentRepository.countByHospitalIdAndWarrantyExpiryBefore(hospitalId, today);
        long expiringSoon = equipmentRepository
                .countByHospitalIdAndWarrantyExpiryBetween(hospitalId, today, horizon);
        long valid = equipmentRepository.countByHospitalIdAndWarrantyExpiryAfter(hospitalId, horizon);
        long unknown = equipmentRepository.countByHospitalIdAndWarrantyExpiryIsNull(hospitalId);

        return WarrantySummaryResponse.builder()
                .total(total)
                .expired(expired)
                .expiringSoon(expiringSoon)
                .valid(valid)
                .unknown(unknown)
                .build();
    }

    public Map<String, Long> getEquipmentAgeSummary(String username) {

        Hospital hospital = getHospitalForUser(username);

        List<Equipment> equipmentList =
                equipmentRepository.findByHospitalId(hospital.getId());

        LocalDate today = LocalDate.now();

        long lessThanOneYear = 0;
        long oneToThreeYears = 0;
        long threeToFiveYears = 0;
        long moreThanFiveYears = 0;

        for (Equipment equipment : equipmentList) {

            if (equipment.getPurchaseDate() == null) {
                continue;
            }

            long years = ChronoUnit.YEARS.between(
                    equipment.getPurchaseDate(),
                    today
            );

            if (years < 1) {
                lessThanOneYear++;
            } else if (years < 3) {
                oneToThreeYears++;
            } else if (years < 5) {
                threeToFiveYears++;
            } else {
                moreThanFiveYears++;
            }
        }

        Map<String, Long> summary = new LinkedHashMap<>();

        summary.put("lessThanOneYear", lessThanOneYear);
        summary.put("oneToThreeYears", oneToThreeYears);
        summary.put("threeToFiveYears", threeToFiveYears);
        summary.put("moreThanFiveYears", moreThanFiveYears);

        return summary;
    }

    /**
     * Retrieves all equipment whose warranty will expire within the next 30 days.
     *
     * @param username authenticated user's username
     * @return list of equipment with warranties expiring soon
     */
    public List<Equipment> getWarrantyExpiringSoon(String username) {
        Hospital hospital = getHospitalForUser(username);
        LocalDate today = LocalDate.now();
        LocalDate threshold = today.plusDays(30);

        return equipmentRepository.findByHospitalIdAndWarrantyExpiryBetween(
                hospital.getId(),
                today,
                threshold
        );
    }

    /**
     * Fetches a single equipment record by its database ID.
     * Used for equipment detail views.
     * Throws a ResourceNotFoundException if no equipment exists with the given ID.
     */
    public Equipment getEquipmentById(Long id , String username) {
        Hospital hospital = getHospitalForUser(username);
        return equipmentRepository.findByIdAndHospitalId(id,hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found or you don't have access"));
    }

    /**
     * Free-text search across the caller's inventory.
     *
     * <p>Matches the keyword as a case-insensitive substring of the asset name, model, serial
     * number, equipment code or department. Results are always scoped to the authenticated user's
     * hospital.</p>
     *
     * @param keyword  substring to look for; must not be blank
     * @param username authenticated user's username
     * @return matching equipment, ordered by name
     * @throws IllegalArgumentException if the keyword is null or blank
     */
    public List<Equipment> searchEquipment(String keyword, String username) {
        // A blank keyword degrades to "match everything", which is what GET /api/equipment already
        // does. Rejecting it stops an accidentally-empty search box from pulling the entire
        // inventory on every keystroke.
        if (keyword == null || keyword.isBlank()) {
            throw new IllegalArgumentException("Search keyword must not be blank");
        }

        Hospital hospital = getHospitalForUser(username);

        return equipmentRepository.findAll(
                EquipmentSpecifications.keywordMatches(hospital.getId(), keyword),
                Sort.by(Sort.Direction.ASC, "name"));
    }

    /**
     * Retrieves the caller's equipment narrowed by any combination of optional filters.
     *
     * <p>Every filter is optional; omitting all of them returns the hospital's full inventory. The
     * hospital predicate is applied by the specification regardless, so no filter combination can
     * reach another hospital's assets.</p>
     *
     * @param username   authenticated user's username
     * @param department exact department name, matched case-insensitively
     * @param category   equipment category
     * @param status     lifecycle status
     * @param model      case-insensitive substring of the model name
     * @return matching equipment, ordered by name
     */
    public List<Equipment> filterEquipment(
            String username,
            String department,
            EquipmentCategory category,
            EquipmentStatus status,
            String model) {

        Hospital hospital = getHospitalForUser(username);

        return equipmentRepository.findAll(
                EquipmentSpecifications.filterEquipment(
                        hospital.getId(), department, category, status, model),
                Sort.by(Sort.Direction.ASC, "name"));
    }

    public EquipmentStatisticsResponse getEquipmentStatistics(String username) {

        Hospital hospital = getHospitalForUser(username);

        long total = equipmentRepository.countByHospitalId(hospital.getId());

        long active = equipmentRepository.countByHospitalIdAndStatus(
                hospital.getId(),
                EquipmentStatus.ACTIVE);

        long maintenance = equipmentRepository.countByHospitalIdAndStatus(
                hospital.getId(),
                EquipmentStatus.UNDER_MAINTENANCE);

        long retired = equipmentRepository.countByHospitalIdAndStatus(
                hospital.getId(),
                EquipmentStatus.RETIRED);

        long expiredWarranty = equipmentRepository
                .countByHospitalIdAndWarrantyExpiryBefore(
                        hospital.getId(),
                        LocalDate.now());

        return new EquipmentStatisticsResponse(
                total,
                active,
                maintenance,
                retired,
                expiredWarranty
        );
    }

    /**
     * Fleet valuation for the analytics dashboard: what the inventory is worth on the books, what
     * it originally cost, what replacing it would cost today, and per-category / per-asset
     * breakdowns (issue #702).
     *
     * <p>Assets without a purchase cost are excluded from the money totals but still counted in
     * {@code assetCount}, so finance can see how much of the fleet is still untracked.</p>
     *
     * @param username authenticated user's username
     * @return the valuation summary
     */
    public EquipmentValuationResponse getEquipmentValuation(String username) {
        Hospital hospital = getHospitalForUser(username);
        List<Equipment> inventory = equipmentRepository.findByHospitalId(hospital.getId());

        BigDecimal totalPurchaseCost = BigDecimal.ZERO;
        BigDecimal totalBookValue = BigDecimal.ZERO;
        BigDecimal totalReplacementCost = BigDecimal.ZERO;
        long assetsWithCost = 0;
        long fullyDepreciatedCount = 0;

        Map<String, BigDecimal> purchaseCostByCategory = new LinkedHashMap<>();
        Map<String, BigDecimal> bookValueByCategory = new LinkedHashMap<>();
        List<EquipmentValuationResponse.AssetValuation> topAssets = new ArrayList<>();

        for (Equipment item : inventory) {
            BigDecimal cost = item.getPurchaseCost();
            BigDecimal bookValue = item.getBookValue();
            BigDecimal replacement = item.getProjectedReplacementCost();

            if (cost != null) {
                assetsWithCost++;
                totalPurchaseCost = totalPurchaseCost.add(cost);
            }
            if (bookValue != null) {
                totalBookValue = totalBookValue.add(bookValue);
                if (bookValue.signum() == 0) {
                    fullyDepreciatedCount++;
                }
            }
            if (replacement != null) {
                totalReplacementCost = totalReplacementCost.add(replacement);
            }

            String category = item.getCategory() != null
                    ? item.getCategory().name()
                    : "UNCATEGORISED";
            if (cost != null) {
                purchaseCostByCategory.merge(category, cost, BigDecimal::add);
            }
            if (bookValue != null) {
                bookValueByCategory.merge(category, bookValue, BigDecimal::add);
            }

            if (bookValue != null) {
                topAssets.add(new EquipmentValuationResponse.AssetValuation(
                        item.getId(),
                        item.getName(),
                        item.getDepartment(),
                        item.getEquipmentCode(),
                        cost,
                        bookValue,
                        replacement));
            }
        }

        // Most valuable assets first, capped at five for the dashboard table.
        topAssets.sort(Comparator.comparing(EquipmentValuationResponse.AssetValuation::getBookValue)
                .reversed());
        List<EquipmentValuationResponse.AssetValuation> topFive =
                topAssets.size() > 5 ? topAssets.subList(0, 5) : topAssets;

        return EquipmentValuationResponse.builder()
                .assetCount(inventory.size())
                .assetsWithCost(assetsWithCost)
                .fullyDepreciatedCount(fullyDepreciatedCount)
                .totalPurchaseCost(totalPurchaseCost.setScale(2, RoundingMode.HALF_UP))
                .totalBookValue(totalBookValue.setScale(2, RoundingMode.HALF_UP))
                .totalReplacementCost(totalReplacementCost.setScale(2, RoundingMode.HALF_UP))
                .purchaseCostByCategory(purchaseCostByCategory)
                .bookValueByCategory(bookValueByCategory)
                .topAssetsByBookValue(topFive)
                .build();
    }

    /**
     * Adds a new equipment record.
     * If no equipmentCode is provided by the caller, auto-generates one
     * using a unique UUID.
     */
    public Equipment addEquipment(Equipment equipment , String username) {
        Hospital hospital = getHospitalForUser(username);
        equipment.setHospital(hospital);

        // Structured location (issue #745): the client sends locationId, which binds to the
        // read-only column projection. The managed node is resolved here so a raw id can never
        // point outside the caller's hospital.
        equipment.setLocation(resolveLocation(equipment, hospital));

        // Generate a simple code if not provided
        if (equipment.getEquipmentCode() == null) {
            equipment.setEquipmentCode("EQ-" + UUID.randomUUID().toString());
        }
        if (equipment.getQuantity() == null) {
            equipment.setQuantity(0);
        }

        if (equipment.getMinimumStock() == null) {
            equipment.setMinimumStock(10);
        }

        // Straight-line depreciation is the documented default. Jackson + Lombok builds the
        // entity from the request body field by field, so @Builder.Default does not apply on
        // deserialisation - the default must be applied here.
        if (equipment.getDepreciationMethod() == null) {
            equipment.setDepreciationMethod(DepreciationMethod.STRAIGHT_LINE);
        }

        if (equipment.getEquipmentCode() != null &&
                equipmentRepository.findByEquipmentCode(equipment.getEquipmentCode()).isPresent()) {
            throw new IllegalArgumentException("Equipment Code already exists.");
        }

        if (equipment.getSerialNumber() != null &&
                equipmentRepository.findBySerialNumber(equipment.getSerialNumber()).isPresent()) {
            throw new IllegalArgumentException("Serial Number already exists.");
        }

        Equipment savedEquipment = equipmentRepository.save(equipment);

        logger.info(
                "Equipment created | User: {} | Equipment ID: {} | Name: {}",
                username,
                savedEquipment.getId(),
                savedEquipment.getName()
        );

        return savedEquipment;
    }

    /**
     * Resolves the incoming {@code locationId} to a managed node of the caller's hospital, or
     * {@code null} when no location was supplied.
     */
    private FacilityLocation resolveLocation(Equipment source, Hospital hospital) {
        Long locationId = source.getLocationId();
        if (locationId == null) {
            return null;
        }
        FacilityLocation location = facilityLocationRepository.findById(locationId)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found"));
        if (!location.getHospital().getId().equals(hospital.getId())) {
            throw new ResourceNotFoundException("Location not found or you don't have access");
        }
        return location;
    }

    /**
     * Deletes an equipment record by ID.
     */
    public void deleteEquipment(Long id , String username) {
        Hospital hospital = getHospitalForUser(username);
        Equipment equipment = equipmentRepository.findByIdAndHospitalId(id,hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found or you don't have access"));

        logger.info(
                "Equipment deleted | User: {} | Equipment ID: {} | Name: {}",
                username,
                equipment.getId(),
                equipment.getName()
        );
        equipmentRepository.delete(equipment);
    }

    /**
     * Updates an existing equipment record's fields.
     */
    public Equipment updateEquipment(Long id, Equipment equipmentDetails , String username) {
        Hospital hospital = getHospitalForUser(username);
        Equipment equipment = equipmentRepository.findByIdAndHospitalId(id,hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found or you don't have access"));

        if (equipmentDetails.getEquipmentCode() != null) {
            equipmentRepository.findByEquipmentCode(equipmentDetails.getEquipmentCode())
                    .ifPresent(existing -> {
                        if (!existing.getId().equals(id)) {
                            throw new IllegalArgumentException("Equipment Code already exists.");
                        }
                    });
        }

        if (equipmentDetails.getSerialNumber() != null) {
            equipmentRepository.findBySerialNumber(equipmentDetails.getSerialNumber())
                    .ifPresent(existing -> {
                        if (!existing.getId().equals(id)) {
                            throw new IllegalArgumentException("Serial Number already exists.");
                        }
                    });
        }

        equipment.setName(equipmentDetails.getName());
        equipment.setModel(equipmentDetails.getModel());
        equipment.setSerialNumber(equipmentDetails.getSerialNumber());
        equipment.setDepartment(equipmentDetails.getDepartment());
        equipment.setCategory(equipmentDetails.getCategory());
        // Stock levels are moved through adjustStock, which applies a signed delta. A general
        // update must therefore treat an omitted value as "leave alone" rather than as zero,
        // otherwise any PUT that does not restate the inventory wipes it.
        if (equipmentDetails.getQuantity() != null) {
            equipment.setQuantity(equipmentDetails.getQuantity());
        }
        if (equipmentDetails.getMinimumStock() != null) {
            equipment.setMinimumStock(equipmentDetails.getMinimumStock());
        }
        equipment.setStatus(equipmentDetails.getStatus());
        equipment.setPurchaseDate(equipmentDetails.getPurchaseDate());
        // Finance fields follow the same "omitted means leave alone" rule as stock levels, so an
        // update that does not restate them cannot wipe the cost or useful life.
        if (equipmentDetails.getPurchaseCost() != null) {
            equipment.setPurchaseCost(equipmentDetails.getPurchaseCost());
        }
        if (equipmentDetails.getUsefulLifeYears() != null) {
            equipment.setUsefulLifeYears(equipmentDetails.getUsefulLifeYears());
        }
        if (equipmentDetails.getDepreciationMethod() != null) {
            equipment.setDepreciationMethod(equipmentDetails.getDepreciationMethod());
        }

        // Structured location (issue #745): an omitted id means "leave the asset where it is";
        // explicit moves go through the dedicated assign endpoint so they leave a history trail.
        if (equipmentDetails.getLocationId() != null) {
            equipment.setLocation(resolveLocation(equipmentDetails, hospital));
        }

        Equipment updatedEquipment = equipmentRepository.save(equipment);

        logger.info(
                "Equipment updated | User: {} | Equipment ID: {} | Name: {}",
                username,
                updatedEquipment.getId(),
                updatedEquipment.getName()
        );

        return updatedEquipment;
    }

    /**
     * Generates a 250x250 base64 encoded PNG QR code for the specified equipment.
     * Encodes essential asset tracking details.
     */
    public String generateQrCodeBase64(Long id, String username) {
        Equipment equipment = getEquipmentById(id, username);
        String qrContent = String.format("MedTrack Asset:\nID: %d\nCode: %s\nName: %s\nSN: %s\nDept: %s",
                equipment.getId(),
                equipment.getEquipmentCode(),
                equipment.getName(),
                equipment.getSerialNumber() != null ? equipment.getSerialNumber() : "N/A",
                equipment.getDepartment());

        try {
            com.google.zxing.qrcode.QRCodeWriter qrCodeWriter = new com.google.zxing.qrcode.QRCodeWriter();
            com.google.zxing.common.BitMatrix bitMatrix = qrCodeWriter.encode(
                    qrContent,
                    com.google.zxing.BarcodeFormat.QR_CODE,
                    250,
                    250
            );

            java.io.ByteArrayOutputStream pngOutputStream = new java.io.ByteArrayOutputStream();
            com.google.zxing.client.j2se.MatrixToImageWriter.writeToStream(
                    bitMatrix,
                    "PNG",
                    pngOutputStream
            );
            byte[] pngData = pngOutputStream.toByteArray();
            return java.util.Base64.getEncoder().encodeToString(pngData);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR Code for equipment ID: " + id, e);
        }
    }

    /**
     * Imports multiple equipment items from a CSV upload.
     * Performs row-by-row validation and commits all valid rows in a batch transaction.
     *
     * <p>Every batch is recorded in {@code equipment_import_audit_logs} - who imported, from which
     * file, and how many rows succeeded or failed - so an import can always be traced back to its
     * actor and contents.</p>
     */
    @Transactional
    public EquipmentImportSummary importEquipmentFromCsv(MultipartFile file, String username) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("CSV file is empty or missing");
        }

        Hospital hospital = getHospitalForUser(username);
        ParsedImport parsed = parseAndValidateImport(file, hospital);

        if (!parsed.equipmentToSave.isEmpty()) {
            equipmentRepository.saveAll(parsed.equipmentToSave);
        }

        int totalRows = parsed.successCount + parsed.failureCount;
        equipmentImportAuditLogRepository.save(EquipmentImportAuditLog.builder()
                .hospitalId(hospital.getId())
                .actor(username)
                .filename(file.getOriginalFilename() != null ? file.getOriginalFilename() : "equipment.csv")
                .totalRows(totalRows)
                .successCount(parsed.successCount)
                .failureCount(parsed.failureCount)
                .failures(failuresToJson(parsed.failures))
                .importedAt(LocalDateTime.now())
                .build());

        logger.info("Equipment bulk import | User: {} | File: {} | Total: {} | Success: {} | Failed: {}",
                username,
                file.getOriginalFilename(),
                totalRows,
                parsed.successCount,
                parsed.failureCount);

        return EquipmentImportSummary.builder()
                .successCount(parsed.successCount)
                .failureCount(parsed.failureCount)
                .failures(parsed.failures)
                .build();
    }

    /**
     * Dry-runs a bulk import: parses and validates every row exactly as
     * {@link #importEquipmentFromCsv} would, but writes nothing.
     *
     * <p>Backs the two-step UI flow ("preview, then confirm") so staff can see which rows will
     * import and which carry errors before anything is committed. The validation is the same code
     * path the real import uses, so the preview cannot diverge from the outcome.</p>
     *
     * @param file     the CSV file to validate
     * @param username authenticated user's username
     * @return the rows that would be imported plus per-row failures
     */
    public EquipmentImportPreviewResponse previewEquipmentImport(MultipartFile file, String username) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("CSV file is empty or missing");
        }

        Hospital hospital = getHospitalForUser(username);
        ParsedImport parsed = parseAndValidateImport(file, hospital);

        return EquipmentImportPreviewResponse.builder()
                .totalRows(parsed.successCount + parsed.failureCount)
                .validCount(parsed.successCount)
                .failureCount(parsed.failureCount)
                .validRows(parsed.validRows)
                .failures(parsed.failures)
                .build();
    }

    /**
     * Recent import batches for the caller's hospital, newest first.
     *
     * <p>The audit trail itself is append-only; this surfaces the latest batches so the UI can
     * show what was uploaded and when.</p>
     *
     * @param username authenticated user's username
     * @return up to the 20 most recent import audit entries
     */
    public List<EquipmentImportAuditLog> getImportAuditLogs(String username) {
        Hospital hospital = getHospitalForUser(username);
        return equipmentImportAuditLogRepository
                .findTop20ByHospitalIdOrderByImportedAtDesc(hospital.getId());
    }

    /**
     * Shared parse-and-validate pass used by both the real import and the dry-run preview.
     *
     * <p>Returns everything the two callers need - the entities to persist, per-row failures, and
     * a human-readable preview of the valid rows - so the validation rules cannot drift between
     * the preview and the commit.</p>
     */
    private ParsedImport parseAndValidateImport(MultipartFile file, Hospital hospital) {
        List<Equipment> equipmentToSave = new ArrayList<>();
        List<EquipmentImportSummary.RowFailure> failures = new ArrayList<>();
        List<EquipmentImportPreviewResponse.PreviewRow> validRows = new ArrayList<>();
        int successCount = 0;
        int failureCount = 0;
        // Serial numbers already claimed by an earlier row in this same file, so a
        // duplicate further down the file is caught before it ever reaches saveAll.
        Set<String> serialNumbersInFile = new HashSet<>();
        // Equipment codes already claimed by an earlier row in this same file. equipmentCode is a
        // unique column, so two rows naming the same code must be caught here rather than by a
        // constraint violation that takes the whole batch down.
        Set<String> equipmentCodesInFile = new HashSet<>();

        // UTF-8 explicitly. InputStreamReader with no charset uses the platform default, so on a
        // JVM defaulting to Windows-1252 the exported BOM decodes to "\u00ef\u00bb\u00bf" rather
        // than \uFEFF - the BOM strip below silently misses, "Equipment Code" never matches, and
        // every non-ASCII asset name is mangled on the way in.
        try (java.io.InputStream input = file.getInputStream()) {
            String document = new String(input.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);

            // Split on record boundaries rather than line breaks, so a quoted field containing a
            // newline stays one record. A readLine() loop split it across two, which is why the
            // export could quote embedded newlines correctly and the import still could not read
            // them back.
            List<String> records = CsvSupport.splitRecords(document);
            if (records.isEmpty()) {
                throw new IllegalArgumentException("CSV file has no content");
            }

            List<String> headers = parseCsvLine(records.get(0));
            if (headers.size() < 4) {
                throw new IllegalArgumentException("CSV file must contain at least: Name, Department, Category, Status");
            }

            int rowNum = 1;
            for (int recordIndex = 1; recordIndex < records.size(); recordIndex++) {
                String line = records.get(recordIndex);
                rowNum++;

                List<String> fields;
                try {
                    fields = parseCsvLine(line);
                } catch (CsvSupport.MalformedCsvException e) {
                    // A malformed row is the caller's data problem, not a server fault. Recorded as
                    // a row failure with the reason so the rest of the file still imports; the
                    // parser used to silently repair such rows into valid-looking values instead.
                    failures.add(new EquipmentImportSummary.RowFailure(rowNum, line, e.getMessage()));
                    failureCount++;
                    continue;
                }
                if (fields.size() < headers.size()) {
                    failures.add(new EquipmentImportSummary.RowFailure(rowNum, line, "Row has fewer columns than headers"));
                    failureCount++;
                    continue;
                }

                String name = getFieldValue(fields, headers, "Name");
                String model = getFieldValue(fields, headers, "Model");
                String serialNumber = getFieldValue(fields, headers, "Serial Number");
                String department = getFieldValue(fields, headers, "Department");
                String category = getFieldValue(fields, headers, "Category");
                String status = getFieldValue(fields, headers, "Status");
                String purchaseDateStr = getFieldValue(fields, headers, "Purchase Date");
                // Both of these are in EQUIPMENT_CSV_HEADERS and were written by the export but
                // never read back, so a round trip silently minted a fresh equipment code and
                // dropped the warranty date - the two columns were write-only.
                String equipmentCode = getFieldValue(fields, headers, "Equipment Code");
                String warrantyExpiryStr = getFieldValue(fields, headers, "Warranty Expiry");
                // Depreciation & valuation columns (issue #702). Same write-only risk: the export
                // wrote them, so the import must read them back or a round trip would silently
                // drop the finance data.
                String purchaseCostStr = getFieldValue(fields, headers, "Purchase Cost");
                String usefulLifeStr = getFieldValue(fields, headers, "Useful Life (Years)");
                String depreciationMethodStr = getFieldValue(fields, headers, "Depreciation Method");
                // Warranty & service contract columns (issue #703). Same write-only risk as the
                // finance columns: the export writes them, so the import must read them back or a
                // round trip would silently drop the contract details.
                String warrantyProviderStr = getFieldValue(fields, headers, "Warranty Provider");
                String warrantyContractNumberStr = getFieldValue(fields, headers, "Warranty Contract Number");
                String warrantyStartDateStr = getFieldValue(fields, headers, "Warranty Start Date");
                String warrantyCoverageTypeStr = getFieldValue(fields, headers, "Warranty Coverage Type");
                String warrantyTermsStr = getFieldValue(fields, headers, "Warranty Terms");

                if (name == null || name.trim().isEmpty()) {
                    failures.add(new EquipmentImportSummary.RowFailure(rowNum, line, "Asset Name is required"));
                    failureCount++;
                    continue;
                }

                if (department == null || department.trim().isEmpty()) {
                    failures.add(new EquipmentImportSummary.RowFailure(rowNum, line, "Department is required"));
                    failureCount++;
                    continue;
                }

                // Category validation
                EquipmentCategory equipmentCategory;

                if (category == null || category.trim().isEmpty()) {

                    equipmentCategory = EquipmentCategory.IMAGING;

                } else {

                    List<EquipmentCategory> validCategories = List.of(
                            EquipmentCategory.IMAGING,
                            EquipmentCategory.SURGICAL,
                            EquipmentCategory.MONITORING,
                            EquipmentCategory.LABORATORY,
                            EquipmentCategory.RESPIRATORY,
                            EquipmentCategory.OTHER
                    );

                    String finalCat = category.trim().toUpperCase();

                    if (validCategories.stream()
                            .noneMatch(c -> c.name().equals(finalCat))) {

                        failures.add(
                                new EquipmentImportSummary.RowFailure(
                                        rowNum,
                                        line,
                                        "Invalid category. Allowed: IMAGING, SURGICAL, MONITORING, LABORATORY, RESPIRATORY, OTHER"
                                )
                        );

                        failureCount++;
                        continue;
                    }

                    equipmentCategory = validCategories.stream()
                            .filter(c -> c.name().equals(finalCat))
                            .findFirst()
                            .orElse(EquipmentCategory.OTHER);
                }

                if (status == null || status.trim().isEmpty()) {
                    status = "Operational";
                } else {
                    // Accept both the display names the UI template hands out and the enum
                    // constants this application exports, so a file exported by /api/equipment/export
                    // can be re-imported. Previously the export emitted ACTIVE and the import only
                    // accepted "Operational", so every row of a self-exported file was rejected.
                    List<String> validStatuses = List.of(
                            "Operational", "Maintenance", "Retired",
                            "ACTIVE", "UNDER_MAINTENANCE", "RETIRED");
                    String finalStatus = status.trim();
                    if (validStatuses.stream().noneMatch(s -> s.equalsIgnoreCase(finalStatus))) {
                        failures.add(new EquipmentImportSummary.RowFailure(rowNum, line,
                                "Invalid condition/status. Allowed: " + String.join(", ", validStatuses)));
                        failureCount++;
                        continue;
                    }
                    status = finalStatus;
                }

                LocalDate purchaseDate = null;
                if (purchaseDateStr != null && !purchaseDateStr.trim().isEmpty()) {
                    try {
                        purchaseDate = LocalDate.parse(purchaseDateStr.trim());
                    } catch (DateTimeParseException e) {
                        failures.add(new EquipmentImportSummary.RowFailure(rowNum, line, "Invalid Purchase Date format. Expected YYYY-MM-DD"));
                        failureCount++;
                        continue;
                    }
                }

                LocalDate warrantyExpiry = null;
                if (warrantyExpiryStr != null && !warrantyExpiryStr.trim().isEmpty()) {
                    try {
                        warrantyExpiry = LocalDate.parse(warrantyExpiryStr.trim());
                    } catch (DateTimeParseException e) {
                        failures.add(new EquipmentImportSummary.RowFailure(rowNum, line,
                                "Invalid Warranty Expiry format. Expected YYYY-MM-DD"));
                        failureCount++;
                        continue;
                    }
                }

                // Purchase cost: optional, but must be a non-negative number when supplied.
                BigDecimal purchaseCost = null;
                if (purchaseCostStr != null && !purchaseCostStr.trim().isEmpty()) {
                    try {
                        purchaseCost = new BigDecimal(purchaseCostStr.trim());
                        if (purchaseCost.signum() < 0) {
                            throw new NumberFormatException("negative");
                        }
                    } catch (NumberFormatException e) {
                        failures.add(new EquipmentImportSummary.RowFailure(rowNum, line,
                                "Invalid Purchase Cost. Expected a non-negative number, e.g. 250000.00"));
                        failureCount++;
                        continue;
                    }
                }

                // Useful life: optional, but must be a whole number of years when supplied.
                Integer usefulLifeYears = null;
                if (usefulLifeStr != null && !usefulLifeStr.trim().isEmpty()) {
                    try {
                        usefulLifeYears = Integer.parseInt(usefulLifeStr.trim());
                        if (usefulLifeYears <= 0) {
                            throw new NumberFormatException("non-positive");
                        }
                    } catch (NumberFormatException e) {
                        failures.add(new EquipmentImportSummary.RowFailure(rowNum, line,
                                "Invalid Useful Life. Expected a positive whole number of years, e.g. 10"));
                        failureCount++;
                        continue;
                    }
                }

                // Depreciation method: optional, defaults to straight line.
                DepreciationMethod depreciationMethod = DepreciationMethod.STRAIGHT_LINE;
                if (depreciationMethodStr != null && !depreciationMethodStr.trim().isEmpty()) {
                    String method = depreciationMethodStr.trim();
                    if (method.equalsIgnoreCase("DECLINING_BALANCE")
                            || method.equalsIgnoreCase("declining balance")
                            || method.equalsIgnoreCase("double declining")) {
                        depreciationMethod = DepreciationMethod.DECLINING_BALANCE;
                    } else if (method.equalsIgnoreCase("STRAIGHT_LINE")
                            || method.equalsIgnoreCase("straight line")) {
                        depreciationMethod = DepreciationMethod.STRAIGHT_LINE;
                    } else {
                        failures.add(new EquipmentImportSummary.RowFailure(rowNum, line,
                                "Invalid Depreciation Method. Allowed: STRAIGHT_LINE, DECLINING_BALANCE"));
                        failureCount++;
                        continue;
                    }
                }

                EquipmentStatus parsedStatus = EquipmentStatus.ACTIVE;
                if ("Maintenance".equalsIgnoreCase(status) || "UNDER_MAINTENANCE".equalsIgnoreCase(status)) {
                    parsedStatus = EquipmentStatus.UNDER_MAINTENANCE;
                } else if ("Retired".equalsIgnoreCase(status) || "RETIRED".equalsIgnoreCase(status)) {
                    parsedStatus = EquipmentStatus.RETIRED;
                }

                // Warranty contract details (issue #703). Coverage type is a closed vocabulary;
                // everything else is free text or an ISO date.
                WarrantyCoverageType warrantyCoverageType = null;
                if (warrantyCoverageTypeStr != null && !warrantyCoverageTypeStr.trim().isEmpty()) {
                    String coverage = warrantyCoverageTypeStr.trim();
                    if (coverage.equalsIgnoreCase("FULL_PARTS_AND_LABOR")
                            || coverage.equalsIgnoreCase("full parts and labor")
                            || coverage.equalsIgnoreCase("full parts/labor")) {
                        warrantyCoverageType = WarrantyCoverageType.FULL_PARTS_AND_LABOR;
                    } else if (coverage.equalsIgnoreCase("PARTS_ONLY")
                            || coverage.equalsIgnoreCase("parts only")) {
                        warrantyCoverageType = WarrantyCoverageType.PARTS_ONLY;
                    } else if (coverage.equalsIgnoreCase("LABOR_ONLY")
                            || coverage.equalsIgnoreCase("labor only")) {
                        warrantyCoverageType = WarrantyCoverageType.LABOR_ONLY;
                    } else {
                        failures.add(new EquipmentImportSummary.RowFailure(rowNum, line,
                                "Invalid Warranty Coverage Type. Allowed: FULL_PARTS_AND_LABOR, PARTS_ONLY, LABOR_ONLY"));
                        failureCount++;
                        continue;
                    }
                }

                LocalDate warrantyStartDate = null;
                if (warrantyStartDateStr != null && !warrantyStartDateStr.trim().isEmpty()) {
                    try {
                        warrantyStartDate = LocalDate.parse(warrantyStartDateStr.trim());
                    } catch (DateTimeParseException e) {
                        failures.add(new EquipmentImportSummary.RowFailure(rowNum, line,
                                "Invalid Warranty Start Date format. Expected YYYY-MM-DD"));
                        failureCount++;
                        continue;
                    }
                }

                String warrantyProvider = blankToNull(warrantyProviderStr);
                String warrantyContractNumber = blankToNull(warrantyContractNumberStr);
                String warrantyTerms = blankToNull(warrantyTermsStr);

                if (serialNumber != null && !serialNumber.trim().isEmpty()) {
                    String normalizedSerial = serialNumber.trim();
                    if (!serialNumbersInFile.add(normalizedSerial)) {
                        failures.add(new EquipmentImportSummary.RowFailure(
                                rowNum, line, "Duplicate Serial Number within this file: " + normalizedSerial));
                        failureCount++;
                        continue;
                    }
                    // Scoped to *other* records. During an upsert the row's own stored asset
                    // already holds this serial number, so an unqualified "already exists" check
                    // would reject every re-import of an unchanged export.
                    String rowCode = equipmentCode != null ? equipmentCode.trim() : null;
                    Optional<Equipment> serialOwner = equipmentRepository.findBySerialNumber(normalizedSerial);
                    if (serialOwner.isPresent()
                            && !(rowCode != null && rowCode.equals(serialOwner.get().getEquipmentCode()))) {
                        failures.add(new EquipmentImportSummary.RowFailure(
                                rowNum, line, "Serial Number already exists in inventory: " + normalizedSerial));
                        failureCount++;
                        continue;
                    }
                }

                // Upsert by equipment code.
                //
                // Minting a fresh UUID for every row makes re-importing an export duplicate the
                // whole inventory: the code column is the only stable identity a CSV carries, and
                // discarding it means the second import cannot tell "this asset again" from "a new
                // asset". It is also a unique column, so a row naming an existing code either
                // violates that constraint and fails the entire batch, or - with a new UUID -
                // silently inserts a second copy of the same physical asset.
                String trimmedCode = equipmentCode != null && !equipmentCode.trim().isEmpty()
                        ? equipmentCode.trim()
                        : null;

                if (trimmedCode != null && !equipmentCodesInFile.add(trimmedCode)) {
                    // Two rows of one file claiming the same code would build two entities for a
                    // unique column. saveAll would then fail the whole batch on a constraint
                    // violation, reporting a 500 for what is a fixable problem in the caller's file.
                    failures.add(new EquipmentImportSummary.RowFailure(
                            rowNum, line, "Duplicate Equipment Code within this file: " + trimmedCode));
                    failureCount++;
                    continue;
                }

                Equipment existing = null;
                if (trimmedCode != null) {
                    Optional<Equipment> byCode = equipmentRepository.findByEquipmentCode(trimmedCode);
                    if (byCode.isPresent()) {
                        existing = byCode.get();
                        // A code owned by another hospital must never be adopted: findByEquipmentCode
                        // is global, so without this check one tenant could overwrite another's
                        // asset simply by naming its code in an uploaded file.
                        if (existing.getHospital() == null
                                || !hospital.getId().equals(existing.getHospital().getId())) {
                            failures.add(new EquipmentImportSummary.RowFailure(rowNum, line,
                                    "Equipment Code " + trimmedCode + " belongs to another hospital"));
                            failureCount++;
                            continue;
                        }
                    }
                }

                Equipment equipment;
                if (existing != null) {
                    equipment = existing;
                    equipment.setName(name);
                    equipment.setModel(model);
                    equipment.setSerialNumber(serialNumber);
                    equipment.setDepartment(department);
                    equipment.setCategory(equipmentCategory);
                    equipment.setStatus(parsedStatus);
                    equipment.setPurchaseDate(purchaseDate);
                    equipment.setWarrantyExpiry(warrantyExpiry);
                    equipment.setPurchaseCost(purchaseCost);
                    equipment.setUsefulLifeYears(usefulLifeYears);
                    equipment.setDepreciationMethod(depreciationMethod);
                    equipment.setWarrantyProvider(warrantyProvider);
                    equipment.setWarrantyContractNumber(warrantyContractNumber);
                    equipment.setWarrantyStartDate(warrantyStartDate);
                    equipment.setWarrantyCoverageType(warrantyCoverageType);
                    equipment.setWarrantyTerms(warrantyTerms);
                } else {
                    equipment = Equipment.builder()
                            .name(name)
                            .model(model)
                            .serialNumber(serialNumber)
                            .department(department)
                            .category(equipmentCategory)
                            .status(parsedStatus)
                            .purchaseDate(purchaseDate)
                            // Written by the export and previously never read back, so a round trip
                            // silently dropped the warranty date.
                            .warrantyExpiry(warrantyExpiry)
                            .equipmentCode(trimmedCode != null ? trimmedCode : "EQ-" + UUID.randomUUID())
                            .hospital(hospital)
                            .purchaseCost(purchaseCost)
                            .usefulLifeYears(usefulLifeYears)
                            .depreciationMethod(depreciationMethod)
                            .warrantyProvider(warrantyProvider)
                            .warrantyContractNumber(warrantyContractNumber)
                            .warrantyStartDate(warrantyStartDate)
                            .warrantyCoverageType(warrantyCoverageType)
                            .warrantyTerms(warrantyTerms)
                            .build();
                }

                equipmentToSave.add(equipment);
                validRows.add(new EquipmentImportPreviewResponse.PreviewRow(
                        rowNum, toPreviewRowData(equipment, name, model, serialNumber,
                        department, equipmentCategory, status, purchaseDate, warrantyExpiry,
                        purchaseCost, usefulLifeYears, depreciationMethod,
                        warrantyProvider, warrantyContractNumber, warrantyStartDate,
                        warrantyCoverageType, warrantyTerms)));
                successCount++;
            }

        } catch (java.io.IOException e) {
            // Only genuine I/O failures become a 500. The try block also raises
            // IllegalArgumentException for "CSV file has no content" and for a missing header
            // column; catching Exception here rewrapped those into a RuntimeException, so a
            // user-fixable input problem was reported as a server error with the reason lost.
            throw new RuntimeException("Error reading CSV file", e);
        }

        return new ParsedImport(equipmentToSave, failures, validRows, successCount, failureCount);
    }

    /**
     * Human-readable form of one validated row, keyed by the canonical CSV header, for the
     * dry-run preview table.
     */
    private Map<String, String> toPreviewRowData(
            Equipment equipment,
            String name,
            String model,
            String serialNumber,
            String department,
            EquipmentCategory equipmentCategory,
            String status,
            LocalDate purchaseDate,
            LocalDate warrantyExpiry,
            BigDecimal purchaseCost,
            Integer usefulLifeYears,
            DepreciationMethod depreciationMethod,
            String warrantyProvider,
            String warrantyContractNumber,
            LocalDate warrantyStartDate,
            WarrantyCoverageType warrantyCoverageType,
            String warrantyTerms) {

        Map<String, String> data = new LinkedHashMap<>();
        data.put("Equipment Code", equipment.getEquipmentCode());
        data.put("Name", name);
        data.put("Model", model);
        data.put("Serial Number", serialNumber);
        data.put("Department", department);
        data.put("Category", equipmentCategory.name());
        data.put("Status", status);
        data.put("Purchase Date", purchaseDate != null ? purchaseDate.toString() : "");
        data.put("Warranty Expiry", warrantyExpiry != null ? warrantyExpiry.toString() : "");
        data.put("Purchase Cost", purchaseCost != null ? purchaseCost.toString() : "");
        data.put("Useful Life (Years)", usefulLifeYears != null ? usefulLifeYears.toString() : "");
        data.put("Depreciation Method", depreciationMethod != null ? depreciationMethod.name() : "");
        data.put("Warranty Provider", warrantyProvider != null ? warrantyProvider : "");
        data.put("Warranty Contract Number", warrantyContractNumber != null ? warrantyContractNumber : "");
        data.put("Warranty Start Date", warrantyStartDate != null ? warrantyStartDate.toString() : "");
        data.put("Warranty Coverage Type", warrantyCoverageType != null ? warrantyCoverageType.name() : "");
        data.put("Warranty Terms", warrantyTerms != null ? warrantyTerms : "");
        return data;
    }

    /**
     * Serialises the per-row failures as a JSON array string for the audit log. Hand-rolled
     * instead of a full ObjectMapper so the audit trail has no Jackson dependency.
     */
    private String failuresToJson(List<EquipmentImportSummary.RowFailure> failures) {
        if (failures == null || failures.isEmpty()) {
            return null;
        }
        StringBuilder json = new StringBuilder("[");
        for (int index = 0; index < failures.size(); index++) {
            EquipmentImportSummary.RowFailure failure = failures.get(index);
            if (index > 0) {
                json.append(',');
            }
            json.append('{')
                    .append("\"rowNumber\":").append(failure.getRowNumber())
                    .append(",\"reason\":\"").append(escapeJson(failure.getReason())).append('"')
                    .append(",\"rowData\":\"").append(escapeJson(failure.getRowData())).append('"')
                    .append('}');
        }
        return json.append(']').toString();
    }

    private String escapeJson(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    /**
     * Output of the shared parse-and-validate pass: what the import would persist, what it would
     * reject, and a preview of the valid rows for the dry-run screen.
     */
    private static class ParsedImport {
        final List<Equipment> equipmentToSave;
        final List<EquipmentImportSummary.RowFailure> failures;
        final List<EquipmentImportPreviewResponse.PreviewRow> validRows;
        final int successCount;
        final int failureCount;

        ParsedImport(
                List<Equipment> equipmentToSave,
                List<EquipmentImportSummary.RowFailure> failures,
                List<EquipmentImportPreviewResponse.PreviewRow> validRows,
                int successCount,
                int failureCount) {
            this.equipmentToSave = equipmentToSave;
            this.failures = failures;
            this.validRows = validRows;
            this.successCount = successCount;
            this.failureCount = failureCount;
        }
    }

    /**
     * Parses one CSV record.
     *
     * <p>Delegates to {@link CsvSupport#parseLine(String)}. The previous implementation toggled a
     * boolean on every quote and never emitted the character, so the RFC 4180 escape {@code ""}
     * toggled twice and was deleted: {@code "Monitor 15"" Display"} parsed as
     * {@code Monitor 15 Display}.</p>
     */
    private List<String> parseCsvLine(String line) {
        return CsvSupport.parseLine(line);
    }

    private String blankToNull(String value) {
        return value == null || value.trim().isEmpty() ? null : value.trim();
    }

    private String getFieldValue(List<String> fields, List<String> headers, String columnName) {
        for (int i = 0; i < headers.size(); i++) {
            if (headers.get(i).equalsIgnoreCase(columnName)) {
                if (i < fields.size()) {
                    return fields.get(i);
                }
            }
        }
        return null;
    }

    /**
     * Exports the caller's inventory as RFC 4180 CSV.
     *
     * <p>Every field goes through {@link CsvSupport#encodeField(Object)}, which quotes and escapes
     * as required and neutralises spreadsheet formulas. The previous implementation concatenated
     * raw values with commas, so an asset named "Ventilator, Portable" produced eight fields under
     * a seven-column header and shifted every column after it.</p>
     *
     * <p>The column set matches {@link #EQUIPMENT_CSV_HEADERS}, which is also what the import
     * accepts, so a file exported here can be fed straight back into
     * {@link #importEquipmentFromCsv}.</p>
     *
     * @param username authenticated user's username
     * @return UTF-8 encoded CSV, prefixed with a byte order mark for Excel
     */
    public byte[] exportEquipmentCsv(String username) {
        Hospital hospital = getHospitalForUser(username);
        List<Equipment> equipmentList = equipmentRepository.findByHospitalId(hospital.getId());

        StringBuilder csv = new StringBuilder(CsvSupport.UTF8_BOM);
        csv.append(CsvSupport.encodeRow((Object[]) EQUIPMENT_CSV_HEADERS));

        for (Equipment equipment : equipmentList) {
            csv.append(CsvSupport.encodeRow(
                    equipment.getEquipmentCode(),
                    equipment.getName(),
                    equipment.getModel(),
                    equipment.getSerialNumber(),
                    equipment.getDepartment(),
                    // Enum constants, not display names. The import accepts both, so the round
                    // trip works either way, but the constant is the stable identifier.
                    equipment.getCategory(),
                    equipment.getStatus(),
                    equipment.getPurchaseDate(),
                    equipment.getWarrantyExpiry(),
                    // Depreciation & valuation columns, so an export can feed an accounting
                    // package or round-trip through the import without losing the finance data.
                    equipment.getPurchaseCost(),
                    equipment.getUsefulLifeYears(),
                    equipment.getDepreciationMethod(),
                    // Warranty & service contract columns (issue #703), so the report export
                    // carries the full coverage picture and round-trips through the import.
                    equipment.getWarrantyProvider(),
                    equipment.getWarrantyContractNumber(),
                    equipment.getWarrantyStartDate(),
                    equipment.getWarrantyCoverageType(),
                    equipment.getWarrantyTerms()));
        }

        return csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    /**
     * Archives (soft deletes) an equipment record.
     * Sets deleted = true, deletedAt, and deletedBy instead of hard deleting.
     */
    @Transactional
    public Equipment archiveEquipment(Long id, String username) {
        Hospital hospital = getHospitalForUser(username);
        Equipment equipment = equipmentRepository.findByIdAndHospitalId(id, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found or you don't have access"));

        equipment.setDeleted(true);
        equipment.setDeletedAt(LocalDateTime.now());
        equipment.setDeletedBy(username);

        Equipment archived = equipmentRepository.save(equipment);

        logger.info(
                "Equipment archived | User: {} | Equipment ID: {} | Name: {}",
                username,
                archived.getId(),
                archived.getName()
        );

        return archived;
    }

    /**
     * Restores an archived equipment record.
     * Sets deleted = false, clears deletedAt and deletedBy.
     */
    @Transactional
    public Equipment restoreEquipment(Long id, String username) {
        Hospital hospital = getHospitalForUser(username);
        Equipment equipment = equipmentRepository.findByIdAndDeletedTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Archived equipment not found"));

        // Verify it belongs to the user's hospital
        if (!equipment.getHospital().getId().equals(hospital.getId())) {
            throw new ResourceNotFoundException("Archived equipment not found or you don't have access");
        }

        equipment.setDeleted(false);
        equipment.setDeletedAt(null);
        equipment.setDeletedBy(null);

        Equipment restored = equipmentRepository.save(equipment);

        logger.info(
                "Equipment restored | User: {} | Equipment ID: {} | Name: {}",
                username,
                restored.getId(),
                restored.getName()
        );

        return restored;
    }

    /**
     * Lists all archived (soft-deleted) equipment for the user's hospital.
     */
    public Page<Equipment> getArchivedEquipment(String username, Pageable pageable) {
        Hospital hospital = getHospitalForUser(username);
        return equipmentRepository.findByDeletedTrueAndHospitalId(hospital.getId(), pageable);
    }

    /**
     * Permanently deletes an archived equipment record (admin only).
     * Only callable after 90 days from archival.
     */
    @Transactional
    public void permanentlyDeleteEquipment(Long id, String username) {
        Equipment equipment = equipmentRepository.findByIdAndDeletedTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Archived equipment not found"));

        // Check if 90 days have passed since archival
        if (equipment.getDeletedAt() != null && equipment.getDeletedAt().isAfter(LocalDateTime.now().minusDays(90))) {
            throw new IllegalStateException("Equipment cannot be permanently deleted until 90 days after archival");
        }

        equipmentRepository.delete(equipment);

        logger.info(
                "Equipment permanently deleted | User: {} | Equipment ID: {} | Name: {}",
                username,
                id,
                equipment.getName()
        );
    }
}