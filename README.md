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
