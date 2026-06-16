Proposed plan
Add JWT verification middleware

Create src/middleware/auth.middleware.ts
Verify JWT using process.env.JWT_TOKEN_SECRET
Read token from the same cookie the login sets (token)
If invalid/missing, return 401 Unauthorized
Add Joi validation for userid

Create a validation schema in src/validations/tenant.validation.ts
Validate req.params.userid as a required UUID
Add repository query

Create src/repositories/tenant.repository.ts
Query:
tenant_memberships filtered by user_id
join tenants
only active tenants (tenants.is_active = true)
Return tenant.id and tenant.name
Add service + controller

Service method that calls repository and returns mapped tenant list
Controller that handles GET /tenantlist/:userid
Response format:
Add route and server wiring

Update tenant.routes.ts to define GET /:userid
Use validate() and auth middleware on that route
Update server.ts to mount route at /tenantlist
Assumptions
JWT token is supplied in the token cookie, because login.controller.ts sets that cookie.
The API route should be exactly GET /tenantlist/:userid
The route is protected and requires a valid JWT even though the user id is in the path
userid should be validated as a UUID