package com.medtrack.util;

/**
 * Normalised string similarity for duplicate detection (issue #746).
 *
 * <p>Comparison is deliberately lossy before it is numeric: inputs are trimmed, lower-cased and
 * stripped of non-alphanumerics so "MRI-Scanner- 001", "mri scanner 001" and "MRI Scanner 001"
 * all compare equal despite the typos, stray spaces and case differences the strict-uniqueness
 * check misses.</p>
 */
public final class StringSimilarity {

    private StringSimilarity() {
    }

    /** Collapses input to lower-case alphanumerics with single interior spaces. */
    public static String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.trim()
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", " ")
                .trim();
    }

    /**
     * Similarity in {@code [0, 1]}, 1.0 meaning identical (normalised). Both-empty pairs score 0,
     * so an absent serial never looks like a match.
     */
    public static double similarity(String left, String right) {
        String a = normalize(left);
        String b = normalize(right);
        if (a.isEmpty() || b.isEmpty()) {
            return 0.0;
        }
        if (a.equals(b)) {
            return 1.0;
        }
        int distance = levenshtein(a, b);
        int maxLength = Math.max(a.length(), b.length());
        return maxLength == 0 ? 0.0 : 1.0 - ((double) distance / maxLength);
    }

    /** Classic iterative Levenshtein edit distance. */
    static int levenshtein(String a, String b) {
        int[] previous = new int[b.length() + 1];
        int[] current = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) {
            previous[j] = j;
        }
        for (int i = 1; i <= a.length(); i++) {
            current[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                int substitutionCost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                current[j] = Math.min(
                        Math.min(current[j - 1] + 1, previous[j] + 1),
                        previous[j - 1] + substitutionCost);
            }
            int[] swap = previous;
            previous = current;
            current = swap;
        }
        return previous[b.length()];
    }
}