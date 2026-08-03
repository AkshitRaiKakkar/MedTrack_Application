# Maintenance Module Design

## Current State

The project already contains a basic Maintenance Scheduling module. It is implemented as a simple CRUD flow using these backend files:

- `model/MaintenanceTask.java`
- `model/MaintenanceStatus.java`
- `dto/MaintenanceCreateRequest.java`
- `dto/MaintenanceAssignmentRequest.java`
- `dto/MaintenanceUpdateRequest.java`
- `validation/MaintenanceValidationLimits.java`
- `repository/MaintenanceTaskRepository.java`
- `service/MaintenanceService.java`
- `controller/MaintenanceController.java`

The frontend also already has Maintenance-related pages and API helpers:

- `src/services/MaintenanceService.js`
- `src/pages/hospital/ScheduleMaintenancePage.jsx`
- `src/pages/hospital/MaintenanceSchedule.jsx`
- `src/pages/technician/TaskList.jsx`
- `src/pages/technician/UpdateTask.jsx`

The current backend can create, fetch, assign, update, and delete maintenance tasks through
`/api/maintenance` endpoints.

The backend also contains a hospital-owned preventive-maintenance automation subsystem using:

- `model/MaintenancePolicyRule.java`
- `model/MaintenanceGenerationRun.java`
- `model/MaintenanceRuleScope.java`
- `model/RecurrenceFrequency.java`
- `model/SlaState.java`
- `dto/MaintenanceRuleRequest.java`
- `dto/MaintenanceRuleResponse.java`
- `dto/RulePreviewResponse.java`
- `dto/SlaSummaryResponse.java`
- `dto/TechnicianWorkloadResponse.java`
- `repository/MaintenancePolicyRuleRepository.java`
- `repository/MaintenanceGenerationRunRepository.java`
- `service/PreventiveMaintenanceService.java`
- `service/PreventiveMaintenanceScheduler.java`
- `controller/PreventiveMaintenanceController.java`

This subsystem manages recurrence policies, previews exact equipment/deadline occurrences,
generates scheduled tasks, refreshes SLA state, and provides workload suggestions under
`/api/maintenance/automation`.

## What The Existing Files Do

### MaintenanceTask.java

`MaintenanceTask` is the current JPA entity for maintenance records. It maps to the `maintenance_tasks` table and stores task details such as task code, equipment name, hospital name, deadline, assigned technician, priority, status, notes, hours worked, parts used, signature, and the server-recorded completion timestamp. Its `status` field uses the strongly typed `MaintenanceStatus` enum and is persisted with `EnumType.STRING`. It also stores `hospitalId`, which is populated by the backend and used as a stable ownership key.

The task keeps the existing API-facing equipment code/name fields and also stores a lazy, required `ManyToOne` relationship to the real `Equipment` record. The relationship uses `equipment_record_id` so it can coexist with the legacy string field without breaking the frontend contract. Versioned Flyway migrations backfill legacy rows, enforce non-null equipment and hospital ownership, and add a restrictive equipment foreign key so maintenance history cannot be orphaned by equipment deletion.

The entity also maps `equipment_record_id` as a read-only, JSON-ignored scalar. Maintenance uses
that internal key for ownership and recurrence-eligibility checks without forcing Hibernate to
load the active-only `Equipment` entity. This is required because equipment archival must not
hide retained maintenance history.

Technician assignment retains the existing `assignedTechnician` email response field and adds a
lazy, JSON-ignored `assignedTechnicianRecord` relationship to `User`. Assignment paths trim and
lowercase the lookup value, require an active technician account, store its canonical email, and
persist the stable user relationship. Technician authorization and repository locking use the
user ID rather than mutable email text. Migration version `4` backfills the relationship from
normalized legacy emails. The relationship is nullable for unassigned work and uses `ON DELETE
SET NULL`, preserving the historical email if a user record is removed.

Maintenance deletion is auditable soft deletion. The entity stores `deleted`, `deletedAt`, and
`deletedBy`, and Hibernate applies `@SQLRestriction("deleted = false")` so archived tasks are
excluded from normal repository and API access. The hospital DELETE endpoint retains the row and
records the authenticated principal and server timestamp instead of issuing a physical database
delete.

### Maintenance request DTOs

`MaintenanceCreateRequest` contains only hospital-controlled scheduling fields. Identity,
ownership, initial status, timestamps, and technician evidence are not request properties.
Unknown legacy entity fields are ignored so existing clients can continue sending their current
JSON shape without gaining write access to those values.

`MaintenanceUpdateRequest` contains only the status and partial technician report fields.
Its optional report values retain the existing null-means-preserve behavior. The recurrence
field remains accepted for compatibility but cannot change the hospital-owned schedule.

`MaintenanceAssignmentRequest` contains only the required technician email. It supports
hospital assignment or reassignment while a task is still `SCHEDULED`, including recurring
tasks that were intentionally created without an eligible technician.

All request DTOs and the entity use constants from `MaintenanceValidationLimits` so HTTP
validation and persistence constraints cannot silently drift apart. API-facing `VARCHAR` fields
are limited to 255 characters, technician notes to 16,000 characters, and the base64/string
signature representation to 60,000 characters.

### MaintenanceTaskRepository.java

`MaintenanceTaskRepository` extends `JpaRepository`, so it already supports basic database operations like save, find all, find by id, and delete by id.

It also defines simple query methods:

- `findByTaskCode(String taskCode)`
- `findByAssignedTechnicianId(Long technicianId)`
- `findByHospitalId(Long hospitalId)`
- `findByAssignedTechnicianIdWithFilters(...)`
- `findByHospitalIdWithFilters(...)`
- `findByIdAndHospitalId(Long id, Long hospitalId)`
- `findByIdAndAssignedTechnicianId(Long id, Long technicianId)`
- `findByIdAndAssignedTechnicianIdForUpdate(Long id, Long technicianId)`
- `findByIdAndHospitalIdForUpdate(Long id, Long hospitalId)`

The hospital and technician ownership queries are already used by the service to prevent one
user from reading or changing another user's tasks. Every scoped read and write-lock query also
requires `MaintenanceTask.hospitalId` to match the hospital that owns `equipmentRecord`. A row
whose two ownership paths disagree is therefore excluded from API access instead of being trusted
solely because its scalar `hospitalId` matches the caller.

These access paths use explicit native ownership queries. Native SQL is intentional here:
`Equipment` has an entity-level `deleted = false` restriction, and an ordinary JPQL join would
otherwise make every retained maintenance record disappear when its equipment is archived. The
Maintenance queries explicitly exclude archived maintenance tasks while allowing archived
equipment rows to participate in the ownership check. Hospital/technician reads, write locks,
equipment history, filters, and analytics therefore retain maintenance evidence after equipment
archival without weakening tenant isolation.

The hospital deletion query uses a pessimistic write lock. Together with the existing
locked technician-update query, this serializes deletion and completion attempts for
the same task.

An ownership-scoped equipment-history query is now available through
`findByEquipmentRecord_IdAndHospitalId`. Technician queries resolve the authenticated email to
the canonical `User` and scope access by that stable user ID. The API-facing assignment field
remains an email for frontend compatibility.

The two list-filter queries accept optional status and equipment-code values plus a Spring Data
`Pageable`, and return `Page` internally. The service exposes only the page content so the existing
JSON-array response contract is preserved. The queries retain the same dual ownership checks as the
unfiltered queries, and the repository supplies deterministic deadline/database-ID ordering. The former
global `findByStatus` method was removed because a tenant-agnostic status lookup is unsafe for API use.

Maintenance analytics queries enforce the same dual ownership invariant. Status totals, completed
task SLA inputs, average work hours, and critical-pending counts require both the task's
`hospitalId` and the linked equipment's hospital to match the requested hospital. An inconsistent
legacy row therefore cannot affect either API results or hospital analytics. The critical-pending
analytics caller uses the canonical API and persistence value `Critical`, preventing a
case-sensitive query mismatch.

### MaintenanceStatus.java

`MaintenanceStatus` defines the supported task states:

- `SCHEDULED`
- `IN_PROGRESS`
- `NEEDS_PART`
- `ON_HOLD`
- `COMPLETED`

The enum uses Jackson conversion annotations so the REST API continues to accept and return the human-readable values already used by the frontend, such as `"Scheduled"` and `"In Progress"`. Invalid status text is rejected instead of being stored as arbitrary data.

Flyway migration version `5` enforces the same closed status set in persistent H2 and MySQL
schemas. It fails when unsupported legacy values remain after normalization and prevents invalid
direct database writes from creating records that Hibernate cannot deserialize.

### MaintenanceService.java

`MaintenanceService` contains the current business logic for maintenance tasks.

It currently supports:

- fetching only the authenticated hospital's or technician's tasks
- fetching one task only when it belongs to the authenticated hospital or assigned technician
- revalidating the authenticated user's current database role and active account status before
  every hospital or technician Maintenance operation
- scheduling a task with hospital ownership derived from the authenticated user
- always generating the task code on the server
- allowing a technician to update only a task linked to their authenticated user ID
- allowing a hospital to soft-delete only its own non-completed task while retaining audit evidence
- resolving maintenance against equipment owned by the authenticated hospital
- validating scheduling fields and assigned technician accounts
- enforcing agreement between task ownership and equipment ownership before persistence
- storing the canonical account email for technician assignments
- storing the assigned technician's stable `User` relationship for authorization
- applying the authentication module's lowercase email normalization before technician lookup
- rejecting locked or disabled technician accounts
- allowing the owning hospital to assign or reassign a technician while a task is `SCHEDULED`
- enforcing the documented status lifecycle and non-negative work values
- preventing edits and soft deletion after completion
- persisting technician reports including parts and signatures
- preserving existing technician report values when optional update fields are omitted
- preserving the hospital-configured recurrence period during technician updates
- requiring technician sign-off and recording `completedAt` on the transition to `COMPLETED`
- creating one recurring task only when a task transitions to `COMPLETED`
- rechecking that linked equipment is not archived, retired, or disposed before creating a
  recurring task; valid completion evidence is retained when recurrence is skipped
- revalidating the previous technician before assigning a recurring task and leaving the
  recurrence unassigned if that account becomes ineligible during completion processing
- serializing technician updates to the same task so concurrent completion requests cannot create duplicate recurrences
- serializing hospital deletion with technician completion of the same task
- exporting hospital tasks as an RFC 5545 iCalendar feed whose `VEVENT` components use
  `STATUS:CONFIRMED` and retain the exact Maintenance lifecycle state in `X-MEDTRACK-STATUS`
- filtering hospital or technician lists by status and equipment code without weakening ownership
- applying opt-in, bounded pagination to filtered or unfiltered list requests

Create and update requests use dedicated DTOs. `MaintenanceTask` remains the response model,
so existing response JSON fields are unchanged. The service constructs new entities from the
create allowlist and applies only technician-owned fields from the update allowlist.

### MaintenanceController.java

`MaintenanceController` exposes the REST API under `/api/maintenance`.

Current endpoints:

- `GET /api/maintenance`
- `GET /api/maintenance/{id}`
- `POST /api/maintenance`
- `POST /api/maintenance/{id}/assignment`
- `PUT /api/maintenance/{id}`
- `DELETE /api/maintenance/{id}`
- `GET /api/maintenance/export/calendar.ics`

The controller forwards the authenticated identity to the service, uses role guards for every operation, and validates positive IDs for item-level operations. The assignment endpoint is restricted to the owning hospital and only changes a task that remains `SCHEDULED`. The list endpoint is automatically scoped to the authenticated hospital or technician and consistently returns HTTP 200 with a JSON array, including `[]` when no tasks exist. Repository `Page` metadata is intentionally not exposed, preserving the established response shape.

Scheduling and technician-update DTOs use Bean Validation, with business-critical checks also
retained in the service. `GET /api/maintenance` accepts optional `status`, `equipmentId`, `page`,
and `size` parameters. Status accepts either the display value (for example `In Progress`) or enum
name (`IN_PROGRESS`), and `equipmentId` is the canonical equipment code stored in the API response.
Blank filters are treated as absent. Pagination is opt-in: when either paging parameter is supplied,
`page` defaults to `0`, `size` defaults to `50`, and `size` is limited to `1..100`. Omitting both
paging parameters preserves the existing unpaged JSON-array behavior.

Controller integration tests verify scheduling, updates, deletion, empty lists, invalid payloads, invalid status text and transitions, positive ID validation, role guards, and hospital-only calendar export. Method-security failures are mapped to HTTP 403 instead of being converted to a generic HTTP 400 response.

## Target Design

The Maintenance module should become the bridge between Equipment Inventory and Technician Operations.

Expected workflow:

1. A hospital user creates or owns equipment.
2. The hospital schedules maintenance for an existing equipment item.
3. A technician views assigned maintenance tasks.
4. The technician updates task progress, notes, hours worked, and parts used.
5. The hospital can review maintenance status and history.

## Entity Relationship Design

The intended relationship is:

```text
Hospital -> Equipment -> MaintenanceTask
```

Recommended mapping:

```text
One Equipment can have many MaintenanceTask records.
Many MaintenanceTask records belong to one Equipment.
```

The backend mapping now uses a dedicated relationship field while retaining the legacy API fields:

```java
@ManyToOne(fetch = FetchType.LAZY, optional = false)
@JoinColumn(name = "equipment_record_id", nullable = false)
private Equipment equipmentRecord;
```

The relationship is now non-nullable. Existing rows are upgraded through the vendor-specific Flyway migration before the entity constraint is applied.

The relationship is excluded from Lombok-generated `toString`, `equals`, and `hashCode` traversal. This avoids accidentally initializing the lazy equipment proxy or recursing through connected JPA entities while preserving the legacy JSON contract through `@JsonIgnore`.

This will make maintenance records depend on real equipment records instead of only storing equipment details as strings.

## Status Lifecycle

Maintenance status is now controlled through the `MaintenanceStatus` enum instead of free text.

Recommended statuses:

- `SCHEDULED`
- `IN_PROGRESS`
- `NEEDS_PART`
- `ON_HOLD`
- `COMPLETED`

`CANCELLED` is not currently implemented and can be added later when cancellation behavior is defined.

Recommended lifecycle:

```text
SCHEDULED -> IN_PROGRESS -> COMPLETED
IN_PROGRESS -> NEEDS_PART
IN_PROGRESS -> ON_HOLD
NEEDS_PART -> IN_PROGRESS
ON_HOLD -> IN_PROGRESS
```

## API Design

The existing endpoint base path should remain unchanged:

```text
/api/maintenance
```

Keeping this path avoids breaking the current frontend service.

Recommended API behavior:

- `POST /api/maintenance`: hospital schedules maintenance for equipment
- `POST /api/maintenance/{id}/assignment`: owning hospital assigns or reassigns a
  technician while the task is still scheduled
- `GET /api/maintenance`: authenticated users fetch maintenance tasks
- `GET /api/maintenance/{id}`: authenticated users fetch one task
- `PUT /api/maintenance/{id}`: technician updates maintenance progress
- `DELETE /api/maintenance/{id}`: hospital archives its own non-completed maintenance task through
  soft deletion while retaining the existing HTTP 204 contract

Supported optional filters and pagination:

```text
GET /api/maintenance?status=...
GET /api/maintenance?equipmentId=...
GET /api/maintenance?page=0&size=50
```

Filter values are combined when more than one is supplied. Clients cannot choose a technician or
hospital scope; those constraints always come from the authenticated identity.

## Validation Rules

Scheduling should validate:

- equipment id is present
- equipment exists
- equipment is not archived, retired, or disposed
- deadline is present
- maintenance type is present
- priority is valid
- assigned technician exists if technician assignment is required
- assigned technician has technician role
- assigned technician account is active rather than locked or disabled
- assigned technician lookup uses the same lowercase normalization as registration and login
- assigned technician is stored using the canonical email from the verified user account
- assignment changes are accepted only for an owned `SCHEDULED` task
- equipment ID, maintenance type, assigned technician, description, and image reference do not
  exceed 255 characters
- surrounding whitespace is removed from the equipment lookup value and stored maintenance type

Updating should validate:

- task exists
- status is valid
- completed tasks cannot be edited or soft-deleted
- completion requires a nonblank effective technician signature: a signature supplied in
  the current payload, or the previously stored signature when the field is omitted
- completion time is generated by the server and cannot be supplied by a client
- hours worked cannot be negative
- notes do not exceed 16,000 characters
- parts used do not exceed 255 characters
- signature does not exceed 60,000 characters
- only technicians should update technician report fields
- technician updates cannot change the recurrence period configured when the hospital
  scheduled the task
- omitted or null optional report fields preserve their existing values; an explicit empty
  string remains an update for text fields
- a recurring task reuses the canonical technician assignment only while the account still
  exists, remains active, and has the technician role; otherwise the recurrence is created
  unassigned. A caller already known to be locked, disabled, deleted, or role-changed cannot
  perform the completion itself.
- recurrence is created only while the linked equipment still belongs to the task's hospital and
  is neither archived, retired, nor disposed. If equipment becomes unavailable after the original
  task was scheduled, completing that task remains valid but no future task is created.

## Security Rules

Current Spring Security already protects Maintenance APIs by role:

```text
GET     authenticated users
POST    hospital users
PUT     technician users
DELETE  hospital users
```

Current service-level checks ensure:

- every Maintenance operation requires the authenticated account to still exist, retain the
  expected hospital or technician role, and have `AccountStatus.ACTIVE`; a locked, disabled,
  deleted, or role-changed account receives HTTP 403 even if it presents an unexpired JWT
- hospitals can list and read only their own maintenance tasks, and can soft-delete only
  their own non-completed tasks
- hospitals can assign technicians only to their own scheduled tasks
- technicians can list, read, and update only tasks linked to their authenticated user ID
- hospital ownership is derived from the authenticated user rather than request JSON
- task ownership must agree with the hospital that owns the linked equipment; inconsistent
  rows are not returned or locked by Maintenance repository access paths

The direct `User` relationship is internal and JSON-ignored. The existing email field remains in
responses, so endpoint paths and frontend payloads are unchanged. Unauthenticated access remains
enforced by Spring Security.

## Integration Notes

Maintenance should depend on Equipment. It should not directly depend on Supplier Operations or Equipment Orders.

The current frontend field names should be preserved unless frontend changes are included in the same work. Important fields currently expected by the frontend include:

- `id`
- `taskCode`
- `equipmentId`
- `equipment`
- `hospital`
- `maintenanceType`
- `deadline`
- `assignedTechnician`
- `description`
- `priority`
- `status`
- `notes`
- `hoursWorked`
- `partsUsed`
- `signature`
- `completedAt` (response field controlled by the server)

## Preventive-Maintenance Automation

Preventive rules are owned by a hospital and select eligible equipment by category, individual
equipment record, manufacturer text, or hospital-wide priority. Every generated task starts in
`SCHEDULED`, receives the same task/equipment hospital ownership values as a manually scheduled
task, and enters the existing Maintenance lifecycle without introducing a separate task API.

Generation uses an inclusive `windowStart..windowEnd` horizon. For equipment without generated
history under the rule, the first occurrence is the window start. For equipment with history, the
latest retained generated-task deadline is the cadence anchor and the rule frequency calculates the
next occurrence. Every missing occurrence inside the window is generated; weekly, monthly,
quarterly, yearly, and custom schedules therefore do not reset merely because the daily scheduler's
window advances.

Generated history queries intentionally include soft-deleted Maintenance tasks. An archived task
remains audit evidence for its rule/equipment/deadline occurrence and cannot be recreated by a
later run. Those queries use native ownership checks so archived equipment does not erase the
cadence history, while archived, retired, and disposed equipment is excluded from new generation.

Manual generation and scheduled generation lock the same hospital-owned policy row before reading
the generation ledger or task history. This serializes overlapping runs for one rule. An exact
repeat of a recorded rule/window returns the existing `MaintenanceGenerationRun`; an overlapping
new window starts after each equipment's latest generated deadline and creates only the missing
occurrences.

Preview and generation share the same occurrence planner. Preview fields have these meanings:

- `matchedEquipment`: eligible equipment selected by the rule
- `totalDueDates`: distinct due dates across all selected equipment
- `wouldCreate`: missing equipment/deadline occurrences
- `skippedExisting`: retained equipment/deadline occurrences already present in the window
- `dueDates`: sorted union of the missing dates

The complete endpoint, cadence, idempotency, SLA, and workload contract is documented in
`docs/maintenance-preventive-automation.md`.

## Next Implementation Steps

### Verified completed

- [x] Add a `MaintenanceStatus` enum.
- [x] Refactor `MaintenanceTask.status` to use `MaintenanceStatus` with `EnumType.STRING`.
- [x] Add a server-controlled `hospitalId` ownership key to `MaintenanceTask`.
- [x] Add hospital-, technician-, and status-based repository query methods.
- [x] Scope list and item reads to the authenticated hospital or assigned technician.
- [x] Derive the scheduling hospital from the authenticated user instead of request JSON.
- [x] Scope task deletion to the authenticated hospital.
- [x] Scope technician updates to tasks assigned to the authenticated technician.
- [x] Persist technician updates for `status`, `notes`, and `hoursWorked`.
- [x] Apply controller role guards and positive-ID validation.
- [x] Link new maintenance tasks to hospital-owned equipment records.
- [x] Validate scheduling fields and technician assignment.
- [x] Prevent client-controlled task identity, ownership, and initial report state.
- [x] Enforce valid status transitions, non-negative work values, and completion immutability.
- [x] Prevent duplicate recurring tasks after completion.
- [x] Prevent completed records from being deleted and serialize deletion with completion.
- [x] Retain deleted non-completed tasks through auditable soft deletion.
- [x] Require technician sign-off and persist the actual completion timestamp.
- [x] Calculate maintenance SLA compliance from actual completion timestamps.
- [x] Add a Flyway migration that normalizes legacy statuses and backfills equipment/hospital ownership.
- [x] Make the `equipmentRecord` relationship non-nullable after the migration.
- [x] Update seed data to create real hospital, equipment, and maintenance relationships.
- [x] Return HTTP 200 with an empty array for an empty maintenance list.
- [x] Add maintenance controller integration tests for validation and role guards.
- [x] Add migration integration tests for successful backfill and unmatched legacy records.
- [x] Introduce allowlisted create and technician-update request DTOs.
- [x] Enforce non-null maintenance ownership and a restrictive equipment foreign key.
- [x] Enforce agreement between maintenance ownership and linked-equipment ownership.
- [x] Canonicalize technician emails and revalidate recurring-task assignment.
- [x] Allow hospitals to recover unassigned scheduled work through a locked assignment endpoint.
- [x] Add ownership-safe status/equipment filtering with opt-in bounded pagination.
- [x] Align Maintenance request validation limits with persistence constraints.
- [x] Apply the linked-equipment ownership invariant to Maintenance analytics aggregations.
- [x] Link technician authorization to a stable `User` relationship without changing response JSON.
- [x] Revalidate the current account role and active status on every Maintenance operation.
- [x] Enforce the Maintenance status enum values with a versioned database constraint.
- [x] Align critical-pending analytics with the canonical `Critical` priority value.
- [x] Emit RFC 5545-valid `VEVENT` statuses while preserving Maintenance status metadata.

### Completed on 2026-07-14

1. [x] **Connected maintenance to real equipment and secured scheduling.** Added a lazy equipment relationship and an ownership-scoped history query. Scheduling resolves either the canonical equipment code or, only when no matching code exists, the numeric ID currently sent by the UI. It verifies hospital ownership without reinterpreting another hospital's numeric-looking equipment code, validates required fields and technician roles, and replaces all client-supplied identity/ownership values with server values.
2. [x] **Validated technician updates and recurrence.** Technician report fields persist, negative hours/recurrence are rejected, status transitions follow the documented lifecycle, completed records are immutable, and recurrence is created exactly once on the transition to `COMPLETED`.

Focused verification is implemented in `MaintenanceServiceTest`: owned-equipment scheduling, cross-hospital rejection, technician ownership, negative-hour rejection, completion immutability, recurrence creation, calendar export, scoped lists, and scoped deletion.

### Completed on 2026-07-16

1. [x] **Added a versioned maintenance database backfill.** Flyway support and H2/MySQL migration scripts normalize legacy status strings, resolve `equipment_record_id` from the canonical equipment code, restore `hospital_id` from equipment ownership when necessary, and enforce a required equipment relationship. The migration intentionally fails when a legacy task cannot be matched, preventing silent data loss or an invalid relationship state.
2. [x] **Hardened the backend maintenance API contract.** Empty task lists now return HTTP 200 with `[]`, access-denied exceptions return HTTP 403, seeded data uses real hospital/equipment relationships, and controller integration tests cover the maintenance endpoints and role boundaries.

Migration behavior is verified by `MaintenanceMigrationIntegrationTest`. Controller and
method-security coverage exists in `MaintenanceControllerIntegrationTest`. The backend compiles,
but the complete Maven test suite currently cannot load full Spring contexts because two
unrelated authentication packages register repositories with the same bean name. Allowing that
override exposes a second collision where their entities also share the same JPA entity name.

### Completed on 2026-07-17

1. [x] **Made completed maintenance records auditable.** A transition to `COMPLETED` now requires a nonblank technician signature and records a server-controlled `completedAt` timestamp. Scheduling clears any client-supplied completion timestamp.
2. [x] **Corrected SLA reporting.** Analytics now compares the real completion date with the task deadline. Legacy completed rows without a trustworthy timestamp remain readable but are excluded from the SLA denominator instead of receiving an invented completion date.

The nullable completion column is introduced by Flyway migration version `2`. Completion validation and timestamp ownership are covered by `MaintenanceServiceTest`; SLA calculation is covered by `AnalyticsServiceTest`.

### Completed on 2026-07-18

1. [x] **Made recurring completion concurrency-safe.** Technician updates now load the assigned maintenance row with a database `PESSIMISTIC_WRITE` lock inside the existing transaction. Concurrent completion requests therefore serialize: the first request completes the task and creates its recurrence, while the next request observes the completed immutable state and cannot create another recurrence.
2. [x] **Hardened RFC 5545 calendar output.** Calendar text now escapes backslashes, commas, semicolons, and line breaks; `DTSTAMP` is generated from an actual UTC instant; and content lines are folded at 75 UTF-8 octets without splitting Unicode code points. The endpoint path, media type, filename, and event fields remain compatible.

Lock selection and calendar escaping, UTC formatting, injection resistance, Unicode handling, and line-length behavior are covered by `MaintenanceServiceTest`.

### Completed on 2026-07-19

1. [x] **Made technician updates safe for partial payloads.** A status-only or
   single-field update now preserves existing notes, hours worked, parts used, and
   signature values when those optional fields are omitted or null. Status remains
   required, completion still requires a nonblank signature, and explicit empty text
   values remain supported.
2. [x] **Protected completed maintenance evidence from deletion.** Hospital deletion
   now loads the ownership-scoped task with a pessimistic write lock, rejects completed
   tasks, and serializes against technician completion. Existing endpoint paths, role
   guards, response models, and successful HTTP 204 behavior for non-completed tasks
   remain unchanged.

### Completed on 2026-07-20

1. [x] **Protected hospital-owned recurrence configuration.** Technician updates may
   continue to include `recurrencePeriodDays` in the existing JSON shape, but the service
   preserves the value configured when the hospital scheduled the task. Completion and
   recurrence generation now always use that persisted value.
2. [x] **Aligned completion validation with partial-update semantics.** When a completion
   payload omits `signature`, validation uses the task's previously stored signature. An
   explicit blank signature still fails completion, and a task with no effective signature
   remains incomplete.

The endpoint paths, request and response field names, role guards, and HTTP status codes
remain unchanged. Regression coverage is implemented in `MaintenanceServiceTest`.

### Completed on 2026-07-22

1. [x] **Separated Maintenance API requests from persistence entities.** Hospital scheduling
   now accepts `MaintenanceCreateRequest`, and technician reporting accepts
   `MaintenanceUpdateRequest`. Server-controlled identity, ownership, workflow, and audit
   fields are no longer bindable request properties. Endpoint paths, request field names,
   response JSON, roles, and status codes remain unchanged.
2. [x] **Enforced Maintenance record integrity in versioned migrations.** Migration version
   `3` makes `hospital_id` and `status` non-null and adds a restrictive foreign key from
   `maintenance_tasks.equipment_record_id` to `equipment.id`. Equipment deletion therefore
   cannot orphan retained maintenance evidence. Migration and locked-deletion regression
   coverage now verifies these guarantees.

### Completed on 2026-07-24

1. [x] **Enforced the complete Maintenance ownership invariant.** Hospital, technician,
   equipment-history, update-lock, and deletion-lock repository queries now require the task's
   `hospitalId` to agree with the hospital that owns its linked equipment. The service also
   verifies the invariant before saving directly scheduled or recurring tasks. This prevents a
   malformed or legacy row from being trusted through only one of its ownership fields.
2. [x] **Made technician assignment canonical and recurrence-safe.** Direct scheduling trims the
   supplied email, verifies the account and technician role, and stores the email from the user
   record. Recurrence generation repeats that eligibility check. If the former technician no
   longer exists or no longer has the technician role, completion remains successful and the new
   recurring task is left unassigned for hospital reassignment.

The endpoint paths, JSON field names, role guards, lifecycle, and success status codes remain
unchanged. Regression coverage is implemented in `MaintenanceServiceTest` and the isolated
`MaintenanceTaskRepositoryTest`, which executes the ownership-scoped repository queries against H2 without
loading unrelated application repositories.

### Completed on 2026-07-25

1. [x] **Added ownership-safe list filtering and opt-in pagination.** The existing
   `GET /api/maintenance` endpoint now accepts optional `status`, `equipmentId`, `page`, and
   `size` parameters while retaining its JSON-array response. Hospital and technician filter
   queries enforce the same linked-equipment ownership invariant as every other Maintenance
   access path. Pagination remains opt-in for backward compatibility and is capped at 100 rows
   per page. The unused tenant-agnostic status repository method was removed.
2. [x] **Aligned request validation with Maintenance persistence limits.** Shared constants now
   define the maximum lengths used by create/update DTOs and the `MaintenanceTask` entity.
   Oversized scheduling and technician-report fields are rejected through Bean Validation before
   persistence instead of surfacing as database failures. Equipment references and maintenance
   types are trimmed for lookup/storage while free-form report content retains its exact value.

The endpoint path, roles, response fields, and unparameterized list behavior remain unchanged.
Regression coverage is implemented in `MaintenanceServiceTest`,
`MaintenanceTaskRepositoryTest`, `MaintenanceRequestValidationTest`, and
`MaintenanceControllerIntegrationTest`.

### Completed on 2026-07-26

1. [x] **Made unassigned scheduled tasks recoverable.** The owning hospital can now use
   `POST /api/maintenance/{id}/assignment` with an allowlisted assignment DTO. The service
   loads the hospital-owned row with the existing pessimistic write lock, rechecks that the
   task is still `SCHEDULED`, validates the technician, and stores the canonical account email.
   This closes the lifecycle for directly scheduled or recurring tasks created without an
   eligible technician.
2. [x] **Hardened technician eligibility consistently.** Scheduling, hospital assignment,
   and recurring-task generation now trim and lowercase technician email lookup values to
   match authentication behavior. Only an `ACTIVE` account with the technician role can be
   assigned. A recurring completion still succeeds when the previous account is missing,
   locked, disabled, or no longer a technician during completion processing; the next scheduled
   task is left unassigned. A caller already known to be ineligible is denied before task access.

The existing endpoints and response JSON remain unchanged. Assignment is an additive,
hospital-only operation, and concurrent assignment versus technician-start attempts serialize
on the same maintenance row.

### Completed on 2026-07-27

1. [x] **Applied the complete ownership invariant to Maintenance analytics.** Status totals,
   completed-task SLA inputs, average work hours, and critical-pending counts now require the
   task hospital and linked-equipment hospital to agree. Inconsistent legacy rows can no longer
   affect hospital dashboards.
2. [x] **Made technician authorization stable without changing the API.** Maintenance tasks now
   keep a nullable, JSON-ignored relationship to the assigned `User`. Technician reads and
   locked updates use the user ID, while `assignedTechnician` remains the same canonical email
   response field. Migration version `4` backfills normalized legacy assignments and uses
   `ON DELETE SET NULL` so historical email evidence is retained if an account is removed.

Repository tests cover analytics isolation and assignment access after an email change. Service
tests cover direct scheduling, hospital assignment, recurrence eligibility, and stable-ID
locking. Migration tests cover case-insensitive backfill and user-deletion behavior.

### Completed on 2026-07-28

1. [x] **Revalidated current account eligibility for every Maintenance operation.** Hospital and
   technician paths now reload the caller using normalized identity data and require the current
   database role plus `AccountStatus.ACTIVE`. Locked, disabled, deleted, or role-changed accounts
   receive HTTP 403 even if an older JWT still carries a Maintenance role.
2. [x] **Enforced the closed Maintenance status set in the database.** Migration version `5` adds
   matching H2 and MySQL check constraints for the five `MaintenanceStatus` values. Unsupported
   legacy statuses block migration, and invalid direct writes are rejected before they can break
   JPA reads.

Service regression tests cover stale-authority access by locked and disabled accounts. Migration
tests cover unsupported legacy data and invalid post-migration status writes. Endpoint paths,
payloads, response models, successful status codes, and valid lifecycle behavior remain unchanged.

### Completed on 2026-07-30

1. [x] **Corrected critical-pending Maintenance analytics.** The analytics service now supplies
   the canonical `Critical` value expected by the ownership-scoped repository query. Valid critical
   tasks are therefore counted without changing request validation, persistence values, repository
   signatures, or API payloads.
2. [x] **Made Maintenance calendar event statuses RFC 5545 compliant.** Exported `VEVENT`
   components now use the valid `STATUS:CONFIRMED` value. The exact Maintenance enum name remains
   available in `X-MEDTRACK-STATUS`, while the existing description also retains the human-readable
   status. Endpoint path, media type, filename, dates, summaries, and event identifiers are
   unchanged.

Repository regression coverage verifies the canonical stored priority and ownership scope.
Calendar regression coverage verifies the valid `VEVENT` status, Maintenance extension property,
escaping, UTC timestamps, and UTF-8 content-line folding.

### Completed on 2026-07-31

1. [x] **Restored the backward-compatible Maintenance list contract.** The list endpoint again
   returns a JSON array, including an empty array, while optional `page` and `size` values are
   resolved in the service and bounded to 100 rows. Repository queries retain internal `Page`
   support, results use deterministic deadline/ID ordering, and the hospital calendar export uses
   a valid unfiltered ownership-scoped service path.
2. [x] **Made Maintenance deletion auditable.** Deleting an owned non-completed task now records
   `deleted`, `deletedAt`, and `deletedBy` instead of physically removing the row. Hibernate's
   supported SQL restriction hides archived tasks from normal access, completed evidence remains
   protected, and the public DELETE endpoint retains its HTTP 204 response.

Focused service, request-validation, and repository verification covers pagination validation,
calendar access, deletion audit fields, and exclusion of archived records. The complete backend
main-source compilation succeeds. The standard Maven test lifecycle currently stops during test
compilation on unrelated rate-limiting and equipment test-source errors.

### Completed on 2026-08-01

1. [x] **Realigned Maintenance verification with the backward-compatible list contract.**
   Controller tests now assert a root JSON array and call the service's supported five-argument
   list method. Listing tests cover the unpaged calendar path and the validated `page`/`size` path
   without referencing a removed `Pageable` service overload. No production endpoint, payload,
   response field, role, or status code changed.
2. [x] **Corrected Maintenance deployment documentation.** The soft-delete migration and operator
   verification steps identified the then-current gapless Flyway version `7`; the repository now
   continues through equipment lifecycle version `8`. The verification record
   also distinguishes successful main-source compilation from the remaining unrelated test-source
   compilation blockers.

### Completed on 2026-08-02

1. [x] **Preserved Maintenance history after equipment archival.** Maintenance ownership,
   filtering, locking, equipment-history, and analytics queries now inspect the retained equipment
   row without inheriting its active-only Hibernate restriction. Archived Maintenance tasks remain
   excluded, and task/equipment hospital mismatches remain inaccessible.
2. [x] **Prevented invalid completion-driven recurrence.** Before creating a recurring task, the
   service now verifies that the linked equipment still belongs to the task hospital and is not
   archived, retired, or disposed. The completed task and its sign-off remain committed when the
   recurrence is skipped.

The endpoint paths, request and response JSON, roles, status lifecycle, and successful HTTP status
codes remain unchanged. Repository and service regression tests cover both rules.

### Completed on 2026-08-03

1. [x] **Made preventive generation cadence-correct.** Rule evaluation now anchors each equipment
   to its latest retained generated deadline and creates every missing recurrence occurrence in the
   inclusive generation window. Advancing the daily scheduler window no longer resets weekly,
   monthly, quarterly, yearly, or custom recurrence cadence.
2. [x] **Serialized and aligned preview/generation.** Scheduled and manual generation take the same
   ownership-scoped policy write lock, and preview uses the same occurrence planner as execution.
   Soft-deleted task history remains part of idempotency, while task APIs continue to hide archived
   records. Preview and run counters now describe exact equipment/deadline occurrences.

Endpoint paths, request and response field names, roles, task lifecycle, and successful HTTP status
codes remain unchanged. Focused service and repository coverage verifies cadence, overlapping
windows, exact reruns, soft-deleted history, and ownership isolation.

### Recommended future work

- [ ] Decide whether to add a `CANCELLED` status.
- [ ] Connect and verify the hospital maintenance list page against the backend API.

## Definition Of Done For Design Step

- Current Maintenance module is documented.
- Existing limitations are identified.
- Target entity relationship is clear.
- Status lifecycle is defined.
- API behavior is defined.
- Validation and security rules are listed.
- The completed enum refactor is documented in `docs/maintenance-status-enum.md`.
