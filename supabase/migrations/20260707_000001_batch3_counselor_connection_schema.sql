
create type public.counselor_link_status as enum (
  'pending',
  'accepted',
  'declined',
  'revoked'
);

create table public.counselor_student_links (
  id                            uuid primary key default gen_random_uuid(),
  student_application_user_id   uuid not null
                                  references public.application_users (id) on delete cascade,
  counselor_email               text not null,
  counselor_application_user_id uuid
                                  references public.application_users (id) on delete cascade,
  status                        public.counselor_link_status not null default 'pending',
  requested_at                  timestamptz not null default now(),
  responded_at                  timestamptz,
  revoked_at                    timestamptz,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now(),

  constraint counselor_student_links_email_canonical_check
    check (counselor_email = lower(btrim(counselor_email))),
  constraint counselor_student_links_email_length_check
    check (char_length(counselor_email) <= 255),

  constraint counselor_student_links_status_consistency_check
    check (
      (status = 'pending'
        and counselor_application_user_id is null
        and responded_at is null
        and revoked_at is null)
      or (status = 'accepted'
        and counselor_application_user_id is not null
        and responded_at is not null
        and revoked_at is null)
      or (status = 'declined'
        and counselor_application_user_id is not null
        and responded_at is not null
        and revoked_at is null)
      or (status = 'revoked'
        and revoked_at is not null
        and (
          (counselor_application_user_id is null and responded_at is null)
          or (counselor_application_user_id is not null and responded_at is not null)
        ))
    ),

  constraint counselor_student_links_timestamp_order_check
    check (
      (responded_at is null or responded_at >= requested_at)
      and (revoked_at is null or revoked_at >= requested_at)
    )
);

comment on table public.counselor_student_links is
  'Student-consented, per-student counselor link (email-addressed, late binding). The sole basis for accepted-link-gated, SELECT-only counselor access to Batch 2 profile data. Zero service-role.';
comment on column public.counselor_student_links.student_application_user_id is
  'The requesting student. Server-derived at insert (current_application_user_id()); never client-supplied.';
comment on column public.counselor_student_links.counselor_email is
  'Normalized (lower(btrim(...))) counselor address. Late binding: no counselor lookup at insert (no existence oracle).';
comment on column public.counselor_student_links.counselor_application_user_id is
  'NULL until a verified counselor responds; bound to that counselor on BOTH accept and decline. Only accepted grants visibility.';

create index counselor_student_links_student_idx
  on public.counselor_student_links (student_application_user_id);
create index counselor_student_links_counselor_idx
  on public.counselor_student_links (counselor_application_user_id);

create unique index counselor_student_links_active_unique_idx
  on public.counselor_student_links (student_application_user_id, counselor_email)
  where status in ('pending', 'accepted');

create index counselor_student_links_pending_email_idx
  on public.counselor_student_links (counselor_email)
  where status = 'pending';

create trigger counselor_student_links_set_updated_at
  before update on public.counselor_student_links
  for each row
  execute function public.set_updated_at();

create or replace function public.is_verified_counselor()
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
      and au.role = 'counselor'
      and au.account_status = 'verified'
  );
$$;

comment on function public.is_verified_counselor() is
  'True when the current Supabase user is a counselor with account_status = verified. SECURITY DEFINER to avoid recursive RLS; never trusts client-supplied role/status.';

revoke all on function public.is_verified_counselor() from public;
grant execute on function public.is_verified_counselor() to authenticated;

create or replace function public.current_user_normalized_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lower(btrim(au.email))
  from public.application_users au
  where au.auth_user_id = auth.uid();
$$;

comment on function public.current_user_normalized_email() is
  'Returns the caller''s own application_users.email normalized (lower+btrim) to match counselor_email at rest, or NULL. SECURITY DEFINER to avoid recursive RLS on application_users.';

revoke all on function public.current_user_normalized_email() from public;
grant execute on function public.current_user_normalized_email() to authenticated;

create or replace function public.is_linked_counselor_for_profile(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_verified_counselor()
    and exists (
      select 1
      from public.counselor_student_links csl
      join public.student_profiles sp
        on sp.application_user_id = csl.student_application_user_id
      where sp.id = profile_id
        and csl.status = 'accepted'
        and csl.counselor_application_user_id = public.current_application_user_id()
    );
$$;

comment on function public.is_linked_counselor_for_profile(uuid) is
  'True when the current user is a verified counselor holding an accepted CounselorStudentLink to the owner of the given student_profiles.id. Tests status=accepted at query time so revocation is immediate. SECURITY DEFINER; form-supplied IDs are lookup keys only.';

revoke all on function public.is_linked_counselor_for_profile(uuid) from public;
grant execute on function public.is_linked_counselor_for_profile(uuid) to authenticated;

alter table public.counselor_student_links enable row level security;

create policy counselor_student_links_select_own_student
  on public.counselor_student_links
  for select
  to authenticated
  using (student_application_user_id = public.current_application_user_id());

create policy counselor_student_links_select_counselor
  on public.counselor_student_links
  for select
  to authenticated
  using (
    public.is_verified_counselor()
    and (
      counselor_email = public.current_user_normalized_email()
      or counselor_application_user_id = public.current_application_user_id()
    )
  );

create policy counselor_student_links_select_admin
  on public.counselor_student_links
  for select
  to authenticated
  using (public.is_platform_admin());

create policy counselor_student_links_insert_student
  on public.counselor_student_links
  for insert
  to authenticated
  with check (
    student_application_user_id = public.current_application_user_id()
    and public.is_active_student()
    and status = 'pending'
    and counselor_application_user_id is null
    and responded_at is null
    and revoked_at is null
  );

create policy counselor_student_links_update_revoke_student
  on public.counselor_student_links
  for update
  to authenticated
  using (
    student_application_user_id = public.current_application_user_id()
    and public.is_active_student()
    and status in ('pending', 'accepted')
  )
  with check (
    student_application_user_id = public.current_application_user_id()
    and public.is_active_student()
    and status = 'revoked'
    and revoked_at is not null
  );

create policy counselor_student_links_update_respond_counselor
  on public.counselor_student_links
  for update
  to authenticated
  using (
    public.is_verified_counselor()
    and status = 'pending'
    and counselor_email = public.current_user_normalized_email()
  )
  with check (
    public.is_verified_counselor()
    and counselor_email = public.current_user_normalized_email()
    and status in ('accepted', 'declined')
    and counselor_application_user_id = public.current_application_user_id()
    and responded_at is not null
    and revoked_at is null
  );

revoke update on public.counselor_student_links from authenticated;
grant update (status, counselor_application_user_id, responded_at, revoked_at)
  on public.counselor_student_links to authenticated;

create policy student_profiles_select_linked_counselor
  on public.student_profiles
  for select
  to authenticated
  using (public.is_linked_counselor_for_profile(id));

create policy academic_backgrounds_select_linked_counselor
  on public.academic_backgrounds
  for select
  to authenticated
  using (public.is_linked_counselor_for_profile(student_profile_id));

create policy profile_activities_select_linked_counselor
  on public.profile_activities
  for select
  to authenticated
  using (public.is_linked_counselor_for_profile(student_profile_id));

create policy profile_achievements_select_linked_counselor
  on public.profile_achievements
  for select
  to authenticated
  using (public.is_linked_counselor_for_profile(student_profile_id));
