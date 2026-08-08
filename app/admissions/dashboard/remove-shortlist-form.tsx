'use client';

import { useActionState } from 'react';

import {
  INITIAL_ADMISSIONS_SHORTLIST_ACTION_RESULT,
  type AdmissionsShortlistActionResult,
} from '@/lib/admissions-shortlist/types';
import { ActionFeedback } from '@/components/ui/action-feedback';

interface RemoveFromShortlistFormProps {
  action: (
    prevState: AdmissionsShortlistActionResult,
    formData: FormData,
  ) => Promise<AdmissionsShortlistActionResult>;
  entryId: string;
}

const secondaryButtonClasses =
  'inline-flex items-center justify-center rounded-full border border-fog-gray px-24 py-12 text-body font-medium text-ink-black transition-colors duration-150 hover:bg-fog-gray disabled:opacity-60';

export function RemoveFromShortlistForm({
  action,
  entryId,
}: RemoveFromShortlistFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    INITIAL_ADMISSIONS_SHORTLIST_ACTION_RESULT,
  );

  return (
    <form action={formAction} className="flex flex-col gap-8">

      <input type="hidden" name="entry_id" value={entryId} />
      <ActionFeedback error={state.error} success={state.success} />
      <button type="submit" disabled={isPending} className={secondaryButtonClasses}>
        {isPending ? 'Removing…' : 'Remove'}
      </button>
    </form>
  );
}
