# Rollout Checklist

Use this as the go/no-go checklist for scaling ECMS from 10k to 1M users.

## Baseline Requirements

- Production compose stack is up: app, redis, postgres, pgbouncer.
- `LOAD_TEST_MODE=false`.
- `REDIS_ENABLED=true`.
- `DATABASE_URL` points to `pgbouncer`.
- Dashboards and logs are available before any rollout.

## Phase 1: 10k Users

Goal: prove the stack is stable under realistic single-region load.

Pass if all are true:

- p95 latency stays under 250 ms for typical read endpoints.
- p95 latency stays under 500 ms for auth/login and write endpoints.
- Error rate stays under 1%.
- Redis hit ratio is above 70% for hot auth/read paths.
- PostgreSQL CPU stays below 60% sustained.
- No connection pool exhaustion in app, Redis, or pgbouncer.

Fail if any are true:

- p95 exceeds the limits above for 5 minutes or more.
- 5xx rate exceeds 0.5%.
- App instances restart under normal load.
- PostgreSQL active connections approach the configured ceiling.

## Phase 2: 100k Users

Goal: validate horizontal scale and cache effectiveness.

Pass if all are true:

- p95 latency stays under 300 ms for reads.
- p95 latency stays under 700 ms for writes/auth.
- Error rate stays under 0.5%.
- Redis CPU stays below 70% and memory stays below 75%.
- PostgreSQL read replicas handle at least 60% of read traffic.
- Load balancer distributes traffic evenly across app instances.
- No throttling misfires on legitimate traffic.

Fail if any are true:

- Redis becomes a bottleneck or evicts hot keys excessively.
- Database write latency climbs continuously under steady traffic.
- One app instance carries a disproportionate share of traffic.
- pgbouncer queueing becomes persistent.

## Phase 3: 1M Users

Goal: verify the architecture can support large bursts and sustained multi-region traffic.

Pass if all are true:

- p95 latency stays under 400 ms for reads.
- p95 latency stays under 900 ms for writes/auth.
- Error rate stays under 0.2%.
- Autoscaling reacts before CPU exceeds 70% for more than 5 minutes.
- App, Redis, and database have clear headroom during peak windows.
- Read replicas, cache, and LB can absorb at least 2x current steady-state traffic.
- Disaster recovery and backup restore procedures are tested.

Fail if any are true:

- Requests queue up longer than the SLO window.
- Cache misses force too many database round trips.
- Database failover causes prolonged service interruption.
- Rate limiting blocks legitimate user traffic at scale.

## Rollout Order

1. Deploy app + Redis + PostgreSQL + pgbouncer in staging.
2. Run smoke and ramp tests against staging.
3. Promote to one production region.
4. Enable autoscaling and observe at 10k load.
5. Expand to 100k with read replicas and cache tuning.
6. Only move to 1M after 10k and 100k gates pass for at least 3 consecutive runs.

## Required Observability

- Request rate, error rate, p95/p99 latency.
- Redis memory, hit ratio, and evictions.
- PostgreSQL CPU, connections, locks, and replication lag.
- App heap, event loop lag, and process restarts.
- LB 4xx/5xx counts and per-instance distribution.