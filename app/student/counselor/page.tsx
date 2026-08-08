import Link from 'next/link';

import { requireRouteAccess } from '@/lib/auth/require-route-access';
import { listMyCounselorLinks } from '@/lib/counselor-link/queries';
import { listMyCounselorReviewRequests } from '@/lib/counselor-review/queries';
import {
  requestCounselorLinkAction,
  revokeCounselorLinkAction,
  requestCounselorReviewAction,
  withdrawCounselorReviewRequestAction,
} from './actions';
import {
  RequestCounselorLinkForm,
  RevokeCounselorLinkForm,
  RequestReviewForm,
  WithdrawReviewRequestForm,
} from './counselor-link-forms';
import { Card } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

const pillLinkClasses =
  'inline-flex items-center justify-center rounded-full border border-fog-gray px-24 py-12 text-body font-medium text-ink-black transition-colors duration-150 hover:bg-fog-gray';

export default async function StudentCounselorLinkPage() {
  await requireRouteAccess('/student/dashboard');

  const [links, reviewRequests] = await Promise.all([
    listMyCounselorLinks(),
    listMyCounselorReviewRequests(),
  ]);

  return (
    <main className="content-wrapper py-40">
      <h1 className="font-serif text-heading-lg leading-heading-lg mb-8">
        Counselor connections
      </h1>
      <p className="text-body text-slate-gray mb-32">
        Request a connection to your counselor by entering their email. If they
        accept, they can view your profile. Your requests and their status
        appear below.
      </p>

      <div className="flex flex-col gap-24">
        <Card>
          <h2 className="font-serif text-subheading leading-subheading mb-16">
            Request a connection
          </h2>
          <RequestCounselorLinkForm action={requestCounselorLinkAction} />
        </Card>

        <Card>
          <h2 className="font-serif text-subheading leading-subheading mb-16">
            Your requests
          </h2>
          {links.length === 0 ? (
            <p className="text-body">
              You haven&apos;t requested any counselor links yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-16">
              {links.map((link) => (
                <li key={link.id}>
                  <Card className="flex flex-col gap-8">
                    <div className="text-body font-medium">
                      {link.counselorEmail}
                    </div>
                    <div className="text-body">Status: {link.statusLabel}</div>
                    {}
                    <div className="text-body">
                      Requested: {link.requestedAt.slice(0, 10)}
                    </div>
                    {link.canRevoke ? (
                      <RevokeCounselorLinkForm
                        action={revokeCounselorLinkAction}
                        linkId={link.id}
                      />
                    ) : null}
                    {link.status === 'accepted' ? (
                      <RequestReviewForm
                        action={requestCounselorReviewAction}
                        linkId={link.id}
                      />
                    ) : null}
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="font-serif text-subheading leading-subheading mb-16">
            Your review requests
          </h2>
          {reviewRequests.length === 0 ? (
            <p className="text-body">
              You haven&apos;t requested any reviews yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-16">
              {reviewRequests.map((item) => (
                <li key={item.id}>
                  <Card className="flex flex-col gap-8">
                    <div className="text-body">Status: {item.statusLabel}</div>
                    {}
                    <div className="text-body">
                      Requested: {item.requestedAt.slice(0, 10)}
                    </div>
                    {item.feedbackText !== null ? (
                      <div>
                        <p className="text-caption font-medium text-ash-gray mb-4">
                          Feedback
                        </p>
                        <p className="text-body">{item.feedbackText}</p>
                      </div>
                    ) : null}
                    {item.canWithdraw ? (
                      <WithdrawReviewRequestForm
                        action={withdrawCounselorReviewRequestAction}
                        requestId={item.id}
                      />
                    ) : null}
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <p className="mt-32">
        <Link href="/student/dashboard" className={pillLinkClasses}>
          Back to dashboard
        </Link>
      </p>
    </main>
  );
}
