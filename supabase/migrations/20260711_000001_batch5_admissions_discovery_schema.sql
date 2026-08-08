
create table public.profile_visibility_settings (
  id                 uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null unique
                       references public.student_profiles (id) on delete cascade,
  is_published       boolean not null default false,
  admissions_consent boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table public.profile_visibility_settings is
  'Student-owned admissions visibility for a profile; 1:1 with student_profiles. Two independent booleans (is_published, admissions_consent), both default false. Effective visibility = both flags true AND owner is an active student, evaluated AT QUERY TIME by is_admissions_visible_profile() — never stored/derived/cached. A missing row is not visible. Zero service-role.';
comment on column public.profile_visibility_settings.student_profile_id is
  'The owned profile (1:1, UNIQUE). Server-derived at insert (is_profile_owner); never client-supplied as authorization proof. Immutable after insert (excluded from the UPDATE grant, section 5).';
comment on column public.profile_visibility_settings.is_published is
  'Student-controlled. Half of the strict-AND admissions visibility gate. Flipping to false removes visibility immediately (query-time).';
comment on column public.profile_visibility_settings.admissions_consent is
  'Student-controlled. Half of the strict-AND admissions visibility gate. Flipping to false removes visibility immediately (query-time).';

create trigger profile_visibility_settings_set_updated_at
  before update on public.profile_visibility_settings
  for each row
  execute function public.set_updated_at();

create or replace function public.is_verified_admissions_officer()
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
      and au.role = 'admissions_officer'
      and au.account_status = 'verified'
  );
$$;

comment on function public.is_verified_admissions_officer() is
  'True when the current Supabase user is an admissions_officer with account_status = verified. SECURITY DEFINER to avoid recursive RLS; never trusts client-supplied role/status. Sole role gate for admissions read access.';

revoke all on function public.is_verified_admissions_officer() from public;
grant execute on function public.is_verified_admissions_officer() to authenticated;

create or replace function public.is_admissions_visible_profile(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_verified_admissions_officer()
    and exists (
      select 1
      from public.profile_visibility_settings pvs
      join public.student_profiles sp
        on sp.id = pvs.student_profile_id
      join public.application_users au
        on au.id = sp.application_user_id
      where pvs.student_profile_id = profile_id
        and pvs.is_published = true
        and pvs.admissions_consent = true
        and au.role = 'student'
        and au.account_status = 'active'
    );
$$;

comment on function public.is_admissions_visible_profile(uuid) is
  'True when the current user is a verified admissions officer AND the given student_profiles.id has a settings row with is_published AND admissions_consent both true AND the owner is an active student — all tested AT QUERY TIME (R1). Missing settings row / either false flag / owner suspended => false immediately (no stored/derived visibility). SECURITY DEFINER; form-supplied IDs are lookup keys only.';

revoke all on function public.is_admissions_visible_profile(uuid) from public;
grant execute on function public.is_admissions_visible_profile(uuid) to authenticated;

alter table public.profile_visibility_settings enable row level security;

create policy profile_visibility_settings_select_own
  on public.profile_visibility_settings
  for select
  to authenticated
  using (public.is_profile_owner(student_profile_id));

create policy profile_visibility_settings_select_admin
  on public.profile_visibility_settings
  for select
  to authenticated
  using (public.is_platform_admin());

create policy profile_visibility_settings_insert_own
  on public.profile_visibility_settings
  for insert
  to authenticated
  with check (
    public.is_profile_owner(student_profile_id)
    and public.is_active_student()
  );

create policy profile_visibility_settings_update_own
  on public.profile_visibility_settings
  for update
  to authenticated
  using (public.is_profile_owner(student_profile_id) and public.is_active_student())
  with check (public.is_profile_owner(student_profile_id) and public.is_active_student());

revoke update on public.profile_visibility_settings from authenticated;
grant update (is_published, admissions_consent)
  on public.profile_visibility_settings to authenticated;

create policy student_profiles_select_visible_admissions
  on public.student_profiles
  for select
  to authenticated
  using (public.is_admissions_visible_profile(id));

create policy academic_backgrounds_select_visible_admissions
  on public.academic_backgrounds
  for select
  to authenticated
  using (public.is_admissions_visible_profile(student_profile_id));

create policy profile_activities_select_visible_admissions
  on public.profile_activities
  for select
  to authenticated
  using (public.is_admissions_visible_profile(student_profile_id));

create policy profile_achievements_select_visible_admissions
  on public.profile_achievements
  for select
  to authenticated
  using (public.is_admissions_visible_profile(student_profile_id));
