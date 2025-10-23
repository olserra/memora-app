(# Authentication — memora-app)

This document collects the full auth design, important files, environment variables, and troubleshooting steps for the memora-app project. Place this file in the repository so automated agents (and new developers) always have a single authoritative reference for how authentication works and how to debug issues.

## High-level overview

- The app uses a combination of custom session cookies (signed JWTs using `jose`) and NextAuth for third-party sign-in (Google) and credentials provider.
- Session cookies (named `session`) are created by server-side helpers in `lib/auth/session.ts`. These helpers sign/verify JWTs using the secret provided in `process.env.AUTH_SECRET`.
- The app also exposes NextAuth routes at `app/api/auth/[...nextauth]/route.ts` for social sign-ins and credential-based sign-ins.
- Authentication-aware server actions and UI components are in `app/(login)/actions.ts` and `app/(login)/login.tsx` respectively.

## Important files

- `lib/auth/session.ts`

  - Responsible for hashing passwords (`bcryptjs`) and signing/verifying session JWTs using `jose` (`SignJWT`, `jwtVerify`).
  - Exports these helper functions: `hashPassword`, `comparePasswords`, `signToken`, `verifyToken`, `getSession`, `setSession`.
  - Enforces that a non-empty `AUTH_SECRET` is used in production; in development it generates a random secret and logs a warning.

- `app/api/auth/[...nextauth]/route.ts`

  - NextAuth route. Configures providers (Google, Credentials) and session strategy (`jwt`).
  - Credentials provider authorizes users by looking up the user in the DB and comparing passwords.

- `app/(login)/actions.ts`

  - Server actions for `signIn`, `signUp`, `signOut`, etc. Uses `lib/auth/session.ts` to set the `session` cookie after successful sign-in or sign-up.

- `app/(login)/login.tsx`

  - Client UI for the sign-in/sign-up pages and the Google sign-in button.

- `lib/db/drizzle.ts`, `lib/db/queries.ts`, and `lib/db/schema.ts`
  - DB connection and query helpers (Drizzle ORM). `drizzle.ts` throws if `POSTGRES_URL` is not set.

## Environment variables

- POSTGRES_URL — required. Connection string used by `drizzle`.
- AUTH_SECRET — used by `lib/auth/session.ts` (required in production). Must be a non-empty string. Example: a 32+ byte random value.
- GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET — required if Google sign-in is used.

Notes:

- In production, `AUTH_SECRET` must be set. The app will throw a clear error at startup if missing.
- In development, the app now auto-generates a random secret if `AUTH_SECRET` is missing to avoid a runtime "Zero-length key is not supported" error from `jose`. This makes local development easier but means sessions won't persist across restarts unless you set `AUTH_SECRET` in `.env.local`.

## Common error: "Zero-length key is not supported"

Symptom:

- Stacktrace referencing `jose` internals and the message `Zero-length key is not supported` when calling `SignJWT`/`jwtVerify`.

Cause:

- The app attempted to construct a signing key from `process.env.AUTH_SECRET`, but that env var was an empty string or undefined. `new TextEncoder().encode('')` creates a zero-length Uint8Array and `jose` rejects that.

Fix applied in this repo:

- `lib/auth/session.ts` now validates `AUTH_SECRET` on startup:
  - If `AUTH_SECRET` is missing in production, the app throws a clear error instructing you to set `AUTH_SECRET`.
  - If `AUTH_SECRET` is missing in development, the code auto-generates a random secret and logs a console warning so local flows keep working.

How to reproduce and verify locally:

1. Start the dev server (port 3000 is the default; Next may pick 3001 if 3000 is in use):

```zsh
pnpm dev
```

2. Use the provided minimal smoke-test script to exercise sign-up and sign-in without installing extra test deps. This script posts form data to the server actions and verifies responses.

```zsh
# run against the dev server base URL (set BASE_URL if dev server ran on a different port)
BASE_URL=http://localhost:3001 node scripts/test-auth.js
```

Expected result: both sign-up and sign-in return HTTP 200 and the server does not show the jose "Zero-length key" error in logs.

## Debugging tips

- Check env vars first. Common missing vars:

  - POSTGRES_URL
  - AUTH_SECRET (required in production)
  - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET

- Search for `AUTH_SECRET` references to find code paths that rely on it.

- If you see `Zero-length key is not supported` in logs:

  - Confirm `AUTH_SECRET` is set (not empty) in your environment.
  - If this is production, stop and set `AUTH_SECRET` — the app will not start without it.

- If you intentionally want to rotate the secret / invalidate sessions:
  - Changing `AUTH_SECRET` will invalidate existing sessions (they're signed with the previous secret). Plan rotation carefully.

## Development recommendations

- Add a stable `AUTH_SECRET` to your `.env.local` file in development to persist sessions between restarts:

```env
AUTH_SECRET=replace_with_a_secure_random_value
POSTGRES_URL=postgres://user:pass@localhost:5432/db
```

- Use a password manager or secret manager in production to generate/store a 32+ byte secret. Example command to generate a secret locally:

```zsh
# 32 bytes -> 64 hex chars
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## How session signing/verification flows

1. After successful sign-in or sign-up, the server calls `setSession(user)` which:

   - Builds a payload { user: { id }, expires }
   - Signs it with `SignJWT` using an HMAC key built from `AUTH_SECRET`.
   - Sets a cookie named `session` (httpOnly, secure, sameSite=lax).

2. On subsequent requests, server helpers:

   - Read the `session` cookie from `next/headers`.
   - Call `verifyToken(cookie)` which uses `jwtVerify` and returns the payload.
   - The payload is used to look up the user in the database.

3. If verification fails (invalid signature, expired token, malformed cookie), the user is treated as unauthenticated.

## Next steps & optional improvements

- Consider aligning on a single secret env var name across NextAuth and custom session helpers (e.g., `NEXTAUTH_SECRET`) to reduce confusion.
- Add a small startup check script that prints missing required env vars in a friendly way and fails fast.
- If you want persistent, automated E2E tests, I can add Playwright tests and the necessary dev deps.

## Contacting the original author

If anything in this doc becomes stale, update this file immediately. This repository contains both custom session logic and NextAuth; changes that affect how cookies, tokens, or providers are configured should be reflected here.

---

Last updated: 2025-10-23
