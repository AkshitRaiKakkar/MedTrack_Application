package com.medtrack.util;

import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.io.source.ByteArrayOutputStream;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.medtrack.model.EquipmentDisposal;
import com.medtrack.model.EquipmentDisposalMethod;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Certificate of disposal PDF (issue #744).
 *
 * <p>Generated once a decommissioning record is completed and a certificate number has been
 * minted. Documents the asset, the disposal method and reason, the data-sanitisation state and
 * the approval chain - the paper trail auditors expect under HIPAA-aligned data handling.</p>
 */
@Component
public class DisposalCertificatePdf {

    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public byte[] generate(EquipmentDisposal disposal) {
        if (disposal == null) {
            throw new IllegalArgumentException("Disposal record is required to generate the certificate");
        }

        PdfFont boldFont = font(StandardFonts.HELVETICA_BOLD);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(outputStream);
        PdfDocument pdfDocument = new PdfDocument(writer);

        try (Document document = new Document(pdfDocument)) {
            document.add(new Paragraph("CERTIFICATE OF DISPOSAL")
                    .setFont(boldFont)
                    .setFontSize(18)
                    .setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("MedTrack Equipment Decommissioning Record")
                    .setFontSize(11)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(18));

            Table table = new Table(UnitValue.createPercentArray(new float[]{35, 65}))
                    .useAllAvailableWidth();
            addRow(table, "Certificate Number", disposal.getCertificateNumber(), boldFont);
            addRow(table, "Asset ID", disposal.getEquipment().getId(), boldFont);
            addRow(table, "Equipment Code", disposal.getEquipment().getEquipmentCode(), boldFont);
            addRow(table, "Equipment Name", disposal.getEquipment().getName(), boldFont);
            addRow(table, "Serial Number", disposal.getEquipment().getSerialNumber(), boldFont);
            addRow(table, "Model", disposal.getEquipment().getModel(), boldFont);
            addRow(table, "Department", disposal.getEquipment().getDepartment(), boldFont);
            addRow(table, "Disposal Method", methodLabel(disposal.getDisposalMethod()), boldFont);
            addRow(table, "Disposal Reason", disposal.getDisposalReason(), boldFont);
            addRow(table, "Effective Date", formatDate(disposal.getEffectiveDate()), boldFont);
            addRow(table, "Stored Patient / Operational Data",
                    Boolean.TRUE.equals(disposal.getStoresPatientData()) ? "Yes" : "No", boldFont);
            addRow(table, "Data Sanitisation Confirmed",
                    Boolean.TRUE.equals(disposal.getDataSanitizationConfirmed())
                            ? "Yes" + (disposal.getDataSanitizedAt() != null
                                    ? " - " + DATE_TIME_FORMATTER.format(disposal.getDataSanitizedAt()) : "")
                            : "No", boldFont);
            addRow(table, "Data Sanitisation Details", disposal.getDataSanitizationDetails(), boldFont);
            addRow(table, "Requested By", disposal.getRequestedBy(), boldFont);
            addRow(table, "Approved By", disposal.getApprovedBy(), boldFont);
            addRow(table, "Completed By", disposal.getCompletedBy(), boldFont);
            addRow(table, "Completed At", formatDateTime(disposal.getCompletedAt()), boldFont);
            addRow(table, "Notes", disposal.getNotes(), boldFont);
            document.add(table);

            document.add(new Paragraph(
                    "This certificate verifies that the above asset was decommissioned through the "
                            + "MedTrack retirement / disposal workflow and that its full history remains "
                            + "preserved for audit and compliance purposes.")
                    .setFontSize(9)
                    .setFontColor(ColorConstants.GRAY)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(18));
            document.add(new Paragraph("Generated by MedTrack Equipment Lifecycle Service - " + LocalDateTime.now())
                    .setFontSize(9)
                    .setFontColor(ColorConstants.GRAY)
                    .setTextAlignment(TextAlignment.CENTER));
        }

        return outputStream.toByteArray();
    }

    private void addRow(Table table, String label, Object value, PdfFont boldFont) {
        table.addCell(new Cell()
                .add(new Paragraph(label).setFont(boldFont))
                .setBackgroundColor(ColorConstants.LIGHT_GRAY)
                .setBorder(new SolidBorder(ColorConstants.GRAY, 0.5f)));
        table.addCell(new Cell()
                .add(new Paragraph(valueOrDefault(value)))
                .setBorder(new SolidBorder(ColorConstants.GRAY, 0.5f)));
    }

    private String methodLabel(EquipmentDisposalMethod method) {
        return method == null ? "N/A" : method.name().replace('_', ' ').toLowerCase();
    }

    private String formatDate(java.time.LocalDate date) {
        return date == null ? "N/A" : DATE_FORMATTER.format(date);
    }

    private String formatDateTime(LocalDateTime dateTime) {
        return dateTime == null ? "N/A" : DATE_TIME_FORMATTER.format(dateTime);
    }

    private String valueOrDefault(Object value) {
        return value == null ? "N/A" : value.toString();
    }

    private PdfFont font(String standardFont) {
        try {
            return PdfFontFactory.createFont(standardFont);
        } catch (IOException e) {
            throw new RuntimeException("Could not create PDF font", e);
        }
    }
}
