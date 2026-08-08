

create table public.student_profiles (
  id                           uuid primary key default gen_random_uuid(),
  application_user_id          uuid not null unique
                                 references public.application_users (id) on delete cascade,
  preferred_name               text,
  country                      text,
  city_region                  text,
  intended_major               text,
  narrative_background         text,
  narrative_goals              text,
  narrative_activities_summary text,
  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now(),
  constraint student_profiles_preferred_name_check
    check (preferred_name is null or char_length(preferred_name) <= 100),
  constraint student_profiles_country_check
    check (country is null or char_length(country) <= 100),
  constraint student_profiles_city_region_check
    check (city_region is null or char_length(city_region) <= 100),
  constraint student_profiles_intended_major_check
    check (intended_major is null or char_length(intended_major) <= 100),
  constraint student_profiles_narrative_background_check
    check (narrative_background is null or char_length(narrative_background) <= 2000),
  constraint student_profiles_narrative_goals_check
    check (narrative_goals is null or char_length(narrative_goals) <= 2000),
  constraint student_profiles_narrative_activities_summary_check
    check (narrative_activities_summary is null or char_length(narrative_activities_summary) <= 2000)
);

comment on table public.student_profiles is
  'Student-owned profile aggregate root; 1:1 with a student application_users row. Completion is derived in the app layer, never stored.';

create table public.academic_backgrounds (
  id                 uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null
                       references public.student_profiles (id) on delete cascade,
  school_name        text not null,
  country            text,
  curriculum         text,
  graduation_year    int,
  academic_summary   text,
  position           int not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint academic_backgrounds_school_name_check
    check (char_length(school_name) <= 200),
  constraint academic_backgrounds_country_check
    check (country is null or char_length(country) <= 100),
  constraint academic_backgrounds_curriculum_check
    check (curriculum is null or char_length(curriculum) <= 100),
  constraint academic_backgrounds_academic_summary_check
    check (academic_summary is null or char_length(academic_summary) <= 1000),
  constraint academic_backgrounds_graduation_year_check
    check (graduation_year is null or (graduation_year between 1900 and 2100)),
  constraint academic_backgrounds_position_check
    check (position >= 0)
);

comment on table public.academic_backgrounds is
  'Student-owned academic history rows; ownership resolves through student_profile_id.';

create table public.profile_activities (
  id                 uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null
                       references public.student_profiles (id) on delete cascade,
  title              text not null,
  organization       text,
  description        text,
  start_year         int,
  end_year           int,
  position           int not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint profile_activities_title_check
    check (char_length(title) <= 200),
  constraint profile_activities_organization_check
    check (organization is null or char_length(organization) <= 200),
  constraint profile_activities_description_check
    check (description is null or char_length(description) <= 1000),
  constraint profile_activities_start_year_check
    check (start_year is null or (start_year between 1900 and 2100)),
  constraint profile_activities_end_year_check
    check (end_year is null or (end_year between 1900 and 2100)),
  constraint profile_activities_year_order_check
    check (start_year is null or end_year is null or end_year >= start_year),
  constraint profile_activities_position_check
    check (position >= 0)
);

comment on table public.profile_activities is
  'Student-owned activity rows; ownership resolves through student_profile_id.';

create table public.profile_achievements (
  id                 uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null
                       references public.student_profiles (id) on delete cascade,
  title              text not null,
  issuer             text,
  description        text,
  received_year      int,
  position           int not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint profile_achievements_title_check
    check (char_length(title) <= 200),
  constraint profile_achievements_issuer_check
    check (issuer is null or char_length(issuer) <= 200),
  constraint profile_achievements_description_check
    check (description is null or char_length(description) <= 1000),
  constraint profile_achievements_received_year_check
    check (received_year is null or (received_year between 1900 and 2100)),
  constraint profile_achievements_position_check
    check (position >= 0)
);

comment on table public.profile_achievements is
  'Student-owned achievement rows; ownership resolves through student_profile_id.';

create index academic_backgrounds_student_profile_id_idx
  on public.academic_backgrounds (student_profile_id);
create index profile_activities_student_profile_id_idx
  on public.profile_activities (student_profile_id);
create index profile_achievements_student_profile_id_idx
  on public.profile_achievements (student_profile_id);

create trigger student_profiles_set_updated_at
  before update on public.student_profiles
  for each row
  execute function public.set_updated_at();

create trigger academic_backgrounds_set_updated_at
  before update on public.academic_backgrounds
  for each row
  execute function public.set_updated_at();

create trigger profile_activities_set_updated_at
  before update on public.profile_activities
  for each row
  execute function public.set_updated_at();

create trigger profile_achievements_set_updated_at
  before update on public.profile_achievements
  for each row
  execute function public.set_updated_at();

create or replace function public.current_application_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select au.id
  from public.application_users au
  where au.auth_user_id = auth.uid();
$$;

comment on function public.current_application_user_id() is
  'Returns the caller''s own application_users.id (from auth.uid()), or NULL. SECURITY DEFINER to avoid recursive RLS on application_users.';

revoke all on function public.current_application_user_id() from public;
grant execute on function public.current_application_user_id() to authenticated;

create or replace function public.is_active_student()
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
      and au.role = 'student'
      and au.account_status = 'active'
  );
$$;

comment on function public.is_active_student() is
  'True when the current Supabase user is a student with account_status = active. SECURITY DEFINER to avoid recursive RLS; never trusts client-supplied role/status.';

revoke all on function public.is_active_student() from public;
grant execute on function public.is_active_student() to authenticated;

create or replace function public.is_profile_owner(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.student_profiles sp
    join public.application_users au on au.id = sp.application_user_id
    where sp.id = profile_id
      and au.auth_user_id = auth.uid()
  );
$$;

comment on function public.is_profile_owner(uuid) is
  'True when the given student_profiles.id is owned by the current Supabase user (auth.uid() -> application_users -> student_profiles). SECURITY DEFINER to avoid recursive RLS; form-supplied IDs are lookup keys only.';

revoke all on function public.is_profile_owner(uuid) from public;
grant execute on function public.is_profile_owner(uuid) to authenticated;

alter table public.student_profiles     enable row level security;
alter table public.academic_backgrounds enable row level security;
alter table public.profile_activities   enable row level security;
alter table public.profile_achievements enable row level security;

create policy student_profiles_select_own
  on public.student_profiles
  for select
  to authenticated
  using (public.is_profile_owner(id));

create policy student_profiles_select_admin
  on public.student_profiles
  for select
  to authenticated
  using (public.is_platform_admin());

create policy student_profiles_insert_own
  on public.student_profiles
  for insert
  to authenticated
  with check (
    application_user_id = public.current_application_user_id()
    and public.is_active_student()
  );

create policy student_profiles_update_own
  on public.student_profiles
  for update
  to authenticated
  using (public.is_profile_owner(id) and public.is_active_student())
  with check (public.is_profile_owner(id) and public.is_active_student());

create policy student_profiles_delete_own
  on public.student_profiles
  for delete
  to authenticated
  using (public.is_profile_owner(id) and public.is_active_student());

create policy academic_backgrounds_select_own
  on public.academic_backgrounds
  for select
  to authenticated
  using (public.is_profile_owner(student_profile_id));

create policy academic_backgrounds_select_admin
  on public.academic_backgrounds
  for select
  to authenticated
  using (public.is_platform_admin());

create policy academic_backgrounds_insert_own
  on public.academic_backgrounds
  for insert
  to authenticated
  with check (public.is_profile_owner(student_profile_id) and public.is_active_student());

create policy academic_backgrounds_update_own
  on public.academic_backgrounds
  for update
  to authenticated
  using (public.is_profile_owner(student_profile_id) and public.is_active_student())
  with check (public.is_profile_owner(student_profile_id) and public.is_active_student());

create policy academic_backgrounds_delete_own
  on public.academic_backgrounds
  for delete
  to authenticated
  using (public.is_profile_owner(student_profile_id) and public.is_active_student());

create policy profile_activities_select_own
  on public.profile_activities
  for select
  to authenticated
  using (public.is_profile_owner(student_profile_id));

create policy profile_activities_select_admin
  on public.profile_activities
  for select
  to authenticated
  using (public.is_platform_admin());

create policy profile_activities_insert_own
  on public.profile_activities
  for insert
  to authenticated
  with check (public.is_profile_owner(student_profile_id) and public.is_active_student());

create policy profile_activities_update_own
  on public.profile_activities
  for update
  to authenticated
  using (public.is_profile_owner(student_profile_id) and public.is_active_student())
  with check (public.is_profile_owner(student_profile_id) and public.is_active_student());

create policy profile_activities_delete_own
  on public.profile_activities
  for delete
  to authenticated
  using (public.is_profile_owner(student_profile_id) and public.is_active_student());

create policy profile_achievements_select_own
  on public.profile_achievements
  for select
  to authenticated
  using (public.is_profile_owner(student_profile_id));

create policy profile_achievements_select_admin
  on public.profile_achievements
  for select
  to authenticated
  using (public.is_platform_admin());

create policy profile_achievements_insert_own
  on public.profile_achievements
  for insert
  to authenticated
  with check (public.is_profile_owner(student_profile_id) and public.is_active_student());

create policy profile_achievements_update_own
  on public.profile_achievements
  for update
  to authenticated
  using (public.is_profile_owner(student_profile_id) and public.is_active_student())
  with check (public.is_profile_owner(student_profile_id) and public.is_active_student());

create policy profile_achievements_delete_own
  on public.profile_achievements
  for delete
  to authenticated
  using (public.is_profile_owner(student_profile_id) and public.is_active_student());
