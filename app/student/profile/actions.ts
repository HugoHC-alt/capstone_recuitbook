'use server';

import { revalidatePath } from 'next/cache';

import type { ProfileActionState } from './action-state';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  assertCurrentActiveStudent,
  getOrCreateCurrentStudentProfile,
} from '@/lib/student-profile/queries';
import {
  PROFILE_YEAR_MAX,
  PROFILE_YEAR_MIN,
  STUDENT_PROFILE_MAX_LENGTHS,
  trimToNull,
} from '@/lib/student-profile/validation';
import { saveCurrentStudentProfileVisibilitySettings } from '@/lib/admissions-discovery/queries';
import type { ProfileVisibilityActionResult } from '@/lib/admissions-discovery/types';

const STUDENT_DASHBOARD_PATH = '/student/dashboard';
const STUDENT_PROFILE_PATH = '/student/profile';

const NOT_ACTIVE_STUDENT = 'You are not signed in as an active student.';
const GENERIC_SAVE_ERROR = 'Could not save your changes. Please try again.';
const GENERIC_DELETE_ERROR = 'Could not delete that entry. Please try again.';
const YEAR_ORDER_ERROR = 'End year must be the same as or after the start year.';

function errorState(message: string): ProfileActionState {
  return { error: message, success: null };
}

function successState(message: string): ProfileActionState {
  return { error: null, success: message };
}

function validateRequiredText(
  raw: FormDataEntryValue | null,
  max: number,
): { value: string } | { error: ProfileActionState } {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (value.length === 0) {
    return { error: errorState('This field is required.') };
  }
  if (value.length > max) {
    return { error: errorState(`Please keep this under ${max} characters.`) };
  }
  return { value };
}

function validateOptionalText(
  raw: FormDataEntryValue | null,
  max: number,
): { value: string | null } | { error: ProfileActionState } {
  const value = trimToNull(raw);
  if (value !== null && value.length > max) {
    return { error: errorState(`Please keep each field under ${max} characters.`) };
  }
  return { value };
}

function validateOptionalYear(
  raw: FormDataEntryValue | null,
): { value: number | null } | { error: ProfileActionState } {
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (text.length === 0) {
    return { value: null };
  }
  if (!/^\d+$/.test(text)) {
    return { error: errorState('Year must be a whole number.') };
  }
  const year = Number.parseInt(text, 10);
  if (
    !Number.isInteger(year) ||
    year < PROFILE_YEAR_MIN ||
    year > PROFILE_YEAR_MAX
  ) {
    return {
      error: errorState(
        `Year must be between ${PROFILE_YEAR_MIN} and ${PROFILE_YEAR_MAX}.`,
      ),
    };
  }
  return { value: year };
}

function revalidateProfileViews(): void {
  revalidatePath(STUDENT_DASHBOARD_PATH);
  revalidatePath(STUDENT_PROFILE_PATH);
}

export async function saveBasicProfileAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await assertCurrentActiveStudent();
  if (!user) {
    return errorState(NOT_ACTIVE_STUDENT);
  }

  const preferredName = validateOptionalText(
    formData.get('preferred_name'),
    STUDENT_PROFILE_MAX_LENGTHS.preferred_name,
  );
  if ('error' in preferredName) return preferredName.error;

  const country = validateOptionalText(
    formData.get('country'),
    STUDENT_PROFILE_MAX_LENGTHS.country,
  );
  if ('error' in country) return country.error;

  const cityRegion = validateOptionalText(
    formData.get('city_region'),
    STUDENT_PROFILE_MAX_LENGTHS.city_region,
  );
  if ('error' in cityRegion) return cityRegion.error;

  const intendedMajor = validateOptionalText(
    formData.get('intended_major'),
    STUDENT_PROFILE_MAX_LENGTHS.intended_major,
  );
  if ('error' in intendedMajor) return intendedMajor.error;

  let profileId: string;
  try {
    const profile = await getOrCreateCurrentStudentProfile();
    profileId = profile.id;
  } catch {
    return errorState(GENERIC_SAVE_ERROR);
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('student_profiles')
    .update({
      preferred_name: preferredName.value,
      country: country.value,
      city_region: cityRegion.value,
      intended_major: intendedMajor.value,
    })
    .eq('id', profileId);

  if (error) {
    return errorState(GENERIC_SAVE_ERROR);
  }

  revalidateProfileViews();
  return successState('Basic profile saved.');
}

export async function saveNarrativesAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await assertCurrentActiveStudent();
  if (!user) {
    return errorState(NOT_ACTIVE_STUDENT);
  }

  const narrativeBackground = validateOptionalText(
    formData.get('narrative_background'),
    STUDENT_PROFILE_MAX_LENGTHS.narrative,
  );
  if ('error' in narrativeBackground) return narrativeBackground.error;

  const narrativeGoals = validateOptionalText(
    formData.get('narrative_goals'),
    STUDENT_PROFILE_MAX_LENGTHS.narrative,
  );
  if ('error' in narrativeGoals) return narrativeGoals.error;

  const narrativeActivitiesSummary = validateOptionalText(
    formData.get('narrative_activities_summary'),
    STUDENT_PROFILE_MAX_LENGTHS.narrative,
  );
  if ('error' in narrativeActivitiesSummary) {
    return narrativeActivitiesSummary.error;
  }

  let profileId: string;
  try {
    const profile = await getOrCreateCurrentStudentProfile();
    profileId = profile.id;
  } catch {
    return errorState(GENERIC_SAVE_ERROR);
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('student_profiles')
    .update({
      narrative_background: narrativeBackground.value,
      narrative_goals: narrativeGoals.value,
      narrative_activities_summary: narrativeActivitiesSummary.value,
    })
    .eq('id', profileId);

  if (error) {
    return errorState(GENERIC_SAVE_ERROR);
  }

  revalidateProfileViews();
  return successState('Narratives saved.');
}

export async function addAcademicBackgroundAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await assertCurrentActiveStudent();
  if (!user) {
    return errorState(NOT_ACTIVE_STUDENT);
  }

  const schoolName = validateRequiredText(
    formData.get('school_name'),
    STUDENT_PROFILE_MAX_LENGTHS.school_name,
  );
  if ('error' in schoolName) return schoolName.error;

  const country = validateOptionalText(
    formData.get('country'),
    STUDENT_PROFILE_MAX_LENGTHS.child_country,
  );
  if ('error' in country) return country.error;

  const curriculum = validateOptionalText(
    formData.get('curriculum'),
    STUDENT_PROFILE_MAX_LENGTHS.curriculum,
  );
  if ('error' in curriculum) return curriculum.error;

  const academicSummary = validateOptionalText(
    formData.get('academic_summary'),
    STUDENT_PROFILE_MAX_LENGTHS.academic_summary,
  );
  if ('error' in academicSummary) return academicSummary.error;

  const graduationYear = validateOptionalYear(formData.get('graduation_year'));
  if ('error' in graduationYear) return graduationYear.error;

  let profileId: string;
  try {
    const profile = await getOrCreateCurrentStudentProfile();
    profileId = profile.id;
  } catch {
    return errorState(GENERIC_SAVE_ERROR);
  }

  const supabase = await createSupabaseServerClient();

  const { count, error: countError } = await supabase
    .from('academic_backgrounds')
    .select('id', { count: 'exact', head: true })
    .eq('student_profile_id', profileId);

  if (countError) {
    return errorState(GENERIC_SAVE_ERROR);
  }

  const { error } = await supabase.from('academic_backgrounds').insert({
    student_profile_id: profileId,
    school_name: schoolName.value,
    country: country.value,
    curriculum: curriculum.value,
    graduation_year: graduationYear.value,
    academic_summary: academicSummary.value,
    position: count ?? 0,
  });

  if (error) {
    return errorState(GENERIC_SAVE_ERROR);
  }

  revalidateProfileViews();
  return successState('Academic background added.');
}

export async function updateAcademicBackgroundAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await assertCurrentActiveStudent();
  if (!user) {
    return errorState(NOT_ACTIVE_STUDENT);
  }

  const academicId = formData.get('academic_background_id');
  if (typeof academicId !== 'string' || academicId.trim().length === 0) {
    return errorState(GENERIC_SAVE_ERROR);
  }

  const schoolName = validateRequiredText(
    formData.get('school_name'),
    STUDENT_PROFILE_MAX_LENGTHS.school_name,
  );
  if ('error' in schoolName) return schoolName.error;

  const country = validateOptionalText(
    formData.get('country'),
    STUDENT_PROFILE_MAX_LENGTHS.child_country,
  );
  if ('error' in country) return country.error;

  const curriculum = validateOptionalText(
    formData.get('curriculum'),
    STUDENT_PROFILE_MAX_LENGTHS.curriculum,
  );
  if ('error' in curriculum) return curriculum.error;

  const academicSummary = validateOptionalText(
    formData.get('academic_summary'),
    STUDENT_PROFILE_MAX_LENGTHS.academic_summary,
  );
  if ('error' in academicSummary) return academicSummary.error;

  const graduationYear = validateOptionalYear(formData.get('graduation_year'));
  if ('error' in graduationYear) return graduationYear.error;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('academic_backgrounds')
    .update({
      school_name: schoolName.value,
      country: country.value,
      curriculum: curriculum.value,
      graduation_year: graduationYear.value,
      academic_summary: academicSummary.value,
    })
    .eq('id', academicId)
    .select('id');

  if (error) {
    return errorState(GENERIC_SAVE_ERROR);
  }

  if (!data || data.length === 0) {
    return errorState(GENERIC_SAVE_ERROR);
  }

  revalidateProfileViews();
  return successState('Academic background updated.');
}

export async function deleteAcademicBackgroundAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await assertCurrentActiveStudent();
  if (!user) {
    return errorState(NOT_ACTIVE_STUDENT);
  }

  const academicId = formData.get('academic_background_id');
  if (typeof academicId !== 'string' || academicId.trim().length === 0) {
    return errorState(GENERIC_DELETE_ERROR);
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('academic_backgrounds')
    .delete()
    .eq('id', academicId)
    .select('id');

  if (error) {
    return errorState(GENERIC_DELETE_ERROR);
  }

  if (!data || data.length === 0) {
    return errorState(GENERIC_DELETE_ERROR);
  }

  revalidateProfileViews();
  return successState('Academic background deleted.');
}

export async function addActivityAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await assertCurrentActiveStudent();
  if (!user) {
    return errorState(NOT_ACTIVE_STUDENT);
  }

  const title = validateRequiredText(
    formData.get('title'),
    STUDENT_PROFILE_MAX_LENGTHS.title,
  );
  if ('error' in title) return title.error;

  const organization = validateOptionalText(
    formData.get('organization'),
    STUDENT_PROFILE_MAX_LENGTHS.organization,
  );
  if ('error' in organization) return organization.error;

  const description = validateOptionalText(
    formData.get('description'),
    STUDENT_PROFILE_MAX_LENGTHS.description,
  );
  if ('error' in description) return description.error;

  const startYear = validateOptionalYear(formData.get('start_year'));
  if ('error' in startYear) return startYear.error;

  const endYear = validateOptionalYear(formData.get('end_year'));
  if ('error' in endYear) return endYear.error;

  if (
    startYear.value !== null &&
    endYear.value !== null &&
    endYear.value < startYear.value
  ) {
    return errorState(YEAR_ORDER_ERROR);
  }

  let profileId: string;
  try {
    const profile = await getOrCreateCurrentStudentProfile();
    profileId = profile.id;
  } catch {
    return errorState(GENERIC_SAVE_ERROR);
  }

  const supabase = await createSupabaseServerClient();

  const { count, error: countError } = await supabase
    .from('profile_activities')
    .select('id', { count: 'exact', head: true })
    .eq('student_profile_id', profileId);

  if (countError) {
    return errorState(GENERIC_SAVE_ERROR);
  }

  const { error } = await supabase.from('profile_activities').insert({
    student_profile_id: profileId,
    title: title.value,
    organization: organization.value,
    description: description.value,
    start_year: startYear.value,
    end_year: endYear.value,
    position: count ?? 0,
  });

  if (error) {
    return errorState(GENERIC_SAVE_ERROR);
  }

  revalidateProfileViews();
  return successState('Activity added.');
}

export async function updateActivityAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await assertCurrentActiveStudent();
  if (!user) {
    return errorState(NOT_ACTIVE_STUDENT);
  }

  const activityId = formData.get('activity_id');
  if (typeof activityId !== 'string' || activityId.trim().length === 0) {
    return errorState(GENERIC_SAVE_ERROR);
  }

  const title = validateRequiredText(
    formData.get('title'),
    STUDENT_PROFILE_MAX_LENGTHS.title,
  );
  if ('error' in title) return title.error;

  const organization = validateOptionalText(
    formData.get('organization'),
    STUDENT_PROFILE_MAX_LENGTHS.organization,
  );
  if ('error' in organization) return organization.error;

  const description = validateOptionalText(
    formData.get('description'),
    STUDENT_PROFILE_MAX_LENGTHS.description,
  );
  if ('error' in description) return description.error;

  const startYear = validateOptionalYear(formData.get('start_year'));
  if ('error' in startYear) return startYear.error;

  const endYear = validateOptionalYear(formData.get('end_year'));
  if ('error' in endYear) return endYear.error;

  if (
    startYear.value !== null &&
    endYear.value !== null &&
    endYear.value < startYear.value
  ) {
    return errorState(YEAR_ORDER_ERROR);
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('profile_activities')
    .update({
      title: title.value,
      organization: organization.value,
      description: description.value,
      start_year: startYear.value,
      end_year: endYear.value,
    })
    .eq('id', activityId)
    .select('id');

  if (error) {
    return errorState(GENERIC_SAVE_ERROR);
  }

  if (!data || data.length === 0) {
    return errorState(GENERIC_SAVE_ERROR);
  }

  revalidateProfileViews();
  return successState('Activity updated.');
}

export async function deleteActivityAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await assertCurrentActiveStudent();
  if (!user) {
    return errorState(NOT_ACTIVE_STUDENT);
  }

  const activityId = formData.get('activity_id');
  if (typeof activityId !== 'string' || activityId.trim().length === 0) {
    return errorState(GENERIC_DELETE_ERROR);
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('profile_activities')
    .delete()
    .eq('id', activityId)
    .select('id');

  if (error) {
    return errorState(GENERIC_DELETE_ERROR);
  }

  if (!data || data.length === 0) {
    return errorState(GENERIC_DELETE_ERROR);
  }

  revalidateProfileViews();
  return successState('Activity deleted.');
}

export async function addAchievementAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await assertCurrentActiveStudent();
  if (!user) {
    return errorState(NOT_ACTIVE_STUDENT);
  }

  const title = validateRequiredText(
    formData.get('title'),
    STUDENT_PROFILE_MAX_LENGTHS.title,
  );
  if ('error' in title) return title.error;

  const issuer = validateOptionalText(
    formData.get('issuer'),
    STUDENT_PROFILE_MAX_LENGTHS.issuer,
  );
  if ('error' in issuer) return issuer.error;

  const description = validateOptionalText(
    formData.get('description'),
    STUDENT_PROFILE_MAX_LENGTHS.description,
  );
  if ('error' in description) return description.error;

  const receivedYear = validateOptionalYear(formData.get('received_year'));
  if ('error' in receivedYear) return receivedYear.error;

  let profileId: string;
  try {
    const profile = await getOrCreateCurrentStudentProfile();
    profileId = profile.id;
  } catch {
    return errorState(GENERIC_SAVE_ERROR);
  }

  const supabase = await createSupabaseServerClient();

  const { count, error: countError } = await supabase
    .from('profile_achievements')
    .select('id', { count: 'exact', head: true })
    .eq('student_profile_id', profileId);

  if (countError) {
    return errorState(GENERIC_SAVE_ERROR);
  }

  const { error } = await supabase.from('profile_achievements').insert({
    student_profile_id: profileId,
    title: title.value,
    issuer: issuer.value,
    description: description.value,
    received_year: receivedYear.value,
    position: count ?? 0,
  });

  if (error) {
    return errorState(GENERIC_SAVE_ERROR);
  }

  revalidateProfileViews();
  return successState('Achievement added.');
}

export async function updateAchievementAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await assertCurrentActiveStudent();
  if (!user) {
    return errorState(NOT_ACTIVE_STUDENT);
  }

  const achievementId = formData.get('achievement_id');
  if (typeof achievementId !== 'string' || achievementId.trim().length === 0) {
    return errorState(GENERIC_SAVE_ERROR);
  }

  const title = validateRequiredText(
    formData.get('title'),
    STUDENT_PROFILE_MAX_LENGTHS.title,
  );
  if ('error' in title) return title.error;

  const issuer = validateOptionalText(
    formData.get('issuer'),
    STUDENT_PROFILE_MAX_LENGTHS.issuer,
  );
  if ('error' in issuer) return issuer.error;

  const description = validateOptionalText(
    formData.get('description'),
    STUDENT_PROFILE_MAX_LENGTHS.description,
  );
  if ('error' in description) return description.error;

  const receivedYear = validateOptionalYear(formData.get('received_year'));
  if ('error' in receivedYear) return receivedYear.error;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('profile_achievements')
    .update({
      title: title.value,
      issuer: issuer.value,
      description: description.value,
      received_year: receivedYear.value,
    })
    .eq('id', achievementId)
    .select('id');

  if (error) {
    return errorState(GENERIC_SAVE_ERROR);
  }

  if (!data || data.length === 0) {
    return errorState(GENERIC_SAVE_ERROR);
  }

  revalidateProfileViews();
  return successState('Achievement updated.');
}

export async function deleteAchievementAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await assertCurrentActiveStudent();
  if (!user) {
    return errorState(NOT_ACTIVE_STUDENT);
  }

  const achievementId = formData.get('achievement_id');
  if (typeof achievementId !== 'string' || achievementId.trim().length === 0) {
    return errorState(GENERIC_DELETE_ERROR);
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('profile_achievements')
    .delete()
    .eq('id', achievementId)
    .select('id');

  if (error) {
    return errorState(GENERIC_DELETE_ERROR);
  }

  if (!data || data.length === 0) {
    return errorState(GENERIC_DELETE_ERROR);
  }

  revalidateProfileViews();
  return successState('Achievement deleted.');
}

export async function saveVisibilitySettingsAction(
  _prevState: ProfileVisibilityActionResult,
  formData: FormData,
): Promise<ProfileVisibilityActionResult> {
  const user = await assertCurrentActiveStudent();
  if (!user) {
    return errorState(NOT_ACTIVE_STUDENT);
  }

  const isPublished = formData.get('is_published') !== null;
  const admissionsConsent = formData.get('admissions_consent') !== null;

  const result = await saveCurrentStudentProfileVisibilitySettings({
    isPublished,
    admissionsConsent,
  });

  if (result.success) {
    revalidateProfileViews();
  }

  return result;
}
