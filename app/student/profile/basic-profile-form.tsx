'use client';

import { useActionState } from 'react';

import {
  INITIAL_PROFILE_ACTION_STATE,
  type ProfileActionState,
} from './action-state';
import { ActionFeedback } from '@/components/ui/action-feedback';
import { PillButton } from '@/components/ui/pill-button';

const labelClasses = 'block text-caption font-medium text-ash-gray mb-4';
const inputClasses =
  'w-full rounded-lg border border-fog-gray bg-pure-white px-12 py-8 text-body text-ink-black';

interface BasicProfileFormProps {
  action: (
    prevState: ProfileActionState,
    formData: FormData,
  ) => Promise<ProfileActionState>;
  preferredName: string | null;
  country: string | null;
  cityRegion: string | null;
  intendedMajor: string | null;
}

export function BasicProfileForm({
  action,
  preferredName,
  country,
  cityRegion,
  intendedMajor,
}: BasicProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    INITIAL_PROFILE_ACTION_STATE,
  );

  return (
    <form action={formAction} className="flex flex-col gap-16">
      <ActionFeedback error={state.error} success={state.success} />

      <div>
        <label htmlFor="preferred_name" className={labelClasses}>
          Preferred name
        </label>
        <input
          id="preferred_name"
          name="preferred_name"
          type="text"
          maxLength={100}
          defaultValue={preferredName ?? ''}
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="country" className={labelClasses}>
          Country
        </label>
        <input
          id="country"
          name="country"
          type="text"
          maxLength={100}
          defaultValue={country ?? ''}
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="city_region" className={labelClasses}>
          City / region
        </label>
        <input
          id="city_region"
          name="city_region"
          type="text"
          maxLength={100}
          defaultValue={cityRegion ?? ''}
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="intended_major" className={labelClasses}>
          Intended major
        </label>
        <input
          id="intended_major"
          name="intended_major"
          type="text"
          maxLength={100}
          defaultValue={intendedMajor ?? ''}
          className={inputClasses}
        />
      </div>

      <div>
        <PillButton type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save basic profile'}
        </PillButton>
      </div>
    </form>
  );
}
