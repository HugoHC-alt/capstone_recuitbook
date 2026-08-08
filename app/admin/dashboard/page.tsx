import { requireRouteAccess } from '@/lib/auth/require-route-access';
import { logoutAction } from '@/app/logout/actions';
import { approveUserAction, suspendUserAction } from '@/app/admin/actions';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { UserRole, AccountStatus } from '@/lib/auth/types';
import { ActionFeedback } from '@/components/ui/action-feedback';
import { Card } from '@/components/ui/card';
import { PillButton } from '@/components/ui/pill-button';

export const dynamic = 'force-dynamic';

const NOTICE_MESSAGES: Record<string, string> = {
  approved: 'User approved.',
  suspended: 'User suspended.',
  denied: 'You are not authorized to perform this action.',
  stale: 'This user can no longer be approved.',
  nochange: 'No change was made.',
  error: 'The action could not be completed. Please try again.',
};

interface UserRow {
  id: string;
  full_name: string | null;
  email: string;
  role: UserRole;
  account_status: AccountStatus;
  created_at: string;
}

const inputClasses =
  'w-full rounded-lg border border-fog-gray bg-pure-white px-12 py-8 text-body text-ink-black';
const secondaryButtonClasses =
  'inline-flex items-center justify-center rounded-full border border-fog-gray px-24 py-12 text-body font-medium text-ink-black transition-colors duration-150 hover:bg-fog-gray';

const thClasses =
  'whitespace-nowrap border-b border-fog-gray px-12 py-8 text-left text-caption font-medium uppercase tracking-wide text-ash-gray';
const tdClasses = 'border-b border-fog-gray px-12 py-12 align-top text-body';

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const user = await requireRouteAccess('/admin/dashboard');

  const { notice } = await searchParams;
  const noticeMessage =
    notice && Object.prototype.hasOwnProperty.call(NOTICE_MESSAGES, notice)
      ? NOTICE_MESSAGES[notice]
      : null;

  const supabase = await createSupabaseServerClient();

  const { data: pendingData, error: pendingError } = await supabase
    .from('application_users')
    .select('id, full_name, email, role, account_status, created_at')
    .in('role', ['counselor', 'admissions_officer'])
    .eq('account_status', 'pending_approval')
    .order('created_at', { ascending: true })
    .limit(50);

  const pending = (pendingData ?? []) as UserRow[];

  const { data: usersData, error: usersError } = await supabase
    .from('application_users')
    .select('id, full_name, email, role, account_status, created_at')
    .neq('role', 'platform_admin')
    .neq('account_status', 'suspended')
    .limit(50);

  const users = (usersData ?? []) as UserRow[];

  return (
    <main className="content-wrapper py-40">
      <h1 className="font-serif text-heading-lg leading-heading-lg mb-8">
        Admin Dashboard
      </h1>
      <p className="text-body text-slate-gray mb-32">
        Admin approval dashboard. Signed in as {user.email}.
      </p>

      {noticeMessage && (
        <div className="mb-24">
          <ActionFeedback success={noticeMessage} />
        </div>
      )}

      <div className="flex flex-col gap-24">
        <Card>
          <h2 className="font-serif text-subheading leading-subheading mb-16">
            Pending approvals
          </h2>
          {pendingError && (
            <p className="text-body text-error">
              Could not load pending approvals. Please try again.
            </p>
          )}
          {!pendingError && pending.length === 0 && (
            <p className="text-body">No accounts are awaiting approval.</p>
          )}
          {!pendingError && pending.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-max border-collapse">
                <thead>
                  <tr>
                    <th className={thClasses}>Name</th>
                    <th className={thClasses}>Email</th>
                    <th className={thClasses}>Role</th>
                    <th className={thClasses}>Requested</th>
                    <th className={thClasses}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((row) => (
                    <tr key={row.id}>
                      <td className={tdClasses}>{row.full_name ?? '—'}</td>
                      <td className={tdClasses}>{row.email}</td>
                      <td className={tdClasses}>{row.role}</td>
                      <td className={tdClasses}>{row.created_at}</td>
                      <td className={tdClasses}>
                        <div className="flex flex-col items-start gap-8">
                          <form action={approveUserAction}>
                            <input
                              type="hidden"
                              name="target_id"
                              value={row.id}
                            />
                            <PillButton type="submit">Approve</PillButton>
                          </form>
                          <form
                            action={suspendUserAction}
                            className="flex flex-col gap-8"
                          >
                            <input
                              type="hidden"
                              name="target_id"
                              value={row.id}
                            />
                            <input
                              type="text"
                              name="reason"
                              placeholder="Reason (optional)"
                              aria-label="Suspension reason (optional)"
                              className={inputClasses}
                            />
                            <button
                              type="submit"
                              className={secondaryButtonClasses}
                            >
                              Suspend
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-serif text-subheading leading-subheading mb-16">
            Users
          </h2>
          {usersError && (
            <p className="text-body text-error">
              Could not load users. Please try again.
            </p>
          )}
          {!usersError && users.length === 0 && (
            <p className="text-body">No users to display.</p>
          )}
          {!usersError && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-max border-collapse">
                <thead>
                  <tr>
                    <th className={thClasses}>Name</th>
                    <th className={thClasses}>Email</th>
                    <th className={thClasses}>Role</th>
                    <th className={thClasses}>Status</th>
                    <th className={thClasses}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((row) => (
                    <tr key={row.id}>
                      <td className={tdClasses}>{row.full_name ?? '—'}</td>
                      <td className={tdClasses}>{row.email}</td>
                      <td className={tdClasses}>{row.role}</td>
                      <td className={tdClasses}>{row.account_status}</td>
                      <td className={tdClasses}>
                        <form
                          action={suspendUserAction}
                          className="flex flex-col items-start gap-8"
                        >
                          <input
                            type="hidden"
                            name="target_id"
                            value={row.id}
                          />
                          <input
                            type="text"
                            name="reason"
                            placeholder="Reason (optional)"
                            aria-label="Suspension reason (optional)"
                            className={inputClasses}
                          />
                          <button
                            type="submit"
                            className={secondaryButtonClasses}
                          >
                            Suspend
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <form action={logoutAction} className="mt-32">
        <PillButton type="submit">Log out</PillButton>
      </form>
    </main>
  );
}
