package com.medtrack.service;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.auth.service.KafkaEventPublisher;
import com.medtrack.dto.DataSanitizationRequest;
import com.medtrack.dto.EquipmentDisposalRequest;
import com.medtrack.dto.EquipmentDisposalResponse;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.EquipmentDisposalMethod;
import com.medtrack.model.EquipmentDisposalStatus;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The retirement / disposal workflow end to end (issue #744): request with method and reason,
 * manager approval, data-sanitisation confirmation for devices that stored patient data, and
 * completion - which retires the asset, mints the certificate number and generates the PDF.
 */
@SpringBootTest(properties = {
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration",
        "spring.datasource.url=jdbc:h2:mem:disposal-service-tests;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.data-initializer.enabled=false"
})
@Transactional
@DisplayName("equipment disposal workflow")
class EquipmentDisposalWorkflowTest {

    @MockitoBean
    private KafkaEventPublisher kafkaEventPublisher;

    @Autowired
    private EquipmentDisposalService disposalService;

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private UserRepository userRepository;

    private String username;
    private Hospital hospital;

    @BeforeEach
    void setUp() {
        username = "disposal-owner-" + UUID.randomUUID();

        User owner = userRepository.save(User.builder()
                .name("Disposal Owner")
                .username(username)
                .email(UUID.randomUUID() + "@medtrack.test")
                .password("irrelevant-but-at-least-six")
                .role("hospital")
                .phone("+1 (555) 000-0001")
                .organization("Disposal Trust")
                .accountStatus(AccountStatus.ACTIVE)
                .build());

        hospital = hospitalRepository.save(Hospital.builder()
                .name("Disposal Trust")
                .location("Test City")
                .user(owner)
                .build());
    }

    private Equipment liveAsset(String code) {
        return equipmentRepository.saveAndFlush(Equipment.builder()
                .equipmentCode(code)
                .name("Asset " + code)
                .department("Radiology")
                .category(EquipmentCategory.IMAGING)
                .status(EquipmentStatus.ACTIVE)
                .hospital(hospital)
                .build());
    }

    private EquipmentDisposalRequest request(EquipmentDisposalMethod method, boolean storesPatientData) {
        EquipmentDisposalRequest request = new EquipmentDisposalRequest();
        request.setDisposalMethod(method);
        request.setDisposalReason("End of useful life");
        request.setStoresPatientData(storesPatientData);
        return request;
    }

    @Test
    @DisplayName("a request starts pending approval with method and reason recorded")
    void requestCreatesPendingApprovalRecord() {
        Equipment asset = liveAsset("EQ-DISP-1");

        EquipmentDisposalResponse disposal =
                disposalService.requestDisposal(asset.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);

        assertEquals(EquipmentDisposalStatus.PENDING_APPROVAL, disposal.getStatus());
        assertEquals(EquipmentDisposalMethod.SCRAP, disposal.getDisposalMethod());
        assertEquals("End of useful life", disposal.getDisposalReason());
        assertEquals(username, disposal.getRequestedBy());
        assertEquals(asset.getId(), disposal.getEquipmentId());
    }

    @Test
    @DisplayName("a second open request for the same asset is rejected")
    void duplicateOpenRequestIsRejected() {
        Equipment asset = liveAsset("EQ-DISP-2");
        disposalService.requestDisposal(asset.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);

        assertThrows(IllegalArgumentException.class,
                () -> disposalService.requestDisposal(
                        asset.getId(), request(EquipmentDisposalMethod.SALE, false), username));
    }

    @Test
    @DisplayName("completing a data-bearing device without sanitisation confirmation is blocked")
    void completionRequiresDataSanitisationForDataBearingDevices() {
        Equipment asset = liveAsset("EQ-DISP-3");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SCRAP, true), username);

        disposalService.approveDisposal(disposal.getId(), username);

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> disposalService.completeDisposal(disposal.getId(), username));
        assertTrue(error.getMessage().contains("Data sanitisation must be confirmed"));
    }

    @Test
    @DisplayName("approve, sanitise, complete retires the asset and mints the certificate")
    void fullWorkflowRetiresAssetAndMintsCertificate() {
        Equipment asset = liveAsset("EQ-DISP-4");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.DONATION, true), username);

        EquipmentDisposalResponse approved = disposalService.approveDisposal(disposal.getId(), username);
        assertEquals(EquipmentDisposalStatus.APPROVED, approved.getStatus());
        assertEquals(username, approved.getApprovedBy());
        assertNotNull(approved.getApprovedAt());

        DataSanitizationRequest sanitization = new DataSanitizationRequest();
        sanitization.setDetails("Drives removed and destroyed");
        EquipmentDisposalResponse sanitised =
                disposalService.recordDataSanitization(disposal.getId(), sanitization, username);
        assertTrue(sanitised.getDataSanitizationConfirmed());
        assertEquals(username, sanitised.getDataSanitizedBy());
        assertNotNull(sanitised.getDataSanitizedAt());

        EquipmentDisposalResponse completed = disposalService.completeDisposal(disposal.getId(), username);
        assertEquals(EquipmentDisposalStatus.COMPLETED, completed.getStatus());
        assertNotNull(completed.getCertificateNumber());
        assertTrue(completed.getCertificateNumber().startsWith("DSP-"));

        Equipment retired = equipmentRepository.findById(asset.getId()).orElseThrow();
        assertEquals(EquipmentStatus.DISPOSED, retired.getStatus(),
                "the asset must leave the active inventory once the disposal is completed");
    }

    @Test
    @DisplayName("an asset without stored data completes without the sanitisation step")
    void nonDataBearingDeviceCompletesDirectly() {
        Equipment asset = liveAsset("EQ-DISP-5");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.RETURN_TO_VENDOR, false), username);

        disposalService.approveDisposal(disposal.getId(), username);
        EquipmentDisposalResponse completed = disposalService.completeDisposal(disposal.getId(), username);

        assertEquals(EquipmentDisposalStatus.COMPLETED, completed.getStatus());
        assertEquals(EquipmentStatus.DISPOSED,
                equipmentRepository.findById(asset.getId()).orElseThrow().getStatus());
    }

    @Test
    @DisplayName("the certificate of disposal is a real PDF generated for completed records only")
    void certificateIsGeneratedForCompletedRecords() {
        Equipment asset = liveAsset("EQ-DISP-6");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SALE, false), username);
        disposalService.approveDisposal(disposal.getId(), username);
        disposalService.completeDisposal(disposal.getId(), username);

        byte[] pdf = disposalService.generateCertificate(disposal.getId(), username);
        assertNotNull(pdf);
        assertTrue(pdf.length > 500, "the certificate must contain real PDF content");
        assertTrue(new String(pdf, java.nio.charset.StandardCharsets.ISO_8859_1).startsWith("%PDF"),
                "the certificate must be a PDF document");

        EquipmentDisposalResponse rejected = disposalService.requestDisposal(
                liveAsset("EQ-DISP-7").getId(), request(EquipmentDisposalMethod.SCRAP, false), username);
        assertThrows(IllegalStateException.class,
                () -> disposalService.generateCertificate(rejected.getId(), username),
                "a certificate must not exist before the disposal is completed");
    }

    @Test
    @DisplayName("retired and disposed assets appear in the retired view, not the active inventory")
    void retiredAssetsStaySearchableInTheRetiredView() {
        Equipment asset = liveAsset("EQ-DISP-8");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);
        disposalService.approveDisposal(disposal.getId(), username);
        disposalService.completeDisposal(disposal.getId(), username);

        Page<Equipment> retired = disposalService.getRetiredEquipment(username, PageRequest.of(0, 10));
        assertEquals(1, retired.getTotalElements());
        assertEquals(asset.getId(), retired.getContent().get(0).getId());
        assertFalse(retired.getContent().get(0).getDeleted(),
                "the full record must be preserved - never deleted");

        assertThrows(IllegalArgumentException.class,
                () -> disposalService.requestDisposal(
                        asset.getId(), request(EquipmentDisposalMethod.SALE, false), username),
                "a retired asset cannot be decommissioned again");
    }
}
