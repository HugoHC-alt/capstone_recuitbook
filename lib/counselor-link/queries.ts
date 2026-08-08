import 'server-only';

import { getCurrentApplicationUser } from '@/lib/auth/get-current-application-user';
import type { ApplicationUser } from '@/lib/auth/types';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { assertCurrentActiveStudent } from '@/lib/student-profile/queries';
import { calculateStudentProfileCompletion } from '@/lib/student-profile/completion';
import type {
  AcademicBackground,
  ProfileAchievement,
  ProfileActivity,
  StudentProfile,
  StudentProfileAggregate,
} from '@/lib/student-profile/types';
import {
  COUNSELOR_LINK_STATUS_LABELS,
  REVOCABLE_STATUSES,
  type CounselorLinkActionResult,
  type CounselorLinkedStudentSummary,
  type CounselorPendingRequestSummary,
  type CounselorStudentLink,
  type StudentCounselorLinkSummary,
} from '@/lib/counselor-link/types';
import { validateCounselorEmail } from '@/lib/counselor-link/validation';

const NOT_ACTIVE_STUDENT = 'You are not signed in as an active student.';
const NOT_VERIFIED_COUNSELOR = 'You are not signed in as a verified counselor.';
const GENERIC_ACTION_ERROR = 'Could not complete that action. Please try again.';
const GENERIC_REQUEST_RECORDED = 'Your counselor link request has been recorded.';
const GENERIC_LINK_REVOKED = 'The counselor link has been revoked.';
const GENERIC_REQUEST_ACCEPTED = 'You accepted the counselor link request.';
const GENERIC_REQUEST_DECLINED = 'You declined the counselor link request.';

function errorResult(message: string): CounselorLinkActionResult {
  return { error: message, success: null };
}

function successResult(message: string): CounselorLinkActionResult {
  return { error: null, success: message };
}

export async function assertCurrentVerifiedCounselor(): Promise<ApplicationUser | null> {
  const user = await getCurrentApplicationUser();

  if (!user || user.role !== 'counselor' || user.account_status !== 'verified') {
    return null;
  }

  return user;
}

export async function requestCounselorLink(
  counselorEmail: unknown,
): Promise<CounselorLinkActionResult> {
  const user = await assertCurrentActiveStudent();
  if (!user) {
    return errorResult(NOT_ACTIVE_STUDENT);
  }

  const validated = validateCounselorEmail(counselorEmail);
  if ('error' in validated) {
    return errorResult(validated.error);
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from('counselor_student_links').insert({
    student_application_user_id: user.id,
    counselor_email: validated.value,
  });

  if (error) {
    if (error.code === '23505') {
      return successResult(GENERIC_REQUEST_RECORDED);
    }
    return errorResult(GENERIC_ACTION_ERROR);
  }

  return successResult(GENERIC_REQUEST_RECORDED);
}

export async function listMyCounselorLinks(): Promise<StudentCounselorLinkSummary[]> {
  const user = await getCurrentApplicationUser();
  if (!user) {
    return [];
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('counselor_student_links')
    .select('*')
    .eq('student_application_user_id', user.id)
    .order('requested_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as CounselorStudentLink[]).map(toStudentLinkSummary);
}

export async function revokeCounselorLink(
  linkId: unknown,
): Promise<CounselorLinkActionResult> {
  const user = await assertCurrentActiveStudent();
  if (!user) {
    return errorResult(NOT_ACTIVE_STUDENT);
  }
  if (typeof linkId !== 'string' || linkId.trim().length === 0) {
    return errorResult(GENERIC_ACTION_ERROR);
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('counselor_student_links')
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('id', linkId)
    .select('id');

  if (error) {
    return errorResult(GENERIC_ACTION_ERROR);
  }
  if (!data || data.length === 0) {
    return errorResult(GENERIC_ACTION_ERROR);
  }

  return successResult(GENERIC_LINK_REVOKED);
}

export async function listPendingCounselorRequests(): Promise<CounselorPendingRequestSummary[]> {
  const user = await assertCurrentVerifiedCounselor();
  if (!user) {
    return [];
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('counselor_student_links')
    .select('id, student_application_user_id, requested_at')
    .eq('status', 'pending')
    .order('requested_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    studentApplicationUserId: row.student_application_user_id as string,
    requestedAt: row.requested_at as string,
  }));
}

export async function acceptCounselorRequest(
  linkId: unknown,
): Promise<CounselorLinkActionResult> {
  return respondToRequest(linkId, 'accepted', GENERIC_REQUEST_ACCEPTED);
}

export async function declineCounselorRequest(
  linkId: unknown,
): Promise<CounselorLinkActionResult> {
  return respondToRequest(linkId, 'declined', GENERIC_REQUEST_DECLINED);
}

async function respondToRequest(
  linkId: unknown,
  nextStatus: 'accepted' | 'declined',
  successMessage: string,
): Promise<CounselorLinkActionResult> {
  const user = await assertCurrentVerifiedCounselor();
  if (!user) {
    return errorResult(NOT_VERIFIED_COUNSELOR);
  }
  if (typeof linkId !== 'string' || linkId.trim().length === 0) {
    return errorResult(GENERIC_ACTION_ERROR);
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('counselor_student_links')
    .update({
      status: nextStatus,
      counselor_application_user_id: user.id,
      responded_at: new Date().toISOString(),
    })
    .eq('id', linkId)
    .select('id');

  if (error) {
    return errorResult(GENERIC_ACTION_ERROR);
  }
  if (!data || data.length === 0) {
    return errorResult(GENERIC_ACTION_ERROR);
  }

  return successResult(successMessage);
}

export async function listLinkedStudents(): Promise<CounselorLinkedStudentSummary[]> {
  const user = await assertCurrentVerifiedCounselor();
  if (!user) {
    return [];
  }

  const supabase = await createSupabaseServerClient();

  const { data: links, error: linksError } = await supabase
    .from('counselor_student_links')
    .select('id, student_application_user_id, responded_at')
    .eq('status', 'accepted')
    .eq('counselor_application_user_id', user.id)
    .order('responded_at', { ascending: false });

  if (linksError || !links || links.length === 0) {
    return [];
  }

  const studentIds = links.map((l) => l.student_application_user_id as string);

  const { data: profiles } = await supabase
    .from('student_profiles')
    .select('id, application_user_id, preferred_name, country')
    .in('application_user_id', studentIds);

  const profileByStudent = new Map<
    string,
    { id: string; preferred_name: string | null; country: string | null }
  >();
  for (const p of profiles ?? []) {
    profileByStudent.set(p.application_user_id as string, {
      id: p.id as string,
      preferred_name: (p.preferred_name as string | null) ?? null,
      country: (p.country as string | null) ?? null,
    });
  }

  return links.map((l) => {
    const profile = profileByStudent.get(l.student_application_user_id as string);
    return {
      linkId: l.id as string,
      studentApplicationUserId: l.student_application_user_id as string,
      studentProfileId: profile?.id ?? null,
      preferredName: profile?.preferred_name ?? null,
      country: profile?.country ?? null,
      linkedAt: (l.responded_at as string | null) ?? null,
    };
  });
}

export async function getLinkedStudentProfileReadOnly(
  studentProfileId: unknown,
): Promise<StudentProfileAggregate | null> {
  const user = await assertCurrentVerifiedCounselor();
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

function toStudentLinkSummary(row: CounselorStudentLink): StudentCounselorLinkSummary {
  return {
    id: row.id,
    counselorEmail: row.counselor_email,
    status: row.status,
    statusLabel: COUNSELOR_LINK_STATUS_LABELS[row.status],
    requestedAt: row.requested_at,
    respondedAt: row.responded_at,
    revokedAt: row.revoked_at,
    canRevoke: REVOCABLE_STATUSES.includes(row.status),
  };
}
