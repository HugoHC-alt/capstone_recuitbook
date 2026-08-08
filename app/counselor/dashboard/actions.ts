'use server';

import { revalidatePath } from 'next/cache';

import type { CounselorLinkActionResult } from '@/lib/counselor-link/types';
import {
  acceptCounselorRequest,
  declineCounselorRequest,
} from '@/lib/counselor-link/queries';
import type { CounselorReviewActionResult } from '@/lib/counselor-review/types';
import {
  completeCounselorReviewRequest,
  declineCounselorReviewRequest,
} from '@/lib/counselor-review/queries';

const COUNSELOR_DASHBOARD_PATH = '/counselor/dashboard';

export async function acceptLinkRequestAction(
  _prevState: CounselorLinkActionResult,
  formData: FormData,
): Promise<CounselorLinkActionResult> {
  const result = await acceptCounselorRequest(formData.get('link_id'));
  if (!result.error) {
    revalidatePath(COUNSELOR_DASHBOARD_PATH);
  }
  return result;
}

export async function declineLinkRequestAction(
  _prevState: CounselorLinkActionResult,
  formData: FormData,
): Promise<CounselorLinkActionResult> {
  const result = await declineCounselorRequest(formData.get('link_id'));
  if (!result.error) {
    revalidatePath(COUNSELOR_DASHBOARD_PATH);
  }
  return result;
}

export async function declineReviewRequestAction(
  _prevState: CounselorReviewActionResult,
  formData: FormData,
): Promise<CounselorReviewActionResult> {
  const result = await declineCounselorReviewRequest(
    formData.get('review_request_id'),
  );
  if (!result.error) {
    revalidatePath(COUNSELOR_DASHBOARD_PATH);
  }
  return result;
}

export async function completeReviewRequestAction(
  _prevState: CounselorReviewActionResult,
  formData: FormData,
): Promise<CounselorReviewActionResult> {
  const result = await completeCounselorReviewRequest(
    formData.get('review_request_id'),
    formData.get('feedback_text'),
  );
  if (!result.error) {
    revalidatePath(COUNSELOR_DASHBOARD_PATH);
    const studentProfileId = formData.get('student_profile_id');
    if (typeof studentProfileId === 'string' && studentProfileId.length > 0) {
      revalidatePath('/counselor/students/' + studentProfileId);
    }
  }
  return result;
}
