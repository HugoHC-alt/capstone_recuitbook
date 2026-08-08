
begin;

grant select, insert on public.admissions_shortlist_entries to authenticated;

create temporary table test_results (
  seq     serial primary key,
  name    text not null,
  ok      boolean not null,
  detail  text
) on commit drop;

create or replace function pg_temp.record_result(p_name text, p_ok boolean, p_detail text default null)
returns void
language sql
security definer
as $$
  insert into test_results (name, ok, detail) values (p_name, p_ok, p_detail);
$$;

insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-00000000000a', 'officer-a@batch6-rls-test.example'),
  ('b0000000-0000-0000-0000-00000000000b', 'officer-b@batch6-rls-test.example'),
  ('90000000-0000-0000-0000-000000000009', 'officer-pending@batch6-rls-test.example'),
  ('50000000-0000-0000-0000-000000000005', 'officer-suspended@batch6-rls-test.example');

insert into public.application_users (id, auth_user_id, email, role, account_status) values
  ('aa000000-0000-0000-0000-0000000000aa', 'a0000000-0000-0000-0000-00000000000a', 'officer-a@batch6-rls-test.example', 'admissions_officer', 'verified'),
  ('bb000000-0000-0000-0000-0000000000bb', 'b0000000-0000-0000-0000-00000000000b', 'officer-b@batch6-rls-test.example', 'admissions_officer', 'verified'),
  ('99000000-0000-0000-0000-000000000099', '90000000-0000-0000-0000-000000000009', 'officer-pending@batch6-rls-test.example', 'admissions_officer', 'pending_approval'),
  ('55000000-0000-0000-0000-000000000055', '50000000-0000-0000-0000-000000000005', 'officer-suspended@batch6-rls-test.example', 'admissions_officer', 'suspended');

insert into auth.users (id, email) values
  ('c0000000-0000-0000-0000-00000000000c', 'counselor-c@batch6-rls-test.example');
insert into public.application_users (id, auth_user_id, email, role, account_status) values
  ('cc000000-0000-0000-0000-0000000000cc', 'c0000000-0000-0000-0000-00000000000c', 'counselor-c@batch6-rls-test.example', 'counselor', 'verified');

insert into auth.users (id, email) values
  ('d0000000-0000-0000-0000-00000000000d', 'admin-m@batch6-rls-test.example');
insert into public.application_users (id, auth_user_id, email, role, account_status) values
  ('dd000000-0000-0000-0000-0000000000dd', 'd0000000-0000-0000-0000-00000000000d', 'admin-m@batch6-rls-test.example', 'platform_admin', 'active');

insert into auth.users (id, email) values
  ('10000000-0000-0000-0000-000000000001', 'student-x@batch6-rls-test.example'),   -- X: effectively visible
  ('20000000-0000-0000-0000-000000000002', 'student-y1@batch6-rls-test.example'),  -- Y1: no settings row
  ('30000000-0000-0000-0000-000000000003', 'student-y2@batch6-rls-test.example'),  -- Y2: published only
  ('40000000-0000-0000-0000-000000000004', 'student-y3@batch6-rls-test.example'),  -- Y3: consent only
  ('60000000-0000-0000-0000-000000000006', 'student-z@batch6-rls-test.example');   -- Z: suspended owner, both flags true

insert into public.application_users (id, auth_user_id, email, role, account_status) values
  ('11000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001', 'student-x@batch6-rls-test.example', 'student', 'active'),
  ('21000000-0000-0000-0000-000000000021', '20000000-0000-0000-0000-000000000002', 'student-y1@batch6-rls-test.example', 'student', 'active'),
  ('31000000-0000-0000-0000-000000000031', '30000000-0000-0000-0000-000000000003', 'student-y2@batch6-rls-test.example', 'student', 'active'),
  ('41000000-0000-0000-0000-000000000041', '40000000-0000-0000-0000-000000000004', 'student-y3@batch6-rls-test.example', 'student', 'active'),
  ('61000000-0000-0000-0000-000000000061', '60000000-0000-0000-0000-000000000006', 'student-z@batch6-rls-test.example', 'student', 'suspended');

insert into public.student_profiles (id, application_user_id) values
  ('1a000000-0000-0000-0000-00000000001a', '11000000-0000-0000-0000-000000000011'), -- X
  ('2a000000-0000-0000-0000-00000000002a', '21000000-0000-0000-0000-000000000021'), -- Y1
  ('3a000000-0000-0000-0000-00000000003a', '31000000-0000-0000-0000-000000000031'), -- Y2
  ('4a000000-0000-0000-0000-00000000004a', '41000000-0000-0000-0000-000000000041'), -- Y3
  ('6a000000-0000-0000-0000-00000000006a', '61000000-0000-0000-0000-000000000061'); -- Z

insert into public.profile_visibility_settings (student_profile_id, is_published, admissions_consent)
  values ('1a000000-0000-0000-0000-00000000001a', true, true);
insert into public.profile_visibility_settings (student_profile_id, is_published, admissions_consent)
  values ('3a000000-0000-0000-0000-00000000003a', true, false);
insert into public.profile_visibility_settings (student_profile_id, is_published, admissions_consent)
  values ('4a000000-0000-0000-0000-00000000004a', false, true);
insert into public.profile_visibility_settings (student_profile_id, is_published, admissions_consent)
  values ('6a000000-0000-0000-0000-00000000006a', true, true);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-00000000000a', true);

do $$
declare
  v_uid uuid;
  v_app_id uuid;
  v_verified boolean;
begin
  select auth.uid() into v_uid;
  select public.current_application_user_id() into v_app_id;
  select public.is_verified_admissions_officer() into v_verified;

  if v_uid is distinct from 'a0000000-0000-0000-0000-00000000000a'::uuid then
    raise exception 'SMOKE TEST FAILED: auth.uid() did not resolve to the simulated identity (got %)', v_uid;
  end if;
  if v_app_id is distinct from 'aa000000-0000-0000-0000-0000000000aa'::uuid then
    raise exception 'SMOKE TEST FAILED: current_application_user_id() did not resolve to officer A (got %)', v_app_id;
  end if;
  if v_verified is distinct from true then
    raise exception 'SMOKE TEST FAILED: is_verified_admissions_officer() did not return true for officer A';
  end if;
  perform pg_temp.record_result('0. smoke test: auth.uid()/current_application_user_id()/is_verified_admissions_officer() simulate correctly', true);
end $$;

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-00000000000a', true);
do $$
begin
  insert into public.admissions_shortlist_entries (admissions_officer_application_user_id, student_profile_id)
  values ('aa000000-0000-0000-0000-0000000000aa', '1a000000-0000-0000-0000-00000000001a');
  perform pg_temp.record_result('1a. A inserts (A,X) succeeds', true);
exception when others then
  perform pg_temp.record_result('1a. A inserts (A,X) succeeds', false, sqlstate || ': ' || sqlerrm);
end $$;

do $$
begin
  insert into public.admissions_shortlist_entries (admissions_officer_application_user_id, student_profile_id)
  values ('aa000000-0000-0000-0000-0000000000aa', '1a000000-0000-0000-0000-00000000001a');
  perform pg_temp.record_result('1b. A inserts (A,X) again -> expected 23505', false, 'insert unexpectedly succeeded');
exception
  when unique_violation then
    perform pg_temp.record_result('1b. A inserts (A,X) again -> expected 23505', true);
  when others then
    perform pg_temp.record_result('1b. A inserts (A,X) again -> expected 23505', false, sqlstate || ': ' || sqlerrm);
end $$;

do $$
begin
  insert into public.admissions_shortlist_entries (admissions_officer_application_user_id, student_profile_id)
  values ('bb000000-0000-0000-0000-0000000000bb', '1a000000-0000-0000-0000-00000000001a');
  perform pg_temp.record_result('1c. A forges owner=B -> expected RLS denial', false, 'insert unexpectedly succeeded');
exception
  when others then
    if sqlstate = '42501' and sqlerrm like '%row-level security%' then
      perform pg_temp.record_result('1c. A forges owner=B -> expected RLS denial', true);
    else
      perform pg_temp.record_result('1c. A forges owner=B -> expected RLS denial', false, sqlstate || ': ' || sqlerrm);
    end if;
end $$;

do $$
declare
  v_profile uuid;
  v_label text;
  v_case record;
begin
  for v_case in
    select * from (values
      ('1d. A inserts (A,Y1 no-settings-row) -> expected RLS denial', '2a000000-0000-0000-0000-00000000002a'::uuid),
      ('1e. A inserts (A,Y2 published-only) -> expected RLS denial', '3a000000-0000-0000-0000-00000000003a'::uuid),
      ('1f. A inserts (A,Y3 consent-only) -> expected RLS denial', '4a000000-0000-0000-0000-00000000004a'::uuid),
      ('1g. A inserts (A,Z suspended-owner) -> expected RLS denial', '6a000000-0000-0000-0000-00000000006a'::uuid)
    ) as t(label, profile_id)
  loop
    begin
      insert into public.admissions_shortlist_entries (admissions_officer_application_user_id, student_profile_id)
      values ('aa000000-0000-0000-0000-0000000000aa', v_case.profile_id);
      perform pg_temp.record_result(v_case.label, false, 'insert unexpectedly succeeded');
    exception
      when others then
        if sqlstate = '42501' and sqlerrm like '%row-level security%' then
          perform pg_temp.record_result(v_case.label, true);
        else
          perform pg_temp.record_result(v_case.label, false, sqlstate || ': ' || sqlerrm);
        end if;
    end;
  end loop;
end $$;

do $$
begin
  insert into public.admissions_shortlist_entries (admissions_officer_application_user_id, student_profile_id)
  values ('aa000000-0000-0000-0000-0000000000aa', gen_random_uuid());
  perform pg_temp.record_result('1h. A inserts (A,random-uuid) -> expected RLS denial not FK (N2)', false, 'insert unexpectedly succeeded');
exception
  when foreign_key_violation then
    perform pg_temp.record_result('1h. A inserts (A,random-uuid) -> expected RLS denial not FK (N2)', false, 'got FK violation (23503) instead of RLS denial — N2 violated');
  when others then
    if sqlstate = '42501' and sqlerrm like '%row-level security%' then
      perform pg_temp.record_result('1h. A inserts (A,random-uuid) -> expected RLS denial not FK (N2)', true);
    else
      perform pg_temp.record_result('1h. A inserts (A,random-uuid) -> expected RLS denial not FK (N2)', false, sqlstate || ': ' || sqlerrm);
    end if;
end $$;

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000009', true);
do $$
begin
  insert into public.admissions_shortlist_entries (admissions_officer_application_user_id, student_profile_id)
  values ('99000000-0000-0000-0000-000000000099', '1a000000-0000-0000-0000-00000000001a');
  perform pg_temp.record_result('1i. Pending officer P inserts -> expected denial', false, 'insert unexpectedly succeeded');
exception when others then
  if sqlstate = '42501' and sqlerrm like '%row-level security%' then
    perform pg_temp.record_result('1i. Pending officer P inserts -> expected denial', true);
  else
    perform pg_temp.record_result('1i. Pending officer P inserts -> expected denial', false, sqlstate || ': ' || sqlerrm);
  end if;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '50000000-0000-0000-0000-000000000005', true);
do $$
begin
  insert into public.admissions_shortlist_entries (admissions_officer_application_user_id, student_profile_id)
  values ('55000000-0000-0000-0000-000000000055', '1a000000-0000-0000-0000-00000000001a');
  perform pg_temp.record_result('1j. Suspended officer S inserts -> expected denial', false, 'insert unexpectedly succeeded');
exception when others then
  if sqlstate = '42501' and sqlerrm like '%row-level security%' then
    perform pg_temp.record_result('1j. Suspended officer S inserts -> expected denial', true);
  else
    perform pg_temp.record_result('1j. Suspended officer S inserts -> expected denial', false, sqlstate || ': ' || sqlerrm);
  end if;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
do $$
begin
  insert into public.admissions_shortlist_entries (admissions_officer_application_user_id, student_profile_id)
  values ('11000000-0000-0000-0000-000000000011', '1a000000-0000-0000-0000-00000000001a');
  perform pg_temp.record_result('1k. Student X inserts -> expected denial', false, 'insert unexpectedly succeeded');
exception when others then
  if sqlstate = '42501' and sqlerrm like '%row-level security%' then
    perform pg_temp.record_result('1k. Student X inserts -> expected denial', true);
  else
    perform pg_temp.record_result('1k. Student X inserts -> expected denial', false, sqlstate || ': ' || sqlerrm);
  end if;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-00000000000c', true);
do $$
begin
  insert into public.admissions_shortlist_entries (admissions_officer_application_user_id, student_profile_id)
  values ('cc000000-0000-0000-0000-0000000000cc', '1a000000-0000-0000-0000-00000000001a');
  perform pg_temp.record_result('1l. Counselor C inserts -> expected denial', false, 'insert unexpectedly succeeded');
exception when others then
  if sqlstate = '42501' and sqlerrm like '%row-level security%' then
    perform pg_temp.record_result('1l. Counselor C inserts -> expected denial', true);
  else
    perform pg_temp.record_result('1l. Counselor C inserts -> expected denial', false, sqlstate || ': ' || sqlerrm);
  end if;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'd0000000-0000-0000-0000-00000000000d', true);
do $$
begin
  insert into public.admissions_shortlist_entries (admissions_officer_application_user_id, student_profile_id)
  values ('dd000000-0000-0000-0000-0000000000dd', '1a000000-0000-0000-0000-00000000001a');
  perform pg_temp.record_result('1m. Admin M inserts -> expected denial', false, 'insert unexpectedly succeeded');
exception when others then
  if sqlstate = '42501' and sqlerrm like '%row-level security%' then
    perform pg_temp.record_result('1m. Admin M inserts -> expected denial', true);
  else
    perform pg_temp.record_result('1m. Admin M inserts -> expected denial', false, sqlstate || ': ' || sqlerrm);
  end if;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-00000000000b', true);
do $$
begin
  insert into public.admissions_shortlist_entries (admissions_officer_application_user_id, student_profile_id)
  values ('bb000000-0000-0000-0000-0000000000bb', '1a000000-0000-0000-0000-00000000001a');
  perform pg_temp.record_result('1n. (setup) B inserts (B,X) succeeds', true);
exception when others then
  perform pg_temp.record_result('1n. (setup) B inserts (B,X) succeeds', false, sqlstate || ': ' || sqlerrm);
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-00000000000a', true);
do $$
declare v_count int;
begin
  select count(*) into v_count from public.admissions_shortlist_entries
    where admissions_officer_application_user_id = 'aa000000-0000-0000-0000-0000000000aa';
  if v_count = 1 then
    perform pg_temp.record_result('2a. A SELECT sees exactly own 1 entry', true);
  else
    perform pg_temp.record_result('2a. A SELECT sees exactly own 1 entry', false, 'expected 1 row, got ' || v_count);
  end if;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-00000000000b', true);
do $$
declare v_count int;
begin
  select count(*) into v_count from public.admissions_shortlist_entries
    where admissions_officer_application_user_id = 'aa000000-0000-0000-0000-0000000000aa';
  if v_count = 0 then
    perform pg_temp.record_result('2b. B SELECT sees none of A''s rows', true);
  else
    perform pg_temp.record_result('2b. B SELECT sees none of A''s rows', false, 'expected 0 rows, got ' || v_count);
  end if;
end $$;
reset role;

update public.profile_visibility_settings set is_published = false
  where student_profile_id = '1a000000-0000-0000-0000-00000000001a';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-00000000000a', true);
do $$
declare v_count int;
begin
  select count(*) into v_count from public.admissions_shortlist_entries
    where admissions_officer_application_user_id = 'aa000000-0000-0000-0000-0000000000aa';
  if v_count = 0 then
    perform pg_temp.record_result('2c. Hide X -> A sees zero immediately', true);
  else
    perform pg_temp.record_result('2c. Hide X -> A sees zero immediately', false, 'expected 0 rows, got ' || v_count);
  end if;
end $$;
reset role;

update public.profile_visibility_settings set is_published = true
  where student_profile_id = '1a000000-0000-0000-0000-00000000001a';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-00000000000a', true);
do $$
declare v_count int;
begin
  select count(*) into v_count from public.admissions_shortlist_entries
    where admissions_officer_application_user_id = 'aa000000-0000-0000-0000-0000000000aa'
      and student_profile_id = '1a000000-0000-0000-0000-00000000001a';
  if v_count = 1 then
    perform pg_temp.record_result('2d. Restore X -> same entry resurfaces', true);
  else
    perform pg_temp.record_result('2d. Restore X -> same entry resurfaces', false, 'expected 1 row, got ' || v_count);
  end if;
end $$;
reset role;

update public.application_users set account_status = 'suspended'
  where id = '11000000-0000-0000-0000-000000000011';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-00000000000a', true);
do $$
declare v_count int;
begin
  select count(*) into v_count from public.admissions_shortlist_entries
    where admissions_officer_application_user_id = 'aa000000-0000-0000-0000-0000000000aa';
  if v_count = 0 then
    perform pg_temp.record_result('2e1. Suspend student X (owner) -> A sees zero', true);
  else
    perform pg_temp.record_result('2e1. Suspend student X (owner) -> A sees zero', false, 'expected 0 rows, got ' || v_count);
  end if;
end $$;
reset role;

update public.application_users set account_status = 'active'
  where id = '11000000-0000-0000-0000-000000000011';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-00000000000a', true);
do $$
declare v_count int;
begin
  select count(*) into v_count from public.admissions_shortlist_entries
    where admissions_officer_application_user_id = 'aa000000-0000-0000-0000-0000000000aa';
  if v_count = 1 then
    perform pg_temp.record_result('2e2. Reactivate student X -> A sees entry again', true);
  else
    perform pg_temp.record_result('2e2. Reactivate student X -> A sees entry again', false, 'expected 1 row, got ' || v_count);
  end if;
end $$;
reset role;

update public.application_users set account_status = 'suspended'
  where id = 'aa000000-0000-0000-0000-0000000000aa';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-00000000000a', true);
do $$
declare v_count int;
begin
  select count(*) into v_count from public.admissions_shortlist_entries;
  if v_count = 0 then
    perform pg_temp.record_result('2f. Suspend officer A -> A sees zero of own rows', true);
  else
    perform pg_temp.record_result('2f. Suspend officer A -> A sees zero of own rows', false, 'expected 0 rows, got ' || v_count);
  end if;
end $$;
reset role;

update public.application_users set account_status = 'verified'
  where id = 'aa000000-0000-0000-0000-0000000000aa';

do $$
declare
  v_case record;
  v_count int;
begin
  for v_case in
    select * from (values
      ('2g1. Pending officer P SELECT -> zero rows', '90000000-0000-0000-0000-000000000009'::uuid),
      ('2g2. Suspended officer S SELECT -> zero rows', '50000000-0000-0000-0000-000000000005'::uuid),
      ('2g3. Student X SELECT -> zero rows', '10000000-0000-0000-0000-000000000001'::uuid),
      ('2g4. Counselor C SELECT -> zero rows', 'c0000000-0000-0000-0000-00000000000c'::uuid)
    ) as t(label, auth_id)
  loop
    execute 'set local role authenticated';
    perform set_config('request.jwt.claim.sub', v_case.auth_id::text, true);
    select count(*) into v_count from public.admissions_shortlist_entries;
    if v_count = 0 then
      perform pg_temp.record_result(v_case.label, true);
    else
      perform pg_temp.record_result(v_case.label, false, 'expected 0 rows, got ' || v_count);
    end if;
    reset role;
  end loop;
end $$;

update public.profile_visibility_settings set admissions_consent = false
  where student_profile_id = '1a000000-0000-0000-0000-00000000001a';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'd0000000-0000-0000-0000-00000000000d', true);
do $$
declare v_count int;
begin
  select count(*) into v_count from public.admissions_shortlist_entries;
  if v_count = 2 then
    perform pg_temp.record_result('2h. Admin M sees ALL entries incl. stale/hidden ones', true);
  else
    perform pg_temp.record_result('2h. Admin M sees ALL entries incl. stale/hidden ones', false, 'expected 2 rows (incl. stale), got ' || v_count);
  end if;
end $$;
reset role;

update public.profile_visibility_settings set admissions_consent = true
  where student_profile_id = '1a000000-0000-0000-0000-00000000001a';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-00000000000a', true);
do $$
begin
  update public.admissions_shortlist_entries set created_at = now()
    where admissions_officer_application_user_id = 'aa000000-0000-0000-0000-0000000000aa';
  perform pg_temp.record_result('3a. A UPDATE own row -> expected privilege-layer denial', false, 'update unexpectedly succeeded');
exception when others then
  if sqlstate = '42501' and sqlerrm like '%permission denied for table%' then
    perform pg_temp.record_result('3a. A UPDATE own row -> expected privilege-layer denial', true);
  else
    perform pg_temp.record_result('3a. A UPDATE own row -> expected privilege-layer denial', false, sqlstate || ': ' || sqlerrm);
  end if;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'd0000000-0000-0000-0000-00000000000d', true);
do $$
begin
  update public.admissions_shortlist_entries set created_at = now();
  perform pg_temp.record_result('3b. Admin M UPDATE any row -> expected privilege-layer denial', false, 'update unexpectedly succeeded');
exception when others then
  if sqlstate = '42501' and sqlerrm like '%permission denied for table%' then
    perform pg_temp.record_result('3b. Admin M UPDATE any row -> expected privilege-layer denial', true);
  else
    perform pg_temp.record_result('3b. Admin M UPDATE any row -> expected privilege-layer denial', false, sqlstate || ': ' || sqlerrm);
  end if;
end $$;
reset role;

do $$
declare
  v_entry uuid;
  v_after int;
begin
  select id into v_entry from public.admissions_shortlist_entries
    where admissions_officer_application_user_id = 'aa000000-0000-0000-0000-0000000000aa'
      and student_profile_id = '1a000000-0000-0000-0000-00000000001a';

  execute 'set local role authenticated';
  perform set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-00000000000a', true);
  perform public.remove_own_admissions_shortlist_entry(v_entry);
  reset role;

  select count(*) into v_after from public.admissions_shortlist_entries where id = v_entry;
  if v_after = 0 then
    perform pg_temp.record_result('4a. A RPC-removes own VISIBLE entry -> row gone', true);
  else
    perform pg_temp.record_result('4a. A RPC-removes own VISIBLE entry -> row gone', false, 'row still present after RPC');
  end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-00000000000a', true);
do $$
begin
  insert into public.admissions_shortlist_entries (admissions_officer_application_user_id, student_profile_id)
  values ('aa000000-0000-0000-0000-0000000000aa', '1a000000-0000-0000-0000-00000000001a');
end $$;
reset role;

update public.profile_visibility_settings set is_published = false
  where student_profile_id = '1a000000-0000-0000-0000-00000000001a';

do $$
declare
  v_entry uuid;
  v_after int;
begin
  select id into v_entry from public.admissions_shortlist_entries
    where admissions_officer_application_user_id = 'aa000000-0000-0000-0000-0000000000aa'
      and student_profile_id = '1a000000-0000-0000-0000-00000000001a';

  execute 'set local role authenticated';
  perform set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-00000000000a', true);
  perform public.remove_own_admissions_shortlist_entry(v_entry);
  reset role;

  select count(*) into v_after from public.admissions_shortlist_entries where id = v_entry;
  if v_after = 0 then
    perform pg_temp.record_result('4b. A RPC-removes own STALE (hidden) entry -> row gone (not visibility-gated)', true);
  else
    perform pg_temp.record_result('4b. A RPC-removes own STALE (hidden) entry -> row gone (not visibility-gated)', false, 'row still present after RPC');
  end if;
end $$;

update public.profile_visibility_settings set is_published = true
  where student_profile_id = '1a000000-0000-0000-0000-00000000001a';

do $$
declare
  v_entry uuid;
  v_after int;
  v_raised boolean := false;
begin
  select id into v_entry from public.admissions_shortlist_entries
    where admissions_officer_application_user_id = 'bb000000-0000-0000-0000-0000000000bb';

  execute 'set local role authenticated';
  perform set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-00000000000a', true);
  begin
    perform public.remove_own_admissions_shortlist_entry(v_entry);
  exception when others then
    v_raised := true;
  end;
  reset role;

  select count(*) into v_after from public.admissions_shortlist_entries where id = v_entry;
  if not v_raised and v_after = 1 then
    perform pg_temp.record_result('4c. A RPC on B''s entry -> void no-op, B''s row remains', true);
  else
    perform pg_temp.record_result('4c. A RPC on B''s entry -> void no-op, B''s row remains', false,
      'raised=' || v_raised || ', B row count=' || v_after);
  end if;
end $$;

do $$
declare
  v_raised boolean := false;
begin
  execute 'set local role authenticated';
  perform set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-00000000000a', true);
  begin
    perform public.remove_own_admissions_shortlist_entry(gen_random_uuid());
  exception when others then
    v_raised := true;
  end;
  reset role;

  if not v_raised then
    perform pg_temp.record_result('4d. A RPC on nonexistent id -> void no-op, no exception', true);
  else
    perform pg_temp.record_result('4d. A RPC on nonexistent id -> void no-op, no exception', false, 'RPC raised an exception');
  end if;
end $$;

do $$
declare
  v_case record;
  v_entry uuid;
  v_after int;
  v_raised boolean;
begin
  select id into v_entry from public.admissions_shortlist_entries
    where admissions_officer_application_user_id = 'bb000000-0000-0000-0000-0000000000bb';

  for v_case in
    select * from (values
      ('4e1. Pending officer P RPC on B''s entry -> void no-op, row remains', '90000000-0000-0000-0000-000000000009'::uuid),
      ('4e2. Suspended officer S RPC on B''s entry -> void no-op, row remains', '50000000-0000-0000-0000-000000000005'::uuid),
      ('4e3. Student X RPC on B''s entry -> void no-op, row remains', '10000000-0000-0000-0000-000000000001'::uuid),
      ('4e4. Counselor C RPC on B''s entry -> void no-op, row remains', 'c0000000-0000-0000-0000-00000000000c'::uuid),
      ('4e5. Admin M RPC on B''s entry -> void no-op, row remains', 'd0000000-0000-0000-0000-00000000000d'::uuid)
    ) as t(label, auth_id)
  loop
    v_raised := false;
    execute 'set local role authenticated';
    perform set_config('request.jwt.claim.sub', v_case.auth_id::text, true);
    begin
      perform public.remove_own_admissions_shortlist_entry(v_entry);
    exception when others then
      v_raised := true;
    end;
    reset role;

    select count(*) into v_after from public.admissions_shortlist_entries where id = v_entry;
    if not v_raised and v_after = 1 then
      perform pg_temp.record_result(v_case.label, true);
    else
      perform pg_temp.record_result(v_case.label, false, 'raised=' || v_raised || ', B row count=' || v_after);
    end if;
  end loop;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-00000000000a', true);
do $$
begin
  delete from public.admissions_shortlist_entries
    where admissions_officer_application_user_id = 'aa000000-0000-0000-0000-0000000000aa';
  perform pg_temp.record_result('4f. A direct table DELETE -> expected privilege-layer denial', false, 'direct delete unexpectedly succeeded');
exception when others then
  if sqlstate = '42501' and sqlerrm like '%permission denied for table%' then
    perform pg_temp.record_result('4f. A direct table DELETE -> expected privilege-layer denial', true);
  else
    perform pg_temp.record_result('4f. A direct table DELETE -> expected privilege-layer denial', false, sqlstate || ': ' || sqlerrm);
  end if;
end $$;
reset role;

set local role anon;
do $$
begin
  perform public.remove_own_admissions_shortlist_entry(gen_random_uuid());
  perform pg_temp.record_result('4g. anon RPC call -> expected function-privilege denial', false, 'anon RPC unexpectedly succeeded');
exception when others then
  if sqlstate = '42501' and sqlerrm like '%permission denied for function%' then
    perform pg_temp.record_result('4g. anon RPC call -> expected function-privilege denial', true);
  else
    perform pg_temp.record_result('4g. anon RPC call -> expected function-privilege denial', false, sqlstate || ': ' || sqlerrm);
  end if;
end $$;
reset role;

do $$
declare
  v_noop_fail int;
begin
  select count(*) into v_noop_fail
  from test_results
  where name in (
    '4c. A RPC on B''s entry -> void no-op, B''s row remains',
    '4d. A RPC on nonexistent id -> void no-op, no exception',
    '4e1. Pending officer P RPC on B''s entry -> void no-op, row remains',
    '4e2. Suspended officer S RPC on B''s entry -> void no-op, row remains',
    '4e3. Student X RPC on B''s entry -> void no-op, row remains',
    '4e4. Counselor C RPC on B''s entry -> void no-op, row remains',
    '4e5. Admin M RPC on B''s entry -> void no-op, row remains'
  ) and not ok;

  if v_noop_fail = 0 then
    perform pg_temp.record_result('4h. no-oracle: foreign/nonexistent/wrong-role RPC calls are indistinguishable no-ops', true);
  else
    perform pg_temp.record_result('4h. no-oracle: foreign/nonexistent/wrong-role RPC calls are indistinguishable no-ops', false, v_noop_fail || ' underlying no-op case(s) failed');
  end if;
end $$;

do $$
declare
  v_case record;
  v_count int;
  v_leak_count int;
begin
  for v_case in
    select * from (values
      ('student_profiles', 7),
      ('academic_backgrounds', 7),
      ('profile_activities', 7),
      ('profile_achievements', 7),
      ('profile_visibility_settings', 4),
      ('counselor_student_links', 6),
      ('counselor_review_requests', 6),
      ('counselor_feedback_notes', 4)
    ) as t(table_name, expected_count)
  loop
    select count(*) into v_count from pg_policies where schemaname = 'public' and tablename = v_case.table_name;
    select count(*) into v_leak_count from pg_policies where schemaname = 'public' and tablename = v_case.table_name and policyname like '%admissions_shortlist%';

    if v_leak_count > 0 then
      perform pg_temp.record_result('5a. ' || v_case.table_name || ' has no admissions_shortlist policy leakage', false, v_leak_count || ' leaked policy name(s) found');
    else
      perform pg_temp.record_result('5a. ' || v_case.table_name || ' has no admissions_shortlist policy leakage', true);
    end if;

    perform pg_temp.record_result(
      '5a. ' || v_case.table_name || ' policy count unchanged (expected ' || v_case.expected_count || ')',
      v_count = v_case.expected_count,
      case when v_count <> v_case.expected_count then 'expected ' || v_case.expected_count || ', got ' || v_count else null end
    );
  end loop;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-00000000000a', true);
do $$
declare v_visible boolean;
begin
  select public.is_admissions_visible_profile('1a000000-0000-0000-0000-00000000001a') into v_visible;
  if v_visible then
    perform pg_temp.record_result('5b. Batch 5 is_admissions_visible_profile(X) unchanged (still true for officer A)', true);
  else
    perform pg_temp.record_result('5b. Batch 5 is_admissions_visible_profile(X) unchanged (still true for officer A)', false, 'expected true, got false');
  end if;
end $$;
reset role;

do $$
declare
  v_total int;
  v_delete int;
begin
  select count(*) into v_total from pg_policies
    where schemaname = 'public' and tablename = 'admissions_shortlist_entries';
  select count(*) into v_delete from pg_policies
    where schemaname = 'public' and tablename = 'admissions_shortlist_entries' and cmd = 'DELETE';

  perform pg_temp.record_result('5c1. admissions_shortlist_entries has exactly 3 policies', v_total = 3,
    case when v_total <> 3 then 'expected 3, got ' || v_total else null end);
  perform pg_temp.record_result('5c2. admissions_shortlist_entries has NO DELETE policy row', v_delete = 0,
    case when v_delete <> 0 then 'expected 0 DELETE policies, got ' || v_delete else null end);
end $$;

do $$
declare
  v_auth boolean;
  v_anon boolean;
begin
  v_auth := has_function_privilege('authenticated', 'public.remove_own_admissions_shortlist_entry(uuid)', 'execute');
  v_anon := has_function_privilege('anon', 'public.remove_own_admissions_shortlist_entry(uuid)', 'execute');

  perform pg_temp.record_result('5d1. RPC EXECUTE granted to authenticated', v_auth,
    case when not v_auth then 'authenticated lacks EXECUTE' else null end);
  perform pg_temp.record_result('5d2. RPC EXECUTE NOT granted to anon', not v_anon,
    case when v_anon then 'anon unexpectedly has EXECUTE' else null end);
end $$;

do $$
declare
  v_total int;
  v_passed int;
  v_failed int;
begin
  select count(*), count(*) filter (where ok), count(*) filter (where not ok)
    into v_total, v_passed, v_failed
    from test_results;
  raise notice '============================================================';
  raise notice 'Batch 6 admissions_shortlist_entries RLS suite: % total, % passed, % failed', v_total, v_passed, v_failed;
  raise notice '============================================================';
end $$;

select seq, name, ok, detail from test_results order by seq;

do $$
declare
  v_failed int;
begin
  select count(*) into v_failed from test_results where not ok;
  if v_failed > 0 then
    raise warning '% test case(s) FAILED — see the detail column above', v_failed;
  else
    raise notice 'ALL test cases PASSED.';
  end if;
end $$;

rollback;
