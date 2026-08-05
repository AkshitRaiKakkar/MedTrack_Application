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
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Guards the Flyway migration set against the mistake that produced this test.
 *
 * <p>{@code V7__add_vulnerability_policy_sla_columns.sql} ran
 * {@code ALTER TABLE vulnerability_policies ADD COLUMN ...} against a table no migration has ever
 * created. The entire security-subsystem schema is built by {@code hibernate.ddl-auto=update}, and
 * Flyway runs <em>before</em> Hibernate, so there is no version number at which that migration could
 * succeed:</p>
 *
 * <pre>
 * FlywaySqlScriptException: Failed to execute script V7__add_vulnerability_policy_sla_columns.sql
 * SQL State  : 42S02
 * Message    : Table "VULNERABILITY_POLICIES" not found
 * </pre>
 *
 * <p>Only {@code maintenance_tasks} and {@code equipment} are Flyway-managed today. A migration that
 * touches any other table is a mistake, and it is an easy one to make: the two halves of the change
 * that introduced it looked symmetrical, and the difference — that {@code equipment} is referenced by
 * V1 and V3 while {@code vulnerability_policies} is referenced nowhere — is not visible from the
 * file being written.</p>
 *
 * <p>This test also checks the two vendor directories stay in step, since a migration present for
 * one vendor and absent for the other diverges the schemas silently.</p>
 */
@DisplayName("Flyway migration consistency")
class FlywayMigrationConsistencyTest {

    /**
     * Tables that Flyway is responsible for.
     *
     * <p>Deliberately an explicit allowlist rather than something derived. Adding a table here is a
     * decision to bring it under migration control, which means writing its {@code CREATE TABLE}
     * first — exactly the step that was skipped.</p>
     */
    private static final Set<String> FLYWAY_MANAGED_TABLES = Set.of(
            "maintenance_tasks",
            "maintenance_task_activities",
            "maintenance_schedule_revisions",
            "equipment",
            "maintenance_policy_rules",
            "maintenance_generation_runs",
            "equipment_lifecycle_actions",
            "operations_events",
            "event_read_receipts",
            "procurement_requests",
            "approval_policies",
            "approval_policy_steps",
            "approval_steps",
            "supplier_quotes",
            "receiving_records",
            "invoice_match_records",
            "procurement_audit_logs",
            "equipment_import_audit_logs",
            "equipment_disposals");

    private static final Pattern TABLE_REFERENCE = Pattern.compile(
            "\\b(?:ALTER\\s+TABLE|CREATE\\s+TABLE|INSERT\\s+INTO|UPDATE|CREATE\\s+INDEX\\s+\\w+\\s+ON|"
                    + "DROP\\s+TABLE)\\s+(?:IF\\s+(?:NOT\\s+)?EXISTS\\s+)?[`\"]?(\\w+)[`\"]?",
            Pattern.CASE_INSENSITIVE);

    @Test
    @DisplayName("no migration touches a table Flyway does not manage")
    void migrationsOnlyTouchManagedTables() {
        List<String> offenders = new ArrayList<>();

        for (Path migration : migrationScripts()) {
            String sql = stripSqlComments(read(migration));
            for (String table : referencedTables(sql)) {
                if (!FLYWAY_MANAGED_TABLES.contains(table)) {
                    offenders.add("  %s references '%s'".formatted(relativise(migration), table));
                }
            }
        }

        assertTrue(offenders.isEmpty(), () -> """
                %d migration reference(s) target a table Flyway does not manage.

                Only %s are created by migrations. Every other table in this schema - including all
                of the security-subsystem tables - is created by hibernate.ddl-auto=update, and
                Flyway runs before Hibernate. An ALTER against one of those fails outright with
                "Table ... not found", taking the whole migration suite down.

                If a table genuinely should be Flyway-managed, add its CREATE TABLE migration first
                and then add it to FLYWAY_MANAGED_TABLES in this test.

                %s""".formatted(offenders.size(), FLYWAY_MANAGED_TABLES, String.join("\n", offenders)));
    }

    @Test
    @DisplayName("every vendor directory assigns each version to exactly one migration")
    void everyVendorDirectoryUsesUniqueVersions() {
        List<String> offenders = new ArrayList<>();

        for (String vendor : vendors()) {
            Map<Integer, List<MigrationScript>> scriptsByVersion = migrationScriptsIn(vendor).stream()
                    .collect(Collectors.groupingBy(MigrationScript::version));

            scriptsByVersion.entrySet().stream()
                    .filter(entry -> entry.getValue().size() > 1)
                    .sorted(Map.Entry.comparingByKey())
                    .forEach(entry -> offenders.add("%s V%d: %s".formatted(vendor, entry.getKey(),
                            entry.getValue().stream()
                                    .map(MigrationScript::filename)
                                    .sorted()
                                    .collect(Collectors.joining(", ")))));
        }

        assertTrue(offenders.isEmpty(), () -> """
                Flyway migration versions must be unique within each vendor directory.

                Flyway cannot choose between two SQL scripts with the same version, so it aborts
                startup before applying any schema change. Assign a new sequential version to the
                later migration in each conflicting pair, and make the equivalent rename in the
                other vendor directory.

                Conflicting versions:
                %s""".formatted(String.join("\n", offenders)));
    }

    @Test
    @DisplayName("both vendor directories carry the same ordered migration identities")
    void vendorDirectoriesAreInStep() {
        List<MigrationIdentity> h2 = migrationIdentitiesIn("h2");
        List<MigrationIdentity> mysql = migrationIdentitiesIn("mysql");

        Set<MigrationIdentity> onlyH2 = new LinkedHashSet<>(h2);
        onlyH2.removeAll(mysql);
        Set<MigrationIdentity> onlyMysql = new LinkedHashSet<>(mysql);
        onlyMysql.removeAll(h2);

        assertTrue(onlyH2.isEmpty() && onlyMysql.isEmpty(), () -> """
                The h2 and mysql migration directories have diverged.

                spring.flyway.locations is classpath:db/migration/{vendor}, so a missing migration
                or a different description at the same version makes the environments diverge.
                Compare complete version-description identities rather than versions alone: a Set
                of version numbers silently hides duplicate-version collisions.

                Only in h2   : %s
                Only in mysql: %s""".formatted(
                onlyH2, onlyMysql));
    }

    @Test
    @DisplayName("migration versions are contiguous from V1")
    void versionsAreContiguous() {
        for (String vendor : vendors()) {
            List<Integer> versions = migrationScriptsIn(vendor).stream()
                    .map(MigrationScript::version)
                    .sorted()
                    .toList();

            assertTrue(!versions.isEmpty(), "no " + vendor + " migrations found; the path resolution has drifted");

            for (int index = 0; index < versions.size(); index++) {
                assertEquals(index + 1, versions.get(index),
                        vendor + " migration versions must run V1..Vn with no gaps, but found " + versions
                                + ". Flyway rejects an out-of-order version unless "
                                + "spring.flyway.out-of-order is enabled, so a gap left for a migration "
                                + "that lands later will fail on deployments that already ran the "
                                + "higher version.");
            }
        }
    }

    @Test
    @DisplayName("the scan actually found the migrations")
    void scanFoundMigrations() {
        List<Path> scripts = migrationScripts();
        assertTrue(scripts.size() >= 2, () ->
                "Only found " + scripts.size() + " migration script(s) under " + migrationRoot()
                        + ". A path change would make the checks above vacuous.");
    }

    // ---------------------------------------------------------------------
    // helpers
    // ---------------------------------------------------------------------

    private static Set<String> referencedTables(String sql) {
        Set<String> tables = new LinkedHashSet<>();
        Matcher matcher = TABLE_REFERENCE.matcher(sql);
        while (matcher.find()) {
            tables.add(matcher.group(1).toLowerCase(Locale.ROOT));
        }
        return tables;
    }

    private static List<MigrationScript> migrationScriptsIn(String vendor) {
        Path directory = migrationRoot().resolve(vendor);
        try (Stream<Path> paths = Files.list(directory)) {
            return paths.filter(Files::isRegularFile)
                    .map(MigrationScript::from)
                    .sorted(Comparator.comparingInt(MigrationScript::version)
                            .thenComparing(MigrationScript::description))
                    .toList();
        } catch (IOException e) {
            throw new UncheckedIOException("Unable to list migrations in " + directory, e);
        }
    }

    private static List<MigrationIdentity> migrationIdentitiesIn(String vendor) {
        return migrationScriptsIn(vendor).stream()
                .map(script -> new MigrationIdentity(script.version(), script.description()))
                .toList();
    }

    private static Collection<String> vendors() {
        return List.of("h2", "mysql");
    }

    /**
     * Strips SQL comments so the explanatory prose in each migration - which names tables - is not
     * mistaken for a statement.
     */
    private static String stripSqlComments(String sql) {
        return sql
                .replaceAll("(?m)^\\s*--.*$", "")
                .replaceAll("(?s)/\\*.*?\\*/", "");
    }

    private static List<Path> migrationScripts() {
        try (Stream<Path> paths = Files.walk(migrationRoot())) {
            return paths.filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().endsWith(".sql"))
                    .sorted()
                    .collect(Collectors.toList());
        } catch (IOException e) {
            throw new UncheckedIOException("Unable to walk " + migrationRoot(), e);
        }
    }

    private static Path migrationRoot() {
        Path relative = Paths.get("src", "main", "resources", "db", "migration");
        Path fromModule = relative.toAbsolutePath().normalize();
        if (Files.isDirectory(fromModule)) {
            return fromModule;
        }
        Path fromRepositoryRoot = Paths.get("Backend").resolve(relative).toAbsolutePath().normalize();
        if (Files.isDirectory(fromRepositoryRoot)) {
            return fromRepositoryRoot;
        }
        throw new IllegalStateException("Could not locate db/migration from working directory "
                + Paths.get("").toAbsolutePath());
    }

    private static String relativise(Path script) {
        return migrationRoot().relativize(script).toString();
    }

    private static String read(Path script) {
        try {
            return Files.readString(script, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("Unable to read " + script, e);
        }
    }

    private record MigrationIdentity(int version, String description) {
    }

    private record MigrationScript(int version, String description, String filename) {
        private static MigrationScript from(Path path) {
            String filename = path.getFileName().toString();
            int separator = filename.indexOf("__");
            if (!filename.matches("V[1-9]\\d*__.+\\.sql") || separator < 2) {
                throw new IllegalStateException("Invalid Flyway migration filename: " + path);
            }

            return new MigrationScript(
                    Integer.parseInt(filename.substring(1, separator)),
                    filename.substring(separator + 2, filename.length() - ".sql".length()),
                    filename);
        }
    }
}
