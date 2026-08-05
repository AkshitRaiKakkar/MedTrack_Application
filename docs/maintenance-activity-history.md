# Maintenance Activity History

## Purpose

Maintenance tasks retain append-only activity history for operational investigation and compliance
evidence. History records business changes without copying technician notes, parts descriptions,
signatures, or other report contents into the audit table.

Each event stores task and hospital ownership keys, a per-task sequence number, event type, actor
identity snapshot, previous and new status/assignee snapshots where relevant, changed field names,
a safe summary, and the server timestamp.

## Recorded events

| Event | Recorded when | Changed-field evidence |
| --- | --- | --- |
| `TASK_CREATED` | A hospital schedules a task, recurrence creates the next task, or a preventive rule generates a task | Scheduling field names |
| `TECHNICIAN_ASSIGNED` | An unassigned scheduled task receives its first technician | `assignedTechnician` |
| `TECHNICIAN_REASSIGNED` | A scheduled task moves from one technician to another | `assignedTechnician` |
| `STATUS_CHANGED` | A technician changes task state, including completion | Status and report fields changed in the same request |
| `WORK_DETAILS_UPDATED` | A technician updates report fields without changing state | Only changed field names |
| `TASK_ARCHIVED` | The owning hospital soft-deletes a non-completed task | `deleted`, `deletedAt`, `deletedBy` |

Preventive-rule and recurrence creation use the same `TASK_CREATED` event as manual scheduling.
The safe summary states the origin. Scheduler-created events use the fixed actor
`system@medtrack.internal` with role `SYSTEM`; authenticated operations snapshot the user ID,
canonical email, and role.

One technician request produces one atomic activity event. Omitted or unchanged optional fields are
not listed. A no-op work-details update creates no event.

## API

`GET /api/maintenance/{id}/history`

The endpoint accepts:

- `type`: optional event type. Values are case-insensitive and may use spaces or hyphens instead of
  underscores.
- `page`: zero-based page index; default `0`.
- `size`: page size; default `50`, minimum `1`, maximum `100`.

The response is a page envelope with `content`, `page`, `size`, `totalElements`, `totalPages`,
`first`, and `last`. Events are ordered by descending sequence number. Existing Maintenance task
endpoints and response contracts are unchanged. Invalid type or pagination values return HTTP 400.

## Ownership and retention

- Hospital users may read history only when both task and linked equipment belong to their
  hospital. The query includes soft-deleted tasks so archived evidence remains available.
- Technician users may read history only while the active task is assigned to their stable user ID.
- Every request revalidates that the authenticated account exists, has the expected role, and is
  active. Other roles are denied.

Activity rows are never updated or deleted by application code. Foreign keys require an existing
task, hospital, and optional actor. The unique `(task_id, sequence_number)` constraint prevents
ambiguous ordering. Existing task row locks serialize event sequencing with assignment, update,
and archive changes.

## Database migration

H2 and MySQL migration `V10__add_maintenance_activity_timeline.sql` create
`maintenance_task_activities`, ownership foreign keys, event/status checks, the unique sequence
constraint, and task/hospital/type indexes. Existing tasks are not backfilled with synthetic events;
their history begins with the first post-deployment change.

## Verification coverage

Maintenance tests cover sequencing, manual/system actors, assignment versus reassignment, atomic
technician updates, no-op behavior, archived hospital access, cross-hospital denial, stable
technician identity, active-account revalidation, filter/pagination validation, repository ordering,
controller serialization, recurrence and preventive generation, and archival.
