# Backend Architecture

## Overview

The backend is an Express.js API written in TypeScript. It supports multi-tenant workflow management with a PostgreSQL database.

## Key components

- `src/server.ts`: application entry point and middleware setup
- `src/config/db.ts`: PostgreSQL connection configuration
- `src/controller/*`: Express route handlers
- `src/routes/*`: route registration
- `src/services/*`: business logic and authentication
- `src/repositories/*`: database access methods using `pg`
- `src/middleware/*`: authorization and validation middleware
- `src/utility/*`: reusable utility functions such as JWT generation
- `src/jobs/*`: scheduled jobs such as SLA checks

## Security

- `helmet` for HTTP headers
- `express-rate-limit` for request rate limiting
- `express-slow-down` for throttling repeated requests
- `xss-clean` for input sanitization
- `hpp` for HTTP parameter pollution prevention

## Auth flow

- Login route validates credentials and issues an access token + refresh token via httpOnly cookies
- Access tokens are short lived (`JWT_TTL_MINUTES`)
- Refresh tokens are persisted in the database and can be rotated
- Protected routes validate access token and tenant membership

## Tenant-based authorization

- Users are associated with tenants and roles
- Tenant membership determines access to workflows, approvals, and raise request operations
- Role checks are performed in service/controller layers
