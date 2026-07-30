package com.medtrack.architecture;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Fails when two Spring-managed types in different packages share a simple name without an explicit
 * bean name.
 *
 * <p>Spring derives a bean name from the simple class name alone, ignoring the package. Two
 * interfaces called {@code ComplianceAuditReportRepository} — one in
 * {@code com.medtrack.auth.compliance.repository}, one in
 * {@code com.medtrack.auth.governance.repository} — therefore both claimed the bean name
 * {@code complianceAuditReportRepository}, and the application context refused to refresh:</p>
 *
 * <pre>
 * BeanDefinitionOverrideException: Invalid bean definition with name
 * 'complianceAuditReportRepository' defined in
 * com.medtrack.auth.governance.repository.ComplianceAuditReportRepository ... since there is
 * already [...] defined in
 * com.medtrack.auth.compliance.repository.ComplianceAuditReportRepository bound.
 * </pre>
 *
 * <p>Nothing catches this at compile time. Every {@code @SpringBootTest} in the project failed with
 * a context-load error, and the application could not start — a failure whose message points at two
 * files that individually look completely correct.</p>
 *
 * <p>Given how many parallel security subsystems this codebase carries, name reuse across packages
 * is likely to recur. Adding a distinct bean name to the annotation resolves it:
 * {@code @Repository("governanceComplianceAuditReportRepository")}.</p>
 */
@DisplayName("Spring bean name uniqueness")
class BeanNameUniquenessTest {

    /**
     * Stereotypes whose default bean name is derived from the simple class name. A parenthesised
     * argument means an explicit name was supplied, which resolves any collision.
     */
    private static final Pattern UNNAMED_STEREOTYPE = Pattern.compile(
            "@(Repository|Service|Component|Controller|RestController|Configuration)\\s*(?:\\(\\s*\\))?\\s*(?:\\r?\\n|$)");

    /** {@code @Entity} without an explicit {@code name} attribute. */
    private static final Pattern UNNAMED_ENTITY =
            Pattern.compile("@Entity\\s*(?:\\(\\s*\\))?\\s*(?:\\r?\\n|$)");

    @Test
    @DisplayName("no two Spring-managed types share a simple name without an explicit bean name")
    void noDuplicateBeanNames() {
        Map<String, List<String>> byTypeName = new LinkedHashMap<>();

        for (Path source : mainJavaSources()) {
            String body = stripComments(read(source));
            if (!UNNAMED_STEREOTYPE.matcher(body).find()) {
                continue;
            }
            String typeName = source.getFileName().toString().replace(".java", "");
            byTypeName.computeIfAbsent(typeName, key -> new ArrayList<>())
                    .add(relativise(source));
        }

        List<String> collisions = byTypeName.entrySet().stream()
                .filter(entry -> entry.getValue().size() > 1)
                .map(entry -> "  bean name '%s%s' claimed by:%n%s".formatted(
                        Character.toLowerCase(entry.getKey().charAt(0)),
                        entry.getKey().substring(1),
                        entry.getValue().stream()
                                .map(path -> "      " + path)
                                .collect(Collectors.joining("\n"))))
                .collect(Collectors.toList());

        assertTrue(collisions.isEmpty(), () -> """
                %d duplicate bean name(s) found.

                Spring derives a bean name from the simple class name and ignores the package, so
                these definitions overwrite one another and the application context fails to
                refresh with BeanDefinitionOverrideException. That takes down every
                @SpringBootTest and the application itself.

                Fix by giving one of them an explicit name, e.g.
                @Repository("governanceComplianceAuditReportRepository").

                %s""".formatted(collisions.size(), String.join("\n", collisions)));
    }

    @Test
    @DisplayName("no two @Entity classes share a JPA entity name")
    void noDuplicateEntityNames() {
        Map<String, List<String>> byTypeName = new LinkedHashMap<>();

        for (Path source : mainJavaSources()) {
            String body = stripComments(read(source));
            // An @Entity(name = "...") supplies an explicit entity name and cannot collide.
            if (!UNNAMED_ENTITY.matcher(body).find()) {
                continue;
            }
            String typeName = source.getFileName().toString().replace(".java", "");
            byTypeName.computeIfAbsent(typeName, key -> new ArrayList<>()).add(relativise(source));
        }

        List<String> collisions = byTypeName.entrySet().stream()
                .filter(entry -> entry.getValue().size() > 1)
                .map(entry -> "  entity name '%s' claimed by:%n%s".formatted(
                        entry.getKey(),
                        entry.getValue().stream()
                                .map(path -> "      " + path)
                                .collect(Collectors.joining("\n"))))
                .collect(Collectors.toList());

        assertTrue(collisions.isEmpty(), () -> """
                %d duplicate JPA entity name(s) found.

                Hibernate derives an entity name from the simple class name and ignores the package,
                so these mappings collide and the EntityManagerFactory fails to build with
                DuplicateMappingException - taking down the application and every @SpringBootTest.

                Fix by giving one of them an explicit name, e.g.
                @Entity(name = "GovernanceComplianceAuditReport"), and check that they do not also
                share a @Table.

                %s""".formatted(collisions.size(), String.join("\n", collisions)));
    }

    @Test
    @DisplayName("the scan actually found Spring-managed types")
    void scanFoundSpringManagedTypes() {
        long annotated = mainJavaSources().stream()
                .filter(source -> UNNAMED_STEREOTYPE.matcher(stripComments(read(source))).find())
                .count();

        assertTrue(annotated > 50, () ->
                "Only found " + annotated + " Spring-managed type(s) under " + mainJavaRoot()
                        + ". A pattern or path change would make the collision check vacuous.");
    }

    // ---------------------------------------------------------------------
    // helpers
    // ---------------------------------------------------------------------

    /**
     * Removes comments so their contents are never mistaken for live configuration.
     *
     * <p>Line comments are stripped <em>before</em> block comments, and the order matters. An API
     * path written in a line comment - {@code // /api/auth/scim/**, ...} - contains the character
     * sequence that opens a block comment. Stripping blocks first treats that as the start of a
     * comment and swallows the rest of the file up to the next {@code *}{@code /}, which silently
     * empties the parse. The {@code parserFoundThePermitAllBlock} assertion below exists because
     * this exact mistake was made while writing this test.</p>
     */
    private static String stripComments(String source) {
        // A regex block-comment strip is unsafe here: Ant-style path patterns such as
        // "/swagger-ui/**" contain the character sequence that opens a block comment, so a naive
        // strip swallows the rest of the file and silently empties the parse instead of failing
        // loudly. Scanning with string-literal awareness is the only reliable approach; the
        // "did the scan find anything" assertions above exist because this mistake was made
        // while writing these tests.
        StringBuilder out = new StringBuilder(source.length());
        int index = 0;
        int length = source.length();

        while (index < length) {
            char current = source.charAt(index);

            if (current == '"') {
                int end = index + 1;
                while (end < length) {
                    if (source.charAt(end) == '\\') {
                        end += 2;
                        continue;
                    }
                    if (source.charAt(end) == '"') {
                        break;
                    }
                    end++;
                }
                out.append(source, index, Math.min(end + 1, length));
                index = end + 1;
                continue;
            }

            if (current == '/' && index + 1 < length && source.charAt(index + 1) == '/') {
                while (index < length && source.charAt(index) != '\n') {
                    index++;
                }
                continue;
            }

            if (current == '/' && index + 1 < length && source.charAt(index + 1) == '*') {
                int end = source.indexOf("*/", index + 2);
                index = end < 0 ? length : end + 2;
                continue;
            }

            out.append(current);
            index++;
        }

        return out.toString();
    }

    private static List<Path> mainJavaSources() {
        Path root = mainJavaRoot();
        try (Stream<Path> paths = Files.walk(root)) {
            return paths.filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().endsWith(".java"))
                    .sorted()
                    .collect(Collectors.toList());
        } catch (IOException e) {
            throw new UncheckedIOException("Unable to walk the backend source tree at " + root, e);
        }
    }

    private static Path mainJavaRoot() {
        Path fromModule = Paths.get("src", "main", "java").toAbsolutePath().normalize();
        if (Files.isDirectory(fromModule)) {
            return fromModule;
        }
        Path fromRepositoryRoot = Paths.get("Backend", "src", "main", "java")
                .toAbsolutePath().normalize();
        if (Files.isDirectory(fromRepositoryRoot)) {
            return fromRepositoryRoot;
        }
        throw new IllegalStateException("Could not locate src/main/java from working directory "
                + Paths.get("").toAbsolutePath());
    }

    private static String relativise(Path source) {
        return mainJavaRoot().relativize(source).toString();
    }

    private static String read(Path source) {
        try {
            return Files.readString(source, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("Unable to read " + source, e);
        }
    }
}
