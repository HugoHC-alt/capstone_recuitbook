import Link from 'next/link';

import { requireRouteAccess } from '@/lib/auth/require-route-access';
import { logoutAction } from '@/app/logout/actions';
import {
  listLinkedStudents,
  listPendingCounselorRequests,
} from '@/lib/counselor-link/queries';
import { listPendingCounselorReviewRequests } from '@/lib/counselor-review/queries';
import {
  acceptLinkRequestAction,
  declineLinkRequestAction,
  declineReviewRequestAction,
} from './actions';
import {
  DeclineReviewRequestForm,
  PendingRequestActions,
} from './counselor-request-forms';
import { Card } from '@/components/ui/card';
import { PillButton } from '@/components/ui/pill-button';

export const dynamic = 'force-dynamic';

const pillLinkClasses =
  'inline-flex items-center justify-center rounded-full border border-fog-gray px-24 py-12 text-body font-medium text-ink-black transition-colors duration-150 hover:bg-fog-gray';

export default async function CounselorDashboardPage() {
  const user = await requireRouteAccess('/counselor/dashboard');

  const [pendingRequests, linkedStudents, reviewQueue] = await Promise.all([
    listPendingCounselorRequests(),
    listLinkedStudents(),
    listPendingCounselorReviewRequests(),
  ]);

  return (
    <main className="content-wrapper py-40">
      <h1 className="font-serif text-heading-lg leading-heading-lg mb-8">
        Counselor Dashboard
      </h1>
      <p className="text-body text-slate-gray mb-32">
        Signed in as {user.email}.
      </p>

      <div className="flex flex-col gap-24">
        <Card>
          <h2 className="font-serif text-subheading leading-subheading mb-16">
            Pending requests
          </h2>
          {pendingRequests.length === 0 ? (
            <p className="text-body">You have no pending connection requests.</p>
          ) : (
            <ul className="flex flex-col gap-16">
              {pendingRequests.map((request) => (
                <li key={request.id}>
                  <Card className="flex flex-col gap-8">

                    <div className="text-body">
                      Student: {request.studentApplicationUserId}
                    </div>

                    <div className="text-body">
                      Requested: {request.requestedAt.slice(0, 10)}
                    </div>
                    <PendingRequestActions
                      acceptAction={acceptLinkRequestAction}
                      declineAction={declineLinkRequestAction}
                      linkId={request.id}
                    />
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="font-serif text-subheading leading-subheading mb-16">
            Review queue
          </h2>
          {reviewQueue.length === 0 ? (
            <p className="text-body">No pending review requests.</p>
          ) : (
            <ul className="flex flex-col gap-16">
              {reviewQueue.map((row) => (
                <li key={row.requestId}>
                  <Card className="flex flex-col gap-8">
                    <div className="text-body font-medium">
                      {row.preferredName ?? '—'}
                    </div>

                    {row.studentMessage ? (
                      <div className="text-body">Message: {row.studentMessage}</div>
                    ) : null}
                    <div className="text-body">
                      Requested: {row.requestedAt.slice(0, 10)}
                    </div>

                    {row.studentProfileId ? (
                      <div>
                        <Link
                          href={`/counselor/students/${row.studentProfileId}?reviewRequestId=${row.requestId}`}
                          className={pillLinkClasses}
                        >
                          Review profile
                        </Link>
                      </div>
                    ) : null}
                    <DeclineReviewRequestForm
                      action={declineReviewRequestAction}
                      reviewRequestId={row.requestId}
                    />
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="font-serif text-subheading leading-subheading mb-16">
            Your students
          </h2>
          {linkedStudents.length === 0 ? (
            <p className="text-body">You are not connected to any students yet.</p>
          ) : (
            <ul className="flex flex-col gap-16">
              {linkedStudents.map((student) => (
                <li key={student.linkId}>
                  <Card className="flex flex-col gap-8">
                    <div className="text-body font-medium">
                      {student.preferredName ?? '—'}
                    </div>
                    <div className="text-body">Country: {student.country ?? '—'}</div>
                    <div className="text-body">
                      Student ID: {student.studentApplicationUserId}
                    </div>
                    {student.linkedAt ? (
                      <div className="text-body">
                        Connected: {student.linkedAt.slice(0, 10)}
                      </div>
                    ) : null}

                    {student.studentProfileId ? (
                      <div>
                        <Link
                          href={`/counselor/students/${student.studentProfileId}`}
                          className={pillLinkClasses}
                        >
                          View profile
                        </Link>
                      </div>
                    ) : null}
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <form action={logoutAction} className="mt-32">
        <PillButton type="submit">Log out</PillButton>
      </form>
    </main>
  );
}
