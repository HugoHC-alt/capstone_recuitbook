# Batch 4 — Counselor Review Workflow

This folder is the frozen PlantUML + object-context packet for the fourth RecruitBook implementation slice.

**Goal:** allow an authenticated **active student** to submit their profile for review to a counselor they hold an **accepted `CounselorStudentLink`** with, view request status, withdraw a request, and read the counselor's feedback; allow the **addressed verified counselor** to see a review queue of requests from live accepted-linked students, decline a request, or complete it by writing one plain-text feedback note. This is the **first counselor WRITE surface** in RecruitBook — so the write target is NEW dedicated review tables, never the student-owned Batch 2 profile tables.

These diagrams and catalog entries are the authoritative design input for Batch 4 implementation (schema, RLS, helpers, server actions, UI in later groups). This group (Group 1) is **diagram/catalog/documentation only — no schema, no migration, no app code exists yet.**

## Diagrams

| File | Purpose |
|---|---|
| `01_counselor_review_use_case.puml` | Actor boundary: Student (owner) submits/withdraws review requests and reads feedback; Verified Counselor (live accepted link) sees queue, declines, completes with feedback; Platform Administrator has read-only visibility. Pending Counselor and Admissions Officer are deliberately not actors. |
| `02_counselor_review_domain_subset.puml` | The two new objects `CounselorReviewRequest` + `CounselorFeedbackNote`, anchored to the Batch 3 `CounselorStudentLink` (the consent edge) and reused `ApplicationUser`/`StudentProfile`, with the helper-based RLS that drives the Group 2 schema. |
| `03_counselor_review_misuse_case.puml` | The Batch 4 threats (forged feedback, unlinked/revoked counselor access, cross-counselor writes, pending-counselor access, admissions access, stale-request replay, profile mutation via review flow, error/oracle leakage) mapped to the controls that break each path. |
| `04_counselor_review_activity.puml` | Two flows: student **submit** (guard → re-auth → own-accepted-link check → forced `requested` insert) and counselor **complete** (guard → re-auth → live-link RLS → feedback insert → status CAS → student reads feedback). |
| `05_counselor_review_request_state_machine.puml` | The `CounselorReviewRequest` lifecycle `Requested → Completed / Declined / Withdrawn`; catalog state model **SM-14**. |

No sequence diagram: the activity flows plus the RLS policy matrix below cover the helper/RLS interaction without an extra diagram (recorded choice, keeps the packet lean).

## In scope (frozen)

- New domain objects: `CounselorReviewRequest` (student-initiated, link-anchored) and `CounselorFeedbackNote` (counselor-authored, immutable, exactly one per completed request).
- Student: submit a review request to an accepted-linked counselor; view own request statuses; withdraw a `Requested` request; read received feedback (their read survives link revocation).
- Verified counselor: see the review queue (requests from **live** accepted-linked students only); decline; complete by writing one plain-text feedback note.
- `platform_admin`: SELECT-only visibility of both new tables at the RLS level.
- New RLS: policies on the two new tables + two new hardened helpers; **zero change to the Batch 2/3 policies on profile tables or `counselor_student_links`.**
- UI lands on existing routes only: `/student/counselor` (request + status + feedback read), `/counselor/dashboard` (queue), `/counselor/students/[id]` (feedback write form beside the read-only profile). No new route policies.

## Out of scope (frozen — deferred)

Counselor write access to `student_profiles` / `academic_backgrounds` / `profile_activities` / `profile_achievements` (the Batch 3 SELECT-only boundary is untouched) · stored `profile_status` or any state on `student_profiles` · multiple feedback notes per request (1:1 in prototype) · feedback editing/threads/replies · re-review round-trips (a new request is a NEW row) · admissions discovery/search (Batch 5) · AI contextualization · uploads/transcripts · messaging/notifications · markdown/rich text · `dangerouslySetInnerHTML` · token/email invitations · `CounselorInvitation` · `HighSchool`/school-match · admin link- or review-management UI · review audit events (deferred with link audit; future `SECURITY DEFINER` RPC) · rate limiting (recorded Batch 1 deferral) · Batch 1 auth redesign · route-policy changes · new account statuses.

## Key security decisions

- **Counselor writes go to NEW tables only.** The first counselor write surface is `counselor_review_requests` (status response) + `counselor_feedback_notes` (content). The Batch 3 control — *absence* of counselor write policies on profile tables — is preserved verbatim and re-verified as a Batch 4 regression gate.
- **Live-accepted-link gate at query time, for ALL counselor review access.** Queue visibility, request response, feedback insert, and even the counselor re-reading their own authored feedback all require the request's underlying `CounselorStudentLink` row to be `accepted` **at query time** (mirrors `is_linked_counselor_for_profile`). Revocation therefore removes the counselor's entire review surface immediately.
- **Student history survives revocation.** The student always reads their own requests and received feedback (ownership-only SELECT). Feedback written before revocation remains visible to the student; it becomes invisible to the counselor.
- **No late binding needed.** Unlike Batch 3 links, the counselor is known at submit time (the accepted link already binds them). `counselor_review_requests` stores `counselor_student_link_id` + denormalized `student_application_user_id` / `counselor_application_user_id`, all server-derived/RLS-verified against the link row at insert — never client-supplied as authorization.
- **Feedback is immutable and structurally unforgeable.** `counselor_feedback_notes` has NO student INSERT/UPDATE policy, NO UPDATE policy for anyone, NO DELETE for anyone, and table-wide `REVOKE UPDATE`. A student cannot forge, edit, or delete counselor feedback; a counselor cannot rewrite history.
- **Status lives on the review object, never on `student_profiles`.** Batch 2's "no stored profile status" rule stands; `CounselorReviewRequest.status` is the only stored state, on the request row.
- **Lookup-keys-only + no-oracle.** Route/form ids (link id, request id) are lookup keys; RLS CAS makes stale/foreign/wrong-party rows match zero rows → one fixed generic message. The student selects a counselor from their OWN accepted links (no email entry), so Batch 4 adds no enumeration surface. Raw DB errors/constraint names are never surfaced.
- **Zero service-role**, authenticated cookie-aware server client only, server-side current-user derivation, RLS as the authoritative backstop, deny-by-default for admissions (zero policies) — all carried forward.

## Proposed object / state model

**`CounselorReviewRequest`** (SM-14): `Requested` → `Completed` (counselor submits feedback) | `Declined` (counselor) | `Withdrawn` (student). All three end states are terminal; a fresh submission after any terminal state creates a NEW row. At most one active (`requested`) request per link. DB enum `counselor_review_status`: `requested` / `completed` / `declined` / `withdrawn` — note the DB value is `requested`, a deliberate divergence from `counselor_student_links.status='pending'`, to keep the two lifecycles unambiguous in SQL.

**`CounselorFeedbackNote`**: no state machine — a single immutable record (`request_id` unique, plain text, length-capped), created by the addressed counselor as part of `complete(...)`.

**Revoked-link edge case (frozen):** if the link is revoked while a request is `Requested`, the request row stays `Requested` but is dead in practice — the counselor can no longer see or act on it (live-link gate), and the student may withdraw it. A later NEW link does not revive it (the gate joins through the request's own `counselor_student_link_id`).

## Schema / RLS handoff to Group 2

Group 2 implements, after a independent schema and RLS design review:

- **Table `counselor_review_requests`** — `id` uuid PK; `counselor_student_link_id` uuid NOT NULL → `counselor_student_links(id)` ON DELETE CASCADE; `student_application_user_id` uuid NOT NULL → `application_users(id)` ON DELETE CASCADE; `counselor_application_user_id` uuid NOT NULL → `application_users(id)` ON DELETE CASCADE; `student_message` text NULL (≤1000, optional context from the student); `status` `counselor_review_status` NOT NULL DEFAULT `'requested'`; `requested_at` / `responded_at` / `withdrawn_at` timestamptz; `created_at` / `updated_at` (reuse `set_updated_at()`).
- **Constraints** — status↔column CHECKs: `requested` ⇒ `responded_at IS NULL AND withdrawn_at IS NULL`; `completed`/`declined` ⇒ `responded_at IS NOT NULL AND withdrawn_at IS NULL`; `withdrawn` ⇒ `withdrawn_at IS NOT NULL AND responded_at IS NULL` (no branch permits smuggling the other party's column — the Batch 3 R1 lesson). Nullable-safe timestamp-order CHECKs (`responded_at`/`withdrawn_at` ≥ `requested_at`). Partial unique index on `(counselor_student_link_id)` WHERE `status = 'requested'` (one active request per link; new request after terminal = NEW row). `char_length(student_message) <= 1000`.
- **Table `counselor_feedback_notes`** — `id` uuid PK; `counselor_review_request_id` uuid NOT NULL UNIQUE → `counselor_review_requests(id)` ON DELETE CASCADE; `counselor_application_user_id` uuid NOT NULL → `application_users(id)` ON DELETE CASCADE (the author; must equal the request's counselor — enforced in RLS WITH CHECK); `feedback_text` text NOT NULL (`char_length <= 4000`, plain text); `created_at`. No `updated_at` (immutable — no updates ever).
- **New helpers** (standard hardening: `SECURITY DEFINER` + `SET search_path = public` + `STABLE` + revoke EXECUTE from PUBLIC + grant to `authenticated`):
  - `is_student_owner_of_accepted_link(link_id uuid)` — caller is an active student AND owns that link AND `status='accepted'`. Gates request INSERT.
  - `is_counselor_of_live_accepted_link(link_id uuid)` — `is_verified_counselor()` AND that link row is `accepted` AND its `counselor_application_user_id = current_application_user_id()`. Gates every counselor-side read/write; because it tests `accepted` at query time, revocation is immediate.
  - Reuse (never redefine): `is_verified_counselor()`, `current_application_user_id()`, `is_active_student()`, `is_platform_admin()`, `set_updated_at()`.
- **RLS policy matrix:**

| Table | Role | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|---|
| `counselor_review_requests` | Student owner | own rows (`student_application_user_id = current_application_user_id()`; ownership-only, no active-status gate on reads) | own + `is_active_student()` + `is_student_owner_of_accepted_link(counselor_student_link_id)` + forced `status='requested'`, `responded_at`/`withdrawn_at` NULL + `student_application_user_id`/`counselor_application_user_id` match the link row | withdraw only: USING own + `status='requested'`; WITH CHECK own + `status='withdrawn'` + `withdrawn_at IS NOT NULL` | none |
| `counselor_review_requests` | Verified counselor | `is_counselor_of_live_accepted_link(counselor_student_link_id)` | none | respond only: USING live-link + `status='requested'`; WITH CHECK live-link + `status IN ('completed','declined')` + `responded_at IS NOT NULL` + `withdrawn_at IS NULL` | none |
| `counselor_review_requests` | platform_admin | all (SELECT-only) | none | none | none |
| `counselor_review_requests` | admissions_officer | none (zero policies) | none | none | none |
| `counselor_feedback_notes` | Student owner | notes on own requests (EXISTS own request) | none | none | none |
| `counselor_feedback_notes` | Verified counselor | authored notes, gated `is_counselor_of_live_accepted_link(...)` via the request's link (revocation hides them) | addressed counselor only: request `status='requested'`, request's `counselor_application_user_id = current_application_user_id()`, live accepted link, `counselor_application_user_id` self-bound | none | none |
| `counselor_feedback_notes` | platform_admin | all (SELECT-only) | none | none | none |
| `counselor_feedback_notes` | admissions_officer | none (zero policies) | none | none | none |

- **Column-level UPDATE hardening** — `counselor_review_requests`: `REVOKE UPDATE ... FROM authenticated;` then `GRANT UPDATE (status, responded_at, withdrawn_at)` only — `counselor_student_link_id`, both party ids, `student_message`, and `requested_at` are unwritable through authenticated flows. `counselor_feedback_notes`: `REVOKE UPDATE` entirely (no grant — immutable).
- **Write-order + atomicity (recorded acceptance):** `complete(...)` = feedback INSERT first, then request status CAS to `completed` — never the reverse (a `completed` request without feedback would be a worse inconsistency than feedback on a still-`requested` row). A failure between the two steps fails closed and is benign (unique `request_id` blocks duplicates; the helper treats a `23505` on retry as "note exists" and proceeds to the CAS). Future hardening: a `SECURITY DEFINER` RPC making both steps atomic (same family as the deferred admin-approval and audit RPCs).
- **Bare inserts.** Both INSERTs (request, feedback) are bare — no chained `.insert(...).select()` (the Batch 2/3 first-create-under-RLS rule); callers revalidate and re-list.
- **Validation / no-oracle:** `student_message` optional, trimmed, ≤1000; `feedback_text` required, trimmed, ≤4000; both plain text through JSX escaping. All failure modes (foreign/stale/wrong-party ids, CAS zero-rows, CHECK violations) surface as one fixed generic message; raw Supabase/Postgres errors and constraint names never reach the UI.
- **Zero service-role.** Validate locally (`npx supabase db reset` + `db lint`) while UNLINKED; hosted apply is a deliberate separate step after review.

## Mandatory runtime tests (later Batch 4 groups — required gates)

1. **Unlinked counselor** sees no review requests and cannot write feedback (zero rows, generic).
2. **Revoke-then-review** — after link revocation the counselor's queue entry, request response, feedback write, AND read of their own past feedback all disappear immediately.
3. **Cross-counselor write** — a verified counselor cannot decline/complete or attach feedback to a request addressed to a different counselor (CAS zero rows → generic).
4. **Pending/suspended counselor** sees and writes nothing (verified gate fails).
5. **Admissions officer** has zero review access (requests and feedback).
6. **Student forgery blocked** — a student cannot insert/update a `CounselorFeedbackNote` and cannot move their request to `completed`/`declined` (withdraw-only WITH CHECK); a crafted direct-API attempt matches zero rows / fails the policy.
7. **Profile-table regression** — the review flow gives the counselor NO write path to `student_profiles`/`academic_backgrounds`/`profile_activities`/`profile_achievements` (attempt fails; Batch 3 SELECT-only boundary intact).
8. **Stale/foreign review ids** (withdraw, decline, complete, feedback) produce the generic no-op/failure — no existence oracle.
9. **Withdrawn-request block** — feedback insert against a withdrawn (or completed/declined) request fails generically.
10. **Student read survives revocation** — the student still reads previously received feedback after revoking the link.
11. **No raw DB errors/constraint names** appear in any UI or action state.

## Planned implementation groups

1. **Group 1 — diagrams + object context** (this packet + additive master-catalog entries + docs). No schema, no code.
2. **Group 2 — schema + RLS migration** — preceded AND followed by a independent schema and RLS design review (first counselor write surface). Local `db reset` + `db lint`; hosted apply as a deliberate separate step.
3. **Group 3 — TypeScript types + server helpers** (`lib/counselor-review/{types,validation,queries}.ts`), mirroring the Batch 3 Group 3 shape: server-only, authenticated client, RLS backstop, generic results.
4. **Group 4 — student review-request UI/actions** — extend `/student/counselor` (per-accepted-link "Request review", own-request list, withdraw). Reuses `requireRouteAccess('/student/dashboard')`.
5. **Group 5 — counselor review queue + feedback write UI/actions** — queue section on `/counselor/dashboard`; decline control; feedback form on `/counselor/students/[id]` (beside the read-only profile — profile data itself stays read-only). Reuses existing guards.
6. **Group 6 — student feedback read view** — feedback display on `/student/counselor` (plain escaped text). Small by design; kept separate for review cadence.
7. **Group 7 — final batch review + tracker update + Batch 5 handoff.**
