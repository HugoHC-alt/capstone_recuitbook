# Batch 1 — Authentication, Role Identity, and Protected Routing

This folder contains focused PlantUML diagrams for the first RecruitBook implementation slice.

The purpose of this slice is to define how RecruitBook handles authentication, application roles, account approval status, dashboard redirects, and protected route access.

## Scope

This slice includes:

- Public registration
- Login and logout
- Email verification
- Password reset
- Role selection during registration
- Application user profile creation
- Role and account status storage
- Role/status-based redirect after login
- Protected dashboard access
- Counselor account approval
- Admissions officer account approval
- User suspension
- Unauthorized access denial

## Excluded From This Slice

This slice does not include:

- Student profile creation
- Academic record entry
- AI contextualization
- Transcript upload
- Counselor student roster
- Admissions officer search
- Shortlisting
- Interest signaling
- Object storage
- Search indexing
- University discovery

These features belong to later implementation slices.

## Core Authentication Rule

Supabase Auth handles credential authentication, including email/password login, password hashing, token/session issuance, email verification, and password reset flows.

RecruitBook’s own application database stores application-specific identity data, including:

- User role
- Account status
- Approval status
- Suspension status

Authentication proves who the user is.

RecruitBook authorization decides what the user is allowed to access.

## Role Rules

Public users may register as:

- Student
- Counselor
- Admissions Officer

Public users may not register as:

- Platform Administrator

Platform Administrator accounts must be seeded or manually assigned outside public registration.

## Account Status Rules

Students become active after email verification.

Counselor accounts remain restricted until approved by a Platform Administrator.

Admissions Officer accounts remain restricted until approved by a Platform Administrator.

Suspended users must be denied access to protected dashboards.

## Protected Route Rules

All protected dashboards must check:

1. A valid authenticated Supabase session exists.
2. A RecruitBook application user profile exists.
3. The user has the required role.
4. The user has the required account status.
5. The user is not suspended.

UI hiding alone is not sufficient authorization.

Protected access must be enforced server-side, through middleware, layout-level checks, route handlers, or Supabase Row Level Security where applicable.

## Expected Batch 1 Diagrams

This folder should contain:

- `01_auth_use_case.puml`
- `02_auth_misuse_case.puml`
- `03_auth_activity.puml`
- `04_auth_sequence.puml`
- `05_auth_state_machine.puml`
- `06_auth_system_context.puml`
- `07_auth_domain_subset.puml`

## Implementation Boundaries

Batch 1 is limited to authentication and access control.

Student profiles, automated contextualization, transcript upload, admissions search, shortlisting, and university discovery are outside this slice.

The main implementation goal is:

A user can register, verify email, log in, receive the correct application role/status, be redirected to the correct dashboard or pending page, and be blocked from any dashboard they are not authorized to access.

## Authentication Misuse Case Summary

The main Batch 1 security risk is confusing authentication with authorization.

Supabase Auth proves user identity and manages sessions, but RecruitBook must still enforce application-specific authorization using database role and account status.

The most important misuse cases for this slice are:

- Public admin self-registration attempts
- Role escalation during registration
- Client-side role tampering
- Unauthorized protected route access
- Pending or suspended account bypass
- Credential stuffing and session token reuse
- Admin approval abuse or mistake

The most important controls are:

- Public role allowlist
- Block public admin registration
- Supabase Auth credential handling
- Server-side route guard
- Database role/status checks
- Restrict pending and suspended accounts
- Audit sensitive account actions

## Activity Flow Summary

The Batch 1 activity flow is divided into four implementation paths:

1. Registration and email verification
2. Login and role/status-based redirect
3. Protected route access
4. Password reset and logout

The most important implementation rule is that successful authentication is not enough to grant access. After Supabase Auth validates credentials and returns a session, RecruitBook must read the application user profile from the database and check role plus account_status before routing the user.

Routing rules:

| Role | Account status | Destination |
|---|---|---|
| Student | active or verified | `/student/dashboard` |
| Counselor | pending_approval | `/counselor/pending` |
| Counselor | verified | `/counselor/dashboard` |
| Admissions Officer | pending_approval | `/admissions/pending` |
| Admissions Officer | verified | `/admissions/dashboard` |
| Platform Administrator | active or verified | `/admin/dashboard` |
| Any role | suspended | `/unauthorized` |
| Missing app profile | any | account recovery/error |
| No valid session | none | `/login` |

Protected route access must check both the Supabase session and the RecruitBook application profile. UI hiding alone is not enough.

## Sequence Flow Summary

The sequence diagram shows the implementation message flow for Batch 1.

Key implementation rules:

- Registration must validate public role selection before creating accounts.
- Public users may not register as Platform Administrator.
- Supabase Auth creates the auth user and manages verification/reset tokens.
- RecruitBook creates a separate application user profile in its database.
- RecruitBook stores role and account_status separately from Supabase Auth.
- Login success does not automatically grant dashboard access.
- After authentication, RecruitBook must query the application profile and route based on role/account_status.
- Protected route requests must check both Supabase session and database role/account_status.
- Pending counselor and admissions officer accounts go to pending pages, not full dashboards.
- Suspended users are always redirected to `/unauthorized`.
- Password reset changes credentials only, not RecruitBook role or account_status.
- Admin approvals and suspensions should produce audit log entries.

## Account State Machine Summary

The authentication state machine models durable RecruitBook account states, not temporary form steps.

Login, logout, and password reset affect Supabase Auth sessions or credentials, but they do not change the RecruitBook application role or account_status.

The visual states in `05_auth_state_machine.puml` represent role/status combinations. In implementation, these should generally be stored separately:

- `role`
- `account_status`

Recommended role values:

- `student`
- `counselor`
- `admissions_officer`
- `platform_admin`

Recommended account_status values:

- `email_unverified`
- `active`
- `pending_approval`
- `verified`
- `suspended`

Platform Administrator accounts must not be created through public registration. They should be seeded or manually assigned.

`Unauthorized Access Outcome` is a routing result, not a stored account status.

## System Context Summary

The Batch 1 system context diagram shows the external actors, system components, trust boundaries, and high-level data flows involved in RecruitBook authentication and protected routing.

This diagram is not meant to show step-by-step behavior. The detailed process flow is handled by the activity and sequence diagrams. The purpose of the system context diagram is to show where authentication, authorization, database access, email delivery, and protected route enforcement happen.

Core components:

- `User Browser / Client`: Entry point for public registration, login, logout, password reset, and dashboard requests.
- `RecruitBook Next.js App`: Main application boundary that receives requests, coordinates authentication, creates application profiles, reads role/account_status, and routes users.
- `Supabase Auth`: External authentication provider responsible for credential authentication, session creation, email verification tokens, and password reset tokens.
- `RecruitBook Application Database`: Stores application-specific identity data such as role, account_status, approval state, suspension state, and audit logs.
- `Route Guard / Access Policy`: Enforces protected route authorization using Supabase session plus RecruitBook database role/account_status.
- `Email Service`: Sends verification and password reset emails.
- `Protected Dashboard Routes`: Role/status-restricted destinations such as student dashboard, counselor pending page, counselor dashboard, admissions pending page, admissions dashboard, admin dashboard, and unauthorized page.

## Trust Boundaries

| Boundary | Description | Required protection |
|---|---|---|
| TB-1 Browser ↔ RecruitBook App | Public client sends registration, login, logout, password reset, and dashboard requests. | Validate all input server-side; never trust client-provided role/status claims. |
| TB-2 RecruitBook App ↔ Supabase Auth | RecruitBook requests authentication, session validation, email verification, and password reset operations. | Use Supabase Auth as the credential/session authority; do not store passwords in RecruitBook tables. |
| TB-3 RecruitBook App ↔ Application Database | RecruitBook reads and writes role, account_status, approval state, suspension state, and audit records. | Enforce database access rules, server-side authorization, and consistent role/status enums. |
| TB-4 Supabase Auth/App ↔ Email Service | Verification and password reset emails are delivered externally. | Use single-use, expiring verification/reset tokens; do not expose sensitive data in email content. |
| TB-5 RecruitBook App ↔ Protected Routes | Users request dashboards and pending pages. | Require valid Supabase session plus database role/account_status check before rendering. |

## System Context Implementation Rule

The most important rule from this diagram is:

A valid Supabase session is required but not sufficient for protected access.

RecruitBook must also read the application user profile from the database and check role plus account_status before rendering any protected dashboard.

This means:

- Authentication is handled by Supabase Auth.
- Authorization is handled by RecruitBook using database role and account_status.
- Protected routes must be enforced server-side, in middleware, layout checks, route handlers, server actions, or database policies.
- UI hiding alone is not authorization.

## Out of Scope for This System Context Slice

This Batch 1 system context diagram intentionally excludes:

- Student profile creation
- Academic records
- AI contextualization
- Transcript upload
- Object storage
- Admissions officer search
- Shortlisting
- Interest signaling
- Search indexing
- University discovery

## Domain Subset Summary

The Batch 1 domain subset defines the minimum data model needed for authentication, role identity, protected routing, approval, suspension, and auditing.

The core implementation distinction is:

- Supabase Auth owns credential identity and sessions.
- RecruitBook owns application authorization through `ApplicationUser.role` and `ApplicationUser.account_status`.

`AuthUserRef` is a conceptual reference to Supabase `auth.users`. It should not become a RecruitBook password or session table.

`ApplicationUser` is the RecruitBook-owned identity profile. It stores the user’s role, account_status, approval/suspension state, and application-facing identity fields.

Recommended persisted enums:

`UserRole`:
- `student`
- `counselor`
- `admissions_officer`
- `platform_admin`

`AccountStatus`:
- `email_unverified`
- `active`
- `pending_approval`
- `verified`
- `suspended`

`unauthorized` must not be stored as an account_status. Unauthorized is a routing/access outcome.

Protected route access should be determined by combining:

- valid Supabase session
- `ApplicationUser.role`
- `ApplicationUser.account_status`
- route policy requirements

Sensitive account actions should create audit log entries, especially approvals, suspensions, failed privileged access, and unauthorized access denial.
