# RecruitBook Architecture Decisions

## Purpose

This document records important architecture decisions for RecruitBook.

These decisions should be treated as authoritative unless explicitly changed.

Use this document when evaluating implementation changes.

## Project Architecture

RecruitBook is a web-based prototype built with:

- Next.js App Router
- React
- TypeScript
- Supabase Auth
- Supabase PostgreSQL
- Supabase Row Level Security
- Vercel

Next.js is used for both the user interface and server-side application logic.

Supabase is used for:

- authentication
- PostgreSQL database
- Row Level Security
- future storage needs

## Current Implementation Phase

Batch 1 — Authentication, Role Identity, and Protected Routing — is **complete, committed, and frozen.** Its diagrams, schema, and implementation notes are the source of truth for authentication and must not be redesigned.

**Batch 2 — Student Profile Foundation** is functionally complete and review-approved (one deferred runtime-verification item is recorded in `progress-tracker.md` before formal closure). **Batch 3 — Counselor Connection Foundation** is complete and CLOSED (Group 7 final review passed, 2026-07-08; approved for prototype use). **Batch 4 — Counselor Review Workflow** is complete and CLOSED (Group 7 final batch review passed, 2026-07-09; approved for prototype use; the Group 2 migration is applied to hosted dev Supabase). **Batch 5 — Admissions Discovery is COMPLETE and CLOSED** (Group 7 final batch review passed, independent review, 2026-07-12, no blocking findings; approved for prototype use). All seven groups: Group 1 diagrams + object context; Group 2 schema + RLS migration, applied to hosted dev Supabase after passing both independent pre- and post-migration reviews; Group 3 TypeScript types + server helpers, `lib/admissions-discovery/{types,validation,queries}.ts`; Group 4 student visibility-controls UI/actions on `/student/profile`, `app/student/profile/visibility-settings-form.tsx` + `saveVisibilitySettingsAction`; Group 5 admissions discovery dashboard UI on `/admissions/dashboard`, `app/admissions/dashboard/page.tsx` wrapping `listAdmissionsVisibleStudents()`; Group 6 admissions read-only student profile view at `/admissions/students/[id]`, `app/admissions/students/[id]/page.tsx` wrapping `getAdmissionsVisibleStudentProfileReadOnly()`, plus a dashboard link (Groups 3–6 each passed independent security and architecture review); and Group 7 the batch-wide final review — see the durable Batch 5 decisions below and the completion/closure records in `progress-tracker.md` §§ "Batch 5 Group 1" through "Batch 5 Group 7". An admissions officer can list and open visible student profiles read-only. **All 11 mandatory Batch 5 runtime gates remain deferred, not executed** (gate 11 N/A — no filters shipped); run at minimum the hosted publish→discover→open→withdraw flow plus the pending/suspended admissions-officer boundary check before Batch 6 Group 2 or any later feature implementation. **Batch 6 — Admissions Shortlists: implementation COMPLETE (Groups 1–5), hosted migration applied, and all 11 mandatory runtime gates confirmed on hosted development** — the first admissions-officer WRITE surface in RecruitBook. See the durable Batch 6 decisions below for the full record, including the post-Group-2 DELETE→RPC design amendment. Batch 7 direction is not yet selected; only a bounded handoff and the carried-forward deferred risks are recorded. Batch 2's authoritative design inputs are: the `docs/project-context/current-project-state.md` "Batch 2" sections (scope, hard constraints, planned groups), the `recruitbook-diagrams/diagrams/slices/batch-2-student-profile-foundation/` diagram packet, and the per-group notes in `docs/project-context/progress-tracker.md`. Key Batch 2 decisions recorded there: student-owned data with owner-only RLS via a helper-based ownership function (`is_profile_owner(profile_id)`, chosen over denormalizing `auth_user_id`); completion is derived in TypeScript, never stored (no `profile_status`); zero service-role usage in Batch 2 (writes run under the owner's authenticated session with RLS as the backstop); `platform_admin` is read-only at the RLS level.

Batch 2 routing convention (new this session): the student profile edit page (`/student/profile`) is intentionally NOT added to `PROTECTED_ROUTE_POLICIES`. Because `canAccessRoute` is deny-by-default, an unregistered route would redirect everyone to `/unauthorized`. Instead, a page that needs the "active student" gate reuses `requireRouteAccess('/student/dashboard')` (which verifies exactly `student + active`) rather than registering a new policy row. This keeps `lib/auth/route-policies.ts` (a frozen Batch 1 artifact) untouched. Every server action still re-checks the active student independently — the page guard is never the sole authorization boundary.

Batch 2 RLS write-path convention (durable, from the Group 5 first-save fix): for a Postgres INSERT that must satisfy RLS and where the caller also needs the created row back, do NOT chain `.insert({...}).select('*').single()`. That chained form re-reads the just-inserted row via PostgREST's `return=representation` under the table's SELECT RLS policy, in the same request, and `.single()` errors if that internal re-read does not yield exactly one row — this can fail even when the INSERT policy itself is correctly satisfied. Instead, perform a bare `insert({...})` (governed solely by the INSERT policy), then issue a SEPARATE, explicitly owner-scoped `select` (governed by the SELECT policy) to load the created row. See `lib/student-profile/queries.ts` (`getOrCreateCurrentStudentProfile`) for the reference implementation and commit `5178c988` ("Fix student profile first-save initialization") for the root-cause writeup. Apply this pattern to any future first-write-then-read flow under RLS.

## Batch 3 — Counselor Connection Foundation (COMPLETE and CLOSED; decisions below remain durable)

Batch 3 introduced the **first cross-role access to student profile data**: student-consented counselor–student linking plus counselor **read-only** visibility of a linked student's Batch 2 profile aggregate. **Status: implemented across Groups 1–6 and CLOSED by the Group 7 final batch review (2026-07-08) with no required fixes.** The decisions below were recorded at Group 1 planning time, governed Groups 2–6, and remain the durable record; no NEW durable decision emerged in Groups 5–7 (the counselor UI groups were straight applications of these conventions):

1. **Per-student consent-link refinement (decided, not drift).** The implemented prototype has no `HighSchool` entity and Batch 2 uses free-text school names, so counselor access is mediated by an accepted `CounselorStudentLink` (per-student consent), **not** the catalogs' `HighSchool` school-match model. Per-student consent is stronger privacy than school-wide access. The `HighSchool`/school-match model is retained in the catalogs as the unbuilt long-term direction; the relevant catalog rows are annotated with this refinement.

2. **Email-addressed late binding (no tokens, no lookup at insert).** A student's request stores `counselor_email` and forces `status='pending'` with `counselor_application_user_id = NULL`; no counselor lookup happens at insert (no existence oracle). `counselor_application_user_id` stays NULL until a verified counselor addressed by that email **responds** — both accept and decline **self-bind** it via a `WITH CHECK` compare-and-swap (accept grants SELECT-only visibility; decline is terminal and grants none, but records who declined for moderation). Batch 3 sends no email and uses no tokens; it is distinct from `CounselorInvitation` (admin onboarding, SM-3).

3. **Counselor access is SELECT-only in Batch 3.** Counselor visibility is added via SELECT-only RLS policies on the four profile tables, gated on `is_verified_counselor()` + `is_linked_counselor_for_profile()`; the **absence** of any counselor write policy is the control. Review/feedback write flows are deferred to Batch 4.

4. **Route-guard reuse (no route-policy changes).** `/counselor/dashboard` is already registered (`counselor + verified`) in the Batch 1 policies. `/student/counselor` reuses `requireRouteAccess('/student/dashboard')` and `/counselor/students/[id]` reuses `requireRouteAccess('/counselor/dashboard')`, because `canAccessRoute` is exact-match and dynamic routes are never registered. `lib/auth/route-policies.ts` stays untouched. Every server action re-checks the acting role independently.

5. **Link audit events deferred (accepted risk).** Batch 3 records no `CounselorStudentLink` audit events, consistent with Batch 2's "no profile-edit audit events" prototype acceptance; the future fix is a `SECURITY DEFINER` audit RPC.

6. **Group 2 schema/RLS hardening (accepted from the Group 2 design review).** The `counselor_student_links` migration will: (a) **revoke broad UPDATE** from `authenticated` and **grant UPDATE only on the mutable transition columns** — `status`, `counselor_application_user_id`, `responded_at`, `revoked_at` — so `student_application_user_id`, `counselor_email`, and `requested_at` cannot be rewritten through normal authenticated flows (prevents cross-party column mutation, e.g. re-addressing a consented row to a different student); (b) keep student SELECT of own links **ownership-only** — reading one's own link history is not a write, so `is_active_student()` gates only the request/revoke **write** paths, not reads; (c) use `ON DELETE CASCADE` on `counselor_application_user_id` (a bound link dies with the counselor account, avoiding orphaned rows); (d) bind `counselor_application_user_id` on **both** accept and decline (a verified counselor response), while only Accepted grants SELECT-only visibility. There is no DELETE policy for any role — `declined`/`revoked` rows are immutable history.

New state model **SM-13** (`CounselorStudentLink`: Requested/Accepted/Declined/Revoked) and the `AccessPolicy.requireAcceptedLink(...)` gate are recorded in the master catalogs. Planned Batch 3 group sequence: **G1 diagrams/context (this group)** → G2 schema+RLS → G3 helpers → G4 student link UI → G5 counselor requests/roster → G6 read-only linked profile view → G7 final review.

## Batch 4 — Counselor Review Workflow (COMPLETE and CLOSED; decisions below remain durable)

Batch 4 introduces the **first counselor WRITE surface**: a student submits their profile for review to an accepted-linked counselor; the addressed verified counselor declines or completes the request with one plain-text feedback note; the student reads the feedback. As of **Group 6**, the diagram packet (`recruitbook-diagrams/diagrams/slices/batch-4-counselor-review-workflow/`), the additive master-catalog entries, the schema + RLS migration (`supabase/migrations/20260709_000001_batch4_counselor_review_schema.sql`, committed `2c1d949c`), the TypeScript types + server helper layer (`lib/counselor-review/{types,validation,queries}.ts`, committed `e9c36eec`), the student review-request extension of `/student/counselor` (committed `e922a9de`), the counselor-side review queue + feedback-write extension of `/counselor/dashboard` + `/counselor/students/[id]` (committed `aaefcb9d`), and the student feedback-read view all exist. The migration passed both the pre-coding design review and the post-coding migration review with no required fixes and **has been applied to hosted dev Supabase**. Groups 3, 4, and 5 all passed security and architecture review with no required fixes — each is a straight application of an already-established pattern (Group 3 mirrors the Batch 3 Group 3 helper layer; Group 4 mirrors `/student/counselor` + `useActionState`; Group 5 mirrors the counselor-dashboard request/roster pattern from Batch 3), so no NEW durable decision emerged from any of them. Group 5's one architecture-review recommendation — gating the feedback form on both `requestId` and `studentProfileId`, not `requestId` alone — was applied as a local one-line hardening before commit, not a new durable pattern. **Group 6 required no new implementation commit**: the student feedback-read surface it targeted already shipped in Group 4, and both its security and architecture reviews were confirmatory passes on that existing code (zero diff), PASSED with no new findings — reinforcing, not adding to, the durable record. **The Group 7 final batch review (independent review, 2026-07-09) closed the batch with no blockers**; the 11 mandatory runtime gates remain deferred items recorded in `progress-tracker.md` § "Batch 4 Group 7", alongside the Batch 5 handoff. Durable decisions recorded at Group 1 planning, implemented as designed in Group 2, and remaining the durable record for any future change to this surface:

1. **Counselor writes go to NEW dedicated tables only (decided).** The write surface is `counselor_review_requests` + `counselor_feedback_notes`. NO counselor INSERT/UPDATE/DELETE policy is added to `student_profiles`, `academic_backgrounds`, `profile_activities`, or `profile_achievements` — the Batch 3 SELECT-only boundary is preserved verbatim, and every Batch 4 review re-verifies it as a regression gate. Student profile data remains student-owned.

2. **Live-accepted-link gate at query time for ALL counselor review access.** Queue visibility, decline/complete, feedback INSERT, and the counselor's SELECT of their own past notes all require the request's anchoring `CounselorStudentLink` row to be `accepted` AT QUERY TIME (helper `is_counselor_of_live_accepted_link(link_id)`, the review analogue of `is_linked_counselor_for_profile`). Revocation therefore removes the counselor's entire review surface immediately. **Deliberate asymmetry:** the student's SELECT of own requests and received feedback is ownership-only and SURVIVES revocation — feedback received is the student's history.

3. **No late binding in Batch 4.** Unlike the Batch 3 link, the counselor is known at submit time (the accepted link already binds them). `counselor_review_requests` stores `counselor_student_link_id` plus denormalized party ids, all verified against the link row by RLS WITH CHECK at insert — never trusted from the client.

4. **Feedback is immutable and structurally unforgeable.** `counselor_feedback_notes` is 1:1 per completed request (`request_id` UNIQUE), ≤4000 plain text, with NO UPDATE/DELETE policy for any role, a table-wide UPDATE privilege revoke, and no student INSERT policy. Multi-party state stays on the request row only, with column-level UPDATE hardening (`GRANT UPDATE (status, responded_at, withdrawn_at)` only) and status↔column CHECKs whose branches cannot smuggle the other party's columns (the Batch 3 R1 lesson).

5. **Stored state lives on the review object, never on `student_profiles`.** `CounselorReviewRequest.status` (SM-14: `Requested → Completed / Declined / Withdrawn`, all end states terminal, fresh submission = NEW row, one active request per link) is the only stored state Batch 4 adds. The DB enum value is `requested` — deliberately NOT `pending` — so it can never be confused with `counselor_student_links.status` in SQL or policies. Batch 2's derived-completion / no-stored-profile-status rule stands.

6. **`complete(...)` is feedback-first and non-atomic (accepted risk).** Step 1: bare INSERT of the feedback note; step 2: status CAS `requested → completed`. Never the reverse (a `completed` request without feedback would be worse than feedback on a still-`requested` row). A failure between steps fails closed and is benign; a `23505` on retry means the note exists → proceed to the CAS. Future hardening: an atomic `SECURITY DEFINER` RPC (same family as the deferred admin-approval and audit RPCs). Both Batch 4 INSERTs are bare — the first-create-under-RLS rule (no chained `.insert().select()`) applies.

7. **UI lands on existing routes only; review audit deferred.** `/student/counselor` (request + status + feedback read), `/counselor/dashboard` (queue), `/counselor/students/[id]` (feedback form beside the still-read-only profile view). No route-policy changes; existing guards are reused. Review audit events are deferred together with the Batch 3 link-audit deferral.

New state model **SM-14** (`CounselorReviewRequest`) and the `AccessPolicy.requireLiveAcceptedLinkForReview(...)` gate are recorded in the master catalogs (object catalog §6, relationships §7a, state catalog §24, method catalog §6a, actor matrix §7a + `D-17`–`D-20`). Planned Batch 4 group sequence: **G1 diagrams/context (this group)** → G2 schema+RLS (independent review design review BEFORE and AFTER coding) → G3 types/helpers → G4 student request UI → G5 counselor queue + feedback write UI → G6 student feedback read view → G7 final review.

## Batch 5 — Admissions Discovery (COMPLETE and CLOSED; decisions below remain durable)

Batch 5 introduced the **first admissions-officer access of any kind** — through Batch 4, `admissions_officer` had zero policies on every table. **Status: implemented across Groups 1–6 and CLOSED by the Group 7 final batch review (independent review, 2026-07-12) with no blocking findings.** Group 1 (diagrams + object context) is complete and committed (`22eb7d21`, preceded by `81ca69d2`). **Group 2 (schema + RLS migration) is complete and committed** (`4451e416`, `supabase/migrations/20260711_000001_batch5_admissions_discovery_schema.sql`), passed both the pre-migration and independent post-migration reviews with no required fixes, is locally validated, and **is applied to the hosted development Supabase project**. Groups 3–6 (TypeScript helpers, student visibility-toggle UI, admissions discovery list, admissions read-only detail view) are also complete and committed — admissions officers can list and open visible profiles read-only. **All 11 mandatory Batch 5 runtime gates remain deferred, not executed** (gate 11 N/A — no filters shipped); see `progress-tracker.md` § "Batch 5 Group 7" for the full list. **Update: the specific hosted headline flow (publish → discover → open detail → withdraw, plus the pending/suspended admissions-officer boundary check) required before Batch 6 Group 2 has since been run and confirmed on hosted development** — see `progress-tracker.md` § "Batch 6 Group 2 Prerequisite" for the exact results. This satisfies the Batch 6 Group 2 runtime prerequisite specifically; the remaining broader Batch 5 gates above are unaffected and stay deferred. The frozen design inputs are the slice packet at `recruitbook-diagrams/diagrams/slices/batch-5-admissions-discovery/` (README + use-case, domain-subset, misuse-case, activity, and visibility-decision diagrams — preserved as historical Group 1 artifacts, not edited after the fact) and the additive master-catalog refinements (object catalog §8; misuse catalog MC-6 Batch 5 note; actor matrix denial rules `D-21`–`D-23` + §9a; method catalog §8a; state catalog SM-6 Batch 5 note). Durable decisions frozen at Group 1, **implemented in Group 2 exactly as designed**, and confirmed unchanged at Group 7 closure, governing every future change to this surface:

1. **One new object/table, `profile_visibility_settings` (decided).** A single table is the entire Batch 5 write surface. The catalogs' separate `ConsentSettings` object is NOT built as a second table for the prototype — collapsed into `profile_visibility_settings`, the same kind of deliberate prototype refinement as Batch 3's `HighSchool` collapse into `CounselorStudentLink`.

2. **One-to-one with `student_profiles` (decided).** `profile_visibility_settings.student_profile_id` is a NOT NULL UNIQUE foreign key to `student_profiles(id)`. A student profile has at most one visibility-settings row; a missing row is a valid, meaningful state (see decision 4).

3. **Exactly two independent booleans, `is_published` and `admissions_consent`, both default `false` (decided, implemented).** No other stored visibility/consent columns exist (no publish timestamp, no consent timestamp, no history) — confirmed as built in the Group 2 migration and its post-migration review.

4. **Effective visibility is the strict AND, evaluated at query time (decided).** Admissions visibility is `is_published AND admissions_consent` — never one flag alone, and never a stored or derived/cached field. A missing settings row is NOT implicitly visible. The planned helper `is_admissions_visible_profile(profile_id)` evaluates this fresh on every call, so withdrawing either flag removes both discovery-list and direct-view access immediately (the same live-gate-at-query-time rule as Batch 3's `is_linked_counselor_for_profile` and Batch 4's `is_counselor_of_live_accepted_link`).

5. **Admissions access is verified-officer, SELECT-only, RLS-backed (decided).** Gated on both `is_verified_admissions_officer()` (role=`admissions_officer` AND status=`verified`; pending/suspended/unverified denied) and effective visibility. No admissions write path exists anywhere in Batch 5 — not to the settings table, not to any Batch 2 profile table.

6. **Counselor/link/review/feedback tables remain inaccessible to admissions (decided).** `counselor_student_links`, `counselor_review_requests`, and `counselor_feedback_notes` get ZERO new policies of any kind for `admissions_officer`. This deny-by-default absence is the control, verified as a regression gate the same way the Batch 3 SELECT-only boundary was re-verified at Batch 4 closure.

7. **No route-policy redesign, search index, shortlist, AI, uploads, or stored trust labels (decided).** `/admissions/dashboard` is already registered (`admissions_officer + verified`) since Batch 1; `lib/auth/route-policies.ts` is not touched. Discovery is a plain list/filter over already-RLS-visible rows, not a search index (no `SearchIndex`, no ranking). `Shortlist`/`ShortlistEntry`, AI contextualization, uploads/transcripts, and stored `VerificationTier`/`SelfReportedLabel` are all out of scope for Batch 5.

8. **Group 2 requires a independent schema and RLS design review both before and after implementation (decided, satisfied).** The same before-and-after sequence used for Batch 3 Group 2 and Batch 4 Group 2, because this is the first admissions-officer-facing RLS surface in the system. Both reviews are complete: the pre-migration review returned CONDITIONAL GO with three ratified conditions — **R1** (visibility additionally requires the profile owner to be an active student, so suspension hides the profile immediately without affecting Batch 3 counselor access), **R2** (the settings INSERT does not force either flag, so a direct one-step `(true, true)` publish is legitimate), and **R3** (column-level UPDATE hardening limiting authenticated writes to `is_published`/`admissions_consent`) — all three implemented in the migration exactly as specified; the post-migration review returned GO with no required fixes.

The richer long-term catalog models — the full `SM-6` profile-publication state machine, the full `SM-12` admissions-discovery state machine (`StudentDiscoverySearch` as a search/ranking workflow, `AdmissionsProfileView`, `Shortlist`/`ShortlistEntry`, verification-tier-aware safe views), and the separate `ConsentSettings` object — remain in the master catalogs as the **unbuilt long-term direction**, not built by Batch 5. New denial rules `D-21`–`D-23` and the `AccessPolicy.requireVerifiedAdmissionsOfficer(...)` / `AccessPolicy.requireAdmissionsVisibleProfile(...)` gates are recorded in the master catalogs. Batch 5 group sequence, all COMPLETE: **G1 diagrams/context** (committed `22eb7d21`, preceded by `81ca69d2`) → **G2 schema+RLS** (migration `supabase/migrations/20260711_000001_batch5_admissions_discovery_schema.sql`, committed `4451e416`, applied to hosted dev) → **G3 types/helpers** (`lib/admissions-discovery/{types,validation,queries}.ts`, committed `8dd17b15`, both reviews passed) → **G4 student visibility-controls UI** (`app/student/profile/visibility-settings-form.tsx` + `saveVisibilitySettingsAction`, committed `6f6ec133`, both reviews passed) → **G5 admissions discovery dashboard UI** (`app/admissions/dashboard/page.tsx`, committed `8ef970a5`, both reviews passed) → **G6 admissions read-only profile view** (new route `/admissions/students/[id]` at `app/admissions/students/[id]/page.tsx` wrapping `getAdmissionsVisibleStudentProfileReadOnly()`, plus a dashboard link, committed `5bd32959`, independent security and architecture re-reviews both passed with no required fixes) → **G7 final batch review + closure** (independent review, 2026-07-12, no blocking findings — Batch 5 CLOSED, approved for prototype use).

## Batch 6 — Admissions Shortlists (COMPLETE — Groups 1–5 implemented, committed, hosted-applied, and confirmed on all 11 mandatory runtime gates; decisions below remain durable)

**Admissions Shortlists** (`Shortlist`/`ShortlistEntry`) was the SELECTED Batch 6 direction — the natural continuation of the discovery surface and the master catalogs' next unbuilt admissions concept, and the **first admissions-officer WRITE surface** in RecruitBook. All five implementation groups are complete:

- **Group 1 — diagrams + object context: COMPLETE, COMMITTED.** Charter (`0d12f936`) + five diagrams (1b `f8d8a1a3`, 1c `3cfbaa6a`, 1d `34f3aa6d`, 1e `70756ce0`, 1f `e17b6552`), each independently reviewed, plus matching additive catalog entries. A final independent packet review returned GO.
- **Group 2 — schema + RLS migration: COMPLETE, COMMITTED (`dcd5bbaf`).** `supabase/migrations/20260717_000001_batch6_admissions_shortlists_schema.sql` — one additive table `admissions_shortlist_entries`, exactly three RLS policies (visibility-gated owner SELECT, unconditional admin SELECT, visibility-gated owner INSERT), a table-wide UPDATE revoke, and (see decision 5 below) a table-wide DELETE revoke plus the hardened `SECURITY DEFINER` removal RPC `remove_own_admissions_shortlist_entry(uuid)`. Passed the pre-migration design review, a focused independent design-amendment review (the DELETE→RPC fix), local `db reset`/`db lint`, a 62-case adversarial RLS test suite (`supabase/tests/20260717_batch6_admissions_shortlists_rls.sql`, 62/62 passing), an independent security review (APPROVE), an independent architecture review (APPROVE), and the mandatory post-migration review (GO). **Applied to the hosted development Supabase project** (confirmed).
- **Group 3 — TypeScript types + server helpers: COMPLETE, COMMITTED (`c05a33aa`).** `lib/admissions-shortlist/{types,validation,queries}.ts` — `saveAdmissionsShortlistEntry`, `listMyAdmissionsShortlist`, `removeAdmissionsShortlistEntry`. Passed independent security and architecture review, both APPROVE.
- **Group 4 — save action + "Save to shortlist" control: COMPLETE, COMMITTED (`649d58ab`).** Extends `/admissions/students/[id]` only. Passed independent security and architecture review, both APPROVE.
- **Group 5 — dashboard "Saved students" section + remove control: COMPLETE, COMMITTED (`97320cc1`).** Extends `/admissions/dashboard` only. Passed independent security and architecture review, both APPROVE.

**the independent final readiness review returned GO FOR HOSTED APPLY + RUNTIME VERIFICATION, no required corrections.** Hosted migration apply has since been performed, and **all 11 mandatory Batch 6 runtime gates from the slice README have been confirmed on hosted development** (save → appears in saved list; duplicate save is silently idempotent; immediate disappearance on withdrawal; republish resurfaces the retained entry; remove works with uniform no-oracle behavior for stale/foreign/nonexistent ids; cross-officer protection; pending/suspended-officer denial; zero student-visible trace; no raw Supabase/Postgres errors; HTML-like content stays escaped; and the Batch 3/4/5 closure regression gates). Full gate-by-gate record: `progress-tracker.md` § "Batch 6 Group 6 — Closure".

Durable decisions, frozen at Group 1a planning and **implemented in Group 2 exactly as ratified, including one post-Group-1a amendment**:

1. **One implicit, unnamed shortlist per verified admissions officer (prototype refinement, not drift; implemented as designed).** The master catalogs' `Shortlist`/`ShortlistEntry` pair collapses to a single table, bare officer-owned references (`admissions_shortlist_entries`) — the same kind of deliberate collapse as Batch 3's `HighSchool` refinement and Batch 5's `ConsentSettings` collapse. No named or multiple shortlist records, no entry notes/labels/tags. The richer named-shortlist catalog model remains the unbuilt long-term direction.
2. **No denormalized student data on a shortlist row (implemented as designed).** An entry is only an officer id and a `student_profile_id` (a lookup key), plus an entry id and `created_at`. Writes go only to this one admissions-owned table — never to `student_profiles`, `profile_visibility_settings`, or any Batch 2/3/4 table.
3. **Live re-gating doctrine, no stale-visibility bypass (implemented as designed).** Every read of a saved entry re-checks `is_admissions_visible_profile(...)` at query time — the same live-gate-at-query-time doctrine used by Batch 3/4/5. A hidden, unpublished, consent-withdrawn, or suspended-owner profile drops out of the saved list silently (no distinguishing withdrawal message, count, or placeholder) while the existing generic "not available" detail page is reused unchanged; a retained entry resurfaces automatically if the profile becomes visible again.
4. **Zero student-visible shortlist surface, zero counselor/review-table access (implemented as designed).** No table, policy, or UI lets a student detect being shortlisted; `counselor_student_links`, `counselor_review_requests`, and `counselor_feedback_notes` get no new admissions policy of any kind — regression-gated absences, re-verified at Batch 6 closure.
5. **AMENDED at Group 2 — removal is a hardened `SECURITY DEFINER` RPC, not a direct DELETE policy (new durable decision, supersedes the Group 1a proposal).** The Group 1a proposal specified an owner-scoped DELETE policy deliberately not visibility-gated. Local adversarial testing proved this could not deliver its own guarantee: **PostgreSQL implicitly ANDs a table's SELECT policies into every UPDATE/DELETE's row-targeting scan, regardless of the UPDATE/DELETE policy's own `USING` clause** — confirmed via `EXPLAIN` and a from-scratch minimal probe table (a table with a DELETE policy and no SELECT policy at all still returned zero rows deleted for a matching row). Because the officer SELECT policy here is visibility-gated, the DELETE policy could never reach a stale/hidden owned row. A focused independent design-amendment review ratified the fix: drop the DELETE policy entirely, revoke DELETE privilege from `authenticated`, and add `public.remove_own_admissions_shortlist_entry(entry_id uuid)` — `language sql`, `volatile`, `strict`, `security definer`, `set search_path = public`, `EXECUTE` revoked from `PUBLIC` and granted only to `authenticated` — whose own `WHERE` clause re-implements ownership + verified-officer authorization (visibility deliberately absent), bypassing RLS internally because the table is `ENABLE`d (not `FORCE`d). This is the **repo's first mutation RPC**. **New durable RLS pattern recorded here for future batches: UPDATE/DELETE row-targeting requires SELECT-policy visibility; when a mutation must reach rows the SELECT policies hide, use a hardened `SECURITY DEFINER` RPC** (same hardening recipe as existing read-only helpers, but `volatile` not `STABLE`, and never taking the owner id as a parameter).

**Cross-batch regression boundaries, reconfirmed at Batch 6 closure:** the Batch 3 counselor SELECT-only boundary on the four Batch 2 profile tables; the Batch 4 counselor-write confinement to `counselor_review_requests`/`counselor_feedback_notes`; and the Batch 5 boundaries — admissions SELECT-only on the profile tables, zero direct `profile_visibility_settings` access, zero counselor-table access. No Batch 6 commit touches any prior-batch migration, `lib/student-profile`, `lib/counselor-link`, `lib/counselor-review`, or `lib/auth`.

**Zero service-role anywhere in the Batch 6 surface**, exactly like every prior batch — the shortlist runs entirely under the authenticated cookie-aware Supabase server client, with RLS (and, for removal, the hardened RPC) as the backstop.

Batch 6 group sequence, all COMPLETE: **G1a charter/handoff** (`0d12f936`) → **G1b–1f diagrams** (`f8d8a1a3`, `3cfbaa6a`, `34f3aa6d`, `70756ce0`, `e17b6552`) → **G2 schema+RLS** (`dcd5bbaf`, independent pre- and post-migration reviews plus the amendment review, all GO) → **G3 types/helpers** (`c05a33aa`) → **G4 save action + detail-page control** (`649d58ab`) → **G5 dashboard saved-students section + remove control** (`97320cc1`) → **G6 final independent readiness review (GO for hosted apply + runtime verification) + hosted apply + all 11 runtime gates confirmed + this documentation sync.**

**Deferred documentation debt, now closed by this sync:** the Group 1 README/diagrams' original direct-DELETE-policy description and the actor-matrix/method-catalog/misuse-catalog `ShortlistEntry.remove` wording have been corrected to describe the ratified RPC mechanism (see the frozen Group 1 artifacts and master catalogs). The standalone "G0" `/student/profile` stale-privacy-copy housekeeping task remains separately unimplemented, outside the Batch 6 group sequence.

**Batch 7 handoff (bounded — no feature selected).** Whatever direction is chosen next must respect: the live-gate-at-query-time doctrine for every cross-role read; bare-reference modeling for cross-role pointers (lookup keys only, zero denormalized content); the new durable RLS pattern above (decision 5); the standing regression boundaries (counselor SELECT-only, counselor-write confinement, admissions write confinement, zero student/counselor shortlist access, zero service-role, no-oracle generic results everywhere). The pre-existing cross-batch runtime backlog (Batch 2 adversarial cross-student row-id tests; Batch 3 Group 5 live gates + RLS-level self-accept; Batch 4 crafted/adversarial gates; the broader Batch 5 deferred runtime gates) remains open and is untouched by Batch 6 — carry it forward truthfully. Full record: `progress-tracker.md` § "Batch 6 Group 6 — Closure".

## Authentication vs Authorization

Supabase Auth is the credential and session authority.

Supabase Auth handles:

- account creation
- email/password authentication
- email verification
- sessions
- password reset

RecruitBook handles:

- application role
- account status
- counselor approval
- admissions officer approval
- suspension state
- protected route access

A valid Supabase session is required, but it is not sufficient for dashboard access.

Dashboard access requires both:

- a valid Supabase session
- a valid RecruitBook application user with the correct role and account status

## No Custom Auth System

RecruitBook must not create:

- a password table
- a session table
- a local `auth_user_ref` table
- a duplicate authentication system

The conceptual `AuthUserRef` from the diagrams maps to Supabase `auth.users`.

## Application User Model

RecruitBook extends Supabase Auth through:

- `public.application_users`

The key relationship is:

- `application_users.auth_user_id` references `auth.users(id)`

The `application_users` table is the source of truth for:

- role
- account status
- approval state
- suspension state

Each RecruitBook application user corresponds to one Supabase Auth user.

## Email Field

`application_users.email` is an application copy/display/contact field.

Supabase Auth remains the credential authority.

Do not treat `application_users.email` as the source of truth for login credentials.

## Roles

Valid roles are:

- `student`
- `counselor`
- `admissions_officer`
- `platform_admin`

Public sign-up may only create:

- `student`
- `counselor`
- `admissions_officer`

Public sign-up must never create:

- `platform_admin`

Platform administrator accounts are manually provisioned or assigned outside public registration.

## Account Statuses

Valid account statuses are:

- `email_unverified`
- `active`
- `pending_approval`
- `verified`
- `suspended`

Do not add `unauthorized` as an account status.

Unauthorized access is a route/access outcome, not a stored database state.

## Role and Status Meaning

Students become active after email verification.

Counselors begin in `pending_approval` after email verification and require platform admin approval before becoming `verified`.

Admissions officers begin in `pending_approval` after email verification and require platform admin approval before becoming `verified`.

Platform admins use:

- role: `platform_admin`
- account_status: `active`

Suspended users should not access protected dashboards.

## Protected Routing

Protected route access must be checked server-side.

UI hiding is not authorization.

Client-side role claims must not be trusted.

Dashboard access depends on:

1. A valid Supabase session.
2. An existing `application_users` row.
3. The correct role.
4. The correct account status.
5. The account not being suspended.

## Current Route Policy

The current Batch 1 protected route policy is:

| Route | Required Role | Required Status |
|---|---|---|
| `/student/dashboard` | `student` | `active` |
| `/counselor/pending` | `counselor` | `pending_approval` |
| `/counselor/dashboard` | `counselor` | `verified` |
| `/admissions/pending` | `admissions_officer` | `pending_approval` |
| `/admissions/dashboard` | `admissions_officer` | `verified` |
| `/admin/dashboard` | `platform_admin` | `active` |

Unauthenticated users should be sent to:

- `/login`

Suspended or unauthorized users should be sent to:

- `/unauthorized`

## Database Security

Row Level Security must be enabled on public tables.

RLS is not optional.

Policies should be explicit.

Normal users must not be able to update their own:

- role
- account status
- suspension fields

Platform admins may approve, deny, or suspend users according to Batch 1 rules.

## Public Registration Security

Public registration must reject `platform_admin`.

This must be enforced in more than one place:

- the user interface should not show `platform_admin` as an option
- the server-side registration logic should reject `platform_admin`
- the database/RLS policy should reject `platform_admin`

Do not rely only on a frontend dropdown to enforce this.

## Audit Logging

Audit logs exist in:

- `public.audit_log_entries`

Browser clients should not insert audit logs directly.

Audit log writes should happen through:

- trusted server-side code
- service-role code
- carefully controlled database functions

This keeps audit logs more tamper-resistant.

For the early prototype, audit logging can focus on:

- approval decisions
- suspensions
- unauthorized access denials

Login audit events may be implemented later if needed.

## Approval Decisions

Approval decisions exist in:

- `public.approval_decisions`

Approval decisions only apply to roles that require admin approval:

- `counselor`
- `admissions_officer`

Approval decisions must not target:

- `student`
- `platform_admin`

This is enforced by the `approval_decisions_target_role_check` constraint.

## First Admin Bootstrap

The first `platform_admin` must be manually seeded after creating a Supabase Auth user.

Do not create a public admin registration path.

Do not create fake placeholder admin credentials in migrations.

Do not allow public sign-up to create admin users.

## Supabase Service Role

The Supabase service role key must never be exposed to the browser.

The service role key may only be used in trusted server-side code.

Use the service role only when intentionally bypassing RLS for privileged operations.

For most normal user flows, use the authenticated user context and RLS policies.

## Batch 1 Database Objects

Batch 1 includes these database tables:

- `public.application_users`
- `public.approval_decisions`
- `public.audit_log_entries`
- `public.protected_route_policies`

Batch 1 includes these enums:

- `public.user_role`
- `public.account_status`
- `public.approval_decision_type`
- `public.audit_action`

## Batch Boundaries

Batch 1 only includes:

- authentication
- role identity
- account status
- protected routing
- approval/suspension foundation
- audit logging foundation

Batch 1 does not include:

- student profile creation
- transcript upload
- AI contextualization
- admissions search
- counselor review queue
- university discovery
- shortlists
- interest signaling
- file storage

Those belong to later batches.

## Design Priority

For Batch 1, prioritize:

- correctness over visual polish
- security over convenience
- clear role/status routing
- simple inspectable files
- alignment with the frozen diagrams and schema

Do not redesign the system unless explicitly instructed.

## Current Implementation Guidance

When working on Batch 1:

- Treat the frozen diagrams and Supabase schema as authoritative.
- Do not redesign the database.
- Do not change the role model.
- Do not change the account status model.
- Do not change the protected route policy.
- Do not create unrelated tables.
- Do not expand into Batch 2 features.
- Keep implementation changes small, readable, and testable.
