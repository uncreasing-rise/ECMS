# Portal and Exam SRE Checklist

## API performance targets

- Normal API P95 < 300ms.
- Exam API P95 < 500ms with stability prioritized.

## Redis cache policy

- Cache teacher dashboard 60s: key `portal:teacher:dashboard:{teacherId}`.
- Cache parent child overview 60s: key `portal:parent:overview:{studentId}`.
- Invalidate cache after grade/attendance/material updates when needed.

## Database and API reliability

- Add DB index review for high-frequency paths:
  - `submissions(graded_at, assignment_id)`
  - `class_schedules(class_id, starts_at)`
  - `exam_sessions(exam_id, student_id, status)`
  - `attendances(student_id, schedule_id)`
- Keep autosave endpoint idempotent and low payload.
- Limit large list endpoints with pagination defaults.

## Load test before go-live

- Requirement: at least 500 concurrent exam takers.
- Scenarios:
  - Start session burst.
  - Autosave every 30s per active session.
  - Mixed submit around exam end window.
- Tools: k6 or Artillery in CI pre-release.
- Gate: fail release if exam API error rate > 1% or P95 > 500ms.

## Uptime and recovery

- Target uptime >= 99.5%.
- Recovery objective: restart < 5 minutes.
- Required controls:
  - Health checks (liveness/readiness).
  - Auto-restart policy in process manager/orchestrator.
  - Alerting on high error rate, DB latency, queue backlog.
  - Runbook for Redis outage fallback and DB failover.

## Observability

- Structured logs for all exam session transitions.
- Track anti-cheat violations and alert on abnormal spikes.
- Dashboards:
  - API latency by endpoint group.
  - Error rate and saturation.
  - Active exam sessions over time.
