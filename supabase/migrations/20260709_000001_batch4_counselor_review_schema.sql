
create type public.counselor_review_status as enum (
  'requested',
  'completed',
  'declined',
  'withdrawn'
);

create table public.counselor_review_requests (
  id                            uuid primary key default gen_random_uuid(),
  counselor_student_link_id     uuid not null
                                  references public.counselor_student_links (id) on delete cascade,
  student_application_user_id   uuid not null
                                  references public.application_users (id) on delete cascade,
  counselor_application_user_id uuid not null
                                  references public.application_users (id) on delete cascade,
  student_message               text,
  status                        public.counselor_review_status not null default 'requested',
  requested_at                  timestamptz not null default now(),
  responded_at                  timestamptz,
  withdrawn_at                  timestamptz,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now(),

  constraint counselor_review_requests_message_length_check
    check (student_message is null or char_length(student_message) <= 1000),

  constraint counselor_review_requests_status_consistency_check
    check (
      (status = 'requested'
        and responded_at is null
        and withdrawn_at is null)
      or (status = 'completed'
        and responded_at is not null
        and withdrawn_at is null)
      or (status = 'declined'
        and responded_at is not null
        and withdrawn_at is null)
      or (status = 'withdrawn'
        and withdrawn_at is not null
        and responded_at is null)
    ),

  constraint counselor_review_requests_timestamp_order_check
    check (
      (responded_at is null or responded_at >= requested_at)
      and (withdrawn_at is null or withdrawn_at >= requested_at)
    )
);

comment on table public.counselor_review_requests is
  'Student-initiated request that one accepted-linked verified counselor review the profile. Anchored to an accepted CounselorStudentLink; the only stored review state (SM-14). First counselor WRITE surface — writes never touch student-owned profile tables. Zero service-role.';
comment on column public.counselor_review_requests.counselor_student_link_id is
  'The accepted CounselorStudentLink this request is born from. All counselor-side access tests that this link is still accepted at query time (revocation kills the review surface immediately).';
comment on column public.counselor_review_requests.student_application_user_id is
  'The requesting student. Server-derived at insert (current_application_user_id()); never client-supplied.';
comment on column public.counselor_review_requests.counselor_application_user_id is
  'The addressed counselor. DENORMALIZED from the accepted link at insert and verified against it by RLS WITH CHECK. Immutable afterward (excluded from the UPDATE grant), so it cannot go stale: an accepted link''s bound counselor cannot change while accepted.';
comment on column public.counselor_review_requests.status is
  'SM-14. Enum value ''requested'' (not ''pending'') to stay unambiguous next to counselor_student_links.status. completed/declined/withdrawn are terminal; a fresh submission is a NEW row.';

create table public.counselor_feedback_notes (
  id                            uuid primary key default gen_random_uuid(),
  counselor_review_request_id   uuid not null unique
                                  references public.counselor_review_requests (id) on delete cascade,
  counselor_application_user_id uuid not null
                                  references public.application_users (id) on delete cascade,
  feedback_text                 text not null,
  created_at                    timestamptz not null default now(),

  constraint counselor_feedback_notes_text_length_check
    check (char_length(feedback_text) <= 4000),
  constraint counselor_feedback_notes_text_nonempty_check
    check (char_length(btrim(feedback_text)) > 0)
);

comment on table public.counselor_feedback_notes is
  'Immutable, plain-text counselor feedback completing a CounselorReviewRequest (1:1 via request_id UNIQUE). No UPDATE/DELETE for any role; students have no INSERT policy (feedback is structurally unforgeable). Student read survives link revocation; counselor read requires the link to still be accepted. Zero service-role.';
comment on column public.counselor_feedback_notes.counselor_application_user_id is
  'The authoring counselor. Self-bound to current_application_user_id() at insert and verified to equal the parent request''s counselor by RLS WITH CHECK.';
comment on column public.counselor_feedback_notes.feedback_text is
  'Plain text (<= 4000, non-empty after trim). Rendered via normal JSX escaping only — never markdown / dangerouslySetInnerHTML. Immutable after insert.';

create index counselor_review_requests_student_idx
  on public.counselor_review_requests (student_application_user_id);
create index counselor_review_requests_counselor_idx
  on public.counselor_review_requests (counselor_application_user_id);
create index counselor_review_requests_link_idx
  on public.counselor_review_requests (counselor_student_link_id);

create unique index counselor_review_requests_active_unique_idx
  on public.counselor_review_requests (counselor_student_link_id)
  where status = 'requested';

create index counselor_feedback_notes_counselor_idx
  on public.counselor_feedback_notes (counselor_application_user_id);

create trigger counselor_review_requests_set_updated_at
  before update on public.counselor_review_requests
  for each row
  execute function public.set_updated_at();

create or replace function public.is_student_owner_of_accepted_link(link_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_active_student()
    and exists (
      select 1
      from public.counselor_student_links csl
      where csl.id = link_id
        and csl.student_application_user_id = public.current_application_user_id()
        and csl.status = 'accepted'
    );
$$;

comment on function public.is_student_owner_of_accepted_link(uuid) is
  'True when the current user is an active student who owns the given counselor_student_links.id AND it is accepted. Gates review-request INSERT. SECURITY DEFINER; link id is a lookup key only.';

revoke all on function public.is_student_owner_of_accepted_link(uuid) from public;
grant execute on function public.is_student_owner_of_accepted_link(uuid) to authenticated;

create or replace function public.is_counselor_of_live_accepted_link(link_id uuid)
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
      where csl.id = link_id
        and csl.status = 'accepted'
        and csl.counselor_application_user_id = public.current_application_user_id()
    );
$$;

comment on function public.is_counselor_of_live_accepted_link(uuid) is
  'True when the current user is a verified counselor bound to the given counselor_student_links.id AND it is accepted AT QUERY TIME. Gates counselor queue SELECT + respond UPDATE; revocation removes access immediately. SECURITY DEFINER; link id is a lookup key only.';

revoke all on function public.is_counselor_of_live_accepted_link(uuid) from public;
grant execute on function public.is_counselor_of_live_accepted_link(uuid) to authenticated;

create or replace function public.is_student_owner_of_review_request(request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.counselor_review_requests crr
    where crr.id = request_id
      and crr.student_application_user_id = public.current_application_user_id()
  );
$$;

comment on function public.is_student_owner_of_review_request(uuid) is
  'True when the current user owns the given counselor_review_requests.id (ownership-only, no active-student gate — reading own history survives suspension/revocation). Gates the student SELECT of own feedback notes. SECURITY DEFINER; request id is a lookup key only.';

revoke all on function public.is_student_owner_of_review_request(uuid) from public;
grant execute on function public.is_student_owner_of_review_request(uuid) to authenticated;

create or replace function public.is_counselor_of_live_review_request(request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_verified_counselor()
    and exists (
      select 1
      from public.counselor_review_requests crr
      join public.counselor_student_links csl
        on csl.id = crr.counselor_student_link_id
      where crr.id = request_id
        and crr.counselor_application_user_id = public.current_application_user_id()
        and csl.status = 'accepted'
    );
$$;

comment on function public.is_counselor_of_live_review_request(uuid) is
  'True when the current user is the verified counselor bound to the given counselor_review_requests.id AND its anchoring link is accepted AT QUERY TIME. Does NOT test request status (reusable for SELECT of own notes on completed requests); feedback INSERT adds the status check. Revocation removes access immediately. SECURITY DEFINER; request id is a lookup key only.';

revoke all on function public.is_counselor_of_live_review_request(uuid) from public;
grant execute on function public.is_counselor_of_live_review_request(uuid) to authenticated;

alter table public.counselor_review_requests enable row level security;
alter table public.counselor_feedback_notes  enable row level security;

create policy counselor_review_requests_select_own_student
  on public.counselor_review_requests
  for select
  to authenticated
  using (student_application_user_id = public.current_application_user_id());

create policy counselor_review_requests_select_counselor
  on public.counselor_review_requests
  for select
  to authenticated
  using (public.is_counselor_of_live_accepted_link(counselor_student_link_id));

create policy counselor_review_requests_select_admin
  on public.counselor_review_requests
  for select
  to authenticated
  using (public.is_platform_admin());

create policy counselor_review_requests_insert_student
  on public.counselor_review_requests
  for insert
  to authenticated
  with check (
    student_application_user_id = public.current_application_user_id()
    and public.is_active_student()
    and public.is_student_owner_of_accepted_link(counselor_student_link_id)
    and counselor_application_user_id = (
      select l.counselor_application_user_id
      from public.counselor_student_links l
      where l.id = counselor_student_link_id
    )
    and status = 'requested'
    and responded_at is null
    and withdrawn_at is null
  );

create policy counselor_review_requests_update_withdraw_student
  on public.counselor_review_requests
  for update
  to authenticated
  using (
    student_application_user_id = public.current_application_user_id()
    and status = 'requested'
  )
  with check (
    student_application_user_id = public.current_application_user_id()
    and status = 'withdrawn'
    and withdrawn_at is not null
  );

create policy counselor_review_requests_update_respond_counselor
  on public.counselor_review_requests
  for update
  to authenticated
  using (
    public.is_counselor_of_live_accepted_link(counselor_student_link_id)
    and status = 'requested'
  )
  with check (
    public.is_counselor_of_live_accepted_link(counselor_student_link_id)
    and status in ('completed', 'declined')
    and responded_at is not null
    and withdrawn_at is null
  );

create policy counselor_feedback_notes_select_own_student
  on public.counselor_feedback_notes
  for select
  to authenticated
  using (public.is_student_owner_of_review_request(counselor_review_request_id));

create policy counselor_feedback_notes_select_counselor
  on public.counselor_feedback_notes
  for select
  to authenticated
  using (public.is_counselor_of_live_review_request(counselor_review_request_id));

create policy counselor_feedback_notes_select_admin
  on public.counselor_feedback_notes
  for select
  to authenticated
  using (public.is_platform_admin());

create policy counselor_feedback_notes_insert_counselor
  on public.counselor_feedback_notes
  for insert
  to authenticated
  with check (
    counselor_application_user_id = public.current_application_user_id()
    and public.is_counselor_of_live_review_request(counselor_review_request_id)
    and exists (
      select 1
      from public.counselor_review_requests crr
      where crr.id = counselor_review_request_id
        and crr.status = 'requested'
    )
  );

revoke update on public.counselor_review_requests from authenticated;
grant update (status, responded_at, withdrawn_at)
  on public.counselor_review_requests to authenticated;

revoke update on public.counselor_feedback_notes from authenticated;
revoke delete on public.counselor_feedback_notes from authenticated;
