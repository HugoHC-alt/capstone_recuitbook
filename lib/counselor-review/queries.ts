import 'server-only';

import { getCurrentApplicationUser } from '@/lib/auth/get-current-application-user';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { assertCurrentActiveStudent } from '@/lib/student-profile/queries';
import { assertCurrentVerifiedCounselor } from '@/lib/counselor-link/queries';
import {
  COUNSELOR_REVIEW_STATUS_LABELS,
  type CounselorReviewActionResult,
  type CounselorReviewQueueSummary,
  type CounselorReviewRequest,
  type StudentReviewRequestSummary,
} from '@/lib/counselor-review/types';
import {
  validateFeedbackText,
  validateStudentMessage,
} from '@/lib/counselor-review/validation';

const NOT_ACTIVE_STUDENT = 'You are not signed in as an active student.';
const NOT_VERIFIED_COUNSELOR = 'You are not signed in as a verified counselor.';
const GENERIC_ACTION_ERROR = 'Could not complete that action. Please try again.';
const GENERIC_REVIEW_REQUESTED = 'Your review request has been recorded.';
const GENERIC_REVIEW_WITHDRAWN = 'The review request has been withdrawn.';
const GENERIC_REVIEW_DECLINED = 'You declined the review request.';
const GENERIC_REVIEW_COMPLETED = 'You completed the review with feedback.';

function errorResult(message: string): CounselorReviewActionResult {
  return { error: message, success: null };
}

function successResult(message: string): CounselorReviewActionResult {
  return { error: null, success: message };
}

export async function requestCounselorReview(
  linkId: unknown,
  studentMessage: unknown,
): Promise<CounselorReviewActionResult> {
  const user = await assertCurrentActiveStudent();
  if (!user) {
    return errorResult(NOT_ACTIVE_STUDENT);
  }
  if (typeof linkId !== 'string' || linkId.trim().length === 0) {
    return errorResult(GENERIC_ACTION_ERROR);
  }

  const validatedMessage = validateStudentMessage(studentMessage);
  if ('error' in validatedMessage) {
    return errorResult(validatedMessage.error);
  }

  const supabase = await createSupabaseServerClient();

  const { data: link, error: linkError } = await supabase
    .from('counselor_student_links')
    .select('counselor_application_user_id, status')
    .eq('id', linkId)
    .eq('student_application_user_id', user.id)
    .maybeSingle<{
      counselor_application_user_id: string | null;
      status: string;
    }>();

  if (linkError) {
    return errorResult(GENERIC_ACTION_ERROR);
  }
  if (
    !link ||
    link.status !== 'accepted' ||
    typeof link.counselor_application_user_id !== 'string'
  ) {
    return errorResult(GENERIC_ACTION_ERROR);
  }

  const { error } = await supabase.from('counselor_review_requests').insert({
    counselor_student_link_id: linkId,
    student_application_user_id: user.id,
    counselor_application_user_id: link.counselor_application_user_id,
    student_message: validatedMessage.value,
  });

  if (error) {
    if (error.code === '23505') {
      return successResult(GENERIC_REVIEW_REQUESTED);
    }
    return errorResult(GENERIC_ACTION_ERROR);
  }

  return successResult(GENERIC_REVIEW_REQUESTED);
}

export async function listMyCounselorReviewRequests(): Promise<StudentReviewRequestSummary[]> {
  const user = await getCurrentApplicationUser();
  if (!user) {
    return [];
  }

  const supabase = await createSupabaseServerClient();

  const { data: requests, error } = await supabase
    .from('counselor_review_requests')
    .select('*')
    .eq('student_application_user_id', user.id)
    .order('requested_at', { ascending: false });

  if (error || !requests || requests.length === 0) {
    return [];
  }

  const rows = requests as CounselorReviewRequest[];
  const requestIds = rows.map((r) => r.id);

  const { data: notes } = await supabase
    .from('counselor_feedback_notes')
    .select('counselor_review_request_id, feedback_text')
    .in('counselor_review_request_id', requestIds);

  const feedbackByRequest = new Map<string, string>();
  for (const n of notes ?? []) {
    feedbackByRequest.set(
      n.counselor_review_request_id as string,
      n.feedback_text as string,
    );
  }

  return rows.map((row) => ({
    id: row.id,
    linkId: row.counselor_student_link_id,
    status: row.status,
    statusLabel: COUNSELOR_REVIEW_STATUS_LABELS[row.status],
    requestedAt: row.requested_at,
    respondedAt: row.responded_at,
    withdrawnAt: row.withdrawn_at,
    canWithdraw: row.status === 'requested',
    feedbackText: feedbackByRequest.get(row.id) ?? null,
  }));
}

export async function withdrawCounselorReviewRequest(
  requestId: unknown,
): Promise<CounselorReviewActionResult> {
  const user = await assertCurrentActiveStudent();
  if (!user) {
    return errorResult(NOT_ACTIVE_STUDENT);
  }
  if (typeof requestId !== 'string' || requestId.trim().length === 0) {
    return errorResult(GENERIC_ACTION_ERROR);
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('counselor_review_requests')
    .update({ status: 'withdrawn', withdrawn_at: new Date().toISOString() })
    .eq('id', requestId)
    .select('id');

  if (error) {
    return errorResult(GENERIC_ACTION_ERROR);
  }
  if (!data || data.length === 0) {
    return errorResult(GENERIC_ACTION_ERROR);
  }

  return successResult(GENERIC_REVIEW_WITHDRAWN);
}

export async function listPendingCounselorReviewRequests(): Promise<CounselorReviewQueueSummary[]> {
  const user = await assertCurrentVerifiedCounselor();
  if (!user) {
    return [];
  }

  const supabase = await createSupabaseServerClient();

  const { data: requests, error } = await supabase
    .from('counselor_review_requests')
    .select(
      'id, counselor_student_link_id, student_application_user_id, student_message, requested_at',
    )
    .eq('status', 'requested')
    .order('requested_at', { ascending: false });

  if (error || !requests || requests.length === 0) {
    return [];
  }

  const studentIds = requests.map((r) => r.student_application_user_id as string);

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

  return requests.map((r) => {
    const profile = profileByStudent.get(r.student_application_user_id as string);
    return {
      requestId: r.id as string,
      counselorStudentLinkId: r.counselor_student_link_id as string,
      studentApplicationUserId: r.student_application_user_id as string,
      studentProfileId: profile?.id ?? null,
      preferredName: profile?.preferred_name ?? null,
      country: profile?.country ?? null,
      studentMessage: (r.student_message as string | null) ?? null,
      requestedAt: r.requested_at as string,
    };
  });
}

export async function declineCounselorReviewRequest(
  requestId: unknown,
): Promise<CounselorReviewActionResult> {
  const user = await assertCurrentVerifiedCounselor();
  if (!user) {
    return errorResult(NOT_VERIFIED_COUNSELOR);
  }
  if (typeof requestId !== 'string' || requestId.trim().length === 0) {
    return errorResult(GENERIC_ACTION_ERROR);
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('counselor_review_requests')
    .update({ status: 'declined', responded_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('status', 'requested')
    .select('id');

  if (error) {
    return errorResult(GENERIC_ACTION_ERROR);
  }
  if (!data || data.length === 0) {
    return errorResult(GENERIC_ACTION_ERROR);
  }

  return successResult(GENERIC_REVIEW_DECLINED);
}

export async function completeCounselorReviewRequest(
  requestId: unknown,
  feedbackText: unknown,
): Promise<CounselorReviewActionResult> {
  const user = await assertCurrentVerifiedCounselor();
  if (!user) {
    return errorResult(NOT_VERIFIED_COUNSELOR);
  }
  if (typeof requestId !== 'string' || requestId.trim().length === 0) {
    return errorResult(GENERIC_ACTION_ERROR);
  }

  const validatedFeedback = validateFeedbackText(feedbackText);
  if ('error' in validatedFeedback) {
    return errorResult(validatedFeedback.error);
  }

  const supabase = await createSupabaseServerClient();

  const { error: insertError } = await supabase
    .from('counselor_feedback_notes')
    .insert({
      counselor_review_request_id: requestId,
      counselor_application_user_id: user.id,
      feedback_text: validatedFeedback.value,
    });

  if (insertError && insertError.code !== '23505') {
    return errorResult(GENERIC_ACTION_ERROR);
  }

  const { data, error } = await supabase
    .from('counselor_review_requests')
    .update({ status: 'completed', responded_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('status', 'requested')
    .select('id');

  if (error) {
    return errorResult(GENERIC_ACTION_ERROR);
  }
  if (!data || data.length === 0) {
    return errorResult(GENERIC_ACTION_ERROR);
  }

  return successResult(GENERIC_REVIEW_COMPLETED);
}
