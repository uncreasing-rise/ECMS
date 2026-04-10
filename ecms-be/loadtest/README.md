# Load Test Guide (10k Users Readiness)

This folder contains baseline k6 scenarios for quick capacity checks.

## Prerequisites

- Run API service (`npm run start:dev` or deployed URL).
- For auth scenario, provide valid credentials or token.
- Install k6: https://k6.io/docs/get-started/installation/

## 1) Smoke Test

Quick sanity check for endpoint latency and error rate.

```bash
BASE_URL=http://localhost:3000 ENDPOINT=/ k6 run loadtest/smoke.js
```

## 2) Authenticated Profile Peak Test

Simulates sustained authenticated traffic on profile API.

```bash
BASE_URL=http://localhost:3000 LOGIN_EMAIL=test@example.com LOGIN_PASSWORD=secret PEAK_VUS=300 k6 run loadtest/auth-profile.js
```

Or use a pre-issued token:

```bash
BASE_URL=http://localhost:3000 ACCESS_TOKEN=<jwt> PEAK_VUS=300 k6 run loadtest/auth-profile.js
```

## 3) Spike Test

Stress burst to validate system behavior under sudden traffic jumps.

```bash
BASE_URL=http://localhost:3000 ENDPOINT=/ k6 run loadtest/spike.js
```

## Suggested Pass Criteria for 10k Registered Users

- `http_req_failed < 2%` (smoke/peak), `< 5%` (spike)
- `p95 < 800ms` for core authenticated APIs
- `p99 < 1500ms` for core authenticated APIs
- Queue backlog should drain after burst (monitor Redis/BullMQ)

## Notes

- 10k total users is different from 10k concurrent users.
- Focus on peak concurrency, request rate (RPS), and notification fan-out bursts.
- Run tests in staging with production-like database and Redis sizing.
