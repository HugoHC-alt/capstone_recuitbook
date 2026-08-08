'use server';

import { revalidatePath } from 'next/cache';

import type { CounselorLinkActionResult } from '@/lib/counselor-link/types';
import {
  requestCounselorLink,
  revokeCounselorLink,
} from '@/lib/counselor-link/queries';
import type { CounselorReviewActionResult } from '@/lib/counselor-review/types';
import {
  requestCounselorReview,
  withdrawCounselorReviewRequest,
} from '@/lib/counselor-review/queries';

const STUDENT_COUNSELOR_PATH = '/student/counselor';

export async function requestCounselorLinkAction(
  _prevState: CounselorLinkActionResult,
  formData: FormData,
): Promise<CounselorLinkActionResult> {
  const result = await requestCounselorLink(formData.get('counselor_email'));
  if (!result.error) {
    revalidatePath(STUDENT_COUNSELOR_PATH);
  }
  return result;
}

export async function revokeCounselorLinkAction(
  _prevState: CounselorLinkActionResult,
  formData: FormData,
): Promise<CounselorLinkActionResult> {
  const result = await revokeCounselorLink(formData.get('link_id'));
  if (!result.error) {
    revalidatePath(STUDENT_COUNSELOR_PATH);
  }
  return result;
}

export async function requestCounselorReviewAction(
  _prevState: CounselorReviewActionResult,
  formData: FormData,
): Promise<CounselorReviewActionResult> {
  const result = await requestCounselorReview(
    formData.get('link_id'),
    formData.get('student_message'),
  );
  if (!result.error) {
    revalidatePath(STUDENT_COUNSELOR_PATH);
  }
  return result;
}

export async function withdrawCounselorReviewRequestAction(
  _prevState: CounselorReviewActionResult,
  formData: FormData,
): Promise<CounselorReviewActionResult> {
  const result = await withdrawCounselorReviewRequest(formData.get('request_id'));
  if (!result.error) {
    revalidatePath(STUDENT_COUNSELOR_PATH);
  }
  return result;
}
