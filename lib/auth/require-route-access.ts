import 'server-only';

import { redirect } from 'next/navigation';

import { getCurrentApplicationUser } from '@/lib/auth/get-current-application-user';
import {
  canAccessRoute,
  LOGIN_ROUTE,
  UNAUTHORIZED_ROUTE,
} from '@/lib/auth/route-policies';
import type { ApplicationUser } from '@/lib/auth/types';

export async function requireRouteAccess(
  routePath: string,
): Promise<ApplicationUser> {
  const user = await getCurrentApplicationUser();

  if (!user) {
    redirect(LOGIN_ROUTE);
  }

  if (!canAccessRoute(user, routePath)) {
    redirect(UNAUTHORIZED_ROUTE);
  }

  return user;
}
