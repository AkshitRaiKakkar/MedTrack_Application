
package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.dto.EquipmentImportPreviewResponse;
import com.medtrack.dto.EquipmentImportSummary;
import com.medtrack.dto.EquipmentValuationResponse;
import com.medtrack.model.DepreciationMethod;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentImportAuditLog;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentImportAuditLogRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EquipmentServiceTest {

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EquipmentImportAuditLogRepository equipmentImportAuditLogRepository;

    @InjectMocks
    private EquipmentService equipmentService;

    private User mockUser;
    private Hospital mockHospital;
    private Equipment mockEquipment;
    private final String username = "hospital_admin";

    @BeforeEach
    void setUp() {
        mockUser = User.builder()
                .id(1L)
                .username(username)
                .email("hospital@medtrack.com")
                .build();

        mockHospital = Hospital.builder()
                .id(10L)
                .name("General Hospital")
                .user(mockUser)
                .build();

        mockEquipment = Equipment.builder()
                .id(100L)
                .name("MRI Scanner")
                .model("Siemens A1")
                .serialNumber("SN-12345")
                .department("Radiology")
                .category(com.medtrack.model.EquipmentCategory.IMAGING)
                .status(EquipmentStatus.ACTIVE)
                .purchaseDate(LocalDate.of(2025, 1, 1))
                .equipmentCode("EQ-100")
                .hospital(mockHospital)
                .build();
    }

    @Test
    void getAllEquipment_Success() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));
        when(equipmentRepository.findByHospitalId(mockHospital.getId())).thenReturn(Collections.singletonList(mockEquipment));

        List<Equipment> result = equipmentService.getAllEquipment(username);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("MRI Scanner", result.get(0).getName());
        verify(equipmentRepository).findByHospitalId(mockHospital.getId());
    }

    @Test
    void getEquipmentById_Success() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));
        when(equipmentRepository.findByIdAndHospitalId(100L, mockHospital.getId())).thenReturn(Optional.of(mockEquipment));

        Equipment result = equipmentService.getEquipmentById(100L, username);

        assertNotNull(result);
        assertEquals("MRI Scanner", result.getName());
    }

    @Test
    void addEquipment_AutoGeneratesCode() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));
        
        Equipment newEq = Equipment.builder()
                .name("Ventilator")
                .department("ICU")
                .build();

        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Equipment saved = equipmentService.addEquipment(newEq, username);

        assertNotNull(saved);
        assertNotNull(saved.getEquipmentCode());
        assertTrue(saved.getEquipmentCode().startsWith("EQ-"));
        assertEquals(mockHospital, saved.getHospital());
    }

    @Test
    void generateQrCodeBase64_Success() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));
        when(equipmentRepository.findByIdAndHospitalId(100L, mockHospital.getId())).thenReturn(Optional.of(mockEquipment));

        String base64Qr = equipmentService.generateQrCodeBase64(100L, username);

        assertNotNull(base64Qr);
        assertFalse(base64Qr.isEmpty());
        // Verify it looks like Base64 (valid characters)
        assertTrue(base64Qr.matches("^[a-zA-Z0-9+/\\s=]+$"));
    }

    @Test
    void importEquipmentFromCsv_Success() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));

        String csvContent = "Name,Model,Serial Number,Department,Category,Status,Purchase Date\n" +
                "Ventilator,V-200,SN-9988,ICU,Respiratory,Operational,2026-03-15\n" +
                "Ultrasound,U-500,SN-7766,Cardiology,Imaging,Maintenance,2025-11-20\n";

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "equipment.csv",
                "text/csv",
                csvContent.getBytes()
        );

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(file, username);

        assertNotNull(summary);
        assertEquals(2, summary.getSuccessCount());
        assertEquals(0, summary.getFailureCount());
        assertTrue(summary.getFailures().isEmpty());

        verify(equipmentRepository).saveAll(anyList());
    }

    @Test
    void importEquipmentFromCsv_WithValidationFailures() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));

        // Row 2: Missing Name (Required)
        // Row 3: Missing Department (Required)
        // Row 4: Invalid Category
        // Row 5: Invalid Status
        // Row 6: Malformed Purchase Date
        String csvContent = "Name,Model,Serial Number,Department,Category,Status,Purchase Date\n" +
                ",Model A,SN-1,Radiology,Imaging,Operational,2026-01-01\n" +
                "X-Ray,Model B,SN-2,,Imaging,Operational,2026-01-01\n" +
                "MRI,Model C,SN-3,Radiology,InvalidCategory,Operational,2026-01-01\n" +
                "Ventilator,Model D,SN-4,ICU,Respiratory,BrokenStatus,2026-01-01\n" +
                "Stethoscope,Model E,SN-5,Cardiology,Imaging,Operational,2026/01/01\n";

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "equipment.csv",
                "text/csv",
                csvContent.getBytes()
        );

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(file, username);

        assertNotNull(summary);
        assertEquals(0, summary.getSuccessCount());
        assertEquals(5, summary.getFailureCount());
        assertEquals(5, summary.getFailures().size());

        // Assert failure details
        assertEquals(2, summary.getFailures().get(0).getRowNumber());
        assertTrue(summary.getFailures().get(0).getReason().contains("Asset Name is required"));

        assertEquals(3, summary.getFailures().get(1).getRowNumber());
        assertTrue(summary.getFailures().get(1).getReason().contains("Department is required"));

        assertEquals(4, summary.getFailures().get(2).getRowNumber());
        assertTrue(summary.getFailures().get(2).getReason().contains("Invalid category"));

        assertEquals(5, summary.getFailures().get(3).getRowNumber());
        assertTrue(summary.getFailures().get(3).getReason().contains("Invalid condition/status"));

        assertEquals(6, summary.getFailures().get(4).getRowNumber());
        assertTrue(summary.getFailures().get(4).getReason().contains("Invalid Purchase Date format"));

        verify(equipmentRepository, never()).saveAll(anyList());
    }

    @Test
    void importEquipmentFromCsv_DuplicateSerialWithinFile_RejectsSecondRowOnly() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));
        when(equipmentRepository.findBySerialNumber(any())).thenReturn(Optional.empty());

        String csvContent = "Name,Model,Serial Number,Department,Category,Status,Purchase Date\n" +
                "Ventilator,V-200,SN-DUP,ICU,Respiratory,Operational,2026-01-01\n" +
                "Ultrasound,U-500,SN-DUP,Cardiology,Imaging,Operational,2026-01-01\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "equipment.csv", "text/csv", csvContent.getBytes());

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(file, username);

        assertEquals(1, summary.getSuccessCount());
        assertEquals(1, summary.getFailureCount());
        assertEquals(3, summary.getFailures().get(0).getRowNumber());
        assertTrue(summary.getFailures().get(0).getReason().contains("Duplicate Serial Number within this file"));

        // The valid first row must still be imported, not the whole batch dropped.
        ArgumentCaptor<List<Equipment>> savedCaptor = ArgumentCaptor.forClass(List.class);
        verify(equipmentRepository).saveAll(savedCaptor.capture());
        assertEquals(1, savedCaptor.getValue().size());
        assertEquals("SN-DUP", savedCaptor.getValue().get(0).getSerialNumber());
    }

    @Test
    void importEquipmentFromCsv_SerialAlreadyInDatabase_RejectsRow() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));
        when(equipmentRepository.findBySerialNumber("SN-12345")).thenReturn(Optional.of(mockEquipment));

        String csvContent = "Name,Model,Serial Number,Department,Category,Status,Purchase Date\n" +
                "Ventilator,V-200,SN-12345,ICU,Respiratory,Operational,2026-01-01\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "equipment.csv", "text/csv", csvContent.getBytes());

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(file, username);

        assertEquals(0, summary.getSuccessCount());
        assertEquals(1, summary.getFailureCount());
        assertTrue(summary.getFailures().get(0).getReason().contains("Serial Number already exists in inventory"));
        verify(equipmentRepository, never()).saveAll(anyList());
    }

    @Test
    void importEquipmentFromCsv_BlankSerialNumbers_AreNotTreatedAsDuplicatesOfEachOther() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));

        String csvContent = "Name,Model,Serial Number,Department,Category,Status,Purchase Date\n" +
                "Ventilator,V-200,,ICU,Respiratory,Operational,2026-01-01\n" +
                "Ultrasound,U-500,,Cardiology,Imaging,Operational,2026-01-01\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "equipment.csv", "text/csv", csvContent.getBytes());

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(file, username);

        assertEquals(2, summary.getSuccessCount());
        assertEquals(0, summary.getFailureCount());
        verify(equipmentRepository, never()).findBySerialNumber(any());
    }

    @Test
    void importEquipmentFromCsv_EmptyFile_ThrowsException() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "empty.csv",
                "text/csv",
                new byte[0]
        );

        assertThrows(IllegalArgumentException.class, () ->
                equipmentService.importEquipmentFromCsv(file, username)
        );
    }

    @Test
    void importEquipmentFromCsv_WritesAuditLogEntry() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));

        String csvContent = "Name,Model,Serial Number,Department,Category,Status,Purchase Date\n" +
                "Ventilator,V-200,SN-9988,ICU,Respiratory,Operational,2026-03-15\n" +
                ",Model A,SN-1,Radiology,Imaging,Operational,2026-01-01\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "equipment.csv", "text/csv", csvContent.getBytes());

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(file, username);

        assertEquals(1, summary.getSuccessCount());
        assertEquals(1, summary.getFailureCount());

        ArgumentCaptor<EquipmentImportAuditLog> logCaptor = ArgumentCaptor.forClass(EquipmentImportAuditLog.class);
        verify(equipmentImportAuditLogRepository).save(logCaptor.capture());
        EquipmentImportAuditLog log = logCaptor.getValue();
        assertEquals(mockHospital.getId(), log.getHospitalId());
        assertEquals(username, log.getActor());
        assertEquals("equipment.csv", log.getFilename());
        assertEquals(2, log.getTotalRows());
        assertEquals(1, log.getSuccessCount());
        assertEquals(1, log.getFailureCount());
        assertTrue(log.getFailures().contains("rowNumber"));
        assertTrue(log.getFailures().contains("Asset Name is required"));
    }

    @Test
    void previewEquipmentImport_ReturnsValidRowsAndFailures_WithoutSaving() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));

        String csvContent = "Name,Model,Serial Number,Department,Category,Status,Purchase Date\n" +
                "Ventilator,V-200,SN-9988,ICU,Respiratory,Operational,2026-03-15\n" +
                ",Model A,SN-1,Radiology,Imaging,Operational,2026-01-01\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "equipment.csv", "text/csv", csvContent.getBytes());

        EquipmentImportPreviewResponse preview =
                equipmentService.previewEquipmentImport(file, username);

        assertNotNull(preview);
        assertEquals(2, preview.getTotalRows());
        assertEquals(1, preview.getValidCount());
        assertEquals(1, preview.getFailureCount());
        assertEquals(1, preview.getValidRows().size());
        assertEquals("Ventilator", preview.getValidRows().get(0).getData().get("Name"));
        assertEquals("ICU", preview.getValidRows().get(0).getData().get("Department"));
        assertEquals(3, preview.getFailures().get(0).getRowNumber());
        assertTrue(preview.getFailures().get(0).getReason().contains("Asset Name is required"));

        // A dry run must never touch the database: no saves, no audit entry.
        verify(equipmentRepository, never()).saveAll(anyList());
        verify(equipmentRepository, never()).save(any(Equipment.class));
        verify(equipmentImportAuditLogRepository, never()).save(any());
    }

    @Test
    void previewEquipmentImport_ValidRowsCarryRowNumbers() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));

        String csvContent = "Name,Model,Serial Number,Department,Category,Status,Purchase Date\n" +
                "Ventilator,V-200,SN-9988,ICU,Respiratory,Operational,2026-03-15\n" +
                "Ultrasound,U-500,SN-7766,Cardiology,Imaging,Maintenance,2025-11-20\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "equipment.csv", "text/csv", csvContent.getBytes());

        EquipmentImportPreviewResponse preview =
                equipmentService.previewEquipmentImport(file, username);

        assertEquals(2, preview.getValidRows().size());
        assertEquals(2, preview.getValidRows().get(0).getRowNumber());
        assertEquals(3, preview.getValidRows().get(1).getRowNumber());
        assertEquals("RESPIRATORY", preview.getValidRows().get(0).getData().get("Category"));
        assertEquals("IMAGING", preview.getValidRows().get(1).getData().get("Category"));
        assertEquals("Operational", preview.getValidRows().get(0).getData().get("Status"));
        assertEquals("Maintenance", preview.getValidRows().get(1).getData().get("Status"));
    }

    @Test
    void updateEquipment_Success() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));
        when(equipmentRepository.findByIdAndHospitalId(100L, mockHospital.getId())).thenReturn(Optional.of(mockEquipment));
        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Equipment updatedDetails = Equipment.builder()
                .name("Updated MRI")
                .model("Siemens A2")
                .serialNumber("SN-12345-UPD")
                .department("Cardiology")
                .status(EquipmentStatus.UNDER_MAINTENANCE)
                .purchaseDate(LocalDate.of(2025, 2, 2))
                .build();

        Equipment result = equipmentService.updateEquipment(100L, updatedDetails, username);

        assertNotNull(result);
        assertEquals("Updated MRI", result.getName());
        assertEquals("Siemens A2", result.getModel());
        assertEquals("SN-12345-UPD", result.getSerialNumber());
        assertEquals("Cardiology", result.getDepartment());
        // status is an EquipmentStatus enum, not a String. This assertion predates that migration.
        assertEquals(com.medtrack.model.EquipmentStatus.UNDER_MAINTENANCE, result.getStatus());
        assertEquals(LocalDate.of(2025, 2, 2), result.getPurchaseDate());

        verify(equipmentRepository).save(mockEquipment);
    }

    @Test
    void updateEquipment_NotFoundOrNoAccess_ThrowsException() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));
        when(equipmentRepository.findByIdAndHospitalId(999L, mockHospital.getId())).thenReturn(Optional.empty());

        Equipment updatedDetails = Equipment.builder().name("Updated MRI").build();

        assertThrows(ResourceNotFoundException.class, () ->
                equipmentService.updateEquipment(999L, updatedDetails, username)
        );

        verify(equipmentRepository, never()).save(any());
    }

    @Test
    void importEquipmentFromCsv_ParsesDepreciationColumns() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));

        // 12-column CSV matching EQUIPMENT_CSV_HEADERS, exercising the finance columns.
        String csvContent = "Equipment Code,Name,Model,Serial Number,Department,Category,Status,Purchase Date,Warranty Expiry,Purchase Cost,Useful Life (Years),Depreciation Method\n" +
                "EQ-200,Ventilator,V-200,SN-9988,ICU,Respiratory,Operational,2026-03-15,2031-03-15,125000.50,8,declining balance\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "equipment.csv", "text/csv", csvContent.getBytes());

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(file, username);

        assertEquals(1, summary.getSuccessCount());
        assertEquals(0, summary.getFailureCount());

        ArgumentCaptor<List<Equipment>> savedCaptor = ArgumentCaptor.forClass(List.class);
        verify(equipmentRepository).saveAll(savedCaptor.capture());
        Equipment saved = savedCaptor.getValue().get(0);
        assertEquals(new BigDecimal("125000.50"), saved.getPurchaseCost());
        assertEquals(8, saved.getUsefulLifeYears());
        assertEquals(DepreciationMethod.DECLINING_BALANCE, saved.getDepreciationMethod());
        // The export always writes a code, so a round trip must keep it, not mint a new one.
        assertEquals("EQ-200", saved.getEquipmentCode());
    }

    @Test
    void importEquipmentFromCsv_BlankDepreciationMethod_DefaultsToStraightLine() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));

        // Old 7-column files still import: finance columns are optional and default sensibly.
        String csvContent = "Name,Model,Serial Number,Department,Category,Status,Purchase Date\n" +
                "Ventilator,V-200,SN-9988,ICU,Respiratory,Operational,2026-03-15\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "equipment.csv", "text/csv", csvContent.getBytes());

        equipmentService.importEquipmentFromCsv(file, username);

        ArgumentCaptor<List<Equipment>> savedCaptor = ArgumentCaptor.forClass(List.class);
        verify(equipmentRepository).saveAll(savedCaptor.capture());
        Equipment saved = savedCaptor.getValue().get(0);
        assertNull(saved.getPurchaseCost());
        assertNull(saved.getUsefulLifeYears());
        assertEquals(DepreciationMethod.STRAIGHT_LINE, saved.getDepreciationMethod());
    }

    @Test
    void importEquipmentFromCsv_InvalidFinanceColumns_FailRowOnly() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));

        // Row 2: negative purchase cost; Row 3: non-numeric useful life; Row 4: unknown method.
        String csvContent = "Name,Model,Serial Number,Department,Category,Status,Purchase Date,Purchase Cost,Useful Life (Years),Depreciation Method\n" +
                "A,Model A,SN-1,Radiology,Imaging,Operational,2026-01-01,-5,10,STRAIGHT_LINE\n" +
                "B,Model B,SN-2,ICU,Respiratory,Operational,2026-01-01,1000,ten,STRAIGHT_LINE\n" +
                "C,Model C,SN-3,Cardiology,Imaging,Operational,2026-01-01,1000,10,UNIT_DECREASE\n" +
                "D,Model D,SN-4,ER,Monitoring,Operational,2026-01-01,5000,5,DECLINING_BALANCE\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "equipment.csv", "text/csv", csvContent.getBytes());

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(file, username);

        assertEquals(1, summary.getSuccessCount());
        assertEquals(3, summary.getFailureCount());
        assertTrue(summary.getFailures().get(0).getReason().contains("Invalid Purchase Cost"));
        assertTrue(summary.getFailures().get(1).getReason().contains("Invalid Useful Life"));
        assertTrue(summary.getFailures().get(2).getReason().contains("Invalid Depreciation Method"));
    }

    @Test
    void exportEquipmentCsv_IncludesFinanceColumns() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));
        when(equipmentRepository.findByHospitalId(mockHospital.getId()))
                .thenReturn(Collections.singletonList(mockEquipment));

        mockEquipment.setPurchaseCost(new BigDecimal("250000.00"));
        mockEquipment.setUsefulLifeYears(10);
        mockEquipment.setDepreciationMethod(DepreciationMethod.STRAIGHT_LINE);

        byte[] csvBytes = equipmentService.exportEquipmentCsv(username);
        String csv = new String(csvBytes, StandardCharsets.UTF_8);

        String headerLine = csv.lines().findFirst().orElse("");
        assertTrue(headerLine.contains("Purchase Cost"));
        assertTrue(headerLine.contains("Useful Life (Years)"));
        assertTrue(headerLine.contains("Depreciation Method"));
        assertTrue(csv.contains("250000.00"));
        assertTrue(csv.contains("10"));
        assertTrue(csv.contains("STRAIGHT_LINE"));
    }

    @Test
    void getEquipmentValuation_AggregatesFleet() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));

        mockEquipment.setPurchaseCost(new BigDecimal("100000.00"));
        mockEquipment.setUsefulLifeYears(10);
        mockEquipment.setDepreciationMethod(DepreciationMethod.STRAIGHT_LINE);

        Equipment untracked = Equipment.builder()
                .id(101L)
                .name("Freezer")
                .department("Lab")
                .category(com.medtrack.model.EquipmentCategory.LABORATORY)
                .status(EquipmentStatus.ACTIVE)
                .equipmentCode("EQ-101")
                .hospital(mockHospital)
                .build();

        when(equipmentRepository.findByHospitalId(mockHospital.getId()))
                .thenReturn(List.of(mockEquipment, untracked));

        EquipmentValuationResponse valuation = equipmentService.getEquipmentValuation(username);

        // The untracked asset still counts towards the fleet but contributes no money.
        assertEquals(2, valuation.getAssetCount());
        assertEquals(1, valuation.getAssetsWithCost());
        assertEquals(new BigDecimal("100000.00"), valuation.getTotalPurchaseCost());

        // Purchased 2025-01-01 with a 10-year life, it has depreciated but not fully.
        assertTrue(valuation.getTotalBookValue().compareTo(BigDecimal.ZERO) > 0);
        assertTrue(valuation.getTotalBookValue().compareTo(new BigDecimal("100000.00")) < 0);
        assertEquals(0, valuation.getFullyDepreciatedCount());

        // Replacement cost must exceed the purchase price under positive inflation.
        assertTrue(valuation.getTotalReplacementCost().compareTo(new BigDecimal("100000.00")) > 0);

        assertEquals(new BigDecimal("100000.00"),
                valuation.getPurchaseCostByCategory().get("IMAGING"));
        assertEquals(valuation.getTotalBookValue(),
                valuation.getBookValueByCategory().get("IMAGING"));

        assertEquals(1, valuation.getTopAssetsByBookValue().size());
        assertEquals("MRI Scanner", valuation.getTopAssetsByBookValue().get(0).getName());
        assertEquals(new BigDecimal("100000.00"),
                valuation.getTopAssetsByBookValue().get(0).getPurchaseCost());
        assertEquals("Radiology",
                valuation.getTopAssetsByBookValue().get(0).getDepartment());
    }

    @Test
    void getEquipmentValuation_FullyDepreciatedAndTopFive() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));

        // 12-year-old asset with a 5-year life: fully written off.
        Equipment old = Equipment.builder()
                .id(200L)
                .name("Old Defibrillator")
                .department("ER")
                .category(com.medtrack.model.EquipmentCategory.MONITORING)
                .status(EquipmentStatus.ACTIVE)
                .purchaseDate(LocalDate.now().minusYears(12))
                .purchaseCost(new BigDecimal("5000"))
                .usefulLifeYears(5)
                .depreciationMethod(DepreciationMethod.STRAIGHT_LINE)
                .equipmentCode("EQ-200")
                .hospital(mockHospital)
                .build();

        List<Equipment> inventory = new java.util.ArrayList<>();
        for (int i = 0; i < 7; i++) {
            inventory.add(Equipment.builder()
                    .id(300L + i)
                    .name("Asset " + i)
                    .department("ICU")
                    .category(com.medtrack.model.EquipmentCategory.OTHER)
                    .status(EquipmentStatus.ACTIVE)
                    .purchaseDate(LocalDate.now().minusYears(1))
                    .purchaseCost(new BigDecimal("10000"))
                    .usefulLifeYears(10)
                    .depreciationMethod(DepreciationMethod.STRAIGHT_LINE)
                    .equipmentCode("EQ-3" + i)
                    .hospital(mockHospital)
                    .build());
        }
        inventory.add(old);

        when(equipmentRepository.findByHospitalId(mockHospital.getId())).thenReturn(inventory);

        EquipmentValuationResponse valuation = equipmentService.getEquipmentValuation(username);

        assertEquals(8, valuation.getAssetCount());
        assertEquals(8, valuation.getAssetsWithCost());
        assertEquals(1, valuation.getFullyDepreciatedCount());
        // 7 assets at $10,000 plus the written-off $5,000.
        assertEquals(new BigDecimal("75000.00"), valuation.getTotalPurchaseCost());
        // Only the most valuable five make the dashboard table.
        assertEquals(5, valuation.getTopAssetsByBookValue().size());
        assertEquals("Asset 0", valuation.getTopAssetsByBookValue().get(0).getName());
    }
}
