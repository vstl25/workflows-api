# Workflows API - Project Context

**Last Updated:** 2026-06-16  
**Project Name:** workflows-api  
**Description:** RESTful API for multi-tenant workflows  
**Current Status:** In Development

---

## 📋 Project Overview

A multi-tenant workflow management API built with Node.js/Express and TypeScript. Supports user authentication (JWT-based), tenant management, workflow creation and management, and work item tracking with SLA scheduling.

---

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js ^5.2.1
- **Language:** TypeScript ^6.0.3
- **Database:** PostgreSQL (via pg ^8.21.0)
- **Dev Tools:** tsx, nodemon, ts-node-dev

### Core Dependencies
- **Authentication:** jsonwebtoken ^9.0.3, bcrypt ^6.0.0
- **Validation:** joi ^18.2.1
- **Security:** helmet ^8.2.0, cors ^2.8.6
- **Logging:** morgan ^1.11.0
- **Scheduling:** node-cron ^4.2.1
- **Environment:** dotenv ^17.4.2

### Scripts
```json
{
  "dev": "tsx watch src/server.ts",      // Development mode with auto-reload
  "build": "tsc",                         // Compile TypeScript to JavaScript
  "start": "node dist/server.js"          // Production start
}
```

---

## 📁 Project Structure

```
workflows-api/
├── src/
│   ├── server.ts                    // Main entry point (PORT: 3003)
│   ├── config/
│   │   └── db.ts                    // Database configuration
│   ├── controller/                  // Route handlers
│   │   ├── auth.controller.ts
│   │   ├── item.controller.ts
│   │   ├── login.controller.ts
│   │   ├── tenant.controller.ts
│   │   └── workflow.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts       // JWT verification
│   │   ├── validate.middleware.ts   // Request body validation (Joi)
│   │   └── validateParams.middleware.ts  // URL params validation
│   ├── repositories/                // Database queries
│   │   ├── item.repository.ts
│   │   ├── login.repository.ts
│   │   ├── refresh.repository.ts
│   │   ├── tenant.repository.ts
│   │   └── workflow.repository.ts
│   ├── Routes/                      // API route definitions
│   │   ├── auth.routes.ts
│   │   ├── item.routes.ts
│   │   ├── login.routes.ts
│   │   ├── tenant.routes.ts
│   │   └── workflow.routes.ts
│   ├── services/                    // Business logic layer
│   │   ├── auth.service.ts
│   │   ├── item.service.ts
│   │   ├── login.service.ts
│   │   ├── tenant.service.ts
│   │   └── workflow.service.ts
│   ├── jobs/
│   │   └── sla.scheduler.ts         // SLA job scheduling (node-cron)
│   ├── utility/
│   │   ├── generateJWTToken.ts
│   │   └── generateRefreshToken.ts
│   ├── validations/                 // Joi schemas
│   │   ├── approver.validation.ts
│   │   ├── item.validation.ts
│   │   ├── login.validation.ts
│   │   ├── tenant.validation.ts
│   │   └── workflow.validation.ts
│   └── db_dump/
│       └── workflow.sql             // Database schema
├── package.json
├── tsconfig.json
├── README.md
└── Proposed plan.md                 // Current development tasks
```

---

## 🔌 API Endpoints

### Authentication Routes (`/auth`)
```
POST   /auth/login          - User login (returns JWT in 'token' cookie)
POST   /auth/refresh        - Refresh JWT token
POST   /auth/logout         - User logout
```

### Tenant Routes (`/tenantlist`) - Protected
```
GET    /tenantlist/:userid  - Get tenants for a user (JWT required)
                              Validates userid as UUID
                              Returns: tenant.id, tenant.name (active only)
```

### Workflow Routes (`/workflows`) - Protected
```
POST   /workflows/create    - Create new workflow (JWT required)
                              Body validation via Joi schema
```

### Item Routes (`/item`) - Protected
```
[Endpoints to be documented from controller]
```

### Login Routes (`/login`)
```
[Endpoints to be documented from controller]
```

---

## 🔐 Authentication & Security

### JWT Implementation
- **Token Storage:** HTTP-only cookies (named 'token')
- **Secret Key:** `process.env.JWT_TOKEN_SECRET`
- **Verification:** auth.middleware.ts validates all protected routes
- **Token Refresh:** refresh.repository.ts handles token rotation

### Middleware Stack
1. **CORS** - Cross-origin requests
2. **Helmet** - Security headers
3. **Morgan** - Request logging
4. **Auth Middleware** - JWT verification on protected routes
5. **Validation Middleware** - Joi schema validation on request body
6. **Param Validation** - UUID and other parameter validation

---

## 💾 Database

### Key Tables
- **tenants** - Tenant information (is_active flag for filtering)
- **tenant_memberships** - User-to-tenant associations
- **users** - User accounts with credentials
- **workflows** - Workflow definitions
- **work_items** - Individual items in workflows
- **[Other tables from workflow.sql]**

### Query Pattern
Controllers → Services → Repositories → Database

---

## 📝 Current Development Plan (Proposed plan.md)

### Task: Add JWT verification middleware & Tenant List endpoint

**Status:** In Implementation

**Requirements:**
1. ✅ JWT verification middleware exists
2. ✅ Joi validation for userid (UUID)
3. ✅ Repository query for active tenants by user_id with joins
4. ✅ Service + Controller layer
5. ✅ Route definition and server wiring
6. ✅ GET /tenantlist/:userid endpoint

**Key Assumptions:**
- JWT token supplied in 'token' cookie (set by login.controller.ts)
- Route: GET /tenantlist/:userid (protected, requires JWT)
- userid validated as UUID
- Only return active tenants (is_active = true)
- Response format: tenant list with id and name

---

## 🚀 Frontend Integration Plan

### Upcoming Work
- **Goal:** Add frontend and backend in same folder structure
- **Frontend Technology:** [To be determined]
- **Folder Structure:** 
  ```
  project-root/
  ├── backend/          (current workflows-api)
  ├── frontend/         (new React/Vue/Angular app)
  └── PROJECT_CONTEXT.md (this file)
  ```

---

## 🔧 Environment Variables

Required `.env` file:
```
PORT=3003
JWT_TOKEN_SECRET=[your-secret-key]
DB_HOST=[postgresql-host]
DB_PORT=5432
DB_NAME=[database-name]
DB_USER=[database-user]
DB_PASSWORD=[database-password]
```

---

## 📦 Running the Project

### Development
```bash
npm install
npm run dev          # Starts tsx watch with auto-reload
```

### Production Build
```bash
npm run build        # Compile TypeScript
npm start            # Run compiled JavaScript
```

---

## 🔄 Architecture Pattern

**3-Tier Architecture:**
```
Routes (API Endpoints)
    ↓
Controllers (Request handlers)
    ↓
Services (Business logic)
    ↓
Repositories (Database queries)
    ↓
Database (PostgreSQL)
```

**Middleware Chain:**
```
Request → CORS/Helmet/Morgan → Auth → Validation → Controller → Response
```

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| server.ts | Express app setup, route mounting, SLA scheduler start |
| auth.middleware.ts | JWT token verification from cookies |
| validate.middleware.ts | Request body schema validation |
| validateParams.middleware.ts | URL parameter validation |
| *.validation.ts | Joi schema definitions |
| *.service.ts | Business logic and data transformation |
| *.controller.ts | Request/response handling |
| *.repository.ts | Direct database queries |
| sla.scheduler.ts | Scheduled jobs using node-cron |

---

## 🎯 Next Steps (when adding frontend)

1. Reorganize folder structure (backend/ and frontend/ folders)
2. Create separate package.json for frontend
3. Configure proxy for API calls during development
4. Implement frontend components for:
   - Login form
   - Tenant selection
   - Workflow management UI
   - Work item tracking UI
5. Implement SLA visualization on frontend
6. Add error handling and retry logic

---

## 📞 Important Notes

- **Database:** Uses PostgreSQL with pg driver
- **Type Safety:** Full TypeScript support throughout
- **Multi-tenant:** All queries filter by tenant context
- **JWT Cookies:** Secure, HTTP-only cookies for tokens
- **SLA Jobs:** Automatically started on server initialization
- **Response Format:** RESTful JSON responses

---

**Ready for frontend implementation. Share this file when setting up new workspace.**
