# Batch 2 — Student Profile Foundation

This folder contains the focused PlantUML diagram packet for the second RecruitBook implementation slice.

**Goal:** allow an authenticated, active student to create, edit, and view their own RecruitBook profile foundation — and nothing more. Every profile row is student-owned; authorization is derived server-side and enforced by Row Level Security.

These diagrams are the frozen design input for Batch 2 implementation. Treat them as authoritative for the schema, RLS, server actions, and UI built in later Batch 2 groups.

## Diagrams

| File | Purpose |
|---|---|
| `01_student_profile_use_case.puml` | The actor boundary: Student (owner) creates/edits/views their profile; Platform Administrator has read-only moderation access; Counselor and Admissions Officer are explicitly not actors in Batch 2. |
| `02_student_profile_domain_subset.puml` | The student-owned data model that drives the Batch 2 schema and RLS: `StudentProfile` (1:1 with a student `ApplicationUser`) plus `AcademicBackground`, `ProfileActivity`, and `ProfileAchievement`, with helper-based ownership. |
| `03_student_profile_misuse_case.puml` | The main Batch 2 threats (forged IDs, cross-student access, early counselor/admissions access, oversized/XSS narrative input, service-role bypass) mapped to the security controls that break each attack path. |
| `04_student_profile_activity.puml` | The core edit flow: route guard → server-action re-authorization → input validation → server-side ownership → authenticated-client write → owner-only RLS → revalidate → derived completion. |

## In Scope

Batch 2 includes only:

- Student profile overview
- Basic profile information
- Academic background
- Activities
- Achievements
- Fixed student-authored narrative fields
- Derived completion indicator
- Owner-only RLS on all profile data
- `platform_admin` read-only visibility at the RLS level

## Out of Scope

Batch 2 does **not** include (these belong to later batches):

- Stored profile status
- Submission workflow
- Counselor review
- Counselor–student linking / invitations
- Admissions discovery / search
- University-facing profile views
- Profile publishing / sharing
- AI contextualization
- Transcript / file uploads
- Profile photos
- Messaging / notifications
- Markdown / rich-text rendering
- Counselor access to profile data
- Admissions officer access to profile data

## Key Security Decisions

- **Completion is derived, not stored** — computed from field presence at read time.
- **No `profile_status` in Batch 2** — no draft / submitted / reviewed / published state exists.
- **No service-role usage in Batch 2** — every operation runs under the student's authenticated session.
- **Student-owned writes require both** server-action re-authorization **and** RLS enforcement; the page route guard alone is never sufficient.
- **IDs from forms are lookup keys only** — never trusted as proof of ownership.
- **Authorization is derived server-side and enforced by RLS** — client-supplied role/status is never trusted.
- **`platform_admin` is read-only** for profile data (SELECT only; no admin write path to profile content).
- **Counselor and admissions officer have no SELECT policy** in Batch 2 — deny-by-default is the control.
- **Narrative fields are plain text only** — server-side length caps, rendered through JSX escaping.
- **No `dangerouslySetInnerHTML`** and no markdown / rich-text rendering anywhere in Batch 2.

## Handoff to Batch 2 Group 2 (Schema & RLS)

Group 2 should use `02_student_profile_domain_subset.puml` and `03_student_profile_misuse_case.puml` as the authoritative design input to build:

- The student profile tables — `student_profiles` (1:1 with a student `application_users` row, unique FK) plus `academic_backgrounds`, `profile_activities`, and `profile_achievements` child tables. Fixed narrative fields are plain-text columns on `student_profiles`.
- An **ownership helper**, preferably `is_profile_owner(profile_id)` — a `SECURITY DEFINER` function resolving `auth.uid()` → `application_users` → `student_profiles`. Child tables resolve ownership *through* `student_profile_id`; do **not** denormalize `auth_user_id` onto every child table.
- **Owner-only CRUD policies** — the student owner may SELECT/INSERT/UPDATE/DELETE their own profile and child rows, with the insert path also requiring `application_users.role = 'student'`.
- **`platform_admin` SELECT-only policies** via the existing `is_platform_admin()` — read-only moderation/support, no write path.
- **Deny-by-default for counselor / admissions** — define no SELECT policy for those roles; any future access (Batch 3 / Batch 4) must be added deliberately, never inherited by omission.
- **Zero service-role implementation** — the Batch 2 flow needs no `SUPABASE_SERVICE_ROLE_KEY`; every write satisfies RLS under the owner's session.

One open item for Group 2 to resolve: the **missing-profile-row behavior on first save** (safe auto-initialize vs. safe error). The activity diagram deliberately abstracts this as "load or initialize owner profile safely" — pick the concrete behavior during schema design, ensuring it fails closed and stays owner-scoped either way.
