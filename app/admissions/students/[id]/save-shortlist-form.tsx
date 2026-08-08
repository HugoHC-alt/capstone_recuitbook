'use client';

import { useActionState } from 'react';

import {
  INITIAL_ADMISSIONS_SHORTLIST_ACTION_RESULT,
  type AdmissionsShortlistActionResult,
} from '@/lib/admissions-shortlist/types';
import { ActionFeedback } from '@/components/ui/action-feedback';
import { PillButton } from '@/components/ui/pill-button';

interface SaveToShortlistFormProps {
  action: (
    prevState: AdmissionsShortlistActionResult,
    formData: FormData,
  ) => Promise<AdmissionsShortlistActionResult>;
  studentProfileId: string;
}

export function SaveToShortlistForm({
  action,
  studentProfileId,
}: SaveToShortlistFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    INITIAL_ADMISSIONS_SHORTLIST_ACTION_RESULT,
  );

  return (
    <form action={formAction} className="flex flex-col gap-8">

      <input type="hidden" name="student_profile_id" value={studentProfileId} />
      <ActionFeedback error={state.error} success={state.success} />
      <div>
        <PillButton type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save to shortlist'}
        </PillButton>
      </div>
    </form>
  );
}
