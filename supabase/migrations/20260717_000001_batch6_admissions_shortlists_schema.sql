
create table public.admissions_shortlist_entries (
  id                                      uuid primary key default gen_random_uuid(),
  admissions_officer_application_user_id uuid not null
                                            references public.application_users (id) on delete cascade,
  student_profile_id                     uuid not null
                                            references public.student_profiles (id) on delete cascade,
  created_at                             timestamptz not null default now(),
  unique (admissions_officer_application_user_id, student_profile_id)
);

comment on table public.admissions_shortlist_entries is
  'A verified admissions officer''s bare saved-profile reference — one implicit (unnamed) shortlist per officer, not the catalog''s named/multiple Shortlist model. No student content is denormalized; every read re-gates on live effective visibility via is_admissions_visible_profile(). Immutable except for owner hard-delete: no updated_at, no UPDATE policy for any role, table-wide UPDATE privilege revoked. Admin SELECT is deliberately unconditional and therefore includes stale/hidden-profile entries. Zero service-role.';
comment on column public.admissions_shortlist_entries.admissions_officer_application_user_id is
  'The owning officer. Server-derived at insert (current_application_user_id()); never client-supplied as authorization proof. Immutable — no UPDATE policy exists for this or any column.';
comment on column public.admissions_shortlist_entries.student_profile_id is
  'A bare lookup key to the saved student_profiles row; no denormalized student content. Visibility is re-evaluated at read time by is_admissions_visible_profile(), never cached.';

alter table public.admissions_shortlist_entries enable row level security;

create policy admissions_shortlist_entries_select_own_visible
  on public.admissions_shortlist_entries
  for select
  to authenticated
  using (
    admissions_officer_application_user_id = public.current_application_user_id()
    and public.is_admissions_visible_profile(student_profile_id)
  );

create policy admissions_shortlist_entries_select_admin
  on public.admissions_shortlist_entries
  for select
  to authenticated
  using (public.is_platform_admin());

create policy admissions_shortlist_entries_insert_own
  on public.admissions_shortlist_entries
  for insert
  to authenticated
  with check (
    admissions_officer_application_user_id = public.current_application_user_id()
    and public.is_verified_admissions_officer()
    and public.is_admissions_visible_profile(student_profile_id)
  );

create or replace function public.remove_own_admissions_shortlist_entry(entry_id uuid)
returns void
language sql
volatile
strict
security definer
set search_path = public
as $$
  delete from public.admissions_shortlist_entries
  where id = entry_id
    and admissions_officer_application_user_id = public.current_application_user_id()
    and public.is_verified_admissions_officer();
$$;

comment on function public.remove_own_admissions_shortlist_entry(uuid) is
  'Removes the calling verified admissions officer''s OWN shortlist entry by id. SECURITY DEFINER (bypasses the table''s RLS) so removal is not blocked by the visibility-gated SELECT policy — a stale/hidden owned entry stays removable. Ownership is derived server-side (current_application_user_id()); never a parameter. Returns void and is a silent no-op for any foreign/nonexistent/non-qualifying id or non-verified-officer caller (no existence oracle). The sole removal path — direct DELETE privilege is revoked from authenticated.';

revoke all on function public.remove_own_admissions_shortlist_entry(uuid) from public;
grant execute on function public.remove_own_admissions_shortlist_entry(uuid) to authenticated;

revoke update on public.admissions_shortlist_entries from authenticated;

revoke delete on public.admissions_shortlist_entries from authenticated;
