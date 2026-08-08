import Link from 'next/link';

import { requireRouteAccess } from '@/lib/auth/require-route-access';
import { getLinkedStudentProfileReadOnly } from '@/lib/counselor-link/queries';
import { listPendingCounselorReviewRequests } from '@/lib/counselor-review/queries';
import { completeReviewRequestAction } from '@/app/counselor/dashboard/actions';
import { SubmitFeedbackForm } from '@/app/counselor/dashboard/counselor-request-forms';
import { Card } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

const NOT_SET = '—';

function displayOrNotSet(value: string | null | undefined): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : NOT_SET;
}

export default async function CounselorStudentProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reviewRequestId?: string }>;
}) {
  await requireRouteAccess('/counselor/dashboard');

  const { id } = await params;
  const { reviewRequestId } = await searchParams;

  const aggregate = await getLinkedStudentProfileReadOnly(id);

  const pillLinkClasses =
    'inline-flex items-center justify-center rounded-full border border-fog-gray px-24 py-12 text-body font-medium text-ink-black transition-colors duration-150 hover:bg-fog-gray';

  const backLink = (
    <p className="mt-32">
      <Link href="/counselor/dashboard" className={pillLinkClasses}>
        Back to dashboard
      </Link>
    </p>
  );

  if (!aggregate || !aggregate.profile) {
    return (
      <main className="content-wrapper py-40">
        <h1 className="font-serif text-heading-lg leading-heading-lg mb-16">
          Student profile
        </h1>
        <p className="text-body text-error mb-24">
          This student profile is not available.
        </p>
        {backLink}
      </main>
    );
  }

  const { profile, academicBackgrounds, activities, achievements, completion } =
    aggregate;

  let matchedReviewRequestId: string | null = null;
  if (typeof reviewRequestId === 'string' && reviewRequestId.length > 0) {
    const queue = await listPendingCounselorReviewRequests();
    if (
      queue.some(
        (row) => row.requestId === reviewRequestId && row.studentProfileId === id,
      )
    ) {
      matchedReviewRequestId = reviewRequestId;
    }
  }

  return (
    <main className="content-wrapper py-40">
      <h1 className="font-serif text-heading-lg leading-heading-lg mb-8">
        Student profile
      </h1>
      <p className="text-body text-slate-gray mb-32">
        Read-only view of a student who has connected with you.
      </p>

      <div className="flex flex-col gap-24">

        <Card>
          <h2 className="font-serif text-subheading leading-subheading mb-12">
            Completion
          </h2>
          <p className="text-body mb-12">
            {completion.completedSections} of {completion.totalSections} sections
            complete ({completion.percentComplete}%).
          </p>
          <ul className="flex flex-col gap-4 text-body">
            {completion.sections.map((section) => (
              <li key={section.id}>
                {section.complete ? '✓' : '—'} {section.label} —{' '}
                {section.complete ? 'Complete' : 'Not started'}
              </li>
            ))}
          </ul>
        </Card>


        <Card>
          <h2 className="font-serif text-subheading leading-subheading mb-12">
            Profile overview
          </h2>
          <ul className="flex flex-col gap-4 text-body">
            <li>Preferred name: {displayOrNotSet(profile.preferred_name)}</li>
            <li>Country: {displayOrNotSet(profile.country)}</li>
            <li>City / region: {displayOrNotSet(profile.city_region)}</li>
            <li>Intended major: {displayOrNotSet(profile.intended_major)}</li>
          </ul>
        </Card>


        <Card>
          <h2 className="font-serif text-subheading leading-subheading mb-12">
            Academic background
          </h2>
          <p className="text-body mb-8">{academicBackgrounds.length} entries.</p>
          {academicBackgrounds.length > 0 && (
            <ul className="flex flex-col gap-16">
              {academicBackgrounds.map((entry) => (
                <li key={entry.id} className="text-body">
                  <div>School: {entry.school_name}</div>
                  <div>Country: {displayOrNotSet(entry.country)}</div>
                  <div>Curriculum: {displayOrNotSet(entry.curriculum)}</div>
                  <div>
                    Graduation year:{' '}
                    {entry.graduation_year === null ? NOT_SET : entry.graduation_year}
                  </div>
                  {entry.academic_summary ? (
                    <div>Summary: {entry.academic_summary}</div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>


        <Card>
          <h2 className="font-serif text-subheading leading-subheading mb-12">
            Activities
          </h2>
          <p className="text-body mb-8">{activities.length} entries.</p>
          {activities.length > 0 && (
            <ul className="flex flex-col gap-16">
              {activities.map((activity) => (
                <li key={activity.id} className="text-body">
                  <div>Title: {activity.title}</div>
                  <div>Organization: {displayOrNotSet(activity.organization)}</div>
                  <div>
                    Years:{' '}
                    {activity.start_year === null ? NOT_SET : activity.start_year}
                    {' – '}
                    {activity.end_year === null ? NOT_SET : activity.end_year}
                  </div>
                  {activity.description ? (
                    <div>Description: {activity.description}</div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>


        <Card>
          <h2 className="font-serif text-subheading leading-subheading mb-12">
            Achievements
          </h2>
          <p className="text-body mb-8">{achievements.length} entries.</p>
          {achievements.length > 0 && (
            <ul className="flex flex-col gap-16">
              {achievements.map((achievement) => (
                <li key={achievement.id} className="text-body">
                  <div>Title: {achievement.title}</div>
                  <div>Issuer: {displayOrNotSet(achievement.issuer)}</div>
                  <div>
                    Received year:{' '}
                    {achievement.received_year === null
                      ? NOT_SET
                      : achievement.received_year}
                  </div>
                  {achievement.description ? (
                    <div>Description: {achievement.description}</div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>


        <Card>
          <h2 className="font-serif text-subheading leading-subheading mb-12">
            Narratives
          </h2>
          <div className="mb-16">
            <h3 className="font-serif text-body font-medium mb-4">
              Background and context
            </h3>
            <p className="text-body whitespace-pre-wrap">
              {displayOrNotSet(profile.narrative_background)}
            </p>
          </div>
          <div className="mb-16">
            <h3 className="font-serif text-body font-medium mb-4">
              Academic and personal goals
            </h3>
            <p className="text-body whitespace-pre-wrap">
              {displayOrNotSet(profile.narrative_goals)}
            </p>
          </div>
          <div>
            <h3 className="font-serif text-body font-medium mb-4">
              Activities and involvement summary
            </h3>
            <p className="text-body whitespace-pre-wrap">
              {displayOrNotSet(profile.narrative_activities_summary)}
            </p>
          </div>
        </Card>


        {matchedReviewRequestId ? (
          <Card>
            <h2 className="font-serif text-subheading leading-subheading mb-12">
              Provide feedback
            </h2>
            <SubmitFeedbackForm
              action={completeReviewRequestAction}
              reviewRequestId={matchedReviewRequestId}
              studentProfileId={id}
            />
          </Card>
        ) : null}
      </div>

      {backLink}
    </main>
  );
}
