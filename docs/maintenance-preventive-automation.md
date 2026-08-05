# Preventive Maintenance Automation

## Purpose

The preventive-maintenance subsystem lets an authenticated hospital define recurring policies,
preview their effect, generate ordinary `MaintenanceTask` records, refresh SLA state, and inspect
technician workload. Generated tasks deliberately use the existing Maintenance task API and status
lifecycle instead of creating a second work-order model.

## Ownership and Security

Every automation endpoint requires `ROLE_HOSPITAL`. The service reloads the authenticated account,
requires the current database role to remain `hospital`, requires `AccountStatus.ACTIVE`, and
resolves the hospital profile from that account. A hospital ID is never accepted from request JSON.

Rules and generation runs store the resolved hospital ID. Rule reads, updates, deletion, preview,
and manual generation use both rule ID and hospital ID. Generated tasks store the same hospital ID
as their rule and reference equipment owned by that hospital.

## API

The base path is:

```text
/api/maintenance/automation
```

Hospital endpoints:

```text
GET    /rules
GET    /rules/{id}
POST   /rules
PUT    /rules/{id}
DELETE /rules/{id}
GET    /rules/{id}/preview
POST   /rules/{id}/generate
GET    /sla
POST   /sla/refresh
GET    /workload
```

Preview and generation accept optional ISO dates:

```text
?windowStart=YYYY-MM-DD&windowEnd=YYYY-MM-DD
```

When omitted, `windowStart` defaults to the server's current date and `windowEnd` defaults to
`windowStart + leadTimeDays`.

## Rule Model

A `MaintenancePolicyRule` contains:

- hospital ownership
- rule name and description
- equipment scope and selector
- recurrence frequency
- optional custom interval
- generated maintenance type and priority
- SLA warning and breach windows
- generation lead time
- active and soft-delete state
- last successfully evaluated generation horizon

Supported scopes:

- `EQUIPMENT_CATEGORY`: equipment in one `EquipmentCategory`
- `INDIVIDUAL_EQUIPMENT`: one hospital-owned equipment record
- `MANUFACTURER_INTERVAL`: hospital equipment whose model or name matches the manufacturer text
- `PRIORITY`: all active equipment owned by the hospital; the selector also supplies task priority

Supported frequencies:

- `DAILY`
- `WEEKLY`
- `MONTHLY`
- `QUARTERLY`
- `YEARLY`
- `CUSTOM`, which requires a positive `customIntervalDays`

Retired, disposed, and archived equipment cannot receive newly generated tasks.

## Cadence Calculation

Generation evaluates an inclusive date window independently for every eligible equipment record.

For equipment with no generated task under the rule:

1. The initial occurrence is `windowStart`.
2. Further dates are calculated by applying the configured frequency.
3. Every occurrence on or before `windowEnd` is included.

For equipment with generated history:

1. The repository obtains the latest retained deadline for that rule/equipment pair.
2. The next occurrence is calculated from that deadline.
3. Occurrences before `windowStart` are advanced according to the rule frequency.
4. Every remaining occurrence through `windowEnd` is included.

The rule's `lastGeneratedAt` field is operator-facing metadata recording the latest successfully
evaluated window end. It is not the recurrence anchor. Using retained task deadlines prevents an
advancing daily scheduler window from resetting weekly, monthly, quarterly, yearly, or custom
cadence.

## Idempotency and Concurrency

An occurrence is identified by:

```text
hospital + policy rule + equipment record + deadline
```

Generated-history repository queries intentionally include soft-deleted Maintenance tasks. A task
that was archived remains audit evidence that its occurrence already existed and is not regenerated.
The queries use native SQL so the retained equipment row remains available for the dual-hospital
ownership check even after equipment archival.

Manual and scheduled generation both acquire a pessimistic write lock on the hospital-owned policy
row before checking the generation ledger or task history. Consequently, overlapping transactions
for the same rule serialize. Different rules remain independently executable.

`MaintenanceGenerationRun` also has a unique hospital/rule/window key. Repeating the exact same
window returns the existing run. A new overlapping window reconstructs each equipment's cadence
from retained history and creates only later missing occurrences.

## Preview Semantics

Preview is read-only and uses the same occurrence planner as generation. Its counters are:

- `matchedEquipment`: eligible equipment selected by the rule
- `totalDueDates`: distinct missing due dates across selected equipment
- `wouldCreate`: number of missing equipment/deadline occurrences
- `skippedExisting`: distinct retained occurrences already inside the requested window
- `dueDates`: sorted union of missing dates
- `matchedEquipmentCodes`: canonical codes of eligible selected equipment

Because one due date can apply to several equipment records, `wouldCreate` can be greater than
`totalDueDates`.

## Generated Tasks

Each generated occurrence creates a standard `MaintenanceTask` with:

- server-generated `taskCode`
- canonical equipment code, name, and relationship
- rule hospital ownership
- rule maintenance type and priority
- exact occurrence deadline
- initial status `SCHEDULED`
- `policyRuleId` and `generationRunId` audit linkage
- initial SLA state `UPCOMING`

Generated tasks then follow the normal assignment, technician reporting, status-transition,
completion, soft-deletion, ownership, and archived-equipment history rules.

## Scheduler

`PreventiveMaintenanceScheduler` runs daily at 02:30 server-local time by default:

```properties
app.maintenance.automation.cron=0 30 2 * * *
```

It evaluates each active rule from the current date through its configured lead-time horizon. Each
rule runs in its own transaction, so one failed rule does not roll back successful runs for other
rules. The service-level policy lock coordinates scheduler execution with manual generation.

Occurrence calculation is capped at 500 steps per equipment and window. A request that would need
more steps fails explicitly instead of silently truncating generated work.

## SLA and Workload

`POST /sla/refresh` recalculates open-task warning and breach timestamps, assigns `UPCOMING`,
`WARNING`, or `BREACHED`, and escalates qualifying critical or unassigned high-priority work to the
hospital account. `GET /sla` returns current aggregate counts and task lists.

`GET /workload` reports open tasks per active technician and suggests the least-loaded technician
for unassigned `Critical` and `High` work. Suggestions do not change assignments; the hospital must
use the existing Maintenance assignment endpoint.

## Verification Requirements

Focused Maintenance verification covers:

- weekly cadence does not reset when the scheduler window advances daily
- every missing occurrence inside a window is generated
- preview and execution use identical occurrence planning
- exact reruns return the existing generation run
- overlapping windows create only later occurrences
- soft-deleted generated tasks remain cadence anchors
- mismatched task/equipment hospital ownership cannot influence generation history
- manual and scheduled generation use the ownership-scoped policy lock
- generated tasks retain the existing API and lifecycle contract
