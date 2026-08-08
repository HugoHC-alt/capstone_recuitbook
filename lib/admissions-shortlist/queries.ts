import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { assertCurrentVerifiedAdmissionsOfficer } from '@/lib/admissions-discovery/queries';
import type { AdmissionsVisibleStudentSummary } from '@/lib/admissions-discovery/types';
import type {
  AdmissionsShortlistActionResult,
  SavedAdmissionsStudentSummary,
} from '@/lib/admissions-shortlist/types';
import { validateShortlistLookupId } from '@/lib/admissions-shortlist/validation';

const NOT_VERIFIED_ADMISSIONS_OFFICER =
  'You are not signed in as a verified admissions officer.';
const GENERIC_ACTION_ERROR = 'Could not complete that action. Please try again.';
const GENERIC_SAVED = 'This student has been saved to your shortlist.';
const GENERIC_REMOVED = 'The entry has been removed from your shortlist.';

function errorResult(message: string): AdmissionsShortlistActionResult {
  return { error: message, success: null };
}

function successResult(message: string): AdmissionsShortlistActionResult {
  return { error: null, success: message };
}

export async function saveAdmissionsShortlistEntry(
  studentProfileId: unknown,
): Promise<AdmissionsShortlistActionResult> {
  const user = await assertCurrentVerifiedAdmissionsOfficer();
  if (!user) {
    return errorResult(NOT_VERIFIED_ADMISSIONS_OFFICER);
  }

  const profileId = validateShortlistLookupId(studentProfileId);
  if (!profileId) {
    return errorResult(GENERIC_ACTION_ERROR);
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from('admissions_shortlist_entries').insert({
    admissions_officer_application_user_id: user.id,
    student_profile_id: profileId,
  });

  if (error) {
    if (error.code === '23505') {
      return successResult(GENERIC_SAVED);
    }
    return errorResult(GENERIC_ACTION_ERROR);
  }

  return successResult(GENERIC_SAVED);
}

export async function listMyAdmissionsShortlist(): Promise<SavedAdmissionsStudentSummary[]> {
  const user = await assertCurrentVerifiedAdmissionsOfficer();
  if (!user) {
    return [];
  }

  const supabase = await createSupabaseServerClient();

  const { data: entries, error: entriesError } = await supabase
    .from('admissions_shortlist_entries')
    .select('id, student_profile_id')
    .order('created_at', { ascending: false });

  if (entriesError || !entries || entries.length === 0) {
    return [];
  }

  const profileIds = entries.map((row) => row.student_profile_id as string);

  const { data: profiles, error: profilesError } = await supabase
    .from('student_profiles')
    .select('id, preferred_name, country, city_region, intended_major')
    .in('id', profileIds);

  if (profilesError || !profiles) {
    return [];
  }

  const profileById = new Map<string, AdmissionsVisibleStudentSummary>();
  for (const row of profiles) {
    profileById.set(row.id as string, {
      studentProfileId: row.id as string,
      preferredName: (row.preferred_name as string | null) ?? null,
      country: (row.country as string | null) ?? null,
      cityRegion: (row.city_region as string | null) ?? null,
      intendedMajor: (row.intended_major as string | null) ?? null,
    });
  }

  const summaries: SavedAdmissionsStudentSummary[] = [];
  for (const entry of entries) {
    const profile = profileById.get(entry.student_profile_id as string);
    if (!profile) {
      continue;
    }
    summaries.push({ ...profile, entryId: entry.id as string });
  }

  return summaries;
}

export async function removeAdmissionsShortlistEntry(
  entryId: unknown,
): Promise<AdmissionsShortlistActionResult> {
  const user = await assertCurrentVerifiedAdmissionsOfficer();
  if (!user) {
    return errorResult(NOT_VERIFIED_ADMISSIONS_OFFICER);
  }

  const id = validateShortlistLookupId(entryId);
  if (!id) {
    return errorResult(GENERIC_ACTION_ERROR);
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.rpc('remove_own_admissions_shortlist_entry', {
    entry_id: id,
  });

  if (error) {
    return errorResult(GENERIC_ACTION_ERROR);
  }

  return successResult(GENERIC_REMOVED);
}
