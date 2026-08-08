'use client';

import { useActionState } from 'react';

import type { ProfileActivity } from '@/lib/student-profile/types';
import {
  INITIAL_PROFILE_ACTION_STATE,
  type ProfileActionState,
} from './action-state';
import { ActionFeedback } from '@/components/ui/action-feedback';
import { Card } from '@/components/ui/card';
import { PillButton } from '@/components/ui/pill-button';

type ProfileAction = (
  prevState: ProfileActionState,
  formData: FormData,
) => Promise<ProfileActionState>;

interface ActivitiesSectionProps {
  activities: ProfileActivity[];
  addAction: ProfileAction;
  updateAction: ProfileAction;
  deleteAction: ProfileAction;
}

const labelClasses = 'block text-caption font-medium text-ash-gray mb-4';
const inputClasses =
  'w-full rounded-lg border border-fog-gray bg-pure-white px-12 py-8 text-body text-ink-black';
const secondaryButtonClasses =
  'inline-flex items-center justify-center rounded-full border border-fog-gray px-24 py-12 text-body font-medium text-ink-black transition-colors duration-150 hover:bg-fog-gray disabled:opacity-60';

function ActivityFields({
  idPrefix,
  entry,
}: {
  idPrefix: string;
  entry?: ProfileActivity;
}) {
  return (
    <div className="flex flex-col gap-16">
      <div>
        <label htmlFor={`${idPrefix}_title`} className={labelClasses}>
          Title (required)
        </label>
        <input
          id={`${idPrefix}_title`}
          name="title"
          type="text"
          maxLength={200}
          required
          defaultValue={entry?.title ?? ''}
          className={inputClasses}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}_organization`} className={labelClasses}>
          Organization
        </label>
        <input
          id={`${idPrefix}_organization`}
          name="organization"
          type="text"
          maxLength={200}
          defaultValue={entry?.organization ?? ''}
          className={inputClasses}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}_start_year`} className={labelClasses}>
          Start year
        </label>
        <input
          id={`${idPrefix}_start_year`}
          name="start_year"
          type="number"
          min={1900}
          max={2100}
          defaultValue={
            entry?.start_year != null ? String(entry.start_year) : ''
          }
          className={inputClasses}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}_end_year`} className={labelClasses}>
          End year
        </label>
        <input
          id={`${idPrefix}_end_year`}
          name="end_year"
          type="number"
          min={1900}
          max={2100}
          defaultValue={entry?.end_year != null ? String(entry.end_year) : ''}
          className={inputClasses}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}_description`} className={labelClasses}>
          Description
        </label>
        <textarea
          id={`${idPrefix}_description`}
          name="description"
          maxLength={1000}
          rows={3}
          defaultValue={entry?.description ?? ''}
          className={inputClasses}
        />
      </div>
    </div>
  );
}

function AddActivityForm({ addAction }: { addAction: ProfileAction }) {
  const [state, formAction, isPending] = useActionState(
    addAction,
    INITIAL_PROFILE_ACTION_STATE,
  );

  return (
    <form action={formAction} className="flex flex-col gap-16">
      <h3 className="font-serif text-body font-medium">Add activity</h3>
      <ActionFeedback error={state.error} success={state.success} />
      <ActivityFields idPrefix="add_activity" />
      <div>
        <PillButton type="submit" disabled={isPending}>
          {isPending ? 'Adding…' : 'Add activity'}
        </PillButton>
      </div>
    </form>
  );
}

function ActivityRow({
  entry,
  updateAction,
  deleteAction,
}: {
  entry: ProfileActivity;
  updateAction: ProfileAction;
  deleteAction: ProfileAction;
}) {
  const [updateState, updateFormAction, isUpdating] = useActionState(
    updateAction,
    INITIAL_PROFILE_ACTION_STATE,
  );
  const [deleteState, deleteFormAction, isDeleting] = useActionState(
    deleteAction,
    INITIAL_PROFILE_ACTION_STATE,
  );

  return (
    <li>
      <Card className="flex flex-col gap-16">
        <form action={updateFormAction} className="flex flex-col gap-16">
          {}
          <input type="hidden" name="activity_id" value={entry.id} />
          <ActionFeedback error={updateState.error} success={updateState.success} />
          <ActivityFields idPrefix={`edit_${entry.id}`} entry={entry} />
          <div>
            <PillButton type="submit" disabled={isUpdating}>
              {isUpdating ? 'Saving…' : 'Save changes'}
            </PillButton>
          </div>
        </form>

        <form
          action={deleteFormAction}
          className="flex flex-col gap-16 border-t border-fog-gray pt-16"
        >
          {}
          <input type="hidden" name="activity_id" value={entry.id} />
          <ActionFeedback error={deleteState.error} success={deleteState.success} />
          <div>
            <button type="submit" disabled={isDeleting} className={secondaryButtonClasses}>
              {isDeleting ? 'Deleting…' : 'Delete this entry'}
            </button>
          </div>
        </form>
      </Card>
    </li>
  );
}

export function ActivitiesSection({
  activities,
  addAction,
  updateAction,
  deleteAction,
}: ActivitiesSectionProps) {
  return (
    <Card>
      <h2 className="font-serif text-subheading leading-subheading mb-16">
        Activities
      </h2>

      {activities.length === 0 ? (
        <p className="text-body mb-16">No activities yet.</p>
      ) : (
        <ul className="flex flex-col gap-16 mb-24">
          {activities.map((entry) => (
            <ActivityRow
              key={entry.id}
              entry={entry}
              updateAction={updateAction}
              deleteAction={deleteAction}
            />
          ))}
        </ul>
      )}

      <AddActivityForm addAction={addAction} />
    </Card>
  );
}
