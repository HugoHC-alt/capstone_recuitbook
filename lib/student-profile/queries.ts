import 'server-only';

import { getCurrentApplicationUser } from '@/lib/auth/get-current-application-user';
import type { ApplicationUser } from '@/lib/auth/types';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { calculateStudentProfileCompletion } from '@/lib/student-profile/completion';
import type {
  AcademicBackground,
  ProfileAchievement,
  ProfileActivity,
  StudentProfile,
  StudentProfileAggregate,
} from '@/lib/student-profile/types';

const PROFILE_INIT_ERROR = 'Unable to initialize the student profile.';
const PROFILE_READ_ERROR = 'Unable to load the student profile.';

export async function assertCurrentActiveStudent(): Promise<ApplicationUser | null> {
  const user = await getCurrentApplicationUser();

  if (!user || user.role !== 'student' || user.account_status !== 'active') {
    return null;
  }

  return user;
}

export async function getCurrentStudentProfile(): Promise<StudentProfile | null> {
  const user = await assertCurrentActiveStudent();
  if (!user) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('application_user_id', user.id)
    .maybeSingle<StudentProfile>();

  if (error) {
    throw new Error(PROFILE_READ_ERROR);
  }

  return data ?? null;
}

export async function getCurrentStudentProfileAggregate(): Promise<StudentProfileAggregate | null> {
  const user = await assertCurrentActiveStudent();
  if (!user) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  const { data: profile, error: profileError } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('application_user_id', user.id)
    .maybeSingle<StudentProfile>();

  if (profileError) {
    throw new Error(PROFILE_READ_ERROR);
  }

  if (!profile) {
    return {
      profile: null,
      academicBackgrounds: [],
      activities: [],
      achievements: [],
      completion: calculateStudentProfileCompletion({
        profile: null,
        academicBackgrounds: [],
        activities: [],
        achievements: [],
      }),
    };
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
    throw new Error(PROFILE_READ_ERROR);
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

export async function getOrCreateCurrentStudentProfile(): Promise<StudentProfile> {
  const user = await assertCurrentActiveStudent();
  if (!user) {
    throw new Error(PROFILE_INIT_ERROR);
  }

  const supabase = await createSupabaseServerClient();

  const { data: existing, error: lookupError } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('application_user_id', user.id)
    .maybeSingle<StudentProfile>();

  if (lookupError) {
    throw new Error(PROFILE_INIT_ERROR);
  }

  if (existing) {
    return existing;
  }

  const { error: insertError } = await supabase
    .from('student_profiles')
    .insert({ application_user_id: user.id });

  if (insertError) {
    throw new Error(PROFILE_INIT_ERROR);
  }

  const { data: created, error: reloadError } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('application_user_id', user.id)
    .maybeSingle<StudentProfile>();

  if (reloadError || !created) {
    throw new Error(PROFILE_INIT_ERROR);
  }

  return created;
}
