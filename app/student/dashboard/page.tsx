import { requireRouteAccess } from '@/lib/auth/require-route-access';
import { getCurrentStudentProfileAggregate } from '@/lib/student-profile/queries';
import { logoutAction } from '@/app/logout/actions';
import { Card } from '@/components/ui/card';
import { PillButton } from '@/components/ui/pill-button';
import { SectionStripe } from '@/components/ui/section-stripe';

export const dynamic = 'force-dynamic';

const NOT_SET = '—';

function displayOrNotSet(value: string | null | undefined): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : NOT_SET;
}

function shortExcerpt(value: string, max = 140): string {
  const trimmed = value.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

export default async function StudentDashboardPage() {
  const user = await requireRouteAccess('/student/dashboard');

  const aggregate = await getCurrentStudentProfileAggregate();

  const logoutForm = (
    <form action={logoutAction}>
      <PillButton type="submit">Log out</PillButton>
    </form>
  );

  if (!aggregate) {
    return (
      <main className="content-wrapper py-40">
        <h1 className="font-serif text-heading-lg leading-heading-lg mb-16">
          Student Profile
        </h1>
        <p className="text-body text-error mb-24">
          We couldn&apos;t load your profile right now. Please try again.
        </p>
        {logoutForm}
      </main>
    );
  }

  const { profile, academicBackgrounds, activities, achievements, completion } =
    aggregate;

  const hasNarrative =
    profile !== null &&
    [
      profile.narrative_background,
      profile.narrative_goals,
      profile.narrative_activities_summary,
    ].some((text) => typeof text === 'string' && text.trim().length > 0);

  const pillLinkClasses =
    'inline-flex items-center justify-center rounded-full border border-fog-gray px-24 py-12 text-body font-medium text-ink-black transition-colors duration-150 hover:bg-fog-gray';

  return (
    <main className="content-wrapper py-40">
      <h1 className="font-serif text-heading-lg leading-heading-lg mb-8">
        Student Profile
      </h1>
      <p className="text-body text-slate-gray mb-32">
        This is your private profile foundation. Only you can see it. Signed in
        as {user.email}.
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
          {profile === null ? (
            <p className="text-body">Your profile has not been started yet.</p>
          ) : (
            <ul className="flex flex-col gap-4 text-body">
              <li>Preferred name: {displayOrNotSet(profile.preferred_name)}</li>
              <li>Country: {displayOrNotSet(profile.country)}</li>
              <li>City / region: {displayOrNotSet(profile.city_region)}</li>
              <li>Intended major: {displayOrNotSet(profile.intended_major)}</li>
            </ul>
          )}
        </Card>


        <Card>
          <h2 className="font-serif text-subheading leading-subheading mb-12">
            Academic background
          </h2>
          <p className="text-body mb-8">{academicBackgrounds.length} entries.</p>
          {academicBackgrounds.length > 0 && (
            <ul className="flex flex-col gap-4 text-body">
              {academicBackgrounds.slice(0, 3).map((entry) => (
                <li key={entry.id}>
                  {entry.school_name}
                  {entry.curriculum ? ` — ${entry.curriculum}` : ''}
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
            <ul className="flex flex-col gap-4 text-body">
              {activities.slice(0, 3).map((activity) => (
                <li key={activity.id}>{activity.title}</li>
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
            <ul className="flex flex-col gap-4 text-body">
              {achievements.slice(0, 3).map((achievement) => (
                <li key={achievement.id}>{achievement.title}</li>
              ))}
            </ul>
          )}
        </Card>


        <Card>
          <h2 className="font-serif text-subheading leading-subheading mb-12">
            Narratives
          </h2>
          {hasNarrative && profile !== null ? (
            <>
              <p className="text-body mb-8">You have started your narratives.</p>
              <ul className="flex flex-col gap-8 text-body">
                {typeof profile.narrative_background === 'string' &&
                  profile.narrative_background.trim().length > 0 && (
                    <li>Background: {shortExcerpt(profile.narrative_background)}</li>
                  )}
                {typeof profile.narrative_goals === 'string' &&
                  profile.narrative_goals.trim().length > 0 && (
                    <li>Goals: {shortExcerpt(profile.narrative_goals)}</li>
                  )}
                {typeof profile.narrative_activities_summary === 'string' &&
                  profile.narrative_activities_summary.trim().length > 0 && (
                    <li>
                      Activities summary:{' '}
                      {shortExcerpt(profile.narrative_activities_summary)}
                    </li>
                  )}
              </ul>
            </>
          ) : (
            <p className="text-body">No narratives yet.</p>
          )}
        </Card>
      </div>

      <SectionStripe className="my-32" />


      <div className="flex flex-wrap gap-16 mb-32">
        <a href="/student/profile" className={pillLinkClasses}>
          Edit profile
        </a>
        <a href="/student/counselor" className={pillLinkClasses}>
          Counselor connections
        </a>
      </div>

      {logoutForm}
    </main>
  );
}
