import 'server-only';

import { getCurrentApplicationUser } from '@/lib/auth/get-current-application-user';
import type { ApplicationUser } from '@/lib/auth/types';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  assertCurrentActiveStudent,
  getOrCreateCurrentStudentProfile,
} from '@/lib/student-profile/queries';
import { calculateStudentProfileCompletion } from '@/lib/student-profile/completion';
import type {
  AcademicBackground,
  ProfileAchievement,
  ProfileActivity,
  StudentProfile,
  StudentProfileAggregate,
} from '@/lib/student-profile/types';
import type {
  AdmissionsDiscoveryFilters,
  AdmissionsVisibleStudentSummary,
  ProfileVisibilityActionResult,
  ProfileVisibilityInput,
  ProfileVisibilitySettings,
} from '@/lib/admissions-discovery/types';
import {
  escapeLikePattern,
  validateProfileVisibilityInput,
} from '@/lib/admissions-discovery/validation';

const NOT_ACTIVE_STUDENT = 'You are not signed in as an active student.';
const GENERIC_ACTION_ERROR = 'Could not complete that action. Please try again.';
const GENERIC_VISIBILITY_SAVED = 'Your visibility settings have been saved.';

function errorResult(message: string): ProfileVisibilityActionResult {
  return { error: message, success: null };
}

function successResult(message: string): ProfileVisibilityActionResult {
  return { error: null, success: message };
}

export async function getCurrentStudentProfileVisibilitySettings(): Promise<ProfileVisibilitySettings | null> {
  const user = await getCurrentApplicationUser();
  if (!user) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  const { data: profile, error: profileError } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('application_user_id', user.id)
    .maybeSingle<{ id: string }>();

  if (profileError || !profile) {
    return null;
  }

  const { data, error } = await supabase
    .from('profile_visibility_settings')
    .select('*')
    .eq('student_profile_id', profile.id)
    .maybeSingle<ProfileVisibilitySettings>();

  if (error) {
    return null;
  }

  return data ?? null;
}

export async function saveCurrentStudentProfileVisibilitySettings(
  input: unknown,
): Promise<ProfileVisibilityActionResult> {
  const user = await assertCurrentActiveStudent();
  if (!user) {
    return errorResult(NOT_ACTIVE_STUDENT);
  }

  const validated = validateProfileVisibilityInput(input);
  if ('error' in validated) {
    return errorResult(validated.error);
  }
  const flags: ProfileVisibilityInput = validated.value;

  let profile: StudentProfile;
  try {
    profile = await getOrCreateCurrentStudentProfile();
  } catch {
    return errorResult(GENERIC_ACTION_ERROR);
  }

  const supabase = await createSupabaseServerClient();

  const { data: existing, error: lookupError } = await supabase
    .from('profile_visibility_settings')
    .select('id')
    .eq('student_profile_id', profile.id)
    .maybeSingle<{ id: string }>();

  if (lookupError) {
    return errorResult(GENERIC_ACTION_ERROR);
  }

  if (!existing) {
    const { error: insertError } = await supabase
      .from('profile_visibility_settings')
      .insert({
        student_profile_id: profile.id,
        is_published: flags.isPublished,
        admissions_consent: flags.admissionsConsent,
      });

    if (insertError) {
      return errorResult(GENERIC_ACTION_ERROR);
    }

    return successResult(GENERIC_VISIBILITY_SAVED);
  }

  const { data: updated, error: updateError } = await supabase
    .from('profile_visibility_settings')
    .update({
      is_published: flags.isPublished,
      admissions_consent: flags.admissionsConsent,
    })
    .eq('student_profile_id', profile.id)
    .select('id');

  if (updateError) {
    return errorResult(GENERIC_ACTION_ERROR);
  }
  if (!updated || updated.length === 0) {
    return errorResult(GENERIC_ACTION_ERROR);
  }

  return successResult(GENERIC_VISIBILITY_SAVED);
}

export async function assertCurrentVerifiedAdmissionsOfficer(): Promise<ApplicationUser | null> {
  const user = await getCurrentApplicationUser();

  if (
    !user ||
    user.role !== 'admissions_officer' ||
    user.account_status !== 'verified'
  ) {
    return null;
  }

  return user;
}

export async function listAdmissionsVisibleStudents(
  filters?: AdmissionsDiscoveryFilters,
): Promise<AdmissionsVisibleStudentSummary[]> {
  const user = await assertCurrentVerifiedAdmissionsOfficer();
  if (!user) {
    return [];
  }

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('student_profiles')
    .select('id, preferred_name, country, city_region, intended_major');

  if (filters?.country) {
    query = query.ilike('country', `%${escapeLikePattern(filters.country)}%`);
  }
  if (filters?.major) {
    query = query.ilike('intended_major', `%${escapeLikePattern(filters.major)}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    studentProfileId: row.id as string,
    preferredName: (row.preferred_name as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    cityRegion: (row.city_region as string | null) ?? null,
    intendedMajor: (row.intended_major as string | null) ?? null,
  }));
}

export async function getAdmissionsVisibleStudentProfileReadOnly(
  studentProfileId: unknown,
): Promise<StudentProfileAggregate | null> {
  const user = await assertCurrentVerifiedAdmissionsOfficer();
  if (!user) {
    return null;
  }
  if (typeof studentProfileId !== 'string' || studentProfileId.trim().length === 0) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  const { data: profile, error: profileError } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('id', studentProfileId)
    .maybeSingle<StudentProfile>();

  if (profileError || !profile) {
    return null;
  }

  const [academicResult, activitiesResult, achievementsResult] = await Promise.all([
    supabase
      .from('academic_backgrounds')
      .select('*')
      .eq('student_profile_id', profile.id)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('profile_activities')
      .select('*')
      .eq('student_profile_id', profile.id)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('profile_achievements')
      .select('*')
      .eq('student_profile_id', profile.id)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true }),
  ]);

  if (academicResult.error || activitiesResult.error || achievementsResult.error) {
    return null;
  }

  const academicBackgrounds = (academicResult.data ?? []) as AcademicBackground[];
  const activities = (activitiesResult.data ?? []) as ProfileActivity[];
  const achievements = (achievementsResult.data ?? []) as ProfileAchievement[];

  return {
    profile,
    academicBackgrounds,
    activities,
    achievements,
    completion: calculateStudentProfileCompletion({
      profile,
      academicBackgrounds,
      activities,
      achievements,
    }),
  };
}
