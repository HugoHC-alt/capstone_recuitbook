# Batch 3 — Counselor Connection Foundation

This folder is the frozen PlantUML + object-context packet for the third RecruitBook implementation slice.

**Goal:** allow an authenticated **active student** to request a per-student counselor link by email, view its status, and revoke it; allow a **verified counselor** to see pending requests addressed to their email, accept or decline them, see their linked students, and open a **read-only** view of one linked student's Batch 2 profile aggregate. This is the **first cross-role access to student profile data** in RecruitBook, so diagrams and object context come before any schema or code.

These diagrams and catalog entries are the authoritative design input for Batch 3 implementation (schema, RLS, helpers, server actions, UI in later groups). This group (Group 1) is **diagram/catalog/documentation only — no schema, no migration, no app code exists yet.**

## Diagrams

| File | Purpose |
|---|---|
| `01_counselor_connection_use_case.puml` | Actor boundary: Student (owner) requests/views/revokes links; Verified Counselor sees pending / accepts / declines / views linked students / opens read-only linked profile; Platform Administrator has read-only link visibility. Pending Counselor and Admissions Officer are deliberately not actors. |
| `02_counselor_connection_domain_subset.puml` | The single new object `CounselorStudentLink` (email-addressed, late binding) plus reused Batch 1 `ApplicationUser` and Batch 2 `StudentProfile`, and the helper-based RLS that drives the Group 2 schema. |
| `03_counselor_connection_misuse_case.puml` | The eight Batch 3 threats (unverified access, unlinked-id guessing, wrong-email accept, student self-accept, counselor-existence enumeration, revoked-link access, admissions access, admin confused-deputy) mapped to the security controls that break each path. |
| `04_counselor_connection_activity.puml` | Two flows: student **request** (guard → re-auth → normalize/validate → pending insert → anti-enumeration response) and counselor **accept + read-only view** (guard → re-auth → CAS accept → lookup-key `[id]` → accepted-link RLS → read-only aggregate). |
| `05_counselor_student_link_state_machine.puml` | The `CounselorStudentLink` lifecycle `Requested → Accepted / Declined`, `Requested/Accepted → Revoked`; catalog state model **SM-13**. |

## In scope (frozen)

- New domain object: `CounselorStudentLink` (per-student, student-consented, email-addressed, late binding).
- Student: request a counselor link by email; view link statuses; revoke a link.
- Verified counselor: view pending requests addressed to their email; accept/decline; view linked students; open a **read-only** view of one linked student's Batch 2 profile aggregate.
- `platform_admin`: SELECT-only visibility of link records at the RLS level.
- New RLS: `counselor_student_links` table policies + **counselor SELECT-only** policies on the four Batch 2 profile tables, gated on an accepted link.
- New helpers: `is_verified_counselor()`, `is_linked_counselor_for_profile(profile_id)` (plus reuse of `is_active_student()`, `current_application_user_id()`, `is_platform_admin()`).
- Planned routes: `/student/counselor`, `/counselor/dashboard`, `/counselor/students/[id]`.

## Out of scope (frozen — deferred to later batches)

Counselor review workflow / review states / feedback objects (Batch 4) · stored `profile_status` · student profile submission workflow · **counselor write access to profile data** · `HighSchool` entity / school-match access model · **token invitations** · **email invitations** · **`CounselorInvitation`** (that object is the admin-driven counselor *onboarding* invitation, SM-3 — see the reservation warning below) · admin link-management UI · admissions discovery/search (Batch 5) · profile publishing / visibility settings · AI contextualization / consent / output review · transcripts / file uploads · profile photos · messaging / notifications · counselor rosters / bulk tools · new account statuses · route-policy redesign · Batch 1 auth redesign · **link audit events** · markdown / rich text · `dangerouslySetInnerHTML`.

## Key security decisions

- **First cross-role access — taken in isolation.** Batch 3 adds only links + read-only visibility; the stored review-status workflow is deliberately deferred to Batch 4.
- **Email-addressed late binding.** The student's request stores the counselor's email and forces `status='pending'` with `counselor_application_user_id = NULL`. No counselor lookup happens at insert (no existence oracle). `counselor_application_user_id` stays NULL until a verified counselor addressed by that email **responds** — both accept and decline self-bind it via a `WITH CHECK` compare-and-swap (accept grants SELECT-only visibility; decline is terminal with none, but records who declined).
- **Counselor access is SELECT-only.** There is no counselor INSERT/UPDATE/DELETE policy on any profile table; the *absence* of a write policy is the control.
- **Accepted-link RLS.** `is_linked_counselor_for_profile(profile_id)` requires a verified counselor holding an `Accepted` link; because it tests `status='accepted'` at query time, **revocation is immediate**.
- **Lookup-keys-only.** Form/route IDs (`[id]`, link id) are lookup keys; RLS is the ownership boundary; zero rows → one generic message (no existence oracle) — carried over from Batch 2 doctrine.
- **Deny-by-default cross-role.** Counselor/admissions have no inherited access; admissions officers get zero policies; `platform_admin` is SELECT-only on links with no write path (no confused-deputy write surface).
- **Zero service-role**, RLS as the database backstop, server-side current-user derivation, no trust of client-supplied role/status/application_user_id/auth_user_id — all preserved from Batch 1/2.

## School-match → consent-link refinement

The master catalogs model the counselor–student relationship as **school-mediated**: `CounselorProfile` is bound to a `HighSchool`, and a verified counselor may support students from the *same* high school (`AccessPolicy.requireSameHighSchool(...)`, rules `G-04`/`D-04`). The **implemented prototype has no `HighSchool` entity**, and Batch 2 academic background uses free-text school names. Batch 3 therefore refines the model: for implemented batches, counselor access is mediated by **per-student consent** through an accepted `CounselorStudentLink`, not by school match. This is a **deliberate, recorded decision** (see `docs/project-context/architecture-decisions.md`), not silent drift — and it is arguably *stronger* privacy than school-wide access, because each student authorizes each counselor individually. `HighSchool`, counselor school-binding, and the school-match relationship remain in the catalogs as the unbuilt long-term model for future batches.

## Actor-matrix mapping (Batch 3)

The master `recruitbook_actor_matrix.md` uses school-match counselor columns. For the five new `CounselorStudentLink` methods those columns are re-read as **link state** (the columns are not renamed):

| Master column | Batch 3 meaning |
|---|---|
| `VerifiedCounselorSameSchool` | Verified counselor **addressed by / holding** the link (email = `counselor_email`, or the accepted link binds them) |
| `VerifiedCounselorOtherSchool` | Verified counselor **not addressed / holding no link** |
| `PendingCounselor` | Blocked — verified-counselor gate fails |
| `PlatformAdministrator` | SELECT-only on links; no write |
| `ApprovedAdmissionsOfficer` / `UnverifiedAdmissionsOfficer` | No access (deny-by-default) |

New gate: `AccessPolicy.requireAcceptedLink(counselor, profile)` — the prototype analogue of `requireSameHighSchool(...)`, implemented in RLS as `is_verified_counselor()` + `is_linked_counselor_for_profile(profile_id)`. New denial rules `D-13`–`D-16` cover student-cannot-accept, counselor-cannot-create/act-on-others'-email, pending-counselor-blocked, and admissions-no-access.

## `CounselorInvitation` name-reservation warning

`CounselorStudentLink` is **NOT** `CounselorInvitation`. `CounselorInvitation` (object catalog §5, state model SM-3) is the **admin-driven, school-bound, single-use counselor onboarding invitation** — an unimplemented future flow for how a counselor account is *created and verified*. Batch 3's student→counselor link request is a different concept and must not reuse that name, its token machinery, or its email-delivery flow. Batch 3 has **no tokens and sends no emails**.

## Handoff to Batch 3 Group 2 (Schema & RLS)

Group 2 should build, from `02_..._domain_subset.puml` + `05_..._state_machine.puml` + `03_..._misuse_case.puml`:

- **Table `counselor_student_links`** — columns: `id` uuid PK; `student_application_user_id` uuid NOT NULL → `application_users(id)` (server-derived at insert, never from the form); `counselor_email` text NOT NULL (normalized, length-capped); `counselor_application_user_id` uuid NULL → `application_users(id)` **ON DELETE CASCADE** (NULL until counselor response — bound on **both** accept and decline); `status` (enum `pending`/`accepted`/`declined`/`revoked`); `requested_at` / `responded_at` / `revoked_at` timestamptz; `created_at` / `updated_at` (reuse `set_updated_at()`).
- **Constraints** — a unique **active** (student, `counselor_email`) pair (scope the uniqueness to active statuses so a fresh request after decline/revoke is a NEW row); CHECKs tying status to column presence (e.g. `accepted`/`declined` ⇒ `counselor_application_user_id IS NOT NULL`, since both are counselor responses; `pending` ⇒ `counselor_application_user_id IS NULL`).
- **Helpers** (same hardening as Batch 2: `SECURITY DEFINER`, `SET search_path = public`, `STABLE`, EXECUTE revoked from PUBLIC / granted to `authenticated`): `is_verified_counselor()`; `is_linked_counselor_for_profile(profile_id uuid)`.
- **RLS on `counselor_student_links`** — student SELECT own links (**ownership-only**, no active-student requirement — reading link history is not a write); student INSERT (forced `pending` + NULL counselor id; `student_application_user_id = current_application_user_id()` + `is_active_student()`); student UPDATE own constrained to the revoke transition (requires `is_active_student()`); verified counselor SELECT rows addressed to (or bound to) them + UPDATE a `pending` addressed row to `accepted`/`declined` with self-binding `WITH CHECK`; `platform_admin` SELECT-only; **no** admissions policy; **no DELETE policy for any role** (`declined`/`revoked` rows are immutable history).
- **Column-level UPDATE hardening** — `REVOKE UPDATE ON counselor_student_links FROM authenticated`, then `GRANT UPDATE (status, counselor_application_user_id, responded_at, revoked_at)` only. `student_application_user_id`, `counselor_email`, and `requested_at` are **not** writable through authenticated flows, so a legitimate counselor response cannot be mutated into re-addressing the row to a different (non-consenting) student.
- **RLS on the four profile tables** — add counselor **SELECT-only** policies `USING (is_verified_counselor() AND is_linked_counselor_for_profile(...))`; add **no** counselor write policy (documented deliberate absence, Batch 2 §5.5 pattern); keep Batch 2 owner CRUD and `platform_admin` SELECT untouched.
- **Zero service-role.** Validate locally (`npx supabase db reset` + `db lint`), then apply to hosted dev as a deliberate separate step.

### Group 2 open item (one design decision to finalize)

**Exact email normalization + addressee-matching mechanics.** The plan is trim + lowercase compare. Group 2 must decide *where* normalization is authoritative: a `CHECK`/generated column on `counselor_email` vs. helper-side/action-side normalization, and how the counselor's own address is matched to `counselor_email` (e.g. against `application_users.email`, itself normalized). This mirrors the Batch 2 precedent where Group 1 deliberately left first-save initialization behavior for Group 2 to resolve.

## Mandatory future runtime tests (later Batch 3 groups)

These are **required gates**, not optional (the lesson carried from Batch 2's deferred adversarial tests):

1. **Unlinked-`[id]` denial** — a verified counselor requests `/counselor/students/[id]` for a student they hold no accepted link to → generic not-found, no data, no oracle.
2. **Revoke-then-read** — after a student revokes an accepted link, the counselor's read of that profile returns nothing immediately.
3. **Wrong-email accept** — a verified counselor tries to accept a request addressed to a different email → CAS zero-rows → generic error, no state change.
4. **Student self-accept** — a student attempts to move their own request to accepted → rejected by RLS (INSERT forces pending; no student accept transition).
5. **Counselor-existence enumeration** — requesting a link to a non-counselor email yields the same "pending" state and generic response as requesting a real counselor.
6. **Pending/suspended counselor** — a non-verified counselor cannot see pending requests or read any linked profile.
7. **Admissions officer** — has no access to links or linked profile data.
