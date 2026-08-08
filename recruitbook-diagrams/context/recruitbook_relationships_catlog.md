# RecruitBook Relationship Catalog

This file defines the approved relationships between RecruitBook objects for UML and PlantUML diagram generation.

Use this file together with:

* `context/recruitbook_object_catalog.md`
* `context/diagram_rules.md`
* `context/security_rules.md`, if available

This file prevents ambiguous or unsupported relationships from appearing in diagrams.

---

# 1. Relationship Catalog Rules

* Use object names exactly as written in `context/recruitbook_object_catalog.md`.
* Do not invent new relationship names unless the user explicitly approves them.
* Prefer clear relationship labels over vague labels like “uses” or “has.”
* Include multiplicity when useful.
* Use composition only when the child object depends strongly on the parent object.
* Use association for normal business relationships.
* Use dependency for policy checks, validation, external calls, or temporary use.
* Use aggregation sparingly.
* Do not connect every object to every other object.
* Only include relationships that help explain the RecruitBook system.
* Security, privacy, consent, visibility, and verification relationships should be shown explicitly when relevant.

---

# 2. UML Relationship Types

Use these relationship types consistently.

| Relationship Type | PlantUML Notation | Meaning |
|---|---|---|
| Association | `--` | A normal relationship between two objects. |
| Directed Association | `-->` | One object knows about or navigates to another. |
| Dependency | `..>` | One object depends on another temporarily, usually for validation, authorization, or processing. |
| Aggregation | `o--` | A weak whole-part relationship. |
| Composition | `*--` | A strong ownership relationship where the part belongs to the whole. |
| Generalization | `<|--` | Inheritance or “is-a” relationship. Use rarely in this project. |
| Realization | `<|..` | Interface implementation. Use only if explicitly needed. |

---

# 3. Multiplicity Guide

Use these multiplicities when creating UML class diagrams.

| Multiplicity | Meaning               |
| ------------ | --------------------- |
| `1`          | Exactly one           |
| `0..1`       | Optional, zero or one |
| `0..*`       | Zero or many          |
| `1..*`       | One or many           |
| `*`          | Many, unspecified     |

---

# 4. Identity & Role Access Relationships

| Source Object          | Relationship            | Target Object            | Multiplicity                                       | UML Type             | Label / Meaning                                                                 | Source           |
| ---------------------- | ----------------------- | ------------------------ | -------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------- | ---------------- |
| UserAccount            | has                     | Role                     | `1` UserAccount to `1` Role                        | Association          | Each user account has exactly one main role.                                    | UC-1, UC-2, UC-6 |
| UserAccount            | may own                 | StudentProfile           | `1` UserAccount to `0..1` StudentProfile           | Association          | A student account may own one student profile.                                  | UC-1, UC-3       |
| UserAccount            | may own                 | CounselorProfile         | `1` UserAccount to `0..1` CounselorProfile         | Association          | A counselor account may own one counselor profile.                              | UC-2             |
| UserAccount            | may own                 | AdmissionsOfficerProfile | `1` UserAccount to `0..1` AdmissionsOfficerProfile | Association          | An admissions officer account may own one admissions profile.                   | UC-6             |
| UserAccount            | verified by             | EmailVerificationToken   | `1` UserAccount to `0..*` EmailVerificationToken   | Association          | A user account may receive one or more verification tokens over time.           | UC-1             |
| EmailVerificationToken | belongs to              | UserAccount              | `1` token to `1` UserAccount                       | Directed Association | A verification token is bound to one account.                                   | UC-1             |
| AccessPolicy           | evaluates               | UserAccount              | `1` AccessPolicy to `0..*` UserAccount             | Dependency           | Access decisions depend on user identity, role, and status.                     | UC-4, UC-6, MC-6 |
| AuditLogEntry          | records action by       | UserAccount              | `0..*` AuditLogEntry to `1` UserAccount            | Association          | Each audit log entry records the user who performed the action when applicable. | UC-2, UC-4, UC-5 |
| AuditLogEntry          | records affected object | StudentProfile           | `0..*` AuditLogEntry to `0..1` StudentProfile      | Association          | Audit logs may refer to a student profile affected by the action.               | UC-4, UC-5, UC-6 |
| AuditLogEntry          | records affected object | CounselorProfile         | `0..*` AuditLogEntry to `0..1` CounselorProfile    | Association          | Audit logs may refer to a counselor account affected by verification.           | UC-2             |

---

# 5. Student Profile Relationships

| Source Object             | Relationship           | Target Object             | Multiplicity                                        | UML Type    | Label / Meaning                                                                    | Source           |
| ------------------------- | ---------------------- | ------------------------- | --------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------- | ---------------- |
| StudentProfile            | composed of            | IdentityInformation       | `1` StudentProfile to `1` IdentityInformation       | Composition | Identity information is part of the student profile.                               | UC-3             |
| StudentProfile            | composed of            | AcademicRecord            | `1` StudentProfile to `1..*` AcademicRecord         | Composition | Academic records belong to the student profile.                                    | UC-3             |
| AcademicRecord            | uses                   | GradingScale              | `1` AcademicRecord to `1` GradingScale              | Association | Academic records should be interpreted using the original grading scale.           | UC-3, UC-6       |
| StudentProfile            | has                    | AcademicInterest          | `1` StudentProfile to `1..3` AcademicInterest       | Association | A student selects one to three academic interests.                                 | UC-3, UC-6       |
| StudentProfile            | contains               | NarrativeResponse         | `1` StudentProfile to `0..*` NarrativeResponse      | Composition | Student-written responses are part of the profile.                                 | UC-3, UC-5       |
| StudentProfile            | contains               | ProfileItem               | `1` StudentProfile to `0..*` ProfileItem            | Composition | Achievements and activities are stored as profile items.                           | UC-3             |
| StudentProfile            | has                    | ProfileVisibilitySettings | `1` StudentProfile to `1` ProfileVisibilitySettings | Composition | Visibility settings belong to one student profile.                                 | UC-3, UC-6       |
| StudentProfile            | has                    | ConsentSettings           | `1` StudentProfile to `1` ConsentSettings           | Composition | Consent settings belong to one student profile.                                    | UC-3, UC-5, UC-6 |
| StudentProfile            | has                    | VerificationTier          | `1` StudentProfile to `1` VerificationTier          | Association | Verification tier communicates credibility level.                                  | UC-3, UC-4, UC-6 |
| AcademicRecord            | may have               | SelfReportedLabel         | `1` AcademicRecord to `0..1` SelfReportedLabel      | Association | Academic information may be labeled as self-reported.                              | UC-3, MC-3       |
| ProfileItem               | may have               | SelfReportedLabel         | `1` ProfileItem to `0..1` SelfReportedLabel         | Association | Achievements or activities may be labeled as self-reported.                        | UC-3, MC-3       |
| NarrativeResponse         | may have               | SelfReportedLabel         | `1` NarrativeResponse to `0..1` SelfReportedLabel   | Association | Narrative responses remain student-authored and may be labeled accordingly.        | UC-5             |
| StudentProfile            | linked to              | HighSchool                | `0..*` StudentProfile to `1` HighSchool             | Association | Each student profile should be linked to one high school.                          | UC-3, UC-4       |
| ProfileVisibilitySettings | controls visibility of | StudentProfile            | `1` settings to `1` StudentProfile                  | Dependency  | Visibility settings control whether the profile can appear in search or be opened. | UC-3, UC-6, MC-6 |
| ConsentSettings           | controls processing of | StudentProfile            | `1` settings to `1` StudentProfile                  | Dependency  | Consent settings control AI processing and admissions-facing visibility.           | UC-5, UC-6       |

---

# 6. School & Counselor Trust Relationships

| Source Object         | Relationship                   | Target Object                       | Multiplicity                                              | UML Type    | Label / Meaning                                                                       | Source     |
| --------------------- | ------------------------------ | ----------------------------------- | --------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------- | ---------- |
| HighSchool            | has                            | CounselorProfile                    | `1` HighSchool to `0..*` CounselorProfile                 | Association | A high school may have multiple counselors.                                           | UC-2, UC-4 |
| CounselorProfile      | bound to                       | HighSchool                          | `1` CounselorProfile to `1` HighSchool                    | Association | A counselor account is bound to one high school.                                      | UC-2       |
| CounselorInvitation   | bound to                       | HighSchool                          | `1` CounselorInvitation to `1` HighSchool                 | Association | Counselor invitation links are tied to a specific school.                             | UC-2, MC-2 |
| CounselorInvitation   | creates                        | CounselorProfile                    | `1` CounselorInvitation to `0..1` CounselorProfile        | Dependency  | A valid invitation can lead to counselor profile creation.                            | UC-2       |
| CounselorInvitation   | consumed by                    | UserAccount                         | `1` CounselorInvitation to `0..1` UserAccount             | Association | A counselor account consumes the invitation during registration.                      | UC-2, MC-2 |
| CounselorProfile      | reviewed through               | VerificationQueueItem               | `1` CounselorProfile to `1` VerificationQueueItem         | Association | New counselor profiles enter the verification queue.                                  | UC-2       |
| VerificationQueueItem | resolved by                    | VerificationDecision                | `1` VerificationQueueItem to `0..1` VerificationDecision  | Association | A queue item is resolved by an approval or denial decision.                           | UC-2       |
| VerificationDecision  | applies to                     | CounselorProfile                    | `1` VerificationDecision to `1` CounselorProfile          | Association | Counselor verification decisions apply to one counselor profile.                      | UC-2       |
| VerificationDecision  | recorded in                    | AuditLogEntry                       | `1` VerificationDecision to `1` AuditLogEntry             | Dependency  | Verification decisions should create audit logs.                                      | UC-2       |
| CounselorProfile      | may support                    | StudentProfile                      | `1` CounselorProfile to `0..*` StudentProfile             | Association | A verified counselor may support students from the same high school. **Prototype (Batch 3+): mediated by an accepted `CounselorStudentLink` consent, NOT `HighSchool` match — see architecture-decisions.md.** | UC-4       |
| AccessPolicy          | validates school match between | CounselorProfile and StudentProfile | `1` policy to `1` CounselorProfile and `1` StudentProfile | Dependency  | Counselor access requires counselor and student to be linked to the same high school. **Prototype (Batch 3+): replaced by `AccessPolicy.requireAcceptedLink(...)` / RLS `is_linked_counselor_for_profile(...)` over `CounselorStudentLink`.** | UC-4       |

---

# 6a. Counselor–Student Consent Link Relationships (Batch 3 — Counselor Connection Foundation)

Prototype refinement of the school-match model. `CounselorStudentLink` is the implemented per-student consent edge; a verified counselor gains SELECT-only visibility of a student profile only through an **accepted** link. These relationships are additive to Section 6 and do not remove the future `HighSchool` model.

| Source Object          | Relationship            | Target Object          | Multiplicity                                              | UML Type    | Label / Meaning                                                                                                          | Source |
| ---------------------- | ----------------------- | ---------------------- | -------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ | ------ |
| ApplicationUser (student) | requests             | CounselorStudentLink   | `1` student ApplicationUser to `0..*` CounselorStudentLink | Association  | A student requests a per-student counselor link by email. The student owns the request lifecycle (create, revoke).       | Batch 3 |
| ApplicationUser (counselor) | bound to at accept | CounselorStudentLink   | `0..1` counselor ApplicationUser to `0..*` CounselorStudentLink | Association  | `counselor_application_user_id` is NULL while Requested; a verified addressed counselor binds themselves at accept time. | Batch 3 |
| CounselorStudentLink   | grants SELECT-only access to | StudentProfile    | `1` accepted CounselorStudentLink to `1` StudentProfile   | Dependency  | An accepted link authorizes a verified counselor to READ (never write) the owner's profile aggregate.                    | Batch 3 |
| RowLevelSecurityPolicy | enforces                | CounselorStudentLink   | `1` RowLevelSecurityPolicy to `0..*` CounselorStudentLink | Dependency  | RLS enforces per-role link transitions (student create/revoke; verified addressed counselor accept/decline) and admin SELECT-only. | Batch 3 |

---

# 7. Counselor Support & Transcript Relationships

| Source Object            | Relationship   | Target Object            | Multiplicity                                            | UML Type    | Label / Meaning                                                                   | Source     |
| ------------------------ | -------------- | ------------------------ | ------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------- | ---------- |
| StudentProfile           | creates        | TranscriptSupportRequest | `1` StudentProfile to `0..*` TranscriptSupportRequest   | Association | A student can request transcript or counselor support.                            | UC-4       |
| TranscriptSupportRequest | assigned to    | CounselorProfile         | `0..*` TranscriptSupportRequest to `1` CounselorProfile | Association | A transcript support request is handled by a verified counselor.                  | UC-4       |
| TranscriptSupportRequest | belongs to     | StudentProfile           | `1` TranscriptSupportRequest to `1` StudentProfile      | Association | A support request belongs to one student profile.                                 | UC-4       |
| CounselorProfile         | reviews        | TranscriptSupportRequest | `1` CounselorProfile to `0..*` TranscriptSupportRequest | Association | Counselors review support requests from students at their school.                 | UC-4       |
| TranscriptSupportRequest | may produce    | Transcript               | `1` TranscriptSupportRequest to `0..1` Transcript       | Association | A support request may result in a submitted transcript.                           | UC-4       |
| Transcript               | represented by | UploadedFile             | `1` Transcript to `1` UploadedFile                      | Composition | Transcript metadata is linked to one stored uploaded file.                        | UC-4       |
| UploadedFile             | stored in      | ObjectStorage            | `0..*` UploadedFile to `1` ObjectStorage                | Dependency  | Uploaded documents are stored in protected object storage.                        | UC-4       |
| FileValidationRule       | validates      | UploadedFile             | `1` FileValidationRule to `0..*` UploadedFile           | Dependency  | Files must pass type and size validation before storage.                          | UC-4, MC-4 |
| TranscriptSupportRequest | updates        | VerificationTier         | `1` TranscriptSupportRequest to `1` VerificationTier    | Dependency  | Counselor support or transcript evidence can raise the profile verification tier. | UC-4       |
| TranscriptSupportRequest | recorded in    | AuditLogEntry            | `1` TranscriptSupportRequest to `1..*` AuditLogEntry    | Dependency  | Counselor support and upload actions should be audited.                           | UC-4       |
| AccessPolicy             | authorizes     | TranscriptSupportRequest | `1` AccessPolicy to `0..*` TranscriptSupportRequest     | Dependency  | The system checks counselor verification and school match before support access.  | UC-4       |

---

# 7a. Counselor Review Workflow Relationships (Batch 4 — Counselor Review Workflow)

Prototype refinement of the UC-4 counselor-support relationships above: the implemented review flow is anchored to the Batch 3 consent edge (`CounselorStudentLink`), not to `HighSchool`/`CounselorProfile` school binding. These relationships are additive to Section 7 and do not remove the future transcript-support model.

| Source Object          | Relationship            | Target Object          | Multiplicity                                              | UML Type    | Label / Meaning                                                                                                          | Source |
| ---------------------- | ----------------------- | ---------------------- | -------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ | ------ |
| ApplicationUser (student) | submits              | CounselorReviewRequest | `1` student ApplicationUser to `0..*` CounselorReviewRequest | Association | A student submits their profile for review to one accepted-linked counselor; the student owns submit/withdraw and reads own history forever. | Batch 4 |
| CounselorStudentLink   | anchors + authorizes    | CounselorReviewRequest | `1` accepted CounselorStudentLink to `0..*` CounselorReviewRequest | Association | Every review request is born from ONE accepted link; all counselor-side access tests that link is still `Accepted` at query time (revocation kills the review surface immediately). | Batch 4 |
| ApplicationUser (counselor) | responds to        | CounselorReviewRequest | `1` counselor ApplicationUser to `0..*` CounselorReviewRequest | Association | The addressed verified counselor declines or completes; the counselor id is copied from the link at submit time (no late binding). | Batch 4 |
| CounselorReviewRequest | completed by            | CounselorFeedbackNote  | `1` CounselorReviewRequest to `0..1` CounselorFeedbackNote | Association | Exactly one immutable feedback note completes a request (`request_id` unique); Declined/Withdrawn requests have none.    | Batch 4 |
| ApplicationUser (counselor) | authors            | CounselorFeedbackNote  | `1` counselor ApplicationUser to `0..*` CounselorFeedbackNote | Association | The addressed counselor authors the note (self-bound author id); no role may UPDATE or DELETE it.                        | Batch 4 |
| RowLevelSecurityPolicy | enforces                | CounselorReviewRequest | `1` RowLevelSecurityPolicy to `0..*` CounselorReviewRequest | Dependency  | RLS enforces per-role transitions (student submit/withdraw; addressed live-linked counselor decline/complete) and admin SELECT-only; admissions zero. | Batch 4 |
| RowLevelSecurityPolicy | enforces                | CounselorFeedbackNote  | `1` RowLevelSecurityPolicy to `0..*` CounselorFeedbackNote | Dependency  | RLS enforces counselor-only INSERT (live link), student ownership SELECT (survives revocation), immutability, admin SELECT-only. | Batch 4 |

---

# 8. AI Contextualization Relationships

| Source Object              | Relationship           | Target Object              | Multiplicity                                                       | UML Type    | Label / Meaning                                                                     | Source     |
| -------------------------- | ---------------------- | -------------------------- | ------------------------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------- | ---------- |
| StudentProfile             | may create             | AIConsentRecord            | `1` StudentProfile to `0..*` AIConsentRecord                       | Association | A student profile may have AI consent records over time.                            | UC-5       |
| AIConsentRecord            | belongs to             | StudentProfile             | `1` AIConsentRecord to `1` StudentProfile                          | Association | Each AI consent record belongs to one student profile.                              | UC-5       |
| ConsentSettings            | controls               | AIConsentRecord            | `1` ConsentSettings to `0..*` AIConsentRecord                      | Dependency  | Consent settings determine whether AI contextualization is allowed.                 | UC-5       |
| StudentProfile             | creates                | AIContextualizationRequest | `1` StudentProfile to `0..*` AIContextualizationRequest            | Association | A student profile may generate AI contextualization requests.                       | UC-5       |
| AIContextualizationRequest | uses                   | NarrativeResponse          | `1` AIContextualizationRequest to `1..*` NarrativeResponse         | Association | AI requests use only selected eligible narrative fields.                            | UC-5       |
| AIContextualizationRequest | requires               | AIConsentRecord            | `1` AIContextualizationRequest to `1` AIConsentRecord              | Dependency  | AI contextualization requires explicit recorded consent.                            | UC-5       |
| AIContextualizationRequest | sent to                | AIService                  | `1` AIContextualizationRequest to `1` AIService                    | Dependency  | Approved profile fields are sent to the AI service.                                 | UC-5       |
| AIService                  | returns                | AIContextualizationOutput  | `1` AIService to `0..*` AIContextualizationOutput                  | Dependency  | The AI service returns generated contextualization output.                          | UC-5       |
| AIContextualizationRequest | produces               | AIContextualizationOutput  | `1` AIContextualizationRequest to `0..1` AIContextualizationOutput | Association | A successful AI request produces one AI output.                                     | UC-5       |
| AIContextualizationOutput  | derived from           | NarrativeResponse          | `1` AIContextualizationOutput to `1..*` NarrativeResponse          | Dependency  | AI output is derived from selected student-authored fields.                         | UC-5       |
| AIContextualizationOutput  | reviewed by            | StudentAIReviewDecision    | `1` AIContextualizationOutput to `0..1` StudentAIReviewDecision    | Association | The student must accept, reject, or request revision.                               | UC-5       |
| AIContextualizationOutput  | reviewed by            | HumanReviewDecision        | `1` AIContextualizationOutput to `0..1` HumanReviewDecision        | Association | A counselor or platform admin must approve, reject, or request revision.            | UC-5, MC-5 |
| HumanReviewDecision        | may be made by         | CounselorProfile           | `0..*` HumanReviewDecision to `0..1` CounselorProfile              | Association | Verified counselors can review AI output for students at their school.              | UC-5       |
| HumanReviewDecision        | may be made by         | PlatformAdministrator      | `0..*` HumanReviewDecision to `0..1` PlatformAdministrator         | Association | Platform admins can review AI output when no verified counselor is available.       | UC-5       |
| AIOutputPolicy             | controls visibility of | AIContextualizationOutput  | `1` AIOutputPolicy to `0..*` AIContextualizationOutput             | Dependency  | AI output cannot be admissions-visible until required approvals exist.              | UC-5, MC-5 |
| AIContextualizationOutput  | may appear in          | AdmissionsProfileView      | `0..*` AIContextualizationOutput to `0..1` AdmissionsProfileView   | Dependency  | Only approved AI output can appear in the admissions-facing view.                   | UC-5, UC-6 |
| AIContextualizationOutput  | recorded in            | AuditLogEntry              | `1` AIContextualizationOutput to `0..*` AuditLogEntry              | Dependency  | AI generation, review, approval, rejection, and visibility events should be logged. | UC-5, MC-5 |

---

# 9. Admissions Discovery & Review Relationships

| Source Object            | Relationship        | Target Object             | Multiplicity                                                   | UML Type    | Label / Meaning                                                      | Source     |
| ------------------------ | ------------------- | ------------------------- | -------------------------------------------------------------- | ----------- | -------------------------------------------------------------------- | ---------- |
| UniversityAccount        | has                 | AdmissionsOfficerProfile  | `1` UniversityAccount to `0..*` AdmissionsOfficerProfile       | Association | A university account may have multiple admissions officers.          | UC-6       |
| AdmissionsOfficerProfile | belongs to          | UniversityAccount         | `1` AdmissionsOfficerProfile to `1` UniversityAccount          | Association | Each admissions officer profile belongs to one university.           | UC-6       |
| AdmissionsOfficerProfile | performs            | StudentDiscoverySearch    | `1` AdmissionsOfficerProfile to `0..*` StudentDiscoverySearch  | Association | Admissions officers perform student discovery searches.              | UC-6       |
| StudentDiscoverySearch   | uses                | SearchFilter              | `1` StudentDiscoverySearch to `0..*` SearchFilter              | Composition | A search may use multiple filter criteria.                           | UC-6       |
| StudentDiscoverySearch   | queries             | StudentProfile            | `1` StudentDiscoverySearch to `0..*` StudentProfile            | Dependency  | Search returns matching published and visible student profiles.      | UC-6       |
| StudentDiscoverySearch   | depends on          | ProfileVisibilitySettings | `1` StudentDiscoverySearch to `0..*` ProfileVisibilitySettings | Dependency  | Search results must respect visibility settings.                     | UC-6, MC-6 |
| StudentDiscoverySearch   | depends on          | ConsentSettings           | `1` StudentDiscoverySearch to `0..*` ConsentSettings           | Dependency  | Search results must respect consent settings.                        | UC-6, MC-6 |
| AccessPolicy             | authorizes          | StudentDiscoverySearch    | `1` AccessPolicy to `0..*` StudentDiscoverySearch              | Dependency  | Only approved admissions officers can use discovery search.          | UC-6       |
| AdmissionsOfficerProfile | opens               | AdmissionsProfileView     | `1` AdmissionsOfficerProfile to `0..*` AdmissionsProfileView   | Association | Admissions officers can open admissions-facing profile views.        | UC-6       |
| AdmissionsProfileView    | renders             | StudentProfile            | `1` AdmissionsProfileView to `1` StudentProfile                | Dependency  | The admissions view renders only allowed student profile data.       | UC-6       |
| AdmissionsProfileView    | includes            | AcademicRecord            | `1` AdmissionsProfileView to `0..*` AcademicRecord             | Dependency  | Academic records can appear in admissions view.                      | UC-6       |
| AdmissionsProfileView    | includes            | VerificationTier          | `1` AdmissionsProfileView to `1` VerificationTier              | Dependency  | Verification tier should appear on admissions-facing profiles.       | UC-6       |
| AdmissionsProfileView    | includes            | SelfReportedLabel         | `1` AdmissionsProfileView to `0..*` SelfReportedLabel          | Dependency  | Self-reported labels should appear when relevant.                    | UC-6, MC-3 |
| AdmissionsProfileView    | includes approved   | AIContextualizationOutput | `1` AdmissionsProfileView to `0..*` AIContextualizationOutput  | Dependency  | Only approved AI output can appear in the admissions view.           | UC-5, UC-6 |
| AccessPolicy             | authorizes          | AdmissionsProfileView     | `1` AccessPolicy to `0..*` AdmissionsProfileView               | Dependency  | The system checks authorization before returning profile data.       | UC-6, MC-6 |
| RowLevelSecurityPolicy   | enforces access for | StudentProfile            | `1` RowLevelSecurityPolicy to `0..*` StudentProfile            | Dependency  | Database-level rules protect student profile rows.                   | MC-6       |
| RowLevelSecurityPolicy   | enforces access for | AdmissionsProfileView     | `1` RowLevelSecurityPolicy to `0..*` AdmissionsProfileView     | Dependency  | Admissions-facing views must obey row-level access rules.            | MC-6       |
| AdmissionsOfficerProfile | owns                | Shortlist                 | `1` AdmissionsOfficerProfile to `0..*` Shortlist               | Composition | An admissions officer can own private shortlists.                    | UC-6       |
| Shortlist                | contains            | ShortlistEntry            | `1` Shortlist to `0..*` ShortlistEntry                         | Composition | A shortlist contains saved entries.                                  | UC-6       |
| ShortlistEntry           | references          | StudentProfile            | `0..*` ShortlistEntry to `1` StudentProfile                    | Association | Each shortlist entry references one student profile.                 | UC-6       |
| ShortlistEntry           | belongs to          | Shortlist                 | `1` ShortlistEntry to `1` Shortlist                            | Association | Each shortlist entry belongs to one shortlist.                       | UC-6       |
| AccessPolicy             | rechecks            | StudentProfile            | `1` AccessPolicy to `0..*` StudentProfile                      | Dependency  | Old saved profile links must recheck current visibility and consent. | UC-6, MC-6 |

---

# 9a. Admissions Shortlist Relationships (Batch 6 — Admissions Shortlists, prototype refinement)

Prototype refinement of the `Shortlist`/`ShortlistEntry` rows above: Batch 6 collapses the two-step `AdmissionsOfficerProfile owns Shortlist` / `Shortlist contains ShortlistEntry` ownership chain into one direct relationship — there is no `Shortlist` object/table in Batch 6, only one implicit unnamed shortlist per officer. The `ShortlistEntry references StudentProfile` row above is unchanged in meaning and still applies. These relationships are additive to Section 9 and do not remove the future named/multiple-`Shortlist` model.

| Source Object            | Relationship | Target Object   | Multiplicity                                  | UML Type    | Label / Meaning                                                                                          | Source  |
| ------------------------ | ------------- | ---------------- | ---------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------- | ------- |
| AdmissionsOfficerProfile  | owns          | ShortlistEntry   | `1` AdmissionsOfficerProfile to `0..*` ShortlistEntry | Composition | Batch 6: an officer directly owns their own shortlist entries — no intervening `Shortlist` row.            | Batch 6 |
| ShortlistEntry            | references    | StudentProfile   | `0..*` ShortlistEntry to `1` StudentProfile     | Association | Bare lookup-key reference only; visibility is re-checked via `is_admissions_visible_profile(profile_id)` at read time, never denormalized. | Batch 6 |

---

# 10. Security & Policy Relationships

| Source Object          | Relationship              | Target Object             | Multiplicity                                         | UML Type   | Label / Meaning                                                      | Source           |
| ---------------------- | ------------------------- | ------------------------- | ---------------------------------------------------- | ---------- | -------------------------------------------------------------------- | ---------------- |
| AccessPolicy           | depends on                | Role                      | `1` AccessPolicy to `1..*` Role                      | Dependency | Authorization decisions depend on user role.                         | UC-4, UC-6       |
| AccessPolicy           | depends on                | ProfileVisibilitySettings | `1` AccessPolicy to `0..*` ProfileVisibilitySettings | Dependency | Access decisions depend on current profile visibility.               | UC-6, MC-6       |
| AccessPolicy           | depends on                | ConsentSettings           | `1` AccessPolicy to `0..*` ConsentSettings           | Dependency | Access decisions depend on current consent settings.                 | UC-5, UC-6       |
| AccessPolicy           | depends on                | VerificationTier          | `1` AccessPolicy to `0..*` VerificationTier          | Dependency | Some searches may filter or depend on verification tier.             | UC-6             |
| RowLevelSecurityPolicy | supports                  | AccessPolicy              | `1` RowLevelSecurityPolicy to `1` AccessPolicy       | Dependency | Database-level enforcement supports application-level authorization. | MC-6             |
| AIOutputPolicy         | depends on                | StudentAIReviewDecision   | `1` AIOutputPolicy to `0..*` StudentAIReviewDecision | Dependency | AI visibility depends on student acceptance.                         | UC-5, MC-5       |
| AIOutputPolicy         | depends on                | HumanReviewDecision       | `1` AIOutputPolicy to `0..*` HumanReviewDecision     | Dependency | AI visibility depends on counselor/admin approval.                   | UC-5, MC-5       |
| AIOutputPolicy         | protects                  | AdmissionsProfileView     | `1` AIOutputPolicy to `0..*` AdmissionsProfileView   | Dependency | Admissions view must not show unapproved AI output.                  | UC-5, MC-5       |
| FileValidationRule     | protects                  | ObjectStorage             | `1` FileValidationRule to `1` ObjectStorage          | Dependency | Invalid or oversized files should not reach protected storage.       | UC-4, MC-4       |
| AuditLogEntry          | may record denial from    | AccessPolicy              | `0..*` AuditLogEntry to `0..1` AccessPolicy          | Dependency | Denied access attempts can be recorded in the audit log.             | UC-4, UC-6, MC-6 |
| AuditLogEntry          | may record enforcement by | AIOutputPolicy            | `0..*` AuditLogEntry to `0..1` AIOutputPolicy        | Dependency | AI approval, rejection, or visibility decisions can be audited.      | UC-5, MC-5       |
| AuditLogEntry          | may record validation by  | FileValidationRule        | `0..*` AuditLogEntry to `0..1` FileValidationRule    | Dependency | Failed or successful upload validation may be audited.               | UC-4, MC-4       |

---

# 11. External System Relationships

| Source Object          | Relationship        | Target Object          | Multiplicity                                      | UML Type   | Label / Meaning                                                             | Source        |
| ---------------------- | ------------------- | ---------------------- | ------------------------------------------------- | ---------- | --------------------------------------------------------------------------- | ------------- |
| RecruitBookApp         | sends email through | EmailService           | `1` RecruitBookApp to `1` EmailService            | Dependency | RecruitBook uses email service for verification and invitations.            | UC-1, UC-2    |
| EmailService           | delivers            | EmailVerificationToken | `1` EmailService to `0..*` EmailVerificationToken | Dependency | Verification links are delivered through email.                             | UC-1          |
| EmailService           | delivers            | CounselorInvitation    | `1` EmailService to `0..*` CounselorInvitation    | Dependency | Counselor invitation links are delivered through email.                     | UC-2          |
| RecruitBookApp         | stores records in   | Database               | `1` RecruitBookApp to `1` Database                | Dependency | RecruitBook stores application records in the database.                     | All use cases |
| RecruitBookApp         | stores files in     | ObjectStorage          | `1` RecruitBookApp to `1` ObjectStorage           | Dependency | RecruitBook stores transcript files in protected storage.                   | UC-4          |
| RecruitBookApp         | sends request to    | AIService              | `1` RecruitBookApp to `1` AIService               | Dependency | RecruitBook sends approved AI contextualization requests to the AI service. | UC-5          |
| StudentDiscoverySearch | may query           | SearchIndex            | `1` StudentDiscoverySearch to `0..1` SearchIndex  | Dependency | Search may use a search index for filtering and discovery.                  | UC-6          |
| SearchIndex            | indexes             | StudentProfile         | `1` SearchIndex to `0..*` StudentProfile          | Dependency | Only published and visible profiles should be indexed.                      | UC-6, MC-1    |
| RowLevelSecurityPolicy | enforced by         | Database               | `1` RowLevelSecurityPolicy to `1` Database        | Dependency | Database enforces row-level visibility and access rules.                    | MC-6          |

---

# 12. Recommended Class Diagram Relationships

Use this smaller set when generating the main Secure Domain Class Diagram. Do not use every relationship above unless the diagram remains readable.

| Source                     | Target                     | Relationship           | Multiplicity  | UML Type    |
| -------------------------- | -------------------------- | ---------------------- | ------------- | ----------- |
| UserAccount                | Role                       | has                    | `1` to `1`    | Association |
| UserAccount                | StudentProfile             | owns                   | `1` to `0..1` | Association |
| UserAccount                | CounselorProfile           | owns                   | `1` to `0..1` | Association |
| UserAccount                | AdmissionsOfficerProfile   | owns                   | `1` to `0..1` | Association |
| StudentProfile             | IdentityInformation        | composed of            | `1` to `1`    | Composition |
| StudentProfile             | AcademicRecord             | composed of            | `1` to `1..*` | Composition |
| AcademicRecord             | GradingScale               | uses                   | `1` to `1`    | Association |
| StudentProfile             | AcademicInterest           | has                    | `1` to `1..3` | Association |
| StudentProfile             | NarrativeResponse          | contains               | `1` to `0..*` | Composition |
| StudentProfile             | ProfileItem                | contains               | `1` to `0..*` | Composition |
| StudentProfile             | ProfileVisibilitySettings  | has                    | `1` to `1`    | Composition |
| StudentProfile             | ConsentSettings            | has                    | `1` to `1`    | Composition |
| StudentProfile             | VerificationTier           | has                    | `1` to `1`    | Association |
| StudentProfile             | HighSchool                 | linked to              | `0..*` to `1` | Association |
| HighSchool                 | CounselorProfile           | has                    | `1` to `0..*` | Association |
| CounselorProfile           | VerificationQueueItem      | reviewed through       | `1` to `1`    | Association |
| VerificationQueueItem      | VerificationDecision       | resolved by            | `1` to `0..1` | Association |
| CounselorInvitation        | CounselorProfile           | creates                | `1` to `0..1` | Dependency  |
| StudentProfile             | TranscriptSupportRequest   | creates                | `1` to `0..*` | Association |
| TranscriptSupportRequest   | CounselorProfile           | assigned to            | `0..*` to `1` | Association |
| TranscriptSupportRequest   | Transcript                 | may produce            | `1` to `0..1` | Association |
| Transcript                 | UploadedFile               | represented by         | `1` to `1`    | Composition |
| StudentProfile             | AIConsentRecord            | may create             | `1` to `0..*` | Association |
| StudentProfile             | AIContextualizationRequest | creates                | `1` to `0..*` | Association |
| AIContextualizationRequest | NarrativeResponse          | uses                   | `1` to `1..*` | Association |
| AIContextualizationRequest | AIContextualizationOutput  | produces               | `1` to `0..1` | Association |
| AIContextualizationOutput  | StudentAIReviewDecision    | reviewed by            | `1` to `0..1` | Association |
| AIContextualizationOutput  | HumanReviewDecision        | reviewed by            | `1` to `0..1` | Association |
| UniversityAccount          | AdmissionsOfficerProfile   | has                    | `1` to `0..*` | Association |
| AdmissionsOfficerProfile   | StudentDiscoverySearch     | performs               | `1` to `0..*` | Association |
| StudentDiscoverySearch     | SearchFilter               | uses                   | `1` to `0..*` | Composition |
| AdmissionsOfficerProfile   | Shortlist                  | owns                   | `1` to `0..*` | Composition |
| Shortlist                  | ShortlistEntry             | contains               | `1` to `0..*` | Composition |
| ShortlistEntry             | StudentProfile             | references             | `0..*` to `1` | Association |
| AccessPolicy               | UserAccount                | evaluates              | `1` to `0..*` | Dependency  |
| AccessPolicy               | StudentProfile             | authorizes access to   | `1` to `0..*` | Dependency  |
| RowLevelSecurityPolicy     | StudentProfile             | enforces access for    | `1` to `0..*` | Dependency  |
| AIOutputPolicy             | AIContextualizationOutput  | controls visibility of | `1` to `0..*` | Dependency  |
| FileValidationRule         | UploadedFile               | validates              | `1` to `0..*` | Dependency  |
| AuditLogEntry              | UserAccount                | records action by      | `0..*` to `1` | Association |

---

# 13. Relationships To Avoid

Do not generate these relationships unless the user explicitly requests them.

| Avoided Relationship                                                   | Reason                                                                                                |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| StudentProfile directly owns UserAccount                               | UserAccount owns or links to StudentProfile, not the other way around.                                |
| AdmissionsOfficerProfile directly modifies StudentProfile              | Admissions officers can view, shortlist, or express interest, but should not modify student profiles. |
| CounselorProfile directly modifies StudentProfile without AccessPolicy | Counselor support must pass verification and school-match checks.                                     |
| AIService directly writes to AdmissionsProfileView                     | AI output must go through RecruitBook, student review, human review, and AIOutputPolicy.              |
| Transcript directly visible to AdmissionsOfficerProfile by default     | Transcript access should be controlled and may be abstracted as verification tier/support evidence.   |
| Shortlist notifies StudentProfile by default                           | The use case says shortlist is private and does not notify the student.                               |
| SearchIndex contains hidden profiles                                   | Search should only include profiles allowed by publication, visibility, and consent rules.            |
| AIContextualizationOutput replaces NarrativeResponse                   | Original student writing must remain separate and unchanged.                                          |
| RowLevelSecurityPolicy replaces AccessPolicy entirely                  | RLS supports database-level enforcement, but application-level AccessPolicy is still modeled.         |

---

# 14. Relationship Rules for Security-Sensitive Diagrams

When generating security-focused diagrams, preserve these relationship rules.

1. `AccessPolicy` must mediate admissions access to `StudentProfile` and `AdmissionsProfileView`.
2. `RowLevelSecurityPolicy` must enforce visibility and consent at the database level.
3. `AIOutputPolicy` must prevent `AIContextualizationOutput` from appearing in `AdmissionsProfileView` until student and human approvals exist.
4. `FileValidationRule` must validate `UploadedFile` before storage in `ObjectStorage`.
5. `CounselorProfile` may support `StudentProfile` only when both are linked to the same `HighSchool`.
6. `TranscriptSupportRequest` should create or update `VerificationTier` only after authorization and review.
7. `AuditLogEntry` should record counselor verification, transcript upload/support, AI review, and denied access attempts.
8. `ProfileVisibilitySettings` and `ConsentSettings` must be checked before search results and before opening old saved profile links.
9. `StudentDiscoverySearch` must not return hidden, unpublished, or consent-restricted profiles.
10. `AIContextualizationOutput` must never replace `NarrativeResponse`.

---

# 15. PlantUML Relationship Examples

Use these examples as a style guide when generating class diagrams.

```plantuml
UserAccount "1" --> "1" Role : has
UserAccount "1" --> "0..1" StudentProfile : owns
StudentProfile "1" *-- "1" IdentityInformation : composed of
StudentProfile "1" *-- "1..*" AcademicRecord : composed of
AcademicRecord "1" --> "1" GradingScale : uses
StudentProfile "0..*" --> "1" HighSchool : linked to
HighSchool "1" --> "0..*" CounselorProfile : has
CounselorProfile "1" --> "1" HighSchool : bound to

StudentProfile "1" --> "0..*" AIContextualizationRequest : creates
AIContextualizationRequest "1" --> "1..*" NarrativeResponse : uses
AIContextualizationRequest "1" --> "0..1" AIContextualizationOutput : produces
AIContextualizationOutput "1" --> "0..1" StudentAIReviewDecision : reviewed by
AIContextualizationOutput "1" --> "0..1" HumanReviewDecision : reviewed by
AIOutputPolicy "1" ..> "0..*" AIContextualizationOutput : controls visibility of

AdmissionsOfficerProfile "1" --> "0..*" StudentDiscoverySearch : performs
StudentDiscoverySearch "1" *-- "0..*" SearchFilter : uses
AdmissionsOfficerProfile "1" *-- "0..*" Shortlist : owns
Shortlist "1" *-- "0..*" ShortlistEntry : contains
ShortlistEntry "0..*" --> "1" StudentProfile : references

AccessPolicy "1" ..> "0..*" StudentProfile : authorizes access to
RowLevelSecurityPolicy "1" ..> "0..*" StudentProfile : enforces access for
FileValidationRule "1" ..> "0..*" UploadedFile : validates
AuditLogEntry "0..*" --> "1" UserAccount : records action by
```

---

# 16. Relationship Catalog Maintenance Rules

When the object catalog changes:

1. Check whether the new object needs relationships.
2. Add only relationships needed for diagrams or implementation clarity.
3. Avoid adding relationships that only restate obvious UI flow.
4. Keep relationship labels short and consistent.
5. Update the “Recommended Class Diagram Relationships” section if the relationship should appear in the main class diagram.
6. Update “Relationships To Avoid” if the new object creates a security-sensitive edge case.
