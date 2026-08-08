# Batch 8 — Admissions Discovery Filters: August 14 Demo Script

Presentation-ready rehearsal script for the scheduled admissions-officer prototype meeting. This document does not itself certify rehearsal completion — the checklist in §6 is a **project-owner** rehearsal checklist.

**Update: The project owner has explicitly confirmed the rehearsal is complete.** The rehearsal covered: sign-in; visible-student discovery; country filtering; intended-major filtering; combined filtering; read-only profile detail; shortlist save/remove; the visibility-withdrawal-and-refresh moment; and feedback-prompt/fallback-walkthrough readiness — all against hosted development with synthetic data only. No rehearsal issue was reported. This note records what the project owner stated; the itemized checklist below is preserved as originally written and was not individually re-marked box-by-box, so it should be read as superseded by this completion note rather than as a literal per-item audit trail.

## 1. Purpose

- Demonstrate the admissions discovery workflow: listing effectively-visible student profiles, narrowing them by country and intended major, opening a read-only profile, and managing a shortlist.
- Collect informed feedback on usefulness, clarity, filtering needs, and workflow fit for a real admissions process.
- Avoid sales language and unsupported product claims. This is a working prototype demonstration, not a pitch — narrate what the product actually does, not what it might become.

## 2. Preconditions

- Hosted development environment (not production; there is no production environment).
- A verified `admissions_officer` account, `account_status = verified`.
- Synthetic (fictional) students only — **no production or real student data** anywhere in the demo dataset.
- Every demo student has `country` and `intended_major` populated (a NULL value on either field is silently excluded once that field's filter is active — this is correct RLS/query behavior, not a bug, but it will look like one mid-demo if data is missing).
- At least one visible student for each planned filter combination (a country-only match, a major-only match, and a combined-match student).
- One profile with narrative text containing characters that exercise the plain-text/escaping boundary safely (e.g. an ampersand, a quote, or a bracket in ordinary prose) — the goal is to show real student writing rendering correctly, not to inject anything adversarial live.
- No production or real student data anywhere in the session.

## 3. Walkthrough

1. Admissions officer signs in with their verified account.
2. Opens the visible-student discovery list (`/admissions/dashboard`).
3. Reviews the displayed result count above the list.
4. Filters by country (e.g. types a country name, submits).
5. Filters by intended major (clears the country filter or adjusts it, submits with just a major value).
6. Combines both filters (country + major together, submits).
7. Opens a read-only student profile from a filtered result (`/admissions/students/[id]`).
8. Saves that profile to the shortlist.
9. Returns to the dashboard and shows the Saved students section.
10. Removes a shortlist entry.
11. *(Optional, if time and audience interest allow)* Demonstrates withdrawal of admissions visibility for one student (via the student's own visibility settings, in a separate pre-staged session) and refreshes the admissions dashboard to show the profile disappear from the discovery list immediately.

## 4. Narration guidance

- Discovery is limited to profiles a student has **made visible** — say "visible" or "shared," not "published," since RecruitBook has no stored profile-publication status model; visibility is two independent student-controlled flags evaluated live, not a lifecycle state.
- Filters only **narrow the already-visible set** — they never reveal a profile the student hasn't chosen to share. This is the single most important trust point to land clearly.
- Do not imply ranking, messaging, automated guidance, file uploads, saved searches, or any student/counselor verification-tier system — none of these exist in the current prototype. If asked, say plainly that it isn't built yet, rather than describing it as coming soon.

## 5. Feedback prompts

Ask directly, and listen more than narrate:

- Which filters would be most useful in a real admissions workflow?
- Would you expect exact matching, substring matching, or standardized values (e.g. a country dropdown instead of free text)?
- What information would you want to see before opening a full profile?
- How would you use a shortlist in your actual process?
- What would make this workflow trustworthy and useful at larger student volumes (hundreds or thousands of profiles)?

## 6. Rehearsal checklist (project-owner — rehearsal confirmed complete; see completion note above)

This checklist was written for the project owner to execute before August 14. The project owner has since confirmed the rehearsal complete at the milestone level described in the completion note above. The itemized boxes below were not individually re-marked and remain as originally drafted — they document intended coverage, not a per-item sign-off log.

- [ ] Test account credentials sourced and handled privately (not pasted into any shared document or chat).
- [ ] Synthetic dataset prepared — fictional students only.
- [ ] Every intended demo student has `country` and `intended_major` populated.
- [ ] At least one student matches each planned filter combination (country-only, major-only, combined).
- [ ] Browser session is clean and predictable (no leftover form state, no stale login).
- [ ] Country-input browser autofill behavior checked in the actual demo browser — confirm it doesn't surprise the officer or you mid-flow.
- [ ] No raw errors, console errors, or unexpected UI failures appear across the full walkthrough.
- [ ] Displayed result count matches the number of rendered rows at every filter step.
- [ ] Filter → detail → shortlist-save → shortlist-remove path rehearsed at least once start to finish.
- [ ] The optional visibility-withdrawal-and-refresh moment rehearsed, if it will be shown.
- [ ] Demo starts and ends on known, predictable pages (e.g. start at login, end back at the dashboard).
- [ ] A backup no-filter walkthrough is ready in case live filtering behaves unexpectedly in front of the audience.
