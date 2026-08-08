'use client';

import { useActionState } from 'react';

import {
  INITIAL_PROFILE_ACTION_STATE,
  type ProfileActionState,
} from './action-state';
import { ActionFeedback } from '@/components/ui/action-feedback';
import { PillButton } from '@/components/ui/pill-button';

const labelClasses = 'block text-caption font-medium text-ash-gray mb-4';
const textareaClasses =
  'w-full rounded-lg border border-fog-gray bg-pure-white px-12 py-8 text-body text-ink-black';

interface NarrativesFormProps {
  action: (
    prevState: ProfileActionState,
    formData: FormData,
  ) => Promise<ProfileActionState>;
  narrativeBackground: string | null;
  narrativeGoals: string | null;
  narrativeActivitiesSummary: string | null;
}

export function NarrativesForm({
  action,
  narrativeBackground,
  narrativeGoals,
  narrativeActivitiesSummary,
}: NarrativesFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    INITIAL_PROFILE_ACTION_STATE,
  );

  return (
    <form action={formAction} className="flex flex-col gap-16">
      <ActionFeedback error={state.error} success={state.success} />

      <div>
        <label htmlFor="narrative_background" className={labelClasses}>
          Background and context
        </label>
        <textarea
          id="narrative_background"
          name="narrative_background"
          rows={5}
          maxLength={2000}
          defaultValue={narrativeBackground ?? ''}
          className={textareaClasses}
        />
      </div>

      <div>
        <label htmlFor="narrative_goals" className={labelClasses}>
          Academic and personal goals
        </label>
        <textarea
          id="narrative_goals"
          name="narrative_goals"
          rows={5}
          maxLength={2000}
          defaultValue={narrativeGoals ?? ''}
          className={textareaClasses}
        />
      </div>

      <div>
        <label htmlFor="narrative_activities_summary" className={labelClasses}>
          Activities and involvement summary
        </label>
        <textarea
          id="narrative_activities_summary"
          name="narrative_activities_summary"
          rows={5}
          maxLength={2000}
          defaultValue={narrativeActivitiesSummary ?? ''}
          className={textareaClasses}
        />
      </div>

      <div>
        <PillButton type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save narratives'}
        </PillButton>
      </div>
    </form>
  );
}
