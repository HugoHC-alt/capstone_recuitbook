# RecruitBook Object Catalog

This file is the authoritative object catalog for RecruitBook PlantUML diagram generation. Diagrams should use these object names unless the user explicitly approves a new object.

## Purpose

This catalog defines the controlled vocabulary for RecruitBook UML and PlantUML diagrams.

The goal is to prevent diagram drift, duplicated objects, inconsistent names, and unnecessary classes. Use this file as the source of truth for domain objects, actors, external systems, and security-related controls.

## Object Naming Rules

* Use object names exactly as written here.
* Do not rename objects without explicit approval.
* Do not invent new domain objects unless necessary.
* UI pages such as dashboards, forms, and wizards should usually be shown as boundary elements, not domain classes.
* Security rules such as access control, consent, AI approval, and visibility checks should be represented explicitly when relevant.
* Prefer focused diagrams over one giant diagram.
* If a diagram becomes too crowded, split it by functional package.
* Actor references and external systems may appear in use case, sequence, context, component, deployment, and trust boundary diagrams, but they should not be modeled as ordinary domain classes.

## Approved Stereotypes

Use these stereotypes consistently:

| Stereotype          | Use                                                                   |
| ------------------- | --------------------------------------------------------------------- |
| `<<security>>`      | Broad security-sensitive object or token                              |
| `<<authorization>>` | Role or permission-related object                                     |
| `<<privacy>>`       | Consent, visibility, or private user data control                     |
| `<<sensitive>>`     | Student data, academic data, transcript data, or personal information |
| `<<audit>>`         | Audit record or decision trail                                        |
| `<<review>>`        | Human or student review workflow                                      |
| `<<trust>>`         | Verification status, trust indicator, or credibility marker           |
| `<<policy>>`        | Rule object that controls access, visibility, or AI output            |
| `<<external>>`      | External system outside RecruitBook                                   |
| `<<workflow>>`      | Process or request object                                             |
| `<<institution>>`   | School or university organization                                     |
| `<<storage>>`       | Stored file or object storage reference                               |
| `<<AI-generated>>`  | AI-created content stored separately from student writing             |
| `<<value-object>>`  | Supporting value or reference object                                  |
| `<<safe-view>>`     | View object that exposes only allowed information                     |

---

# 1. Actor References

These are human or service actors used in use case, sequence, activity, system context, and trust boundary diagrams. They are not ordinary domain classes unless a specific diagram requires their profile/account object.

| Actor                 | Description                                                                                                                                   | Common Diagram Use           |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Student               | A student who registers, creates a profile, controls visibility/consent, and reviews AI output.                                               | Use case, activity, sequence |
| Counselor             | A school counselor who accepts an invitation, becomes verified, supports students, and reviews AI output.                                     | Use case, activity, sequence |
| PlatformAdministrator | A platform admin who invites counselors, reviews verification queue items, approves/denies counselor accounts, and audits privileged actions. | Use case, sequence, activity |
| AdmissionsOfficer     | A verified university admissions user who searches, filters, opens, shortlists, and optionally expresses interest in student profiles.        | Use case, sequence, activity |
| Attacker              | A malicious actor used in misuse case diagrams.                                                                                               | Misuse case, trust boundary  |
| AIService             | External AI/LLM service that generates contextualization output from approved student fields.                                                 | Sequence, context, DFD       |
| EmailService          | External email service that sends verification links and counselor invitation links.                                                          | Sequence, context, DFD       |

---

# 2. External Systems / Boundary Objects

These are external systems or infrastructure components. They may appear in architecture, sequence, deployment, component, and trust boundary diagrams, but should not be treated as core domain entities.

| Name           | Type                      | Description                                                                                                           | Suggested Stereotype |
| -------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------- |
| EmailService   | External System           | Sends student email verification links, counselor invitation links, and account notifications.                        | `<<external>>`       |
| AIService      | External System           | Generates AI contextualization output from approved student profile fields.                                           | `<<external>>`       |
| Database       | Data Store                | Stores user accounts, profiles, consent records, visibility settings, AI output, shortlists, and audit logs.          | `<<storage>>`        |
| ObjectStorage  | Data Store                | Stores transcript files and uploaded documents in protected storage.                                                  | `<<storage>>`        |
| SearchIndex    | Supporting Infrastructure | Supports admissions profile search and filtering. For the prototype, this may be represented as part of the Database. | `<<storage>>`        |
| RecruitBookApp | System Boundary           | The main RecruitBook web application, including frontend pages and server-side logic.                                 | `<<boundary>>`       |

---

# 3. Identity & Role Access Objects

| Object                 | Source Use Case / Scenario                                                               | Source Noun or Verb                                                      | Object Type              | Description                                                                           | Suggested Stereotype |
| ---------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------ | ------------------------------------------------------------------------------------- | -------------------- |
| UserAccount            | UC-1 Student Registration; UC-2 Counselor Onboarding; UC-6 Admissions Officer Search     | “user account,” “account,” “creates,” “logs in”                          | Entity                   | Stores login identity, email, role, and account status.                               | `<<security>>`       |
| Role                   | UC-1 Student Registration; UC-2 Counselor Onboarding; UC-6 Admissions Officer Search     | “role,” “student,” “counselor,” “admissions officer,” “administrator”    | Security / Access Object | Defines the user type and access level.                                               | `<<authorization>>`  |
| AccessPolicy           | UC-4 Counselor Support; UC-6 Admissions Search; MC-6 Unauthorized Profile Access         | “checks authorization,” “blocks access,” “allowed to view”               | Security Control         | Decides whether a user can access a profile, roster, upload action, or search result. | `<<policy>>`         |
| EmailVerificationToken | UC-1 Student Registration & Email Verification                                           | “single-use email verification link,” “validates,” “unused,” “unexpired” | Security Token           | Confirms that a student controls the email used during registration.                  | `<<security>>`       |
| AuditLogEntry          | UC-2 Counselor Verification; UC-4 Transcript Support; UC-5 AI Review; MC-6 Access Bypass | “records,” “logs,” “audit log entry,” “timestamp”                        | Audit Object             | Records approvals, uploads, AI review, and access denials.                            | `<<audit>>`          |

---

# 4. Student Profile Objects

| Object                    | Source Use Case / Scenario                                                                          | Source Noun or Verb                                                             | Object Type           | Description                                                                                                                                     | Suggested Stereotype |
| ------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| StudentProfile            | UC-3 Student Profile Creation; Successful Scenario: a student creates and publishes a profile          | “student profile,” “creates,” “saves,” “publishes,” “unpublishes”               | Entity                | Main student profile containing identity, academic context, interests, narrative responses, visibility, consent, and verification tier.         | `<<sensitive>>`      |
| IdentityInformation       | UC-3 Student Profile Creation                                                                       | “legal name,” “date of birth,” “country of citizenship,” “country of residence” | Value Object          | Stores required background fields for the student profile.                                                                                      | `<<sensitive>>`      |
| AcademicRecord            | UC-3 Student Profile Creation; UC-6 Admissions Review                                               | “academic information,” “courses,” “grades,” “GPA”                              | Entity / Value Object | Stores the student’s academic data for admissions review.                                                                                       | `<<sensitive>>`      |
| GradingScale              | UC-3 Student Profile Creation; Successful Scenario: a student enters grades using the original grading scale | “native grading scale,” “original grading scale”                                | Value Object          | Explains academic performance in the student’s original grading context.                                                                        | `<<value-object>>`   |
| AcademicInterest          | UC-3 Student Profile Creation; UC-6 Admissions Search                                               | “fields of academic interest,” “computer science,” “business”                   | Reference Object      | Supports profile categorization and admissions search filtering.                                                                                | `<<value-object>>`   |
| NarrativeResponse         | UC-3 Student Profile Creation; UC-5 AI Contextualization                                            | “written prompt responses,” “student-made response,” “original words”           | Entity                | Stores original student-written responses, separate from AI output.                                                                             | `<<sensitive>>`      |
| ProfileItem               | UC-3 Student Profile Creation; MC-3 Manipulative Profile Submission                                 | “achievements,” “activities,” “fake achievements”                               | Entity                | Represents achievements and activities in the student profile. Items may be self-reported unless supported by counselor or transcript evidence. | `<<trust>>`          |
| ProfileVisibilitySettings | UC-3 Profile Publication; UC-6 Admissions Search; MC-6 Hidden Profile Access                        | “visibility settings,” “published,” “unpublished,” “hidden”                     | Privacy Object        | Controls whether the profile appears in admissions search or can be viewed.                                                                     | `<<privacy>>`        |
| ConsentSettings           | UC-3 Profile Publication; UC-5 AI Contextualization; UC-6 Admissions Search                         | “consent settings,” “visibility consent,” “retracts consent”                    | Privacy Object        | Stores whether the student allows AI use and admissions-facing visibility.                                                                      | `<<privacy>>`        |
| VerificationTier          | UC-3 Profile Preview; UC-4 Counselor Support; UC-6 Admissions Review                                | “verification tier,” “counselor-supported profiles,” “low verification tier”    | Trust Indicator       | Shows whether the profile is self-reported, counselor-supported, or transcript-supported.                                                       | `<<trust>>`          |
| SelfReportedLabel         | UC-3 Profile Preview; MC-3 Manipulative Profile Submission; UC-6 Admissions Review                  | “self-reported labels,” “not supported or verified”                             | Trust Label           | Marks information that comes only from the student and has not been verified.                                                                   | `<<trust>>`          |

---

# 5. School & Counselor Objects

| Object                | Source Use Case / Scenario                                                            | Source Noun or Verb                                                      | Object Type              | Description                                                                         | Suggested Stereotype |
| --------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------ | ----------------------------------------------------------------------------------- | -------------------- |
| HighSchool            | UC-2 Counselor Onboarding; UC-3 Profile Creation; UC-4 Counselor Support              | “high school,” “Colegio CEDI,” “associated high school”                  | Entity                   | School that connects students and counselors.                                       | `<<institution>>`    |
| CounselorProfile      | UC-2 Counselor Onboarding; UC-4 Counselor Support; Successful Scenario: Mr. Hernandez | “counselor,” “verified counselor,” “bound to high school”                | Entity                   | Stores counselor information, verification status, and school affiliation.          | `<<trust>>`          |
| VerificationDecision  | UC-2 Counselor Verification; MC-2 Invitation Interception                             | “approves,” “denies,” “records the reason,” “identity verified”          | Workflow / Audit Object  | Stores approval or denial decisions for counselor verification and support actions. | `<<audit>>`          |
| CounselorInvitation   | UC-2 Counselor Onboarding; MC-2 Invitation Link Interception                          | “invitation,” “single-use signed invitation link,” “consumed”            | Security Workflow Object | Single-use invitation for counselor onboarding.                                     | `<<security>>`       |
| VerificationQueueItem | UC-2 Counselor Onboarding; Successful Scenario: Admin approves counselor              | “verification queue item,” “administrator verification queue,” “reviews” | Workflow Object          | Pending counselor verification waiting for admin review.                            | `<<review>>`         |
| CounselorStudentLink  | Batch 3 Counselor Connection Foundation (prototype); refines UC-4 Counselor Support   | “counselor link,” “connect with counselor,” “linked student,” “accepted request” | Authorization / Consent Object | Student-initiated, per-student consent link that authorizes exactly one verified counselor to READ that student's profile. Email-addressed with late binding (`counselor_application_user_id` is NULL until a verified counselor responds — both accept and decline bind it; Accepted grants SELECT-only visibility, Declined is terminal with none). The sole basis for counselor profile visibility in the implemented prototype. States: Requested, Accepted, Declined, Revoked. | `<<authorization>>`  |

> **Batch 3 prototype refinement (Counselor Connection Foundation):** the implemented prototype does not have a `HighSchool` entity, and Batch 2 academic background uses free-text school names. For implemented batches, counselor access to a student's profile is mediated by **per-student consent** through `CounselorStudentLink` (an accepted link), **not** by the `HighSchool` school-match model. `HighSchool`, `CounselorProfile` school-binding, and the school-match relationship remain the unbuilt long-term model and are retained above for future batches. This is a deliberate, recorded decision (see `docs/project-context/architecture-decisions.md`), not silent architecture drift. `CounselorStudentLink` is distinct from `CounselorInvitation`: the latter is the (unimplemented) admin-driven, school-bound, single-use counselor **onboarding** invitation (SM-3) and must not be conflated with student→counselor link requests.

---

# 6. Counselor Support & Transcript Objects

| Object                   | Source Use Case / Scenario                                                                | Source Noun or Verb                                                                       | Object Type               | Description                                                            | Suggested Stereotype |
| ------------------------ | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------- | -------------------- |
| TranscriptSupportRequest | UC-4 Counselor Student Support; Successful Scenario: Counselor supports a student profile | “transcript support request,” “requests transcript support,” “pending transcript request” | Workflow Object           | Student request for counselor support or transcript evidence.          | `<<workflow>>`       |
| Transcript               | UC-4 Counselor Support; MC-4 Malicious/Incorrect Transcript                               | “transcript,” “transcript file,” “fake transcript”                                        | Sensitive Document Object | Transcript-related academic evidence attached to a student profile.    | `<<sensitive>>`      |
| UploadedFile             | UC-4 Transcript Upload; MC-4 Malicious Transcript Upload                                  | “file,” “uploaded file,” “oversized file”                                                 | Storage Object            | Stores file name, type, size, and storage path for uploaded documents. | `<<storage>>`        |
| FileValidationRule       | UC-4 Alternate Path; MC-4 Malicious Transcript Upload                                     | “allowed file and size formats,” “file type,” “size”                                      | Security Control          | Validates file type and size before accepting uploads.                 | `<<policy>>`         |
| CounselorReviewRequest   | Batch 4 Counselor Review Workflow (prototype); refines UC-4 Counselor Support             | “review request,” “submit for review,” “withdraw,” “review queue”                         | Workflow Object           | Student-initiated request that one accepted-linked verified counselor review the student's profile. Anchored to an accepted `CounselorStudentLink` (no late binding — the counselor is known at submit time). States: Requested, Completed, Declined, Withdrawn (SM-14); terminal states never revive, a fresh submission is a NEW row. The only stored review state — never on `StudentProfile`. | `<<workflow>>`       |
| CounselorFeedbackNote    | Batch 4 Counselor Review Workflow (prototype); refines UC-4 Counselor Support             | “feedback,” “counselor feedback,” “review note”                                           | Review Object             | The counselor-authored plain-text feedback that completes a `CounselorReviewRequest` (exactly one per completed request; `request_id` unique). IMMUTABLE after insert — no UPDATE/DELETE for any role. The first counselor WRITE target in the prototype; counselor writes never touch the Batch 2 profile tables. Student read survives link revocation; counselor read requires the link to still be Accepted. | `<<review>>`         |

> **Batch 4 prototype refinement (Counselor Review Workflow):** the implemented prototype's counselor review flow is a plain-text feedback exchange (`CounselorReviewRequest` + `CounselorFeedbackNote`), gated end-to-end on a **live accepted `CounselorStudentLink`**. It does not implement `TranscriptSupportRequest`, transcripts, uploads, `VerificationTier` changes, or `SelfReportedLabel` mechanics — those remain the unbuilt long-term UC-4 model above. Counselor review writes go ONLY to the two new objects; the Batch 3 rule that counselors have zero write access to student profile data is unchanged. This is a deliberate, recorded decision (see `docs/project-context/architecture-decisions.md`), not silent drift.

---

# 7. AI Contextualization Objects

| Object                     | Source Use Case / Scenario                                                     | Source Noun or Verb                                              | Object Type              | Description                                                                                 | Suggested Stereotype |
| -------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------- | -------------------- |
| AIConsentRecord            | UC-5 AI Contextualization; Successful Scenario: a student uses automated contextualization | “explicit consent,” “records the consent decision and timestamp” | Privacy / Consent Object | Stores that the student agreed to AI contextualization.                                     | `<<privacy>>`        |
| AIContextualizationRequest | UC-5 AI Contextualization                                                      | “sends approved profile fields,” “AI contextualization request”  | Workflow Object          | Tracks which student fields are sent to the AI service.                                     | `<<workflow>>`       |
| AIContextualizationOutput  | UC-5 AI Contextualization; MC-5 AI Prompt Manipulation                         | “AI output,” “generated summary,” “contextual explanation”       | Content Object           | Stores AI output separately from the student’s original writing.                            | `<<AI-generated>>`   |
| StudentAIReviewDecision    | UC-5 AI Contextualization                                                      | “student accepts,” “rejects,” “requests revision”                | Review Object            | Stores the student’s decision on AI-generated output.                                       | `<<review>>`         |
| HumanReviewDecision        | UC-5 AI Contextualization; MC-5 AI Prompt Manipulation                         | “counselor reviews,” “admin reviews,” “approves,” “rejects”      | Review Object            | Stores counselor or admin approval before AI output becomes visible to admissions officers. | `<<review>>`         |

---

# 8. Admissions Discovery & Review Objects

| Object                   | Source Use Case / Scenario                                                       | Source Noun or Verb                                            | Object Type     | Description                                                                     | Suggested Stereotype |
| ------------------------ | -------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------- | -------------------- |
| UniversityAccount        | UC-6 Admissions Officer Search                                                   | “university,” “verified account,” “admissions officer account” | Entity          | University connected to admissions officer accounts.                            | `<<institution>>`    |
| AdmissionsOfficerProfile | UC-6 Admissions Officer Search; Successful Scenario: Julia searches for students | “admissions officer,” “verified admissions officer,” “Julia”   | Entity          | Stores admissions officer identity, approval status, and university connection. | `<<trust>>`          |
| StudentDiscoverySearch   | UC-6 Admissions Officer Search                                                   | “student discovery page,” “search,” “filter,” “results”        | Workflow Object | Search process used to discover visible student profiles.                       | `<<workflow>>`       |
| AdmissionsProfileView    | UC-6 Student Profile Review; MC-6 Unauthorized Profile Access                    | “admissions officer profile view,” “displays,” “renders”       | View Object     | Shows only the profile information the admissions officer is allowed to see.    | `<<safe-view>>`      |
| Shortlist                | UC-6 Admissions Officer Search; Successful Scenario: Julia saves the project owner’s profile  | “private shortlist,” “saves the student profile”               | Entity          | Stores profiles saved privately by an admissions officer.                       | `<<privacy>>`        |
| ShortlistEntry           | UC-6 Admissions Officer Search                                                   | “saved profile,” “shortlist entry”                             | Join Object     | Connects a specific student profile to a specific shortlist.                    | `<<value-object>>`   |

> **Batch 5 prototype refinement (Admissions Discovery, Group 1b — use-case level):** the implemented Batch 5 prototype collapses `ProfileVisibilitySettings` and `ConsentSettings` (Section 4) into a single object/table, `ProfileVisibilitySettings` (`profile_visibility_settings`), holding two independent student-controlled booleans — `is_published` and `admissions_consent` — both defaulting to `false`. `ConsentSettings` is not a separate Batch 5 table. Effective admissions visibility is strictly `is_published AND admissions_consent`, checked at query time; a missing settings row or either flag `false` means not visible. `StudentDiscoverySearch` in this Batch 5 slice is a plain list/filter over rows already RLS-visible — explicitly NOT a search index or ranking feature (no `SearchIndex` involvement, no `SearchFilter`-driven ranking). `AdmissionsProfileView` is read-only and limited to effectively-visible profiles only; the admissions officer writes nothing in Batch 5. `VerificationTier`, `SelfReportedLabel`, `Shortlist`, and `ShortlistEntry` remain the unbuilt long-term model and are out of scope for Batch 5. This is a deliberate, recorded decision (see `recruitbook-diagrams/diagrams/slices/batch-5-admissions-discovery/README.md`), not silent architecture drift — the same pattern as the Batch 3 `HighSchool` refinement and the Batch 4 `TranscriptSupportRequest` refinement above. **Group 1c domain-subset addition:** `ProfileVisibilitySettings` is one-to-one with `StudentProfile`, keyed by `student_profile_id`; the two anticipated RLS helpers are `is_verified_admissions_officer()` and `is_admissions_visible_profile(profile_id)`, both evaluated at query time — no derived/cached visibility field is stored anywhere.

> **Batch 6 prototype refinement (Admissions Shortlists, Group 1c — domain-subset level):** `ShortlistEntry` is refined for Batch 6 into a single new table, `admissions_shortlist_entries` — a bare officer-owned reference holding only an entry `id`, a server-derived `admissions_officer_application_user_id` (the owner, never client-supplied), `student_profile_id` (a lookup key only, no denormalized student content), and `created_at`. No `updated_at` and no update path — the row is immutable except for owner hard-delete. `Shortlist` itself is **not implemented** in Batch 6: there is no named or multiple-shortlist object, no `Shortlist.create(owner, name)` surface, and no shortlist-level table — Batch 6 models exactly **one implicit, unnamed shortlist per officer** directly as rows in `admissions_shortlist_entries`. Every read re-evaluates `is_admissions_visible_profile(student_profile_id)` at query time; there is no cached/derived visibility field on the entry. The richer catalog model (named `Shortlist` records, each containing `ShortlistEntry` rows) remains the unbuilt long-term direction. This is a deliberate, recorded decision (see `recruitbook-diagrams/diagrams/slices/batch-6-admissions-shortlists/README.md`), not silent architecture drift — the same pattern as the Batch 3 `HighSchool` refinement, the Batch 4 `TranscriptSupportRequest` refinement, and the Batch 5 `ConsentSettings` collapse above. This is a Group 1a/1c **proposed** shape, not yet implemented schema — it requires the mandatory pre-migration design review at Group 2.

---

# 9. Security Objects

| Object                 | Source Use Case / Scenario                           | Source Noun or Verb                                                               | Object Type     | Description                                                                    | Suggested Stereotype |
| ---------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------ | -------------------- |
| RowLevelSecurityPolicy | MC-6 Unauthorized Profile Access & Consent Bypass    | “row-level security,” “enforce profile visibility and consent”                    | Security Object | Enforces access rules at the database level.                                   | `<<policy>>`         |
| AIOutputPolicy         | UC-5 AI Contextualization; MC-5 Unreviewed AI Output | “never show AI output,” “approved,” “human review”                                | Security Rule   | Prevents AI output from appearing before required student and human approvals. | `<<policy>>`         |
| SearchFilter           | UC-6 Admissions Officer Search                       | “filters,” “country,” “field of interest,” “graduation year,” “verification tier” | Value Object    | Stores criteria used during admissions searches.                               | `<<value-object>>`   |

---

# 10. Optional Objects Not Included in Core Catalog

These objects may be added later if the relevant diagram or implementation phase requires them. Do not use them by default.

| Optional Object         | Reason Not Included by Default                                                                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| RateLimitRule           | Useful for modeling account creation abuse, but not needed in most core diagrams.                                                                    |
| CaptchaChallenge        | Useful for registration abuse diagrams, but not central to RecruitBook’s main value.                                                                 |
| ProfileVersion          | Useful for modeling “updated since last viewed,” but not needed for the first core class diagram.                                                    |
| SchoolOnboardingRequest | Useful for the missing-school alternate path, but not central to the current prototype diagrams.                                                     |
| SecurityAlert           | Useful for operational monitoring, but not needed in the main UML object model.                                                                      |
| ErrorLogEntry           | Useful for observability diagrams, but not needed in the core object catalog.                                                                        |
| InterestSignal          | Useful if modeling the optional admissions interest flow; otherwise can be added later.                                                              |
| PromptRecord            | Can be added later if prompt versioning becomes important. For now, prompt metadata can be represented as an attribute of AIContextualizationOutput. |

---

# 11. Diagram Usage Guidance

Use this catalog differently depending on diagram type.

## Use Case Diagram

Use actor references and high-level use cases. Do not turn every object into a use case.

Relevant actors:

* Student
* Counselor
* PlatformAdministrator
* AdmissionsOfficer
* Attacker

## Misuse Case Diagram

Use the Attacker actor and security-related misuse cases.

Relevant controls:

* AccessPolicy
* RowLevelSecurityPolicy
* AIOutputPolicy
* EmailVerificationToken
* CounselorInvitation
* FileValidationRule
* AuditLogEntry

## Secure Domain Class Diagram

Use the domain object categories:

* Identity & Role Access Objects
* Student Profile Objects
* School & Counselor Objects
* Counselor Support & Transcript Objects
* AI Contextualization Objects
* Admissions Discovery & Review Objects
* Security Objects

Do not include actor references as ordinary classes unless modeling a profile/account object.

## Activity Diagrams

Use actors as swimlanes. Use domain objects only when they clarify workflow.

Recommended swimlanes:

* Student
* RecruitBookApp
* Counselor
* PlatformAdministrator
* AdmissionsOfficer
* AIService
* EmailService
* Database
* ObjectStorage

## Sequence Diagrams

Use actor references, boundary objects, control objects, and domain objects.

Example lifeline types:

* Actor: Student, Counselor, PlatformAdministrator, AdmissionsOfficer
* Boundary: RecruitBookApp, AdmissionsProfileView
* Control: AccessPolicy, AIOutputPolicy, FileValidationRule
* Entity: StudentProfile, CounselorProfile, AIContextualizationOutput
* External: AIService, EmailService, Database, ObjectStorage

## State Machine Diagrams

Use state machines mainly for lifecycle-heavy objects:

* StudentProfile
* AIContextualizationOutput
* CounselorInvitation
* TranscriptSupportRequest

## Trust Boundary / Data Flow Diagram

Use actors, external systems, data stores, and security controls.

Relevant objects:

* StudentProfile
* AcademicRecord
* NarrativeResponse
* ConsentSettings
* ProfileVisibilitySettings
* AIContextualizationOutput
* Transcript
* UploadedFile
* AccessPolicy
* RowLevelSecurityPolicy
* AIOutputPolicy
* FileValidationRule
* AuditLogEntry

---

# 12. Core Security Rules for Diagrams

All RecruitBook diagrams should preserve these rules when relevant:

1. AI output cannot become visible to admissions officers unless the student accepts it and a counselor or platform administrator approves it.
2. Student-written narrative responses must remain separate from AI-generated contextualization output.
3. Admissions officers can only view profiles that are published and allowed by current visibility and consent settings.
4. Visibility and consent must be checked again when a saved or old profile link is opened.
5. Counselors can only support students linked to the counselor’s verified high school.
6. Unverified counselors cannot access student rosters or transcript-support requests.
7. Transcript uploads must validate file type and file size before storage.
8. Privileged actions and denied access attempts should create audit log entries.
9. Row-level security should enforce access rules at the database level.
10. Self-reported information must be visibly labeled when shown to admissions officers.
