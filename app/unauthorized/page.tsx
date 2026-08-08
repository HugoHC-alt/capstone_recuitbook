import Link from 'next/link';

import { Card } from '@/components/ui/card';

export default function UnauthorizedPage() {
  return (
    <main className="content-wrapper flex min-h-screen items-center justify-center py-40">
      <div className="w-full max-w-md text-center">
        <Card>
          <h1 className="font-serif text-heading-sm leading-heading-sm mb-12">
            Access denied
          </h1>
          <p className="text-body text-slate-gray mb-16">
            You do not have access to the requested route.
          </p>
          <p className="text-body">
            <Link href="/login" className="underline">
              Return to login
            </Link>{' '}
            or go to the{' '}
            <Link href="/" className="underline">
              home page
            </Link>
            .
          </p>
        </Card>
      </div>
    </main>
  );
}
