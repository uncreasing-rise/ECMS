# ECMS Backend (NestJS + Prisma)

Backend system for English Center Management based on your data model.

## Stack

- NestJS 11
- Prisma 7
- PostgreSQL
- JWT authentication
- Class-validator DTO validation

## Implemented Modules

- Auth
- Users
- Branches
- Courses
- Classes
- Enrollments
- Finance (invoices, receipts, transactions)

The full table structure from your design is implemented in Prisma schema at `prisma/schema.prisma`.

## Setup

1. Install dependencies.

```bash
npm install
```

2. Configure environment.

```bash
copy .env.example .env
```

3. Update `DATABASE_URL` and `JWT_SECRET` in `.env`.

4. Generate Prisma client.

```bash
npm run prisma:generate
```

5. Run migrations.

```bash
npm run prisma:migrate -- --name init
```

6. Seed initial data (roles, permissions, admin user).

```bash
npm run db:seed
```

7. Start dev server.

```bash
npm run start:dev
```

## Default Login

- Username: `admin`
- Password: `admin123`

Change this account immediately in production.

## NPM Scripts

- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:deploy`
- `npm run prisma:studio`
- `npm run db:seed`
- `npm run build`
- `npm run start:dev`

## API Overview

Public endpoints:

- `POST /auth/login`

Protected endpoints (Bearer token):

- `GET /auth/me`
- `GET|POST|PATCH|DELETE /users`
- `GET|POST|PATCH|DELETE /branches`
- `GET|POST|PATCH|DELETE /courses`
- `GET|POST|PATCH|DELETE /classes`
- `GET|POST|PATCH|DELETE /enrollments`
- `GET|POST /finance/invoices`
- `POST /finance/receipts`
- `GET|POST /finance/transactions`

## Notes

- ValidationPipe is enabled globally with whitelist and transform.
- Passwords are stored as bcrypt hashes.
- JWT payload includes user id, username, type, status, and roles.

## Production Topology (1M-user Target)

Use this serving path in production:

Client -> CDN -> Load Balancer -> App Servers -> Cache -> Database

### Layer Mapping For ECMS

1. Client
- Web/mobile clients call API over HTTPS.

2. CDN
- Cache static assets and edge cache safe GET endpoints where possible.
- Add WAF and bot/rate rules at edge before traffic reaches origin.

3. Load Balancer
- Terminate TLS.
- Health-check app instances and spread traffic across healthy nodes.
- Use sticky sessions only if required; JWT flow is stateless by default.

4. App Servers
- Run multiple ECMS instances behind LB.
- For one host with many CPU cores, use cluster script:
	- `npm run start:cluster`
- For multi-host scaling, run one or more workers per host via `WEB_CONCURRENCY`.

5. Cache
- Use Redis for:
	- Shared throttling storage
	- Hot auth/profile cache
	- Short-lived anti-burst keys
- In production, avoid local in-memory cache for shared state.

6. Database
- PostgreSQL primary for writes.
- Add read replicas for heavy read traffic.
- Keep indexes aligned with hot query filters/sorts.

### Required Production Settings

- `REDIS_ENABLED=true`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`
- `WEB_CONCURRENCY` tuned to host CPU
- `THROTTLE_LIMIT` and auth throttle limits tuned per traffic profile
- `LOAD_TEST_MODE=false` in production

### Capacity Notes

- 1,000,000 users requires horizontal scaling (many app instances + Redis + DB replicas), not a single node.
- Keep p95 latency and error-rate SLOs, then autoscale by CPU, memory, and request queue depth.

### Rollout Checklist

- See [docs/rollout-checklist.md](docs/rollout-checklist.md) for phase gates at 10k, 100k, and 1M users.
