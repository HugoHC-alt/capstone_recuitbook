# RecruitBook Current Project State

## Project Overview

RecruitBook is a web-based prototype for international student recruitment.

The platform helps international students create standardized, context-rich profiles that can later be reviewed by counselors and discovered by admissions officers.

RecruitBook’s long-term purpose is to give international students a clearer way to represent their academic background, school context, activities, achievements, and personal narrative before the formal application stage.

## Tech Stack

RecruitBook is built with:

- Next.js App Router
- React
- TypeScript
- Supabase Auth
- Supabase PostgreSQL
- Supabase Row Level Security
- Vercel deployment

## Current Snapshot

- Batches 1 and 3–7 are formally closed for prototype use.
- Batch 2 is functionally complete, with its documented adversarial row-id runtime verification still deferred.
- Batch 8 admissions discovery filters are implemented and runtime-verified. Groups 1–5, including the demonstration rehearsal and documentation sync, are complete.
- The remaining Batch 8 gate is the final batch-wide closure review.
- No hosted database operation is implied by this repository copy; hosted migration state is recorded in progress-tracker.md.

The sections below preserve chronological implementation snapshots. They are historical records and may contain milestones that were superseded by later entries. Use this snapshot and the latest entry in progress-tracker.md for current status.

## Historical Milestone Log

**Batch 4 — Counselor Review Workflow: COMPLETE and CLOSED — Group 7 final batch review passed (independent review); approved for prototype use.** **Batch 5 — Admissions Discovery: COMPLETE and CLOSED — Group 7 final batch review passed (independent review, 2026-07-12); approved for prototype use.** Group 1 (diagrams + object context, `22eb7d21`, preceded by `81ca69d2`), Group 2 (schema + RLS migration, `4451e416` — `supabase/migrations/20260711_000001_batch5_admissions_discovery_schema.sql`, PASSED both independent pre- and post-migration reviews, locally validated, and **applied to the hosted development Supabase project**), Group 3 (TypeScript types + server helpers, `8dd17b15` — `lib/admissions-discovery/{types,validation,queries}.ts`, PASSED both security and architecture review with no required fixes), Group 4 (student visibility-controls UI/actions on `/student/profile`, `6f6ec133` — `app/student/profile/visibility-settings-form.tsx` + `saveVisibilitySettingsAction`, PASSED both security and architecture review with no required fixes), Group 5 (admissions discovery dashboard UI on `/admissions/dashboard`, `8ef970a5` — `app/admissions/dashboard/page.tsx` wrapping `listAdmissionsVisibleStudents()`, PASSED both security and architecture review with no required fixes), Group 6 (admissions read-only student profile view at `/admissions/students/[id]`, `5bd32959` — `app/admissions/students/[id]/page.tsx` wrapping `getAdmissionsVisibleStudentProfileReadOnly()`, plus a "View profile" link added to `app/admissions/dashboard/page.tsx`, PASSED independent security and architecture re-reviews with no required fixes), and Group 7 (final batch review, independent review, no blocking findings — approved for prototype closure) are done; an admissions officer can list visible profiles AND open a read-only detail view of one. **Batch 6 — Admissions Shortlists Group 1 (charter + all five diagrams) is now COMPLETE, COMMITTED, and passed a final independent packet review with a GO verdict** — planning/context only, no schema/code exists yet. The hosted Batch 5 headline runtime pass (publish → discover → open detail → withdraw, plus the pending/suspended admissions-officer boundary check) required before Batch 6 Group 2 has now been **confirmed on hosted development**. Before Batch 6 Group 2 (schema + RLS) or any later feature implementation, the sole remaining prerequisite is the mandatory pre-migration schema/RLS ratification. **Update (2026-07-19): Batch 6 Group 2 — schema + RLS migration for Admissions Shortlists — is now COMPLETE.** Migration `supabase/migrations/20260717_000001_batch6_admissions_shortlists_schema.sql` (one additive table `admissions_shortlist_entries`, three RLS policies, and a hardened `SECURITY DEFINER` removal-RPC amendment) plus its adversarial RLS test suite `supabase/tests/20260717_batch6_admissions_shortlists_rls.sql` have passed local `npx supabase db reset` (clean), `npx supabase db lint` (clean), the full adversarial test suite (62/62 passing), an independent security review (APPROVE, no findings), an independent architecture review (APPROVE, no required fixes), and the mandatory post-migration review (GO). **The migration is COMMITTED (`dcd5bbaf` "Add Batch 6 admissions shortlists schema and RLS") but has NOT been applied to any hosted Supabase project** — hosted apply remains a separate, later, explicitly-authorized step. Full record in `progress-tracker.md` § "Batch 6 Group 2". **Batch 6 Group 3 (TypeScript types, validation, and server-side shortlist helpers) is now also COMPLETE and COMMITTED (`c05a33aa` "Add Batch 6 Group 3 TypeScript types + server helpers")** — `lib/admissions-shortlist/{types,validation,queries}.ts`, exporting `saveAdmissionsShortlistEntry`, `listMyAdmissionsShortlist`, and `removeAdmissionsShortlistEntry`: pure types/validation plus a server-only authenticated-Supabase-client data layer, RLS-backed ownership/visibility, idempotent save (23505 → same fixed success), RPC-only removal (`remove_own_admissions_shortlist_entry`, never direct DELETE), fixed generic no-oracle results, and zero service-role usage. `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `git diff --check` all clean; independent security review APPROVE (no required corrections); independent architecture review APPROVE (no required corrections). No UI, routes, server actions, runtime UI verification, or hosted migration application exist yet. **Batch 6 Group 4 is next.** Full record in `progress-tracker.md` § "Batch 6 Group 3". **Batch 6 Group 4 (admissions save-to-shortlist control) is now also COMPLETE and COMMITTED (`649d58ab` "Add Batch 6 Group 4 save action + the Save to Shortlist control")** — the existing `/admissions/students/[id]` read-only detail page (`app/admissions/students/[id]/page.tsx`) now renders a "Save to shortlist" control, via a colocated `'use server'` action (`app/admissions/students/[id]/actions.ts`) and a presentational `'use client'` form (`app/admissions/students/[id]/save-shortlist-form.tsx`), for a successfully loaded visible profile only. The action independently re-checks verified-admissions-officer status, treats the profile id strictly as a lookup key, delegates entirely to `saveAdmissionsShortlistEntry(...)` (no direct Supabase/service-role code in the action or form), and preserves the Group 3 helper's fixed safe results — including idempotent duplicate-save handling — with no profile pre-read or client-side visibility check added. The pre-existing generic unavailable state, route-guard reuse (`requireRouteAccess('/admissions/dashboard')`), `force-dynamic`, and read-only profile rendering are all unchanged. `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `git diff --check` all clean; independent security review APPROVE; independent architecture review APPROVE (both: no required corrections). No dashboard saved-students list, remove control, runtime UI verification, or hosted migration application occurred in this group. **Batch 6 Group 5 (dashboard "Saved students" section + remove control) is next.** Full record in `progress-tracker.md` § "Batch 6 Group 4". **Batch 6 Group 5 (dashboard "Saved students" section + remove control) is now also COMPLETE and COMMITTED (`97320cc1` "Add Batch 6 Group 5 dashboard Saved students section + remove control on admissions dashboard")** — `/admissions/dashboard` (`app/admissions/dashboard/page.tsx`, modified) now includes a "Saved students" section loaded through `listMyAdmissionsShortlist()`, via a colocated `'use server'` action (`app/admissions/dashboard/actions.ts`) and a presentational `'use client'` remove form (`app/admissions/dashboard/remove-shortlist-form.tsx`), showing only currently-effectively-visible saved profiles. Each saved row shows only the four approved summary fields, an intentional reused "View profile" link to the existing visibility-gated `/admissions/students/[id]` detail route (not a new data field or authorization path), and the remove control. Hidden, withdrawn, suspended-owner, foreign, and nonexistent profiles are silently absent from the list — no stale placeholder, explanation, or count was added. The remove action independently re-checks verified-admissions-officer status, treats the entry id strictly as a lookup key, delegates entirely to `removeAdmissionsShortlistEntry(...)` (RPC-only removal via the hardened Group 2 `SECURITY DEFINER` function, never direct DELETE), preserves the helper's uniform safe removal result, and revalidates `/admissions/dashboard` only on success. The existing discovery-list section remains free of any Save control. `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `git diff --check` all clean; independent security review APPROVE; independent architecture review APPROVE (both: no required corrections). Two non-blocking review observations recorded: duplicated inline JSX between the two stable list renderers was deliberately left in place under the Minimal-Diff rule, and the saved-row "View profile" link was confirmed intentional and reuses the existing approved route. **Batch 6 runtime gates have not yet been executed and hosted migration application has not occurred.** **Batch 6 Group 6 — final batch review, tracker update, and Batch 7 handoff — is next.** Full record in `progress-tracker.md` § "Batch 6 Group 5". **Batch 6 Group 6 (final review + tracker update) is now underway: hosted migration application and all 11 mandatory Batch 6 runtime gates have been confirmed on hosted development, and the deferred documentation sync (Group 1 README/diagrams' DELETE-mechanism corrections, the actor-matrix/method-catalog/misuse-catalog wording, `architecture-decisions.md`, this file, `progress-tracker.md`, and a new Durable RLS Patterns bullet in `architecture-decisions.md` and `coding-standards.md`) is complete.** This followed the independent final readiness review (GO for hosted apply + runtime verification, no required corrections). **Update: the independent final batch-wide closure review returned GO. Batch 6 — Admissions Shortlists is formally CLOSED, approved for prototype use** (documentation-sync commit `7a6e0286` "Close Batch 6 admissions shortlists"). Full record in `progress-tracker.md` § "Batch 6 Group 6 — Closure". The pre-existing Batch 2–5 deferred runtime backlog and the standalone "G0" `/student/profile` privacy-copy item remain deferred, unabsorbed by this closure. **Batch 7 is now SELECTED: UI Foundation & Prototype-Path Polish** — a presentational-only batch ratified by independent review, introducing no schema/RLS/auth/data-layer change. **Group 1 — UI Foundation is COMPLETE, approved, and COMMITTED (`c6aa6b3a` "Add Batch 7 UI foundation")**: Tailwind v4 CSS-first setup, Space Grotesk + Fraunces via `next/font`, accessible global tokens, a global focus-visible ring and reduced-motion baseline, and four presentational primitives (`Card`, `PillButton`, `ActionFeedback`, `SectionStripe`) under `components/ui/` — zero page/form/action/data-layer/Supabase behavior changed; `tsc`/lint/build/`git diff --check` clean; independent security and architecture/accessibility reviews both APPROVE. **Group 2 — Student Core is COMPLETE, approved, and COMMITTED (`63b618ba` "Add Batch 7 Group 2 Student Core restyling for dashboard and profile editor")**: restyled `/student/dashboard` and the full `/student/profile` editor (all six form components), preserving every guard, action/form wiring, hidden lookup-key field, generic no-oracle message, label, and ARIA alert/status semantic exactly, with the stale G0 copy left untouched; `tsc`/lint/build/`git diff --check` clean; independent security and architecture reviews both APPROVE. **Batch 7 Group 3 — Counselor Connection Surfaces is COMPLETE, approved, and COMMITTED (`f1088962` "Add Batch 7 Group 3 Counselor Connection Surfaces")**: restyled `/student/counselor`, `/counselor/dashboard`, and `/counselor/students/[id]` (5 files) with the Group 1/2 pattern, preserving all three route guards, hidden lookup-key fields, generic no-oracle messages (including the byte-identical "not available" state), and `role="alert"`/`role="status"` semantics via local `Feedback` wrappers now delegating to `ActionFeedback`; `tsc`/lint/build/`git diff --check` clean; independent security and architecture reviews both APPROVE. **Batch 7 Group 4 — Admissions Surfaces is COMPLETE, approved, and COMMITTED (`4444d1d4` "Add Batch 7 Group 4 Admissions Surfaces")**: restyled `/admissions/dashboard` (discovery + saved-students sections, remove control) and `/admissions/students/[id]` (read-only detail, Save to shortlist control) — 4 files — with the established Batch 7 pattern, preserving both route guards, live visibility/no-oracle behavior, RPC-only removal, the four approved summary fields, the existing "View profile" link, hidden `student_profile_id`/`entry_id` lookup fields, and `role="alert"`/`role="status"` semantics now via the shared `ActionFeedback` primitive; `tsc`/lint/build/`git diff --check` clean; independent security and architecture reviews both APPROVE. **Batch 7 Group 5 — Auth and Entry Surfaces is COMPLETE, approved, and COMMITTED (`53b91171` "Add Batch 7 Group 5 Auth and Entry Surfaces")**: restyled the landing page and public authentication pages (`app/page.tsx`, `app/login/page.tsx`, `app/sign-up/page.tsx`, `app/forgot-password/page.tsx`, `app/reset-password/page.tsx`, `app/unauthorized/page.tsx` — 6 files) with the established Batch 7 pattern, preserving the login page's `Suspense`-wrapped `useSearchParams()` notice boundary and static prerendering, all enumeration-safe/fixed message text, and `role="alert"`/`role="status"` semantics via `ActionFeedback`; `tsc`/lint/build/`git diff --check` clean; independent security and architecture reviews both APPROVE. **Batch 7 Group 6 — Admin + Pending Surfaces is COMPLETE, approved, and COMMITTED (`5707063d` "Add Batch 7 Group 6 Admin and pending-account surface restyling")**: restyled `app/admin/dashboard/page.tsx`, `app/counselor/pending/page.tsx`, and `app/admissions/pending/page.tsx` (3 files) with the established Batch 7 pattern, preserving all three route guards, admin approve/suspend form wiring, table data/column/row-to-form integrity (no shared table primitive added — correctly judged premature for a single-consumer file), the fixed `NOTICE_MESSAGES` map, and `role="status"` semantics via `ActionFeedback`; `tsc`/lint/build/`git diff --check` clean; independent security review APPROVE (run twice, independently, this session); independent architecture/accessibility review APPROVE WITH NOTES (one non-blocking design-system observation on notice color polarity, not a required correction). **Update: the independent final batch-wide closure review returned GO, no required corrections. Batch 7 — UI Foundation & Prototype-Path Polish is formally CLOSED, approved for prototype use.** The review confirmed strict presentational-only scope across all six groups (no forbidden dependency/behavior/security drift) and complete visual coverage of the student, counselor, admissions, auth/entry, admin, and pending surfaces; the documented Minimal-Diff observations, including the admin notice-color polarity item, remain non-blocking and required no corrective work. A future batch direction has not yet been selected. Full record in `progress-tracker.md` § "Batch 7 — UI Foundation & Prototype-Path Polish". Batch 3 (Counselor Connection Foundation) closed earlier (`60d71226`).

Batch 1 (auth) is complete, committed, and approved. Batch 2 (student profile foundation) is functionally complete and review-approved, with one open runtime-verification item before formal closure (see Immediate Next Step). Batch 2 established the student-owned profile data model and full editing workflow (basic profile, academic background, activities, achievements, narratives).

Batch 2 progress:

- **Group 1 — Student Profile diagrams + object context: complete and committed.** The `recruitbook-diagrams/diagrams/slices/batch-2-student-profile-foundation/` slice packet (use-case, domain-subset, misuse-case, activity diagrams + README) is the frozen design input for Batch 2.
- **Group 2 — Student profile schema + RLS migration: complete and committed.** `supabase/migrations/20260704_000001_batch2_student_profile_schema.sql`. Validated locally with Supabase CLI (`db reset` applies both migrations; `db lint` clean) **and applied to the hosted development Supabase project.**
- **Group 3 — Student profile TypeScript types + server helpers: complete and committed.** `lib/student-profile/{types,completion,queries,validation}.ts`.
- **Group 4 — Student dashboard read-only profile overview: complete and committed.** `app/student/dashboard/page.tsx`. **Runtime-verified in the browser** against the migrated hosted project.
- **Group 5 — Basic profile + academic background editing (first write path): complete, committed (`e2d6c0d1`), PASSED both security and architecture reviews, and runtime-tested.** Files: `app/student/profile/{page,actions,action-state,basic-profile-form,academic-background-form}.tsx` plus the dashboard "Edit profile" link. The live write-flow test surfaced a first-save failure in `getOrCreateCurrentStudentProfile()`: the chained `insert().select().single()` call re-read the just-inserted row under the SELECT RLS policy in the same request, which failed. Fixed in commit `5178c988` ("Fix student profile first-save initialization") by splitting it into a bare `insert()` (governed by `insert_own`) followed by a separate owner-scoped `select` (governed by `select_own`) — see `lib/student-profile/queries.ts`. Re-verified after the fix: the student can save basic profile info and add multiple academic background entries. The adversarial cross-student `academic_background_id` denial (submitting another student's row id to update/delete) has **not been explicitly confirmed as run** — recorded as an open verification item, not a code blocker (the code path is correct by construction: form ids are lookup keys only, RLS `update_own`/`delete_own` is the boundary).
- **Group 6 — Activities and achievements CRUD: complete, committed (`fc749789`), PASSED both security and architecture reviews, and runtime-tested.** Files: `app/student/profile/{activities-form,achievements-form}.tsx` plus six server actions in `app/student/profile/actions.ts`, mirroring the Group 5 academic-background pattern exactly. Runtime testing confirmed the student can add/update/delete activities and achievements and that dashboard completion reflects the changes. The adversarial cross-student `activity_id`/`achievement_id` denial has **not been explicitly confirmed as run** — same open verification item as Group 5.
- **Group 7 — Student-authored narrative fields: complete, committed (`b706a21c`), PASSED both security and architecture reviews, and runtime-tested.** File: `app/student/profile/narratives-form.tsx` plus `saveNarrativesAction` in `actions.ts`. Runtime testing (performed by the project owner) confirmed save/persist/clear behavior and that dashboard completion updates. The adversarial cross-student test is **not applicable** here: `saveNarrativesAction` takes no profile id from the form, so a cross-student write is structurally impossible (ownership is fully server-derived via `getOrCreateCurrentStudentProfile()`, with RLS `update_own` as an additional backstop).

Environment facts established this session:

- **Local Supabase workflow (Docker Desktop + Supabase CLI)** is set up; `supabase/config.toml` exists; local `db reset`/`db lint` validate migrations against a disposable local Postgres.
- **Hosted development Supabase project now has the Batch 2 migration applied.**
- **SMTP is configured** on the hosted project (email delivery for auth flows).

## Batch 3 — Counselor Connection Foundation (Groups 1–7 complete: CLOSED, approved for prototype use, COMMITTED `60d71226`)

- **Group 1 — diagrams + object context: complete** (frozen packet + additive catalog entries; SM-13; decisions recorded).
- **Group 2 — schema + RLS migration: complete, committed, reviewed (independent review, conditional GO + R1 fix applied), locally validated, and APPLIED TO HOSTED dev Supabase.** `supabase/migrations/20260707_000001_batch3_counselor_connection_schema.sql` — `counselor_link_status` enum, `counselor_student_links` table (email-addressed late binding; counselor id NULL until response; bound on both accept and decline), status↔column CHECKs + timestamp-order CHECK, partial unique active-pair index, three hardened helpers (`is_verified_counselor`, `current_user_normalized_email`, `is_linked_counselor_for_profile`), six link RLS policies + column-level UPDATE hardening, and four additive counselor SELECT-only policies on the Batch 2 profile tables. Zero service-role.
- **Group 3 — types + server helpers: complete (server-side only; NO UI/routes yet).** `lib/counselor-link/{types,validation,queries}.ts` — the helper/action layer (`requestCounselorLink`, `listMyCounselorLinks`, `revokeCounselorLink`, `listPendingCounselorRequests`, `acceptCounselorRequest`, `declineCounselorRequest`, `listLinkedStudents`, `getLinkedStudentProfileReadOnly`, `assertCurrentVerifiedCounselor`). Authenticated cookie-aware server client only; RLS backstop; no-oracle generic results; reuses the Batch 2 aggregate + completion. `tsc`, `lint`, `build` clean.
- **Group 4 — student counselor-link UI: COMPLETE, PASSED both security and architecture reviews, manual runtime test completed by the project owner, and COMMITTED.** `app/student/counselor/{page.tsx,actions.ts,counselor-link-forms.tsx}` + one nav link on `app/student/dashboard/page.tsx`. Protected server component reusing `requireRouteAccess('/student/dashboard')` (`force-dynamic`; no route-policy change); request-by-email form, owner-scoped link list with `pending→"Requested"` status labels, per-row revoke control (only when `canRevoke`), safe empty state. Two thin `'use server'` wrappers (`requestCounselorLinkAction`, `revokeCounselorLinkAction`) around the Group 3 helpers; `CounselorLinkActionResult` (from the pure `lib/counselor-link/types.ts`) via `useActionState`; presentational client forms (no Supabase/authz). Zero service-role; generic no-oracle messages; plain text. `tsc`/`lint`/`build` clean. Manual runtime test confirmed the student request → list → revoke path end-to-end (see the environment/troubleshooting notes in `progress-tracker.md`).
- **Group 5 — counselor requests + roster UI: COMPLETE (code), PASSED both security and architecture reviews, NOT yet manually runtime-tested, NOT yet committed.** `/counselor/dashboard` upgraded from the Batch 1 placeholder to the counselor-facing view: pending requests addressed to the verified counselor's normalized email (student shown only as an opaque application-user id until accept) with per-row Accept/Decline controls, plus the accepted-students roster (best-effort `preferredName`/`country` preview), with safe empty states for both sections; the logout form is preserved. Files: `app/counselor/dashboard/page.tsx` (MODIFIED — protected server component, `force-dynamic`, first work `await requireRouteAccess('/counselor/dashboard')`, no route-policy change; parallel `listPendingCounselorRequests()` + `listLinkedStudents()`), `app/counselor/dashboard/actions.ts` (CREATED — two thin `'use server'` wrappers `acceptLinkRequestAction` / `declineLinkRequestAction` around the Group 3 helpers with `revalidatePath('/counselor/dashboard')` on success), and `app/counselor/dashboard/counselor-request-forms.tsx` (CREATED — presentational `'use client'` Accept/Decline forms via `useActionState` with `CounselorLinkActionResult`/`INITIAL_COUNSELOR_LINK_ACTION_RESULT` from the pure `lib/counselor-link/types.ts`; hidden `link_id` is a lookup key only; no Supabase/authz). Reuses the Group 3 helpers only — zero duplicated query logic; zero service-role; generic no-oracle results (wrong-email/stale/foreign/already-processed → same fixed error); plain text, no `dangerouslySetInnerHTML`. `lib/counselor-link/*`, `lib/auth/route-policies.ts`, and the migration are unchanged. `tsc`/`lint`/`build` clean. (Group 6 now adds the per-student `/counselor/students/[id]` detail view and links the roster to it.)
- **Group 6 — counselor read-only linked-student profile view: COMPLETE — security review PASSED, architecture review PASSED, runtime-tested by the project owner (all 8 Group 6 gates PASSED), NOT yet committed.** New route `/counselor/students/[id]` renders ONE linked student's Batch 2 profile aggregate READ-ONLY via the existing Group 3 helper `getLinkedStudentProfileReadOnly(studentProfileId)` — accepted-link-gated at the RLS layer. Files: `app/counselor/students/[id]/page.tsx` (CREATED — protected server component, `force-dynamic`, first work `await requireRouteAccess('/counselor/dashboard')` reusing the already-registered `counselor + verified` policy, NO route-policy change; Next 15 `params: Promise<{ id: string }>` awaited; `[id]` is a lookup key only; renders derived completion + profile overview + full academic/activities/achievements lists + full narratives as plain escaped JSX; a null/`profile===null` aggregate renders ONE generic "This student profile is not available." state for all not-found/no-access cases — no oracle, no raw errors; NO edit controls, no forms, no server actions, no link to `/student/profile`; just a Back-to-dashboard link) and `app/counselor/dashboard/page.tsx` (MODIFIED — roster entries now show a "View profile" `<Link>` to `/counselor/students/${studentProfileId}` ONLY when `studentProfileId` is non-null; a linked student without a profile is shown without a link; the route param is the `studentProfileId`, never the application-user id). Zero service-role; all data access through the Group 3 helper only. `lib/counselor-link/*`, `lib/student-profile/*`, `lib/auth/route-policies.ts`, and the migration are unchanged. `tsc`/`lint`/`build` clean (`/counselor/students/[id]` builds as `ƒ (Dynamic)`). **Runtime-tested by the project owner against the hosted dev project — all 8 Group 6 route-access gates PASSED** (accepted-linked counselor opens the view; unlinked/guessed id → generic "not available"; pending link → no access; declined link → no access; revoke-then-read removes access immediately; admissions officer zero access; student/non-verified-counselor denied by guard; no edit controls on the view). Security review PASSED (pass-with-fixes: the only required fix was the runtime-test doc-accuracy update, now applied — no code changes); architecture review PASSED (approved, no required fixes).
- **Group 7 — final batch review + closure: COMPLETE.** A batch-wide independent review across the full Batch 3 surface (migration, `lib/counselor-link/*`, all Group 4/5/6 app files, route guards) found NO required fixes: zero service-role, server-side user derivation throughout, lookup-keys-only + no-oracle end-to-end, accepted-link-gated SELECT-only counselor access with immediate revocation, admissions zero access, no scope drift or future-batch leakage. **Batch 3 is approved for prototype closure.** Low/non-blocking notes and the Batch 4 handoff (counselor review workflow = first counselor WRITE surface, needs its own schema/RLS design review; review states/feedback objects on NEW tables, not profile-table policy widening; audit + rate-limit hardening) are recorded in `progress-tracker.md`.


Batch 3 introduces the **first cross-role access to student profile data**: student-consented counselor–student linking (`CounselorStudentLink`) plus counselor **read-only** visibility of a linked student's Batch 2 profile aggregate.

- **Group 1 — Batch 3 diagrams + object context: complete (diagram/catalog/documentation only — NO schema, NO migration, NO app code yet).** Frozen packet at `recruitbook-diagrams/diagrams/slices/batch-3-counselor-connection-foundation/` (use-case, domain-subset, misuse-case, activity, `CounselorStudentLink` state machine, README). Master catalogs updated additively: `CounselorStudentLink` object + prototype refinement note; consent-link relationships (Section 6a) with school-match rows annotated; state model **SM-13**; five link methods + `AccessPolicy.requireAcceptedLink(...)` in the method catalog; actor-matrix rows (Section 6a) + denial rules `D-13`–`D-16`. Durable decisions recorded in `architecture-decisions.md` (per-student consent-link refinement of the HighSchool school-match model; email-addressed late binding, no tokens; counselor SELECT-only; route-guard reuse; link audit deferred).

Core model (frozen): a student requests a counselor link **by email** (email-addressed late binding — `counselor_application_user_id` is NULL until a verified counselor **responds**; both accept and decline self-bind it, but only an accepted link grants visibility); no token/email invitation and NOT `CounselorInvitation`; counselor access is **SELECT-only** and only after an **accepted** link; planned helpers `is_verified_counselor()` + `is_linked_counselor_for_profile()`; planned routes `/student/counselor`, `/counselor/dashboard`, `/counselor/students/[id]` (no route-policy changes).

## Batch 4 — Counselor Review Workflow (Groups 1–7 complete: CLOSED, approved for prototype use; Group 7 final review passed)

Batch 4 introduces the **first counselor WRITE surface**: a student submits their profile for review to an accepted-linked counselor; the addressed verified counselor sees a queue, declines, or completes the request by writing one immutable plain-text feedback note; the student reads the feedback. Frozen design inputs: the slice packet at `recruitbook-diagrams/diagrams/slices/batch-4-counselor-review-workflow/` (README + use-case, domain-subset, misuse-case, activity, SM-14 state machine) and the additive master-catalog entries (`CounselorReviewRequest` + `CounselorFeedbackNote` objects; relationships §7a; state model **SM-14**; method catalog §6a; actor matrix §7a + denial rules `D-17`–`D-20`).

**Group 1 — diagrams + object context: complete, COMMITTED (`7979da85` "Add Batch 4 Group 1 counselor review workflow planning artifacts").**

Core model (frozen at Group 1): counselor writes go ONLY to two NEW tables (`counselor_review_requests`, `counselor_feedback_notes`) — the Batch 3 SELECT-only boundary on all four profile tables is unchanged and regression-gated; every counselor-side read/write requires the anchoring `CounselorStudentLink` to be `accepted` **at query time** (revocation removes the counselor's whole review surface immediately, including reading their own past notes); the student's read of own requests/feedback survives revocation; no late binding (the counselor is known at submit time from the accepted link); `CounselorReviewRequest` states `Requested → Completed / Declined / Withdrawn` (DB enum value `requested`, deliberately not `pending`); feedback is 1:1 per completed request, immutable, ≤4000 plain text; stored state lives on the request object, never on `student_profiles`; UI lands on existing routes only (`/student/counselor`, `/counselor/dashboard`, `/counselor/students/[id]`) with no route-policy changes; zero service-role. The README records the full RLS policy matrix, the two new helpers (`is_student_owner_of_accepted_link`, `is_counselor_of_live_accepted_link`), column-level UPDATE hardening, the feedback-first two-step `complete(...)` order (non-atomicity recorded as an accepted risk; future `SECURITY DEFINER` RPC), and the 11 mandatory Batch 4 runtime gates.

Planned groups: G1 diagrams/context → G2 schema+RLS (independent review design review BEFORE and AFTER coding) → G3 types + server helpers → G4 student request UI → G5 counselor queue + feedback write UI → G6 student feedback read view → G7 final review + Batch 5 handoff.

**Group 2 — schema + RLS migration: COMPLETE, COMMITTED (`2c1d949c` "Add Batch 4 counselor review schema and RLS"), post-coding independent review PASSED (no required fixes).** `supabase/migrations/20260709_000001_batch4_counselor_review_schema.sql` — enum `counselor_review_status`; tables `counselor_review_requests` + `counselor_feedback_notes`; the four review-required helpers (R1); party-id-pinned request INSERT (R2a) + status-gated feedback INSERT (R2b); the full RLS matrix (student ownership-only reads that survive revocation, counselor access gated on the live accepted link at query time, admin SELECT-only, no admissions, no DELETE, immutable feedback); column-level UPDATE hardening (+ feedback DELETE revoke); decisions D1–D3 in the header. Reuses Batch 1/2/3 helpers/triggers unchanged; Batch 2/3 profile + link policies untouched; zero service-role. Local `npx supabase db reset` + `db lint` clean; live structural verification + a 16/16 behavioral adversarial RLS test all pass (details in `progress-tracker.md`). **The migration has been applied to the hosted development Supabase project.**

**Group 3 — TypeScript types + server helpers: COMPLETE, COMMITTED (`e9c36eec` "Add Batch 4 counselor review server helpers"), security review PASSED, architecture review PASSED (both: no required fixes).** `lib/counselor-review/{types,validation,queries}.ts` — mirrors the Batch 3 Group 3 helper-layer pattern exactly: server-only, authenticated cookie-aware Supabase server client only, RLS as the authorization backstop, server-side current-user derivation (`assertCurrentActiveStudent`/`assertCurrentVerifiedCounselor`/`getCurrentApplicationUser`, reused not redefined), client-supplied `linkId`/`requestId` are lookup keys only, fixed generic `CounselorReviewActionResult` messages (no raw Supabase/Postgres errors), zero service-role. Six helpers: student-side `requestCounselorReview` (derives the counselor id from the student's OWN accepted link, never from the client; bare insert; `23505` duplicate → same generic recorded success, no oracle), `listMyCounselorReviewRequests` (ownership-scoped, survives revocation, folds in received feedback), `withdrawCounselorReviewRequest`; counselor-side `listPendingCounselorReviewRequests` (queue gated by the live accepted link at query time; best-effort profile preview under the Batch 3 accepted-link SELECT policy), `declineCounselorReviewRequest`, `completeCounselorReviewRequest` (feedback-first: bare insert then status CAS; `23505` on the feedback insert = note exists → proceed to CAS per decision D3; any other insert error fails closed without running the CAS). `npx tsc --noEmit`, `npm run lint`, `npm run build` all clean (confirmed independently by both reviewers). No pages, forms, server actions, route-policy changes, or migration changes in this group.

**Group 4 — student review-request UI/actions: COMPLETE, COMMITTED (`e922a9de` "Add Batch 4 student review request UI"), security review PASSED, architecture review PASSED (both: no required fixes; no independent review required — scoped UI/server-action group over already-reviewed helpers/RLS).** Extends `/student/counselor` so an active student can request review from an accepted counselor link (with an optional plain-text `student_message`, ≤1000), view their own review request statuses, withdraw a still-`requested` request, and read received feedback as normal escaped JSX. Files: `app/student/counselor/page.tsx` (MODIFIED — still `force-dynamic` + `requireRouteAccess('/student/dashboard')` first; loads `listMyCounselorReviewRequests()` alongside `listMyCounselorLinks()`; renders a "Request review" control only under `accepted` links, a "Your review requests" section with status/date/feedback/withdraw), `app/student/counselor/actions.ts` (MODIFIED — added `requestCounselorReviewAction`/`withdrawCounselorReviewRequestAction`, thin `'use server'` wrappers over the Group 3 helpers, reusing the existing `STUDENT_COUNSELOR_PATH` revalidation constant; existing link actions untouched), and `app/student/counselor/counselor-link-forms.tsx` (MODIFIED — added `RequestReviewForm`/`WithdrawReviewRequestForm`; generalized the shared `Feedback` banner to a structural `{error,success}` shape so it serves both `CounselorLinkActionResult` and `CounselorReviewActionResult`). Presentational client forms only (no Supabase/authz); hidden `link_id`/`request_id` are lookup keys only; no raw Supabase/Postgres errors surfaced; no markdown/`dangerouslySetInnerHTML`. No schema/RLS/helper/route-policy/counselor-page changes. `tsc`/`lint`/`build` all clean (confirmed independently by the coder and both reviewers). Non-blocking notes from review (no action taken): heading-proximity ("Your requests" vs "Your review requests"), stale "Batch 3 (Group 4)" header comments on two files (cosmetic, no behavior/authorization misstatement), and a small slice of the planned Group 6 surface (feedback display) landed early in this route — harmless, same batch/route, plain escaped text.

**Group 5 — counselor review queue + feedback write UI/actions: COMPLETE, COMMITTED (`aaefcb9d` "Add counselor review queue and feedback actions"), security review PASSED, architecture review PASSED (both: no required fixes), no independent review required.** Adds a "Review queue" section to `/counselor/dashboard` (distinct from the existing link "Pending requests" section) with a decline control, and a feedback-submission form to `/counselor/students/[id]` beside the still-fully-intact read-only profile view. Files: `app/counselor/dashboard/page.tsx` (MODIFIED — loads `listPendingCounselorReviewRequests()`; queue rows link to `/counselor/students/${studentProfileId}?reviewRequestId=${requestId}`), `app/counselor/dashboard/actions.ts` (MODIFIED — added `declineReviewRequestAction`/`completeReviewRequestAction`, thin wrappers over the Group 3 helpers; `student_profile_id` is a revalidation-path input only, never authorization), `app/counselor/dashboard/counselor-request-forms.tsx` (MODIFIED — added `DeclineReviewRequestForm`/`SubmitFeedbackForm`; reuses the Group 4 `{error,success}`-shaped `Feedback` banner rather than duplicating it), and `app/counselor/students/[id]/page.tsx` (MODIFIED — the feedback form renders only when the query-param `reviewRequestId` is verified server-side against the counselor's own live queue **AND** the matched row's `studentProfileId` equals the page's `[id]` — the latter check was added before commit per the architecture review's recommendation, closing a hand-crafted-URL request/profile mismatch that could otherwise misdirect the post-submit revalidation; it is a data-quality/UX guard, not a new authorization boundary — RLS + the Group 3 helpers remain the sole boundary). Zero service-role; no write path to any Batch 2 profile table; every stale/foreign/withdrawn/declined/completed/cross-counselor request id collapses to the same generic message; `tsc`/`lint`/`build` all clean (re-confirmed after the hardening fix). **Runtime verification of the Group 5 adversarial gates (unlinked/revoked counselor, cross-counselor write, pending/suspended counselor, stale/foreign ids, feedback-first non-atomicity, empty/over-limit feedback) has NOT yet been performed** — deferred to the project owner, recorded truthfully as an open item, not a code blocker.

**Group 6 — student feedback read view: COMPLETE, security review PASSED, architecture review PASSED (both: confirmatory — no required fixes).** **No new implementation commit exists for Group 6**: the feedback-read surface it targeted already shipped in Group 4 (commit `e922a9de`) — on `/student/counselor`, each of the student's own review requests already displays completed counselor feedback as plain escaped JSX text (`<p>{item.feedbackText}</p>`), sourced from `listMyCounselorReviewRequests()` (ownership-scoped, ties `feedbackText` to a request only once a `counselor_feedback_notes` row exists, which only happens after a counselor completes it). Requested/withdrawn/declined requests structurally show no feedback text (no note row exists for them). No new write path was added; no schema/RLS/route-policy/helper-contract change was made; the existing `/student/counselor` guard (`requireRouteAccess('/student/dashboard')`) and read-only pattern are unchanged. Both reviews were confirmatory passes on the already-committed Group 4 surface (verified via `git status`/`git diff` showing zero app/lib changes) and explicitly affirmed that adding no new code was the correct outcome — a redundant second feedback UI would have been the wrong result under the Minimal-Diff Engineering Rule. **No new Group 6-specific warnings were identified** by either reviewer; the same two non-blocking cosmetic notes already recorded in Group 4 (heading proximity, stale "Batch 3 (Group 4)" header comments) were repeated for completeness, not as new findings. `tsc`/`lint`/`build` all re-confirmed clean.

**Group 7 — final batch review + closure: COMPLETE, APPROVED TO CLOSE BATCH 4 (independent review, no blockers).** Batch-wide verification against the frozen scope: all counselor writes confined to the two Batch 4 review tables; a migrations-wide policy sweep confirmed the ONLY counselor policies on the four Batch 2 profile tables remain Batch 3's SELECT-only set (no counselor write policy exists anywhere); live-accepted-link gating + immediate revocation enforced at query time (behaviorally proven 16/16 at the RLS layer locally in Group 2); student withdraw-only / structurally unforgeable feedback; admissions zero access; zero service-role (repo sweep: negation comments only); plain text end-to-end (no markdown/`dangerouslySetInnerHTML` outside negation comments); `lib/auth/route-policies.ts` untouched since Batch 1, and no Batch 4 commit touched `lib/student-profile`, `lib/counselor-link`, or `lib/auth`; the Group 5 request/profile pairing hardening confirmed present in committed HEAD. **Update: The project owner has since completed the hosted end-to-end runtime pass** (request → queue → decline/complete with feedback → student reads feedback → withdraw → revoke-and-confirm-counselor-loses-everything), confirming the headline functional flow and the revoke-then-review-removes-access-immediately gate. The remaining crafted/adversarial gates (unlinked counselor, cross-counselor write, pending/suspended counselor, admissions zero access, RLS-level student forgery, profile-table write regression, stale/foreign ids, withdrawn-request-blocks-feedback, student-read-survives-revocation, no-raw-DB-errors, HTML-escaping) were not part of this pass and remain open deferred items — see `progress-tracker.md` § "Batch 4 Group 7" for the full reconciled list. Batch 5 handoff notes recorded in `progress-tracker.md`.

## Historical Batch 5 Planning Snapshot (superseded by later closure)

Batch 5 introduces the **first admissions-officer access of any kind** — through Batch 4, `admissions_officer` has zero policies on every table. It adds exactly one new stored concept (student-controlled profile visibility) and one new cross-role read surface (admissions discovery of effectively-visible profiles).

**Group 1 — diagrams + object context: COMPLETE, COMMITTED (`22eb7d21` "Batch 5 Group 1 admissions discovery", preceded by `81ca69d2` "Batch 5 Group 1 Diagrams Revised").** Frozen packet at `recruitbook-diagrams/diagrams/slices/batch-5-admissions-discovery/`: `README.md` (charter — goal, in/out of scope, security invariants, Group 2 schema/RLS handoff, mandatory runtime gates, planned groups) plus five diagrams — `01_admissions_discovery_use_case.puml`, `02_admissions_discovery_domain_subset.puml`, `03_admissions_discovery_misuse_case.puml`, `04_admissions_discovery_activity.puml`, `05_admissions_discovery_visibility_decision.puml`. Matching additive master-catalog refinements landed alongside each diagram: `recruitbook_object_catalog.md`, `recruitbook_misuse_catalog.md` (MC-6 refinement + `MC-B5-1`..`MC-B5-9`), `recruitbook_actor_matrix.md` (denial rules `D-21`–`D-23` + permission table §9a), `recruitbook_method_catalog.md` (§8a), and `recruitbook_state_catalog.md` (SM-6 refinement note — explicitly no new state-model number, no full publication lifecycle). Full list in `progress-tracker.md` § "Batch 5 Group 1". **This is planning/diagram/catalog/documentation only — NO schema, NO migration, NO TypeScript helpers, NO routes, and NO app code exist yet. Admissions officers still have zero access to anything, exactly as at the end of Batch 4.**

Core model (implemented): one new table `profile_visibility_settings`, one-to-one with `student_profiles`, holding two independent student-controlled booleans `is_published` and `admissions_consent` (both default `false`); effective admissions visibility is the strict `is_published AND admissions_consent` **AND the profile owner is an active student (R1)**, evaluated at query time by the helper `is_admissions_visible_profile(profile_id)`, never stored; a missing settings row is not implicitly visible; admissions access is SELECT-only, gated on `is_verified_admissions_officer()`; zero admissions access to any Batch 3/4 counselor table or to `profile_visibility_settings` itself; no admissions writes anywhere in Batch 5.

**Group 2 — schema + RLS migration: COMPLETE, COMMITTED (`4451e416` "Add Batch 5 admissions visibility schema and RLS").** `supabase/migrations/20260711_000001_batch5_admissions_discovery_schema.sql` creates the one settings table, the two hardened helpers (with the R1 active-student-owner condition), the settings RLS matrix (student-owner SELECT ownership-only + admin SELECT-only + active-student-owner INSERT/UPDATE, no DELETE, no admissions/counselor policy), R2 (INSERT does not force either flag — a direct `(true, true)` first publish is valid), R3 (column-level UPDATE hardening limiting authenticated writes to `is_published`/`admissions_consent`), and exactly one additive SELECT-only admissions policy on each of the four Batch 2 profile tables. It passed both the pre-migration review (CONDITIONAL GO, R1–R3 ratified) and the post-migration review (GO, no required fixes), passed local validation (`db reset` + `db lint` clean, plus a 45/45 adversarial RLS test), and **is applied to the hosted development Supabase project** with hosted structural verification passed. Full record in `progress-tracker.md` § "Batch 5 Group 2".

**Group 3 — TypeScript types + server helpers: COMPLETE, COMMITTED (`8dd17b15` "Add Batch 5 Group 3 TypeScript types + server helpers").** `lib/admissions-discovery/{types,validation,queries}.ts` mirrors the Batch 3/4 Group 3 shape exactly: server-only helpers (`import 'server-only'`) built on the authenticated cookie-aware server client, server-derived active-student and verified-admissions-officer role/status checks, the Group 2 RLS as the authoritative backstop, fixed generic no-oracle outcomes, and zero service-role. Delivers: the database-aligned `ProfileVisibilitySettings` type + a client-safe two-boolean input type + a fixed `ProfileVisibilityActionResult` shape + a minimal `AdmissionsVisibleStudentSummary` list type (reusing `StudentProfileAggregate` for the detail read, not duplicating it); strict boolean-only validation with one fixed generic error; the student read/save flow (`getCurrentStudentProfileVisibilitySettings` — ownership-only read, no active-student gate, never auto-creates; `saveCurrentStudentProfileVisibilitySettings` — active-student-gated, bare-insert first-create with R2's unforced `(true,true)` allowed, owner-scoped update on existing rows); the `assertCurrentVerifiedAdmissionsOfficer` guard; the minimal `listAdmissionsVisibleStudents` discovery-list helper (RLS-scoped, no filters/ranking); and the read-only `getAdmissionsVisibleStudentProfileReadOnly` aggregate helper (lookup-key-only id, one generic `null` for every non-visible case). No schema, migration, route policy, server action, UI, diagram, or catalog change. Both security and architecture reviews PASSED with no required fixes; two non-blocking observations (a triplicated profile-read shape across three helper layers, and a theoretical benign concurrent-first-save race) were recorded in `progress-tracker.md` § "Batch 5 Group 3" — neither is a required fix or a new durable decision.

**Group 4 — student visibility-controls UI/actions: COMPLETE, COMMITTED (`6f6ec133` "Add Batch 5 Group 4 student visibility-controls UI/actions").** Extends `/student/profile` (no new route) with an "Admissions visibility" section: `app/student/profile/visibility-settings-form.tsx` (presentational client component, two accessible checkboxes for `is_published`/`admissions_consent`, using the Group 3 `ProfileVisibilityActionResult` shape via `useActionState`, no Supabase/auth/ownership logic, no client-supplied profile id) and a thin `saveVisibilitySettingsAction` server action in `app/student/profile/actions.ts` (independently re-checks the active student via `assertCurrentActiveStudent()` — matching all eleven pre-existing actions in the file — parses only the two checkbox fields, builds the Group 3 input server-side, and calls `saveCurrentStudentProfileVisibilitySettings(...)` unchanged). `page.tsx` loads `getCurrentStudentProfileVisibilitySettings()` after the existing `requireRouteAccess('/student/dashboard')` guard; a missing settings row renders both controls as `false` and is never auto-created on page load. **Effective admissions visibility is never recomputed or displayed client-side** — only the two raw stored booleans render, and the strict `is_published AND admissions_consent AND active-student owner` rule stays exclusively inside the database helper, evaluated at query time. Both security and architecture reviews PASSED with no required fixes; two non-blocking observations (Batch 2's structurally-compatible `errorState()` reuse in the guard-fail path, and the deliberate absence of a derived "currently visible" indicator) were recorded in `progress-tracker.md` § "Batch 5 Group 4" — neither is a required fix or a new durable decision. No admissions-side routes, dashboard, or safe-view UI exist yet. Full record in `progress-tracker.md` § "Batch 5 Group 4".

**Group 5 — admissions discovery dashboard UI: COMPLETE, COMMITTED (`8ef970a5` "Add Batch 5 Group 5 admissions discovery dashboard UI").** Replaces the Batch 1 placeholder body of the existing `/admissions/dashboard` route (no new route) with a server-rendered "Visible students" list loaded via `listAdmissionsVisibleStudents()`, showing only the four approved minimal fields (`preferredName`, `country`, `cityRegion`, `intendedMajor`; each falling back to `—`) with a plain empty state when none are visible. `studentProfileId` is used only as the React `key`, never rendered as text; no application-user id is shown. The page adds no authorization/filtering of its own — RLS + the Group 3 helper's own verified-officer guard remain the sole boundary; no direct query to `profile_visibility_settings` or any counselor table; no derived visibility indicator or hidden-profile count (a single generic empty state, no oracle); no admissions write path, search, ranking, filters, or shortlists. `requireRouteAccess('/admissions/dashboard')` stays the first operation, the page stays `force-dynamic`, and the existing logout action is unchanged. No separate presentational component was created — the list is kept inline, judged the appropriately minimal choice by both reviewers. Both security and architecture reviews PASSED with no required fixes. **No `/admissions/students/[id]` detail route exists yet** — this list deliberately renders no link to it (Group 6 owns that route). Full record in `progress-tracker.md` § "Batch 5 Group 5".

**Group 6 — admissions read-only student profile view: COMPLETE, COMMITTED (`5bd32959` "Add Batch 5 Group 6 admissions read-only student profile view"), independent security re-review PASSED, independent architecture re-review PASSED (both: no required fixes).** New route `/admissions/students/[id]` renders ONE effectively-visible student's Batch 2 profile aggregate READ-ONLY via the frozen Group 3 helper `getAdmissionsVisibleStudentProfileReadOnly(id)`, reusing `requireRouteAccess('/admissions/dashboard')` as the first operation (no route-policy change). Mirrors the Batch 3 Group 6 counselor read-only detail pattern while deliberately omitting all Batch 4 counselor-review-specific behavior (no feedback form, no review-queue lookup). A null/no-profile result renders exactly ONE generic "This student profile is not available." state for every non-visible case (nonexistent, foreign, hidden, unpublished, consent-withdrawn, suspended-owner, malformed id) — no oracle. Renders derived completion, profile overview, full academic background/activities/achievements lists, and all three narrative fields as plain escaped JSX; no forms, server actions, mutation controls, or counselor/review data. `app/admissions/dashboard/page.tsx` was extended with one "View profile" link per visible-student row (`studentProfileId` used only as the route segment, never rendered as text); the existing guard, logout form, four summary fields, empty state, and no-filter/no-search behavior are all preserved. `lib/admissions-discovery/*`, `lib/auth/route-policies.ts`, and the migration are unchanged. `tsc`/`lint`/`build`/`git diff --check` all clean; `/admissions/students/[id]` builds as `ƒ (Dynamic)`. This was the last implementation group before Group 7.

**Group 7 — final batch review + closure: COMPLETE. Batch 5 is CLOSED, APPROVED FOR PROTOTYPE USE (independent review, 2026-07-12, no blocking findings).** A batch-wide review across the full Batch 5 surface (migration, `lib/admissions-discovery/*`, all Group 4–6 app files, the frozen Group 1 diagrams, and a cross-batch regression sweep) confirmed: exactly one new stored concept (`profile_visibility_settings`); effective visibility evaluated at query time as `is_published AND admissions_consent AND active-student owner` (R1), never stored; R2 (unforced first-publish flags) and R3 (column-level UPDATE hardening) implemented as ratified; admissions is SELECT-only end to end with zero write path, zero direct access to `profile_visibility_settings`, and zero policies of any kind on any counselor/review/feedback table; zero service-role anywhere in the batch; every Batch 5 commit touches only Batch 5 files, with `lib/student-profile/*`, `lib/counselor-link/*`, `lib/counselor-review/*`, and `lib/auth/route-policies.ts` all untouched. **All 11 mandatory Batch 5 runtime gates remain DEFERRED** (gate 11 is N/A — no filters shipped) — see `progress-tracker.md` § "Batch 5 Group 7" for the full gate-by-gate list; do not conflate the completed schema/RLS-layer checks (hosted migration apply, local `db reset`/`db lint`, the 45/45 local adversarial RLS test) with these still-deferred hosted UI/runtime gates. **Before any Batch 6 feature implementation, run at minimum the hosted headline flow (publish → discover → open detail → withdraw) plus the pending/suspended admissions-officer boundary check; Batch 6 planning/diagrams may begin first.** **Update: this specific hosted headline pass has since been run and confirmed on hosted development** (see `progress-tracker.md` § "Batch 6 Group 2 Prerequisite" for the exact confirmed results) — this satisfies the Batch 6 Group 2 runtime prerequisite specifically; it does NOT mean all 11 mandatory Batch 5 runtime gates above are now complete, and the broader deferred checks remain open exactly as recorded. Non-blocking: the `/student/profile` "not shared with anyone in this batch" copy is now stale given the visibility controls on the same page — carried forward as a still-unimplemented standalone Batch 6 "G0" housekeeping task, not a closure blocker. Batch 6 direction (SELECTED): Admissions Shortlists (`Shortlist`/`ShortlistEntry`) as the first admissions WRITE surface — Group 1 (charter + all five diagrams) is complete, committed, and passed a final independent packet review with a GO verdict; see `progress-tracker.md` §§ "Batch 5 Group 7" / "Batch 6 Group 1" / "Batch 6 Group 2 Prerequisite".

## Historical Next-Step Log

The entries in this section are retained as a chronological record; later entries supersede earlier ones.

**Batch 5 is CLOSED (Group 7 final batch review passed, independent review, 2026-07-12, no blocking findings; approved for prototype use).** All seven groups are complete: 1 (diagrams/object context), 2 (schema + RLS migration, applied to the hosted development Supabase project after passing both independent review design reviews), 3 (TypeScript types + server helpers, both reviews passed), 4 (student visibility-controls UI/actions, both reviews passed), 5 (admissions discovery dashboard UI, both reviews passed), 6 (admissions read-only student profile view at `/admissions/students/[id]`, `5bd32959`, both independent reviews passed), and 7 (final batch review + closure). Admissions officers can now list and open visible student profiles read-only.

**Batch 6 — Admissions Shortlists is the SELECTED next-batch direction.** **Group 1 — diagrams + object context: COMPLETE, COMMITTED.** Group 1a (README charter/handoff, `0d12f936`, at `recruitbook-diagrams/diagrams/slices/batch-6-admissions-shortlists/README.md`) was approved by an in-session independent review planning GO verdict and passed both an independent security review (APPROVE, no required corrections) and an independent architecture review (APPROVE, no required fixes). All five diagrams were then produced and reviewed one at a time and are committed: Group 1b use-case (`f8d8a1a3`), Group 1c domain subset (`3cfbaa6a`), Group 1d misuse-case (`34f3aa6d`), Group 1e activity (`70756ce0`), and Group 1f entry-visibility decision (`e17b6552`), each with matching additive master-catalog refinements. **A final independent review across the complete Group 1 packet (charter + all five diagrams + catalog refinements) returned GO.** Group 1 remains planning/context only — **no Batch 6 schema, migration, TypeScript helper, server action, page, control, or catalog entry exists as implemented code.** Admissions officers still have zero write access to anything today, exactly as at the end of Batch 5. **Current active milestone: Batch 6 Group 2 — schema + RLS**, which requires, before any migration is written: (1) the hosted Batch 5 runtime pass (publish → discover → open detail → withdraw, plus the pending/suspended admissions-officer boundary check) — **CONFIRMED on hosted development** (see `progress-tracker.md` § "Batch 6 Group 2 Prerequisite" for the exact results); and (2) the mandatory pre-migration schema and RLS design ratification — **not yet performed (the sole remaining prerequisite)**. Full detail in `progress-tracker.md` § "Batch 6 Group 1" / § "Batch 6 Group 2 Prerequisite".

**Update (2026-07-19): both Batch 6 Group 2 prerequisites are now satisfied and Group 2 itself is COMPLETE.** The pre-migration ratification was obtained and the migration was written; an empirically-discovered Postgres RLS behavior (SELECT-policy visibility is implicitly ANDed into DELETE row-targeting) then required a ratified design amendment replacing the original direct DELETE policy with a hardened `SECURITY DEFINER` removal RPC (`public.remove_own_admissions_shortlist_entry(uuid)`) plus a privilege-layer DELETE revoke. The amended migration and its adversarial RLS test suite have since passed local `db reset`/`db lint`, the full adversarial suite (62/62), an independent security review (APPROVE), an independent architecture review (APPROVE), and the mandatory post-migration review (GO). **Group 2 is COMMITTED (`dcd5bbaf` "Add Batch 6 admissions shortlists schema and RLS"). Hosted migration apply remains a separate, later, explicitly-authorized step — not yet performed.** Batch 6 Group 3 (TypeScript types, validation, and server-side shortlist helpers) is next. Full record in `progress-tracker.md` § "Batch 6 Group 2".

**Update: Batch 6 Group 3 is now COMPLETE and COMMITTED (`c05a33aa` "Add Batch 6 Group 3 TypeScript types + server helpers").** `lib/admissions-shortlist/{types,validation,queries}.ts` exports `saveAdmissionsShortlistEntry`, `listMyAdmissionsShortlist`, and `removeAdmissionsShortlistEntry` — pure types/validation plus a server-only authenticated-client data layer, RLS-backed ownership/visibility, idempotent save, RPC-only removal, fixed generic no-oracle results, zero service-role usage. `tsc`/lint/build/`git diff --check` all clean; independent security review APPROVE; independent architecture review APPROVE (both: no required corrections). No UI, routes, server actions, runtime UI verification, or hosted migration application exist yet. **Batch 6 Group 4 is next.** Full record in `progress-tracker.md` § "Batch 6 Group 3".

**Update: Batch 6 Group 4 is now COMPLETE and COMMITTED (`649d58ab` "Add Batch 6 Group 4 save action + the Save to Shortlist control").** `app/admissions/students/[id]/page.tsx` (modified) plus new colocated files `app/admissions/students/[id]/actions.ts` and `app/admissions/students/[id]/save-shortlist-form.tsx` add a "Save to shortlist" control to the existing read-only detail page, rendered only for a successfully loaded visible profile; the server action independently re-verifies the verified admissions officer, treats the profile id as a lookup key only, and delegates entirely to the Group 3 helper `saveAdmissionsShortlistEntry(...)` with its fixed safe results (including idempotent duplicate-save) preserved unchanged — no Supabase/service-role code in the action or form, no profile pre-read, no client-side visibility check. The existing generic unavailable state, route-guard reuse, `force-dynamic`, and read-only rendering are preserved. `tsc`/lint/build/`git diff --check` all clean; independent security review APPROVE; independent architecture review APPROVE (both: no required corrections). No dashboard saved-students list, remove control, runtime UI verification, or hosted migration application occurred in Group 4. **Batch 6 Group 5 — dashboard "Saved students" section plus remove control — is next.** Full record in `progress-tracker.md` § "Batch 6 Group 4".

**Update: Batch 6 Group 5 is now COMPLETE and COMMITTED (`97320cc1` "Add Batch 6 Group 5 dashboard Saved students section + remove control on admissions dashboard").** `app/admissions/dashboard/page.tsx` (modified) plus new colocated files `app/admissions/dashboard/actions.ts` and `app/admissions/dashboard/remove-shortlist-form.tsx` add a "Saved students" section to the existing dashboard, rendering only currently-effectively-visible saved profiles via `listMyAdmissionsShortlist()` — the four approved summary fields, a reused "View profile" link to the existing detail route, and a remove control per row. Hidden/withdrawn/suspended-owner/foreign/nonexistent profiles are silently absent, no stale placeholder or count. The remove action independently re-verifies the verified admissions officer, treats the entry id as a lookup key only, delegates entirely to `removeAdmissionsShortlistEntry(...)` (RPC-only), and revalidates only `/admissions/dashboard` on success. The existing discovery list remains free of any Save control. `tsc`/lint/build/`git diff --check` all clean; independent security review APPROVE; independent architecture review APPROVE (both: no required corrections; two non-blocking observations recorded — deliberate JSX duplication left as-is under Minimal-Diff, and the "View profile" link confirmed intentional). **Batch 6 runtime gates remain unexecuted and hosted migration application has not occurred.** **Batch 6 Group 6 — final batch review, tracker update, and Batch 7 handoff — is next.** Full record in `progress-tracker.md` § "Batch 6 Group 5".

**Update: hosted migration application and all 11 mandatory Batch 6 runtime gates are now confirmed on hosted development, and the deferred Batch 6 documentation sync is complete** (Group 1 README/diagrams' DELETE-mechanism corrections, the actor-matrix/method-catalog/misuse-catalog `ShortlistEntry.remove` wording, `architecture-decisions.md`'s Batch 6 section converted from planning to implemented/closed status, this file, `progress-tracker.md`, and a new Durable RLS Patterns bullet added to `architecture-decisions.md` and `coding-standards.md`). **Update: the independent final batch-wide closure review returned GO — Batch 6 — Admissions Shortlists is formally CLOSED, approved for prototype use** (documentation-sync commit `7a6e0286`). Full record in `progress-tracker.md` § "Batch 6 Group 6 — Closure". The pre-existing Batch 2–5 deferred runtime backlog and the standalone "G0" task remain deferred, not absorbed by this closure.

**Update: Batch 7 (UI Foundation & Prototype-Path Polish) is now SELECTED and underway.** Group 1 — UI Foundation is COMPLETE and COMMITTED (`c6aa6b3a`); Group 2 — Student Core is COMPLETE and COMMITTED (`63b618ba`); Group 3 — Counselor Connection Surfaces is COMPLETE and COMMITTED (`f1088962` "Add Batch 7 Group 3 Counselor Connection Surfaces"); Group 4 — Admissions Surfaces is COMPLETE and COMMITTED (`4444d1d4` "Add Batch 7 Group 4 Admissions Surfaces"); Group 5 — Auth and Entry Surfaces is COMPLETE and COMMITTED (`53b91171` "Add Batch 7 Group 5 Auth and Entry Surfaces"); Group 6 — Admin + Pending Surfaces is COMPLETE and COMMITTED (`5707063d` "Add Batch 7 Group 6 Admin and pending-account surface restyling"); all six passed independent security review (Group 6's ran twice, independently, with identical conclusions) and independent architecture/accessibility review (Group 6: APPROVE WITH NOTES — one non-blocking observation, no required correction) with no required corrections. **All six Batch 7 implementation groups are complete, and the independent final batch-wide closure review has since returned GO (no required corrections): Batch 7 — UI Foundation & Prototype-Path Polish is formally CLOSED, approved for prototype use.** Full record in `progress-tracker.md` § "Batch 7 — UI Foundation & Prototype-Path Polish".

**Update: Batch 8 — Admissions Discovery Filters is now SELECTED and underway**, driven by a scheduled **admissions-officer prototype presentation** — the priority shifted from further UI expansion to a small, credible functional increment on the existing admissions discovery workflow: verified admissions officers can narrow the visible-student list by country and intended major. No schema, RLS, migration, new route, server action, or Batch 7 design-system change is in scope. **Group 1 — filter contract ratification: COMPLETE (independent review, GO).** A one-page normative contract fixes the two filter fields, case-insensitive-substring/AND semantics, per-field 100-character normalization, silent degrade-to-absent on invalid/array/empty/over-limit input, the exact backslash→percent→underscore ILIKE-escape order, and the no-oracle reasoning (filters may only subtract from the already RLS-visible set). No diagrams were required — this is a query refinement introducing no new domain object, state machine, actor relationship, route, or cross-role workflow. **Group 2 — helper + validation extension: COMPLETE and COMMITTED (`021bafff` "Add Batch 8 Group 2 Admissions Discovery Filters: helper and validation extension").** `lib/admissions-discovery/{types,validation,queries}.ts` add `AdmissionsDiscoveryFilters`, `normalizeAdmissionsDiscoveryFilters(...)`, and `escapeLikePattern(...)`; `listAdmissionsVisibleStudents(filters?)` appends `.ilike(...)` predicates to the same existing RLS-governed query builder (guard, columns, ordering, no-cap, and `error || !data → []` behavior all unchanged) — existing zero-argument callers remain valid. `npx tsc --noEmit`/`npm run lint`/`npm run build`/`git diff --check` all clean; independent security review: APPROVE, no required corrections; independent architecture/accessibility review: APPROVE WITH NOTES, no required corrections. Three informational, non-blocking notes carried forward rather than reopened as Group 2 corrections: (1) add a literal `*` wildcard-input case to the Group 4 hosted runtime matrix, since PostgREST may translate it within an ILIKE pattern; (2) Group 3 must explicitly call `normalizeAdmissionsDiscoveryFilters(...)` before invoking the query helper, since the helper itself only escapes and does not re-normalize; (3) the demo data must populate both `country` and `intended_major` on every synthetic student, since a NULL value is naturally excluded once its field's filter is active. No migration exists in this batch and no hosted apply is required for Group 2. **Group 3 — admissions dashboard filter UI: COMPLETE and COMMITTED (`f6954f67` "Add Batch 8 Group 3 Admissions Discovery Filters dashboard UI").** Modified exactly `app/admissions/dashboard/page.tsx`: a native `method="get"` filter form (labeled `country`/`major` inputs using the existing `labelClasses`/`inputClasses` pattern, byte-identical to ~10 other already-approved files), `searchParams` awaited and passed through `normalizeAdmissionsDiscoveryFilters(...)` before the single existing `Promise.all` call to `listAdmissionsVisibleStudents(filters)` (alongside the unchanged `listMyAdmissionsShortlist()`), a normalized applied-filter echo, a `students.length`-derived visible-result count, the fixed filtered-empty message ("No visible student profiles match these filters.") alongside the byte-identical unfiltered-empty text, and a clear-filters link to bare `/admissions/dashboard`. Preserved exactly: `requireRouteAccess('/admissions/dashboard')` as the literal first operation, `force-dynamic`, the Saved-students section, remove-shortlist action/form wiring, logout form, detail links and lookup-key behavior, and all existing accessibility/alert-status semantics. No `'use client'`, server action, new component file, schema/RLS/route change, or Batch 7 design-system deviation. `npx tsc --noEmit`/`npm run lint`/`npm run build`/`git diff --check` all clean (CRLF notice only). **Review gates:** Group 1 independent review filter-contract ratification GO; Group 2 independent security review: APPROVE, no required corrections; Group 2 independent architecture/accessibility review: APPROVE WITH NOTES, no required corrections; **Group 3 independent security review: APPROVE, no required corrections; Group 3 independent architecture/accessibility review: APPROVE WITH NOTES, no required corrections.** Three non-blocking Group 3 architecture notes carried forward, not reopened as corrections: (N1) the page's pre-existing header comment stating it "does not filter" is now ambiguous given it forwards normalized filter parameters — a documentation-accuracy follow-up, not a blocker; (N2) the filter inputs wrap correctly at ~360px but their auto-width presentation could be tidier in a future polish pass; (N3) the visible-result count renders even for an unfiltered empty list — contract-compliant and truthful, optionally gate-able in future polish. **Group 4 — hosted runtime verification: COMPLETE, confirmed on hosted development.** No code, migration, hosted schema apply, or route change was required or made for Group 4 — this was verification-only against the already-committed Group 2/3 work. The full hosted runtime matrix passed: the unfiltered list reproduces pre-Batch-8 behavior; country and intended-major filtering both support case-insensitive substring matching; the two combine with AND semantics; a valid zero-match filter renders exactly "No visible student profiles match these filters."; `%`, `_`, and `\` behave as literal filter characters; whitespace-only input normalizes to an absent filter (unfiltered list, no applied-filter line); repeated parameters (`?country=a&country=b`) are ignored, producing the unfiltered list with no error; a 101-character value is ignored (input returns empty, no applied-filter line, no error); `<script>alert(1)</script>` used as a filter value renders as literal escaped text; hidden, unpublished, consent-withdrawn, and suspended-owner profiles remain absent under every filter combination; withdrawing admissions visibility during an active filtered session and refreshing removes the row immediately; the rendered discovery-row count exactly equals the displayed count; stale/foreign detail ids retain the existing generic unavailable/not-found behavior; and no raw database or Supabase error appeared anywhere in the tested UI flow. **One informational finding was confirmed at runtime, not a blocker:** a literal `*` filter value was observed to broaden matching to the full RLS-visible set under current PostgREST/ILIKE behavior — this does not expose any hidden or unauthorized profile, does not create an oracle (the result set is still bounded by RLS), and is not a required correction; it remains a possible future micro-change to `escapeLikePattern`, carried forward exactly as the Group 2/3 reviews anticipated. Browser autofill behavior on the country input was observed and recorded as a non-blocking UI note. **No unresolved security, privacy, no-oracle, XSS, or raw-error finding remains for this batch's scoped filter work.** All prior review verdicts stand unchanged and unreopened: Group 2 security review: APPROVE; Group 2 architecture/accessibility review: APPROVE WITH NOTES; Group 3 security review: APPROVE; Group 3 architecture/accessibility review: APPROVE WITH NOTES, including N1 (the "does not filter" header comment — still a documentation-accuracy follow-up, not a code blocker), N2 (filter-input width distribution — future polish only), and N3 (the count rendering for an unfiltered empty list — truthful and contract-compliant). **Group 5 — documentation synchronization and admissions-officer demo preparation: COMPLETE.** Both status records and a rehearsal script at `docs/implementation/batch-8-admissions-discovery-filters-demo-script.md` (purpose, preconditions, walkthrough, narration guidance, feedback prompts, project-owner rehearsal checklist) were added. **Update: The project owner has explicitly completed the admissions-officer rehearsal** — the full demo storyline (sign-in, visible-student discovery, country filtering, intended-major filtering, combined filtering, read-only profile detail, shortlist save/remove, the visibility-withdrawal-and-refresh moment, and feedback-prompt/fallback-walkthrough readiness) was exercised against hosted development with synthetic data only; no rehearsal issue was reported. **Batch 8 is NOT yet formally closed** — no documented independent review final batch-wide closure `GO` exists for this batch (only the earlier, narrower Group 1 filter-contract ratification GO); rehearsal completion does not substitute for that review. **The only remaining closure gate, and the immediate next step, is the independent final batch-wide closure review for Batch 8.** Full record in `progress-tracker.md` § "Batch 8 — Admissions Discovery Filters".

**Carried-forward deferred item from Batch 2 (non-blocking, recorded truthfully — not the active milestone):** Batch 2 is functionally complete and passed its final security + architecture reviews; the one still-open item is a **runtime verification, not a code blocker** — explicitly confirm the adversarial cross-student row-id denial for Group 5 (`academic_background_id`) and Group 6 (`activity_id` / `achievement_id`), or record it as a deliberately accepted deferred risk, then mark Batch 2 CLOSED.

**Batch 3 is CLOSED and COMMITTED (`60d71226`).** The still-open runtime verifications survive closure as recorded deferred items, not blockers: the **Batch 3 Group 5-specific live gates** — wrong-email accept → zero rows/generic; stale/repeated accept & decline → generic; pending/suspended counselor sees no requests/roster; counselor-existence enumeration blocked — plus the **RLS-level student self-accept** adversarial test (route-guard denial was verified in the Group 6 pass; a crafted direct-API self-accept was not).

**Batch 4 is CLOSED** (Group 7 final batch review passed, independent review, no blockers; approved for prototype use). Groups 1–6 are committed (`7979da85`, `2c1d949c`, `e9c36eec`, `e922a9de`, `aaefcb9d`; Group 6 needed no implementation commit — its surface shipped in `e922a9de`); the Group 2 migration is applied to hosted dev Supabase; every group passed its required reviews with no unresolved fixes. The Group 7 doc updates in the working tree are the closure commit for the project owner.

**Runtime status (recorded truthfully): The project owner has completed the hosted end-to-end runtime pass** — request → queue → decline/complete with feedback → student reads feedback → withdraw → revoke-and-confirm-counselor-loses-everything. This confirms the headline functional flow and the revoke-then-review-removes-access-immediately gate. **Still open (mandatory deferred runtime items, not code blockers, not part of the pass performed):** unlinked counselor sees/writes nothing; cross-counselor write blocked; pending/suspended counselor sees nothing; admissions zero access; student forgery/self-complete blocked at the RLS level (crafted direct-API attempt); stale/foreign/terminal ids → one generic message; student read survives revocation (not exercised — the read in the pass happened before the revoke step); profile-table write regression; no raw DB errors; HTML-like feedback renders as literal escaped text. Consolidated list in `progress-tracker.md` § "Batch 4 Group 7". (The RLS layer itself was behaviorally verified 16/16 locally at Group 2 — the remaining debt is the crafted/adversarial end-to-end checks, not the RLS design.)

**Batch 5 — Admissions Discovery: COMPLETE and CLOSED (all seven groups).** Group 1 (diagrams/object context, `22eb7d21`, preceded by `81ca69d2`), Group 2 (schema + RLS migration, `4451e416`, `supabase/migrations/20260711_000001_batch5_admissions_discovery_schema.sql`), Group 3 (TypeScript types + server helpers, `8dd17b15`, `lib/admissions-discovery/{types,validation,queries}.ts`), Group 4 (student visibility-controls UI/actions, `6f6ec133`, `app/student/profile/visibility-settings-form.tsx` + `saveVisibilitySettingsAction`), Group 5 (admissions discovery dashboard UI, `8ef970a5`, `app/admissions/dashboard/page.tsx` wrapping `listAdmissionsVisibleStudents()`), Group 6 (admissions read-only student profile view, `5bd32959`, `app/admissions/students/[id]/page.tsx` wrapping `getAdmissionsVisibleStudentProfileReadOnly()`, plus a dashboard link), and Group 7 (final batch review, independent review, 2026-07-12, no blocking findings — approved for prototype closure) are all done — Group 2 passed both the independent pre- and post-migration review design reviews and is applied to the hosted development Supabase project; Groups 3, 4, 5, and 6 each passed independent security and architecture review with no required fixes. Batch 5 introduced the first admissions-officer access of any kind (previously: zero policies on every table); the database and helper layers enforce and wrap that access, a student can toggle their own visibility flags, and a verified admissions officer can both see a list of visible profiles' minimal summary fields AND open a read-only detail view of one. **All 11 mandatory Batch 5 runtime gates remain DEFERRED, not executed** (gate 11 is N/A — no filters shipped): verified/pending/suspended admissions-officer access boundaries, missing-settings-row/unpublished/consent-false exclusion, immediate withdrawal, guessed/foreign/hidden-id generic response, no count/filter oracle, admissions zero counselor-data/write access at runtime, cross-student settings protection, suspended-owner behavior at runtime, the full hosted publish→discover→withdraw flow, and HTML-escaping — these are hosted UI/runtime checks distinct from the ALREADY-COMPLETED schema/RLS-layer verification (hosted migration apply, local `db reset`/`db lint`, the 45/45 local adversarial RLS test). **The hosted headline flow (publish → discover → open detail → withdraw) plus the pending/suspended admissions-officer boundary check required before Batch 6 Group 2 or any later feature implementation has now been run and confirmed on hosted development** — see `progress-tracker.md` § "Batch 6 Group 2 Prerequisite" for the exact confirmed results. This satisfies the specific Batch 6 Group 2 runtime prerequisite; it does not mean all 11 mandatory Batch 5 runtime gates listed above are complete — the broader deferred checks (missing-settings/unpublished paths not exercised in this pass, guessed-id variants, count/oracle behavior, counselor-data boundaries, crafted cross-student/API cases, suspended-student-owner behavior, HTML-escaping) remain open exactly as recorded; gate 11 remains N/A. Batch 6 Group 1 planning/diagrams have already completed independently of that pass: the charter (1a) and all five diagrams (1b–1f) are committed and passed a final independent packet review with a GO verdict. Batch 6 direction (SELECTED): Admissions Shortlists (`Shortlist`/`ShortlistEntry`) as the first admissions WRITE surface — Group 2 (schema + RLS) is next, gated only on the mandatory pre-migration ratification (the sole remaining prerequisite). See `recruitbook-diagrams/diagrams/slices/batch-5-admissions-discovery/README.md` and `progress-tracker.md` §§ "Batch 5 Group 1" / "Batch 5 Group 2" / "Batch 5 Group 3" / "Batch 5 Group 4" / "Batch 5 Group 5" / "Batch 5 Group 6" / "Batch 5 Group 7" / "Batch 6 Group 1" / "Batch 6 Group 2 Prerequisite" for the completion and closure records.

Batch 2 remains functionally complete and review-approved; its one still-open item is a runtime verification (adversarial cross-student row-id denial for Group 5/Group 6), to be confirmed or recorded as an accepted deferred risk before marking Batch 2 formally CLOSED.

## Completed Milestone

### Batch 1 — Authentication, Role Identity, and Protected Routing

Status:

**Complete, committed, and approved after security/architecture review.**

Batch 1 established authentication, role identity, account status, protected routing, admin approval, logout, and password reset.

Completed Batch 1 groups:

1. **Group 1 — Auth types, route-policy constants, and Supabase helpers**
   - Added shared auth types.
   - Added route-policy constants.
   - Added Supabase browser/server/admin helper structure.

2. **Group 2 — Protected route skeletons and role-specific dashboard placeholders**
   - Added protected route placeholders for student, counselor, admissions officer, and platform admin roles.
   - Added unauthorized route.
   - Established protected route guard behavior.

3. **Group 3 — Public sign-up flow**
   - Added public registration for student, counselor, and admissions officer.
   - Prevented public `platform_admin` registration.
   - Created `application_users` rows after Supabase Auth sign-up.
   - Used service role only for the server-side `application_users` insert.

4. **Group 4 — Login flow and lazy email-verification promotion**
   - Added Supabase Auth login.
   - Used `application_users.role` and `application_users.account_status` as the authorization source of truth.
   - Added lazy promotion after confirmed email ownership.
   - Hardened promotion with current-state compare-and-swap behavior.

5. **Group 5 — Logout/session handling**
   - Added server-side logout action.
   - Used normal cookie-aware Supabase server client.
   - Redirects to a fixed login route.
   - No service-role usage.

6. **Group 6 — Admin approval and suspension**
   - Added minimal `platform_admin` approval and suspension workflow.
   - Admin actions independently re-check `platform_admin + active`.
   - Approval and suspension use authenticated server client and RLS for authoritative writes.
   - Service role is used only for non-authoritative `audit_log_entries` inserts.
   - Denial action is deferred.

7. **Group 7 — Password reset flow**
   - Added Supabase-managed forgot-password and reset-password flow.
   - Avoids email enumeration.
   - Does not use service role.
   - Does not read or write `application_users`.
   - Keeps credential recovery separate from RecruitBook authorization.

## Batch 1 Frozen Artifacts

Batch 1 diagrams:

- `diagrams/slices/batch-1-authentication/01_auth_use_case.puml`
- `diagrams/slices/batch-1-authentication/02_auth_misuse_case.puml`
- `diagrams/slices/batch-1-authentication/03_auth_activity.puml`
- `diagrams/slices/batch-1-authentication/04_auth_sequence.puml`
- `diagrams/slices/batch-1-authentication/05_auth_state_machine.puml`
- `diagrams/slices/batch-1-authentication/06_auth_system_context.puml`
- `diagrams/slices/batch-1-authentication/07_auth_domain_subset.puml`
- `diagrams/slices/batch-1-authentication/README.md`

Batch 1 implementation artifacts:

- `supabase/migrations/20260629_000001_batch1_auth_schema.sql`
- `docs/implementation/batch-1-auth-schema-notes.md`
- `lib/auth/*`
- `lib/supabase/*`
- `app/sign-up/*`
- `app/login/*`
- `app/logout/*`
- `app/forgot-password/*`
- `app/reset-password/*`
- `app/auth/callback/route.ts`
- `app/admin/*`
- role-specific protected dashboard routes

## Core Authentication and Authorization Model

Supabase Auth handles:

- user identity
- email/password authentication
- sessions
- password reset
- email verification
- recovery links

RecruitBook handles:

- application roles
- account status
- approval state
- suspension state
- protected route access

A valid Supabase session is required, but it is not sufficient for dashboard access.

RecruitBook authorization is based on:

- `application_users.role`
- `application_users.account_status`

Credential management and application authorization are intentionally separate.

## User Roles

Valid roles are:

- `student`
- `counselor`
- `admissions_officer`
- `platform_admin`

Public registration may only create:

- `student`
- `counselor`
- `admissions_officer`

Public registration must never create:

- `platform_admin`

Platform administrator accounts are manually provisioned or assigned outside public registration.

## Account Statuses

Valid account statuses are:

- `email_unverified`
- `active`
- `pending_approval`
- `verified`
- `suspended`

`unauthorized` is not an account status.

Unauthorized access is a route/access outcome, not a stored database state.

## Current Route Policy

The current route policy is:

| Role | Status | Route |
|---|---|---|
| `student` | `active` | `/student/dashboard` |
| `counselor` | `pending_approval` | `/counselor/pending` |
| `counselor` | `verified` | `/counselor/dashboard` |
| `admissions_officer` | `pending_approval` | `/admissions/pending` |
| `admissions_officer` | `verified` | `/admissions/dashboard` |
| `platform_admin` | `active` | `/admin/dashboard` |

Suspended users should route to:

- `/unauthorized`

Unauthenticated users should route to:

- `/login`

## Batch 1 Database Objects

The Batch 1 database schema includes:

- `public.application_users`
- `public.approval_decisions`
- `public.audit_log_entries`
- `public.protected_route_policies`

The schema includes these enums:

- `public.user_role`
- `public.account_status`
- `public.approval_decision_type`
- `public.audit_action`

## Batch 1 Final Review Notes

Final Batch 1 review approved the authentication, role identity, and protected routing slice for prototype use.

Prototype-acceptable risks and deferred hardening items:

- Public auth endpoints do not yet include production rate limiting or CAPTCHA.
- Sign-up can leave an orphaned Supabase auth user if `application_users` insertion fails after auth creation.
- Admin approval/suspension writes are not atomic across `approval_decisions`, `application_users`, and `audit_log_entries`.
- Concurrent admin approvals can create duplicate `approval_decisions` rows before one status compare-and-swap update wins.
- Audit completeness is not guaranteed if an audit insert fails after the authoritative state change.
- Suspended users may retain existing Supabase sessions, but protected route guards deny access based on `application_users`.
- Password reset currently uses a basic password length floor only.
- Development password-reset redirect construction may fall back to request origin headers. Production should use `NEXT_PUBLIC_SITE_URL`.

Cross-group notes:

- Password-reset recovery can confirm email ownership in Supabase. This means a user who completes password recovery may later trigger the same lazy login promotion as a user who clicked the verification email. This is intentional because both flows prove control of the same inbox.
- Suspended users may complete password reset because credential recovery is handled by Supabase Auth and does not depend on `application_users`. This is intentional: credential management is separate from RecruitBook authorization, and suspended users still fail protected route guards.
- `protected_route_policies` is currently seeded in the database, but the application uses TypeScript route-policy constants. For Batch 1, the TypeScript constants are the app-layer source of truth. Before Batch 2 route expansion, decide whether to keep TypeScript constants canonical or read policies from the database.
- Rate limiting/CAPTCHA should be planned before production for sign-up, login, forgot-password, reset-password, and admin actions.

## Batch 2 Frozen Scope

### Batch 2 — Student Profile Foundation

Goal:

Allow an authenticated active student to create, edit, and view the core parts of their RecruitBook profile.

Batch 2 creates student-owned profile data. It does not create counselor review, admissions discovery, or profile publishing.

## Batch 2 In Scope

Batch 2 includes:

- Student profile overview.
- Basic student profile information.
- Academic background.
- Activities.
- Achievements.
- Fixed student-authored narrative fields.
- Derived profile completion indicator.
- Owner-only RLS for student profile data.
- Platform admin read-only visibility at the RLS level.

## Batch 2 Out of Scope

Batch 2 does not include:

- Stored profile status.
- Submission workflow.
- Counselor review.
- Counselor-student linking or invitations.
- Admissions officer search/discovery.
- University-facing profile views.
- Profile publishing or sharing.
- AI contextualization.
- Transcript or file uploads.
- Profile photos.
- Messaging or notifications.
- Markdown/rich-text rendering.
- Counselor access to student profile data.
- Admissions officer access to student profile data.

## Batch 2 Hard Constraints

Batch 2 must follow these constraints:

- Completion is derived, not stored.
- No stored profile status in Batch 2.
- No counselor or admissions officer access to student profile data in Batch 2.
- No service-role usage in Batch 2.
- No file uploads.
- No AI contextualization.
- Narrative fields are plain text only.
- Do not use markdown or rich-text rendering.
- Do not use `dangerouslySetInnerHTML`.
- Student-owned writes must be protected by RLS and server-action reauthorization.
- Server actions must not trust client-supplied ownership, role, or status.
- IDs from forms are lookup keys only; authorization must be derived server-side and enforced by RLS.
- Do not use `unauthorized` as an account status.
- Do not redesign Batch 1 auth, route policy, or role model.

## Batch 2 Planned Groups

1. **Group 1 — Batch 2 diagrams and object context**
   - Create the student profile slice diagrams and README.
   - Keep diagrams lightweight and sliced from the existing master context where possible.
   - Recommended diagrams:
     - student profile use-case slice
     - student profile domain subset
     - student profile misuse-case slice
     - student profile activity slice
   - Do not create a stored-status state machine for Batch 2.

2. **Group 2 — Student profile schema and RLS migration**
   - Create the profile tables and RLS policies.
   - Decide and document the ownership-policy pattern.
   - Preferred direction: helper-based ownership policy, such as `is_profile_owner(profile_id)`.
   - Batch 2 should remain zero-service-role.
   - No counselor/admissions SELECT policies in Batch 2.
   - Platform admin may receive read-only SELECT visibility through RLS.

3. **Group 3 — Student profile types and server helpers**
   - Add profile TypeScript types.
   - Add server-side profile query/mutation helpers.
   - Keep helpers aligned with RLS and route guards.
   - Do not bypass RLS with the service role.

4. **Group 4 — Student dashboard profile overview**
   - Replace the placeholder student dashboard with a read-only profile overview.
   - Show derived completion.
   - Keep logout available.
   - Do not add full navigation or Batch 3/B4 features.

5. **Group 5 — Basic profile and academic form**
   - Add forms/actions for basic profile and academic background.
   - Server actions must re-check the current user.
   - Writes must be owner-scoped and RLS-protected.

6. **Group 6 — Activities and achievements CRUD**
   - Add student-owned CRUD for activities and achievements.
   - Keep row CRUD simple.
   - Use hard deletes for the prototype unless a later decision changes this.

7. **Group 7 — Student-authored narrative fields**
   - Add fixed plain-text narrative fields.
   - Use server-side length caps.
   - Render text through normal JSX escaping only.
   - No AI generation, no AI consent, no AI output in Batch 2.

8. **Group 8 — Batch 2 final review and tracker update**
   - Run security, architecture, and final review.
   - Record deferred risks and Batch 3 handoff notes.

## Likely Batch 2 Data Model Direction

The likely Batch 2 tables are:

- `student_profiles`
- `student_academic_records` or `academic_backgrounds`
- `profile_activities`
- `profile_achievements`

Fixed narrative fields may live directly on `student_profiles` for the prototype unless Group 2 intentionally decides otherwise.

Preferred RLS ownership pattern:

- Use a helper-based ownership policy, such as `is_profile_owner(profile_id)`.
- Avoid repeating large nested ownership subqueries in every policy.
- Avoid denormalizing `auth_user_id` into every child table unless intentionally chosen.

Expected RLS behavior:

- Student owners can create, read, update, and delete their own profile data.
- Platform admins may read profile data.
- Platform admins should not write profile content in Batch 2.
- Counselors have no student profile access in Batch 2.
- Admissions officers have no student profile access in Batch 2.
- Unauthenticated users have no student profile access.

## Batch 2 Security Priorities

Batch 2 must protect against:

- IDOR through forged profile IDs.
- Cross-student reads or edits.
- Draft profile leakage to future counselor/admissions users.
- Client-side role/status trust.
- Oversized narrative input.
- XSS through narrative rendering.
- Accidental service-role use.
- Premature counselor/admissions visibility.

Required controls:

- Owner-only RLS.
- Server-action reauthorization.
- Plain-text narrative fields.
- Length caps on free-text fields.
- JSX auto-escaped rendering.
- Zero service-role usage.
- Deny-by-default access for non-owner, non-admin users.

## Prototype-Acceptable Batch 2 Risks

These are acceptable for the prototype unless later revisited:

- Last-write-wins updates.
- No concurrent edit protection.
- No profile edit history.
- No profile versioning.
- Hard deletes for activities and achievements.
- Minimal field validation.
- No pagination for small profile lists.
- No profile-edit audit events.

## Production Hardening Later

Potential production hardening items include:

- Profile edit audit trail.
- Soft delete/history for profile content.
- Stronger field validation.
- Input moderation policy for narratives.
- Rate limiting for profile actions.
- Richer completion scoring.
- Submission/review state machine in Batch 3.
- Explicit counselor visibility model in Batch 3.
- Explicit admissions visibility model in Batch 4.

## Contributor Guidelines

When working on RecruitBook:

- Treat this file, `docs/project-context/progress-tracker.md`, `docs/project-context/architecture-decisions.md`, and `docs/project-context/coding-standards.md` as primary context.
- Treat frozen slice diagrams and migrations as authoritative for their batch.
- Do not redesign completed Batch 1 authentication unless explicitly instructed.
- Do not modify schema or migrations outside the current group’s scope.
- Do not use the service role in Batch 2.
- Do not add counselor/admissions profile visibility in Batch 2.
- Do not add AI contextualization in Batch 2.
- Do not add file uploads in Batch 2.
- Do not create new account statuses.
- Do not use `unauthorized` as a database status.
- Keep changes small and group-scoped.
- Run `npm run build` after implementation changes.
- Do not commit changes. the project owner will commit manually after review.
