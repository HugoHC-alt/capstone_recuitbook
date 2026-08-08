import Link from 'next/link';

import { requireRouteAccess } from '@/lib/auth/require-route-access';
import { logoutAction } from '@/app/logout/actions';
import { listAdmissionsVisibleStudents } from '@/lib/admissions-discovery/queries';
import { normalizeAdmissionsDiscoveryFilters } from '@/lib/admissions-discovery/validation';
import { listMyAdmissionsShortlist } from '@/lib/admissions-shortlist/queries';
import { removeFromShortlistAction } from '@/app/admissions/dashboard/actions';
import { RemoveFromShortlistForm } from '@/app/admissions/dashboard/remove-shortlist-form';
import { Card } from '@/components/ui/card';
import { PillButton } from '@/components/ui/pill-button';
import { SectionStripe } from '@/components/ui/section-stripe';

export const dynamic = 'force-dynamic';

const pillLinkClasses =
  'inline-flex items-center justify-center rounded-full border border-fog-gray px-24 py-12 text-body font-medium text-ink-black transition-colors duration-150 hover:bg-fog-gray';

const labelClasses = 'block text-caption font-medium text-ash-gray mb-4';
const inputClasses =
  'w-full rounded-lg border border-fog-gray bg-pure-white px-12 py-8 text-body text-ink-black';

export default async function AdmissionsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string | string[]; major?: string | string[] }>;
}) {
  const user = await requireRouteAccess('/admissions/dashboard');

  const rawSearchParams = await searchParams;
  const filters = normalizeAdmissionsDiscoveryFilters({
    country: rawSearchParams.country,
    major: rawSearchParams.major,
  });
  const hasAppliedFilters = Boolean(filters.country || filters.major);

  const [students, savedStudents] = await Promise.all([
    listAdmissionsVisibleStudents(filters),
    listMyAdmissionsShortlist(),
  ]);

  return (
    <main className="content-wrapper py-40">
      <h1 className="font-serif text-heading-lg leading-heading-lg mb-8">
        Admissions Dashboard
      </h1>
      <p className="text-body text-slate-gray mb-32">
        Signed in as {user.email}.
      </p>

      <Card>
        <h2 className="font-serif text-subheading leading-subheading mb-16">
          Visible students
        </h2>

        <form method="get" className="flex flex-wrap items-end gap-16 mb-16">
          <div>
            <label htmlFor="country" className={labelClasses}>
              Country
            </label>
            <input
              id="country"
              name="country"
              type="text"
              defaultValue={filters.country ?? ''}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="major" className={labelClasses}>
              Intended major
            </label>
            <input
              id="major"
              name="major"
              type="text"
              defaultValue={filters.major ?? ''}
              className={inputClasses}
            />
          </div>
          <PillButton type="submit">Filter</PillButton>
          {hasAppliedFilters && (
            <Link href="/admissions/dashboard" className="text-body underline">
              Clear filters
            </Link>
          )}
        </form>

        {hasAppliedFilters && (
          <p className="text-body text-slate-gray mb-8">
            {filters.country && filters.major
              ? `Filtered by country: ${filters.country}; intended major: ${filters.major}`
              : filters.country
                ? `Filtered by country: ${filters.country}`
                : `Filtered by intended major: ${filters.major}`}
          </p>
        )}

        <p className="text-body text-slate-gray mb-16">
          {students.length} visible student{students.length === 1 ? '' : 's'}
        </p>

        {students.length === 0 ? (
          <p className="text-body">
            {hasAppliedFilters
              ? 'No visible student profiles match these filters.'
              : 'No visible student profiles yet.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-16">
            {students.map((student) => (
              <li key={student.studentProfileId}>
                <Card className="flex flex-col gap-8">
                  <div className="text-body font-medium">
                    {student.preferredName ?? '—'}
                  </div>
                  <div className="text-body">Country: {student.country ?? '—'}</div>
                  <div className="text-body">
                    Location: {student.cityRegion ?? '—'}
                  </div>
                  <div className="text-body">
                    Intended major: {student.intendedMajor ?? '—'}
                  </div>
                  <div>
                    <Link
                      href={`/admissions/students/${student.studentProfileId}`}
                      className={pillLinkClasses}
                    >
                      View profile
                    </Link>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <SectionStripe className="my-32" />

      <Card>
        <h2 className="font-serif text-subheading leading-subheading mb-16">
          Saved students
        </h2>
        {savedStudents.length === 0 ? (
          <p className="text-body">No saved students yet.</p>
        ) : (
          <ul className="flex flex-col gap-16">
            {savedStudents.map((student) => (
              <li key={student.entryId}>
                <Card className="flex flex-col gap-8">
                  <div className="text-body font-medium">
                    {student.preferredName ?? '—'}
                  </div>
                  <div className="text-body">Country: {student.country ?? '—'}</div>
                  <div className="text-body">
                    Location: {student.cityRegion ?? '—'}
                  </div>
                  <div className="text-body">
                    Intended major: {student.intendedMajor ?? '—'}
                  </div>
                  <div className="flex flex-wrap items-center gap-8">
                    <Link
                      href={`/admissions/students/${student.studentProfileId}`}
                      className={pillLinkClasses}
                    >
                      View profile
                    </Link>
                    <RemoveFromShortlistForm
                      action={removeFromShortlistAction}
                      entryId={student.entryId}
                    />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <form action={logoutAction} className="mt-32">
        <PillButton type="submit">Log out</PillButton>
      </form>
    </main>
  );
}
