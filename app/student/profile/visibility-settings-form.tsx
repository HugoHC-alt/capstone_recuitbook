'use client';

import { useActionState } from 'react';

import {
  INITIAL_PROFILE_VISIBILITY_ACTION_RESULT,
  type ProfileVisibilityActionResult,
} from '@/lib/admissions-discovery/types';
import { ActionFeedback } from '@/components/ui/action-feedback';
import { PillButton } from '@/components/ui/pill-button';

interface VisibilitySettingsFormProps {
  action: (
    prevState: ProfileVisibilityActionResult,
    formData: FormData,
  ) => Promise<ProfileVisibilityActionResult>;
  isPublished: boolean;
  admissionsConsent: boolean;
}

export function VisibilitySettingsForm({
  action,
  isPublished,
  admissionsConsent,
}: VisibilitySettingsFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    INITIAL_PROFILE_VISIBILITY_ACTION_RESULT,
  );

  return (
    <form action={formAction} className="flex flex-col gap-16">
      <ActionFeedback error={state.error} success={state.success} />

      <div>
        <label
          htmlFor="is_published"
          className="flex items-center gap-8 text-body text-ink-black"
        >
          <input
            id="is_published"
            name="is_published"
            type="checkbox"
            defaultChecked={isPublished}
          />
          Publish my profile
        </label>
      </div>

      <div>
        <label
          htmlFor="admissions_consent"
          className="flex items-center gap-8 text-body text-ink-black"
        >
          <input
            id="admissions_consent"
            name="admissions_consent"
            type="checkbox"
            defaultChecked={admissionsConsent}
          />
          I consent to admissions officers viewing my profile
        </label>
      </div>

      <div>
        <PillButton type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save visibility settings'}
        </PillButton>
      </div>
    </form>
  );
}
