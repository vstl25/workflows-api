# Workflows API - Quick Reference

## 🚀 Quick Start
```bash
npm install
npm run dev          # localhost:3003
```

## 📡 Current API Endpoints
```
POST   /auth/login              - Login (returns JWT cookie)
POST   /auth/refresh            - Refresh token
POST   /auth/logout             - Logout

GET    /tenantlist/:userid      - Get user's active tenants [Protected]
POST   /workflows/create        - Create workflow [Protected]
GET    /item                    - Get items [Protected]
```

## 🏗️ Architecture
- **Controllers** → **Services** → **Repositories** → **Database**
- **Middleware**: CORS → Helmet → Morgan → Auth → Validation → Handler

## 📂 Key Folders
- `src/controller/` - Route handlers
- `src/services/` - Business logic
- `src/repositories/` - DB queries
- `src/Routes/` - API definitions
- `src/validations/` - Joi schemas
- `src/middleware/` - Auth, validation

## 🔐 Auth Pattern
- **Storage**: HTTP-only 'token' cookie
- **Secret**: `process.env.JWT_TOKEN_SECRET`
- **Middleware**: All routes use `authMiddleware`
- **Validation**: URL params validated with Joi

## 💾 Database
- **Type**: PostgreSQL
- **Key Tables**: tenants, tenant_memberships, users, workflows, work_items
- **Multi-tenant**: All queries filter by tenant context

## 🔧 Tech Stack
- Express.js, TypeScript, PostgreSQL, JWT, Joi, bcrypt, node-cron

## 📋 Current Task
**Add Tenant List Endpoint:**
- GET /tenantlist/:userid
- Returns active tenants for user (joins with tenant_memberships)
- Protected, UUID validation on userid param
- Status: In Implementation

## 🎯 Frontend Integration
- Plan: Add frontend/ folder alongside existing backend
- Implement UI for: Login, tenant selection, workflows, work items
- Share PROJECT_CONTEXT.md when setting up new workspace

## 🔑 Environment Variables
```
PORT, JWT_TOKEN_SECRET, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
```

**More Details:** See PROJECT_CONTEXT.md
