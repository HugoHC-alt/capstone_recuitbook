# RecruitBook Diagram Rules

## Required Diagrams

1. System Context Diagram
2. Use Case Diagram
3. Misuse Case Diagram
4. Secure Domain Class Diagram
5. Student Profile Activity Diagram
6. Counselor Verification Sequence Diagram
7. Transcript Support Activity Diagram
8. AI Contextualization State Machine
9. AI Contextualization Sequence Diagram
10. Admissions Search Sequence Diagram
11. Student Profile State Machine
12. Trust Boundary / Data Flow Diagram
13. Component / Deployment Diagram

## Diagram Generation Rules

- Generate one diagram at a time.
- Use only the objects required for that diagram.
- Do not include every object in every diagram.
- Do not create a giant class diagram with every attribute and method unless asked.
- Use comments or notes to show security constraints.
- Make diagrams useful for AI development context, not just visual decoration.

## Key Security Rules

- AI output cannot be visible to admissions officers until accepted by student and approved by counselor/admin.
- Student original writing must remain separate from AI output.
- Admissions officers can only view published profiles with visibility and consent enabled.
- Counselors can only support students linked to the counselor’s high school.
- Unverified counselors cannot access student rosters.
- Transcript uploads must validate file type and size.
- Audit logs must record verification, upload, AI review, and access denial events.