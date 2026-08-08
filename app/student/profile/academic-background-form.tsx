'use client';

import { useActionState } from 'react';

import type { AcademicBackground } from '@/lib/student-profile/types';
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

interface AcademicBackgroundSectionProps {
  backgrounds: AcademicBackground[];
  addAction: ProfileAction;
  updateAction: ProfileAction;
  deleteAction: ProfileAction;
}

const labelClasses = 'block text-caption font-medium text-ash-gray mb-4';
const inputClasses =
  'w-full rounded-lg border border-fog-gray bg-pure-white px-12 py-8 text-body text-ink-black';
const secondaryButtonClasses =
  'inline-flex items-center justify-center rounded-full border border-fog-gray px-24 py-12 text-body font-medium text-ink-black transition-colors duration-150 hover:bg-fog-gray disabled:opacity-60';

function AcademicFields({
  idPrefix,
  entry,
}: {
  idPrefix: string;
  entry?: AcademicBackground;
}) {
  return (
    <div className="flex flex-col gap-16">
      <div>
        <label htmlFor={`${idPrefix}_school_name`} className={labelClasses}>
          School name (required)
        </label>
        <input
          id={`${idPrefix}_school_name`}
          name="school_name"
          type="text"
          maxLength={200}
          required
          defaultValue={entry?.school_name ?? ''}
          className={inputClasses}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}_country`} className={labelClasses}>
          Country
        </label>
        <input
          id={`${idPrefix}_country`}
          name="country"
          type="text"
          maxLength={100}
          defaultValue={entry?.country ?? ''}
          className={inputClasses}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}_curriculum`} className={labelClasses}>
          Curriculum
        </label>
        <input
          id={`${idPrefix}_curriculum`}
          name="curriculum"
          type="text"
          maxLength={100}
          defaultValue={entry?.curriculum ?? ''}
          className={inputClasses}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}_graduation_year`} className={labelClasses}>
          Graduation year
        </label>
        <input
          id={`${idPrefix}_graduation_year`}
          name="graduation_year"
          type="number"
          min={1900}
          max={2100}
          defaultValue={
            entry?.graduation_year != null ? String(entry.graduation_year) : ''
          }
          className={inputClasses}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}_academic_summary`} className={labelClasses}>
          Academic summary
        </label>
        <textarea
          id={`${idPrefix}_academic_summary`}
          name="academic_summary"
          maxLength={1000}
          rows={3}
          defaultValue={entry?.academic_summary ?? ''}
          className={inputClasses}
        />
      </div>
    </div>
  );
}

function AddAcademicForm({ addAction }: { addAction: ProfileAction }) {
  const [state, formAction, isPending] = useActionState(
    addAction,
    INITIAL_PROFILE_ACTION_STATE,
  );

  return (
    <form action={formAction} className="flex flex-col gap-16">
      <h3 className="font-serif text-body font-medium">Add academic background</h3>
      <ActionFeedback error={state.error} success={state.success} />
      <AcademicFields idPrefix="add_academic" />
      <div>
        <PillButton type="submit" disabled={isPending}>
          {isPending ? 'Adding…' : 'Add academic background'}
        </PillButton>
      </div>
    </form>
  );
}

function AcademicRow({
  entry,
  updateAction,
  deleteAction,
}: {
  entry: AcademicBackground;
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
          <input type="hidden" name="academic_background_id" value={entry.id} />
          <ActionFeedback error={updateState.error} success={updateState.success} />
          <AcademicFields idPrefix={`edit_${entry.id}`} entry={entry} />
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
          <input type="hidden" name="academic_background_id" value={entry.id} />
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

export function AcademicBackgroundSection({
  backgrounds,
  addAction,
  updateAction,
  deleteAction,
}: AcademicBackgroundSectionProps) {
  return (
    <Card>
      <h2 className="font-serif text-subheading leading-subheading mb-16">
        Academic background
      </h2>

      {backgrounds.length === 0 ? (
        <p className="text-body mb-16">No academic background entries yet.</p>
      ) : (
        <ul className="flex flex-col gap-16 mb-24">
          {backgrounds.map((entry) => (
            <AcademicRow
              key={entry.id}
              entry={entry}
              updateAction={updateAction}
              deleteAction={deleteAction}
            />
          ))}
        </ul>
      )}

      <AddAcademicForm addAction={addAction} />
    </Card>
  );
}
