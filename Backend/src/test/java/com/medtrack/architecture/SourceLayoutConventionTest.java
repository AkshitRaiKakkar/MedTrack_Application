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
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Guards the physical layout of {@code src/main/java} against the class of defect that took the
 * backend build down.
 *
 * <p>Two defects on {@code main} were individually trivial but collectively catastrophic:</p>
 * <ul>
 *   <li>{@code auth/commandcenter/model/SecurityUnifiedAlert.java} carried two {@code package}
 *       declarations, a copy-paste leftover.</li>
 *   <li>{@code specifications/EquipmentSpecifications.java} declared
 *       {@code package com.medtrack.specification} (singular) while living in
 *       {@code com/medtrack/specifications} (plural), and declared
 *       {@code public class EquipmentSpecification} inside a file named
 *       {@code EquipmentSpecifications.java}.</li>
 * </ul>
 *
 * <p>Both are rejected during javac's <em>enter</em> phase, which happens before annotation
 * processing. Lombok therefore never ran, every {@code @Data}/{@code @Builder} accessor in the
 * project vanished, and the compiler emitted 400+ downstream {@code cannot find symbol} errors that
 * pointed at completely healthy files. The signal-to-noise ratio made the real cause very hard to
 * locate.</p>
 *
 * <p>These checks are deliberately plain file inspection rather than a bytecode-based tool: they
 * must be able to report on sources that <em>do not compile</em>, which is precisely the situation
 * they exist to diagnose.</p>
 */
@DisplayName("src/main/java layout conventions")
class SourceLayoutConventionTest {

    private static final String ROOT_PACKAGE = "com.medtrack";

    /**
     * Matches a {@code package} declaration at the start of a line. Occurrences inside block
     * comments and string literals are excluded by {@link #stripCommentsAndStrings(String)} before
     * this pattern is applied.
     */
    private static final Pattern PACKAGE_DECLARATION =
            Pattern.compile("^\\s*package\\s+([A-Za-z_][A-Za-z0-9_.]*)\\s*;", Pattern.MULTILINE);

    /**
     * Matches the declaration of a public top-level type. {@code sealed}, {@code non-sealed},
     * {@code abstract} and {@code final} modifiers may appear between {@code public} and the
     * type keyword.
     */
    private static final Pattern PUBLIC_TYPE_DECLARATION = Pattern.compile(
            "^\\s*public\\s+(?:(?:abstract|final|sealed|non-sealed|static|strictfp)\\s+)*"
                    + "(?:class|interface|enum|record|@interface)\\s+([A-Za-z_$][A-Za-z0-9_$]*)",
            Pattern.MULTILINE);

    @Test
    @DisplayName("every source file declares exactly one package")
    void everySourceFileDeclaresExactlyOnePackage() {
        Map<Path, Integer> offenders = new LinkedHashMap<>();

        for (Path source : mainJavaSources()) {
            int declarations = countPackageDeclarations(read(source));
            if (declarations != 1) {
                offenders.put(source, declarations);
            }
        }

        assertTrue(offenders.isEmpty(), () -> """
                %d source file(s) do not declare exactly one package.

                A file with two package declarations is a hard parse error. javac aborts the
                compilation round before annotation processing, so Lombok never generates
                accessors and hundreds of unrelated files report 'cannot find symbol'.

                %s""".formatted(
                offenders.size(),
                offenders.entrySet().stream()
                        .map(entry -> "  %s -> %d package declaration(s)"
                                .formatted(relativise(entry.getKey()), entry.getValue()))
                        .collect(Collectors.joining("\n"))));
    }

    @Test
    @DisplayName("declared package matches the directory the file lives in")
    void declaredPackageMatchesDirectory() {
        List<String> offenders = new ArrayList<>();
        Path sourceRoot = mainJavaRoot();

        for (Path source : mainJavaSources()) {
            String declared = firstPackageDeclaration(read(source));
            if (declared == null) {
                // Absence of a package declaration is reported by the previous test; skip here so
                // a single defect does not produce two failures.
                continue;
            }

            String expected = sourceRoot.relativize(source.getParent())
                    .toString()
                    .replace(java.io.File.separatorChar, '.');

            if (!declared.equals(expected)) {
                offenders.add("  %s%n      declares : %s%n      expected : %s"
                        .formatted(relativise(source), declared, expected));
            }
        }

        assertTrue(offenders.isEmpty(), () -> """
                %d source file(s) declare a package that does not match their directory.

                javac reports this as 'class X is public, should be declared in a file named X.java'
                or silently places the type in an unreachable package, and either way the type
                cannot be imported by the rest of the module.

                %s""".formatted(offenders.size(), String.join("\n", offenders)));
    }

    @Test
    @DisplayName("public top-level type name matches its file name")
    void publicTypeNameMatchesFileName() {
        List<String> offenders = new ArrayList<>();

        for (Path source : mainJavaSources()) {
            String fileName = source.getFileName().toString();
            String expectedType = fileName.substring(0, fileName.length() - ".java".length());
            if ("package-info".equals(expectedType) || "module-info".equals(expectedType)) {
                continue;
            }

            String declared = firstPublicTypeName(read(source));
            if (declared != null && !declared.equals(expectedType)) {
                offenders.add("  %s%n      declares public type : %s%n      file name requires  : %s"
                        .formatted(relativise(source), declared, expectedType));
            }
        }

        assertTrue(offenders.isEmpty(), () -> """
                %d source file(s) declare a public type whose name does not match the file name.

                This is a compile error in the enter phase, which aborts annotation processing for
                the whole module.

                %s""".formatted(offenders.size(), String.join("\n", offenders)));
    }

    @Test
    @DisplayName("all sources live under the com.medtrack root package")
    void allSourcesLiveUnderRootPackage() {
        List<String> offenders = new ArrayList<>();

        for (Path source : mainJavaSources()) {
            String declared = firstPackageDeclaration(read(source));
            if (declared != null
                    && !declared.equals(ROOT_PACKAGE)
                    && !declared.startsWith(ROOT_PACKAGE + ".")) {
                offenders.add("  %s -> %s".formatted(relativise(source), declared));
            }
        }

        assertTrue(offenders.isEmpty(), () -> """
                %d source file(s) sit outside the %s root package.

                Spring Boot component scanning is anchored at the %s package by
                MedTrackApplication, so beans declared elsewhere are never registered and fail at
                runtime with NoSuchBeanDefinitionException rather than at build time.

                %s""".formatted(offenders.size(), ROOT_PACKAGE, ROOT_PACKAGE,
                String.join("\n", offenders)));
    }

    @Test
    @DisplayName("the source tree is actually being scanned")
    void sourceTreeIsNonEmpty() {
        List<Path> sources = mainJavaSources();
        assertTrue(sources.size() > 100, () ->
                "Expected to scan the full backend source tree but only found " + sources.size()
                        + " file(s) under " + mainJavaRoot() + ". A path resolution change would "
                        + "make every other assertion in this class vacuously true.");
    }

    // ---------------------------------------------------------------------
    // helpers
    // ---------------------------------------------------------------------

    private static int countPackageDeclarations(String source) {
        Matcher matcher = PACKAGE_DECLARATION.matcher(stripCommentsAndStrings(source));
        int count = 0;
        while (matcher.find()) {
            count++;
        }
        return count;
    }

    private static String firstPackageDeclaration(String source) {
        Matcher matcher = PACKAGE_DECLARATION.matcher(stripCommentsAndStrings(source));
        return matcher.find() ? matcher.group(1) : null;
    }

    private static String firstPublicTypeName(String source) {
        Matcher matcher = PUBLIC_TYPE_DECLARATION.matcher(stripCommentsAndStrings(source));
        return matcher.find() ? matcher.group(1) : null;
    }

    /**
     * Replaces comment and string-literal content with spaces, preserving line structure so that
     * the {@code MULTILINE} anchors in the patterns above keep working.
     *
     * <p>Without this, a Javadoc block such as {@code "package com.example;"} inside a class
     * comment would be counted as a real declaration.</p>
     */
    private static String stripCommentsAndStrings(String source) {
        StringBuilder out = new StringBuilder(source.length());
        int index = 0;
        int length = source.length();

        while (index < length) {
            char current = source.charAt(index);

            if (current == '/' && index + 1 < length && source.charAt(index + 1) == '/') {
                while (index < length && source.charAt(index) != '\n') {
                    out.append(' ');
                    index++;
                }
                continue;
            }

            if (current == '/' && index + 1 < length && source.charAt(index + 1) == '*') {
                int end = source.indexOf("*/", index + 2);
                int stop = end == -1 ? length : end + 2;
                for (int i = index; i < stop; i++) {
                    out.append(source.charAt(i) == '\n' ? '\n' : ' ');
                }
                index = stop;
                continue;
            }

            if (current == '"' || current == '\'') {
                char quote = current;
                out.append(' ');
                index++;
                while (index < length) {
                    char inner = source.charAt(index);
                    if (inner == '\\') {
                        out.append("  ");
                        index += 2;
                        continue;
                    }
                    out.append(inner == '\n' ? '\n' : ' ');
                    index++;
                    if (inner == quote) {
                        break;
                    }
                }
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

    /**
     * Resolves {@code src/main/java}. Surefire runs with the module directory as the working
     * directory, but IDEs sometimes use the repository root, so both layouts are accepted.
     */
    private static Path mainJavaRoot() {
        Path fromModule = Paths.get("src", "main", "java").toAbsolutePath().normalize();
        if (Files.isDirectory(fromModule)) {
            return fromModule;
        }
        Path fromRepositoryRoot = Paths.get("Backend", "src", "main", "java")
                .toAbsolutePath()
                .normalize();
        if (Files.isDirectory(fromRepositoryRoot)) {
            return fromRepositoryRoot;
        }
        throw new IllegalStateException(
                "Could not locate src/main/java from working directory "
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
