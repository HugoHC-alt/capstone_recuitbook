# RecruitBook Class Diagram Context

This file defines the approved class diagram structure for RecruitBook.

Use this file together with:

* `context/recruitbook_object_catalog.md`
* `context/recruitbook_relationship_catalog.md`
* `context/recruitbook_method_catalog.md`
* `context/recruitbook_actor_matrix.md`
* `context/use_case_summary.md`
* `context/security_rules.md`
* `context/diagram_rules.md`

This file is intended to guide generation of:

```text
diagrams/04_secure_domain_class_diagram.puml
```

---

# 1. Class Diagram Purpose

The Secure Domain Class Diagram must show the core RecruitBook domain model, including:

* Identity and role access structure.
* Student profile composition.
* Counselor verification and school trust.
* Transcript support and file validation.
* AI contextualization consent, review, and approval.
* Admissions discovery and profile access.
* Security policy objects that enforce authorization, consent, visibility, AI-output review, file validation, and auditability.

The class diagram must support AI-assisted development by making the object model clear enough for implementation while keeping the diagram readable.

---

# 2. Class Diagram Rules

* Use exact object names from `context/recruitbook_object_catalog.md`.
* Use exact method names from `context/recruitbook_method_catalog.md`.
* Use approved relationships from `context/recruitbook_relationship_catalog.md`.
* Do not invent new classes unless the user explicitly approves them.
* Do not include actors as domain classes.
* Do not include UI pages as domain classes unless they are already approved boundary/safe-view objects such as `AdmissionsProfileView`.
* Do not include every method from the method catalog in the diagram.
* Include only class-level methods that clarify domain behavior or security enforcement.
* Use packages to keep the diagram readable.
* Include multiplicities on important relationships.
* Use stereotypes consistently.
* Show security, privacy, trust, consent, verification, and audit objects explicitly.
* Prefer readability over exhaustive detail.
* If the diagram becomes too large, split it into package-level class diagrams.

---

# 3. Approved Stereotypes for Class Diagram

| Stereotype          | Use For                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------- |
| `<<security>>`      | Authentication, verification tokens, account security objects.                            |
| `<<authorization>>` | Role and permission objects.                                                              |
| `<<privacy>>`       | Consent, visibility, and private admissions objects.                                      |
| `<<sensitive>>`     | Student data, academic records, transcripts, and personal information.                    |
| `<<audit>>`         | Audit records and traceability objects.                                                   |
| `<<review>>`        | Human or student review decisions.                                                        |
| `<<trust>>`         | Verification tier, counselor trust, and self-reported labeling.                           |
| `<<policy>>`        | Access, AI-output, file-validation, and row-level security rules.                         |
| `<<external>>`      | External services. Use sparingly in class diagram.                                        |
| `<<workflow>>`      | Request/process objects that move through states.                                         |
| `<<institution>>`   | High school and university objects.                                                       |
| `<<storage>>`       | Uploaded file and storage-related objects.                                                |
| `<<AI-generated>>`  | AI-generated contextualization output.                                                    |
| `<<value-object>>`  | Small descriptive objects such as `GradingScale`, `AcademicInterest`, and `SearchFilter`. |
| `<<safe-view>>`     | Admissions-facing filtered views.                                                         |

---

# 4. Recommended Package Layout

The Secure Domain Class Diagram should use these packages:

```text
Identity & Role Access
Student Profile
School & Counselor Trust
Counselor Support & Transcript
AI Contextualization
Admissions Discovery & Review
Security Policies
```

Recommended PlantUML package structure:

```plantuml
package "Identity & Role Access" {
}

package "Student Profile" {
}

package "School & Counselor Trust" {
}

package "Counselor Support & Transcript" {
}

package "AI Contextualization" {
}

package "Admissions Discovery & Review" {
}

package "Security Policies" {
}
```

---

# 5. Identity & Role Access Classes

## 5.1 `UserAccount` `<<security>>`

| Field          | Content                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsibility | Represents a registered user account. Stores identity, authentication status, account status, and assigned role.                                                                                                                                                                                                                                                                               |
| Key Attributes | `userId: UUID`; `email: string`; `passwordHash: string`; `emailVerified: boolean`; `accountStatus: string`; `createdAt: datetime`; `updatedAt: datetime`                                                                                                                                                                                                                                       |
| Key Methods    | `register(email: string, password: string, role: Role): EmailVerificationToken`; `verifyEmail(token: EmailVerificationToken): UserAccount`; `authenticate(email: string, password: string): UserAccount`; `assignRole(role: Role): UserAccount`; `markEmailVerified(): UserAccount`; `suspend(reason: string, actor: UserAccount): UserAccount`; `blockProfilePublishingUntilVerified(): Void` |
| Security Notes | Email must be verified before student profile publication. Counselor and admissions roles cannot self-grant privileged access. Suspensions require audit logging.                                                                                                                                                                                                                              |

## 5.2 `Role` `<<authorization>>`

| Field          | Content                                                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsibility | Represents a user's primary role.                                                                                                               |
| Key Attributes | `roleId: UUID`; `roleName: string`; `permissions: List<string>`                                                                                 |
| Key Methods    | `canAccess(resource: string, action: string): boolean`                                                                                          |
| Security Notes | Role alone is not sufficient for sensitive access. `AccessPolicy` must evaluate ownership, verification, consent, visibility, and school match. |

## 5.3 `EmailVerificationToken` `<<security>>`

| Field          | Content                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| Responsibility | Represents a single-use email verification token.                                                          |
| Key Attributes | `tokenId: UUID`; `tokenHash: string`; `expiresAt: datetime`; `consumedAt: datetime`; `createdAt: datetime` |
| Key Methods    | `validate(): boolean`; `markConsumed(): EmailVerificationToken`; `rejectInvalidOrExpired(): Void`          |
| Security Notes | Token must be authentic, unused, unexpired, single-use, and bound to the correct account.                  |

## 5.4 `AuditLogEntry` `<<audit>>`

| Field          | Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsibility | Records privileged actions, security-sensitive events, denied access, verification decisions, transcript actions, and AI review actions.                                                                                                                                                                                                                                                                                                                                                                                                                |
| Key Attributes | `auditLogId: UUID`; `actorId: UUID`; `action: string`; `targetType: string`; `targetId: UUID`; `outcome: string`; `reason: string`; `timestamp: datetime`                                                                                                                                                                                                                                                                                                                                                                                               |
| Key Methods    | `record(actor: UserAccount, action: string, target: object, outcome: string): AuditLogEntry`; `recordTranscriptAction(counselor: CounselorProfile, request: TranscriptSupportRequest, outcome: string): AuditLogEntry`; `recordAIAction(actor: UserAccount, output: AIContextualizationOutput, action: string, outcome: string): AuditLogEntry`; `recordAccessDenied(user: UserAccount, resource: object, reason: string): AuditLogEntry`; `recordSecurityEvent(actor: UserAccount, eventType: string, target: object, outcome: string): AuditLogEntry` |
| Security Notes | Must preserve traceability for privileged actions and denied sensitive access.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

---

# 6. Student Profile Classes

## 6.1 `StudentProfile` `<<sensitive>>`

| Field          | Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsibility | Main student profile containing identity, academic context, school affiliation, interests, narrative responses, profile items, visibility, consent, and verification tier.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Key Attributes | `profileId: UUID`; `ownerUserId: UUID`; `highSchoolId: UUID`; `profileStatus: string`; `createdAt: datetime`; `updatedAt: datetime`; `publishedAt: datetime`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Key Methods    | `initialize(owner: UserAccount): StudentProfile`; `updateIdentity(info: IdentityInformation): StudentProfile`; `linkHighSchool(highSchool: HighSchool): StudentProfile`; `addAcademicRecord(record: AcademicRecord): StudentProfile`; `setAcademicInterests(interests: List<AcademicInterest>): StudentProfile`; `addNarrativeResponse(response: NarrativeResponse): StudentProfile`; `addProfileItem(item: ProfileItem): StudentProfile`; `autosave(): StudentProfile`; `previewAsAdmissionsView(): AdmissionsProfileView`; `checkRequiredSectionsComplete(): boolean`; `publish(): StudentProfile`; `unpublish(): StudentProfile`; `markUpdatedSinceLastViewed(): StudentProfile`; `isVisibleToAdmissions(): boolean`; `preventSelfVerifiedTranscriptUpload(): Void` |
| Security Notes | Requires ownership for student edits. Publication requires email verification, complete sections, high school affiliation, visibility settings, and consent settings.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

## 6.2 `IdentityInformation` `<<sensitive>>`

| Field          | Content                                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsibility | Stores student identity details.                                                                                                                    |
| Key Attributes | `identityId: UUID`; `legalName: string`; `preferredName: string`; `dateOfBirth: date`; `countryOfCitizenship: string`; `countryOfResidence: string` |
| Key Methods    | `validate(): boolean`                                                                                                                               |
| Security Notes | Sensitive personal information. Must be access-controlled.                                                                                          |

## 6.3 `AcademicRecord` `<<sensitive>>`

| Field          | Content                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Responsibility | Stores academic data in the student's original academic context.                                                                 |
| Key Attributes | `academicRecordId: UUID`; `gradeLevel: string`; `gpaOrAverage: string`; `expectedGraduationYear: number`; `recordStatus: string` |
| Key Methods    | `validate(gradingScale: GradingScale): boolean`                                                                                  |
| Security Notes | May be self-reported unless supported by counselor or transcript evidence.                                                       |

## 6.4 `GradingScale` `<<value-object>>`

| Field          | Content                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Responsibility | Describes the academic grading scale used to interpret academic records.                                                                               |
| Key Attributes | `scaleId: UUID`; `country: string`; `scaleName: string`; `minimumValue: string`; `maximumValue: string`; `passingValue: string`; `description: string` |
| Key Methods    | None required in class diagram.                                                                                                                        |
| Security Notes | Used for contextualizing academic records without changing the original grading meaning.                                                               |

## 6.5 `AcademicInterest` `<<value-object>>`

| Field          | Content                                                |
| -------------- | ------------------------------------------------------ |
| Responsibility | Represents academic interests selected by the student. |
| Key Attributes | `interestId: UUID`; `name: string`; `category: string` |
| Key Methods    | None required in class diagram.                        |
| Security Notes | Student may select one to three academic interests.    |

## 6.6 `NarrativeResponse` `<<sensitive>>`

| Field          | Content                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| Responsibility | Stores student-authored narrative fields.                                                                           |
| Key Attributes | `narrativeResponseId: UUID`; `promptId: UUID`; `responseText: string`; `createdAt: datetime`; `updatedAt: datetime` |
| Key Methods    | `updateText(text: string): NarrativeResponse`                                                                       |
| Security Notes | Original student writing must remain unchanged and separate from `AIContextualizationOutput`.                       |

## 6.7 `ProfileItem` `<<trust>>`

| Field          | Content                                                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsibility | Represents activities, achievements, awards, or profile items submitted by the student.                                                        |
| Key Attributes | `profileItemId: UUID`; `itemType: string`; `title: string`; `description: string`; `startDate: date`; `endDate: date`; `selfReported: boolean` |
| Key Methods    | None required in class diagram.                                                                                                                |
| Security Notes | Should be labeled as self-reported unless counselor-supported or transcript-supported.                                                         |

## 6.8 `ProfileVisibilitySettings` `<<privacy>>`

| Field          | Content                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| Responsibility | Controls whether a profile is published and admissions-visible.                                           |
| Key Attributes | `visibilitySettingsId: UUID`; `isPublished: boolean`; `admissionsVisible: boolean`; `updatedAt: datetime` |
| Key Methods    | `update(isPublished: boolean, admissionsVisible: boolean): ProfileVisibilitySettings`                     |
| Security Notes | Hidden or unpublished profiles must not appear in search or direct admissions access.                     |

## 6.9 `ConsentSettings` `<<privacy>>`

| Field          | Content                                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| Responsibility | Controls student consent for admissions visibility and AI contextualization.                                   |
| Key Attributes | `consentSettingsId: UUID`; `aiConsent: boolean`; `admissionsVisibilityConsent: boolean`; `updatedAt: datetime` |
| Key Methods    | `update(aiConsent: boolean, admissionsVisibilityConsent: boolean): ConsentSettings`                            |
| Security Notes | Consent withdrawal must remove optional AI contextualization from admissions-facing views.                     |

## 6.10 `VerificationTier` `<<trust>>`

| Field          | Content                                                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Responsibility | Communicates whether profile information is self-reported, counselor-supported, or transcript-supported.                                                                                               |
| Key Attributes | `verificationTierId: UUID`; `tierName: string`; `supportSource: string`; `updatedAt: datetime`                                                                                                         |
| Key Methods    | `updateFromSupport(supportType: string): VerificationTier`; `applyCounselorSupport(counselor: CounselorProfile): VerificationTier`; `applyTranscriptSupport(transcript: Transcript): VerificationTier` |
| Security Notes | Students cannot directly assign counselor-supported or transcript-supported status to themselves.                                                                                                      |

## 6.11 `SelfReportedLabel` `<<trust>>`

| Field          | Content                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------- |
| Responsibility | Labels student-submitted information that has not been counselor-supported or transcript-supported. |
| Key Attributes | `labelId: UUID`; `labelText: string`; `targetType: string`; `targetId: UUID`                        |
| Key Methods    | `applyTo(target: object): SelfReportedLabel`                                                        |
| Security Notes | Must appear in admissions-facing views when information is not externally supported.                |

---

# 7. School & Counselor Trust Classes

## 7.1 `HighSchool` `<<institution>>`

| Field          | Content                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Responsibility | Represents a student's or counselor's high school.                                                                             |
| Key Attributes | `highSchoolId: UUID`; `name: string`; `country: string`; `city: string`; `schoolEmailDomain: string`; `verifiedStatus: string` |
| Key Methods    | `verifyExists(name: string): HighSchool`                                                                                       |
| Security Notes | Used for same-school access checks between `CounselorProfile` and `StudentProfile`.                                            |

## 7.2 `CounselorInvitation` `<<security>>`

| Field          | Content                                                                                                                                                                                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsibility | Represents a single-use counselor onboarding invitation.                                                                                                                                                                                                                                      |
| Key Attributes | `invitationId: UUID`; `counselorEmail: string`; `counselorName: string`; `highSchoolId: UUID`; `tokenHash: string`; `expiresAt: datetime`; `consumedAt: datetime`; `status: string`                                                                                                           |
| Key Methods    | `create(admin: UserAccount, counselorEmail: string, counselorName: string, highSchool: HighSchool): CounselorInvitation`; `send(emailService: EmailService): Void`; `validate(email: string): boolean`; `markConsumed(): CounselorInvitation`; `rejectInvalidOrConsumed(email: string): Void` |
| Security Notes | Must be signed, single-use, expiring, email-bound, and school-bound.                                                                                                                                                                                                                          |

## 7.3 `CounselorProfile` `<<trust>>`

| Field          | Content                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsibility | Represents a counselor account linked to a high school and verification status.                                                                                                                                                                                                                                                                                                                                                       |
| Key Attributes | `counselorProfileId: UUID`; `userAccountId: UUID`; `highSchoolId: UUID`; `fullName: string`; `verificationStatus: string`; `verifiedAt: datetime`; `suspendedAt: datetime`                                                                                                                                                                                                                                                            |
| Key Methods    | `registerFromInvitation(invitation: CounselorInvitation, fullName: string, password: string): CounselorProfile`; `bindToHighSchool(highSchool: HighSchool): CounselorProfile`; `markVerified(decision: VerificationDecision): CounselorProfile`; `markSuspended(reason: string): CounselorProfile`; `openStudentRoster(): List<StudentProfile>`; `openTranscriptRequest(request: TranscriptSupportRequest): TranscriptSupportRequest` |
| Security Notes | Pending counselors cannot access rosters or transcript requests. Verified counselors can only access students linked to their own high school.                                                                                                                                                                                                                                                                                        |

## 7.4 `VerificationQueueItem` `<<review>>`

| Field          | Content                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Responsibility | Represents a counselor verification item awaiting platform administrator review.                                                     |
| Key Attributes | `queueItemId: UUID`; `counselorProfileId: UUID`; `status: string`; `createdAt: datetime`; `assignedAdminId: UUID`                    |
| Key Methods    | `createForCounselor(counselor: CounselorProfile): VerificationQueueItem`; `assignToAdmin(admin: UserAccount): VerificationQueueItem` |
| Security Notes | Counselor remains restricted until queue item is resolved.                                                                           |

## 7.5 `VerificationDecision` `<<audit>>`

| Field          | Content                                                                                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsibility | Records platform administrator approval or denial of counselor verification.                                                                                                                  |
| Key Attributes | `verificationDecisionId: UUID`; `queueItemId: UUID`; `adminUserId: UUID`; `decision: string`; `note: string`; `reason: string`; `createdAt: datetime`                                         |
| Key Methods    | `approve(admin: UserAccount, counselor: CounselorProfile, note: string): VerificationDecision`; `deny(admin: UserAccount, counselor: CounselorProfile, reason: string): VerificationDecision` |
| Security Notes | Requires platform administrator role and should emit `AuditLogEntry`.                                                                                                                         |

---

# 8. Counselor Support & Transcript Classes

## 8.1 `TranscriptSupportRequest` `<<workflow>>`

| Field          | Content                                                                                                                                                                                                                                                                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsibility | Represents a student request for counselor support or transcript-related evidence.                                                                                                                                                                                                                                                                                                  |
| Key Attributes | `requestId: UUID`; `studentProfileId: UUID`; `assignedCounselorId: UUID`; `requestStatus: string`; `createdAt: datetime`; `submittedAt: datetime`                                                                                                                                                                                                                                   |
| Key Methods    | `create(studentProfile: StudentProfile): TranscriptSupportRequest`; `assignToCounselor(counselor: CounselorProfile): TranscriptSupportRequest`; `markSchoolInformationSupported(counselor: CounselorProfile): TranscriptSupportRequest`; `submitTranscript(counselor: CounselorProfile, file: UploadedFile): TranscriptSupportRequest`; `markSubmitted(): TranscriptSupportRequest` |
| Security Notes | Requires verified counselor and same-school match before counselor support or transcript upload.                                                                                                                                                                                                                                                                                    |

## 8.2 `Transcript` `<<sensitive>>`

| Field          | Content                                                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsibility | Represents transcript-related evidence submitted through authorized counselor support.                                                          |
| Key Attributes | `transcriptId: UUID`; `studentProfileId: UUID`; `uploadedFileId: UUID`; `submittedByCounselorId: UUID`; `createdAt: datetime`; `status: string` |
| Key Methods    | `createFromUpload(file: UploadedFile, request: TranscriptSupportRequest): Transcript`                                                           |
| Security Notes | Students cannot upload their own official transcript as verified evidence.                                                                      |

## 8.3 `UploadedFile` `<<storage>>`

| Field          | Content                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Responsibility | Represents metadata for a protected uploaded file.                                                                                                           |
| Key Attributes | `uploadedFileId: UUID`; `fileName: string`; `mimeType: string`; `sizeBytes: number`; `storagePath: string`; `uploadedAt: datetime`; `uploadedByUserId: UUID` |
| Key Methods    | `store(fileBytes: binary, objectStorage: ObjectStorage): UploadedFile`                                                                                       |
| Security Notes | Must pass `FileValidationRule.validate(file: UploadedFile): boolean` before protected storage.                                                               |

## 8.4 `FileValidationRule` `<<policy>>`

| Field          | Content                                                                                |
| -------------- | -------------------------------------------------------------------------------------- |
| Responsibility | Validates uploaded files before storage.                                               |
| Key Attributes | `allowedMimeTypes: List<string>`; `maxSizeBytes: number`                               |
| Key Methods    | `validate(file: UploadedFile): boolean`; `rejectInvalidFile(file: UploadedFile): Void` |
| Security Notes | Rejects unsupported, oversized, malicious, or invalid files before storage.            |

---

# 9. AI Contextualization Classes

## 9.1 `AIConsentRecord` `<<privacy>>`

| Field          | Content                                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsibility | Records explicit student consent for AI contextualization.                                                                                                  |
| Key Attributes | `aiConsentRecordId: UUID`; `studentProfileId: UUID`; `consentGiven: boolean`; `consentTimestamp: datetime`; `withdrawnAt: datetime`                         |
| Key Methods    | `recordConsent(studentProfile: StudentProfile, consentGiven: boolean): AIConsentRecord`; `withdrawConsent(studentProfile: StudentProfile): AIConsentRecord` |
| Security Notes | AI contextualization must be off by default and require explicit consent.                                                                                   |

## 9.2 `AIContextualizationRequest` `<<workflow>>`

| Field          | Content                                                                                                                                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsibility | Represents a request to generate AI-assisted contextualization from selected eligible student-authored narrative fields.                                                                                                                      |
| Key Attributes | `requestId: UUID`; `studentProfileId: UUID`; `consentRecordId: UUID`; `requestStatus: string`; `createdAt: datetime`                                                                                                                          |
| Key Methods    | `create(studentProfile: StudentProfile, selectedFields: List<NarrativeResponse>, consent: AIConsentRecord): AIContextualizationRequest`; `validateEligibility(): boolean`; `sendToAIService(aiService: AIService): AIContextualizationOutput` |
| Security Notes | Uses only selected, eligible, consent-approved narrative fields.                                                                                                                                                                              |

## 9.3 `AIContextualizationOutput` `<<AI-generated>>`

| Field          | Content                                                                                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsibility | Stores generated AI contextualization output separately from the student's original writing.                                                                      |
| Key Attributes | `outputId: UUID`; `requestId: UUID`; `generatedText: string`; `outputStatus: string`; `promptVersion: string`; `aiGeneratedLabel: boolean`; `createdAt: datetime` |
| Key Methods    | `storePending(request: AIContextualizationRequest, generatedText: string): AIContextualizationOutput`; `labelAsAIGenerated(): AIContextualizationOutput`          |
| Security Notes | Must not appear in admissions-facing views until student accepted, human approved, consent is active, and AI-generated label is present.                          |

## 9.4 `StudentAIReviewDecision` `<<review>>`

| Field          | Content                                                                                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsibility | Records the student’s decision on AI-generated output.                                                                                                                                                                                                  |
| Key Attributes | `studentReviewDecisionId: UUID`; `outputId: UUID`; `studentProfileId: UUID`; `decision: string`; `reason: string`; `note: string`; `createdAt: datetime`                                                                                                |
| Key Methods    | `accept(output: AIContextualizationOutput): StudentAIReviewDecision`; `reject(output: AIContextualizationOutput, reason: string): StudentAIReviewDecision`; `requestRevision(output: AIContextualizationOutput, note: string): StudentAIReviewDecision` |
| Security Notes | Student acceptance alone does not make AI output admissions-visible. Human review is also required.                                                                                                                                                     |

## 9.5 `HumanReviewDecision` `<<review>>`

| Field          | Content                                                                                                                                                                                                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsibility | Records counselor or platform administrator review decision for AI-generated output.                                                                                                                                                                                                                                            |
| Key Attributes | `humanReviewDecisionId: UUID`; `outputId: UUID`; `reviewerUserId: UUID`; `decision: string`; `reason: string`; `note: string`; `createdAt: datetime`                                                                                                                                                                            |
| Key Methods    | `approve(reviewer: UserAccount, output: AIContextualizationOutput, note: string): HumanReviewDecision`; `reject(reviewer: UserAccount, output: AIContextualizationOutput, reason: string): HumanReviewDecision`; `requestRevision(reviewer: UserAccount, output: AIContextualizationOutput, note: string): HumanReviewDecision` |
| Security Notes | Reviewer must be a verified same-school counselor or platform administrator.                                                                                                                                                                                                                                                    |

---

# 10. Admissions Discovery & Review Classes

## 10.1 `UniversityAccount` `<<institution>>`

| Field          | Content                                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Responsibility | Represents a university or admissions organization account.                                                             |
| Key Attributes | `universityAccountId: UUID`; `universityName: string`; `domain: string`; `accountStatus: string`; `createdAt: datetime` |
| Key Methods    | None required in class diagram.                                                                                         |
| Security Notes | Admissions officers belong to a university account.                                                                     |

## 10.2 `AdmissionsOfficerProfile` `<<trust>>`

| Field          | Content                                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsibility | Represents an admissions officer user profile linked to a university.                                                                                       |
| Key Attributes | `admissionsOfficerProfileId: UUID`; `userAccountId: UUID`; `universityAccountId: UUID`; `fullName: string`; `approvalStatus: string`; `createdAt: datetime` |
| Key Methods    | `openDiscoveryPage(): StudentDiscoverySearch`; `expressInterest(profile: StudentProfile): Void`                                                             |
| Security Notes | Must be approved before using discovery search or viewing admissions-facing student profiles.                                                               |

## 10.3 `StudentDiscoverySearch` `<<workflow>>`

| Field          | Content                                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Responsibility | Represents an admissions officer search session.                                                                                                                                                 |
| Key Attributes | `searchId: UUID`; `officerProfileId: UUID`; `createdAt: datetime`                                                                                                                                |
| Key Methods    | `create(officer: AdmissionsOfficerProfile): StudentDiscoverySearch`; `execute(filters: List<SearchFilter>): List<StudentProfile>`; `returnEmptyState(): string`; `excludeHiddenProfiles(): Void` |
| Security Notes | Must return only published, admissions-visible, consent-allowed, and authorized profiles.                                                                                                        |

## 10.4 `SearchFilter` `<<value-object>>`

| Field          | Content                                                                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsibility | Represents search criteria used during admissions discovery.                                                                                                                     |
| Key Attributes | `country: string`; `region: string`; `academicInterest: AcademicInterest`; `graduationYear: number`; `financialAidNeed: string`; `verificationTier: VerificationTier`            |
| Key Methods    | `apply(country: string, region: string, academicInterest: AcademicInterest, graduationYear: number, financialAidNeed: string, verificationTier: VerificationTier): SearchFilter` |
| Security Notes | Filters must not bypass visibility, consent, publication, or authorization rules.                                                                                                |

## 10.5 `AdmissionsProfileView` `<<safe-view>>`

| Field          | Content                                                                                                                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Responsibility | Represents the admissions-facing safe view of a student profile.                                                                                                                                                                                             |
| Key Attributes | `viewId: UUID`; `studentProfileId: UUID`; `viewerOfficerId: UUID`; `renderedAt: datetime`                                                                                                                                                                    |
| Key Methods    | `render(officer: AdmissionsOfficerProfile, profile: StudentProfile): AdmissionsProfileView`; `includeApprovedAI(output: AIContextualizationOutput): AdmissionsProfileView`; `showSelfReportedLabels(labels: List<SelfReportedLabel>): AdmissionsProfileView` |
| Security Notes | Must render only authorized, visibility-allowed, consent-allowed data. Must include AI-generated labels and self-reported labels when relevant.                                                                                                              |

## 10.6 `Shortlist` `<<privacy>>`

| Field          | Content                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Responsibility | Represents a private admissions officer shortlist.                                                                        |
| Key Attributes | `shortlistId: UUID`; `ownerOfficerId: UUID`; `name: string`; `createdAt: datetime`                                        |
| Key Methods    | `create(owner: AdmissionsOfficerProfile, name: string): Shortlist`; `addProfile(profile: StudentProfile): ShortlistEntry` |
| Security Notes | Shortlisting is private and does not notify the student by default.                                                       |

## 10.7 `ShortlistEntry` `<<value-object>>`

| Field          | Content                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------- |
| Responsibility | Represents a saved reference to a student profile inside a shortlist.                           |
| Key Attributes | `shortlistEntryId: UUID`; `shortlistId: UUID`; `studentProfileId: UUID`; `createdAt: datetime`  |
| Key Methods    | `open(officer: AdmissionsOfficerProfile): AdmissionsProfileView`                                |
| Security Notes | Opening a saved entry must recheck current publication, visibility, consent, and authorization. |

---

# 11. Security Policy Classes

## 11.1 `AccessPolicy` `<<policy>>`

| Field          | Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Responsibility | Central application-level authorization policy.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Key Attributes | `policyName: string`; `policyVersion: string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Key Methods    | `evaluate(user: UserAccount, resource: object, action: string): boolean`; `requireAuthenticated(user: UserAccount): Void`; `requireRole(user: UserAccount, role: Role): Void`; `requireVerifiedCounselor(counselor: CounselorProfile): Void`; `requireApprovedAdmissionsOfficer(officer: AdmissionsOfficerProfile): Void`; `requireSameHighSchool(counselor: CounselorProfile, profile: StudentProfile): Void`; `authorizeAdmissionsSearch(officer: AdmissionsOfficerProfile): boolean`; `authorizeAdmissionsProfileView(officer: AdmissionsOfficerProfile, profile: StudentProfile): boolean`; `blockUnauthorizedProfileAccess(user: UserAccount, profile: StudentProfile): Void`; `blockUnverifiedCounselor(counselor: CounselorProfile): Void`; `blockSchoolMismatch(counselor: CounselorProfile, profile: StudentProfile): Void` |
| Security Notes | Must mediate sensitive student profile access, counselor support access, admissions search, and admissions profile rendering.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

## 11.2 `RowLevelSecurityPolicy` `<<policy>>`

| Field          | Content                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------- |
| Responsibility | Database/API-level access enforcement for student profile data.                           |
| Key Attributes | `policyName: string`; `policyVersion: string`; `enabled: boolean`                         |
| Key Methods    | `enforceProfileAccess(user: UserAccount, profile: StudentProfile): boolean`               |
| Security Notes | Prevents relying only on client-side checks, hidden URLs, or application-layer filtering. |

## 11.3 `AIOutputPolicy` `<<policy>>`

| Field          | Content                                                                                                                                                                                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsibility | Controls whether AI contextualization output can appear in admissions-facing views.                                                                                                                                                                                                    |
| Key Attributes | `policyName: string`; `policyVersion: string`                                                                                                                                                                                                                                          |
| Key Methods    | `canDisplay(output: AIContextualizationOutput): boolean`; `hideAfterConsentWithdrawal(output: AIContextualizationOutput): AIContextualizationOutput`; `blockUnreviewedOutput(output: AIContextualizationOutput): Void`; `blockRejectedOutput(output: AIContextualizationOutput): Void` |
| Security Notes | Requires student acceptance, human approval, active consent, and AI-generated labeling before admissions display.                                                                                                                                                                      |

---

# 12. External / Infrastructure Classes for Class Diagram

External and infrastructure objects may be shown only if needed for architectural clarity. Do not overload the secure domain class diagram with deployment details.

## 12.1 `EmailService` `<<external>>`

| Field          | Content                                                                                                                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsibility | External email delivery service.                                                                                                                                                                                 |
| Key Attributes | `providerName: string`                                                                                                                                                                                           |
| Key Methods    | `sendVerificationEmail(email: string, token: EmailVerificationToken): Void`; `sendCounselorInvitation(email: string, invitation: CounselorInvitation): Void`; `sendCounselorApprovalNotice(email: string): Void` |
| Security Notes | Delivers system-generated messages only. Does not validate users, assign roles, or grant access.                                                                                                                 |

## 12.2 `AIService` `<<external>>`

| Field          | Content                                                                                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsibility | External AI system used to generate contextualization output.                                                                                                                 |
| Key Attributes | `providerName: string`; `modelName: string`                                                                                                                                   |
| Key Methods    | `generateContext(request: AIContextualizationRequest): AIContextualizationOutput`; `requestContextualization(request: AIContextualizationRequest): AIContextualizationOutput` |
| Security Notes | Cannot directly publish to `AdmissionsProfileView`. Output must return to pending review.                                                                                     |

## 12.3 `Database` `<<storage>>`

| Field          | Content                                                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsibility | Stores RecruitBook application records.                                                                                                      |
| Key Attributes | `databaseName: string`; `providerName: string`                                                                                               |
| Key Methods    | `save(object: object): object`; `queryVisibleProfiles(filters: List<SearchFilter>, officer: AdmissionsOfficerProfile): List<StudentProfile>` |
| Security Notes | Must enforce `RowLevelSecurityPolicy` where applicable.                                                                                      |

## 12.4 `ObjectStorage` `<<storage>>`

| Field          | Content                                           |
| -------------- | ------------------------------------------------- |
| Responsibility | Stores protected uploaded transcript files.       |
| Key Attributes | `bucketName: string`; `providerName: string`      |
| Key Methods    | `storeProtectedFile(file: UploadedFile): string`  |
| Security Notes | Must not expose public unauthenticated file URLs. |

## 12.5 `SearchIndex` `<<storage>>`

| Field          | Content                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------- |
| Responsibility | Supports admissions search over published, visible, consent-allowed profiles.                 |
| Key Attributes | `indexName: string`; `providerName: string`                                                   |
| Key Methods    | `indexProfile(profile: StudentProfile): Void`; `removeProfile(profile: StudentProfile): Void` |
| Security Notes | Must not index unpublished, hidden, or consent-restricted profiles.                           |

---

# 13. Required Class Relationships

Use this relationship set for the main Secure Domain Class Diagram.

| Source Class                 | Relationship              | Target Class                 | Multiplicity     | UML Type    |
| ---------------------------- | ------------------------- | ---------------------------- | ---------------- | ----------- |
| `UserAccount`                | has                       | `Role`                       | `1` to `1`       | Association |
| `UserAccount`                | owns                      | `StudentProfile`             | `1` to `0..1`    | Association |
| `UserAccount`                | owns                      | `CounselorProfile`           | `1` to `0..1`    | Association |
| `UserAccount`                | owns                      | `AdmissionsOfficerProfile`   | `1` to `0..1`    | Association |
| `UserAccount`                | verified by               | `EmailVerificationToken`     | `1` to `0..*`    | Association |
| `AuditLogEntry`              | records action by         | `UserAccount`                | `0..*` to `1`    | Association |
| `StudentProfile`             | composed of               | `IdentityInformation`        | `1` to `1`       | Composition |
| `StudentProfile`             | composed of               | `AcademicRecord`             | `1` to `1..*`    | Composition |
| `AcademicRecord`             | uses                      | `GradingScale`               | `1` to `1`       | Association |
| `StudentProfile`             | has                       | `AcademicInterest`           | `1` to `1..3`    | Association |
| `StudentProfile`             | contains                  | `NarrativeResponse`          | `1` to `0..*`    | Composition |
| `StudentProfile`             | contains                  | `ProfileItem`                | `1` to `0..*`    | Composition |
| `StudentProfile`             | has                       | `ProfileVisibilitySettings`  | `1` to `1`       | Composition |
| `StudentProfile`             | has                       | `ConsentSettings`            | `1` to `1`       | Composition |
| `StudentProfile`             | has                       | `VerificationTier`           | `1` to `1`       | Association |
| `StudentProfile`             | linked to                 | `HighSchool`                 | `0..*` to `1`    | Association |
| `HighSchool`                 | has                       | `CounselorProfile`           | `1` to `0..*`    | Association |
| `CounselorInvitation`        | bound to                  | `HighSchool`                 | `1` to `1`       | Association |
| `CounselorInvitation`        | creates                   | `CounselorProfile`           | `1` to `0..1`    | Dependency  |
| `CounselorProfile`           | reviewed through          | `VerificationQueueItem`      | `1` to `1`       | Association |
| `VerificationQueueItem`      | resolved by               | `VerificationDecision`       | `1` to `0..1`    | Association |
| `StudentProfile`             | creates                   | `TranscriptSupportRequest`   | `1` to `0..*`    | Association |
| `TranscriptSupportRequest`   | assigned to               | `CounselorProfile`           | `0..*` to `1`    | Association |
| `TranscriptSupportRequest`   | may produce               | `Transcript`                 | `1` to `0..1`    | Association |
| `Transcript`                 | represented by            | `UploadedFile`               | `1` to `1`       | Composition |
| `FileValidationRule`         | validates                 | `UploadedFile`               | `1` to `0..*`    | Dependency  |
| `StudentProfile`             | may create                | `AIConsentRecord`            | `1` to `0..*`    | Association |
| `StudentProfile`             | creates                   | `AIContextualizationRequest` | `1` to `0..*`    | Association |
| `AIContextualizationRequest` | uses                      | `NarrativeResponse`          | `1` to `1..*`    | Association |
| `AIContextualizationRequest` | produces                  | `AIContextualizationOutput`  | `1` to `0..1`    | Association |
| `AIContextualizationOutput`  | reviewed by               | `StudentAIReviewDecision`    | `1` to `0..1`    | Association |
| `AIContextualizationOutput`  | reviewed by               | `HumanReviewDecision`        | `1` to `0..1`    | Association |
| `AIOutputPolicy`             | controls visibility of    | `AIContextualizationOutput`  | `1` to `0..*`    | Dependency  |
| `UniversityAccount`          | has                       | `AdmissionsOfficerProfile`   | `1` to `0..*`    | Association |
| `AdmissionsOfficerProfile`   | performs                  | `StudentDiscoverySearch`     | `1` to `0..*`    | Association |
| `StudentDiscoverySearch`     | uses                      | `SearchFilter`               | `1` to `0..*`    | Composition |
| `AdmissionsOfficerProfile`   | opens                     | `AdmissionsProfileView`      | `1` to `0..*`    | Association |
| `AdmissionsProfileView`      | renders                   | `StudentProfile`             | `1` to `1`       | Dependency  |
| `AdmissionsProfileView`      | includes approved         | `AIContextualizationOutput`  | `1` to `0..*`    | Dependency  |
| `AdmissionsOfficerProfile`   | owns                      | `Shortlist`                  | `1` to `0..*`    | Composition |
| `Shortlist`                  | contains                  | `ShortlistEntry`             | `1` to `0..*`    | Composition |
| `ShortlistEntry`             | references                | `StudentProfile`             | `0..*` to `1`    | Association |
| `AccessPolicy`               | evaluates                 | `UserAccount`                | `1` to `0..*`    | Dependency  |
| `AccessPolicy`               | authorizes access to      | `StudentProfile`             | `1` to `0..*`    | Dependency  |
| `AccessPolicy`               | depends on                | `ProfileVisibilitySettings`  | `1` to `0..*`    | Dependency  |
| `AccessPolicy`               | depends on                | `ConsentSettings`            | `1` to `0..*`    | Dependency  |
| `RowLevelSecurityPolicy`     | enforces access for       | `StudentProfile`             | `1` to `0..*`    | Dependency  |
| `AIOutputPolicy`             | depends on                | `StudentAIReviewDecision`    | `1` to `0..*`    | Dependency  |
| `AIOutputPolicy`             | depends on                | `HumanReviewDecision`        | `1` to `0..*`    | Dependency  |
| `AuditLogEntry`              | may record denial from    | `AccessPolicy`               | `0..*` to `0..1` | Dependency  |
| `AuditLogEntry`              | may record enforcement by | `AIOutputPolicy`             | `0..*` to `0..1` | Dependency  |
| `AuditLogEntry`              | may record validation by  | `FileValidationRule`         | `0..*` to `0..1` | Dependency  |

---

# 14. Required Security Invariants for Class Diagram

The class diagram must preserve these invariants:

| Invariant ID | Rule                                                                                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CD-SEC-01`  | `UserAccount` must be linked to `Role`, but role alone must not authorize sensitive access.                                                                                   |
| `CD-SEC-02`  | `AccessPolicy` must mediate sensitive access to `StudentProfile`, `TranscriptSupportRequest`, `StudentDiscoverySearch`, and `AdmissionsProfileView`.                          |
| `CD-SEC-03`  | `RowLevelSecurityPolicy` must protect database/API access to `StudentProfile`.                                                                                                |
| `CD-SEC-04`  | `StudentProfile` must own `ProfileVisibilitySettings` and `ConsentSettings`.                                                                                                  |
| `CD-SEC-05`  | `StudentProfile.publish(): StudentProfile` must depend on email verification, complete required sections, visibility settings, consent settings, and high school affiliation. |
| `CD-SEC-06`  | `CounselorProfile` must be bound to exactly one `HighSchool`.                                                                                                                 |
| `CD-SEC-07`  | `CounselorProfile` must not access student records unless verified and same-school matched.                                                                                   |
| `CD-SEC-08`  | `CounselorInvitation` must be single-use, expiring, email-bound, and school-bound.                                                                                            |
| `CD-SEC-09`  | `Transcript` must be created only through authorized `TranscriptSupportRequest` flow.                                                                                         |
| `CD-SEC-10`  | `UploadedFile` must be validated by `FileValidationRule` before storage.                                                                                                      |
| `CD-SEC-11`  | `VerificationTier` must not be directly controlled by the student.                                                                                                            |
| `CD-SEC-12`  | `NarrativeResponse` must remain separate from `AIContextualizationOutput`.                                                                                                    |
| `CD-SEC-13`  | `AIContextualizationRequest` must require `AIConsentRecord`.                                                                                                                  |
| `CD-SEC-14`  | `AIContextualizationOutput` must not appear in `AdmissionsProfileView` unless `AIOutputPolicy.canDisplay(output: AIContextualizationOutput): boolean` returns true.           |
| `CD-SEC-15`  | `AdmissionsProfileView` must include only safe, authorized, visibility-allowed, consent-allowed profile data.                                                                 |
| `CD-SEC-16`  | `ShortlistEntry.open(officer: AdmissionsOfficerProfile): AdmissionsProfileView` must recheck current visibility, consent, and authorization.                                  |
| `CD-SEC-17`  | `AuditLogEntry` must exist for privileged verification decisions, transcript actions, AI review decisions, and denied access attempts.                                        |
| `CD-SEC-18`  | `SearchIndex` must not index unpublished, hidden, or consent-restricted profiles.                                                                                             |

---

# 15. Classes To Exclude From Main Secure Domain Class Diagram

Do not include these unless the user explicitly requests an expanded implementation diagram:

| Excluded Item                                                   | Reason                                                                                                     |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Browser UI components                                           | Belong in component, deployment, or UI diagrams.                                                           |
| Next.js route files                                             | Implementation detail, not domain model.                                                                   |
| Supabase table names                                            | Belong in ERD/database schema, not conceptual class diagram.                                               |
| Vercel deployment nodes                                         | Belong in component/deployment diagram.                                                                    |
| Every individual form field                                     | Would overcrowd the class diagram.                                                                         |
| Every possible enum                                             | Add only if needed for clarity.                                                                            |
| Error classes such as `AuthorizationError` or `ValidationError` | Mention in security notes, not as classes.                                                                 |
| RateLimitRule                                                   | Optional security object; include only if abuse prevention diagram requires it.                            |
| CaptchaChallenge                                                | Optional security object; include only if registration abuse diagram requires it.                          |
| ProfileVersion                                                  | Optional object; include only if profile history/versioning becomes a feature.                             |
| SecurityAlert                                                   | Optional object; include only if monitoring/observability becomes a diagram focus.                         |
| ErrorLogEntry                                                   | Optional object; include only if observability becomes a diagram focus.                                    |
| InterestSignal                                                  | Optional object; include only if admissions interest signaling becomes a required feature.                 |
| PromptRecord                                                    | Optional object; prompt metadata can remain an attribute of `AIContextualizationOutput` for the prototype. |

---

# 16. PlantUML Class Diagram Generation Rules

When generating `diagrams/04_secure_domain_class_diagram.puml`:

1. Start with `@startuml`.
2. End with `@enduml`.
3. Include a title: `title RecruitBook Secure Domain Class Diagram`.
4. Use packages from Section 4.
5. Use stereotypes from Section 3.
6. Use class names exactly as written in this file.
7. Include only key attributes and methods.
8. Use relationships from Section 13.
9. Include multiplicities on major relationships.
10. Use composition for strong ownership.
11. Use dependency for policy checks.
12. Use notes only for major security invariants.
13. Avoid crossing lines where possible.
14. Avoid including every method if the diagram becomes unreadable.
15. Preserve all security invariants from Section 14.

---

# 17. Recommended PlantUML Relationship Notation

Use these relationship notations:

| Relationship Type    | PlantUML Notation |     |
| -------------------- | ----------------- | --- |
| Association          | `--`              |     |
| Directed Association | `-->`             |     |
| Dependency           | `..>`             |     |
| Aggregation          | `o--`             |     |
| Composition          | `*--`             |     |
| Generalization       | `<                | --` |
| Realization          | `<                | ..` |

Examples:

```plantuml
UserAccount "1" --> "1" Role : has
UserAccount "1" --> "0..1" StudentProfile : owns
StudentProfile "1" *-- "1" IdentityInformation : composed of
StudentProfile "1" *-- "1..*" AcademicRecord : composed of
AcademicRecord "1" --> "1" GradingScale : uses
StudentProfile "0..*" --> "1" HighSchool : linked to
HighSchool "1" --> "0..*" CounselorProfile : has
AccessPolicy "1" ..> "0..*" StudentProfile : authorizes access to
AIOutputPolicy "1" ..> "0..*" AIContextualizationOutput : controls visibility of
Shortlist "1" *-- "0..*" ShortlistEntry : contains
```

---

# 18. Class Diagram Maintenance Rules

When another context file changes:

1. If `recruitbook_object_catalog.md` changes, update class lists and package placement.
2. If `recruitbook_relationship_catalog.md` changes, update Section 13.
3. If `recruitbook_method_catalog.md` changes, update relevant class method lists.
4. If `recruitbook_actor_matrix.md` changes, update class security notes if permission rules changed.
5. If `security_rules.md` changes, update Section 14.
6. If `use_case_summary.md` changes, verify that class responsibilities still map to UC-1 through UC-6 and MC-1 through MC-6.
7. Do not add implementation-only classes unless they support required diagrams or prototype development.
