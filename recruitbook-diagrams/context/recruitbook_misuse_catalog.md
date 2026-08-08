# RecruitBook Misuse Catalog

This file defines RecruitBook misuse cases at the object, method, actor, trust-boundary, and security-control level.

Use this file together with:

* `context/recruitbook_object_catalog.md`
* `context/recruitbook_relationship_catalog.md`
* `context/recruitbook_method_catalog.md`
* `context/recruitbook_actor_matrix.md`
* `context/use_case_summary.md`
* `context/security_rules.md`
* `context/diagram_rules.md`
* `context/plantuml_style_guide.md`

---

# 1. Misuse Catalog Purpose

The misuse catalog defines how RecruitBook can be attacked, abused, or misused.

It is used to generate:

| Artifact                      | Misuse Catalog Role                                       |
| ----------------------------- | --------------------------------------------------------- |
| `03_misuse_case_diagram.puml` | Defines misuse cases, attackers, and mitigation links.    |
| `12_trust_boundary_dfd.puml`  | Maps attacks to trust boundaries and sensitive flows.     |
| STRIDE / threat model matrix  | Provides attack surfaces, impacted methods, and controls. |
| Sequence diagrams             | Adds failure paths, blocked paths, and audit events.      |
| Activity diagrams             | Adds validation, authorization, and rejection branches.   |
| Secure implementation prompts | Gives AI precise method-level guardrails.                 |

---

# 2. Misuse Catalog Rules

| Rule ID   | Rule                                                                                                 |
| --------- | ---------------------------------------------------------------------------------------------------- |
| `MC-R-01` | Use exact object names from `recruitbook_object_catalog.md`.                                         |
| `MC-R-02` | Use exact method signatures from `recruitbook_method_catalog.md`.                                    |
| `MC-R-03` | Do not create generic controls when an approved method already exists.                               |
| `MC-R-04` | Every misuse case must identify targeted methods and required defensive methods.                     |
| `MC-R-05` | Every misuse case must map to at least one trust boundary.                                           |
| `MC-R-06` | Every misuse case must map to one or more STRIDE categories.                                         |
| `MC-R-07` | Every misuse case involving denied access should identify the required audit method.                 |
| `MC-R-08` | Do not treat client-side checks as sufficient security controls.                                     |
| `MC-R-09` | Do not allow AI output, transcript evidence, search results, or shortlists to bypass policy objects. |
| `MC-R-10` | Use this catalog as the attacker-focused counterpart to `use_case_summary.md`.                       |

---

# 3. Threat Modeling Scope

| Scope Area                                  | Included in Prototype Threat Model? | Notes                                            |
| ------------------------------------------- | ----------------------------------: | ------------------------------------------------ |
| Account registration abuse                  |                                 Yes | Covered by MC-1.                                 |
| Email verification bypass                   |                                 Yes | Covered by MC-1.                                 |
| Counselor invitation interception           |                                 Yes | Covered by MC-2.                                 |
| Fraudulent counselor identity               |                                 Yes | Covered by MC-2.                                 |
| Misleading student profile submission       |                                 Yes | Covered by MC-3.                                 |
| Transcript upload abuse                     |                                 Yes | Covered by MC-4.                                 |
| Counselor same-school authorization failure |                                 Yes | Covered by MC-4.                                 |
| AI contextualization misuse                 |                                 Yes | Covered by MC-5.                                 |
| Unreviewed AI output exposure               |                                 Yes | Covered by MC-5.                                 |
| Admissions search access bypass             |                                 Yes | Covered by MC-6.                                 |
| Direct profile URL access                   |                                 Yes | Covered by MC-6.                                 |
| Shortlist consent bypass                    |                                 Yes | Covered by MC-6.                                 |
| Full production fraud detection             |                                  No | Not required for the 13-week prototype.          |
| Payment processing attacks                  |                                  No | RecruitBook prototype does not process payments. |
| Mobile app attack surface                   |                                  No | RecruitBook prototype is web-based.              |

---

# 4. Attacker Reference

| Attacker Type                | Description                                                                                    | Relevant Misuse Cases |
| ---------------------------- | ---------------------------------------------------------------------------------------------- | --------------------- |
| `AnonymousAttacker`          | Unauthenticated visitor attempting account abuse or token misuse.                              | MC-1, MC-2            |
| `UnverifiedStudentAccount`   | Student account that has not completed email verification.                                     | MC-1, MC-3            |
| `MaliciousStudent`           | Student attempting to misrepresent profile information or trust status.                        | MC-3                  |
| `InvitationInterceptor`      | Attacker who obtains or guesses a counselor invitation link.                                   | MC-2                  |
| `FakeCounselor`              | User attempting to register as a counselor without legitimate school authority.                | MC-2, MC-4            |
| `PendingCounselor`           | Counselor account attempting access before verification.                                       | MC-2, MC-4            |
| `WrongSchoolCounselor`       | Verified counselor attempting to access a student outside their high school.                   | MC-4                  |
| `MaliciousAdmissionsUser`    | Admissions-side user attempting to access hidden, unpublished, or consent-restricted profiles. | MC-6                  |
| `PromptInjectionAttacker`    | User attempting to manipulate AI contextualization output through narrative fields.            | MC-5                  |
| `CompromisedExternalService` | External service behavior that must not be trusted to authorize access or publish data.        | MC-5, MC-6            |

---

# 5. Misuse Case Summary Table

| Misuse Case ID | Title                                                | Threatened Use Case | Primary Target Objects                                                                                                                       | Primary Target Methods                                                                                                                                                                                                                                                                                                                           | STRIDE Categories                                         |
| -------------- | ---------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| `MC-1` | Account Creation Abuse | UC-1 | `UserAccount`, `Role`, `EmailVerificationToken`, `StudentProfile`, `SearchIndex`, `AuditLogEntry` | `UserAccount.register(email: string, password: string, role: Role): EmailVerificationToken`; `UserAccount.assignRole(role: Role): UserAccount`; `UserAccount.authenticate(email: string, password: string): UserAccount`; `EmailVerificationToken.validate(): boolean`; `EmailVerificationToken.markConsumed(): EmailVerificationToken`; `UserAccount.verifyEmail(token: EmailVerificationToken): UserAccount`; `StudentProfile.publish(): StudentProfile`; `SearchIndex.indexProfile(profile: StudentProfile): Void` | Spoofing, Denial of Service, Elevation of Privilege |
| `MC-2` | Invitation Link Interception / Identity Substitution | UC-2 | `CounselorInvitation`, `CounselorProfile`, `HighSchool`, `VerificationQueueItem`, `VerificationDecision` | `CounselorInvitation.validate(email: string): boolean`; `CounselorProfile.registerFromInvitation(invitation: CounselorInvitation, fullName: string, password: string): CounselorProfile`; `CounselorProfile.bindToHighSchool(highSchool: HighSchool): CounselorProfile`; `CounselorProfile.markVerified(decision: VerificationDecision): CounselorProfile` | Spoofing, Tampering, Elevation of Privilege |
| `MC-3`         | Manipulative Profile Submission                      | UC-3                | `StudentProfile`, `AcademicRecord`, `ProfileItem`, `NarrativeResponse`, `VerificationTier`, `SelfReportedLabel`                              | `StudentProfile.addAcademicRecord(record: AcademicRecord): StudentProfile`; `StudentProfile.addProfileItem(item: ProfileItem): StudentProfile`; `VerificationTier.updateFromSupport(supportType: string): VerificationTier`                                                                                                                      | Tampering, Repudiation, Information Disclosure            |
| `MC-4`         | Malicious / Incorrect Transcript Upload              | UC-4                | `TranscriptSupportRequest`, `UploadedFile`, `Transcript`, `VerificationTier`, `ObjectStorage`                                                | `TranscriptSupportRequest.submitTranscript(counselor: CounselorProfile, file: UploadedFile): TranscriptSupportRequest`; `FileValidationRule.validate(file: UploadedFile): boolean`; `ObjectStorage.storeProtectedFile(file: UploadedFile): string`                                                                                               | Tampering, Information Disclosure, Elevation of Privilege |
| `MC-5`         | AI Prompt Manipulation or Unreviewed AI Output       | UC-5                | `NarrativeResponse`, `AIConsentRecord`, `AIContextualizationRequest`, `AIContextualizationOutput`, `AIOutputPolicy`, `AdmissionsProfileView` | `AIContextualizationRequest.create(studentProfile: StudentProfile, selectedFields: List<NarrativeResponse>, consent: AIConsentRecord): AIContextualizationRequest`; `AIOutputPolicy.canDisplay(output: AIContextualizationOutput): boolean`; `AdmissionsProfileView.includeApprovedAI(output: AIContextualizationOutput): AdmissionsProfileView` | Tampering, Information Disclosure, Repudiation            |
| `MC-6`         | Unauthorized Profile Access & Consent Bypass         | UC-6                | `StudentProfile`, `ProfileVisibilitySettings`, `ConsentSettings`, `AdmissionsProfileView`, `ShortlistEntry`, `RowLevelSecurityPolicy`        | `StudentDiscoverySearch.execute(filters: List<SearchFilter>): List<StudentProfile>`; `AccessPolicy.authorizeAdmissionsProfileView(officer: AdmissionsOfficerProfile, profile: StudentProfile): boolean`; `ShortlistEntry.open(officer: AdmissionsOfficerProfile): AdmissionsProfileView`                                                         | Information Disclosure, Elevation of Privilege, Tampering |

---

# 6. Trust Boundary Reference

| Boundary ID | Boundary                                  | Relevant Misuse Cases  | Primary Risk                                                       |
| ----------- | ----------------------------------------- | ---------------------- | ------------------------------------------------------------------ |
| `TB-1`      | Browser / RecruitBookApp                  | MC-1, MC-2, MC-3, MC-6 | Client-side request manipulation, forged roles, direct URL access. |
| `TB-2`      | RecruitBookApp / Database                 | MC-3, MC-6             | Unauthorized row access, consent bypass, hidden profile exposure.  |
| `TB-3`      | RecruitBookApp / ObjectStorage            | MC-4                   | Unsafe transcript file upload or public file exposure.             |
| `TB-4`      | RecruitBookApp / EmailService             | MC-1, MC-2             | Verification token leakage or invitation misuse.                   |
| `TB-5`      | RecruitBookApp / AIService                | MC-5                   | Oversharing student data or accepting unreviewed AI output.        |
| `TB-6` | RecruitBookApp / SearchIndex | MC-1, MC-3, MC-6 | Hidden, unpublished, unverified, or consent-restricted profiles indexed. |
| `TB-7`      | AdmissionsOfficer / AdmissionsProfileView | MC-6                   | Direct access, old shortlist access, or consent bypass.            |
| `TB-8`      | Counselor / TranscriptSupportRequest      | MC-2, MC-4             | Pending counselor access or wrong-school counselor access.         |

---

# 7. MC-1 Account Creation Abuse

## 7.1 MC-1 Summary

| Field                    | Value                                                                                                                                                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Misuse Case ID           | `MC-1`                                                                                                                                                                                                                                                                    |
| Title                    | Account Creation Abuse                                                                                                                                                                                                                                                    |
| Threatened Use Case      | UC-1 Student Registration & Email Verification                                                                                                                                                                                                                            |
| Primary Attacker         | `AnonymousAttacker`                                                                                                                                                                                                                                                       |
| Secondary Attacker       | `UnverifiedStudentAccount`                                                                                                                                                                                                                                                |
| Security Goal Violated   | Authentication integrity, registration integrity, profile publication integrity                                                                                                                                                                                           |
| Primary Target Objects   | `UserAccount`, `Role`, `EmailVerificationToken`, `StudentProfile`, `SearchIndex`, `AuditLogEntry`                                                                                                                                                                         |
| Primary Target Methods   | `UserAccount.register(email: string, password: string, role: Role): EmailVerificationToken`; `UserAccount.verifyEmail(token: EmailVerificationToken): UserAccount`; `StudentProfile.publish(): StudentProfile`; `SearchIndex.indexProfile(profile: StudentProfile): Void` |
| Primary Trust Boundaries | `TB-1`, `TB-4`, `TB-6`                                                                                                                                                                                                                                                    |
| STRIDE Categories        | Spoofing, Denial of Service, Elevation of Privilege                                                                                                                                                                                                                       |
| Expected Security Result | Account may be created only under registration rules; unverified or suspicious accounts cannot publish profiles or enter admissions search.                                                                                                                               |

---

## 7.2 MC-1 Attack Objectives

| Objective ID | Attacker Objective                                                   | Target Object                              | Target Method                                                                                                     |
| ------------ | -------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `MC-1-AO-01` | Create many accounts using disposable or automated email identities. | `UserAccount`                              | `UserAccount.register(email: string, password: string, role: Role): EmailVerificationToken`                       |
| `MC-1-AO-02` | Skip email verification and publish a student profile.               | `EmailVerificationToken`, `StudentProfile` | `UserAccount.verifyEmail(token: EmailVerificationToken): UserAccount`; `StudentProfile.publish(): StudentProfile` |
| `MC-1-AO-03` | Assign a privileged role during registration.                        | `Role`, `UserAccount`                      | `UserAccount.assignRole(role: Role): UserAccount`                                                                 |
| `MC-1-AO-04` | Force unverified profiles into admissions discovery.                 | `SearchIndex`, `StudentProfile`            | `SearchIndex.indexProfile(profile: StudentProfile): Void`                                                         |
| `MC-1-AO-05` | Reuse or replay an email verification token.                         | `EmailVerificationToken`                   | `EmailVerificationToken.validate(): boolean`; `EmailVerificationToken.markConsumed(): EmailVerificationToken`     |

---

## 7.3 MC-1 Attack Path

| Step | Attacker Action                                                | Targeted Method                                                                             | Expected Defensive Response                                                                               |
| ---: | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
|    1 | Submit repeated automated registration requests.               | `UserAccount.register(email: string, password: string, role: Role): EmailVerificationToken` | Validate email format, password strength, duplicate account status, role restrictions, and rate limiting. |
|    2 | Attempt to register with privileged role value.                | `UserAccount.assignRole(role: Role): UserAccount`                                           | Counselor and admissions roles cannot self-grant privileged access.                                       |
|    3 | Attempt to authenticate before verification.                   | `UserAccount.authenticate(email: string, password: string): UserAccount`                    | Authentication may succeed only within restricted account state if email remains unverified.              |
|    4 | Attempt to publish profile before verification.                | `StudentProfile.publish(): StudentProfile`                                                  | `UserAccount.blockProfilePublishingUntilVerified(): Void` blocks publication.                             |
|    5 | Attempt to reuse expired or consumed verification token.       | `EmailVerificationToken.validate(): boolean`                                                | `EmailVerificationToken.rejectInvalidOrExpired(): Void` throws `VerificationError`.                       |
|    6 | Attempt to enter search index without valid publication state. | `SearchIndex.indexProfile(profile: StudentProfile): Void`                                   | System indexes only published, visible, consent-allowed profiles.                                         |
|    7 | Abuse behavior is detected.                                    | `UserAccount.suspend(reason: string, actor: UserAccount): UserAccount`                      | Platform administrator or system workflow suspends account and records audit event.                       |

---

## 7.4 MC-1 Required Defensive Methods

| Defensive Method                                                                                                           | Required Condition                                                    | Failure Result                       |
| -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------ |
| `UserAccount.register(email: string, password: string, role: Role): EmailVerificationToken`                                | Email, password, duplicate account, role, and rate-limit checks pass. | Registration rejected or restricted. |
| `EmailVerificationToken.validate(): boolean`                                                                               | Token authentic, unused, unexpired, single-use, and account-bound.    | Verification denied.                 |
| `EmailVerificationToken.rejectInvalidOrExpired(): Void`                                                                    | Token invalid, expired, or already used.                              | Throws `VerificationError`.          |
| `EmailVerificationToken.markConsumed(): EmailVerificationToken`                                                            | Token validation succeeds.                                            | Token replay prevented.              |
| `UserAccount.markEmailVerified(): UserAccount`                                                                             | Valid token has been accepted.                                        | Account remains unverified.          |
| `UserAccount.blockProfilePublishingUntilVerified(): Void`                                                                  | User account email not verified.                                      | Profile publication blocked.         |
| `StudentProfile.checkRequiredSectionsComplete(): boolean`                                                                  | Required fields complete before publication.                          | Publication blocked.                 |
| `SearchIndex.indexProfile(profile: StudentProfile): Void`                                                                  | Profile is published, visible, and consent-allowed.                   | Profile not indexed.                 |
| `AuditLogEntry.recordSecurityEvent(actor: UserAccount, eventType: string, target: object, outcome: string): AuditLogEntry` | Suspicious or abusive event occurs.                                   | Security event recorded.             |

---

## 7.5 MC-1 Protected Security Properties

| Security Property        | Enforcement                                                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Authentication integrity | `EmailVerificationToken.validate(): boolean`; `UserAccount.markEmailVerified(): UserAccount`                               |
| Role integrity           | `UserAccount.assignRole(role: Role): UserAccount`; `AccessPolicy.requireRole(user: UserAccount, role: Role): Void`         |
| Publication integrity    | `UserAccount.blockProfilePublishingUntilVerified(): Void`; `StudentProfile.publish(): StudentProfile`                      |
| Search-index integrity   | `SearchIndex.indexProfile(profile: StudentProfile): Void`; `SearchIndex.removeProfile(profile: StudentProfile): Void`      |
| Auditability             | `AuditLogEntry.recordSecurityEvent(actor: UserAccount, eventType: string, target: object, outcome: string): AuditLogEntry` |

---

## 7.6 MC-1 Diagram Requirements

| Diagram                                 | Required Representation                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------- |
| `03_misuse_case_diagram.puml`           | Show `Attacker` attempting account abuse against UC-1.                                |
| `12_trust_boundary_dfd.puml`            | Show `TB-1`, `TB-4`, and `TB-6`.                                                      |
| `11_student_profile_state_machine.puml` | Show blocked publication when email is unverified.                                    |
| `05_student_profile_activity.puml`      | Include `UserAccount.blockProfilePublishingUntilVerified(): Void` before publication. |

---

# 8. MC-2 Invitation Link Interception / Identity Substitution

## 8.1 MC-2 Summary

| Field                    | Value                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Misuse Case ID           | `MC-2`                                                                                                                                                                                                                                                                                                                                                     |
| Title                    | Invitation Link Interception / Identity Substitution                                                                                                                                                                                                                                                                                                       |
| Threatened Use Case      | UC-2 Counselor Onboarding & Verification                                                                                                                                                                                                                                                                                                                   |
| Primary Attacker         | `InvitationInterceptor`                                                                                                                                                                                                                                                                                                                                    |
| Secondary Attacker       | `FakeCounselor`                                                                                                                                                                                                                                                                                                                                            |
| Security Goal Violated   | Counselor identity integrity, school trust integrity, privileged role integrity                                                                                                                                                                                                                                                                            |
| Primary Target Objects   | `CounselorInvitation`, `CounselorProfile`, `HighSchool`, `VerificationQueueItem`, `VerificationDecision`, `AuditLogEntry`                                                                                                                                                                                                                                  |
| Primary Target Methods   | `CounselorInvitation.validate(email: string): boolean`; `CounselorProfile.registerFromInvitation(invitation: CounselorInvitation, fullName: string, password: string): CounselorProfile`; `CounselorProfile.bindToHighSchool(highSchool: HighSchool): CounselorProfile`; `CounselorProfile.markVerified(decision: VerificationDecision): CounselorProfile` |
| Primary Trust Boundaries | `TB-1`, `TB-4`, `TB-8`                                                                                                                                                                                                                                                                                                                                     |
| STRIDE Categories        | Spoofing, Tampering, Elevation of Privilege                                                                                                                                                                                                                                                                                                                |
| Expected Security Result | Invitation misuse is blocked; counselor account remains pending until platform administrator verification succeeds.                                                                                                                                                                                                                                        |

---

## 8.2 MC-2 Attack Objectives

| Objective ID | Attacker Objective                                                  | Target Object                                  | Target Method                                                                                                                    |
| ------------ | ------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `MC-2-AO-01` | Use intercepted counselor invitation link.                          | `CounselorInvitation`                          | `CounselorInvitation.validate(email: string): boolean`                                                                           |
| `MC-2-AO-02` | Register as counselor using a different email identity.             | `CounselorProfile`                             | `CounselorProfile.registerFromInvitation(invitation: CounselorInvitation, fullName: string, password: string): CounselorProfile` |
| `MC-2-AO-03` | Bind counselor account to a high school not assigned in invitation. | `HighSchool`, `CounselorProfile`               | `CounselorProfile.bindToHighSchool(highSchool: HighSchool): CounselorProfile`                                                    |
| `MC-2-AO-04` | Consume invitation before legitimate counselor can use it.          | `CounselorInvitation`                          | `CounselorInvitation.markConsumed(): CounselorInvitation`                                                                        |
| `MC-2-AO-05` | Gain roster or transcript access before verification.               | `CounselorProfile`, `TranscriptSupportRequest` | `AccessPolicy.requireVerifiedCounselor(counselor: CounselorProfile): Void`                                                       |
| `MC-2-AO-06` | Obtain verified counselor status without administrator review.      | `VerificationDecision`, `CounselorProfile`     | `CounselorProfile.markVerified(decision: VerificationDecision): CounselorProfile`                                                |

---

## 8.3 MC-2 Attack Path

| Step | Attacker Action                                                                                   | Targeted Method                                                                                                                  | Expected Defensive Response                                                                     |
| ---: | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
|    1 | Obtain counselor invitation URL from email forwarding, browser history, or accidental disclosure. | `CounselorInvitation.validate(email: string): boolean`                                                                           | Invitation must be authentic, unused, unexpired, email-bound, and school-bound.                 |
|    2 | Submit registration form using email not bound to invitation.                                     | `CounselorProfile.registerFromInvitation(invitation: CounselorInvitation, fullName: string, password: string): CounselorProfile` | Registration fails because invitation email does not match.                                     |
|    3 | Attempt to bind account to a different high school.                                               | `CounselorProfile.bindToHighSchool(highSchool: HighSchool): CounselorProfile`                                                    | Binding must match invitation-bound `HighSchool`.                                               |
|    4 | Attempt to reuse invitation after consumption.                                                    | `CounselorInvitation.validate(email: string): boolean`                                                                           | `CounselorInvitation.rejectInvalidOrConsumed(email: string): Void` rejects consumed invitation. |
|    5 | Register successfully but attempt dashboard access before approval.                               | `CounselorProfile.openStudentRoster(): List<StudentProfile>`                                                                     | `AccessPolicy.blockUnverifiedCounselor(counselor: CounselorProfile): Void` blocks access.       |
|    6 | Attempt to mark profile verified without admin decision.                                          | `CounselorProfile.markVerified(decision: VerificationDecision): CounselorProfile`                                                | Method requires approved `VerificationDecision`.                                                |
|    7 | Platform administrator denies suspicious counselor registration.                                  | `VerificationDecision.deny(admin: UserAccount, counselor: CounselorProfile, reason: string): VerificationDecision`               | Account remains restricted or suspended; audit entry created.                                   |

---

## 8.4 MC-2 Required Defensive Methods

| Defensive Method                                                                                                                             | Required Condition                                                      | Failure Result                               |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------- |
| `CounselorInvitation.create(admin: UserAccount, counselorEmail: string, counselorName: string, highSchool: HighSchool): CounselorInvitation` | Platform administrator creates invitation.                              | Invitation is not created.                   |
| `CounselorInvitation.validate(email: string): boolean`                                                                                       | Invitation authentic, unused, unexpired, email-bound, and school-bound. | Registration blocked.                        |
| `CounselorInvitation.rejectInvalidOrConsumed(email: string): Void`                                                                           | Invitation invalid, expired, consumed, or email-mismatched.             | Throws `InvitationError`.                    |
| `CounselorInvitation.markConsumed(): CounselorInvitation`                                                                                    | Invitation validation succeeds.                                         | Invitation replay prevented.                 |
| `CounselorProfile.registerFromInvitation(invitation: CounselorInvitation, fullName: string, password: string): CounselorProfile`             | Invitation valid; email matches; password valid.                        | Counselor account not created.               |
| `CounselorProfile.bindToHighSchool(highSchool: HighSchool): CounselorProfile`                                                                | `HighSchool` matches invitation-bound school.                           | School binding denied.                       |
| `VerificationQueueItem.createForCounselor(counselor: CounselorProfile): VerificationQueueItem`                                               | Counselor registration succeeds.                                        | Counselor remains outside approval workflow. |
| `VerificationDecision.approve(admin: UserAccount, counselor: CounselorProfile, note: string): VerificationDecision`                          | Platform administrator approves after identity verification.            | Counselor remains pending.                   |
| `VerificationDecision.deny(admin: UserAccount, counselor: CounselorProfile, reason: string): VerificationDecision`                           | Platform administrator rejects suspicious registration.                 | Counselor remains restricted or suspended.   |
| `CounselorProfile.markVerified(decision: VerificationDecision): CounselorProfile`                                                            | Approved verification decision exists.                                  | Counselor remains pending or denied.         |
| `AccessPolicy.blockUnverifiedCounselor(counselor: CounselorProfile): Void`                                                                   | Counselor is pending, denied, suspended, or unverified.                 | Throws `AuthorizationError`.                 |
| `AuditLogEntry.record(actor: UserAccount, action: string, target: object, outcome: string): AuditLogEntry`                                   | Invitation, verification, denial, or suspension occurs.                 | Audit trail created.                         |

---

## 8.5 MC-2 Protected Security Properties

| Security Property         | Enforcement                                                                                                                                                                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invitation integrity      | `CounselorInvitation.validate(email: string): boolean`; `CounselorInvitation.markConsumed(): CounselorInvitation`                                                                                                                       |
| School-binding integrity  | `CounselorProfile.bindToHighSchool(highSchool: HighSchool): CounselorProfile`                                                                                                                                                           |
| Counselor trust integrity | `VerificationDecision.approve(admin: UserAccount, counselor: CounselorProfile, note: string): VerificationDecision`; `VerificationDecision.deny(admin: UserAccount, counselor: CounselorProfile, reason: string): VerificationDecision` |
| Roster access protection  | `AccessPolicy.blockUnverifiedCounselor(counselor: CounselorProfile): Void`; `AccessPolicy.requireVerifiedCounselor(counselor: CounselorProfile): Void`                                                                                  |
| Auditability              | `AuditLogEntry.record(actor: UserAccount, action: string, target: object, outcome: string): AuditLogEntry`                                                                                                                              |

---

## 8.6 MC-2 Diagram Requirements

| Diagram                                   | Required Representation                                                                                               |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `03_misuse_case_diagram.puml`             | Show `InvitationInterceptor` attacking `CounselorInvitation`.                                                         |
| `06_counselor_verification_sequence.puml` | Include valid invitation path and invalid/consumed invitation path.                                                   |
| `12_trust_boundary_dfd.puml`              | Show `TB-4` and `TB-8`.                                                                                               |
| `04_secure_domain_class_diagram.puml`     | Show `CounselorInvitation`, `CounselorProfile`, `VerificationQueueItem`, `VerificationDecision`, and `AuditLogEntry`. |

---

# 9. MC-3 Manipulative Profile Submission

## 9.1 MC-3 Summary

| Field                    | Value                                                                                                                                                                                                                                                                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Misuse Case ID           | `MC-3`                                                                                                                                                                                                                                                                                                                                   |
| Title                    | Manipulative Profile Submission                                                                                                                                                                                                                                                                                                          |
| Threatened Use Case      | UC-3 Student Profile Creation, Editing, Preview, and Publication                                                                                                                                                                                                                                                                         |
| Primary Attacker         | `MaliciousStudent`                                                                                                                                                                                                                                                                                                                       |
| Secondary Attacker       | `UnverifiedStudentAccount`                                                                                                                                                                                                                                                                                                               |
| Security Goal Violated   | Profile integrity, trust labeling, verification-tier integrity, admissions interpretation integrity                                                                                                                                                                                                                                      |
| Primary Target Objects   | `StudentProfile`, `AcademicRecord`, `ProfileItem`, `NarrativeResponse`, `VerificationTier`, `SelfReportedLabel`, `AdmissionsProfileView`, `SearchIndex`                                                                                                                                                                                  |
| Primary Target Methods   | `StudentProfile.addAcademicRecord(record: AcademicRecord): StudentProfile`; `StudentProfile.addProfileItem(item: ProfileItem): StudentProfile`; `NarrativeResponse.updateText(text: string): NarrativeResponse`; `VerificationTier.updateFromSupport(supportType: string): VerificationTier`; `StudentProfile.publish(): StudentProfile` |
| Primary Trust Boundaries | `TB-1`, `TB-2`, `TB-6`                                                                                                                                                                                                                                                                                                                   |
| STRIDE Categories        | Tampering, Repudiation, Information Disclosure                                                                                                                                                                                                                                                                                           |
| Expected Security Result | Student may submit profile information, but unsupported information remains self-reported and students cannot elevate verification status.                                                                                                                                                                                               |

---

## 9.2 MC-3 Attack Objectives

| Objective ID | Attacker Objective                                                              | Target Object                         | Target Method                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `MC-3-AO-01` | Submit inaccurate academic records as if verified.                              | `AcademicRecord`, `SelfReportedLabel` | `StudentProfile.addAcademicRecord(record: AcademicRecord): StudentProfile`; `SelfReportedLabel.applyTo(target: object): SelfReportedLabel` |
| `MC-3-AO-02` | Submit inflated achievements or activities without self-reported labeling.      | `ProfileItem`, `SelfReportedLabel`    | `StudentProfile.addProfileItem(item: ProfileItem): StudentProfile`; `SelfReportedLabel.applyTo(target: object): SelfReportedLabel`         |
| `MC-3-AO-03` | Use narrative text to imply unsupported verification or false academic context. | `NarrativeResponse`                   | `NarrativeResponse.updateText(text: string): NarrativeResponse`                                                                            |
| `MC-3-AO-04` | Directly set profile trust to counselor-supported or transcript-supported.      | `VerificationTier`                    | `VerificationTier.updateFromSupport(supportType: string): VerificationTier`                                                                |
| `MC-3-AO-05` | Upload self-provided transcript as official verified evidence.                  | `Transcript`, `VerificationTier`      | `StudentProfile.preventSelfVerifiedTranscriptUpload(): Void`                                                                               |
| `MC-3-AO-06` | Publish an incomplete or misleading profile into admissions discovery.          | `StudentProfile`, `SearchIndex`       | `StudentProfile.publish(): StudentProfile`; `SearchIndex.indexProfile(profile: StudentProfile): Void`                                      |

---

## 9.3 MC-3 Attack Path

| Step | Attacker Action                                                                      | Targeted Method                                                                                        | Expected Defensive Response                                                                     |
| ---: | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
|    1 | Add academic information without external support.                                   | `StudentProfile.addAcademicRecord(record: AcademicRecord): StudentProfile`                             | Academic record saved only as student-submitted data.                                           |
|    2 | System validates field format but does not mark data as verified.                    | `AcademicRecord.validate(gradingScale: GradingScale): boolean`                                         | Format validation passes or fails; truthfulness is not automatically verified.                  |
|    3 | System applies self-reported label.                                                  | `SelfReportedLabel.applyTo(target: object): SelfReportedLabel`                                         | Unsupported academic information receives self-reported status.                                 |
|    4 | Add inflated achievement or activity description.                                    | `StudentProfile.addProfileItem(item: ProfileItem): StudentProfile`                                     | Profile item remains self-reported unless later supported.                                      |
|    5 | Attempt to set verification tier directly.                                           | `VerificationTier.updateFromSupport(supportType: string): VerificationTier`                            | Student is denied; system updates only after verified counselor support or transcript evidence. |
|    6 | Attempt to upload own official transcript as verified evidence.                      | `StudentProfile.preventSelfVerifiedTranscriptUpload(): Void`                                           | Self-verified transcript path is blocked.                                                       |
|    7 | Attempt to publish incomplete profile.                                               | `StudentProfile.checkRequiredSectionsComplete(): boolean`                                              | Publication blocked if required sections are incomplete.                                        |
|    8 | Attempt to enter admissions search while hidden, unpublished, or consent-restricted. | `SearchIndex.indexProfile(profile: StudentProfile): Void`                                              | Search indexing occurs only if published, visible, and consent-allowed.                         |
|    9 | Admissions officer opens profile.                                                    | `AdmissionsProfileView.showSelfReportedLabels(labels: List<SelfReportedLabel>): AdmissionsProfileView` | Self-reported labels appear in admissions-facing view.                                          |

---

## 9.4 MC-3 Required Defensive Methods

| Defensive Method                                                                                       | Required Condition                                          | Failure Result                                    |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------- |
| `AcademicRecord.validate(gradingScale: GradingScale): boolean`                                         | Academic fields and grading scale format are valid.         | Academic record is rejected or corrected.         |
| `SelfReportedLabel.applyTo(target: object): SelfReportedLabel`                                         | Data lacks counselor or transcript support.                 | Admissions view must label data as self-reported. |
| `StudentProfile.checkRequiredSectionsComplete(): boolean`                                              | Required profile sections are complete.                     | Profile publication blocked.                      |
| `UserAccount.blockProfilePublishingUntilVerified(): Void`                                              | Student account is unverified.                              | Profile publication blocked.                      |
| `VerificationTier.updateFromSupport(supportType: string): VerificationTier`                            | Verified counselor support or transcript evidence exists.   | Verification tier remains self-reported.          |
| `VerificationTier.applyCounselorSupport(counselor: CounselorProfile): VerificationTier`                | Verified same-school counselor provides support.            | Counselor-supported status is not applied.        |
| `VerificationTier.applyTranscriptSupport(transcript: Transcript): VerificationTier`                    | Accepted transcript evidence exists.                        | Transcript-supported status is not applied.       |
| `StudentProfile.preventSelfVerifiedTranscriptUpload(): Void`                                           | Student attempts self-upload as official verified evidence. | Official transcript trust path blocked.           |
| `AdmissionsProfileView.showSelfReportedLabels(labels: List<SelfReportedLabel>): AdmissionsProfileView` | Admissions-facing view renders unsupported information.     | Self-reported label displayed.                    |
| `SearchIndex.indexProfile(profile: StudentProfile): Void`                                              | Profile is published, visible, and consent-allowed.         | Profile excluded from search.                     |

---

## 9.5 MC-3 Protected Security Properties

| Security Property                     | Enforcement                                                                                                                                                                                                                                               |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Academic data interpretation          | `AcademicRecord.validate(gradingScale: GradingScale): boolean`; `GradingScale`                                                                                                                                                                            |
| Trust labeling                        | `SelfReportedLabel.applyTo(target: object): SelfReportedLabel`; `AdmissionsProfileView.showSelfReportedLabels(labels: List<SelfReportedLabel>): AdmissionsProfileView`                                                                                    |
| Verification-tier integrity           | `VerificationTier.updateFromSupport(supportType: string): VerificationTier`; `VerificationTier.applyCounselorSupport(counselor: CounselorProfile): VerificationTier`; `VerificationTier.applyTranscriptSupport(transcript: Transcript): VerificationTier` |
| Publication integrity                 | `StudentProfile.checkRequiredSectionsComplete(): boolean`; `StudentProfile.publish(): StudentProfile`                                                                                                                                                     |
| Search-index integrity                | `SearchIndex.indexProfile(profile: StudentProfile): Void`; `SearchIndex.removeProfile(profile: StudentProfile): Void`                                                                                                                                     |
| Student-authored content preservation | `NarrativeResponse.updateText(text: string): NarrativeResponse`                                                                                                                                                                                           |

---

## 9.6 MC-3 Diagram Requirements

| Diagram                                 | Required Representation                                                                                     |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `03_misuse_case_diagram.puml`           | Show `MaliciousStudent` attempting to manipulate profile trust and self-reported information.               |
| `04_secure_domain_class_diagram.puml`   | Show `VerificationTier`, `SelfReportedLabel`, `AcademicRecord`, `ProfileItem`, and `AdmissionsProfileView`. |
| `05_student_profile_activity.puml`      | Show validation, self-reported labeling, completeness check, and publication gate.                          |
| `11_student_profile_state_machine.puml` | Show blocked publication and self-reported state implications.                                              |
| `12_trust_boundary_dfd.puml`            | Show `TB-1`, `TB-2`, and `TB-6`.                                                                            |
# 10. MC-4 Malicious / Incorrect Transcript Upload

## 10.1 MC-4 Summary

| Field                    | Value                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Misuse Case ID           | `MC-4`                                                                                                                                                                                                                                                                                                                                                    |
| Title                    | Malicious / Incorrect Transcript Upload                                                                                                                                                                                                                                                                                                                   |
| Threatened Use Case      | UC-4 Counselor Student Support & Transcript Upload                                                                                                                                                                                                                                                                                                        |
| Primary Attacker         | `FakeCounselor`                                                                                                                                                                                                                                                                                                                                           |
| Secondary Attacker       | `WrongSchoolCounselor`                                                                                                                                                                                                                                                                                                                                    |
| Security Goal Violated   | Transcript integrity, file-storage integrity, counselor authorization, verification-tier integrity                                                                                                                                                                                                                                                        |
| Primary Target Objects   | `CounselorProfile`, `StudentProfile`, `TranscriptSupportRequest`, `UploadedFile`, `Transcript`, `ObjectStorage`, `VerificationTier`, `AuditLogEntry`                                                                                                                                                                                                      |
| Primary Target Methods   | `CounselorProfile.openTranscriptRequest(request: TranscriptSupportRequest): TranscriptSupportRequest`; `TranscriptSupportRequest.submitTranscript(counselor: CounselorProfile, file: UploadedFile): TranscriptSupportRequest`; `FileValidationRule.validate(file: UploadedFile): boolean`; `ObjectStorage.storeProtectedFile(file: UploadedFile): string` |
| Primary Trust Boundaries | `TB-3`, `TB-8`                                                                                                                                                                                                                                                                                                                                            |
| STRIDE Categories        | Tampering, Information Disclosure, Elevation of Privilege                                                                                                                                                                                                                                                                                                 |
| Expected Security Result | Only verified same-school counselors can support student records or submit transcript evidence, and files must be validated before protected storage.                                                                                                                                                                                                     |

---

## 10.2 MC-4 Attack Objectives

| Objective ID | Attacker Objective                                                      | Target Object                                                    | Target Method                                                                                                                          |
| ------------ | ----------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `MC-4-AO-01` | Access transcript request before counselor verification.                | `CounselorProfile`, `TranscriptSupportRequest`                   | `CounselorProfile.openTranscriptRequest(request: TranscriptSupportRequest): TranscriptSupportRequest`                                  |
| `MC-4-AO-02` | Access transcript request for a student from another high school.       | `CounselorProfile`, `StudentProfile`, `TranscriptSupportRequest` | `AccessPolicy.requireSameHighSchool(counselor: CounselorProfile, profile: StudentProfile): Void`                                       |
| `MC-4-AO-03` | Upload malicious file as transcript evidence.                           | `UploadedFile`, `ObjectStorage`                                  | `FileValidationRule.validate(file: UploadedFile): boolean`; `ObjectStorage.storeProtectedFile(file: UploadedFile): string`             |
| `MC-4-AO-04` | Upload oversized or unsupported file type.                              | `UploadedFile`                                                   | `FileValidationRule.rejectInvalidFile(file: UploadedFile): Void`                                                                       |
| `MC-4-AO-05` | Create transcript evidence without valid support request.               | `Transcript`, `TranscriptSupportRequest`                         | `Transcript.createFromUpload(file: UploadedFile, request: TranscriptSupportRequest): Transcript`                                       |
| `MC-4-AO-06` | Elevate student profile to transcript-supported without valid evidence. | `VerificationTier`, `Transcript`                                 | `VerificationTier.applyTranscriptSupport(transcript: Transcript): VerificationTier`                                                    |
| `MC-4-AO-07` | Avoid audit trail for transcript upload or rejection.                   | `AuditLogEntry`                                                  | `AuditLogEntry.recordTranscriptAction(counselor: CounselorProfile, request: TranscriptSupportRequest, outcome: string): AuditLogEntry` |

---

## 10.3 MC-4 Attack Path

| Step | Attacker Action                                                          | Targeted Method                                                                                                                        | Expected Defensive Response                                                                                               |
| ---: | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
|    1 | Pending counselor attempts to open student roster.                       | `CounselorProfile.openStudentRoster(): List<StudentProfile>`                                                                           | `AccessPolicy.blockUnverifiedCounselor(counselor: CounselorProfile): Void` blocks access.                                 |
|    2 | Pending counselor attempts to open transcript request.                   | `CounselorProfile.openTranscriptRequest(request: TranscriptSupportRequest): TranscriptSupportRequest`                                  | `AccessPolicy.requireVerifiedCounselor(counselor: CounselorProfile): Void` blocks access.                                 |
|    3 | Verified counselor attempts to access request from another high school.  | `AccessPolicy.requireSameHighSchool(counselor: CounselorProfile, profile: StudentProfile): Void`                                       | `AccessPolicy.blockSchoolMismatch(counselor: CounselorProfile, profile: StudentProfile): Void` blocks access.             |
|    4 | Attacker submits unsupported, oversized, or suspicious file.             | `FileValidationRule.validate(file: UploadedFile): boolean`                                                                             | Invalid file is rejected before storage.                                                                                  |
|    5 | Attacker attempts storage without validation.                            | `ObjectStorage.storeProtectedFile(file: UploadedFile): string`                                                                         | Storage requires successful `FileValidationRule.validate(file: UploadedFile): boolean`.                                   |
|    6 | Attacker attempts to create transcript without valid request.            | `Transcript.createFromUpload(file: UploadedFile, request: TranscriptSupportRequest): Transcript`                                       | Transcript creation requires valid `TranscriptSupportRequest`, verified counselor, same-school match, and validated file. |
|    7 | Attacker attempts to update verification tier without accepted evidence. | `VerificationTier.applyTranscriptSupport(transcript: Transcript): VerificationTier`                                                    | Verification tier update is denied.                                                                                       |
|    8 | Transcript action succeeds or fails.                                     | `AuditLogEntry.recordTranscriptAction(counselor: CounselorProfile, request: TranscriptSupportRequest, outcome: string): AuditLogEntry` | Audit entry records success, rejection, or denied access.                                                                 |

---

## 10.4 MC-4 Required Defensive Methods

| Defensive Method                                                                                                                       | Required Condition                                                               | Failure Result                           |
| -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------- |
| `AccessPolicy.requireVerifiedCounselor(counselor: CounselorProfile): Void`                                                             | Counselor is verified, active, and not suspended.                                | Throws `AuthorizationError`.             |
| `AccessPolicy.blockUnverifiedCounselor(counselor: CounselorProfile): Void`                                                             | Counselor is pending, denied, suspended, or unverified.                          | Blocks roster and transcript access.     |
| `AccessPolicy.requireSameHighSchool(counselor: CounselorProfile, profile: StudentProfile): Void`                                       | Counselor and student profile reference the same `HighSchool`.                   | Throws `AuthorizationError`.             |
| `AccessPolicy.blockSchoolMismatch(counselor: CounselorProfile, profile: StudentProfile): Void`                                         | Counselor and student profile have different high schools.                       | Blocks request access.                   |
| `TranscriptSupportRequest.assignToCounselor(counselor: CounselorProfile): TranscriptSupportRequest`                                    | Counselor is verified and same-school matched.                                   | Request not assigned.                    |
| `FileValidationRule.validate(file: UploadedFile): boolean`                                                                             | File type, size, and safety checks pass.                                         | File rejected.                           |
| `FileValidationRule.rejectInvalidFile(file: UploadedFile): Void`                                                                       | File is invalid, oversized, unsupported, or suspicious.                          | Throws `FileValidationError`.            |
| `UploadedFile.store(fileBytes: binary, objectStorage: ObjectStorage): UploadedFile`                                                    | File validation has passed.                                                      | File not stored.                         |
| `ObjectStorage.storeProtectedFile(file: UploadedFile): string`                                                                         | Validated file is ready for protected storage.                                   | Storage denied.                          |
| `Transcript.createFromUpload(file: UploadedFile, request: TranscriptSupportRequest): Transcript`                                       | Valid support request, verified same-school counselor, and validated file exist. | Transcript not created.                  |
| `VerificationTier.applyTranscriptSupport(transcript: Transcript): VerificationTier`                                                    | Accepted transcript evidence exists.                                             | Transcript-supported status not applied. |
| `AuditLogEntry.recordTranscriptAction(counselor: CounselorProfile, request: TranscriptSupportRequest, outcome: string): AuditLogEntry` | Transcript action succeeds, fails, or is denied.                                 | Audit entry created.                     |

---

## 10.5 MC-4 Protected Security Properties

| Security Property             | Enforcement                                                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Counselor authorization       | `AccessPolicy.requireVerifiedCounselor(counselor: CounselorProfile): Void`                                                             |
| Same-school access            | `AccessPolicy.requireSameHighSchool(counselor: CounselorProfile, profile: StudentProfile): Void`                                       |
| File integrity                | `FileValidationRule.validate(file: UploadedFile): boolean`; `FileValidationRule.rejectInvalidFile(file: UploadedFile): Void`           |
| Protected storage             | `ObjectStorage.storeProtectedFile(file: UploadedFile): string`                                                                         |
| Transcript evidence integrity | `Transcript.createFromUpload(file: UploadedFile, request: TranscriptSupportRequest): Transcript`                                       |
| Verification-tier integrity   | `VerificationTier.applyTranscriptSupport(transcript: Transcript): VerificationTier`                                                    |
| Auditability                  | `AuditLogEntry.recordTranscriptAction(counselor: CounselorProfile, request: TranscriptSupportRequest, outcome: string): AuditLogEntry` |

---

## 10.6 MC-4 Diagram Requirements

| Diagram                               | Required Representation                                                                                                    |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `03_misuse_case_diagram.puml`         | Show `FakeCounselor` and `WrongSchoolCounselor` attacking transcript support flow.                                         |
| `07_transcript_support_activity.puml` | Show verified counselor check, same-school check, file validation, storage, and audit path.                                |
| `12_trust_boundary_dfd.puml`          | Show `TB-3` and `TB-8`.                                                                                                    |
| `04_secure_domain_class_diagram.puml` | Show `TranscriptSupportRequest`, `UploadedFile`, `Transcript`, `FileValidationRule`, `ObjectStorage`, and `AuditLogEntry`. |

---

# 11. MC-5 AI Prompt Manipulation or Unreviewed AI Output

## 11.1 MC-5 Summary

| Field                    | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Misuse Case ID           | `MC-5`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Title                    | AI Prompt Manipulation or Unreviewed AI Output                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Threatened Use Case      | UC-5 AI Contextualization Request, Review, and Approval                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Primary Attacker         | `PromptInjectionAttacker`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Secondary Attacker       | `CompromisedExternalService`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Security Goal Violated   | AI-output integrity, student consent, human review, admissions display integrity                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Primary Target Objects   | `NarrativeResponse`, `AIConsentRecord`, `AIContextualizationRequest`, `AIContextualizationOutput`, `StudentAIReviewDecision`, `HumanReviewDecision`, `AIOutputPolicy`, `AdmissionsProfileView`, `AuditLogEntry`                                                                                                                                                                                                                                                                                                                                                                  |
| Primary Target Methods   | `AIContextualizationRequest.create(studentProfile: StudentProfile, selectedFields: List<NarrativeResponse>, consent: AIConsentRecord): AIContextualizationRequest`; `AIContextualizationRequest.sendToAIService(aiService: AIService): AIContextualizationOutput`; `AIContextualizationOutput.storePending(request: AIContextualizationRequest, generatedText: string): AIContextualizationOutput`; `AIOutputPolicy.canDisplay(output: AIContextualizationOutput): boolean`; `AdmissionsProfileView.includeApprovedAI(output: AIContextualizationOutput): AdmissionsProfileView` |
| Primary Trust Boundaries | `TB-5`, `TB-7`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| STRIDE Categories        | Tampering, Information Disclosure, Repudiation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Expected Security Result | AI output remains separated, labeled, pending, consent-gated, student-reviewed, human-reviewed, and blocked from admissions views until all visibility rules pass.                                                                                                                                                                                                                                                                                                                                                                                                               |

---

## 11.2 MC-5 Attack Objectives

| Objective ID | Attacker Objective                                            | Target Object                                                       | Target Method                                                                                                                                                                                                                        |
| ------------ | ------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `MC-5-AO-01` | Trigger AI contextualization without consent.                 | `AIConsentRecord`                                                   | `AIConsentRecord.recordConsent(studentProfile: StudentProfile, consentGiven: boolean): AIConsentRecord`                                                                                                                              |
| `MC-5-AO-02` | Send unselected or hidden student fields to AI service.       | `AIContextualizationRequest`, `NarrativeResponse`, `StudentProfile` | `AIContextualizationRequest.create(studentProfile: StudentProfile, selectedFields: List<NarrativeResponse>, consent: AIConsentRecord): AIContextualizationRequest`                                                                   |
| `MC-5-AO-03` | Manipulate narrative text to instruct AI to fabricate claims. | `NarrativeResponse`, `AIContextualizationOutput`                    | `NarrativeResponse.updateText(text: string): NarrativeResponse`; `AIService.generateContext(request: AIContextualizationRequest): AIContextualizationOutput`                                                                         |
| `MC-5-AO-04` | Publish AI output directly after generation.                  | `AIContextualizationOutput`, `AdmissionsProfileView`                | `AIContextualizationOutput.storePending(request: AIContextualizationRequest, generatedText: string): AIContextualizationOutput`; `AdmissionsProfileView.includeApprovedAI(output: AIContextualizationOutput): AdmissionsProfileView` |
| `MC-5-AO-05` | Display AI output after student rejection.                    | `StudentAIReviewDecision`, `AIOutputPolicy`                         | `StudentAIReviewDecision.reject(output: AIContextualizationOutput, reason: string): StudentAIReviewDecision`; `AIOutputPolicy.blockRejectedOutput(output: AIContextualizationOutput): Void`                                          |
| `MC-5-AO-06` | Display AI output without human approval.                     | `HumanReviewDecision`, `AIOutputPolicy`                             | `HumanReviewDecision.approve(reviewer: UserAccount, output: AIContextualizationOutput, note: string): HumanReviewDecision`; `AIOutputPolicy.blockUnreviewedOutput(output: AIContextualizationOutput): Void`                          |
| `MC-5-AO-07` | Hide AI-generated nature from admissions officers.            | `AIContextualizationOutput`, `AdmissionsProfileView`                | `AIContextualizationOutput.labelAsAIGenerated(): AIContextualizationOutput`                                                                                                                                                          |
| `MC-5-AO-08` | Keep AI output visible after consent withdrawal.              | `AIConsentRecord`, `AIOutputPolicy`                                 | `AIConsentRecord.withdrawConsent(studentProfile: StudentProfile): AIConsentRecord`; `AIOutputPolicy.hideAfterConsentWithdrawal(output: AIContextualizationOutput): AIContextualizationOutput`                                        |

---

## 11.3 MC-5 Attack Path

| Step | Attacker Action                                                            | Targeted Method                                                                                                                                                    | Expected Defensive Response                                                                                                                                                      |
| ---: | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|    1 | Student or attacker attempts AI contextualization while consent is absent. | `AIContextualizationRequest.create(studentProfile: StudentProfile, selectedFields: List<NarrativeResponse>, consent: AIConsentRecord): AIContextualizationRequest` | Request creation requires explicit `AIConsentRecord`.                                                                                                                            |
|    2 | User selects fields not eligible for AI contextualization.                 | `AIContextualizationRequest.validateEligibility(): boolean`                                                                                                        | Request is blocked or restricted to eligible fields.                                                                                                                             |
|    3 | Narrative text attempts prompt manipulation.                               | `AIContextualizationRequest.sendToAIService(aiService: AIService): AIContextualizationOutput`                                                                      | Only selected, consent-approved fields are sent; output returns pending review.                                                                                                  |
|    4 | AI service returns generated text.                                         | `AIContextualizationOutput.storePending(request: AIContextualizationRequest, generatedText: string): AIContextualizationOutput`                                    | Output stored in pending-review state.                                                                                                                                           |
|    5 | System prepares output for possible display.                               | `AIContextualizationOutput.labelAsAIGenerated(): AIContextualizationOutput`                                                                                        | Output is tagged as AI-generated.                                                                                                                                                |
|    6 | Student rejects output.                                                    | `StudentAIReviewDecision.reject(output: AIContextualizationOutput, reason: string): StudentAIReviewDecision`                                                       | Rejected output must remain hidden.                                                                                                                                              |
|    7 | Student accepts output but no human review exists.                         | `AIOutputPolicy.canDisplay(output: AIContextualizationOutput): boolean`                                                                                            | Returns false because human approval is missing.                                                                                                                                 |
|    8 | Human reviewer rejects output.                                             | `HumanReviewDecision.reject(reviewer: UserAccount, output: AIContextualizationOutput, reason: string): HumanReviewDecision`                                        | Output remains hidden.                                                                                                                                                           |
|    9 | Admissions view attempts to include unreviewed or rejected output.         | `AdmissionsProfileView.includeApprovedAI(output: AIContextualizationOutput): AdmissionsProfileView`                                                                | `AIOutputPolicy.blockUnreviewedOutput(output: AIContextualizationOutput): Void` or `AIOutputPolicy.blockRejectedOutput(output: AIContextualizationOutput): Void` blocks display. |
|   10 | Student withdraws consent after AI output exists.                          | `AIConsentRecord.withdrawConsent(studentProfile: StudentProfile): AIConsentRecord`                                                                                 | `AIOutputPolicy.hideAfterConsentWithdrawal(output: AIContextualizationOutput): AIContextualizationOutput` hides AI output from admissions view.                                  |
|   11 | AI action occurs.                                                          | `AuditLogEntry.recordAIAction(actor: UserAccount, output: AIContextualizationOutput, action: string, outcome: string): AuditLogEntry`                              | AI generation, review, rejection, revision, visibility, or withdrawal is audited.                                                                                                |

---

## 11.4 MC-5 Required Defensive Methods

| Defensive Method                                                                                                                                                   | Required Condition                                                                                  | Failure Result                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `AIConsentRecord.recordConsent(studentProfile: StudentProfile, consentGiven: boolean): AIConsentRecord`                                                            | Student owner gives explicit consent.                                                               | AI contextualization remains off.                       |
| `AIContextualizationRequest.create(studentProfile: StudentProfile, selectedFields: List<NarrativeResponse>, consent: AIConsentRecord): AIContextualizationRequest` | Consent active and selected fields eligible.                                                        | Request blocked.                                        |
| `AIContextualizationRequest.validateEligibility(): boolean`                                                                                                        | Profile and selected fields are eligible for contextualization.                                     | AI request rejected or revised.                         |
| `AIContextualizationRequest.sendToAIService(aiService: AIService): AIContextualizationOutput`                                                                      | Only approved, selected, consented fields are sent.                                                 | Request blocked or limited.                             |
| `AIContextualizationOutput.storePending(request: AIContextualizationRequest, generatedText: string): AIContextualizationOutput`                                    | AI output returned from service.                                                                    | Output stored as pending only.                          |
| `AIContextualizationOutput.labelAsAIGenerated(): AIContextualizationOutput`                                                                                        | Output exists.                                                                                      | AI-generated label applied before any possible display. |
| `StudentAIReviewDecision.accept(output: AIContextualizationOutput): StudentAIReviewDecision`                                                                       | Student owner accepts generated output.                                                             | Output moves toward human review only.                  |
| `StudentAIReviewDecision.reject(output: AIContextualizationOutput, reason: string): StudentAIReviewDecision`                                                       | Student owner rejects output.                                                                       | Output hidden from admissions.                          |
| `HumanReviewDecision.approve(reviewer: UserAccount, output: AIContextualizationOutput, note: string): HumanReviewDecision`                                         | Reviewer is verified same-school counselor or platform administrator and student acceptance exists. | Output remains hidden.                                  |
| `HumanReviewDecision.reject(reviewer: UserAccount, output: AIContextualizationOutput, reason: string): HumanReviewDecision`                                        | Reviewer rejects output.                                                                            | Output remains hidden.                                  |
| `AIOutputPolicy.canDisplay(output: AIContextualizationOutput): boolean`                                                                                            | Student accepted, human approved, consent active, AI label present, profile visible.                | Returns false.                                          |
| `AIOutputPolicy.blockUnreviewedOutput(output: AIContextualizationOutput): Void`                                                                                    | Output lacks required review.                                                                       | Throws `VisibilityError`.                               |
| `AIOutputPolicy.blockRejectedOutput(output: AIContextualizationOutput): Void`                                                                                      | Output was rejected.                                                                                | Throws `VisibilityError`.                               |
| `AIOutputPolicy.hideAfterConsentWithdrawal(output: AIContextualizationOutput): AIContextualizationOutput`                                                          | Consent withdrawn.                                                                                  | AI output hidden.                                       |
| `AuditLogEntry.recordAIAction(actor: UserAccount, output: AIContextualizationOutput, action: string, outcome: string): AuditLogEntry`                              | AI workflow action occurs.                                                                          | Audit event recorded.                                   |

---

## 11.5 MC-5 Protected Security Properties

| Security Property         | Enforcement                                                                                                                                                                                                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consent integrity         | `AIConsentRecord.recordConsent(studentProfile: StudentProfile, consentGiven: boolean): AIConsentRecord`; `AIConsentRecord.withdrawConsent(studentProfile: StudentProfile): AIConsentRecord`                                                                                                                                     |
| Data minimization         | `AIContextualizationRequest.create(studentProfile: StudentProfile, selectedFields: List<NarrativeResponse>, consent: AIConsentRecord): AIContextualizationRequest`                                                                                                                                                              |
| AI output separation      | `AIContextualizationOutput.storePending(request: AIContextualizationRequest, generatedText: string): AIContextualizationOutput`                                                                                                                                                                                                 |
| AI labeling               | `AIContextualizationOutput.labelAsAIGenerated(): AIContextualizationOutput`                                                                                                                                                                                                                                                     |
| Student control           | `StudentAIReviewDecision.accept(output: AIContextualizationOutput): StudentAIReviewDecision`; `StudentAIReviewDecision.reject(output: AIContextualizationOutput, reason: string): StudentAIReviewDecision`; `StudentAIReviewDecision.requestRevision(output: AIContextualizationOutput, note: string): StudentAIReviewDecision` |
| Human review              | `HumanReviewDecision.approve(reviewer: UserAccount, output: AIContextualizationOutput, note: string): HumanReviewDecision`; `HumanReviewDecision.reject(reviewer: UserAccount, output: AIContextualizationOutput, reason: string): HumanReviewDecision`                                                                         |
| Admissions display safety | `AIOutputPolicy.canDisplay(output: AIContextualizationOutput): boolean`; `AdmissionsProfileView.includeApprovedAI(output: AIContextualizationOutput): AdmissionsProfileView`                                                                                                                                                    |
| Auditability              | `AuditLogEntry.recordAIAction(actor: UserAccount, output: AIContextualizationOutput, action: string, outcome: string): AuditLogEntry`                                                                                                                                                                                           |

---

## 11.6 MC-5 Diagram Requirements

| Diagram                                      | Required Representation                                                                                                                                    |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `03_misuse_case_diagram.puml`                | Show `PromptInjectionAttacker` attempting to manipulate AI contextualization.                                                                              |
| `08_ai_contextualization_state_machine.puml` | Show pending, student accepted, student rejected, human approved, human rejected, visible, hidden after withdrawal.                                        |
| `09_ai_contextualization_sequence.puml`      | Show consent, selected fields, AI service boundary, pending output, student review, human review, and AI output policy.                                    |
| `12_trust_boundary_dfd.puml`                 | Show `TB-5` and `TB-7`.                                                                                                                                    |
| `04_secure_domain_class_diagram.puml`        | Show `AIConsentRecord`, `AIContextualizationRequest`, `AIContextualizationOutput`, `StudentAIReviewDecision`, `HumanReviewDecision`, and `AIOutputPolicy`. |

---

# 12. MC-6 Unauthorized Profile Access & Consent Bypass

## 12.1 MC-6 Summary

| Field                    | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Misuse Case ID           | `MC-6`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Title                    | Unauthorized Profile Access & Consent Bypass                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Threatened Use Case      | UC-6 Admissions Officer Search & Student Profile Review                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Primary Attacker         | `MaliciousAdmissionsUser`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Secondary Attacker       | `CompromisedExternalService`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Security Goal Violated   | Student privacy, consent enforcement, admissions access control, row-level security                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Primary Target Objects   | `StudentProfile`, `ProfileVisibilitySettings`, `ConsentSettings`, `StudentDiscoverySearch`, `AdmissionsProfileView`, `Shortlist`, `ShortlistEntry`, `RowLevelSecurityPolicy`, `AccessPolicy`, `AuditLogEntry`                                                                                                                                                                                                                                                                                                   |
| Primary Target Methods   | `StudentDiscoverySearch.execute(filters: List<SearchFilter>): List<StudentProfile>`; `AccessPolicy.authorizeAdmissionsProfileView(officer: AdmissionsOfficerProfile, profile: StudentProfile): boolean`; `RowLevelSecurityPolicy.enforceProfileAccess(user: UserAccount, profile: StudentProfile): boolean`; `AdmissionsProfileView.render(officer: AdmissionsOfficerProfile, profile: StudentProfile): AdmissionsProfileView`; `ShortlistEntry.open(officer: AdmissionsOfficerProfile): AdmissionsProfileView` |
| Primary Trust Boundaries | `TB-1`, `TB-2`, `TB-6`, `TB-7`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| STRIDE Categories        | Information Disclosure, Elevation of Privilege, Tampering                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Expected Security Result | Admissions officers can only discover and view currently published, visible, consent-allowed, authorized profiles; old links and shortlists do not bypass checks.                                                                                                                                                                                                                                                                                                                                               |

> **Batch 5 prototype refinement (Admissions Discovery — Group 1d).** The implemented Batch 5 slice is the prototype subset of MC-6. Effective visibility is the single strict rule `is_published AND admissions_consent`, evaluated at query time (a missing `profile_visibility_settings` row or either flag `false` ⇒ not visible; withdrawal removes access immediately). The two collapsed flags live on the one `ProfileVisibilitySettings` table (`ConsentSettings` is not a separate Batch 5 table). Diagram-local threats `MC-B5-1`..`MC-B5-9` (see `recruitbook-diagrams/diagrams/slices/batch-5-admissions-discovery/03_admissions_discovery_misuse_case.puml`) map to MC-6 and are broken by: `is_verified_admissions_officer()`, `is_admissions_visible_profile(profile_id)`, owner-scoped student RLS on `profile_visibility_settings`, additive SELECT-only admissions RLS on the four Batch 2 profile tables, generic-unavailable + visible-rows-only responses (no id/count/filter oracle), and the absence of any admissions policy on the Batch 3/4 counselor tables and of any admissions write policy. Out of scope for the Batch 5 prototype (retained as long-term MC-6 context above): `Shortlist`/`ShortlistEntry`, `SearchIndex`/ranking, AI output, `VerificationTier`/`SelfReportedLabel`, and audit events. New denial rules `D-21`–`D-23` in `recruitbook_actor_matrix.md`. This is a deliberate, recorded refinement, not drift.

> **Batch 6 prototype refinement (Admissions Shortlists — Group 1d).** Batch 6 is the FIRST admissions-officer WRITE surface and refines the catalog's `Shortlist`/`ShortlistEntry` pair into one new prototype table, `admissions_shortlist_entries` — one implicit (unnamed) shortlist per verified officer, a bare `(admissions_officer_application_user_id, student_profile_id)` reference with no denormalized profile content. This is a Group 1a/1d PROPOSAL only, not yet implemented schema — the Group 2 schema/RLS design remains subject to mandatory pre-migration ratification before any migration is written. Diagram-local threats `MC-B6-1`..`MC-B6-7` (see `recruitbook-diagrams/diagrams/slices/batch-6-admissions-shortlists/03_admissions_shortlists_misuse_case.puml`) map to MC-6 and are broken by: `is_admissions_visible_profile(profile_id)` evaluated at query time on SELECT and INSERT (stale-entry visibility bypass, and saving a profile that is not currently effectively visible or does not resolve — hidden, unpublished, consent-withdrawn, suspended-owner, deleted, malformed, or nonexistent — a visibility gate only, not an ownership restriction, since any verified officer may save any effectively visible profile regardless of which student owns it); silent omission of stale entries plus fixed generic save/remove results and idempotent duplicate save (no withdrawal/existence oracle on either the read or write side); `current_application_user_id()` ownership comparison required on SELECT, INSERT, and DELETE (cross-officer read/write/delete); the server-derived owner id with an insert-time ownership `WITH CHECK` (forged owner id at insert); `is_verified_admissions_officer()` required on INSERT/DELETE (pending/suspended/unverified officer denial); deny-by-default absence of any student or counselor policy on `admissions_shortlist_entries` (student/counselor detecting a shortlist entry exists); and the absence of any NEW admissions write policy outside `admissions_shortlist_entries` (write leakage into `student_profiles`, `profile_visibility_settings`, or the counselor link/review/feedback tables) — the EXISTING Batch 5 admissions SELECT-only access to `student_profiles`, `academic_backgrounds`, `profile_activities`, and `profile_achievements` is UNCHANGED and continues to apply alongside this new table; it is not removed, narrowed, or replaced by Batch 6, and `profile_visibility_settings` still receives no direct admissions policy of any kind. DELETE is deliberately NOT visibility-gated so a stale entry stays removable — a documented design choice, not a threat. Audit events remain explicitly deferred for Batch 6, same as every prior batch — not modeled as an implemented or planned control here. Out of scope for the Batch 6 prototype (retained as long-term MC-6 context above): named/multiple shortlists, entry notes/labels/tags, `SearchIndex`/ranking, AI output, `VerificationTier`/`SelfReportedLabel`, messaging/notifications/exports. Diagram-local threats `MC-B6-1`..`MC-B6-7` and denial rules `D-24`–`D-28` are recorded in §§ 12.7–12.8 below, not in `recruitbook_actor_matrix.md`. This is a deliberate, recorded refinement, not drift.

---

## 12.2 MC-6 Attack Objectives

| Objective ID | Attacker Objective                                                        | Target Object                                                          | Target Method                                                                                                      |
| ------------ | ------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `MC-6-AO-01` | Access admissions discovery without approval.                             | `AdmissionsOfficerProfile`, `StudentDiscoverySearch`                   | `AdmissionsOfficerProfile.openDiscoveryPage(): StudentDiscoverySearch`                                             |
| `MC-6-AO-02` | Modify client-side role or request parameters to act as approved officer. | `AccessPolicy`, `AdmissionsOfficerProfile`                             | `AccessPolicy.requireApprovedAdmissionsOfficer(officer: AdmissionsOfficerProfile): Void`                           |
| `MC-6-AO-03` | Query hidden, unpublished, or consent-restricted profiles.                | `StudentDiscoverySearch`, `StudentProfile`                             | `StudentDiscoverySearch.execute(filters: List<SearchFilter>): List<StudentProfile>`                                |
| `MC-6-AO-04` | Access student profile directly through URL or opaque identifier.         | `StudentProfile`, `AdmissionsProfileView`                              | `AccessPolicy.authorizeAdmissionsProfileView(officer: AdmissionsOfficerProfile, profile: StudentProfile): boolean` |
| `MC-6-AO-05` | Bypass database-level row checks.                                         | `RowLevelSecurityPolicy`, `Database`                                   | `RowLevelSecurityPolicy.enforceProfileAccess(user: UserAccount, profile: StudentProfile): boolean`                 |
| `MC-6-AO-06` | Open old shortlist entry after visibility or consent changes.             | `ShortlistEntry`, `StudentProfile`                                     | `ShortlistEntry.open(officer: AdmissionsOfficerProfile): AdmissionsProfileView`                                    |
| `MC-6-AO-07` | Display unapproved AI output in admissions view.                          | `AdmissionsProfileView`, `AIContextualizationOutput`, `AIOutputPolicy` | `AdmissionsProfileView.includeApprovedAI(output: AIContextualizationOutput): AdmissionsProfileView`                |
| `MC-6-AO-08` | Avoid audit trail for denied access.                                      | `AuditLogEntry`                                                        | `AuditLogEntry.recordAccessDenied(user: UserAccount, resource: object, reason: string): AuditLogEntry`             |

---

## 12.3 MC-6 Attack Path

| Step | Attacker Action                                              | Targeted Method                                                                                                    | Expected Defensive Response                                                                               |
| ---: | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
|    1 | Unverified admissions user opens discovery page.             | `AdmissionsOfficerProfile.openDiscoveryPage(): StudentDiscoverySearch`                                             | `AccessPolicy.requireApprovedAdmissionsOfficer(officer: AdmissionsOfficerProfile): Void` blocks access.   |
|    2 | Attacker modifies client-side role or request parameters.    | `AccessPolicy.evaluate(user: UserAccount, resource: object, action: string): boolean`                              | Server-side policy rejects forged role or unauthorized action.                                            |
|    3 | Attacker executes search for hidden or unpublished profiles. | `StudentDiscoverySearch.execute(filters: List<SearchFilter>): List<StudentProfile>`                                | Search returns only published, visible, consent-allowed, authorized profiles.                             |
|    4 | Search index contains stale hidden profile.                  | `StudentDiscoverySearch.excludeHiddenProfiles(): Void`                                                             | Hidden or consent-restricted profiles are excluded.                                                       |
|    5 | Attacker opens direct profile URL.                           | `AccessPolicy.authorizeAdmissionsProfileView(officer: AdmissionsOfficerProfile, profile: StudentProfile): boolean` | Authorization requires approved officer, publication, visibility, consent, current access state, and RLS. |
|    6 | Attacker attempts database/API row access.                   | `RowLevelSecurityPolicy.enforceProfileAccess(user: UserAccount, profile: StudentProfile): boolean`                 | RLS blocks unauthorized row access.                                                                       |
|    7 | Attacker opens old shortlist entry after consent withdrawal. | `ShortlistEntry.open(officer: AdmissionsOfficerProfile): AdmissionsProfileView`                                    | Current visibility, consent, and authorization are rechecked.                                             |
|    8 | Admissions view attempts to render profile.                  | `AdmissionsProfileView.render(officer: AdmissionsOfficerProfile, profile: StudentProfile): AdmissionsProfileView`  | View renders only authorized, safe, consent-allowed fields.                                               |
|    9 | Admissions view attempts to include AI output.               | `AdmissionsProfileView.includeApprovedAI(output: AIContextualizationOutput): AdmissionsProfileView`                | `AIOutputPolicy.canDisplay(output: AIContextualizationOutput): boolean` must return true.                 |
|   10 | Access is denied.                                            | `AuditLogEntry.recordAccessDenied(user: UserAccount, resource: object, reason: string): AuditLogEntry`             | Denied attempt is logged.                                                                                 |

---

## 12.4 MC-6 Required Defensive Methods

| Defensive Method                                                                                                      | Required Condition                                                                    | Failure Result                  |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------- |
| `AccessPolicy.requireApprovedAdmissionsOfficer(officer: AdmissionsOfficerProfile): Void`                              | Officer is verified, approved, active, and not suspended.                             | Throws `AuthorizationError`.    |
| `AccessPolicy.authorizeAdmissionsSearch(officer: AdmissionsOfficerProfile): boolean`                                  | Officer is approved and authorized to search.                                         | Search blocked.                 |
| `StudentDiscoverySearch.execute(filters: List<SearchFilter>): List<StudentProfile>`                                   | Filters are valid and access checks pass.                                             | Unauthorized profiles excluded. |
| `Database.queryVisibleProfiles(filters: List<SearchFilter>, officer: AdmissionsOfficerProfile): List<StudentProfile>` | Officer approval, RLS, publication, visibility, and consent pass.                     | Rows not returned.              |
| `RowLevelSecurityPolicy.enforceProfileAccess(user: UserAccount, profile: StudentProfile): boolean`                    | User is authorized for row-level access.                                              | Row access denied.              |
| `StudentDiscoverySearch.excludeHiddenProfiles(): Void`                                                                | Profile is unpublished, hidden, or consent-restricted.                                | Profile excluded.               |
| `AccessPolicy.authorizeAdmissionsProfileView(officer: AdmissionsOfficerProfile, profile: StudentProfile): boolean`    | Current officer, profile, visibility, consent, and RLS checks pass.                   | Profile view denied.            |
| `AccessPolicy.blockUnauthorizedProfileAccess(user: UserAccount, profile: StudentProfile): Void`                       | Access is unauthorized.                                                               | Throws `AuthorizationError`.    |
| `AdmissionsProfileView.render(officer: AdmissionsOfficerProfile, profile: StudentProfile): AdmissionsProfileView`     | Authorization passes.                                                                 | Safe view rendered.             |
| `AdmissionsProfileView.includeApprovedAI(output: AIContextualizationOutput): AdmissionsProfileView`                   | `AIOutputPolicy.canDisplay(output: AIContextualizationOutput): boolean` returns true. | AI output excluded.             |
| `Shortlist.addProfile(profile: StudentProfile): ShortlistEntry`                                                       | Current visibility, consent, and authorization pass.                                  | Profile not saved to shortlist. |
| `ShortlistEntry.open(officer: AdmissionsOfficerProfile): AdmissionsProfileView`                                       | Current publication, visibility, consent, and authorization pass.                     | Entry cannot open profile.      |
| `AuditLogEntry.recordAccessDenied(user: UserAccount, resource: object, reason: string): AuditLogEntry`                | Sensitive access is denied.                                                           | Denial recorded.                |

---

## 12.5 MC-6 Protected Security Properties

| Security Property         | Enforcement                                                                                                                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admissions role integrity | `AccessPolicy.requireApprovedAdmissionsOfficer(officer: AdmissionsOfficerProfile): Void`                                                                                                                            |
| Search privacy            | `StudentDiscoverySearch.execute(filters: List<SearchFilter>): List<StudentProfile`; `StudentDiscoverySearch.excludeHiddenProfiles(): Void`                                                                          |
| Row-level security        | `RowLevelSecurityPolicy.enforceProfileAccess(user: UserAccount, profile: StudentProfile): boolean`                                                                                                                  |
| Direct access protection  | `AccessPolicy.authorizeAdmissionsProfileView(officer: AdmissionsOfficerProfile, profile: StudentProfile): boolean`; `AccessPolicy.blockUnauthorizedProfileAccess(user: UserAccount, profile: StudentProfile): Void` |
| Shortlist privacy         | `ShortlistEntry.open(officer: AdmissionsOfficerProfile): AdmissionsProfileView`                                                                                                                                     |
| AI display safety         | `AIOutputPolicy.canDisplay(output: AIContextualizationOutput): boolean`; `AdmissionsProfileView.includeApprovedAI(output: AIContextualizationOutput): AdmissionsProfileView`                                        |
| Auditability              | `AuditLogEntry.recordAccessDenied(user: UserAccount, resource: object, reason: string): AuditLogEntry`                                                                                                              |

---

## 12.6 MC-6 Diagram Requirements

| Diagram                                 | Required Representation                                                                                                                  |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `03_misuse_case_diagram.puml`           | Show `MaliciousAdmissionsUser` attempting unauthorized profile access and consent bypass.                                                |
| `10_admissions_search_sequence.puml`    | Show approved officer check, search filtering, RLS, profile authorization, rendering, shortlist recheck, and denied access audit.        |
| `12_trust_boundary_dfd.puml`            | Show `TB-1`, `TB-2`, `TB-6`, and `TB-7`.                                                                                                 |
| `04_secure_domain_class_diagram.puml`   | Show `AccessPolicy`, `RowLevelSecurityPolicy`, `StudentDiscoverySearch`, `AdmissionsProfileView`, `ShortlistEntry`, and `AuditLogEntry`. |
| `11_student_profile_state_machine.puml` | Show hidden, unpublished, and consent-restricted states blocking admissions access.                                                      |

---

## 12.7 MC-6 Batch 6 — Admissions Shortlists Local Misuse Entries

| Misuse ID | Threat / Attacker | Target Object or Access Path | Relevant Method or Policy | Trust Boundary | STRIDE Category | Required Defensive Response |
| --- | --- | --- | --- | --- | --- | --- |
| `MC-B6-1` | Verified admissions officer keeps saved-list/direct-view access to a stale (withdrawn/unpublished/suspended-owner) entry. | `ShortlistEntry` / `StudentProfile` | `is_admissions_visible_profile(profile_id)` (SELECT) | `TB-2` (RecruitBookApp/Database); `TB-7` (AdmissionsOfficer/AdmissionsProfileView — Primary Risk already includes "old shortlist access") | Information Disclosure, Elevation of Privilege | Entry is silently omitted from SELECT the instant visibility is lost — no stored/derived visibility field. |
| `MC-B6-2` | Verified admissions officer infers withdrawal or existence via saved-list count, message, or a distinct stale-entry state. | `ShortlistEntry` | SELECT/INSERT result-shaping behavior plus the removal RPC's result-shaping behavior (silent omission + fixed generic results + idempotent duplicate save) | `TB-1` (Browser/RecruitBookApp); `TB-7` | Information Disclosure | No distinct stale-entry state, count, or message anywhere. |
| `MC-B6-3` | Verified admissions officer reads, saves into, or removes ANOTHER officer's shortlist entry. | `ShortlistEntry` | `current_application_user_id()` ownership comparison — RLS on SELECT/INSERT; the removal RPC's own `WHERE` clause for removal (AMENDED, not a DELETE policy) | `TB-2` | Elevation of Privilege, Tampering | Ownership check — a foreign officer's entry matches zero rows, under RLS for SELECT/INSERT and inside the RLS-bypassing SECURITY DEFINER removal RPC otherwise. |
| `MC-B6-4` | Verified admissions officer forges the owner id (`admissions_officer_application_user_id`) at insert. | `ShortlistEntry` | Server-derived owner id + insert-time ownership `WITH CHECK` | `TB-1`, `TB-2` | Spoofing, Tampering | Client-supplied owner id is never trusted; `WITH CHECK` rejects any mismatch. |
| `MC-B6-5` | Verified admissions officer saves a student profile that is not currently effectively visible or does not resolve to an available profile (hidden, unpublished, consent-withdrawn, suspended-owner, deleted, malformed, or nonexistent). | `ShortlistEntry` / `StudentProfile` | `is_admissions_visible_profile(profile_id)` (INSERT) | `TB-2` | Information Disclosure, Tampering | INSERT `WITH CHECK` fails with the same fixed generic error regardless of cause. |
| `MC-B6-6` | Student or counselor detects a shortlist entry exists. | `ShortlistEntry` | Deny-by-default (zero student/counselor RLS policy on the table) | `TB-2` | Information Disclosure | No policy of any kind grants either role any access. |
| `MC-B6-7` | Admissions write leaks into `student_profiles`, `profile_visibility_settings`, or counselor tables. | `student_profiles`, `profile_visibility_settings`, `counselor_student_links`, `counselor_review_requests`, `counselor_feedback_notes` | Absence of any admissions INSERT/UPDATE/DELETE policy anywhere outside `admissions_shortlist_entries` (Batch 5's existing admissions SELECT-only access to the four profile tables is unchanged and is NOT itself a leak) | `TB-2` | Elevation of Privilege, Tampering | Deny-by-default write policy absence, confirmed as a regression gate at every batch closure. |

---

## 12.8 MC-6 Batch 6 — Admissions Shortlists Denial Rules

These Batch 6 denial rules are recorded here in the misuse catalog, not in `recruitbook_actor_matrix.md`'s own separate "Section 12. Explicit Denial Rules" — that section is out of scope for this task and remains unmodified. A future group may formalize these same identifiers there without renumbering, since `D-23` is the highest existing entry there.

| Denial Rule ID | Actor | Denied Capability |
| --- | --- | --- |
| `D-24` | `ApprovedAdmissionsOfficer` | Cannot read, save into, or remove another officer's `ShortlistEntry` rows — `current_application_user_id()` ownership scoping applies via RLS on SELECT and INSERT, and (AMENDED, not a DELETE policy) via the hardened removal RPC's own `WHERE` clause for removal; a foreign officer's entry matches zero rows in either case. |
| `D-25` | `ApprovedAdmissionsOfficer` | Cannot save a student profile that is not currently effectively visible or does not resolve to an available profile (hidden, unpublished, consent-withdrawn, suspended-owner, deleted, malformed, or nonexistent) — `is_admissions_visible_profile(profile_id)` must hold at INSERT time, and any such id fails with the same fixed generic error. This is a visibility gate only; a verified officer may save any effectively visible profile regardless of which student owns it — there is no student-profile ownership restriction between officers. |
| `D-26` | `Pending / Suspended / UnverifiedAdmissionsOfficer` | Cannot read, save into, or remove any shortlist entry (`is_verified_admissions_officer()` gate fails on INSERT via RLS, and inside the hardened removal RPC — not a DELETE policy; the SELECT path is likewise unreachable since it requires the same verified-officer identity via ownership). |
| `D-27` | `StudentOwner / OtherStudent / VerifiedCounselorSameSchool / VerifiedCounselorOtherSchool / PendingCounselor` | Cannot read, write, or otherwise detect the existence of any `ShortlistEntry` — zero policy of any kind is granted to students or counselors on `admissions_shortlist_entries` (deny-by-default; mirrors `G-13`, no student notification). |
| `D-28` | (any role) | Batch 6 introduces no new admissions write path outside `admissions_shortlist_entries` — no admissions INSERT/UPDATE/DELETE policy exists on `student_profiles`, `academic_backgrounds`, `profile_activities`, `profile_achievements`, `profile_visibility_settings`, `counselor_student_links`, `counselor_review_requests`, or `counselor_feedback_notes`; the EXISTING Batch 5 admissions SELECT-only access to the four profile tables is unchanged and continues to apply. |

---

# 13. Security Object Usage Matrix

| Security Object              | MC-1 | MC-2 | MC-3 | MC-4 | MC-5 | MC-6 |
| ---------------------------- | :--: | :--: | :--: | :--: | :--: | :--: |
| `UserAccount`                |   ✓  |   ✓  |   ✓  |      |      |   ✓  |
| `Role`                       |   ✓  |   ✓  |      |      |      |   ✓  |
| `AccessPolicy`               |   ✓  |   ✓  |   ✓  |   ✓  |   ✓  |   ✓  |
| `RowLevelSecurityPolicy`     |      |      |   ✓  |      |      |   ✓  |
| `EmailVerificationToken`     |   ✓  |      |      |      |      |      |
| `CounselorInvitation`        |      |   ✓  |      |      |      |      |
| `CounselorProfile`           |      |   ✓  |      |   ✓  |   ✓  |      |
| `VerificationQueueItem`      |      |   ✓  |      |      |      |      |
| `VerificationDecision`       |      |   ✓  |      |      |   ✓  |      |
| `HighSchool`                 |      |   ✓  |   ✓  |   ✓  |   ✓  |      |
| `StudentProfile`             |   ✓  |      |   ✓  |   ✓  |   ✓  |   ✓  |
| `ProfileVisibilitySettings`  |      |      |   ✓  |      |      |   ✓  |
| `ConsentSettings`            |      |      |   ✓  |      |   ✓  |   ✓  |
| `VerificationTier`           |      |      |   ✓  |   ✓  |      |   ✓  |
| `SelfReportedLabel`          |      |      |   ✓  |      |      |   ✓  |
| `TranscriptSupportRequest`   |      |      |      |   ✓  |      |      |
| `UploadedFile`               |      |      |      |   ✓  |      |      |
| `Transcript`                 |      |      |   ✓  |   ✓  |      |      |
| `FileValidationRule`         |      |      |      |   ✓  |      |      |
| `ObjectStorage`              |      |      |      |   ✓  |      |      |
| `AIConsentRecord`            |      |      |      |      |   ✓  |      |
| `AIContextualizationRequest` |      |      |      |      |   ✓  |      |
| `AIContextualizationOutput`  |      |      |      |      |   ✓  |   ✓  |
| `StudentAIReviewDecision`    |      |      |      |      |   ✓  |      |
| `HumanReviewDecision`        |      |      |      |      |   ✓  |      |
| `AIOutputPolicy`             |      |      |      |      |   ✓  |   ✓  |
| `StudentDiscoverySearch`     |      |      |   ✓  |      |      |   ✓  |
| `AdmissionsProfileView`      |      |      |   ✓  |      |   ✓  |   ✓  |
| `ShortlistEntry`             |      |      |      |      |      |   ✓  |
| `SearchIndex`                |   ✓  |      |   ✓  |      |      |   ✓  |
| `AuditLogEntry`              |   ✓  |   ✓  |   ✓  |   ✓  |   ✓  |   ✓  |

---

# 14. Security Method Usage Matrix

| Security / Control Method                                                                                                                                          | MC-1 | MC-2 | MC-3 | MC-4 | MC-5 | MC-6 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--: | :--: | :--: | :--: | :--: | :--: |
| `UserAccount.register(email: string, password: string, role: Role): EmailVerificationToken`                                                                        |   ✓  |      |      |      |      |      |
| `UserAccount.assignRole(role: Role): UserAccount`                                                                                                                  |   ✓  |   ✓  |      |      |      |   ✓  |
| `UserAccount.authenticate(email: string, password: string): UserAccount`                                                                                           |   ✓  |      |      |      |      |   ✓  |
| `UserAccount.blockProfilePublishingUntilVerified(): Void`                                                                                                          |   ✓  |      |   ✓  |      |      |      |
| `UserAccount.suspend(reason: string, actor: UserAccount): UserAccount`                                                                                             |   ✓  |   ✓  |      |      |      |      |
| `EmailVerificationToken.validate(): boolean`                                                                                                                       |   ✓  |      |      |      |      |      |
| `EmailVerificationToken.rejectInvalidOrExpired(): Void`                                                                                                            |   ✓  |      |      |      |      |      |
| `EmailVerificationToken.markConsumed(): EmailVerificationToken`                                                                                                    |   ✓  |      |      |      |      |      |
| `CounselorInvitation.validate(email: string): boolean`                                                                                                             |      |   ✓  |      |      |      |      |
| `CounselorInvitation.rejectInvalidOrConsumed(email: string): Void`                                                                                                 |      |   ✓  |      |      |      |      |
| `CounselorInvitation.markConsumed(): CounselorInvitation`                                                                                                          |      |   ✓  |      |      |      |      |
| `VerificationDecision.approve(admin: UserAccount, counselor: CounselorProfile, note: string): VerificationDecision`                                                |      |   ✓  |      |      |   ✓  |      |
| `VerificationDecision.deny(admin: UserAccount, counselor: CounselorProfile, reason: string): VerificationDecision`                                                 |      |   ✓  |      |      |      |      |
| `AccessPolicy.requireAuthenticated(user: UserAccount): Void`                                                                                                       |   ✓  |      |   ✓  |   ✓  |   ✓  |   ✓  |
| `AccessPolicy.requireVerifiedCounselor(counselor: CounselorProfile): Void`                                                                                         |      |   ✓  |      |   ✓  |   ✓  |      |
| `AccessPolicy.blockUnverifiedCounselor(counselor: CounselorProfile): Void`                                                                                         |      |   ✓  |      |   ✓  |      |      |
| `AccessPolicy.requireSameHighSchool(counselor: CounselorProfile, profile: StudentProfile): Void`                                                                   |      |      |      |   ✓  |   ✓  |      |
| `AccessPolicy.blockSchoolMismatch(counselor: CounselorProfile, profile: StudentProfile): Void`                                                                     |      |      |      |   ✓  |      |      |
| `AccessPolicy.requireApprovedAdmissionsOfficer(officer: AdmissionsOfficerProfile): Void`                                                                           |      |      |      |      |      |   ✓  |
| `AccessPolicy.authorizeAdmissionsSearch(officer: AdmissionsOfficerProfile): boolean`                                                                               |      |      |      |      |      |   ✓  |
| `AccessPolicy.authorizeAdmissionsProfileView(officer: AdmissionsOfficerProfile, profile: StudentProfile): boolean`                                                 |      |      |      |      |      |   ✓  |
| `AccessPolicy.blockUnauthorizedProfileAccess(user: UserAccount, profile: StudentProfile): Void`                                                                    |      |      |      |      |      |   ✓  |
| `RowLevelSecurityPolicy.enforceProfileAccess(user: UserAccount, profile: StudentProfile): boolean`                                                                 |      |      |      |      |      |   ✓  |
| `StudentProfile.checkRequiredSectionsComplete(): boolean`                                                                                                          |   ✓  |      |   ✓  |      |      |      |
| `StudentProfile.publish(): StudentProfile`                                                                                                                         |   ✓  |      |   ✓  |      |      |      |
| `StudentProfile.preventSelfVerifiedTranscriptUpload(): Void`                                                                                                       |      |      |   ✓  |   ✓  |      |      |
| `SelfReportedLabel.applyTo(target: object): SelfReportedLabel`                                                                                                     |      |      |   ✓  |      |      |   ✓  |
| `AdmissionsProfileView.showSelfReportedLabels(labels: List<SelfReportedLabel>): AdmissionsProfileView`                                                             |      |      |   ✓  |      |      |   ✓  |
| `FileValidationRule.validate(file: UploadedFile): boolean`                                                                                                         |      |      |      |   ✓  |      |      |
| `FileValidationRule.rejectInvalidFile(file: UploadedFile): Void`                                                                                                   |      |      |      |   ✓  |      |      |
| `ObjectStorage.storeProtectedFile(file: UploadedFile): string`                                                                                                     |      |      |      |   ✓  |      |      |
| `Transcript.createFromUpload(file: UploadedFile, request: TranscriptSupportRequest): Transcript`                                                                   |      |      |      |   ✓  |      |      |
| `VerificationTier.updateFromSupport(supportType: string): VerificationTier`                                                                                        |      |      |   ✓  |   ✓  |      |      |
| `VerificationTier.applyCounselorSupport(counselor: CounselorProfile): VerificationTier`                                                                            |      |      |   ✓  |   ✓  |      |      |
| `VerificationTier.applyTranscriptSupport(transcript: Transcript): VerificationTier`                                                                                |      |      |   ✓  |   ✓  |      |      |
| `AIConsentRecord.recordConsent(studentProfile: StudentProfile, consentGiven: boolean): AIConsentRecord`                                                            |      |      |      |      |   ✓  |      |
| `AIConsentRecord.withdrawConsent(studentProfile: StudentProfile): AIConsentRecord`                                                                                 |      |      |      |      |   ✓  |   ✓  |
| `AIContextualizationRequest.create(studentProfile: StudentProfile, selectedFields: List<NarrativeResponse>, consent: AIConsentRecord): AIContextualizationRequest` |      |      |      |      |   ✓  |      |
| `AIContextualizationRequest.validateEligibility(): boolean`                                                                                                        |      |      |      |      |   ✓  |      |
| `AIContextualizationRequest.sendToAIService(aiService: AIService): AIContextualizationOutput`                                                                      |      |      |      |      |   ✓  |      |
| `AIContextualizationOutput.storePending(request: AIContextualizationRequest, generatedText: string): AIContextualizationOutput`                                    |      |      |      |      |   ✓  |      |
| `AIContextualizationOutput.labelAsAIGenerated(): AIContextualizationOutput`                                                                                        |      |      |      |      |   ✓  |   ✓  |
| `StudentAIReviewDecision.accept(output: AIContextualizationOutput): StudentAIReviewDecision`                                                                       |      |      |      |      |   ✓  |      |
| `StudentAIReviewDecision.reject(output: AIContextualizationOutput, reason: string): StudentAIReviewDecision`                                                       |      |      |      |      |   ✓  |      |
| `HumanReviewDecision.approve(reviewer: UserAccount, output: AIContextualizationOutput, note: string): HumanReviewDecision`                                         |      |      |      |      |   ✓  |      |
| `HumanReviewDecision.reject(reviewer: UserAccount, output: AIContextualizationOutput, reason: string): HumanReviewDecision`                                        |      |      |      |      |   ✓  |      |
| `AIOutputPolicy.canDisplay(output: AIContextualizationOutput): boolean`                                                                                            |      |      |      |      |   ✓  |   ✓  |
| `AIOutputPolicy.blockUnreviewedOutput(output: AIContextualizationOutput): Void`                                                                                    |      |      |      |      |   ✓  |   ✓  |
| `AIOutputPolicy.blockRejectedOutput(output: AIContextualizationOutput): Void`                                                                                      |      |      |      |      |   ✓  |   ✓  |
| `AIOutputPolicy.hideAfterConsentWithdrawal(output: AIContextualizationOutput): AIContextualizationOutput`                                                          |      |      |      |      |   ✓  |   ✓  |
| `AdmissionsProfileView.includeApprovedAI(output: AIContextualizationOutput): AdmissionsProfileView`                                                                |      |      |      |      |   ✓  |   ✓  |
| `StudentDiscoverySearch.execute(filters: List<SearchFilter>): List<StudentProfile>`                                                                                |      |      |      |      |      |   ✓  |
| `StudentDiscoverySearch.excludeHiddenProfiles(): Void`                                                                                                             |      |      |   ✓  |      |      |   ✓  |
| `SearchIndex.indexProfile(profile: StudentProfile): Void`                                                                                                          |   ✓  |      |   ✓  |      |      |   ✓  |
| `SearchIndex.removeProfile(profile: StudentProfile): Void`                                                                                                         |   ✓  |      |   ✓  |      |      |   ✓  |
| `Database.queryVisibleProfiles(filters: List<SearchFilter>, officer: AdmissionsOfficerProfile): List<StudentProfile>`                                              |      |      |      |      |      |   ✓  |
| `ShortlistEntry.open(officer: AdmissionsOfficerProfile): AdmissionsProfileView`                                                                                    |      |      |      |      |      |   ✓  |
| `AuditLogEntry.record(actor: UserAccount, action: string, target: object, outcome: string): AuditLogEntry`                                                         |   ✓  |   ✓  |      |      |      |      |
| `AuditLogEntry.recordTranscriptAction(counselor: CounselorProfile, request: TranscriptSupportRequest, outcome: string): AuditLogEntry`                             |      |      |      |   ✓  |      |      |
| `AuditLogEntry.recordAIAction(actor: UserAccount, output: AIContextualizationOutput, action: string, outcome: string): AuditLogEntry`                              |      |      |      |      |   ✓  |      |
| `AuditLogEntry.recordAccessDenied(user: UserAccount, resource: object, reason: string): AuditLogEntry`                                                             |      |      |      |   ✓  |      |   ✓  |
| `AuditLogEntry.recordSecurityEvent(actor: UserAccount, eventType: string, target: object, outcome: string): AuditLogEntry`                                         |   ✓  |   ✓  |   ✓  |   ✓  |   ✓  |   ✓  |

---

# 15. Trust Boundary Misuse Mapping

| Trust Boundary                                   | Misuse Cases           | Required Controls                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------ | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TB-1 Browser / RecruitBookApp`                  | MC-1, MC-2, MC-3, MC-6 | `AccessPolicy.evaluate(user: UserAccount, resource: object, action: string): boolean`; server-side authorization; token validation.                                                                                                                                                                 |
| `TB-2 RecruitBookApp / Database`                 | MC-3, MC-6             | `RowLevelSecurityPolicy.enforceProfileAccess(user: UserAccount, profile: StudentProfile): boolean`; `Database.queryVisibleProfiles(filters: List<SearchFilter>, officer: AdmissionsOfficerProfile): List<StudentProfile>`                                                                           |
| `TB-3 RecruitBookApp / ObjectStorage`            | MC-4                   | `FileValidationRule.validate(file: UploadedFile): boolean`; `ObjectStorage.storeProtectedFile(file: UploadedFile): string`                                                                                                                                                                          |
| `TB-4 RecruitBookApp / EmailService`             | MC-1, MC-2             | `EmailVerificationToken.validate(): boolean`; `CounselorInvitation.validate(email: string): boolean`                                                                                                                                                                                                |
| `TB-5 RecruitBookApp / AIService`                | MC-5                   | `AIContextualizationRequest.create(studentProfile: StudentProfile, selectedFields: List<NarrativeResponse>, consent: AIConsentRecord): AIContextualizationRequest`; `AIContextualizationOutput.storePending(request: AIContextualizationRequest, generatedText: string): AIContextualizationOutput` |
| `TB-6 RecruitBookApp / SearchIndex`              | MC-1, MC-3, MC-6       | `SearchIndex.indexProfile(profile: StudentProfile): Void`; `SearchIndex.removeProfile(profile: StudentProfile): Void`; `StudentDiscoverySearch.excludeHiddenProfiles(): Void`                                                                                                                       |
| `TB-7 AdmissionsOfficer / AdmissionsProfileView` | MC-5, MC-6             | `AccessPolicy.authorizeAdmissionsProfileView(officer: AdmissionsOfficerProfile, profile: StudentProfile): boolean`; `AIOutputPolicy.canDisplay(output: AIContextualizationOutput): boolean`; `ShortlistEntry.open(officer: AdmissionsOfficerProfile): AdmissionsProfileView`                        |
| `TB-8 Counselor / TranscriptSupportRequest`      | MC-2, MC-4             | `AccessPolicy.requireVerifiedCounselor(counselor: CounselorProfile): Void`; `AccessPolicy.requireSameHighSchool(counselor: CounselorProfile, profile: StudentProfile): Void`                                                                                                                        |

---

# 16. STRIDE Mapping

| Misuse Case                                                 | Spoofing | Tampering | Repudiation | Information Disclosure | Denial of Service | Elevation of Privilege |
| ----------------------------------------------------------- | :------: | :-------: | :---------: | :--------------------: | :---------------: | :--------------------: |
| `MC-1 Account Creation Abuse`                               |     ✓    |           |             |                        |         ✓         |            ✓           |
| `MC-2 Invitation Link Interception / Identity Substitution` |     ✓    |     ✓     |             |                        |                   |            ✓           |
| `MC-3 Manipulative Profile Submission`                      |          |     ✓     |      ✓      |            ✓           |                   |                        |
| `MC-4 Malicious / Incorrect Transcript Upload`              |          |     ✓     |             |            ✓           |                   |            ✓           |
| `MC-5 AI Prompt Manipulation or Unreviewed AI Output`       |          |     ✓     |      ✓      |            ✓           |                   |                        |
| `MC-6 Unauthorized Profile Access & Consent Bypass`         |          |     ✓     |             |            ✓           |                   |            ✓           |

---

# 17. Diagram Traceability Matrix

| Diagram                                      | Required Misuse Cases | Required Security Objects                                                                                                                  | Required Method-Level Controls                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `03_misuse_case_diagram.puml`                | MC-1 through MC-6     | `AccessPolicy`, `RowLevelSecurityPolicy`, `AIOutputPolicy`, `FileValidationRule`, `AuditLogEntry`                                          | Use mitigation methods as notes, not oversized use cases.                                                                                                                                                                                                                                                                                                             |
| `04_secure_domain_class_diagram.puml`        | MC-1 through MC-6     | `AccessPolicy`, `RowLevelSecurityPolicy`, `AIOutputPolicy`, `FileValidationRule`, `AuditLogEntry`, `VerificationTier`, `SelfReportedLabel` | Show policy dependencies to protected objects.                                                                                                                                                                                                                                                                                                                        |
| `05_student_profile_activity.puml`           | MC-1, MC-3, MC-6      | `StudentProfile`, `EmailVerificationToken`, `VerificationTier`, `SelfReportedLabel`, `SearchIndex`                                         | `UserAccount.blockProfilePublishingUntilVerified(): Void`; `StudentProfile.checkRequiredSectionsComplete(): boolean`; `SelfReportedLabel.applyTo(target: object): SelfReportedLabel`                                                                                                                                                                                  |
| `06_counselor_verification_sequence.puml`    | MC-2                  | `CounselorInvitation`, `CounselorProfile`, `VerificationDecision`, `AuditLogEntry`                                                         | `CounselorInvitation.validate(email: string): boolean`; `CounselorInvitation.rejectInvalidOrConsumed(email: string): Void`; `VerificationDecision.deny(admin: UserAccount, counselor: CounselorProfile, reason: string): VerificationDecision`                                                                                                                        |
| `07_transcript_support_activity.puml`        | MC-4                  | `CounselorProfile`, `TranscriptSupportRequest`, `UploadedFile`, `FileValidationRule`, `ObjectStorage`, `AuditLogEntry`                     | `AccessPolicy.requireVerifiedCounselor(counselor: CounselorProfile): Void`; `AccessPolicy.requireSameHighSchool(counselor: CounselorProfile, profile: StudentProfile): Void`; `FileValidationRule.validate(file: UploadedFile): boolean`                                                                                                                              |
| `08_ai_contextualization_state_machine.puml` | MC-5                  | `AIConsentRecord`, `AIContextualizationOutput`, `StudentAIReviewDecision`, `HumanReviewDecision`, `AIOutputPolicy`                         | `AIOutputPolicy.blockUnreviewedOutput(output: AIContextualizationOutput): Void`; `AIOutputPolicy.blockRejectedOutput(output: AIContextualizationOutput): Void`; `AIOutputPolicy.hideAfterConsentWithdrawal(output: AIContextualizationOutput): AIContextualizationOutput`                                                                                             |
| `09_ai_contextualization_sequence.puml`      | MC-5                  | `AIService`, `AIContextualizationRequest`, `AIContextualizationOutput`, `AIOutputPolicy`, `AuditLogEntry`                                  | `AIContextualizationRequest.sendToAIService(aiService: AIService): AIContextualizationOutput`; `AIContextualizationOutput.storePending(request: AIContextualizationRequest, generatedText: string): AIContextualizationOutput`; `AuditLogEntry.recordAIAction(actor: UserAccount, output: AIContextualizationOutput, action: string, outcome: string): AuditLogEntry` |
| `10_admissions_search_sequence.puml`         | MC-6                  | `AdmissionsOfficerProfile`, `StudentDiscoverySearch`, `AdmissionsProfileView`, `ShortlistEntry`, `RowLevelSecurityPolicy`, `AuditLogEntry` | `AccessPolicy.requireApprovedAdmissionsOfficer(officer: AdmissionsOfficerProfile): Void`; `AccessPolicy.authorizeAdmissionsProfileView(officer: AdmissionsOfficerProfile, profile: StudentProfile): boolean`; `ShortlistEntry.open(officer: AdmissionsOfficerProfile): AdmissionsProfileView`                                                                         |
| `11_student_profile_state_machine.puml`      | MC-1, MC-3, MC-6      | `StudentProfile`, `ProfileVisibilitySettings`, `ConsentSettings`, `SearchIndex`                                                            | `StudentProfile.publish(): StudentProfile`; `StudentProfile.unpublish(): StudentProfile`; `StudentProfile.isVisibleToAdmissions(): boolean`; `SearchIndex.removeProfile(profile: StudentProfile): Void`                                                                                                                                                               |
| `12_trust_boundary_dfd.puml`                 | MC-1 through MC-6     | All security policy objects and external systems                                                                                           | Show TB-1 through TB-8 and label sensitive flows by object name.                                                                                                                                                                                                                                                                                                      |
| `13_component_deployment_diagram.puml`       | MC-1 through MC-6     | `Database`, `ObjectStorage`, `EmailService`, `AIService`, `SearchIndex`                                                                    | Show RLS, protected storage, token handling, AI review boundary, and search-index visibility rules.                                                                                                                                                                                                                                                                   |

---

# 18. Misuse Case Implementation Constraints

| Constraint ID | Constraint                                                                                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MC-IC-01`    | Do not implement authorization as client-side route hiding only.                                                                                                                                              |
| `MC-IC-02`    | Do not allow `Role` alone to authorize sensitive data access.                                                                                                                                                 |
| `MC-IC-03`    | Do not allow unverified student accounts to publish profiles.                                                                                                                                                 |
| `MC-IC-04`    | Do not allow counselor or admissions roles to be self-granted during registration.                                                                                                                            |
| `MC-IC-05`    | Do not allow pending counselors to open `CounselorProfile.openStudentRoster(): List<StudentProfile>`.                                                                                                         |
| `MC-IC-06`    | Do not allow counselors to open `CounselorProfile.openTranscriptRequest(request: TranscriptSupportRequest): TranscriptSupportRequest` unless verified and same-school matched.                                |
| `MC-IC-07`    | Do not allow `UploadedFile.store(fileBytes: binary, objectStorage: ObjectStorage): UploadedFile` before `FileValidationRule.validate(file: UploadedFile): boolean`.                                           |
| `MC-IC-08`    | Do not allow public unauthenticated transcript file URLs.                                                                                                                                                     |
| `MC-IC-09`    | Do not allow students to directly execute trust elevation through `VerificationTier.updateFromSupport(supportType: string): VerificationTier`.                                                                |
| `MC-IC-10`    | Do not allow AI contextualization without `AIConsentRecord.recordConsent(studentProfile: StudentProfile, consentGiven: boolean): AIConsentRecord`.                                                            |
| `MC-IC-11`    | Do not allow `AIService` to publish directly to `AdmissionsProfileView`.                                                                                                                                      |
| `MC-IC-12`    | Do not allow `AIContextualizationOutput` to replace `NarrativeResponse`.                                                                                                                                      |
| `MC-IC-13`    | Do not allow `AdmissionsProfileView.includeApprovedAI(output: AIContextualizationOutput): AdmissionsProfileView` unless `AIOutputPolicy.canDisplay(output: AIContextualizationOutput): boolean` returns true. |
| `MC-IC-14`    | Do not allow `StudentDiscoverySearch.execute(filters: List<SearchFilter>): List<StudentProfile>` to return unpublished, hidden, or consent-restricted profiles.                                               |
| `MC-IC-15`    | Do not allow `ShortlistEntry.open(officer: AdmissionsOfficerProfile): AdmissionsProfileView` to bypass current visibility, consent, and authorization checks.                                                 |
| `MC-IC-16`    | Do not allow direct object identifiers or old URLs to bypass `AccessPolicy.authorizeAdmissionsProfileView(officer: AdmissionsOfficerProfile, profile: StudentProfile): boolean`.                              |

---

# 19. Misuse Catalog Maintenance Rules

| Rule ID   | Rule                                                                                                                          |
| --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `MC-M-01` | If a new use case is added, evaluate whether it creates a new misuse case.                                                    |
| `MC-M-02` | If a new sensitive object is added, map it to at least one misuse case or explicitly classify it as not externally reachable. |
| `MC-M-03` | If a new external service is added, add a trust boundary and misuse-case mapping.                                             |
| `MC-M-04` | If a method is added to `recruitbook_method_catalog.md`, evaluate whether attackers can target it.                            |
| `MC-M-05` | If a method is removed or renamed, update all misuse case target and defensive method references.                             |
| `MC-M-06` | If a security policy object changes, update Sections 13, 14, 15, and 17.                                                      |
| `MC-M-07` | If a new diagram is added, update Section 17.                                                                                 |
| `MC-M-08` | Do not leave generic mitigation phrases without method-level controls.                                                        |
| `MC-M-09` | Keep misuse case titles aligned with MC-1 through MC-6 unless a new misuse case is explicitly approved.                       |
| `MC-M-10` | Preserve object and method naming alignment with the approved catalogs.                                                       |
