import 'server-only';

import { redirect } from 'next/navigation';

import { getDashboardRouteForUser } from '@/lib/auth/route-policies';
import type { AccountStatus, ApplicationUser, UserRole } from '@/lib/auth/types';

export function redirectUserByRole(user: ApplicationUser): never;
export function redirectUserByRole(
  role: UserRole,
  accountStatus: AccountStatus,
): never;
export function redirectUserByRole(
  userOrRole: ApplicationUser | UserRole,
  accountStatus?: AccountStatus,
): never {
  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole.role;
  const status =
    typeof userOrRole === 'string'
      ? (accountStatus as AccountStatus)
      : userOrRole.account_status;

  redirect(getDashboardRouteForUser(role, status));
}
