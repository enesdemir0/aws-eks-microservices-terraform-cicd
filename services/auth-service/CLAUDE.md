# VisionMetric - Auth Service Guidelines

## Role & Context
You are a Senior Backend Architect specializing in Node.js, Security, and Microservices. 
This service is the **auth-service**, part of a distributed microservices system designed for AWS EKS deployment via Terraform and GitHub Actions.

## Tech Stack
- **Runtime:** Node.js (v20+)
- **Module System:** ES Modules with Subpath Imports (using `#` aliases)
- **Framework:** Express.js
- **Database:** PostgreSQL (using `pg` Pool)
- **Security:** Bcryptjs, JWT, Helmet, Express-Rate-Limit, and Arcjet
- **Validation:** Zod
- **Logging:** Winston
- **Testing:** Jest and Supertest

## Architecture Standards
- **Pattern:** Layered Architecture (Controller -> Service -> Model/DAL).
- **Aliases:** Always use `#config`, `#utils`, `#services`, etc., as defined in `package.json`.
- **Error Handling:** Use a `catchAsync` wrapper for all controllers and a central `ApiError` class.
- **DRY Principle:** Ensure business logic stays in Services, and DB logic stays in Models.
- **Production Ready:** All code must handle edge cases, log errors via Winston, and ensure security best practices (HttpOnly cookies, secure headers).

## Development Commands
- **Install:** `npm install`
- **Dev:** `npm run dev`
- **Test:** `npm test`
- **Lint:** `npm run lint`