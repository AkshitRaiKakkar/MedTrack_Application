package com.medtrack.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Runs the real migration set against a throwaway H2 schema and asserts the soft-delete migration
 * lands the columns it claims to.
 *
 * <p>The migration this covers previously failed outright:</p>
 *
 * <pre>
 * FlywaySqlScriptException: Failed to execute script V8__add_soft_delete_columns.sql
 * SQL State  : 42S02
 * Message    : Table "EQUIPMENT_ORDERS" not found
 * </pre>
 *
 * <p>{@code equipment_orders} is created by {@code hibernate.ddl-auto=update} and Flyway runs before
 * Hibernate, so the table does not exist when the script executes. Because Flyway aborts the whole
 * run on the first failing statement, that one bad {@code ALTER} also prevented the {@code equipment}
 * and {@code maintenance_tasks} columns in the same script from ever being applied - the migration
 * delivered <em>nothing</em>, not merely two thirds of what it promised.</p>
 *
 * <p>{@link com.medtrack.architecture.FlywayMigrationConsistencyTest} catches the same class of
 * mistake by reading the SQL. This test catches it by running it, which is the check that would have
 * failed even if someone had added {@code equipment_orders} to that allowlist without also writing
 * its {@code CREATE TABLE}.</p>
 */
@DisplayName("soft delete migration")
class SoftDeleteMigrationIntegrationTest {

    private static final Set<String> EXPECTED_COLUMNS =
            new LinkedHashSet<>(Set.of("DELETED", "DELETED_AT", "DELETED_BY"));

    /**
     * Creates the two Flyway-managed tables in the shape they have before V1, then migrates.
     *
     * <p>Deliberately does <em>not</em> create {@code equipment_orders}: that is precisely the state
     * a real deployment is in when Flyway runs, and recreating it here would hide the defect.</p>
     */
    private String migratedSchema() throws SQLException {
        String url = "jdbc:h2:mem:softdelete-" + UUID.randomUUID()
                + ";MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE";

        try (Connection connection = DriverManager.getConnection(url, "sa", "");
             Statement statement = connection.createStatement()) {
            statement.execute("""
                    CREATE TABLE equipment (
                        id BIGINT PRIMARY KEY,
                        equipment_code VARCHAR(255) UNIQUE,
                        hospital_id BIGINT
                    )
                    """);
            statement.execute("""
                    CREATE TABLE users (
                        id BIGINT PRIMARY KEY,
                        email VARCHAR(255) UNIQUE
                    )
                    """);
            statement.execute("""
                    CREATE TABLE maintenance_tasks (
                        id BIGINT PRIMARY KEY,
                        equipment_id VARCHAR(255),
                        hospital_id BIGINT,
                        status VARCHAR(255),
                        assigned_technician VARCHAR(255)
                    )
                    """);
            statement.execute(
                    "INSERT INTO equipment (id, equipment_code, hospital_id) VALUES (10, 'EQ-1001', 7)");
            statement.execute(
                    "INSERT INTO users (id, email) VALUES (20, 'tech@medtrack.com')");
            statement.execute("""
                    INSERT INTO maintenance_tasks (
                        id, equipment_id, hospital_id, status, assigned_technician
                    )
                    VALUES (100, 'EQ-1001', 7, 'In Progress', 'tech@medtrack.com')
                    """);
        }

        Flyway.configure()
                .dataSource(url, "sa", "")
                .locations("classpath:db/migration/h2")
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .load()
                .migrate();

        return url;
    }

    private Set<String> columnsOf(String url, String table) throws SQLException {
        Set<String> columns = new LinkedHashSet<>();
        try (Connection connection = DriverManager.getConnection(url, "sa", "")) {
            DatabaseMetaData metaData = connection.getMetaData();
            try (ResultSet resultSet = metaData.getColumns(null, null, table.toUpperCase(), null)) {
                while (resultSet.next()) {
                    columns.add(resultSet.getString("COLUMN_NAME").toUpperCase());
                }
            }
        }
        return columns;
    }

    @Test
    @DisplayName("completes against a schema that has no equipment_orders table")
    void migratesWithoutEquipmentOrders() throws SQLException {
        String url = migratedSchema();

        // Reaching here at all is the assertion: a single failing statement aborts the entire Flyway
        // run, so an ALTER against a table Hibernate has not created yet takes every other migration
        // in the script down with it.
        assertFalse(columnsOf(url, "equipment").isEmpty(),
                "the migration run must have completed and left the equipment table in place");
    }

    @Test
    @DisplayName("adds the soft delete columns to equipment")
    void addsSoftDeleteColumnsToEquipment() throws SQLException {
        Set<String> columns = columnsOf(migratedSchema(), "equipment");

        for (String expected : EXPECTED_COLUMNS) {
            assertTrue(columns.contains(expected),
                    () -> "equipment is missing " + expected + "; present columns: " + columns);
        }
    }

    @Test
    @DisplayName("adds the soft delete columns to maintenance_tasks")
    void addsSoftDeleteColumnsToMaintenanceTasks() throws SQLException {
        Set<String> columns = columnsOf(migratedSchema(), "maintenance_tasks");

        for (String expected : EXPECTED_COLUMNS) {
            assertTrue(columns.contains(expected),
                    () -> "maintenance_tasks is missing " + expected + "; present columns: " + columns);
        }
    }

    @Test
    @DisplayName("defaults existing rows to not-deleted rather than null")
    void existingRowsDefaultToNotDeleted() throws SQLException {
        String url = migratedSchema();

        try (Connection connection = DriverManager.getConnection(url, "sa", "");
             Statement statement = connection.createStatement()) {

            // The rows were inserted before the column existed, so the DEFAULT has to be what
            // backfills them. A NULL here would make `deleted = false` skip every pre-existing
            // record - the entire inventory would read as archived.
            try (ResultSet resultSet = statement.executeQuery(
                    "SELECT COUNT(*) FROM equipment WHERE deleted = FALSE")) {
                resultSet.next();
                assertEquals(1, resultSet.getInt(1),
                        "the pre-existing equipment row must read as not deleted");
            }
            try (ResultSet resultSet = statement.executeQuery(
                    "SELECT COUNT(*) FROM maintenance_tasks WHERE deleted = FALSE")) {
                resultSet.next();
                assertEquals(1, resultSet.getInt(1),
                        "the pre-existing maintenance row must read as not deleted");
            }
        }
    }

    @Test
    @DisplayName("leaves equipment_orders to Hibernate")
    void doesNotTouchEquipmentOrders() throws SQLException {
        String url = migratedSchema();

        assertTrue(columnsOf(url, "equipment_orders").isEmpty(),
                "equipment_orders must not be created or altered by Flyway; it is managed by "
                        + "hibernate.ddl-auto=update, which runs after Flyway");
    }
}
