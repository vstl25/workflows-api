# workflows-api

A backend API for a multi-tenant workflow management platform.

## Run the backend

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Start built server

```bash
npm start
```

## Environment variables

Create a `.env` file from your local configuration and set the following values:

```env
PORT=3003
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
JWT_TOKEN_SECRET=your_jwt_secret
JWT_TTL_MINUTES=2
```
Note: usually we don't commit .env file for assessment I have added to make bootup process simple
## Project structure

```
src/
├── config/
│   └── db.ts
├── controller/
├── middleware/
├── repositories/
├── routes/
├── services/
├── utility/
└── jobs/
```

## Key features

- Express + TypeScript API
- PostgreSQL via `pg`
- JWT authentication with access + refresh tokens
- Role-based tenant authorization
- Security middleware: `helmet`, `express-rate-limit`, `express-slow-down`, `xss-clean`, `hpp`
- SLA scheduler job support

## Notes

- The backend uses `httpOnly` cookies for tokens.
- `JWT_TOKEN_SECRET` must be set before issuing tokens.
- This project currently requires a running Postgres database.

## Documentation references

- [Architecture details](./ARCHITECTURE.md)
- [Database restore instructions](./DB_RESTORE.md)
- [Known limitations](./LIMITATIONS.md)

## Sample users and roles

Use these sample accounts to test workflow behavior:

- **Admin**: `sri@gmail.com` / `password123`
  - Role: `admin` under tenant `Mindx360`
  - Can access workflow creation and management pages.

- **Approver**: `user1@gmail.com` / `password123`
  - Role: `approver` under tenant `Mindx360`
  - Can approve requests when the workflow policy requires approver role.

- **Viewer**: `user2@gmail.com` / `password123`
  - Role: `viewer` under tenant `Mindx360`
  - Can create item requests.

