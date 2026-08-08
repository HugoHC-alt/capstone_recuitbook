'use server';

import { revalidatePath } from 'next/cache';

import type { AdmissionsShortlistActionResult } from '@/lib/admissions-shortlist/types';
import { saveAdmissionsShortlistEntry } from '@/lib/admissions-shortlist/queries';

export async function saveToShortlistAction(
  _prevState: AdmissionsShortlistActionResult,
  formData: FormData,
): Promise<AdmissionsShortlistActionResult> {
  const studentProfileId = formData.get('student_profile_id');
  const result = await saveAdmissionsShortlistEntry(studentProfileId);
  if (!result.error) {
    const idForPath = typeof studentProfileId === 'string' ? studentProfileId : '';
    revalidatePath('/admissions/students/' + idForPath);
  }
  return result;
}
