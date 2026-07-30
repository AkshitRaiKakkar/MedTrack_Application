# Maintenance Backend Migration and Verification

## Scope

These backend migrations make every maintenance task reference a real equipment record and add an auditable completion timestamp.

It includes:

- Flyway dependencies and vendor-specific migration locations
- legacy maintenance status normalization
- `equipment_record_id` and `hospital_id` backfill
- a non-null equipment relationship
- corrected development seed relationships
- stable empty-list API responses
- maintenance controller and migration integration tests
- server-controlled maintenance completion timestamps

## Migration Files

- `Backend/src/main/resources/db/migration/h2/V1__backfill_maintenance_equipment_relationship.sql`
- `Backend/src/main/resources/db/migration/mysql/V1__backfill_maintenance_equipment_relationship.sql`
- `Backend/src/main/resources/db/migration/h2/V2__add_maintenance_completion_timestamp.sql`
- `Backend/src/main/resources/db/migration/mysql/V2__add_maintenance_completion_timestamp.sql`
- `Backend/src/main/resources/db/migration/h2/V3__enforce_maintenance_record_integrity.sql`
- `Backend/src/main/resources/db/migration/mysql/V3__enforce_maintenance_record_integrity.sql`
- `Backend/src/main/resources/db/migration/h2/V4__link_maintenance_technician_identity.sql`
- `Backend/src/main/resources/db/migration/mysql/V4__link_maintenance_technician_identity.sql`
- `Backend/src/main/resources/db/migration/h2/V5__enforce_maintenance_status_values.sql`
- `Backend/src/main/resources/db/migration/mysql/V5__enforce_maintenance_status_values.sql`

The scripts:

1. Ensure the maintenance equipment relationship column exists.
2. Convert human-readable legacy status values to persisted enum names.
3. Match `maintenance_tasks.equipment_id` to `equipment.equipment_code`.
4. Respect an existing `hospital_id` while matching equipment.
5. Restore a missing `hospital_id` from the matched equipment record.
6. Make `equipment_record_id`, `hospital_id`, and `status` non-nullable.
7. Add a restrictive foreign key from maintenance history to equipment.
8. Add the nullable `assigned_technician_record_id` relationship.
9. Backfill technician relationships using normalized legacy assignment emails.
10. Add a user foreign key with `ON DELETE SET NULL` so historical email evidence is retained.
11. Reject unsupported legacy status values and constrain future status writes to the
    `MaintenanceStatus` enum names.

The final constraint is also a safety check. If any maintenance row cannot be matched to equipment, the migration fails instead of leaving a partially upgraded database.

Migration version `2` adds the nullable `completed_at` column. Existing completed records are intentionally not backfilled because their actual completion time cannot be derived safely. New completion transitions populate it from the server clock, and SLA reporting excludes legacy completed rows where it is null.

Migration version `3` rejects records whose hospital ownership cannot be restored and prevents
equipment deletion from orphaning maintenance history. The foreign key uses restrictive delete
behavior; maintenance evidence is never cascade-deleted with equipment.

Migration version `4` links assigned maintenance work to the stable `users.id` identity. The
existing `assigned_technician` email column is retained for API compatibility and historical
display. Backfill matching trims and lowercases both values. Unmatched assignments remain
unlinked and recoverable through the hospital assignment endpoint. Deleting a user clears only
the relationship through `ON DELETE SET NULL`; it does not erase the historical email.

Migration version `5` adds a database check constraint for `SCHEDULED`, `IN_PROGRESS`,
`NEEDS_PART`, `ON_HOLD`, and `COMPLETED`. Because version `1` already normalizes supported display
values, version `5` intentionally fails when an unsupported legacy value remains. This prevents a
single invalid row from causing Hibernate enum-conversion failures during list, history, or
analytics reads.

The database constraints make both ownership fields present and ensure that
`equipment_record_id` references real equipment, but they do not by themselves compare
`maintenance_tasks.hospital_id` with the linked equipment's `hospital_id`. Maintenance repository
queries therefore enforce both ownership paths on hospital and technician access, and the service
checks the same invariant before saving direct or recurring tasks. Operators should still repair
any inconsistent legacy rows rather than relying on them remaining inaccessible.

## Pre-deployment Checks

Back up the persistent database before enabling the migration.

Check for unmatched maintenance records:

```sql
SELECT mt.id, mt.task_code, mt.equipment_id, mt.hospital_id
FROM maintenance_tasks mt
LEFT JOIN equipment e
  ON e.equipment_code = mt.equipment_id
 AND (mt.hospital_id IS NULL OR e.hospital_id = mt.hospital_id)
WHERE mt.equipment_record_id IS NULL
  AND e.id IS NULL;
```

Every returned row must be corrected by fixing its equipment code, hospital ownership, or missing equipment record before deployment.

Check for unresolved ownership before version `3`:

```sql
SELECT id, task_code, equipment_record_id
FROM maintenance_tasks
WHERE hospital_id IS NULL OR status IS NULL;
```

Inspect legacy assignments that cannot be linked before version `4`:

```sql
SELECT mt.id, mt.task_code, mt.assigned_technician
FROM maintenance_tasks mt
LEFT JOIN users u
  ON LOWER(TRIM(u.email)) = LOWER(TRIM(mt.assigned_technician))
WHERE mt.assigned_technician IS NOT NULL
  AND u.id IS NULL;
```

These rows do not block migration. They remain visible to the owning hospital and can be linked
through the existing assignment endpoint.

Inspect the current status values:

```sql
SELECT DISTINCT status
FROM maintenance_tasks;
```

Find status values that cannot be normalized to the current enum:

```sql
SELECT id, task_code, status
FROM maintenance_tasks
WHERE status IS NULL
   OR UPPER(REPLACE(TRIM(status), ' ', '_')) NOT IN (
       'SCHEDULED',
       'IN_PROGRESS',
       'NEEDS_PART',
       'ON_HOLD',
       'COMPLETED'
   );
```

Every returned row must be corrected to one of the documented statuses before enabling migration
version `5`.

## Enabling Flyway

Flyway is disabled by default so the existing in-memory H2 development workflow can continue using Hibernate schema creation.

For an existing persistent schema:

1. Back up the database.
2. Run the unmatched-row checks above.
3. Set `FLYWAY_ENABLED=true`.
4. Start the backend and confirm Flyway reports migration version `5`.
5. Verify that every maintenance row has a non-null `equipment_record_id`.

The configuration uses `baseline-on-migrate=true` and baseline version `0`. This allows migration version `1` to run against the existing unversioned MedTrack schema.

For a completely empty database, first allow Hibernate to create the current schema with Flyway disabled. Then enable Flyway so the schema becomes versioned. A future full-schema Flyway baseline can replace this transitional bootstrap process.

## API Behavior Changes

`GET /api/maintenance` now always returns HTTP 200. When there are no tasks, its response is:

```json
[]
```

Method-level access denials are explicitly mapped to HTTP 403. This prevents `@PreAuthorize` failures from being handled by the generic runtime exception handler as HTTP 400.

The Maintenance service also reloads the caller's account for every operation. A locked, disabled,
deleted, or role-changed hospital or technician account receives HTTP 403 even if an older JWT is
otherwise still valid.

## Seed Data

`DataInitializer` now:

- creates default users using idempotent email checks
- creates a hospital profile for the default hospital user
- assigns seeded equipment to that hospital
- assigns seeded maintenance tasks to the real equipment records
- stores the matching hospital ownership key
- assigns the in-progress task to both the default technician identity and canonical email

The initializer can be disabled with:

```properties
app.data-initializer.enabled=false
```

Integration tests that manage their own database state disable it.

## Automated Verification

`MaintenanceMigrationIntegrationTest` verifies:

- display status conversion to the enum database value
- equipment relationship backfill
- hospital ownership backfill
- migration failure when equipment cannot be matched
- migration failure when hospital ownership cannot be restored
- restrictive retention when referenced equipment deletion is attempted
- case-insensitive technician relationship backfill
- preservation of the historical assignment email when a user is deleted
- migration failure for unsupported legacy status values
- database rejection of unsupported status writes after migration

`MaintenanceControllerIntegrationTest` verifies:

- hospital scheduling access
- hospital assignment access and technician assignment denial
- technician scheduling denial
- technician update access
- hospital update denial
- hospital deletion access
- technician deletion denial
- Bean Validation failures
- invalid status JSON
- invalid lifecycle transitions
- positive resource ID validation
- stable empty-array responses
- hospital-only calendar export

`MaintenanceServiceTest` continues to verify ownership scoping, scheduling, locked hospital
assignment, lifecycle enforcement, recurrence, calendar output, locked deletion, and
completed-record retention. It also verifies
that mismatched task/equipment hospital ownership is rejected, supplied technician emails are
normalized and replaced with the canonical active account email, and a recurrence is left
unassigned if the linked technician becomes ineligible during completion processing. A caller
already known to be locked, disabled, deleted, or role-changed is denied before task access.
New assignments persist both the canonical email and stable user relationship, while technician
repository access and write locks use the authenticated user ID. Maintenance operations also reject
authenticated callers whose current account is locked, disabled, deleted, or no longer has the
expected role.

`MaintenanceRequestValidationTest` verifies that create, assignment, and technician-update
payloads reject missing or oversized values against the explicit Maintenance persistence limits.
`MaintenanceServiceTest` also verifies normalization of equipment lookup values, technician
emails, and stored maintenance types.

`MaintenanceTaskRepositoryTest` initializes only the Maintenance JPA repository and verifies
against H2 that all hospital-, technician-, lock-, and equipment-history queries exclude an
inconsistent ownership row while retaining a valid row. The same test verifies that status
totals, completed-task SLA inputs, average work hours, and critical-pending analytics also exclude
rows whose task hospital disagrees with the linked equipment hospital.

It also verifies that completion requires an effective technician signature, accepts a previously stored signature when a partial completion payload omits the field, rejects an explicit blank signature, records `completedAt`, and preserves hospital-owned recurrence configuration during technician updates. Dedicated request DTOs now prevent client binding of completion timestamps and other server-controlled fields. `AnalyticsServiceTest` verifies that SLA compliance uses actual completion timestamps and excludes unverifiable legacy completions.

The changed Maintenance service dependency slice and its test source compile in isolation. All
29 `MaintenanceServiceTest` tests pass, including locked and disabled caller rejection. All 7
`MaintenanceMigrationIntegrationTest` tests pass against H2, including migration version `5`,
unsupported legacy data, invalid post-migration writes, and the existing foreign-key behaviors.

The normal Maven build currently stops during main compilation in the unrelated
`auth/commandcenter/model/SecurityUnifiedAlert.java` source before Maven can execute the standard
Maintenance lifecycle. That application-wide blocker remains outside this Maintenance-only
change.
