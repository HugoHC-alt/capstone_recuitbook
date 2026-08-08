import { requireRouteAccess } from '@/lib/auth/require-route-access';
import { logoutAction } from '@/app/logout/actions';
import { Card } from '@/components/ui/card';
import { PillButton } from '@/components/ui/pill-button';

export const dynamic = 'force-dynamic';

export default async function CounselorPendingPage() {
  const user = await requireRouteAccess('/counselor/pending');

  return (
    <main className="content-wrapper flex min-h-screen items-center justify-center py-40">
      <div className="w-full max-w-md text-center">
        <Card>
          <h1 className="font-serif text-heading-sm leading-heading-sm mb-12">
            Counselor Pending Approval
          </h1>
          <p className="text-body text-slate-gray mb-16">
            Placeholder page. Signed in as {user.email}.
          </p>
          <form action={logoutAction}>
            <PillButton type="submit">Log out</PillButton>
          </form>
        </Card>
      </div>
    </main>
  );
}
