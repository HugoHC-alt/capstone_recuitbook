# RecruitBook Use Case Summary

This file summarizes RecruitBook use cases and maps each functional flow directly to approved method names, domain objects, security controls, and misuse-case protections.

Use this file together with:

- `context/recruitbook_object_catalog.md`
- `context/recruitbook_relationship_catalog.md`
- `context/recruitbook_method_catalog.md`
- `context/recruitbook_actor_matrix.md`
- `context/security_rules.md`
- `context/diagram_rules.md`

---

# 1. Use Case Summary Rules

- Use object names exactly as defined in `context/recruitbook_object_catalog.md`.
- Use method names exactly as defined in `context/recruitbook_method_catalog.md`.
- Do not generalize actions when an approved method exists.
- Do not introduce new use cases, actors, objects, or methods without explicit approval.
- Every use case flow must include relevant security and validation controls.
- Every flow involving sensitive student data must reference `AccessPolicy`, `ProfileVisibilitySettings`, `ConsentSettings`, `RowLevelSecurityPolicy`, or `AIOutputPolicy` when applicable.
- Every flow involving transcript files must reference `FileValidationRule`.
- Every privileged or security-sensitive flow should reference `AuditLogEntry`.
- Every flow involving AI output must preserve separation between `NarrativeResponse` and `AIContextualizationOutput`.

---

# 2. Actor Reference

| Actor | Relevant Object / Role | Primary Use Cases |
|---|---|---|
| `Student` | `UserAccount`, `StudentProfile` | UC-1, UC-3, UC-4, UC-5 |
| `Counselor` | `UserAccount`, `CounselorProfile` | UC-2, UC-4, UC-5 |
| `PlatformAdministrator` | `UserAccount` with administrator role | UC-2, UC-5, MC-1, MC-2, MC-5 |
| `AdmissionsOfficer` | `UserAccount`, `AdmissionsOfficerProfile` | UC-6 |
| `Attacker` | External malicious actor | MC-1, MC-2, MC-3, MC-4, MC-5, MC-6 |
| `RecruitBookSystem` | `RecruitBookApp`, policies, database, storage, services | All UC and MC flows |
| `AIService` | External AI/LLM system | UC-5, MC-5 |
| `EmailService` | External email system | UC-1, UC-2 |
| `Database` | Data store | All UC and MC flows |
| `ObjectStorage` | Protected object storage | UC-4, MC-4 |
| `SearchIndex` | Search infrastructure | UC-3, UC-6, MC-6 |

---

# 3. UC-1 Student Registration & Email Verification

| Field | Value |
|---|---|
| Use Case ID | UC-1 |
| Title | Student Registration & Email Verification |
| Primary Actor | `Student` |
| Primary Goal | Create a student `UserAccount`, verify email ownership, and allow the student to begin profile initialization. |
| Primary Objects | `UserAccount`, `Role`, `EmailVerificationToken`, `EmailService`, `AccessPolicy`, `AuditLogEntry` |
| Related Misuse Case | MC-1 Account Creation Abuse |

## UC-1 Method Flow

| Step | Actor / Executor | Approved Method | Required Security / Validation Controls | State / Output |
|---|---|---|---|---|
| 1 | `Student` | `UserAccount.register(email: string, password: string, role: Role): EmailVerificationToken` | Validate email format, password strength, duplicate account status, role restrictions, and rate limiting. | Creates email-unverified `UserAccount`; returns `EmailVerificationToken`. |
| 2 | `RecruitBookSystem` | `UserAccount.assignRole(role: Role): UserAccount` | Student role may be assigned through controlled registration flow. Counselor/admissions roles cannot self-grant privileged access. | `UserAccount` receives `Role`. |
| 3 | `RecruitBookSystem` | `EmailService.sendVerificationEmail(email: string, token: EmailVerificationToken): Void` | Verification token must be system-generated, single-use, account-bound, unused, and unexpired. | Verification email sent. |
| 4 | `Student` / `RecruitBookSystem` | `EmailVerificationToken.validate(): boolean` | Token authenticity, expiration, consumed status, single-use status, and account binding must pass. | Returns validation result. |
| 5 | `RecruitBookSystem` | `EmailVerificationToken.rejectInvalidOrExpired(): Void` | Rejects expired, invalid, or already-used verification token. | Throws `VerificationError` if invalid. |
| 6 | `RecruitBookSystem` | `UserAccount.verifyEmail(token: EmailVerificationToken): UserAccount` | Token must be authentic, unused, unexpired, single-use, and bound to target account. | Marks account email-verified. |
| 7 | `RecruitBookSystem` | `EmailVerificationToken.markConsumed(): EmailVerificationToken` | Requires successful token validation. | Token marked consumed. |
| 8 | `RecruitBookSystem` | `UserAccount.markEmailVerified(): UserAccount` | Requires successful `EmailVerificationToken.validate()`. | `UserAccount` enters email-verified state. |
| 9 | `RecruitBookSystem` | `UserAccount.blockProfilePublishingUntilVerified(): Void` | Prevents unverified student accounts from publishing or entering search. | Enforced before UC-3 publication. |

## UC-1 Security Bridge

| Threat / Risk | Security Control Method | Protected Object |
|---|---|---|
| Automated account creation | `UserAccount.register(email: string, password: string, role: Role): EmailVerificationToken` | `UserAccount` |
| Unverified account publishing | `UserAccount.blockProfilePublishingUntilVerified(): Void` | `StudentProfile` |
| Token replay | `EmailVerificationToken.validate(): boolean`; `EmailVerificationToken.markConsumed(): EmailVerificationToken` | `EmailVerificationToken` |
| Invalid verification attempt | `EmailVerificationToken.rejectInvalidOrExpired(): Void` | `UserAccount` |
| Suspicious/fraudulent account activity | `UserAccount.suspend(reason: string, actor: UserAccount): UserAccount`; `AuditLogEntry.recordSecurityEvent(actor: UserAccount, eventType: string, target: object, outcome: string): AuditLogEntry` | `UserAccount`, `AuditLogEntry` |

---

# 4. UC-2 Counselor Onboarding & Verification

| Field | Value |
|---|---|
| Use Case ID | UC-2 |
| Title | Counselor Onboarding & Verification |
| Primary Actor | `Counselor` |
| Secondary Actor | `PlatformAdministrator` |
| Primary Goal | Create a counselor account bound to a specific `HighSchool` and verify counselor legitimacy before dashboard access. |
| Primary Objects | `UserAccount`, `Role`, `CounselorInvitation`, `CounselorProfile`, `HighSchool`, `VerificationQueueItem`, `VerificationDecision`, `EmailService`, `AuditLogEntry` |
| Related Misuse Case | MC-2 Invitation Link Interception / Identity Substitution |

## UC-2 Method Flow

| Step | Actor / Executor | Approved Method | Required Security / Validation Controls | State / Output |
|---|---|---|---|---|
| 1 | `PlatformAdministrator` | `CounselorInvitation.create(admin: UserAccount, counselorEmail: string, counselorName: string, highSchool: HighSchool): CounselorInvitation` | Requires platform administrator role. Invitation must be signed, single-use, expiring, email-bound, and school-bound. | Creates `CounselorInvitation`. |
| 2 | `RecruitBookSystem` | `CounselorInvitation.send(emailService: EmailService): Void` | Sends only through approved `EmailService` to invitation-bound email. | Invitation email sent. |
| 3 | `RecruitBookSystem` | `EmailService.sendCounselorInvitation(email: string, invitation: CounselorInvitation): Void` | Invitation must be email-bound and school-bound. | Invitation delivered. |
| 4 | `Counselor` / `RecruitBookSystem` | `CounselorInvitation.validate(email: string): boolean` | Invitation must be authentic, unused, unexpired, email-bound, and school-bound. | Returns validation result. |
| 5 | `RecruitBookSystem` | `CounselorInvitation.rejectInvalidOrConsumed(email: string): Void` | Rejects invalid, expired, consumed, or email-mismatched invitation. | Throws `InvitationError` if invalid. |
| 6 | `Counselor` / `RecruitBookSystem` | `CounselorProfile.registerFromInvitation(invitation: CounselorInvitation, fullName: string, password: string): CounselorProfile` | Requires valid invitation, password strength, matching email, pending-verification state, and school binding. | Creates pending `CounselorProfile`. |
| 7 | `RecruitBookSystem` | `CounselorProfile.bindToHighSchool(highSchool: HighSchool): CounselorProfile` | `HighSchool` must match invitation-bound school. Counselor cannot self-change school. | Counselor bound to `HighSchool`. |
| 8 | `RecruitBookSystem` | `CounselorInvitation.markConsumed(): CounselorInvitation` | Requires successful invitation validation. | Invitation marked consumed. |
| 9 | `RecruitBookSystem` | `VerificationQueueItem.createForCounselor(counselor: CounselorProfile): VerificationQueueItem` | Counselor remains restricted until queue item is resolved. | Queue item created. |
| 10 | `PlatformAdministrator` | `VerificationQueueItem.assignToAdmin(admin: UserAccount): VerificationQueueItem` | Requires platform administrator role. | Queue item assigned. |
| 11 | `PlatformAdministrator` | `VerificationDecision.approve(admin: UserAccount, counselor: CounselorProfile, note: string): VerificationDecision` | Requires admin role; verification note required; identity should be checked through school website or office phone. | Approval decision created. |
| 12 | `PlatformAdministrator` | `VerificationDecision.deny(admin: UserAccount, counselor: CounselorProfile, reason: string): VerificationDecision` | Requires admin role; denial reason required; account remains restricted or suspended. | Denial decision created. |
| 13 | `RecruitBookSystem` | `CounselorProfile.markVerified(decision: VerificationDecision): CounselorProfile` | Requires approved `VerificationDecision`. | Counselor becomes verified. |
| 14 | `RecruitBookSystem` | `CounselorProfile.markSuspended(reason: string): CounselorProfile` | Requires admin or automated security workflow; reason required. | Counselor suspended. |
| 15 | `RecruitBookSystem` | `AuditLogEntry.record(actor: UserAccount, action: string, target: object, outcome: string): AuditLogEntry` | Required for invitation creation, approval, denial, suspension, and privileged verification actions. | Audit trail created. |
| 16 | `RecruitBookSystem` | `EmailService.sendCounselorApprovalNotice(email: string): Void` | Sent only after verified administrator approval. | Approval notice sent. |

## UC-2 Security Bridge

| Threat / Risk | Security Control Method | Protected Object |
|---|---|---|
| Invitation interception | `CounselorInvitation.validate(email: string): boolean`; `CounselorInvitation.rejectInvalidOrConsumed(email: string): Void` | `CounselorInvitation` |
| Invitation replay | `CounselorInvitation.markConsumed(): CounselorInvitation` | `CounselorInvitation` |
| Fraudulent counselor account | `VerificationDecision.deny(admin: UserAccount, counselor: CounselorProfile, reason: string): VerificationDecision` | `CounselorProfile` |
| Premature counselor dashboard access | `AccessPolicy.requireVerifiedCounselor(counselor: CounselorProfile): Void` | `CounselorProfile` |
| Privileged verification action | `AuditLogEntry.record(actor: UserAccount, action: string, target: object, outcome: string): AuditLogEntry` | `AuditLogEntry` |

---

# 5. UC-3 Student Profile Creation, Editing, Preview, and Publication

| Field | Value |
|---|---|
| Use Case ID | UC-3 |
| Title | Student Profile Creation, Editing, Preview, and Publication |
| Primary Actor | `Student` |
| Primary Goal | Create, save, preview, and publish a student profile for admissions officer discovery. |
| Primary Objects | `StudentProfile`, `IdentityInformation`, `HighSchool`, `AcademicRecord`, `GradingScale`, `AcademicInterest`, `NarrativeResponse`, `ProfileItem`, `ProfileVisibilitySettings`, `ConsentSettings`, `VerificationTier`, `SelfReportedLabel`, `AdmissionsProfileView`, `SearchIndex` |
| Related Misuse Case | MC-3 Manipulative Profile Submission |

## UC-3 Method Flow

| Step | Actor / Executor | Approved Method | Required Security / Validation Controls | State / Output |
|---|---|---|---|---|
| 1 | `Student` / `RecruitBookSystem` | `AccessPolicy.requireAuthenticated(user: UserAccount): Void` | Requires authenticated session. | Allows profile initialization flow. |
| 2 | `Student` | `StudentProfile.initialize(owner: UserAccount): StudentProfile` | Requires authenticated, email-verified student account. | Draft `StudentProfile` created. |
| 3 | `Student` | `StudentProfile.updateIdentity(info: IdentityInformation): StudentProfile` | Requires ownership; validates legal name, date of birth, country of citizenship, and country of residence. | Identity fields saved. |
| 4 | `RecruitBookSystem` | `IdentityInformation.validate(): boolean` | Required fields must be complete and correctly formatted. | Returns validation result. |
| 5 | `Student` / `RecruitBookSystem` | `HighSchool.verifyExists(name: string): HighSchool` | School must exist or be approved. | Returns `HighSchool`. |
| 6 | `Student` | `StudentProfile.linkHighSchool(highSchool: HighSchool): StudentProfile` | Requires ownership; high school must exist or be approved. | Profile linked to `HighSchool`. |
| 7 | `Student` | `StudentProfile.addAcademicRecord(record: AcademicRecord): StudentProfile` | Requires ownership; academic fields and grading context required; self-reported status preserved. | `AcademicRecord` added. |
| 8 | `RecruitBookSystem` | `AcademicRecord.validate(gradingScale: GradingScale): boolean` | Validates courses, grades, GPA, grade level, expected graduation date, and original grading scale; does not verify truthfulness. | Returns validation result. |
| 9 | `Student` | `StudentProfile.setAcademicInterests(interests: List<AcademicInterest>): StudentProfile` | Requires ownership; must include one to three academic interests. | `AcademicInterest` values saved. |
| 10 | `Student` | `StudentProfile.addNarrativeResponse(response: NarrativeResponse): StudentProfile` | Requires ownership; original student-authored text remains separate from AI output. | `NarrativeResponse` added. |
| 11 | `Student` | `NarrativeResponse.updateText(text: string): NarrativeResponse` | Requires ownership; AI output must not overwrite original text. | `NarrativeResponse` updated. |
| 12 | `Student` | `StudentProfile.addProfileItem(item: ProfileItem): StudentProfile` | Requires ownership; achievements and activities remain self-reported unless later supported. | `ProfileItem` added. |
| 13 | `RecruitBookSystem` | `SelfReportedLabel.applyTo(target: object): SelfReportedLabel` | Applied automatically when data lacks counselor or transcript support. | `SelfReportedLabel` applied. |
| 14 | `Student` | `StudentProfile.autosave(): StudentProfile` | Requires authenticated owner; must not publish automatically. | Draft saved. |
| 15 | `Student` | `StudentProfile.previewAsAdmissionsView(): AdmissionsProfileView` | Requires ownership; preview shows verification tier and self-reported labels; does not bypass production access rules. | Preview generated. |
| 16 | `RecruitBookSystem` | `StudentProfile.checkRequiredSectionsComplete(): boolean` | Checks identity, school, academics, interests, visibility, and consent. | Returns completeness result. |
| 17 | `Student` | `ProfileVisibilitySettings.update(isPublished: boolean, admissionsVisible: boolean): ProfileVisibilitySettings` | Requires ownership; hidden/unpublished profiles must not appear in search or direct access. | Visibility settings updated. |
| 18 | `Student` | `ConsentSettings.update(aiConsent: boolean, admissionsVisibilityConsent: boolean): ConsentSettings` | Requires ownership; consent withdrawal hides optional AI output from admissions views. | Consent settings updated. |
| 19 | `Student` | `StudentProfile.publish(): StudentProfile` | Requires owner, email verification, complete sections, high school affiliation, visibility settings, and consent settings. | Profile marked published. |
| 20 | `RecruitBookSystem` | `SearchIndex.indexProfile(profile: StudentProfile): Void` | Index only published, visible, consent-allowed profiles. | Profile indexed for discovery. |
| 21 | `Student` | `StudentProfile.unpublish(): StudentProfile` | Requires ownership; removes profile from search/direct admissions access. | Profile unpublished. |
| 22 | `RecruitBookSystem` | `SearchIndex.removeProfile(profile: StudentProfile): Void` | Removes profiles that become unpublished, hidden, or consent-restricted. | Profile removed from index. |
| 23 | `RecruitBookSystem` | `StudentProfile.markUpdatedSinceLastViewed(): StudentProfile` | Triggered after published profile changes; must not override visibility/consent. | Profile marked updated since last viewed. |

## UC-3 Security Bridge

| Threat / Risk | Security Control Method | Protected Object |
|---|---|---|
| Publishing incomplete profile | `StudentProfile.checkRequiredSectionsComplete(): boolean` | `StudentProfile` |
| Publishing before email verification | `UserAccount.blockProfilePublishingUntilVerified(): Void` | `StudentProfile` |
| Misleading student-submitted information | `SelfReportedLabel.applyTo(target: object): SelfReportedLabel` | `AcademicRecord`, `ProfileItem`, `NarrativeResponse` |
| Student-controlled trust elevation | `VerificationTier.updateFromSupport(supportType: string): VerificationTier`; `StudentProfile.preventSelfVerifiedTranscriptUpload(): Void` | `VerificationTier`, `Transcript` |
| Hidden profile appearing in search | `SearchIndex.removeProfile(profile: StudentProfile): Void`; `StudentDiscoverySearch.excludeHiddenProfiles(): Void` | `StudentProfile`, `SearchIndex` |
| AI output overwriting student words | `NarrativeResponse.updateText(text: string): NarrativeResponse` | `NarrativeResponse`, `AIContextualizationOutput` |

---

# 6. UC-4 Counselor Student Support & Transcript Upload

| Field | Value |
|---|---|
| Use Case ID | UC-4 |
| Title | Counselor Student Support & Transcript Upload |
| Primary Actor | `Counselor` |
| Secondary Actor | `Student` |
| Primary Goal | Allow a verified counselor to support a student profile and upload transcript-related evidence. |
| Primary Objects | `CounselorProfile`, `StudentProfile`, `HighSchool`, `TranscriptSupportRequest`, `Transcript`, `UploadedFile`, `FileValidationRule`, `ObjectStorage`, `VerificationTier`, `AccessPolicy`, `AuditLogEntry` |
| Related Misuse Case | MC-4 Malicious / Incorrect Transcript Upload |

## UC-4 Method Flow

| Step | Actor / Executor | Approved Method | Required Security / Validation Controls | State / Output |
|---|---|---|---|---|
| 1 | `Student` | `TranscriptSupportRequest.create(studentProfile: StudentProfile): TranscriptSupportRequest` | Requires student profile ownership and linked `HighSchool`. | Transcript support request created. |
| 2 | `RecruitBookSystem` | `TranscriptSupportRequest.assignToCounselor(counselor: CounselorProfile): TranscriptSupportRequest` | Requires verified counselor and same-school match. | Request assigned. |
| 3 | `Counselor` / `RecruitBookSystem` | `AccessPolicy.requireVerifiedCounselor(counselor: CounselorProfile): Void` | Blocks pending, denied, suspended, or unverified counselors. | Counselor authorization gate enforced. |
| 4 | `Counselor` / `RecruitBookSystem` | `AccessPolicy.requireSameHighSchool(counselor: CounselorProfile, profile: StudentProfile): Void` | Counselor and student profile must reference the same `HighSchool`. | Same-school gate enforced. |
| 5 | `Counselor` | `CounselorProfile.openStudentRoster(): List<StudentProfile>` | Requires verified counselor; returns only students linked to counselor’s own high school. | Student roster returned. |
| 6 | `Counselor` | `CounselorProfile.openTranscriptRequest(request: TranscriptSupportRequest): TranscriptSupportRequest` | Requires verified counselor and same-school match. | Request opened. |
| 7 | `Counselor` | `TranscriptSupportRequest.markSchoolInformationSupported(counselor: CounselorProfile): TranscriptSupportRequest` | Requires verified counselor, same-school match, verification tier update, and audit log. | School support recorded. |
| 8 | `RecruitBookSystem` | `FileValidationRule.validate(file: UploadedFile): boolean` | Checks file type allowlist, file size limit, malicious content, and oversized file rejection. | File validation result returned. |
| 9 | `RecruitBookSystem` | `FileValidationRule.rejectInvalidFile(file: UploadedFile): Void` | Rejects unsupported, oversized, malicious, or invalid files. | Throws `FileValidationError` if invalid. |
| 10 | `RecruitBookSystem` | `UploadedFile.store(fileBytes: binary, objectStorage: ObjectStorage): UploadedFile` | Requires successful `FileValidationRule.validate()`. | File stored through protected storage workflow. |
| 11 | `RecruitBookSystem` | `ObjectStorage.storeProtectedFile(file: UploadedFile): string` | Requires successful file validation; must not expose public unauthenticated file URLs. | Returns protected `storagePath`. |
| 12 | `RecruitBookSystem` | `Transcript.createFromUpload(file: UploadedFile, request: TranscriptSupportRequest): Transcript` | Requires valid request, verified counselor, same-school match, and validated uploaded file. | `Transcript` created. |
| 13 | `Counselor` / `RecruitBookSystem` | `TranscriptSupportRequest.submitTranscript(counselor: CounselorProfile, file: UploadedFile): TranscriptSupportRequest` | Requires counselor authorization, school-match check, file validation, protected storage, verification tier update, and audit logging. | Transcript request submitted. |
| 14 | `RecruitBookSystem` | `TranscriptSupportRequest.markSubmitted(): TranscriptSupportRequest` | Only after transcript upload or counselor support succeeds. | Request marked submitted. |
| 15 | `RecruitBookSystem` | `VerificationTier.applyCounselorSupport(counselor: CounselorProfile): VerificationTier` | Requires verified counselor and same high school; student cannot self-assign. | Verification tier updated. |
| 16 | `RecruitBookSystem` | `VerificationTier.applyTranscriptSupport(transcript: Transcript): VerificationTier` | Requires accepted transcript evidence from verified counselor. | Verification tier updated. |
| 17 | `RecruitBookSystem` | `AuditLogEntry.recordTranscriptAction(counselor: CounselorProfile, request: TranscriptSupportRequest, outcome: string): AuditLogEntry` | Records successful upload, rejected upload, support action, or denied access. | Audit entry created. |

## UC-4 Security Bridge

| Threat / Risk | Security Control Method | Protected Object |
|---|---|---|
| Pending counselor roster access | `AccessPolicy.blockUnverifiedCounselor(counselor: CounselorProfile): Void` | `StudentProfile`, `TranscriptSupportRequest` |
| Counselor accesses wrong school’s student | `AccessPolicy.blockSchoolMismatch(counselor: CounselorProfile, profile: StudentProfile): Void` | `StudentProfile` |
| Malicious transcript upload | `FileValidationRule.validate(file: UploadedFile): boolean`; `FileValidationRule.rejectInvalidFile(file: UploadedFile): Void` | `UploadedFile`, `Transcript` |
| Unsafe file storage | `ObjectStorage.storeProtectedFile(file: UploadedFile): string` | `UploadedFile`, `ObjectStorage` |
| Student self-verifies transcript | `StudentProfile.preventSelfVerifiedTranscriptUpload(): Void` | `VerificationTier`, `Transcript` |
| Counselor support without audit trail | `AuditLogEntry.recordTranscriptAction(counselor: CounselorProfile, request: TranscriptSupportRequest, outcome: string): AuditLogEntry` | `AuditLogEntry` |

---

# 7. UC-5 AI Contextualization Request, Review, and Approval

| Field | Value |
|---|---|
| Use Case ID | UC-5 |
| Title | AI Contextualization Request, Review, and Approval |
| Primary Actor | `Student` |
| Secondary Actors | `AIService`, `Counselor`, `PlatformAdministrator` |
| Primary Goal | Generate AI-assisted contextualization while preserving student consent, student control, human review, and admissions-facing labeling. |
| Primary Objects | `StudentProfile`, `NarrativeResponse`, `AIConsentRecord`, `AIContextualizationRequest`, `AIService`, `AIContextualizationOutput`, `StudentAIReviewDecision`, `HumanReviewDecision`, `AIOutputPolicy`, `AdmissionsProfileView`, `AuditLogEntry` |
| Related Misuse Case | MC-5 AI Prompt Manipulation or Unreviewed AI Output |

## UC-5 Method Flow

| Step | Actor / Executor | Approved Method | Required Security / Validation Controls | State / Output |
|---|---|---|---|---|
| 1 | `Student` | `AIConsentRecord.recordConsent(studentProfile: StudentProfile, consentGiven: boolean): AIConsentRecord` | Requires ownership; consent must be explicit and timestamped; AI is off by default. | `AIConsentRecord` created. |
| 2 | `Student` | `AIContextualizationRequest.create(studentProfile: StudentProfile, selectedFields: List<NarrativeResponse>, consent: AIConsentRecord): AIContextualizationRequest` | Requires ownership, explicit consent, eligible fields, and selected narrative responses. | AI request created. |
| 3 | `RecruitBookSystem` | `AIContextualizationRequest.validateEligibility(): boolean` | Profile must have enough academic/contextual data; selected fields must be eligible. | Eligibility result returned. |
| 4 | `RecruitBookSystem` | `AIContextualizationRequest.sendToAIService(aiService: AIService): AIContextualizationOutput` | Sends only approved, selected, consented fields; logs failure; output remains pending review. | Request sent to AI service. |
| 5 | `AIService` / `RecruitBookSystem` | `AIService.generateContext(request: AIContextualizationRequest): AIContextualizationOutput` | External service invoked only through RecruitBookSystem; output cannot become admissions-visible directly. | AI output generated. |
| 6 | `RecruitBookSystem` | `AIContextualizationOutput.storePending(request: AIContextualizationRequest, generatedText: string): AIContextualizationOutput` | Stores output in pending-review state; records prompt metadata where applicable. | Output stored pending review. |
| 7 | `RecruitBookSystem` | `AIContextualizationOutput.labelAsAIGenerated(): AIContextualizationOutput` | Required before any admissions-facing display. | Output labeled AI-generated. |
| 8 | `Student` | `StudentAIReviewDecision.accept(output: AIContextualizationOutput): StudentAIReviewDecision` | Requires owner of output’s profile; does not make output admissions-visible by itself. | Output moves toward human review. |
| 9 | `Student` | `StudentAIReviewDecision.reject(output: AIContextualizationOutput, reason: string): StudentAIReviewDecision` | Requires owner; rejected output must remain hidden; original writing unchanged. | Output rejected by student. |
| 10 | `Student` | `StudentAIReviewDecision.requestRevision(output: AIContextualizationOutput, note: string): StudentAIReviewDecision` | Requires owner; output remains hidden until revised and approved. | Revision requested. |
| 11 | `Counselor` / `PlatformAdministrator` | `HumanReviewDecision.approve(reviewer: UserAccount, output: AIContextualizationOutput, note: string): HumanReviewDecision` | Requires student acceptance first; reviewer must be verified same-school counselor or platform admin. | Human approval recorded. |
| 12 | `Counselor` / `PlatformAdministrator` | `HumanReviewDecision.reject(reviewer: UserAccount, output: AIContextualizationOutput, reason: string): HumanReviewDecision` | Reviewer must be verified same-school counselor or platform admin; rejected output remains hidden. | Human rejection recorded. |
| 13 | `Counselor` / `PlatformAdministrator` | `HumanReviewDecision.requestRevision(reviewer: UserAccount, output: AIContextualizationOutput, note: string): HumanReviewDecision` | Reviewer must be verified same-school counselor or platform admin; output returns to revision state. | Revision requested. |
| 14 | `RecruitBookSystem` | `AIOutputPolicy.canDisplay(output: AIContextualizationOutput): boolean` | True only if student accepted, human approved, consent active, AI-generated label present, and profile visible. | AI display eligibility returned. |
| 15 | `RecruitBookSystem` | `AIOutputPolicy.blockUnreviewedOutput(output: AIContextualizationOutput): Void` | Blocks AI output lacking student acceptance or human approval. | Throws `VisibilityError` if unreviewed. |
| 16 | `RecruitBookSystem` | `AIOutputPolicy.blockRejectedOutput(output: AIContextualizationOutput): Void` | Blocks output rejected by student, counselor, or admin. | Throws `VisibilityError` if rejected. |
| 17 | `RecruitBookSystem` | `AdmissionsProfileView.includeApprovedAI(output: AIContextualizationOutput): AdmissionsProfileView` | Must call `AIOutputPolicy.canDisplay()`; AI output must be labeled as AI-generated. | Approved AI output included in admissions view. |
| 18 | `Student` / `RecruitBookSystem` | `AIConsentRecord.withdrawConsent(studentProfile: StudentProfile): AIConsentRecord` | Requires ownership; hides optional AI output from admissions-facing views; preserves original student content. | Consent withdrawn. |
| 19 | `RecruitBookSystem` | `AIOutputPolicy.hideAfterConsentWithdrawal(output: AIContextualizationOutput): AIContextualizationOutput` | Triggered by consent withdrawal; hides AI output from admissions view. | AI output hidden. |
| 20 | `RecruitBookSystem` | `AuditLogEntry.recordAIAction(actor: UserAccount, output: AIContextualizationOutput, action: string, outcome: string): AuditLogEntry` | Logs AI generation, student review, human review, visibility, rejection, revision, or withdrawal. | Audit entry created. |

## UC-5 Security Bridge

| Threat / Risk | Security Control Method | Protected Object |
|---|---|---|
| AI processing without consent | `AIConsentRecord.recordConsent(studentProfile: StudentProfile, consentGiven: boolean): AIConsentRecord` | `AIConsentRecord`, `NarrativeResponse` |
| Sending unapproved fields to AI | `AIContextualizationRequest.create(studentProfile: StudentProfile, selectedFields: List<NarrativeResponse>, consent: AIConsentRecord): AIContextualizationRequest` | `NarrativeResponse`, `StudentProfile` |
| AI output directly visible to admissions | `AIOutputPolicy.blockUnreviewedOutput(output: AIContextualizationOutput): Void` | `AIContextualizationOutput`, `AdmissionsProfileView` |
| Rejected AI output visible to admissions | `AIOutputPolicy.blockRejectedOutput(output: AIContextualizationOutput): Void` | `AIContextualizationOutput`, `AdmissionsProfileView` |
| AI output confused with student writing | `AIContextualizationOutput.labelAsAIGenerated(): AIContextualizationOutput` | `AIContextualizationOutput`, `NarrativeResponse` |
| Consent withdrawal not respected | `AIOutputPolicy.hideAfterConsentWithdrawal(output: AIContextualizationOutput): AIContextualizationOutput` | `AIContextualizationOutput`, `AdmissionsProfileView` |
| Human review bypass | `HumanReviewDecision.approve(reviewer: UserAccount, output: AIContextualizationOutput, note: string): HumanReviewDecision` | `AIContextualizationOutput` |
| AI review event lacks audit trail | `AuditLogEntry.recordAIAction(actor: UserAccount, output: AIContextualizationOutput, action: string, outcome: string): AuditLogEntry` | `AuditLogEntry` |

---

# 8. UC-6 Admissions Officer Search & Student Profile Review

| Field | Value |
|---|---|
| Use Case ID | UC-6 |
| Title | Admissions Officer Search & Student Profile Review |
| Primary Actor | `AdmissionsOfficer` |
| Primary Goal | Search, filter, open, evaluate, and privately shortlist published student profiles while respecting current visibility, consent, and authorization rules. |
| Primary Objects | `AdmissionsOfficerProfile`, `UniversityAccount`, `StudentDiscoverySearch`, `SearchFilter`, `StudentProfile`, `ProfileVisibilitySettings`, `ConsentSettings`, `AccessPolicy`, `RowLevelSecurityPolicy`, `AdmissionsProfileView`, `AIOutputPolicy`, `Shortlist`, `ShortlistEntry`, `AuditLogEntry` |
| Related Misuse Case | MC-6 Unauthorized Profile Access & Consent Bypass |

## UC-6 Method Flow

| Step | Actor / Executor | Approved Method | Required Security / Validation Controls | State / Output |
|---|---|---|---|---|
| 1 | `AdmissionsOfficer` / `RecruitBookSystem` | `UserAccount.authenticate(email: string, password: string): UserAccount` | Validates credentials, account status, and approval restrictions. | Authenticated `UserAccount`. |
| 2 | `RecruitBookSystem` | `AccessPolicy.requireApprovedAdmissionsOfficer(officer: AdmissionsOfficerProfile): Void` | Officer must be verified, approved, active, and not suspended. | Admissions access gate enforced. |
| 3 | `AdmissionsOfficer` | `AdmissionsOfficerProfile.openDiscoveryPage(): StudentDiscoverySearch` | Requires approved admissions officer; admin only for support/testing if authorized. | Discovery page opened. |
| 4 | `RecruitBookSystem` | `AccessPolicy.authorizeAdmissionsSearch(officer: AdmissionsOfficerProfile): boolean` | Requires verified, approved, active admissions officer. | Search authorization returned. |
| 5 | `AdmissionsOfficer` / `RecruitBookSystem` | `StudentDiscoverySearch.create(officer: AdmissionsOfficerProfile): StudentDiscoverySearch` | Requires `AccessPolicy.requireApprovedAdmissionsOfficer()`. | Search session created. |
| 6 | `AdmissionsOfficer` | `SearchFilter.apply(country: string, region: string, academicInterest: AcademicInterest, graduationYear: number, financialAidNeed: string, verificationTier: VerificationTier): SearchFilter` | Filter fields validated; filters do not bypass visibility, consent, publication, or authorization. | Search filter created. |
| 7 | `AdmissionsOfficer` / `RecruitBookSystem` | `StudentDiscoverySearch.execute(filters: List<SearchFilter>): List<StudentProfile>` | Returns only published, admissions-visible, consent-allowed, authorized profiles. | Search results returned. |
| 8 | `Database` / `RecruitBookSystem` | `Database.queryVisibleProfiles(filters: List<SearchFilter>, officer: AdmissionsOfficerProfile): List<StudentProfile>` | Enforces approved officer, RLS, publication, visibility, and consent. | Visible profile rows returned. |
| 9 | `RecruitBookSystem` | `RowLevelSecurityPolicy.enforceProfileAccess(user: UserAccount, profile: StudentProfile): boolean` | Enforces profile visibility and consent at database/API level. | Row-level access decision returned. |
| 10 | `RecruitBookSystem` | `StudentDiscoverySearch.excludeHiddenProfiles(): Void` | Excludes unpublished, hidden, or consent-restricted profiles. | Hidden profiles excluded. |
| 11 | `RecruitBookSystem` | `StudentDiscoverySearch.returnEmptyState(): string` | Must not reveal hidden or unauthorized profile existence. | Empty state returned when no authorized matches exist. |
| 12 | `AdmissionsOfficer` / `RecruitBookSystem` | `AccessPolicy.authorizeAdmissionsProfileView(officer: AdmissionsOfficerProfile, profile: StudentProfile): boolean` | Checks officer approval, publication, visibility, consent, current access state, and RLS. | Profile view authorization returned. |
| 13 | `RecruitBookSystem` | `AccessPolicy.blockUnauthorizedProfileAccess(user: UserAccount, profile: StudentProfile): Void` | Blocks unapproved role, unpublished profile, hidden profile, consent denial, or failed authorization. | Throws `AuthorizationError` if unauthorized. |
| 14 | `RecruitBookSystem` | `AdmissionsProfileView.render(officer: AdmissionsOfficerProfile, profile: StudentProfile): AdmissionsProfileView` | Requires authorization; renders only allowed fields and approved AI output. | Admissions-safe profile view rendered. |
| 15 | `RecruitBookSystem` | `AdmissionsProfileView.showSelfReportedLabels(labels: List<SelfReportedLabel>): AdmissionsProfileView` | Self-reported labels must appear when information is not counselor-supported or transcript-supported. | Labels displayed. |
| 16 | `RecruitBookSystem` | `AdmissionsProfileView.includeApprovedAI(output: AIContextualizationOutput): AdmissionsProfileView` | Must call `AIOutputPolicy.canDisplay()`; AI output must be labeled as AI-generated. | Approved AI context displayed. |
| 17 | `AdmissionsOfficer` | `Shortlist.create(owner: AdmissionsOfficerProfile, name: string): Shortlist` | Requires approved admissions officer; shortlist is private and does not notify student. | Private shortlist created. |
| 18 | `AdmissionsOfficer` | `Shortlist.addProfile(profile: StudentProfile): ShortlistEntry` | Rechecks current profile visibility, consent, and authorization before saving; does not notify student. | `ShortlistEntry` created. |
| 19 | `AdmissionsOfficer` | `ShortlistEntry.open(officer: AdmissionsOfficerProfile): AdmissionsProfileView` | Rechecks current publication, visibility, consent, and authorization; saved links do not bypass access. | Admissions profile view opened or denied. |
| 20 | `AdmissionsOfficer` | `AdmissionsOfficerProfile.expressInterest(profile: StudentProfile): Void` | Optional; requires current visibility and consent. | Interest recorded if implemented. |
| 21 | `RecruitBookSystem` | `AuditLogEntry.recordAccessDenied(user: UserAccount, resource: object, reason: string): AuditLogEntry` | Records denied direct URL access, roster access, or unauthorized profile view attempts. | Audit entry created if denied. |

## UC-6 Security Bridge

| Threat / Risk | Security Control Method | Protected Object |
|---|---|---|
| Unverified officer accesses discovery | `AccessPolicy.requireApprovedAdmissionsOfficer(officer: AdmissionsOfficerProfile): Void` | `StudentDiscoverySearch` |
| Direct URL profile access | `AccessPolicy.authorizeAdmissionsProfileView(officer: AdmissionsOfficerProfile, profile: StudentProfile): boolean`; `AccessPolicy.blockUnauthorizedProfileAccess(user: UserAccount, profile: StudentProfile): Void` | `StudentProfile`, `AdmissionsProfileView` |
| Hidden profile shown in search | `StudentDiscoverySearch.excludeHiddenProfiles(): Void` | `StudentDiscoverySearch`, `StudentProfile` |
| Database-level consent bypass | `RowLevelSecurityPolicy.enforceProfileAccess(user: UserAccount, profile: StudentProfile): boolean` | `StudentProfile`, `Database` |
| Shortlist bypasses consent withdrawal | `ShortlistEntry.open(officer: AdmissionsOfficerProfile): AdmissionsProfileView` | `ShortlistEntry`, `StudentProfile` |
| Unapproved AI output shown | `AdmissionsProfileView.includeApprovedAI(output: AIContextualizationOutput): AdmissionsProfileView`; `AIOutputPolicy.canDisplay(output: AIContextualizationOutput): boolean` | `AIContextualizationOutput`, `AdmissionsProfileView` |
| Unauthorized access lacks audit trail | `AuditLogEntry.recordAccessDenied(user: UserAccount, resource: object, reason: string): AuditLogEntry` | `AuditLogEntry` |

---

# 9. Misuse Case Summary Bridge

| Misuse Case ID | Title | Threatened Use Case | Primary Attack Surface | Required Control Methods |
|---|---|---|---|---|
| MC-1 | Account Creation Abuse | UC-1 | Public registration endpoint, email verification flow, search indexing pipeline | `UserAccount.register(email: string, password: string, role: Role): EmailVerificationToken`; `UserAccount.blockProfilePublishingUntilVerified(): Void`; `UserAccount.suspend(reason: string, actor: UserAccount): UserAccount`; `AuditLogEntry.recordSecurityEvent(actor: UserAccount, eventType: string, target: object, outcome: string): AuditLogEntry` |
| MC-2 | Invitation Link Interception / Identity Substitution | UC-2 | Counselor invitation email, single-use signed invitation link, verification queue | `CounselorInvitation.validate(email: string): boolean`; `CounselorInvitation.rejectInvalidOrConsumed(email: string): Void`; `CounselorInvitation.markConsumed(): CounselorInvitation`; `VerificationDecision.deny(admin: UserAccount, counselor: CounselorProfile, reason: string): VerificationDecision`; `CounselorProfile.markSuspended(reason: string): CounselorProfile`; `AuditLogEntry.recordSecurityEvent(actor: UserAccount, eventType: string, target: object, outcome: string): AuditLogEntry` |
| MC-3 | Manipulative Profile Submission | UC-3 | Student profile fields, academic records, achievements, school affiliation, verification tier | `SelfReportedLabel.applyTo(target: object): SelfReportedLabel`; `StudentProfile.preventSelfVerifiedTranscriptUpload(): Void`; `VerificationTier.updateFromSupport(supportType: string): VerificationTier`; `VerificationTier.applyCounselorSupport(counselor: CounselorProfile): VerificationTier`; `VerificationTier.applyTranscriptSupport(transcript: Transcript): VerificationTier` |
| MC-4 | Malicious / Incorrect Transcript Upload | UC-4 | Transcript request endpoint, upload endpoint, object storage | `AccessPolicy.requireVerifiedCounselor(counselor: CounselorProfile): Void`; `AccessPolicy.requireSameHighSchool(counselor: CounselorProfile, profile: StudentProfile): Void`; `FileValidationRule.validate(file: UploadedFile): boolean`; `FileValidationRule.rejectInvalidFile(file: UploadedFile): Void`; `ObjectStorage.storeProtectedFile(file: UploadedFile): string`; `AuditLogEntry.recordTranscriptAction(counselor: CounselorProfile, request: TranscriptSupportRequest, outcome: string): AuditLogEntry` |
| MC-5 | AI Prompt Manipulation or Unreviewed AI Output | UC-5 | Narrative prompt fields, AI contextualization request, AI output review workflow, admissions-facing profile | `AIContextualizationRequest.create(studentProfile: StudentProfile, selectedFields: List<NarrativeResponse>, consent: AIConsentRecord): AIContextualizationRequest`; `AIContextualizationOutput.storePending(request: AIContextualizationRequest, generatedText: string): AIContextualizationOutput`; `AIContextualizationOutput.labelAsAIGenerated(): AIContextualizationOutput`; `AIOutputPolicy.blockUnreviewedOutput(output: AIContextualizationOutput): Void`; `AIOutputPolicy.blockRejectedOutput(output: AIContextualizationOutput): Void`; `HumanReviewDecision.approve(reviewer: UserAccount, output: AIContextualizationOutput, note: string): HumanReviewDecision`; `AuditLogEntry.recordAIAction(actor: UserAccount, output: AIContextualizationOutput, action: string, outcome: string): AuditLogEntry` |
| MC-6 | Unauthorized Profile Access & Consent Bypass | UC-6 | Direct profile URL, admissions search, shortlist link, database/API access | `AccessPolicy.authorizeAdmissionsProfileView(officer: AdmissionsOfficerProfile, profile: StudentProfile): boolean`; `AccessPolicy.blockUnauthorizedProfileAccess(user: UserAccount, profile: StudentProfile): Void`; `RowLevelSecurityPolicy.enforceProfileAccess(user: UserAccount, profile: StudentProfile): boolean`; `StudentDiscoverySearch.excludeHiddenProfiles(): Void`; `ShortlistEntry.open(officer: AdmissionsOfficerProfile): AdmissionsProfileView`; `AuditLogEntry.recordAccessDenied(user: UserAccount, resource: object, reason: string): AuditLogEntry` |

---

# 10. Diagram Mapping

| Diagram | Use Case Inputs | Required Method References | Required Security References |
|---|---|---|---|
| `02_use_case_diagram.puml` | UC-1 through UC-6 | Use case names only; do not include every method. | Include high-level security use cases: email verification, counselor verification, authorization check, AI review. |
| `03_misuse_case_diagram.puml` | MC-1 through MC-6 | Include mitigation methods only when represented as notes. | Include `AccessPolicy`, `RowLevelSecurityPolicy`, `AIOutputPolicy`, `FileValidationRule`, `AuditLogEntry`. |
| `05_student_profile_activity.puml` | UC-3 | `StudentProfile.initialize(owner: UserAccount): StudentProfile`; `StudentProfile.publish(): StudentProfile`; `StudentProfile.unpublish(): StudentProfile`; `ProfileVisibilitySettings.update(isPublished: boolean, admissionsVisible: boolean): ProfileVisibilitySettings`; `ConsentSettings.update(aiConsent: boolean, admissionsVisibilityConsent: boolean): ConsentSettings` | `UserAccount.blockProfilePublishingUntilVerified(): Void`; `SelfReportedLabel.applyTo(target: object): SelfReportedLabel`; `SearchIndex.indexProfile(profile: StudentProfile): Void`; `SearchIndex.removeProfile(profile: StudentProfile): Void` |
| `06_counselor_verification_sequence.puml` | UC-2, MC-2 | `CounselorInvitation.create(admin: UserAccount, counselorEmail: string, counselorName: string, highSchool: HighSchool): CounselorInvitation`; `CounselorProfile.registerFromInvitation(invitation: CounselorInvitation, fullName: string, password: string): CounselorProfile`; `VerificationDecision.approve(admin: UserAccount, counselor: CounselorProfile, note: string): VerificationDecision`; `VerificationDecision.deny(admin: UserAccount, counselor: CounselorProfile, reason: string): VerificationDecision` | `CounselorInvitation.validate(email: string): boolean`; `CounselorInvitation.markConsumed(): CounselorInvitation`; `AuditLogEntry.record(actor: UserAccount, action: string, target: object, outcome: string): AuditLogEntry` |
| `07_transcript_support_activity.puml` | UC-4, MC-4 | `TranscriptSupportRequest.create(studentProfile: StudentProfile): TranscriptSupportRequest`; `CounselorProfile.openTranscriptRequest(request: TranscriptSupportRequest): TranscriptSupportRequest`; `TranscriptSupportRequest.submitTranscript(counselor: CounselorProfile, file: UploadedFile): TranscriptSupportRequest` | `AccessPolicy.requireVerifiedCounselor(counselor: CounselorProfile): Void`; `AccessPolicy.requireSameHighSchool(counselor: CounselorProfile, profile: StudentProfile): Void`; `FileValidationRule.validate(file: UploadedFile): boolean`; `AuditLogEntry.recordTranscriptAction(counselor: CounselorProfile, request: TranscriptSupportRequest, outcome: string): AuditLogEntry` |
| `08_ai_contextualization_state_machine.puml` | UC-5, MC-5 | `AIConsentRecord.recordConsent(studentProfile: StudentProfile, consentGiven: boolean): AIConsentRecord`; `AIContextualizationOutput.storePending(request: AIContextualizationRequest, generatedText: string): AIContextualizationOutput`; `StudentAIReviewDecision.accept(output: AIContextualizationOutput): StudentAIReviewDecision`; `HumanReviewDecision.approve(reviewer: UserAccount, output: AIContextualizationOutput, note: string): HumanReviewDecision`; `AIConsentRecord.withdrawConsent(studentProfile: StudentProfile): AIConsentRecord` | `AIOutputPolicy.canDisplay(output: AIContextualizationOutput): boolean`; `AIOutputPolicy.blockUnreviewedOutput(output: AIContextualizationOutput): Void`; `AIOutputPolicy.blockRejectedOutput(output: AIContextualizationOutput): Void`; `AIOutputPolicy.hideAfterConsentWithdrawal(output: AIContextualizationOutput): AIContextualizationOutput` |
| `09_ai_contextualization_sequence.puml` | UC-5, MC-5 | `AIContextualizationRequest.create(studentProfile: StudentProfile, selectedFields: List<NarrativeResponse>, consent: AIConsentRecord): AIContextualizationRequest`; `AIContextualizationRequest.sendToAIService(aiService: AIService): AIContextualizationOutput`; `StudentAIReviewDecision.accept(output: AIContextualizationOutput): StudentAIReviewDecision`; `HumanReviewDecision.approve(reviewer: UserAccount, output: AIContextualizationOutput, note: string): HumanReviewDecision` | `AIContextualizationOutput.labelAsAIGenerated(): AIContextualizationOutput`; `AIOutputPolicy.canDisplay(output: AIContextualizationOutput): boolean`; `AuditLogEntry.recordAIAction(actor: UserAccount, output: AIContextualizationOutput, action: string, outcome: string): AuditLogEntry` |
| `10_admissions_search_sequence.puml` | UC-6, MC-6 | `AdmissionsOfficerProfile.openDiscoveryPage(): StudentDiscoverySearch`; `StudentDiscoverySearch.execute(filters: List<SearchFilter>): List<StudentProfile>`; `AdmissionsProfileView.render(officer: AdmissionsOfficerProfile, profile: StudentProfile): AdmissionsProfileView`; `Shortlist.addProfile(profile: StudentProfile): ShortlistEntry`; `ShortlistEntry.open(officer: AdmissionsOfficerProfile): AdmissionsProfileView` | `AccessPolicy.requireApprovedAdmissionsOfficer(officer: AdmissionsOfficerProfile): Void`; `AccessPolicy.authorizeAdmissionsProfileView(officer: AdmissionsOfficerProfile, profile: StudentProfile): boolean`; `RowLevelSecurityPolicy.enforceProfileAccess(user: UserAccount, profile: StudentProfile): boolean`; `StudentDiscoverySearch.excludeHiddenProfiles(): Void` |
| `11_student_profile_state_machine.puml` | UC-3, MC-6 | `StudentProfile.initialize(owner: UserAccount): StudentProfile`; `StudentProfile.autosave(): StudentProfile`; `StudentProfile.publish(): StudentProfile`; `StudentProfile.unpublish(): StudentProfile`; `StudentProfile.markUpdatedSinceLastViewed(): StudentProfile` | `StudentProfile.isVisibleToAdmissions(): boolean`; `ProfileVisibilitySettings.update(isPublished: boolean, admissionsVisible: boolean): ProfileVisibilitySettings`; `ConsentSettings.update(aiConsent: boolean, admissionsVisibilityConsent: boolean): ConsentSettings` |
| `12_trust_boundary_dfd.puml` | UC-1 through UC-6; MC-1 through MC-6 | Use method groups by boundary crossing. | Include `AccessPolicy`, `RowLevelSecurityPolicy`, `AIOutputPolicy`, `FileValidationRule`, `AuditLogEntry`, `EmailVerificationToken`, `CounselorInvitation`. |
| `13_component_deployment_diagram.puml` | All UC flows | Use infrastructure methods from Section 10 of `context/recruitbook_method_catalog.md`. | Include Database/RLS, ObjectStorage validation, EmailService links, AIService review boundary, SearchIndex visibility restrictions. |

---

# 11. Required Traceability Constraints

| Constraint ID | Rule |
|---|---|
| `UC-TC-01` | UC-1 must always include `EmailVerificationToken.validate(): boolean` before `UserAccount.markEmailVerified(): UserAccount`. |
| `UC-TC-02` | UC-2 must always include `CounselorInvitation.validate(email: string): boolean` before `CounselorProfile.registerFromInvitation(invitation: CounselorInvitation, fullName: string, password: string): CounselorProfile`. |
| `UC-TC-03` | UC-2 must always include `VerificationDecision.approve(admin: UserAccount, counselor: CounselorProfile, note: string): VerificationDecision` before `CounselorProfile.markVerified(decision: VerificationDecision): CounselorProfile`. |
| `UC-TC-04` | UC-3 must always include `StudentProfile.checkRequiredSectionsComplete(): boolean` before `StudentProfile.publish(): StudentProfile`. |
| `UC-TC-05` | UC-3 must always include `SearchIndex.removeProfile(profile: StudentProfile): Void` when `StudentProfile.unpublish(): StudentProfile` occurs. |
| `UC-TC-06` | UC-4 must always include `AccessPolicy.requireVerifiedCounselor(counselor: CounselorProfile): Void` and `AccessPolicy.requireSameHighSchool(counselor: CounselorProfile, profile: StudentProfile): Void` before counselor support or transcript upload. |
| `UC-TC-07` | UC-4 must always include `FileValidationRule.validate(file: UploadedFile): boolean` before `ObjectStorage.storeProtectedFile(file: UploadedFile): string`. |
| `UC-TC-08` | UC-5 must always include `AIConsentRecord.recordConsent(studentProfile: StudentProfile, consentGiven: boolean): AIConsentRecord` before `AIContextualizationRequest.create(studentProfile: StudentProfile, selectedFields: List<NarrativeResponse>, consent: AIConsentRecord): AIContextualizationRequest`. |
| `UC-TC-09` | UC-5 must always include `StudentAIReviewDecision.accept(output: AIContextualizationOutput): StudentAIReviewDecision` and `HumanReviewDecision.approve(reviewer: UserAccount, output: AIContextualizationOutput, note: string): HumanReviewDecision` before `AIOutputPolicy.canDisplay(output: AIContextualizationOutput): boolean` can return true. |
| `UC-TC-10` | UC-5 must always keep `NarrativeResponse` separate from `AIContextualizationOutput`. |
| `UC-TC-11` | UC-6 must always include `AccessPolicy.requireApprovedAdmissionsOfficer(officer: AdmissionsOfficerProfile): Void` before `StudentDiscoverySearch.execute(filters: List<SearchFilter>): List<StudentProfile>`. |
| `UC-TC-12` | UC-6 must always include `AccessPolicy.authorizeAdmissionsProfileView(officer: AdmissionsOfficerProfile, profile: StudentProfile): boolean` before `AdmissionsProfileView.render(officer: AdmissionsOfficerProfile, profile: StudentProfile): AdmissionsProfileView`. |
| `UC-TC-13` | UC-6 must always include `RowLevelSecurityPolicy.enforceProfileAccess(user: UserAccount, profile: StudentProfile): boolean` for database/API-level student profile access. |
| `UC-TC-14` | UC-6 must always recheck visibility and consent when `ShortlistEntry.open(officer: AdmissionsOfficerProfile): AdmissionsProfileView` occurs. |
| `UC-TC-15` | Any denied sensitive access attempt should call `AuditLogEntry.recordAccessDenied(user: UserAccount, resource: object, reason: string): AuditLogEntry` or `AuditLogEntry.recordSecurityEvent(actor: UserAccount, eventType: string, target: object, outcome: string): AuditLogEntry`. |