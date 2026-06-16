# Backend Known Limitations

## Current limitations

- No formal OpenAPI/Swagger documentation is included.
- Error handling is generic in some controllers and may expose limited implementation details.
- Role enforcement is applied in controllers/services, but not all routes may be consistently protected yet.
- Rate limiting and speed limiting are global; fine-grained endpoint-specific limits are not fully tuned.
- No explicit CORS origin whitelist is configured; `cors` currently allows any origin with credentials.
- There is no production-ready logging or observability integration.
- The refresh token mechanism relies on cookies, so frontend and backend must be hosted on compatible domains.
- No multi-region or horizontal scaling concerns are addressed in the current architecture.
