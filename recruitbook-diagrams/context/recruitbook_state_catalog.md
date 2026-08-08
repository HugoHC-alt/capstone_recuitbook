# RecruitBook State Catalog

This file defines approved state models for RecruitBook objects, workflows, and security-sensitive transitions.

Use this file together with:

* `context/recruitbook_object_catalog.md`
* `context/recruitbook_relationship_catalog.md`
* `context/recruitbook_method_catalog.md`
* `context/recruitbook_actor_matrix.md`
* `context/use_case_summary.md`
* `context/security_rules.md`
* `context/recruitbook_misuse_catalog.md`
* `context/diagram_rules.md`
* `context/plantuml_style_guide.md`

---

# 1. State Catalog Purpose

The state catalog defines how important RecruitBook objects move through secure lifecycle states.

It is used to generate:

| Artifact                                     | State Catalog Role                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------ |
| `08_ai_contextualization_state_machine.puml` | Defines AI consent, generation, review, approval, visibility, and withdrawal states. |
| `11_student_profile_state_machine.puml`      | Defines student profile draft, publication, visibility, and blocked states.          |
| Activity diagrams                            | Provides decision states and blocked paths.                                          |
| Sequence diagrams                            | Provides success, failure, and alternate flows.                                      |
| Secure implementation prompts                | Gives AI explicit state rules and transition constraints.                            |

---

# 2. State Catalog Rules

| Rule ID      | Rule                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------- |
| `STATE-R-01` | Use exact object names from `recruitbook_object_catalog.md`.                                  |
| `STATE-R-02` | Use exact method signatures from `recruitbook_method_catalog.md`.                             |
| `STATE-R-03` | Do not create state transitions without an approved method or security rule.                  |
| `STATE-R-04` | Every security-sensitive state transition must identify a guard condition.                    |
| `STATE-R-05` | State names must be short and readable in PlantUML diagrams.                                  |
| `STATE-R-06` | Blocked, rejected, hidden, denied, and withdrawn states must be explicit.                     |
| `STATE-R-07` | AI output visibility must require both student acceptance and human approval.                 |
| `STATE-R-08` | Admissions visibility must require publication, visibility, consent, and authorization.       |
| `STATE-R-09` | Counselor access states must distinguish pending, verified, denied, and suspended counselors. |
| `STATE-R-10` | Saved shortlist states must recheck current access when opened.                               |

---

# 3. State Model Summary

| State Model ID | State Model                                | Primary Object                                                      | Primary Diagram                              |
| -------------- | ------------------------------------------ | ------------------------------------------------------------------- | -------------------------------------------- |
| `SM-1`         | User Account State Model                   | `UserAccount`                                                       | Authentication and registration flows        |
| `SM-2`         | Email Verification Token State Model       | `EmailVerificationToken`                                            | Registration sequence                        |
| `SM-3`         | Counselor Invitation State Model           | `CounselorInvitation`                                               | Counselor verification sequence              |
| `SM-4`         | Counselor Verification State Model         | `CounselorProfile`                                                  | Counselor verification sequence              |
| `SM-5`         | Student Profile State Model                | `StudentProfile`                                                    | `11_student_profile_state_machine.puml`      |
| `SM-6`         | Profile Visibility and Consent State Model | `ProfileVisibilitySettings`, `ConsentSettings`                      | Student profile and admissions access flows  |
| `SM-7`         | Verification Tier State Model              | `VerificationTier`                                                  | Student profile and transcript support flows |
| `SM-8`         | Transcript Support State Model             | `TranscriptSupportRequest`                                          | Transcript support activity                  |
| `SM-9`         | Uploaded File and Transcript State Model   | `UploadedFile`, `Transcript`                                        | Transcript support activity                  |
| `SM-10`        | AI Consent State Model                     | `AIConsentRecord`                                                   | AI contextualization state machine           |
| `SM-11`        | AI Contextualization State Model           | `AIContextualizationRequest`, `AIContextualizationOutput`           | `08_ai_contextualization_state_machine.puml` |
| `SM-12`        | Admissions Discovery State Model           | `StudentDiscoverySearch`, `AdmissionsProfileView`, `ShortlistEntry` | Admissions search sequence                   |
| `SM-13`        | Counselor Student Link State Model (Batch 3) | `CounselorStudentLink`                                            | `05_counselor_student_link_state_machine.puml` (Batch 3 slice); full model in Section 23 |
| `SM-14`        | Counselor Review Request State Model (Batch 4) | `CounselorReviewRequest`                                        | `05_counselor_review_request_state_machine.puml` (Batch 4 slice); full model in Section 24 |

---

# 4. State Naming Rules

| State Type     | Naming Pattern                  | Example                           |
| -------------- | ------------------------------- | --------------------------------- |
| Draft state    | Noun or adjective phrase        | `Draft`                           |
| Blocked state  | `Blocked` + reason              | `BlockedUnverifiedEmail`          |
| Review state   | `Pending` or `Awaiting` phrase  | `PendingHumanReview`              |
| Approved state | `Approved` or `Verified` phrase | `HumanApproved`                   |
| Rejected state | `Rejected` or `Denied` phrase   | `StudentRejected`                 |
| Hidden state   | `Hidden` + reason               | `HiddenAfterConsentWithdrawal`    |
| Visible state  | `Visible` + context             | `AdmissionsVisible`               |
| Final state    | Clear terminal state            | `Closed`, `Consumed`, `Suspended` |

---

# 5. SM-1 User Account State Model

## 5.1 UserAccount States

| State                  | Meaning                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `Unregistered`         | No `UserAccount` exists.                                                                   |
| `RegisteredUnverified` | Account exists, but email verification is incomplete.                                      |
| `EmailVerified`        | Email has been verified through `EmailVerificationToken`.                                  |
| `Authenticated`        | User has successfully authenticated.                                                       |
| `Restricted`           | Account exists but is blocked from sensitive actions due to role, verification, or status. |
| `Suspended`            | Account has been suspended by platform administrator or security workflow.                 |

## 5.2 UserAccount Transitions

| From State             | Trigger Method                                                                              | Guard Condition                                               | To State               | Security Result                            |
| ---------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------- | ------------------------------------------ |
| `Unregistered`         | `UserAccount.register(email: string, password: string, role: Role): EmailVerificationToken` | Email, password, duplicate-account, and role checks pass.     | `RegisteredUnverified` | Verification token is issued.              |
| `RegisteredUnverified` | `EmailVerificationToken.validate(): boolean`                                                | Token is valid, unused, unexpired, and account-bound.         | `EmailVerified`        | Email verification may proceed.            |
| `RegisteredUnverified` | `EmailVerificationToken.rejectInvalidOrExpired(): Void`                                     | Token is invalid, expired, consumed, or account-mismatched.   | `Restricted`           | Verification is denied.                    |
| `EmailVerified`        | `UserAccount.markEmailVerified(): UserAccount`                                              | Token validation succeeded.                                   | `EmailVerified`        | Account can proceed to eligible workflows. |
| `EmailVerified`        | `UserAccount.authenticate(email: string, password: string): UserAccount`                    | Credentials valid and account not suspended.                  | `Authenticated`        | User session may be created.               |
| `RegisteredUnverified` | `UserAccount.blockProfilePublishingUntilVerified(): Void`                                   | User attempts profile publication before email verification.  | `Restricted`           | Profile publication blocked.               |
| `Authenticated`        | `UserAccount.suspend(reason: string, actor: UserAccount): UserAccount`                      | Platform administrator or security workflow suspends account. | `Suspended`            | Access to protected workflows is blocked.  |

## 5.3 UserAccount Invariants

| Invariant ID  | Rule                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `STATE-UA-01` | `RegisteredUnverified` users cannot publish `StudentProfile`.                                                                   |
| `STATE-UA-02` | Suspended accounts cannot access protected workflows.                                                                           |
| `STATE-UA-03` | `Role` assignment does not replace `AccessPolicy` checks.                                                                       |
| `STATE-UA-04` | Email verification requires `EmailVerificationToken.validate(): boolean` before `UserAccount.markEmailVerified(): UserAccount`. |

---

# 6. SM-2 Email Verification Token State Model

## 6.1 EmailVerificationToken States

| State      | Meaning                                                                   |
| ---------- | ------------------------------------------------------------------------- |
| `Created`  | Token was generated by account registration.                              |
| `Valid`    | Token is authentic, unexpired, unused, and account-bound.                 |
| `Consumed` | Token was successfully used.                                              |
| `Expired`  | Token exceeded its valid time window.                                     |
| `Rejected` | Token failed validation due to expiration, mismatch, reuse, or tampering. |

## 6.2 EmailVerificationToken Transitions

| From State | Trigger Method                                                        | Guard Condition                                           | To State   | Security Result                      |
| ---------- | --------------------------------------------------------------------- | --------------------------------------------------------- | ---------- | ------------------------------------ |
| `Created`  | `EmailVerificationToken.validate(): boolean`                          | Token is authentic, unexpired, unused, and account-bound. | `Valid`    | Verification may continue.           |
| `Created`  | `EmailVerificationToken.rejectInvalidOrExpired(): Void`               | Token is invalid, expired, consumed, or mismatched.       | `Rejected` | Verification denied.                 |
| `Valid`    | `UserAccount.verifyEmail(token: EmailVerificationToken): UserAccount` | Token validation succeeded.                               | `Valid`    | Account email verification proceeds. |
| `Valid`    | `EmailVerificationToken.markConsumed(): EmailVerificationToken`       | Verification completed.                                   | `Consumed` | Replay prevented.                    |
| `Created`  | `EmailVerificationToken.rejectInvalidOrExpired(): Void`               | Token expired before use.                                 | `Expired`  | Verification denied.                 |

## 6.3 EmailVerificationToken Invariants

| Invariant ID   | Rule                                                                   |
| -------------- | ---------------------------------------------------------------------- |
| `STATE-EVT-01` | Consumed tokens cannot be reused.                                      |
| `STATE-EVT-02` | Expired tokens cannot verify accounts.                                 |
| `STATE-EVT-03` | Invalid tokens must not transition a `UserAccount` to `EmailVerified`. |

---

# 7. SM-3 Counselor Invitation State Model

## 7.1 CounselorInvitation States

| State       | Meaning                                                              |
| ----------- | -------------------------------------------------------------------- |
| `Created`   | Platform administrator created invitation.                           |
| `Sent`      | Invitation was sent through `EmailService`.                          |
| `Validated` | Invitation link passed email, school, expiration, and unused checks. |
| `Consumed`  | Invitation was used to create a counselor profile.                   |
| `Expired`   | Invitation passed its valid time window.                             |
| `Rejected`  | Invitation failed validation or was already consumed.                |

## 7.2 CounselorInvitation Transitions

| From State  | Trigger Method                                                                                                                               | Guard Condition                                                            | To State    | Security Result                                                    |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------ |
| `Created`   | `CounselorInvitation.create(admin: UserAccount, counselorEmail: string, counselorName: string, highSchool: HighSchool): CounselorInvitation` | Actor is platform administrator.                                           | `Created`   | Invitation exists and is bound to counselor email and high school. |
| `Created`   | `CounselorInvitation.send(emailService: EmailService): Void`                                                                                 | Invitation has valid email and high school binding.                        | `Sent`      | Invitation delivered through email service.                        |
| `Sent`      | `CounselorInvitation.validate(email: string): boolean`                                                                                       | Invitation is authentic, unused, unexpired, email-bound, and school-bound. | `Validated` | Counselor registration may continue.                               |
| `Sent`      | `CounselorInvitation.rejectInvalidOrConsumed(email: string): Void`                                                                           | Invitation invalid, expired, consumed, or email-mismatched.                | `Rejected`  | Registration blocked.                                              |
| `Validated` | `CounselorProfile.registerFromInvitation(invitation: CounselorInvitation, fullName: string, password: string): CounselorProfile`             | Registration inputs valid.                                                 | `Validated` | Pending counselor profile may be created.                          |
| `Validated` | `CounselorInvitation.markConsumed(): CounselorInvitation`                                                                                    | Counselor profile registration succeeds.                                   | `Consumed`  | Invitation replay prevented.                                       |
| `Sent`      | `CounselorInvitation.rejectInvalidOrConsumed(email: string): Void`                                                                           | Invitation expired before use.                                             | `Expired`   | Registration blocked.                                              |

## 7.3 CounselorInvitation Invariants

| Invariant ID  | Rule                                                                                    |
| ------------- | --------------------------------------------------------------------------------------- |
| `STATE-CI-01` | A `Consumed` invitation cannot create another `CounselorProfile`.                       |
| `STATE-CI-02` | A counselor invitation must be email-bound and school-bound.                            |
| `STATE-CI-03` | Invitation validation must occur before `CounselorProfile.registerFromInvitation(...)`. |
| `STATE-CI-04` | Rejected invitations must not produce counselor access.                                 |

---

# 8. SM-4 Counselor Verification State Model

## 8.1 CounselorProfile States

| State                 | Meaning                                                     |
| --------------------- | ----------------------------------------------------------- |
| `NotRegistered`       | No counselor profile exists.                                |
| `PendingVerification` | Counselor registered from invitation but is not approved.   |
| `InVerificationQueue` | Counselor is waiting for platform administrator review.     |
| `Verified`            | Platform administrator approved counselor verification.     |
| `Denied`              | Platform administrator denied counselor verification.       |
| `Suspended`           | Counselor was suspended after registration or verification. |

## 8.2 CounselorProfile Transitions

| From State            | Trigger Method                                                                                                                   | Guard Condition                                                  | To State              | Security Result                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------- | ------------------------------------------------ |
| `NotRegistered`       | `CounselorProfile.registerFromInvitation(invitation: CounselorInvitation, fullName: string, password: string): CounselorProfile` | Invitation is valid and email-bound.                             | `PendingVerification` | Counselor profile created without roster access. |
| `PendingVerification` | `CounselorProfile.bindToHighSchool(highSchool: HighSchool): CounselorProfile`                                                    | High school matches invitation-bound school.                     | `PendingVerification` | Counselor profile is school-bound.               |
| `PendingVerification` | `VerificationQueueItem.createForCounselor(counselor: CounselorProfile): VerificationQueueItem`                                   | Counselor profile exists.                                        | `InVerificationQueue` | Counselor enters admin review queue.             |
| `InVerificationQueue` | `VerificationQueueItem.assignToAdmin(admin: UserAccount): VerificationQueueItem`                                                 | Actor is platform administrator.                                 | `InVerificationQueue` | Verification review assigned.                    |
| `InVerificationQueue` | `VerificationDecision.approve(admin: UserAccount, counselor: CounselorProfile, note: string): VerificationDecision`              | Platform administrator approves identity and school affiliation. | `Verified`            | Counselor may access same-school workflows.      |
| `Verified`            | `CounselorProfile.markVerified(decision: VerificationDecision): CounselorProfile`                                                | Approved verification decision exists.                           | `Verified`            | Verification status applied.                     |
| `InVerificationQueue` | `VerificationDecision.deny(admin: UserAccount, counselor: CounselorProfile, reason: string): VerificationDecision`               | Platform administrator denies verification.                      | `Denied`              | Counselor remains blocked.                       |
| `PendingVerification` | `AccessPolicy.blockUnverifiedCounselor(counselor: CounselorProfile): Void`                                                       | Counselor attempts protected workflow before verification.       | `PendingVerification` | Access blocked.                                  |
| `Denied`              | `AccessPolicy.blockUnverifiedCounselor(counselor: CounselorProfile): Void`                                                       | Denied counselor attempts protected workflow.                    | `Denied`              | Access blocked.                                  |
| `Verified`            | `CounselorProfile.markSuspended(reason: string): CounselorProfile`                                                               | Suspension reason recorded.                                      | `Suspended`           | Counselor access blocked.                        |

## 8.3 CounselorProfile Invariants

| Invariant ID  | Rule                                                                   |
| ------------- | ---------------------------------------------------------------------- |
| `STATE-CP-01` | `PendingVerification` counselors cannot open student rosters.          |
| `STATE-CP-02` | `PendingVerification` counselors cannot open transcript requests.      |
| `STATE-CP-03` | `Verified` counselors can access only same-school students.            |
| `STATE-CP-04` | `Denied` and `Suspended` counselors cannot access counselor workflows. |
| `STATE-CP-05` | Counselor verification requires `VerificationDecision.approve(...)`.   |

---

# 9. SM-5 Student Profile State Model

## 9.1 StudentProfile States

| State                    | Meaning                                                           |
| ------------------------ | ----------------------------------------------------------------- |
| `NotStarted`             | Student profile has not been initialized.                         |
| `Draft`                  | Profile exists and is editable by student owner.                  |
| `Incomplete`             | One or more required sections are missing.                        |
| `CompleteUnpublished`    | Required sections are complete but profile is not published.      |
| `BlockedUnverifiedEmail` | Student attempted publication before email verification.          |
| `BlockedMissingConsent`  | Student attempted admissions visibility without required consent. |
| `PublishedVisible`       | Profile is published, admissions-visible, and consent-allowed.    |
| `PublishedHidden`        | Profile is published but hidden from admissions discovery.        |
| `Unpublished`            | Profile is not available to admissions search or admissions view. |
| `UpdatedSinceLastViewed` | Profile changed after a prior admissions view or shortlist event. |

## 9.2 StudentProfile Transitions

| From State               | Trigger Method                                                                                                     | Guard Condition                                                                              | To State                 | Security Result                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------- |
| `NotStarted`             | `StudentProfile.initialize(owner: UserAccount): StudentProfile`                                                    | Authenticated student owner exists.                                                          | `Draft`                  | Profile editing begins.                               |
| `Draft`                  | `StudentProfile.updateIdentity(info: IdentityInformation): StudentProfile`                                         | Student owner is authenticated.                                                              | `Draft`                  | Identity section updated.                             |
| `Draft`                  | `StudentProfile.linkHighSchool(highSchool: HighSchool): StudentProfile`                                            | High school exists or is accepted as school record.                                          | `Draft`                  | Profile linked to `HighSchool`.                       |
| `Draft`                  | `StudentProfile.addAcademicRecord(record: AcademicRecord): StudentProfile`                                         | `AcademicRecord.validate(gradingScale: GradingScale): boolean` passes.                       | `Draft`                  | Academic record saved.                                |
| `Draft`                  | `StudentProfile.setAcademicInterests(interests: List<AcademicInterest>): StudentProfile`                           | Academic interest selection is valid.                                                        | `Draft`                  | Interests saved.                                      |
| `Draft`                  | `StudentProfile.addNarrativeResponse(response: NarrativeResponse): StudentProfile`                                 | Student owns profile.                                                                        | `Draft`                  | Student-authored narrative saved.                     |
| `Draft`                  | `StudentProfile.addProfileItem(item: ProfileItem): StudentProfile`                                                 | Student owns profile.                                                                        | `Draft`                  | Profile item saved as self-reported unless supported. |
| `Draft`                  | `StudentProfile.autosave(): StudentProfile`                                                                        | Student owns profile.                                                                        | `Draft`                  | Draft is saved.                                       |
| `Draft`                  | `StudentProfile.checkRequiredSectionsComplete(): boolean`                                                          | Required sections missing.                                                                   | `Incomplete`             | Publication blocked.                                  |
| `Draft`                  | `StudentProfile.checkRequiredSectionsComplete(): boolean`                                                          | Required sections complete.                                                                  | `CompleteUnpublished`    | Profile can proceed to publication checks.            |
| `CompleteUnpublished`    | `UserAccount.blockProfilePublishingUntilVerified(): Void`                                                          | Student account email not verified.                                                          | `BlockedUnverifiedEmail` | Publication blocked.                                  |
| `CompleteUnpublished`    | `ConsentSettings.update(aiConsent: boolean, admissionsVisibilityConsent: boolean): ConsentSettings`                | Admissions visibility consent missing.                                                       | `BlockedMissingConsent`  | Admissions visibility blocked.                        |
| `CompleteUnpublished`    | `ProfileVisibilitySettings.update(isPublished: boolean, admissionsVisible: boolean): ProfileVisibilitySettings`    | Student chooses published and admissions-visible settings.                                   | `CompleteUnpublished`    | Visibility settings updated.                          |
| `CompleteUnpublished`    | `StudentProfile.publish(): StudentProfile`                                                                         | Email verified, required sections complete, high school linked, visibility and consent pass. | `PublishedVisible`       | Profile may enter admissions discovery.               |
| `PublishedVisible`       | `SearchIndex.indexProfile(profile: StudentProfile): Void`                                                          | Profile is published, visible, and consent-allowed.                                          | `PublishedVisible`       | Profile indexed for search.                           |
| `PublishedVisible`       | `ProfileVisibilitySettings.update(isPublished: boolean, admissionsVisible: boolean): ProfileVisibilitySettings`    | Student hides profile from admissions.                                                       | `PublishedHidden`        | Profile removed or excluded from search.              |
| `PublishedHidden`        | `StudentDiscoverySearch.excludeHiddenProfiles(): Void`                                                             | Profile hidden.                                                                              | `PublishedHidden`        | Profile excluded from discovery.                      |
| `PublishedVisible`       | `StudentProfile.unpublish(): StudentProfile`                                                                       | Student owner unpublishes profile.                                                           | `Unpublished`            | Profile no longer available to admissions.            |
| `Unpublished`            | `SearchIndex.removeProfile(profile: StudentProfile): Void`                                                         | Profile is unpublished.                                                                      | `Unpublished`            | Profile removed from search index.                    |
| `PublishedVisible`       | `StudentProfile.markUpdatedSinceLastViewed(): StudentProfile`                                                      | Student updates profile after admissions view or shortlist reference.                        | `UpdatedSinceLastViewed` | Saved views must recheck current profile state.       |
| `UpdatedSinceLastViewed` | `AccessPolicy.authorizeAdmissionsProfileView(officer: AdmissionsOfficerProfile, profile: StudentProfile): boolean` | Current visibility, consent, and authorization pass.                                         | `PublishedVisible`       | Admissions view may render current safe view.         |

## 9.3 StudentProfile Invariants

| Invariant ID  | Rule                                                                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `STATE-SP-01` | `Draft`, `Incomplete`, `CompleteUnpublished`, `BlockedUnverifiedEmail`, and `Unpublished` profiles must not appear in admissions search. |
| `STATE-SP-02` | `PublishedHidden` profiles must not appear in admissions search.                                                                         |
| `STATE-SP-03` | `PublishedVisible` requires active admissions visibility consent.                                                                        |
| `STATE-SP-04` | `StudentProfile.publish(): StudentProfile` requires `StudentProfile.checkRequiredSectionsComplete(): boolean`.                           |
| `STATE-SP-05` | `SearchIndex.indexProfile(profile: StudentProfile): Void` must occur only after publication, visibility, and consent checks.             |
| `STATE-SP-06` | `SearchIndex.removeProfile(profile: StudentProfile): Void` must occur when a profile becomes unpublished, hidden, or consent-restricted. |
| `STATE-SP-07` | `UpdatedSinceLastViewed` must not bypass current access checks.                                                                          |

---

# 10. SM-6 Profile Visibility and Consent State Model

## 10.1 ProfileVisibilitySettings States

| State              | Meaning                                          |
| ------------------ | ------------------------------------------------ |
| `NotPublished`     | Profile is not published.                        |
| `PublishedVisible` | Profile is published and admissions-visible.     |
| `PublishedHidden`  | Profile is published but hidden from admissions. |

## 10.2 ConsentSettings States

| State                     | Meaning                                                |
| ------------------------- | ------------------------------------------------------ |
| `NoAdmissionsConsent`     | Student has not granted admissions visibility consent. |
| `AdmissionsConsentActive` | Student has granted admissions visibility consent.     |
| `AIConsentInactive`       | AI contextualization consent is absent or off.         |
| `AIConsentActive`         | AI contextualization consent is active.                |

## 10.3 Visibility and Consent Transitions

| From State                | Trigger Method                                                                                                  | Guard Condition                                      | To State                  | Security Result                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------- |
| `NotPublished`            | `ProfileVisibilitySettings.update(isPublished: boolean, admissionsVisible: boolean): ProfileVisibilitySettings` | `isPublished = true` and `admissionsVisible = true`. | `PublishedVisible`        | Profile may be considered for admissions visibility if consent also passes. |
| `PublishedVisible`        | `ProfileVisibilitySettings.update(isPublished: boolean, admissionsVisible: boolean): ProfileVisibilitySettings` | `admissionsVisible = false`.                         | `PublishedHidden`         | Profile is hidden from admissions discovery.                                |
| `PublishedVisible`        | `StudentProfile.unpublish(): StudentProfile`                                                                    | Student unpublishes profile.                         | `NotPublished`            | Profile removed from admissions access.                                     |
| `NoAdmissionsConsent`     | `ConsentSettings.update(aiConsent: boolean, admissionsVisibilityConsent: boolean): ConsentSettings`             | `admissionsVisibilityConsent = true`.                | `AdmissionsConsentActive` | Admissions visibility may proceed if other checks pass.                     |
| `AdmissionsConsentActive` | `ConsentSettings.update(aiConsent: boolean, admissionsVisibilityConsent: boolean): ConsentSettings`             | `admissionsVisibilityConsent = false`.               | `NoAdmissionsConsent`     | Admissions visibility blocked.                                              |
| `AIConsentInactive`       | `ConsentSettings.update(aiConsent: boolean, admissionsVisibilityConsent: boolean): ConsentSettings`             | `aiConsent = true`.                                  | `AIConsentActive`         | AI contextualization may become eligible.                                   |
| `AIConsentActive`         | `ConsentSettings.update(aiConsent: boolean, admissionsVisibilityConsent: boolean): ConsentSettings`             | `aiConsent = false`.                                 | `AIConsentInactive`       | AI contextualization disabled.                                              |

## 10.4 Visibility and Consent Invariants

| Invariant ID  | Rule                                                                                  |
| ------------- | ------------------------------------------------------------------------------------- |
| `STATE-VC-01` | Admissions visibility requires both `PublishedVisible` and `AdmissionsConsentActive`. |
| `STATE-VC-02` | AI contextualization requires `AIConsentActive`.                                      |
| `STATE-VC-03` | Changing visibility or consent must affect search and admissions views immediately.   |
| `STATE-VC-04` | Consent withdrawal must hide related optional AI output from admissions-facing views. |

> **Batch 5 prototype refinement (Admissions Discovery, Group 1f — decision, not a lifecycle).** The implemented Batch 5 prototype does NOT build the named-state model above. There are no stored `NotPublished` / `PublishedVisible` / `PublishedHidden` states, no consent states, and no separate `ConsentSettings` table. Instead, admissions visibility is a single two-boolean decision on `ProfileVisibilitySettings` (`is_published` AND `admissions_consent`, both defaulting `false`), re-evaluated AT QUERY TIME by `is_admissions_visible_profile(profile_id)` — no derived or cached visibility field exists. A missing settings row is not implicitly visible. `is_verified_admissions_officer()` is an access precondition on the caller, not a state of the profile's own lifecycle. See `recruitbook-diagrams/diagrams/slices/batch-5-admissions-discovery/05_admissions_discovery_visibility_decision.puml`. No new state-model number was assigned; this SM-6 section remains the unbuilt long-term model, retained for future batches. This is a deliberate, recorded refinement (see `recruitbook-diagrams/diagrams/slices/batch-5-admissions-discovery/README.md`), not silent drift.

> **Batch 6 addition (Admissions Shortlists, Group 1f — decision, not a lifecycle).** Batch 6 adds no new state-model number and no `ShortlistEntry` lifecycle/state of any kind. It only REUSES the existing, live Batch 5 visibility decision (`is_admissions_visible_profile`) for each officer-owned entry, evaluated fresh at read time — not a new decision model, not a new state machine. A non-visible profile causes silent omission of that entry from the officer's saved list (not a stored state transition on the entry row). The retained row may resurface later once the profile becomes visible again — still not a stored state transition, purely a re-evaluation outcome at the next read. See `recruitbook-diagrams/diagrams/slices/batch-6-admissions-shortlists/05_admissions_shortlists_entry_visibility_decision.puml`.

---

# 11. SM-7 Verification Tier State Model

## 11.1 VerificationTier States

| State                           | Meaning                                                                 |
| ------------------------------- | ----------------------------------------------------------------------- |
| `SelfReported`                  | Information was submitted by student and is not externally supported.   |
| `CounselorSupported`            | Verified same-school counselor supported school or profile information. |
| `TranscriptSupported`           | Valid transcript evidence was submitted through counselor workflow.     |
| `BlockedSelfVerifiedTranscript` | Student attempted to self-upload official transcript evidence.          |

## 11.2 VerificationTier Transitions

| From State           | Trigger Method                                                                          | Guard Condition                                               | To State                                      | Security Result                                          |
| -------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------- |
| `SelfReported`       | `SelfReportedLabel.applyTo(target: object): SelfReportedLabel`                          | Information lacks counselor or transcript support.            | `SelfReported`                                | Admissions view labels information as self-reported.     |
| `SelfReported`       | `VerificationTier.applyCounselorSupport(counselor: CounselorProfile): VerificationTier` | Counselor is verified and same-school matched.                | `CounselorSupported`                          | Counselor-supported status applied.                      |
| `CounselorSupported` | `VerificationTier.applyTranscriptSupport(transcript: Transcript): VerificationTier`     | Valid transcript evidence exists.                             | `TranscriptSupported`                         | Transcript-supported status applied.                     |
| `SelfReported`       | `StudentProfile.preventSelfVerifiedTranscriptUpload(): Void`                            | Student attempts to self-upload official transcript evidence. | `BlockedSelfVerifiedTranscript`               | Trust elevation is blocked.                              |
| `SelfReported`       | `VerificationTier.updateFromSupport(supportType: string): VerificationTier`             | System confirms valid support source.                         | `CounselorSupported` or `TranscriptSupported` | Verification tier updated by system-controlled workflow. |

## 11.3 VerificationTier Invariants

| Invariant ID  | Rule                                                                           |
| ------------- | ------------------------------------------------------------------------------ |
| `STATE-VT-01` | Students cannot directly assign `CounselorSupported` or `TranscriptSupported`. |
| `STATE-VT-02` | `TranscriptSupported` requires valid `Transcript`.                             |
| `STATE-VT-03` | `CounselorSupported` requires verified same-school counselor action.           |
| `STATE-VT-04` | Self-reported information must remain labeled in `AdmissionsProfileView`.      |

---

# 12. SM-8 Transcript Support State Model

## 12.1 TranscriptSupportRequest States

| State                        | Meaning                                                  |
| ---------------------------- | -------------------------------------------------------- |
| `NotRequested`               | Student has not requested counselor support.             |
| `Created`                    | Request exists.                                          |
| `AssignedToCounselor`        | Request is assigned to a counselor.                      |
| `BlockedUnverifiedCounselor` | Counselor is not verified.                               |
| `BlockedSchoolMismatch`      | Counselor and student are not from the same high school. |
| `SchoolInfoSupported`        | Counselor supported school information.                  |
| `AwaitingTranscriptUpload`   | Request is ready for transcript upload.                  |
| `TranscriptSubmitted`        | Transcript file was submitted.                           |
| `Submitted`                  | Transcript support workflow is complete.                 |

## 12.2 TranscriptSupportRequest Transitions

| From State            | Trigger Method                                                                                                                         | Guard Condition                                                | To State                     | Security Result                                   |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------- | ------------------------------------------------- |
| `NotRequested`        | `TranscriptSupportRequest.create(studentProfile: StudentProfile): TranscriptSupportRequest`                                            | Student profile exists.                                        | `Created`                    | Support request created.                          |
| `Created`             | `TranscriptSupportRequest.assignToCounselor(counselor: CounselorProfile): TranscriptSupportRequest`                                    | Counselor belongs to same high school and is eligible.         | `AssignedToCounselor`        | Request assigned.                                 |
| `AssignedToCounselor` | `AccessPolicy.requireVerifiedCounselor(counselor: CounselorProfile): Void`                                                             | Counselor is pending, denied, suspended, or unverified.        | `BlockedUnverifiedCounselor` | Counselor access blocked.                         |
| `AssignedToCounselor` | `AccessPolicy.requireSameHighSchool(counselor: CounselorProfile, profile: StudentProfile): Void`                                       | Counselor and student high schools do not match.               | `BlockedSchoolMismatch`      | Counselor access blocked.                         |
| `AssignedToCounselor` | `TranscriptSupportRequest.markSchoolInformationSupported(counselor: CounselorProfile): TranscriptSupportRequest`                       | Counselor is verified and same-school matched.                 | `SchoolInfoSupported`        | School information support recorded.              |
| `SchoolInfoSupported` | `VerificationTier.applyCounselorSupport(counselor: CounselorProfile): VerificationTier`                                                | Counselor is verified and same-school matched.                 | `SchoolInfoSupported`        | Verification tier may become counselor-supported. |
| `SchoolInfoSupported` | `TranscriptSupportRequest.submitTranscript(counselor: CounselorProfile, file: UploadedFile): TranscriptSupportRequest`                 | Counselor is verified, same-school matched, and file is valid. | `TranscriptSubmitted`        | Transcript evidence submitted.                    |
| `TranscriptSubmitted` | `TranscriptSupportRequest.markSubmitted(): TranscriptSupportRequest`                                                                   | Transcript submission completed.                               | `Submitted`                  | Transcript workflow complete.                     |
| `Submitted`           | `AuditLogEntry.recordTranscriptAction(counselor: CounselorProfile, request: TranscriptSupportRequest, outcome: string): AuditLogEntry` | Transcript action succeeded or failed.                         | `Submitted`                  | Audit record created.                             |

## 12.3 TranscriptSupportRequest Invariants

| Invariant ID   | Rule                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------ |
| `STATE-TSR-01` | Pending, denied, or suspended counselors cannot progress support requests.                 |
| `STATE-TSR-02` | Wrong-school counselors cannot access or submit support for a student.                     |
| `STATE-TSR-03` | Transcript submission must not occur before counselor verification and same-school checks. |
| `STATE-TSR-04` | Transcript actions must be audited.                                                        |

---

# 13. SM-9 Uploaded File and Transcript State Model

## 13.1 UploadedFile States

| State               | Meaning                                           |
| ------------------- | ------------------------------------------------- |
| `Selected`          | File has been selected by user but not validated. |
| `ValidationPending` | File is being checked.                            |
| `Validated`         | File type, size, and safety checks passed.        |
| `Rejected`          | File failed validation.                           |
| `StoredProtected`   | File was stored in protected object storage.      |

## 13.2 Transcript States

| State                 | Meaning                                               |
| --------------------- | ----------------------------------------------------- |
| `NotCreated`          | No transcript record exists.                          |
| `CreatedFromUpload`   | Transcript record exists after protected file upload. |
| `TranscriptSupported` | Transcript evidence can support verification tier.    |

## 13.3 UploadedFile and Transcript Transitions

| From State          | Trigger Method                                                                                   | Guard Condition                                      | To State              | Security Result                        |
| ------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | --------------------- | -------------------------------------- |
| `Selected`          | `FileValidationRule.validate(file: UploadedFile): boolean`                                       | File validation starts.                              | `ValidationPending`   | File is checked before storage.        |
| `ValidationPending` | `FileValidationRule.validate(file: UploadedFile): boolean`                                       | File type, size, and safety checks pass.             | `Validated`           | File may proceed to protected storage. |
| `ValidationPending` | `FileValidationRule.rejectInvalidFile(file: UploadedFile): Void`                                 | File invalid, oversized, unsupported, or suspicious. | `Rejected`            | File is not stored.                    |
| `Validated`         | `UploadedFile.store(fileBytes: binary, objectStorage: ObjectStorage): UploadedFile`              | Validation passed.                                   | `StoredProtected`     | File metadata stored.                  |
| `StoredProtected`   | `ObjectStorage.storeProtectedFile(file: UploadedFile): string`                                   | Protected storage accepts validated file.            | `StoredProtected`     | Protected storage path created.        |
| `NotCreated`        | `Transcript.createFromUpload(file: UploadedFile, request: TranscriptSupportRequest): Transcript` | Valid support request and protected file exist.      | `CreatedFromUpload`   | Transcript record created.             |
| `CreatedFromUpload` | `VerificationTier.applyTranscriptSupport(transcript: Transcript): VerificationTier`              | Transcript evidence accepted.                        | `TranscriptSupported` | Transcript-supported tier may apply.   |

## 13.4 UploadedFile and Transcript Invariants

| Invariant ID  | Rule                                                                    |
| ------------- | ----------------------------------------------------------------------- |
| `STATE-UF-01` | `UploadedFile` cannot reach `StoredProtected` unless validation passes. |
| `STATE-UF-02` | Rejected files cannot create `Transcript`.                              |
| `STATE-UF-03` | Transcript files must not use public unauthenticated URLs.              |
| `STATE-UF-04` | `Transcript` must be created through valid `TranscriptSupportRequest`.  |

---

# 14. SM-10 AI Consent State Model

## 14.1 AIConsentRecord States

| State              | Meaning                                                  |
| ------------------ | -------------------------------------------------------- |
| `NoConsent`        | Student has not given AI contextualization consent.      |
| `ConsentActive`    | Student has explicitly opted into AI contextualization.  |
| `ConsentWithdrawn` | Student previously consented but later withdrew consent. |

## 14.2 AIConsentRecord Transitions

| From State         | Trigger Method                                                                                                                                                     | Guard Condition                                 | To State           | Security Result                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- | ------------------ | ------------------------------------------------ |
| `NoConsent`        | `AIConsentRecord.recordConsent(studentProfile: StudentProfile, consentGiven: boolean): AIConsentRecord`                                                            | `consentGiven = true` and student owns profile. | `ConsentActive`    | AI contextualization may become eligible.        |
| `NoConsent`        | `AIContextualizationRequest.create(studentProfile: StudentProfile, selectedFields: List<NarrativeResponse>, consent: AIConsentRecord): AIContextualizationRequest` | Consent is missing.                             | `NoConsent`        | AI request blocked.                              |
| `ConsentActive`    | `AIConsentRecord.withdrawConsent(studentProfile: StudentProfile): AIConsentRecord`                                                                                 | Student owner withdraws consent.                | `ConsentWithdrawn` | AI output must be hidden from admissions.        |
| `ConsentWithdrawn` | `AIOutputPolicy.hideAfterConsentWithdrawal(output: AIContextualizationOutput): AIContextualizationOutput`                                                          | AI output exists.                               | `ConsentWithdrawn` | Existing AI output hidden from admissions views. |

## 14.3 AIConsentRecord Invariants

| Invariant ID   | Rule                                                                    |
| -------------- | ----------------------------------------------------------------------- |
| `STATE-AIC-01` | AI contextualization must be off by default.                            |
| `STATE-AIC-02` | AI request creation requires `ConsentActive`.                           |
| `STATE-AIC-03` | `ConsentWithdrawn` hides prior optional AI output from admissions view. |
| `STATE-AIC-04` | Consent must be student-controlled.                                     |

---

# 15. SM-11 AI Contextualization State Model

## 15.1 AIContextualization States

| State                          | Meaning                                                            |
| ------------------------------ | ------------------------------------------------------------------ |
| `NotRequested`                 | No AI contextualization request exists.                            |
| `ConsentRequired`              | Student has not granted AI consent.                                |
| `RequestCreated`               | AI request exists for selected narrative fields.                   |
| `EligibilityValidated`         | Request passed eligibility checks.                                 |
| `SentToAIService`              | Request crossed the `RecruitBookApp / AIService` boundary.         |
| `PendingOutputStored`          | AI output returned and was stored pending review.                  |
| `LabeledAIGenerated`           | Output is explicitly tagged as AI-generated.                       |
| `PendingStudentReview`         | Student has not accepted, rejected, or requested revision.         |
| `StudentAccepted`              | Student accepted AI output.                                        |
| `StudentRejected`              | Student rejected AI output.                                        |
| `StudentRevisionRequested`     | Student requested revision.                                        |
| `PendingHumanReview`           | Student accepted output and human review is needed.                |
| `HumanApproved`                | Verified reviewer approved AI output.                              |
| `HumanRejected`                | Verified reviewer rejected AI output.                              |
| `HumanRevisionRequested`       | Verified reviewer requested revision.                              |
| `AdmissionsVisible`            | Output can be included in admissions-facing view.                  |
| `HiddenAfterConsentWithdrawal` | Output hidden because AI consent was withdrawn.                    |
| `BlockedUnreviewed`            | Display blocked because student or human review is incomplete.     |
| `BlockedRejected`              | Display blocked because student or human reviewer rejected output. |

## 15.2 AIContextualization Transitions

| From State                     | Trigger Method                                                                                                                                                     | Guard Condition                                                                       | To State                       | Security Result                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------- |
| `NotRequested`                 | `AIContextualizationRequest.create(studentProfile: StudentProfile, selectedFields: List<NarrativeResponse>, consent: AIConsentRecord): AIContextualizationRequest` | No active consent.                                                                    | `ConsentRequired`              | Request blocked.                              |
| `NotRequested`                 | `AIContextualizationRequest.create(studentProfile: StudentProfile, selectedFields: List<NarrativeResponse>, consent: AIConsentRecord): AIContextualizationRequest` | Active consent exists and selected fields are provided.                               | `RequestCreated`               | AI request created.                           |
| `RequestCreated`               | `AIContextualizationRequest.validateEligibility(): boolean`                                                                                                        | Selected fields are eligible.                                                         | `EligibilityValidated`         | Request may be sent to AI service.            |
| `RequestCreated`               | `AIContextualizationRequest.validateEligibility(): boolean`                                                                                                        | Selected fields are not eligible.                                                     | `ConsentRequired`              | Request blocked or revised.                   |
| `EligibilityValidated`         | `AIContextualizationRequest.sendToAIService(aiService: AIService): AIContextualizationOutput`                                                                      | Only consent-approved selected fields are sent.                                       | `SentToAIService`              | Request crosses AI service boundary.          |
| `SentToAIService`              | `AIService.generateContext(request: AIContextualizationRequest): AIContextualizationOutput`                                                                        | AI service returns output.                                                            | `PendingOutputStored`          | AI output returns to RecruitBook.             |
| `PendingOutputStored`          | `AIContextualizationOutput.storePending(request: AIContextualizationRequest, generatedText: string): AIContextualizationOutput`                                    | Generated text exists.                                                                | `PendingOutputStored`          | Output stored as pending review.              |
| `PendingOutputStored`          | `AIContextualizationOutput.labelAsAIGenerated(): AIContextualizationOutput`                                                                                        | Output exists.                                                                        | `LabeledAIGenerated`           | AI-generated label applied.                   |
| `LabeledAIGenerated`           | `StudentAIReviewDecision.accept(output: AIContextualizationOutput): StudentAIReviewDecision`                                                                       | Student owner accepts output.                                                         | `PendingHumanReview`           | Output requires human review before admissions visibility. |
| `LabeledAIGenerated`           | `StudentAIReviewDecision.reject(output: AIContextualizationOutput, reason: string): StudentAIReviewDecision`                                                       | Student owner rejects output.                                                         | `StudentRejected`              | Output blocked from admissions.               |
| `LabeledAIGenerated`           | `StudentAIReviewDecision.requestRevision(output: AIContextualizationOutput, note: string): StudentAIReviewDecision`                                                | Student owner requests revision.                                                      | `StudentRevisionRequested`     | Output remains hidden.                        |
| `PendingHumanReview`           | `HumanReviewDecision.approve(reviewer: UserAccount, output: AIContextualizationOutput, note: string): HumanReviewDecision`                                         | Reviewer is verified same-school counselor or platform administrator.                 | `HumanApproved`                | Output may be evaluated for display.          |
| `PendingHumanReview`           | `HumanReviewDecision.reject(reviewer: UserAccount, output: AIContextualizationOutput, reason: string): HumanReviewDecision`                                        | Reviewer rejects output.                                                              | `HumanRejected`                | Output blocked from admissions.               |
| `PendingHumanReview`           | `HumanReviewDecision.requestRevision(reviewer: UserAccount, output: AIContextualizationOutput, note: string): HumanReviewDecision`                                 | Reviewer requests revision.                                                           | `HumanRevisionRequested`       | Output remains hidden.                        |
| `PendingHumanReview`           | `AIOutputPolicy.blockUnreviewedOutput(output: AIContextualizationOutput): Void`                                                                                    | Human approval missing.                                                               | `BlockedUnreviewed`            | Output hidden from admissions.                |
| `StudentRejected`              | `AIOutputPolicy.blockRejectedOutput(output: AIContextualizationOutput): Void`                                                                                      | Student rejected output.                                                              | `BlockedRejected`              | Output hidden from admissions.                |
| `HumanRejected`                | `AIOutputPolicy.blockRejectedOutput(output: AIContextualizationOutput): Void`                                                                                      | Human reviewer rejected output.                                                       | `BlockedRejected`              | Output hidden from admissions.                |
| `HumanApproved`                | `AIOutputPolicy.canDisplay(output: AIContextualizationOutput): boolean`                                                                                            | Student accepted, human approved, consent active, AI label present, profile visible.  | `AdmissionsVisible`            | Output may appear in `AdmissionsProfileView`. |
| `AdmissionsVisible`            | `AdmissionsProfileView.includeApprovedAI(output: AIContextualizationOutput): AdmissionsProfileView`                                                                | `AIOutputPolicy.canDisplay(output: AIContextualizationOutput): boolean` returns true. | `AdmissionsVisible`            | Approved AI output included with label.       |
| `AdmissionsVisible`            | `AIConsentRecord.withdrawConsent(studentProfile: StudentProfile): AIConsentRecord`                                                                                 | Student withdraws AI consent.                                                         | `HiddenAfterConsentWithdrawal` | AI output removed from admissions view.       |
| `HiddenAfterConsentWithdrawal` | `AIOutputPolicy.hideAfterConsentWithdrawal(output: AIContextualizationOutput): AIContextualizationOutput`                                                          | Consent is withdrawn.                                                                 | `HiddenAfterConsentWithdrawal` | Output remains hidden.                        |

## 15.3 AIContextualization Invariants

| Invariant ID  | Rule                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| `STATE-AI-01` | `AIContextualizationRequest` cannot be created without active `AIConsentRecord`.                                   |
| `STATE-AI-02` | Only selected eligible `NarrativeResponse` fields may be sent to `AIService`.                                      |
| `STATE-AI-03` | `AIContextualizationOutput` must be stored as pending before review.                                               |
| `STATE-AI-04` | `AIContextualizationOutput` must be labeled as AI-generated.                                                       |
| `STATE-AI-05` | Student acceptance moves AI output to `PendingHumanReview`, not `AdmissionsVisible`.                               |
| `STATE-AI-06` | Human approval alone does not create `AdmissionsVisible`; student acceptance must already exist.                    |
| `STATE-AI-07` | `AdmissionsVisible` requires student acceptance, human approval, active consent, AI label, and profile visibility. |
| `STATE-AI-08` | Rejected output cannot become admissions-visible.                                                                  |
| `STATE-AI-09` | Consent withdrawal moves AI output to `HiddenAfterConsentWithdrawal`.                                              |
| `STATE-AI-10` | `AIContextualizationOutput` must never overwrite `NarrativeResponse`.                                              |

---

# 16. SM-12 Admissions Discovery State Model

## 16.1 Admissions Discovery States

| State                     | Meaning                                                                 |
| ------------------------- | ----------------------------------------------------------------------- |
| `OfficerUnauthenticated`  | Admissions user is not authenticated.                                   |
| `OfficerUnapproved`       | Admissions user exists but is not approved.                             |
| `SearchAuthorized`        | Approved admissions officer is authorized to search.                    |
| `SearchExecuted`          | Search ran with approved filters.                                       |
| `EmptyResults`            | No authorized visible profiles matched filters.                         |
| `ResultsReturned`         | Search returned only authorized profiles.                               |
| `ProfileViewDenied`       | Profile view request failed authorization, visibility, consent, or RLS. |
| `ProfileViewAuthorized`   | Profile view request passed all access checks.                          |
| `SafeViewRendered`        | Admissions-facing safe view was rendered.                               |
| `Shortlisted`             | Profile was saved to shortlist.                                         |
| `ShortlistEntryRechecked` | Saved shortlist entry was reopened and current access was checked.      |

## 16.2 Admissions Discovery Transitions

| From State                | Trigger Method                                                                                                                                                                                | Guard Condition                                                                       | To State                                  | Security Result                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------- |
| `OfficerUnauthenticated`  | `UserAccount.authenticate(email: string, password: string): UserAccount`                                                                                                                      | Credentials valid and account active.                                                 | `OfficerUnapproved` or `SearchAuthorized` | Account status determines next state.     |
| `OfficerUnapproved`       | `AccessPolicy.requireApprovedAdmissionsOfficer(officer: AdmissionsOfficerProfile): Void`                                                                                                      | Officer is not approved.                                                              | `ProfileViewDenied`                       | Discovery access blocked.                 |
| `OfficerUnapproved`       | `AccessPolicy.requireApprovedAdmissionsOfficer(officer: AdmissionsOfficerProfile): Void`                                                                                                      | Officer is approved and active.                                                       | `SearchAuthorized`                        | Discovery access allowed.                 |
| `SearchAuthorized`        | `AdmissionsOfficerProfile.openDiscoveryPage(): StudentDiscoverySearch`                                                                                                                        | Officer is approved.                                                                  | `SearchAuthorized`                        | Search page opens.                        |
| `SearchAuthorized`        | `StudentDiscoverySearch.create(officer: AdmissionsOfficerProfile): StudentDiscoverySearch`                                                                                                    | Officer is approved.                                                                  | `SearchAuthorized`                        | Search session created.                   |
| `SearchAuthorized`        | `SearchFilter.apply(country: string, region: string, academicInterest: AcademicInterest, graduationYear: number, financialAidNeed: string, verificationTier: VerificationTier): SearchFilter` | Filter values are valid.                                                              | `SearchAuthorized`                        | Filters applied.                          |
| `SearchAuthorized`        | `StudentDiscoverySearch.execute(filters: List<SearchFilter>): List<StudentProfile>`                                                                                                           | Officer is approved and filters are valid.                                            | `SearchExecuted`                          | Search query runs.                        |
| `SearchExecuted`          | `Database.queryVisibleProfiles(filters: List<SearchFilter>, officer: AdmissionsOfficerProfile): List<StudentProfile>`                                                                         | RLS, visibility, consent, and publication checks pass.                                | `ResultsReturned`                         | Only authorized profiles returned.        |
| `SearchExecuted`          | `StudentDiscoverySearch.returnEmptyState(): string`                                                                                                                                           | No authorized profiles match.                                                         | `EmptyResults`                            | No hidden profile existence is revealed.  |
| `ResultsReturned`         | `StudentDiscoverySearch.excludeHiddenProfiles(): Void`                                                                                                                                        | Profile is hidden, unpublished, or consent-restricted.                                | `ResultsReturned`                         | Unauthorized profiles excluded.           |
| `ResultsReturned`         | `AccessPolicy.authorizeAdmissionsProfileView(officer: AdmissionsOfficerProfile, profile: StudentProfile): boolean`                                                                            | Authorization fails.                                                                  | `ProfileViewDenied`                       | Profile view blocked.                     |
| `ResultsReturned`         | `AccessPolicy.authorizeAdmissionsProfileView(officer: AdmissionsOfficerProfile, profile: StudentProfile): boolean`                                                                            | Authorization passes.                                                                 | `ProfileViewAuthorized`                   | Safe view may render.                     |
| `ProfileViewDenied`       | `AuditLogEntry.recordAccessDenied(user: UserAccount, resource: object, reason: string): AuditLogEntry`                                                                                        | Sensitive access denied.                                                              | `ProfileViewDenied`                       | Denial audited.                           |
| `ProfileViewAuthorized`   | `RowLevelSecurityPolicy.enforceProfileAccess(user: UserAccount, profile: StudentProfile): boolean`                                                                                            | Row-level access passes.                                                              | `ProfileViewAuthorized`                   | Database-level access allowed.            |
| `ProfileViewAuthorized`   | `AdmissionsProfileView.render(officer: AdmissionsOfficerProfile, profile: StudentProfile): AdmissionsProfileView`                                                                             | Current visibility, consent, and authorization pass.                                  | `SafeViewRendered`                        | Filtered admissions-facing view rendered. |
| `SafeViewRendered`        | `AdmissionsProfileView.showSelfReportedLabels(labels: List<SelfReportedLabel>): AdmissionsProfileView`                                                                                        | Self-reported information exists.                                                     | `SafeViewRendered`                        | Self-reported labels displayed.           |
| `SafeViewRendered`        | `AdmissionsProfileView.includeApprovedAI(output: AIContextualizationOutput): AdmissionsProfileView`                                                                                           | `AIOutputPolicy.canDisplay(output: AIContextualizationOutput): boolean` returns true. | `SafeViewRendered`                        | Approved AI output included with label.   |
| `SafeViewRendered`        | `Shortlist.create(owner: AdmissionsOfficerProfile, name: string): Shortlist`                                                                                                                  | Officer owns shortlist.                                                               | `SafeViewRendered`                        | Shortlist exists.                         |
| `SafeViewRendered`        | `Shortlist.addProfile(profile: StudentProfile): ShortlistEntry`                                                                                                                               | Current access checks pass.                                                           | `Shortlisted`                             | Profile reference saved.                  |
| `Shortlisted`             | `ShortlistEntry.open(officer: AdmissionsOfficerProfile): AdmissionsProfileView`                                                                                                               | Current publication, visibility, consent, and authorization pass.                     | `ShortlistEntryRechecked`                 | Saved entry revalidated.                  |
| `ShortlistEntryRechecked` | `AdmissionsProfileView.render(officer: AdmissionsOfficerProfile, profile: StudentProfile): AdmissionsProfileView`                                                                             | Recheck passes.                                                                       | `SafeViewRendered`                        | Current safe view rendered.               |
| `ShortlistEntryRechecked` | `AccessPolicy.blockUnauthorizedProfileAccess(user: UserAccount, profile: StudentProfile): Void`                                                                                               | Recheck fails.                                                                        | `ProfileViewDenied`                       | Saved entry cannot open profile.          |

## 16.3 Admissions Discovery Invariants

| Invariant ID   | Rule                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------- |
| `STATE-ADM-01` | `OfficerUnapproved` cannot reach `SearchExecuted`.                                          |
| `STATE-ADM-02` | `ResultsReturned` must exclude unpublished, hidden, and consent-restricted profiles.        |
| `STATE-ADM-03` | `SafeViewRendered` requires `AccessPolicy.authorizeAdmissionsProfileView(...)`.             |
| `STATE-ADM-04` | `SafeViewRendered` requires `RowLevelSecurityPolicy.enforceProfileAccess(...)`.             |
| `STATE-ADM-05` | `ShortlistEntry.open(...)` must recheck current access.                                     |
| `STATE-ADM-06` | Denied sensitive access must call `AuditLogEntry.recordAccessDenied(...)`.                  |
| `STATE-ADM-07` | Approved AI output may be included only when `AIOutputPolicy.canDisplay(...)` returns true. |

---

# 17. State Machine Diagram Requirements

| Diagram                                      | Required State Models  | Required States                                                                                                                                                                                          |
| -------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `08_ai_contextualization_state_machine.puml` | `SM-10`, `SM-11`       | `NoConsent`, `ConsentActive`, `RequestCreated`, `PendingOutputStored`, `StudentAccepted`, `StudentRejected`, `HumanApproved`, `HumanRejected`, `AdmissionsVisible`, `HiddenAfterConsentWithdrawal`       |
| `11_student_profile_state_machine.puml`      | `SM-5`, `SM-6`, `SM-7` | `Draft`, `Incomplete`, `CompleteUnpublished`, `BlockedUnverifiedEmail`, `BlockedMissingConsent`, `PublishedVisible`, `PublishedHidden`, `Unpublished`, `UpdatedSinceLastViewed`                          |
| `06_counselor_verification_sequence.puml`    | `SM-3`, `SM-4`         | `Created`, `Sent`, `Validated`, `Consumed`, `PendingVerification`, `InVerificationQueue`, `Verified`, `Denied`, `Suspended`                                                                              |
| `07_transcript_support_activity.puml`        | `SM-8`, `SM-9`         | `Created`, `AssignedToCounselor`, `BlockedUnverifiedCounselor`, `BlockedSchoolMismatch`, `SchoolInfoSupported`, `ValidationPending`, `Rejected`, `StoredProtected`, `TranscriptSubmitted`, `Submitted`   |
| `10_admissions_search_sequence.puml`         | `SM-12`                | `OfficerUnapproved`, `SearchAuthorized`, `SearchExecuted`, `EmptyResults`, `ResultsReturned`, `ProfileViewDenied`, `ProfileViewAuthorized`, `SafeViewRendered`, `Shortlisted`, `ShortlistEntryRechecked` |
| `05_counselor_student_link_state_machine.puml` (Batch 3) | `SM-13`    | `Requested`, `Accepted`, `Declined`, `Revoked` |
| `05_counselor_review_request_state_machine.puml` (Batch 4) | `SM-14`  | `Requested`, `Completed`, `Declined`, `Withdrawn` |

---

# 18. Required PlantUML Transition Label Format

State machine transitions must use this format:

```plantuml
SourceState --> TargetState : Object.method(parameters): ReturnType\n[guard condition]
```

Examples:

```plantuml
Draft --> CompleteUnpublished : StudentProfile.checkRequiredSectionsComplete(): boolean\n[required sections complete]

CompleteUnpublished --> PublishedVisible : StudentProfile.publish(): StudentProfile\n[email verified + consent active + visibility enabled]

PublishedVisible --> Unpublished : StudentProfile.unpublish(): StudentProfile

PendingOutputStored --> StudentAccepted : StudentAIReviewDecision.accept(output: AIContextualizationOutput): StudentAIReviewDecision

StudentAccepted --> HumanApproved : HumanReviewDecision.approve(reviewer: UserAccount, output: AIContextualizationOutput, note: string): HumanReviewDecision

HumanApproved --> AdmissionsVisible : AIOutputPolicy.canDisplay(output: AIContextualizationOutput): boolean\n[student accepted + human approved + consent active]
```

---

# 19. Required Blocked-State Patterns

| Blocked State                   | Required Trigger                                                                                    |                             Required Audit? |
| ------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------: |
| `BlockedUnverifiedEmail`        | `UserAccount.blockProfilePublishingUntilVerified(): Void`                                           |                                          No |
| `BlockedMissingConsent`         | `ConsentSettings.update(aiConsent: boolean, admissionsVisibilityConsent: boolean): ConsentSettings` |                                          No |
| `BlockedUnverifiedCounselor`    | `AccessPolicy.blockUnverifiedCounselor(counselor: CounselorProfile): Void`                          | Yes, if access attempt targets student data |
| `BlockedSchoolMismatch`         | `AccessPolicy.blockSchoolMismatch(counselor: CounselorProfile, profile: StudentProfile): Void`      |                                         Yes |
| `BlockedSelfVerifiedTranscript` | `StudentProfile.preventSelfVerifiedTranscriptUpload(): Void`                                        |                                         Yes |
| `BlockedUnreviewed`             | `AIOutputPolicy.blockUnreviewedOutput(output: AIContextualizationOutput): Void`                     |               Yes, if display was attempted |
| `BlockedRejected`               | `AIOutputPolicy.blockRejectedOutput(output: AIContextualizationOutput): Void`                       |               Yes, if display was attempted |
| `ProfileViewDenied`             | `AccessPolicy.blockUnauthorizedProfileAccess(user: UserAccount, profile: StudentProfile): Void`     |                                         Yes |

---

# 20. State Security Traceability

| Security Rule | Related State Model | Required State Behavior                                                                         |
| ------------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| `SEC-CORE-01` | `SM-5`, `SM-12`     | Student profile data cannot be visible unless access checks pass.                               |
| `SEC-CORE-04` | `SM-12`             | Admissions profile access requires current publication, visibility, consent, and authorization. |
| `SEC-CORE-07` | `SM-11`             | AI output cannot become `AdmissionsVisible` without student acceptance and human approval.      |
| `SEC-CORE-09` | `SM-4`, `SM-8`      | Verified counselors can only access same-school students.                                       |
| `SEC-CORE-11` | `SM-9`              | Transcript files cannot be stored before validation.                                            |
| `SEC-AI-03`   | `SM-11`             | AI output must be stored as pending.                                                            |
| `SEC-AI-07`   | `SM-11`             | Rejected AI output must remain hidden.                                                          |
| `SEC-ADM-07`  | `SM-12`             | Shortlist entries must recheck current access.                                                  |
| `SEC-FILE-03` | `SM-9`              | Uploaded files must be validated before storage.                                                |
| `SEC-CNS-05`  | `SM-4`              | Pending counselors cannot access student rosters.                                               |

---

# 21. Misuse Case Traceability

| Misuse Case                                                 | Related State Models    | State-Level Defense                                                                                                                   |
| ----------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `MC-1 Account Creation Abuse`                               | `SM-1`, `SM-2`, `SM-5`  | Unverified accounts remain restricted and cannot publish profiles.                                                                    |
| `MC-2 Invitation Link Interception / Identity Substitution` | `SM-3`, `SM-4`          | Invalid, expired, consumed, or email-mismatched invitations enter `Rejected`; counselors remain `PendingVerification` until approved. |
| `MC-3 Manipulative Profile Submission`                      | `SM-5`, `SM-7`          | Student content remains self-reported unless counselor or transcript support is applied by authorized workflow.                       |
| `MC-4 Malicious / Incorrect Transcript Upload`              | `SM-8`, `SM-9`          | Wrong-school or unverified counselor paths enter blocked states; invalid files enter `Rejected`.                                      |
| `MC-5 AI Prompt Manipulation or Unreviewed AI Output`       | `SM-10`, `SM-11`        | AI output remains hidden unless consent, student acceptance, human approval, and AI label exist.                                      |
| `MC-6 Unauthorized Profile Access & Consent Bypass`         | `SM-5`, `SM-6`, `SM-12` | Hidden, unpublished, consent-restricted, or unauthorized profile requests enter denied or excluded states.                            |

---

# 22. State Catalog Maintenance Rules

| Rule ID      | Rule                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------ |
| `STATE-M-01` | If a new workflow object is added, decide whether it needs a state model.                  |
| `STATE-M-02` | If a method changes in `recruitbook_method_catalog.md`, update affected transition labels. |
| `STATE-M-03` | If a security rule changes, update blocked states and guard conditions.                    |
| `STATE-M-04` | If a misuse case changes, update Section 21.                                               |
| `STATE-M-05` | If a new diagram is added, update Section 17.                                              |
| `STATE-M-06` | Do not add states that cannot be reached by approved methods or security rules.            |
| `STATE-M-07` | Do not remove blocked states that represent required security controls.                    |
| `STATE-M-08` | Keep AI visibility states separate from student narrative states.                          |
| `STATE-M-09` | Keep admissions safe-view states separate from raw `StudentProfile` states.                |
| `STATE-M-10` | Keep counselor verification states separate from counselor account registration states.    |

---

# 23. SM-13 Counselor Student Link State Model (Batch 3 — Counselor Connection Foundation)

Placed here as an additive Batch 3 section so the master sections 1–22 keep their numbers and cross-references. This is the authoritative lifecycle for `CounselorStudentLink`, the per-student consent edge introduced in Batch 3. It is a **prototype refinement** of the school-match model: an accepted link — not a `HighSchool` match — grants a verified counselor SELECT-only visibility of a student profile. Satisfies `STATE-R-09` (pending/verified/denied/suspended counselors are distinguished by the verified-counselor guard on accept/decline).

## 23.1 CounselorStudentLink States

| State       | DB enum (`status`) | Meaning                                                                                              |
| ----------- | ------------------ | ---------------------------------------------------------------------------------------------------- |
| `Requested` | `pending`          | Student created a link request addressed to a counselor email; `counselor_application_user_id` is NULL. No visibility granted. |
| `Accepted`  | `accepted`         | A verified counselor addressed by the email accepted; `counselor_application_user_id` is bound. Grants SELECT-only profile visibility. |
| `Declined`  | `declined`         | The addressed verified counselor declined; `counselor_application_user_id` is bound (records who declined). Terminal. No visibility. A new request creates a NEW row. |
| `Revoked`   | `revoked`          | The owning student revoked a Requested or Accepted link. Terminal. Visibility removed immediately. A new request creates a NEW row. |

State-name note: `Requested` is used in diagrams/catalog per `STATE-R-05`/`STATE-R-06` (avoids a bare "Pending"); the database enum value remains `pending`.

## 23.2 CounselorStudentLink Transitions

| From State  | Trigger Method                                                          | Guard Condition                                                                                                             | To State    | Security Result                                                     |
| ----------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------- |
| `[*]`       | `CounselorStudentLink.request(student: ApplicationUser, counselorEmail: string): CounselorStudentLink` | Caller is an active student; row is forced to `status='pending'` with `counselor_application_user_id` NULL; no counselor lookup at insert. | `Requested` | Request recorded. No counselor-existence oracle.                    |
| `Requested` | `CounselorStudentLink.accept(counselor: ApplicationUser): CounselorStudentLink`  | Caller is a **verified** counselor whose email equals `counselor_email`; self-binds `counselor_application_user_id = current_application_user_id()` (CAS; zero rows ⇒ stale/foreign ⇒ generic error). | `Accepted`  | Verified addressed counselor gains SELECT-only visibility.          |
| `Requested` | `CounselorStudentLink.decline(counselor: ApplicationUser): CounselorStudentLink` | Caller is a **verified** counselor whose email equals `counselor_email`; self-binds `counselor_application_user_id = current_application_user_id()` (CAS; records who declined).                                                    | `Declined`  | Terminal; no visibility. Reveals counselor existence only by the counselor's own act. |
| `Requested` | `CounselorStudentLink.revoke(student: ApplicationUser): CounselorStudentLink`    | Caller owns the link (`student_application_user_id = current_application_user_id()`).                                       | `Revoked`   | Terminal; request withdrawn.                                        |
| `Accepted`  | `CounselorStudentLink.revoke(student: ApplicationUser): CounselorStudentLink`    | Caller owns the link.                                                                                                       | `Revoked`   | Visibility removed immediately (helper tests `status='accepted'` at query time). |

Terminal states `Declined` and `Revoked` do not transition back; a fresh `request(...)` creates a NEW row (the unique-active-pair constraint is scoped to active statuses).

## 23.3 CounselorStudentLink Invariants

| Invariant ID   | Rule                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `STATE-CSL-01` | A student cannot self-accept: `request(...)` forces `status='pending'` + NULL counselor id; students have no accept/decline transition. |
| `STATE-CSL-02` | A counselor cannot create a link; only a student `request(...)` reaches `Requested`.                             |
| `STATE-CSL-03` | Only a **verified** counselor addressed by `counselor_email` may `accept(...)` or `decline(...)`; pending/denied/suspended counselors are blocked (`STATE-R-09`). |
| `STATE-CSL-04` | Counselor profile access is SELECT-only and only while a link is `Accepted`; there is no counselor write path to profile data. |
| `STATE-CSL-05` | `Revoked` (and `Declined`) remove visibility immediately; the ownership helper checks `status='accepted'` at query time. |
| `STATE-CSL-06` | Admissions officers have no transition and no read access to `CounselorStudentLink` or linked profile data (deny-by-default). |
| `STATE-CSL-07` | `platform_admin` has SELECT-only visibility of link rows in Batch 3 and no write transition (no confused-deputy write path). |

---

# 24. SM-14 Counselor Review Request State Model (Batch 4 — Counselor Review Workflow)

Placed here as an additive Batch 4 section so the master sections 1–23 keep their numbers and cross-references. This is the authoritative lifecycle for `CounselorReviewRequest`, the student-initiated review request introduced in Batch 4 — the first counselor WRITE surface. All counselor transitions additionally require the request's anchoring `CounselorStudentLink` to be `Accepted` **at query time** (SM-13 remains the consent authority). Satisfies `STATE-R-09` (pending/verified/denied/suspended counselors are distinguished by the verified-counselor guard on decline/complete).

## 24.1 CounselorReviewRequest States

| State       | DB enum (`status`) | Meaning                                                                                              |
| ----------- | ------------------ | ---------------------------------------------------------------------------------------------------- |
| `Requested` | `requested`        | Student submitted their profile for review to one accepted-linked counselor. Awaiting counselor response. If the underlying link is later revoked, the row stays `Requested` but is invisible/unactionable to the counselor (live-link gate); a NEW link does not revive it. |
| `Completed` | `completed`        | The addressed verified counselor completed the review; exactly one immutable `CounselorFeedbackNote` exists (`request_id` unique). Terminal. |
| `Declined`  | `declined`         | The addressed verified counselor declined to review. No feedback note. Terminal. A fresh submission creates a NEW row. |
| `Withdrawn` | `withdrawn`        | The owning student withdrew the request before a response. Terminal. A fresh submission creates a NEW row. |

State-name note: the DB enum value is `requested` — deliberately NOT `pending` — so `counselor_review_requests.status` can never be confused with `counselor_student_links.status='pending'` in SQL or policies.

## 24.2 CounselorReviewRequest Transitions

| From State  | Trigger Method                                                          | Guard Condition                                                                                                             | To State    | Security Result                                                     |
| ----------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------- |
| `[*]`       | `CounselorReviewRequest.submit(student: ApplicationUser, link: CounselorStudentLink, studentMessage?: string): CounselorReviewRequest` | Caller is an active student who OWNS the link and the link is `Accepted` (`is_student_owner_of_accepted_link(link_id)`); party ids are copied from the link row, never from the form; forced `status='requested'`; at most one active request per link. | `Requested` | Request recorded. No enumeration surface (student picks from own links). |
| `Requested` | `CounselorReviewRequest.complete(counselor: ApplicationUser, feedbackText: string): CounselorReviewRequest` | Caller is the **addressed** verified counselor with a **live** accepted link (`is_counselor_of_live_accepted_link(link_id)`); feedback note is inserted FIRST (immutable, `request_id` unique), then the status CAS runs (zero rows ⇒ stale/foreign ⇒ generic error). | `Completed` | Feedback becomes readable by the owning student (forever) and by the counselor (while the link stays Accepted). |
| `Requested` | `CounselorReviewRequest.decline(counselor: ApplicationUser): CounselorReviewRequest` | Caller is the **addressed** verified counselor with a **live** accepted link (CAS; zero rows ⇒ generic error).              | `Declined`  | Terminal; no feedback note.                                          |
| `Requested` | `CounselorReviewRequest.withdraw(student: ApplicationUser): CounselorReviewRequest` | Caller owns the request (`student_application_user_id = current_application_user_id()`); WITH CHECK forces `status='withdrawn'`. | `Withdrawn` | Terminal; request withdrawn.                                         |

Terminal states `Completed`, `Declined`, and `Withdrawn` do not transition back; a fresh `submit(...)` creates a NEW row (the unique-active constraint is scoped to `status='requested'`).

## 24.3 CounselorReviewRequest Invariants

| Invariant ID   | Rule                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `STATE-CRR-01` | A student cannot reach `Completed` or `Declined`: the student UPDATE policy's WITH CHECK permits only `withdrawn`. |
| `STATE-CRR-02` | A counselor cannot `submit(...)` or `withdraw(...)` a request; only the owning student may.                       |
| `STATE-CRR-03` | Only the **addressed** verified counselor whose anchoring link is `Accepted` AT QUERY TIME may `complete(...)`/`decline(...)`; revocation removes queue visibility, response ability, feedback write, and the counselor's read of their own past notes immediately. |
| `STATE-CRR-04` | `CounselorFeedbackNote` is immutable: no UPDATE or DELETE policy for any role, plus a table-wide UPDATE privilege revoke. Students have no INSERT policy on it (feedback is structurally unforgeable). |
| `STATE-CRR-05` | The student's SELECT of own requests and received feedback is ownership-only and SURVIVES link revocation (own history). |
| `STATE-CRR-06` | No stored review/profile state ever lands on `StudentProfile`; `CounselorReviewRequest.status` is the only stored state (Batch 2 derived-completion rule stands). |
| `STATE-CRR-07` | Counselor review writes touch ONLY the two Batch 4 tables; the Batch 3 SELECT-only boundary on all four profile tables is unchanged (regression-gated). |
| `STATE-CRR-08` | Admissions officers have no transition and no read access to either Batch 4 table (deny-by-default). `platform_admin` is SELECT-only with no write transition. |
