# Authorization Playbook

This document is the team reference for deciding whether a new page or API route should be:

- public
- authenticated
- admin only

The goal is to keep frontend behavior, backend authorization, and product expectations aligned as the app grows.

## Current backend auth model

- Authentication is bearer-first for the SPA.
- The backend uses ASP.NET Core Identity with opaque bearer tokens, not JWTs.
- The backend is the source of truth for authorization.
- The current role model is:
  - `User`
  - `Admin`
- The current policy model is:
  - `AuthenticatedUser`
  - `AdminOnly`
- New registrations are placed into the `User` role by default.

## Core rule

A page must be protected at the level of the most sensitive API call it depends on.

Examples:

- If a page loads only public catalog-style data, the page can be public.
- If a page loads the current user's saved records, the page must require authentication.
- If a page calls an admin-only route even once, the page must be admin only.

Frontend route guards improve UX. They do not replace backend authorization.

## Decision matrix

| Level | When to use it | Examples |
| --- | --- | --- |
| Public | No sign-in required and no sensitive user-specific or privileged data is exposed | landing page, public browse/search pages, informational content |
| Authenticated | The page reads or changes data for the signed-in user, or performs any non-admin write action | dashboard, profile, saved items, user submissions, checkout-like flows |
| Admin only | The page manages users, permissions, system configuration, privileged reports, or high-impact destructive operations | admin dashboard, user management, moderation, seed/config tools, global reporting |

## Page classification rules

### Public pages

Use public pages when all of the following are true:

- The page works for anonymous visitors.
- The page does not expose personal, student, financial, operational, or privileged data.
- The page does not let anonymous users create, edit, or delete operational records.

Good candidates:

- home
- marketing/about/help
- browse-only listing pages
- public detail pages for content intentionally visible to everyone

### Authenticated pages

Use authenticated pages when any of the following are true:

- The page shows data tied to the current user.
- The page lets a signed-in user create or update operational records.
- The page needs `/auth/me` to determine who the user is before rendering the real content.
- The page should exist for normal users and admins, but not anonymous visitors.

Good candidates:

- my dashboard
- my profile
- my records
- create/edit flows for normal users
- pages with personalized recommendations or history

### Admin-only pages

Use admin-only pages when any of the following are true:

- The page manages users, roles, or access.
- The page performs bulk changes across many users or records.
- The page exposes internal reports or sensitive operational data.
- The page can trigger destructive or high-risk operations.
- The page should never be reachable by a standard `User`.

Good candidates:

- admin dashboard
- user or role management
- data import/export
- moderation or approvals
- global settings

## API route rules

### Public API routes

A route can stay public if it:

- serves intentionally public read-only data
- does not depend on the caller's identity
- does not leak internal-only fields

Typical examples:

- `GET /api/public/...`
- `GET /api/catalog/...`

### Authenticated API routes

A route must require `AuthenticatedUser` if it:

- returns current-user data
- creates or updates non-admin records
- depends on `User.Identity` or `/auth/me`
- should only be used by signed-in users

Typical examples:

- `GET /api/me/...`
- `POST /api/...` for normal user actions
- `PUT /api/...` for a user's own data

### Admin-only API routes

A route must require `AdminOnly` if it:

- changes other users' data
- changes access control
- exposes internal reports
- runs batch or destructive operations
- represents operational control over the system

Typical examples:

- `POST /api/admin/...`
- `DELETE /api/admin/...`
- `GET /api/admin/reports/...`

## Backend implementation rules

### Controllers

Use named policies, not inline role strings.

```csharp
[Authorize(Policy = AppPolicies.AuthenticatedUser)]
public class MyController : ControllerBase
{
}
```

```csharp
[Authorize(Policy = AppPolicies.AdminOnly)]
public IActionResult GetAdminReport()
{
    ...
}
```

### Minimal APIs

Prefer grouping protected routes together.

```csharp
var userGroup = app.MapGroup("/api/me")
    .RequireAuthorization(AppPolicies.AuthenticatedUser);

var adminGroup = app.MapGroup("/api/admin")
    .RequireAuthorization(AppPolicies.AdminOnly);
```

### Do not do this

- Do not rely on hidden frontend buttons as security.
- Do not check only `if (user != null)` in handler code without applying authorization.
- Do not hardcode `"Admin"` or `"User"` strings in many files.
- Do not make a route public just because the page hides the link for anonymous users.

## Recommended conventions

### Route naming

- Public routes: `/api/public/...` or feature-specific read endpoints
- Authenticated user routes: `/api/me/...` or feature-specific protected endpoints
- Admin routes: `/api/admin/...`

### UI naming

- Public pages should not imply sign-in is required.
- Authenticated pages should clearly redirect to login when needed.
- Admin pages should sit under an obvious admin section in the UI and router.

## Review checklist for any new feature

When adding a new page or route, answer these in order:

1. Does it expose user-specific data?
2. Does it allow create, update, or delete operations?
3. Does it expose internal-only or privileged information?
4. Could misuse of this route affect many users or the whole system?
5. Is the page using any admin-only endpoint, even indirectly?

Classification:

- If all answers are no, keep it public.
- If 1 or 2 is yes, make it authenticated.
- If 3, 4, or 5 is yes, make it admin only.

## Practical examples for this project

These are examples, not a final product map.

| Feature | Suggested level | Reason |
| --- | --- | --- |
| Landing page | Public | No user context required |
| Browse/search operational content | Public or authenticated, depending on data sensitivity | Public if data is intentionally open |
| User dashboard | Authenticated | Personalized data |
| User profile | Authenticated | Current-user data and edits |
| Submit or edit a normal user record | Authenticated | Write action by a standard user |
| Admin reporting page | Admin only | Internal operational visibility |
| Role assignment page | Admin only | Access control |

## Future changes

This playbook assumes the current simple role model.

If the app later adds:

- moderator roles
- department-specific permissions
- claims-based authorization
- MFA-required admin areas

then this document should be extended, not replaced. The same principle still applies: classify each page by the most sensitive backend action it performs.
