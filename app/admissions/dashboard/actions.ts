'use server';

import { revalidatePath } from 'next/cache';

import type { AdmissionsShortlistActionResult } from '@/lib/admissions-shortlist/types';
import { removeAdmissionsShortlistEntry } from '@/lib/admissions-shortlist/queries';

export async function removeFromShortlistAction(
  _prevState: AdmissionsShortlistActionResult,
  formData: FormData,
): Promise<AdmissionsShortlistActionResult> {
  const entryId = formData.get('entry_id');
  const result = await removeAdmissionsShortlistEntry(entryId);
  if (!result.error) {
    revalidatePath('/admissions/dashboard');
  }
  return result;
}
