# RecruitBook Coding Standards

## Purpose

This document defines the coding standards for RecruitBook.

## General Style

Use:

- TypeScript
- explicit types
- readable file names
- small focused helper functions
- clear server/client boundaries
- comments only where they clarify design decisions

Prefer the smallest coherent change that preserves existing behavior. Reuse an
established helper or component when it already fits the requirement, but do
not introduce an abstraction solely to reduce line count.

Avoid (beyond that rule):

- client-side authorization
- schema redesigns without instruction

## Next.js App Router

Use the Next.js App Router.

Prefer server components for protected pages when possible.

Use client components only when interactive browser behavior is required.

Do not put secrets in client components.

Do not expose Supabase service role keys to the browser.

## Server Actions and useActionState State (convention)

A `'use server'` file may only export async functions. It cannot export a type-as-value, a plain object, or a shared constant.

When a server-action form uses React `useActionState`, put the shared state shape and its initial value in a SEPARATE non-`'use server'` module, imported by both the action file and the presentational client form. Established example: `app/student/profile/action-state.ts` exports `ProfileActionState` + `INITIAL_PROFILE_ACTION_STATE`, consumed by `app/student/profile/actions.ts` (`'use server'`) and the `*-form.tsx` client components.

Client form components stay presentational: `'use client'`, `useActionState`, plain HTML inputs, inline error/success from the action's returned state. They contain NO Supabase import, NO authorization logic, and NO service-role code — every write and every authorization check lives in the server action.

## Supabase Client Rules

Use separate Supabase helpers for browser and server contexts.

Expected files:

- `lib/supabase/client.ts`
- `lib/supabase/server.ts`

Browser client rules:

- may use public anon key
- must never use service role key
- should not be trusted for authorization decisions

Server client rules:

- used for route guards
- used for reading the current session/user
- used for secure protected-page checks

Service role rules:

- never expose service role key to the browser
- use only in trusted server-side code if needed
- required for privileged actions that intentionally bypass RLS

## Auth Type Files

Expected files:

- `lib/auth/types.ts`
- `lib/auth/route-policies.ts`

`types.ts` should define:

- `UserRole`
- `AccountStatus`
- `ApprovalDecisionType`
- `AuditAction`
- `ApplicationUser`
- `ProtectedRoutePolicy`

`route-policies.ts` should define:

- public registration roles
- protected route policy constants
- dashboard routing helpers
- route access helpers

## Naming

Use database-aligned names when representing database fields:

- `auth_user_id`
- `account_status`
- `created_at`
- `updated_at`

Use TypeScript-friendly names for application objects only when the mapping is explicit.

Avoid silently renaming important schema fields.

## Authorization Rules

Never trust role or status values from the browser.

Never authorize based only on the UI.

Protected routes must check the database-backed application user.

A valid Supabase session is required, but it is not sufficient.

A protected route check must verify:

1. User has a Supabase session.
2. User has an `application_users` row.
3. User has the required role.
4. User has the required account status.
5. User is not suspended.

## Redirect Rules

Unauthenticated users should go to:

- `/login`

Suspended or unauthorized users should go to:

- `/unauthorized`

Valid users should be routed according to role/status.

## Public Registration Rules

Public registration can only use these roles:

- `student`
- `counselor`
- `admissions_officer`

Public registration must never allow:

- `platform_admin`

Do not rely only on the frontend dropdown to enforce this.

The server/database must also reject invalid roles.

## Account Status Rules

Do not create or use `unauthorized` as an account status.

Students use:

- `student + active`

Counselors use:

- `counselor + pending_approval`
- `counselor + verified`

Admissions officers use:

- `admissions_officer + pending_approval`
- `admissions_officer + verified`

Platform admins use:

- `platform_admin + active`

Suspended users use:

- `any role + suspended`

## Route Policy Constants

The application should recognize these protected route policies:

| Route | Required Role | Required Status |
|---|---|---|
| `/student/dashboard` | `student` | `active` |
| `/counselor/pending` | `counselor` | `pending_approval` |
| `/counselor/dashboard` | `counselor` | `verified` |
| `/admissions/pending` | `admissions_officer` | `pending_approval` |
| `/admissions/dashboard` | `admissions_officer` | `verified` |
| `/admin/dashboard` | `platform_admin` | `active` |

## Error Handling

Prefer explicit fallback behavior.

Examples:

- no session → `/login`
- missing application user → `/unauthorized` or account recovery/error page
- suspended user → `/unauthorized`
- role/status mismatch → `/unauthorized`

Do not silently allow access when data is missing.

## File Organization

Keep auth-related code under:

- `lib/auth/`
- `lib/supabase/`

Expected Batch 1 files:

- `lib/auth/types.ts`
- `lib/auth/route-policies.ts`
- `lib/auth/get-current-application-user.ts`
- `lib/auth/require-auth.ts`
- `lib/auth/require-route-access.ts`
- `lib/auth/redirect-user-by-role.ts`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`

Do not create unrelated folders or features for Batch 1.

## Comments

Use comments to explain important security decisions.

Good comment examples:

- why `platform_admin` is not allowed in public registration
- why a Supabase session is not enough for dashboard access
- why `unauthorized` is not an account status
- why service role code must not run in the browser

Avoid obvious comments that simply repeat the code.

## Security

Never expose secrets in client-side code.

Never expose the Supabase service role key to the browser.

Never trust client-provided role/status values.

Never allow public registration to create platform admins.

Never let normal users update their own role or account status.

Keep RLS enabled on public tables.

## Out of Scope for Batch 1

Do not generate code for:

- student profiles
- transcript upload
- AI contextualization
- admissions search
- counselor queue
- university discovery
- shortlists
- interest signals
- file storage

Those belong to later batches.

## Batch 1 Maintenance Rules

When working on Batch 1:

- Do not redesign the schema.
- Do not change the route model.
- Do not add new database tables unless explicitly asked.
- Do not expand into Batch 2 features.
- Keep changes small and inspectable.
- Prefer implementation that matches the existing Batch 1 diagrams and Supabase schema.
