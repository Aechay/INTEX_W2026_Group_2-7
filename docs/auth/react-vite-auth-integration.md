# React + Vite Auth Integration Guide

This document describes how the current backend auth system should be integrated into the React + Vite frontend.

It is written for the current stack:

- React 19
- TypeScript
- Vite
- ASP.NET Core Identity backend
- bearer-first SPA auth using opaque access and refresh tokens

## Current backend contract

The frontend should treat the backend as an API-first auth provider.

### Important detail

The backend does **not** issue JWTs. It issues opaque bearer tokens through ASP.NET Core Identity.

That means:

- the frontend should not decode tokens
- the frontend should not inspect token claims client-side
- the frontend should call `/auth/me` to learn who the current user is and what roles they have

## Backend endpoints the frontend should use

These routes are mounted under `/auth`.

### Register

`POST /auth/register`

Request body:

```json
{
  "email": "student@example.com",
  "password": "Student123!"
}
```

### Login

`POST /auth/login?useCookies=false`

Request body:

```json
{
  "email": "student@example.com",
  "password": "Student123!"
}
```

Current response shape from ASP.NET Core Identity bearer auth:

```json
{
  "tokenType": "Bearer",
  "accessToken": "...",
  "expiresIn": 3600,
  "refreshToken": "..."
}
```

### Refresh

`POST /auth/refresh`

Request body:

```json
{
  "refreshToken": "..."
}
```

Response shape is the same as login.

### Current user

`GET /auth/me`

Headers:

```http
Authorization: Bearer {accessToken}
```

Response shape:

```json
{
  "userId": "...",
  "email": "student@example.com",
  "roles": ["User"]
}
```

### Logout

`POST /auth/logout`

Headers:

```http
Authorization: Bearer {accessToken}
```

This should be called before clearing client-side auth state when possible.

## Recommended frontend architecture

### Add these pieces first

- `react-router-dom`
- an auth provider
- a single API client wrapper around `fetch`
- route guards for authenticated and admin pages

The frontend does not need Redux or a large auth library for this setup.

## Recommended file structure

One reasonable starting point:

```text
src/
  app/
    router.tsx
  auth/
    auth-storage.ts
    auth-types.ts
    auth-api.ts
    AuthProvider.tsx
    useAuth.ts
    RequireAuth.tsx
    RequireAdmin.tsx
  lib/
    api-client.ts
  pages/
    public/
    auth/
    app/
    admin/
```

## Recommended token storage strategy

Recommended starting point for this project:

- keep the access token in memory
- keep the refresh token in `sessionStorage`
- rebuild auth state on page load by using the refresh token

Why:

- memory-only access tokens reduce accidental long-lived exposure
- `sessionStorage` survives reloads in the same tab
- `sessionStorage` avoids the longer persistence of `localStorage`

Tradeoff:

- a full browser close clears session state

If the team later decides it wants "stay signed in across browser restarts", that can be revisited, but it should be treated as a deliberate security tradeoff.

## Auth state model

The frontend auth state should look roughly like this:

```ts
type AuthUser = {
  userId: string
  email: string
  roles: string[]
}

type AuthSession = {
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
  user: AuthUser | null
  isBootstrapping: boolean
}
```

## Startup flow

At app startup:

1. Read the refresh token from `sessionStorage`.
2. If there is no refresh token, treat the user as signed out.
3. If there is a refresh token, call `/auth/refresh`.
4. Save the new access token and refresh token.
5. Call `/auth/me`.
6. Store the returned user and roles in auth state.
7. Render the app after bootstrap completes.

This avoids treating users as logged out during a normal page refresh.

## API client behavior

All authenticated API calls should go through one wrapper.

### Responsibilities

- add `Authorization: Bearer {accessToken}` when available
- on a `401`, try a single token refresh
- retry the original request once after a successful refresh
- if refresh fails, clear auth state and redirect to login

### Important rule

Do not scatter token refresh logic across many components. Keep it in one place.

## Auth provider responsibilities

The auth provider should expose:

- `login(email, password)`
- `register(email, password)`
- `logout()`
- `user`
- `isAuthenticated`
- `isAdmin`
- `isBootstrapping`

Derived values:

- `isAuthenticated = !!user && !!accessToken`
- `isAdmin = user?.roles.includes("Admin") ?? false`

## Route guard behavior

### RequireAuth

Use for any page that requires a signed-in user.

Behavior:

- if auth bootstrap is still running, show a loading state
- if unauthenticated, redirect to `/login`
- otherwise render the protected route

### RequireAdmin

Use for admin-only pages.

Behavior:

- if auth bootstrap is still running, show a loading state
- if unauthenticated, redirect to `/login`
- if authenticated but not admin, redirect to an access denied page or the main app
- otherwise render the admin route

## Example router shape

```tsx
createBrowserRouter([
  {
    path: '/',
    element: <PublicHomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/app',
    element: <RequireAuth />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  {
    path: '/admin',
    element: <RequireAdmin />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'users', element: <AdminUsersPage /> },
    ],
  },
])
```

## Login page behavior

The login page should:

- collect email and password
- call `POST /auth/login?useCookies=false`
- save the returned tokens
- immediately call `/auth/me`
- store the returned user object
- redirect based on role

Suggested redirect behavior:

- `Admin` -> `/admin`
- otherwise -> `/app`

## Registration page behavior

The registration page should:

- collect email and password
- call `POST /auth/register`
- on success, either:
  - send the user to login, or
  - immediately log them in and bootstrap the session

Recommended first version:

- register
- redirect to login

That keeps the flow simple and predictable.

## Rendering navigation

Use auth state to control which navigation links appear:

- anonymous users see public navigation plus login/register
- authenticated users see app navigation and logout
- admins also see admin navigation

This is a UX feature only. Backend authorization still enforces access.

## Suggested environment variable

Add a frontend API base URL through Vite env:

```env
VITE_API_BASE_URL=https://intex-w2026-group-2-7-h0fwdqczb3hvb2f9.centralus-01.azurewebsites.net
```

Use it in one place, for example in `src/lib/api-client.ts`.

## What not to do

- Do not decode the access token as if it were a JWT.
- Do not store roles by themselves and trust them forever.
- Do not call protected APIs directly from random components without the shared API client.
- Do not make admin decisions from UI state alone.
- Do not implement separate frontend-only role logic that can drift from `/auth/me`.

## Suggested first implementation order

1. Add `react-router-dom`.
2. Add `AuthProvider` and auth state types.
3. Add `auth-api.ts` for login, register, refresh, me, logout.
4. Add `api-client.ts` with auth header injection and refresh-on-401.
5. Add `RequireAuth` and `RequireAdmin`.
6. Replace the Vite starter page with real public, app, and admin route shells.
7. Connect the first protected backend route to a real authenticated page.

## How future MFA and external login fit

The backend is already aligned for future expansion.

### MFA

The current Identity login contract already supports:

- `twoFactorCode`
- `twoFactorRecoveryCode`

When MFA is enabled later, the frontend login flow can become:

1. submit email and password
2. if backend requires MFA, prompt for authenticator code
3. resubmit login with `twoFactorCode`

### External login

When Google or another provider is added later, the frontend will likely gain:

- a "Continue with Google" button
- a redirect/callback route
- a backend endpoint or challenge flow to start external auth

That will be an additive change. It does not require replacing the current auth provider pattern.
