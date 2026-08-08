
create extension if not exists pgcrypto;

create type public.user_role as enum (
  'student',
  'counselor',
  'admissions_officer',
  'platform_admin'
);

create type public.account_status as enum (
  'email_unverified',
  'active',
  'pending_approval',
  'verified',
  'suspended'
);

create type public.approval_decision_type as enum (
  'approved',
  'denied'
);

create type public.audit_action as enum (
  'user_registered',
  'email_verified',
  'login_succeeded',
  'login_failed',
  'password_reset_requested',
  'password_reset_completed',
  'counselor_approved',
  'admissions_officer_approved',
  'user_suspended',
  'unauthorized_access_denied'
);

create table public.application_users (
  id               uuid primary key default gen_random_uuid(),
  auth_user_id     uuid not null unique
                     references auth.users (id) on delete cascade,
  email            text not null,
  full_name        text,
  role             public.user_role not null,
  account_status   public.account_status not null default 'email_unverified',
  last_login_at    timestamptz,
  suspended_at     timestamptz,
  suspended_reason text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.application_users is
  'RecruitBook application identity profile; source of truth for role and account_status.';
comment on column public.application_users.email is
  'Application copy/display field. Supabase Auth (auth.users) remains the credential authority.';

create table public.approval_decisions (
  id                  uuid primary key default gen_random_uuid(),
  target_user_id      uuid not null
                        references public.application_users (id) on delete cascade,
  decided_by_admin_id uuid not null
                        references public.application_users (id) on delete restrict,
  target_role         public.user_role not null,
  decision            public.approval_decision_type not null,
  note                text,
  decided_at          timestamptz not null default now(),
  constraint approval_decisions_target_role_check
    check (target_role in ('counselor', 'admissions_officer'))
);

comment on table public.approval_decisions is
  'Admin approval/denial records for counselor and admissions officer accounts only.';

create table public.audit_log_entries (
  id             uuid primary key default gen_random_uuid(),
  actor_user_id  uuid references public.application_users (id) on delete set null,
  target_user_id uuid references public.application_users (id) on delete set null,
  action         public.audit_action not null,
  outcome        text not null,
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

comment on table public.audit_log_entries is
  'Audit records for sensitive account actions (approval, suspension, unauthorized access denial, etc.).';

create table public.protected_route_policies (
  id              uuid primary key default gen_random_uuid(),
  route_pattern   text not null unique,
  required_role   public.user_role not null,
  required_status public.account_status not null,
  fallback_route  text not null default '/unauthorized',
  created_at      timestamptz not null default now()
);

comment on table public.protected_route_policies is
  'Required (role, account_status) per protected route; fallback_route used when unauthorized.';

create unique index application_users_auth_user_id_idx
  on public.application_users (auth_user_id);
create index application_users_role_idx
  on public.application_users (role);
create index application_users_account_status_idx
  on public.application_users (account_status);

create index approval_decisions_target_user_id_idx
  on public.approval_decisions (target_user_id);
create index approval_decisions_decided_by_admin_id_idx
  on public.approval_decisions (decided_by_admin_id);

create index audit_log_entries_actor_user_id_idx
  on public.audit_log_entries (actor_user_id);
create index audit_log_entries_target_user_id_idx
  on public.audit_log_entries (target_user_id);
create index audit_log_entries_action_idx
  on public.audit_log_entries (action);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger application_users_set_updated_at
  before update on public.application_users
  for each row
  execute function public.set_updated_at();

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.application_users au
    where au.auth_user_id = auth.uid()
      and au.role = 'platform_admin'
      and au.account_status = 'active'
  );
$$;

comment on function public.is_platform_admin() is
  'True when the current Supabase user is an active platform_admin. SECURITY DEFINER to avoid recursive RLS on application_users.';

revoke all on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to authenticated;

alter table public.application_users      enable row level security;
alter table public.approval_decisions     enable row level security;
alter table public.audit_log_entries      enable row level security;
alter table public.protected_route_policies enable row level security;

create policy application_users_select_own
  on public.application_users
  for select
  to authenticated
  using (auth_user_id = auth.uid());

create policy application_users_select_admin
  on public.application_users
  for select
  to authenticated
  using (public.is_platform_admin());

create policy application_users_insert_self
  on public.application_users
  for insert
  to authenticated
  with check (
    auth_user_id = auth.uid()
    and role in ('student', 'counselor', 'admissions_officer')
    and account_status = 'email_unverified'
  );

create policy application_users_update_admin
  on public.application_users
  for update
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy approval_decisions_insert_admin
  on public.approval_decisions
  for insert
  to authenticated
  with check (public.is_platform_admin());

create policy approval_decisions_select_admin
  on public.approval_decisions
  for select
  to authenticated
  using (public.is_platform_admin());

create policy audit_log_entries_select_admin
  on public.audit_log_entries
  for select
  to authenticated
  using (public.is_platform_admin());

create policy protected_route_policies_select_authenticated
  on public.protected_route_policies
  for select
  to authenticated
  using (true);

insert into public.protected_route_policies
  (route_pattern, required_role, required_status)
values
  ('/student/dashboard',     'student',            'active'),
  ('/counselor/pending',     'counselor',          'pending_approval'),
  ('/counselor/dashboard',   'counselor',          'verified'),
  ('/admissions/pending',    'admissions_officer', 'pending_approval'),
  ('/admissions/dashboard',  'admissions_officer', 'verified'),
  ('/admin/dashboard',       'platform_admin',     'active')
on conflict (route_pattern) do nothing;
