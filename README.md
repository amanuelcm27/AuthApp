# AuthApp Documentation

## Introduction

AuthApp is a full-stack authentication and authorization system built with React and Node.js. It supports local email/password login, Google OAuth login, JWT-based sessions, rotating refresh tokens, role-based access control (Admin/User), and role-specific dashboard experiences.

The project demonstrates a production-style auth architecture with a modern frontend UI and persistent backend storage using Prisma + SQLite.

## Objectives

- Provide secure login and registration with a clean user experience.
- Support social login through Google OAuth.
- Enforce backend authorization rules based on user roles.
- Persist users, sessions, and domain data across restarts.
- Offer differentiated role experiences:
	- Admin: user management (list/delete users)
	- User: todo management (create/update/delete personal todos)

## Technology Stack

- Frontend: React + Vite + React Router
- Backend: Node.js + Express
- Authentication: JWT access tokens + rotating refresh token cookie
- OAuth: Google OAuth 2.0
- Persistence: Prisma ORM + SQLite

## System Overview

### Frontend

- Handles login/register UI and OAuth initiation.
- Restores session on page load using refresh endpoint.
- Stores access token in memory only.
- Routes users to role-specific dashboard logic.

### Backend

- Issues access and refresh JWTs.
- Stores refresh token records in database for rotation and revocation.
- Validates bearer access tokens for protected endpoints.
- Restricts admin routes to users with `admin` role.

### Database

- `User`: identity and role data.
- `RefreshToken`: persistent refresh-session records.
- `Todo`: user-owned task records.

## Authentication and Authorization Design

### Session Model

- Access Token:
	- Short-lived JWT.
	- Sent in `Authorization: Bearer <token>` header.
	- Stored in memory (frontend state).

- Refresh Token:
	- Long-lived JWT.
	- Stored in HTTP-only cookie (`/auth/refresh` path).
	- Rotated on each refresh call.
	- Linked to a DB record (`jti`) for revocation and expiry checks.

### Role-Based Access Control

- Role claim is embedded in access token.
- Backend middleware enforces role checks.
- Admin-only routes are inaccessible to normal users even if UI is modified.

## Implementation Details

### 1. Local Registration/Login

1. Frontend posts credentials to backend.
2. Backend verifies email uniqueness (register) or password hash (login).
3. Backend creates session tokens, stores refresh token metadata, sets refresh cookie.
4. Frontend stores access token in memory and renders dashboard.

### 2. Google OAuth

1. Frontend redirects to `/auth/google/start`.
2. Backend creates state token and redirects to Google consent screen.
3. Google returns auth code to `/auth/google/callback`.
4. Backend exchanges code, extracts profile, upserts user, creates session.
5. Backend redirects frontend callback route with access token, refresh cookie already set.

### 3. Session Restore on Reload

1. Frontend calls `/auth/refresh` at app bootstrap.
2. Backend validates refresh token JWT and DB record.
3. Backend revokes old refresh token, issues a new token pair.
4. Frontend restores authenticated state without forcing user to log in again.

### 4. Admin User Management

- Admin can fetch all users.
- Admin can delete other users.
- Self-delete is blocked.

### 5. User Todo Management

- User can list personal todos.
- User can create, toggle completion, and delete todos.
- Todo ownership is enforced server-side by authenticated user ID.

## Project Structure

```text
AuthApp/
	backend/
		prisma/
			schema.prisma
		src/
			app.js
			server.js
			config.js
			db/
				prisma.js
			lib/
				jwt.js
				password.js
			middleware/
				auth.js
			routes/
				authRoutes.js
			services/
				authService.js
			store/
				memoryStore.js
		.env
		package.json

	frontend/
		src/
			main.jsx
			App.jsx
			auth.jsx
			api.js
			styles.css
		.env
		index.html
		vite.config.js
		package.json

	.env.example
	package.json
	README.md
	CONCLUSION.md
```

## Environment Configuration

### Root `.env.example`

Contains shared baseline variables for local setup.

### Backend `.env`

Required values:

- `NODE_ENV`
- `PORT`
- `API_BASE_URL`
- `CLIENT_URL`
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_STATE_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

### Frontend `.env`

- `VITE_API_BASE_URL`

## Setup and Run

1. Install dependencies:

```bash
npm install
```

2. Sync database schema:

```bash
npm run db:push --workspace backend
```

3. Run backend:

```bash
npm run dev --workspace backend
```

4. Run frontend:

```bash
npm run dev --workspace frontend
```

## Available Scripts

### Root

- `npm run dev:backend`
- `npm run dev:frontend`
- `npm run build`
- `npm run lint`

### Backend

- `npm run dev --workspace backend`
- `npm run db:push --workspace backend`
- `npm run prisma:generate --workspace backend`

### Frontend

- `npm run dev --workspace frontend`
- `npm run build --workspace frontend`

## API Reference (Auth Route Group)

### Public

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/google/start`
- `GET /auth/google/callback`

### Authenticated

- `GET /auth/me`
- `GET /auth/todos`
- `POST /auth/todos`
- `PATCH /auth/todos/:todoId`
- `DELETE /auth/todos/:todoId`

### Admin-only

- `GET /auth/admin/health`
- `GET /auth/admin/users`
- `DELETE /auth/admin/users/:userId`

## Security Notes

- Access token is not persisted in local storage.
- Refresh token is HTTP-only and not readable by client JavaScript.
- Refresh rotation prevents unlimited reuse of stolen refresh tokens.
- Backend authorization is mandatory; frontend route guards are UX convenience only.
- OAuth state token is validated to reduce CSRF risks in callback flow.

## Troubleshooting

- If backend fails with `EADDRINUSE`, another process is using the configured port.
- If frontend shows API errors, confirm `VITE_API_BASE_URL` matches running backend.
- If Google login fails, verify redirect URI in Google Console exactly matches backend callback URL.
- If sessions fail after major backend changes, clear localhost cookies and sign in again.

## Testing and Validation Status

- Frontend production build is validated.
- Backend starts successfully when a free port is available.
- Prisma schema sync is validated via `db:push`.

For project outcomes and final remarks, see [CONCLUSION.md](CONCLUSION.md).
