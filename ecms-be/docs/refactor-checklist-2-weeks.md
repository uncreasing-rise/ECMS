# ECMS Backend Refactor Checklist (2 Weeks)

## Week 1

### Day 1
- Baseline: run `npm run lint`, `npm run test`, and capture current numbers.
- Freeze API contracts for `auth`, `classes`, `notifications`, `students`.
- Create tracking board with labels: `typing`, `service-split`, `tests`, `perf`.

### Day 2
- Remove `any` from Auth request/user flow (`CurrentUser`, `Request`, JWT payload).
- Type all controller signatures in `auth`, `classes`, `notifications`, `students`.
- Ensure no unsafe member access in these entry points.

### Day 3
- Split `ClassesService` by domain using composition:
  - lifecycle
  - schedules
  - assignments
  - exams
  - grading
- Keep core logic stable in `ClassesCoreService` to avoid regression.

### Day 4
- Add unit tests for each domain service wrapper and facade delegation.
- Add smoke integration tests for high-risk routes:
  - class create/update/delete
  - assignment submit/grade
  - exam start/submit

### Day 5
- Stabilize lint errors in auth/controllers/classes split files.
- Replace console logs with Nest `Logger` in backend services.
- Add CI step to fail on lint errors in edited files.

## Week 2

### Day 6
- Extract business rules from `ClassesCoreService` into domain services incrementally.
- Move pure helper functions to dedicated utility modules.

### Day 7
- Standardize Prisma query typing (`where`, payload mappers, DTO mapping).
- Remove unsafe casts where practical (`as any` hotspots in business code).

### Day 8
- Add transaction-focused tests for grading/exam submission paths.
- Add authorization tests for role/ownership boundaries.

### Day 9
- Add performance safety:
  - notification bulk flow batching/queue strategy
  - exam submission path timing metrics
- Add observability logs for critical flows.

### Day 10
- Final hardening pass:
  - lint + tests green
  - remove dead code and empty placeholder files
  - update architecture docs and handoff notes

## Effort Estimate
- Typing cleanup (Auth + controllers): 2-3 dev-days
- Service split + wiring: 2 dev-days
- Test scaffolding + key scenarios: 2-3 dev-days
- Core logic extraction + hardening: 3-4 dev-days
