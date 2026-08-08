# Batch 1 Auth Schema Notes

Generated from:
- `diagrams/slices/batch-1-authentication/07_auth_domain_subset.puml`
- `diagrams/slices/batch-1-authentication/05_auth_state_machine.puml`
- `diagrams/slices/batch-1-authentication/04_auth_sequence.puml`
- `diagrams/slices/batch-1-authentication/06_auth_system_context.puml`
- `diagrams/slices/batch-1-authentication/README.md`

Schema created:
- `application_users`
- `approval_decisions`
- `audit_log_entries`
- `protected_route_policies`

Core rule:
Supabase Auth handles credentials and sessions. RecruitBook handles authorization through `application_users.role` and `application_users.account_status`.

Public registration allowed roles:
- `student`
- `counselor`
- `admissions_officer`

Public registration forbidden roles:
- `platform_admin`

Stored account statuses:
- `email_unverified`
- `active`
- `pending_approval`
- `verified`
- `suspended`

`unauthorized` is not a stored account status. It is a route/access result.

Platform administrator accounts must be manually seeded or assigned outside public registration.