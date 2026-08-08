import Link from 'next/link';

import { requireRouteAccess } from '@/lib/auth/require-route-access';
import { getCurrentStudentProfileAggregate } from '@/lib/student-profile/queries';
import { getCurrentStudentProfileVisibilitySettings } from '@/lib/admissions-discovery/queries';
import {
  addAcademicBackgroundAction,
  addAchievementAction,
  addActivityAction,
  deleteAcademicBackgroundAction,
  deleteAchievementAction,
  deleteActivityAction,
  saveBasicProfileAction,
  saveNarrativesAction,
  saveVisibilitySettingsAction,
  updateAcademicBackgroundAction,
  updateAchievementAction,
  updateActivityAction,
} from './actions';
import { BasicProfileForm } from './basic-profile-form';
import { NarrativesForm } from './narratives-form';
import { AcademicBackgroundSection } from './academic-background-form';
import { ActivitiesSection } from './activities-form';
import { AchievementsSection } from './achievements-form';
import { VisibilitySettingsForm } from './visibility-settings-form';
import { Card } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function StudentProfileEditPage() {
  await requireRouteAccess('/student/dashboard');

  const aggregate = await getCurrentStudentProfileAggregate();

  if (!aggregate) {
    return (
      <main className="content-wrapper py-40">
        <h1 className="font-serif text-heading-lg leading-heading-lg mb-16">
          Edit Student Profile
        </h1>
        <p className="text-body text-error mb-24">
          We couldn&apos;t load your profile right now. Please try again.
        </p>
        <p>
          <Link href="/student/dashboard" className="text-body underline">
            Back to dashboard
          </Link>
        </p>
      </main>
    );
  }

  const { profile, academicBackgrounds, activities, achievements } = aggregate;

  const visibilitySettings = await getCurrentStudentProfileVisibilitySettings();

  return (
    <main className="content-wrapper py-40">
      <h1 className="font-serif text-heading-lg leading-heading-lg mb-8">
        Edit Student Profile
      </h1>
      <p className="text-body text-slate-gray mb-32">
        This is your private profile. Only you can edit it. Changes are saved to
        your own profile and are not shared with anyone in this batch.
      </p>

      <div className="flex flex-col gap-24">
        <Card>
          <h2 className="font-serif text-subheading leading-subheading mb-16">
            Basic profile
          </h2>
          <BasicProfileForm
            action={saveBasicProfileAction}
            preferredName={profile?.preferred_name ?? null}
            country={profile?.country ?? null}
            cityRegion={profile?.city_region ?? null}
            intendedMajor={profile?.intended_major ?? null}
          />
        </Card>

        <AcademicBackgroundSection
          backgrounds={academicBackgrounds}
          addAction={addAcademicBackgroundAction}
          updateAction={updateAcademicBackgroundAction}
          deleteAction={deleteAcademicBackgroundAction}
        />

        <ActivitiesSection
          activities={activities}
          addAction={addActivityAction}
          updateAction={updateActivityAction}
          deleteAction={deleteActivityAction}
        />

        <AchievementsSection
          achievements={achievements}
          addAction={addAchievementAction}
          updateAction={updateAchievementAction}
          deleteAction={deleteAchievementAction}
        />

        <Card>
          <h2 className="font-serif text-subheading leading-subheading mb-8">
            Student-authored narratives
          </h2>
          <p className="text-body text-slate-gray mb-16">
            These are your own words. Write them in plain text. They are saved to
            your private profile and are not shared with anyone in this batch.
          </p>
          <NarrativesForm
            action={saveNarrativesAction}
            narrativeBackground={profile?.narrative_background ?? null}
            narrativeGoals={profile?.narrative_goals ?? null}
            narrativeActivitiesSummary={
              profile?.narrative_activities_summary ?? null
            }
          />
        </Card>

        <Card>
          <h2 className="font-serif text-subheading leading-subheading mb-8">
            Admissions visibility
          </h2>
          <p className="text-body text-slate-gray mb-16">
            Control whether admissions officers can find your profile.
          </p>
          <VisibilitySettingsForm
            action={saveVisibilitySettingsAction}
            isPublished={visibilitySettings?.is_published ?? false}
            admissionsConsent={visibilitySettings?.admissions_consent ?? false}
          />
        </Card>
      </div>

      <p className="mt-32">
        <Link href="/student/dashboard" className="text-body underline">
          Back to dashboard
        </Link>
      </p>
    </main>
  );
}
