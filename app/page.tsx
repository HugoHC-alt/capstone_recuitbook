import Link from 'next/link';

const primaryLinkClasses =
  'inline-flex items-center justify-center rounded-full bg-action-fill px-24 py-12 text-body font-medium text-action-fg transition-colors duration-150 hover:opacity-90';
const secondaryLinkClasses =
  'inline-flex items-center justify-center rounded-full border border-fog-gray px-24 py-12 text-body font-medium text-ink-black transition-colors duration-150 hover:bg-fog-gray';

export default function Home() {
  return (
    <main className="content-wrapper flex min-h-screen flex-col items-center justify-center gap-24 py-64 text-center">
      <h1 className="font-serif text-heading-lg leading-heading-lg">
        RecruitBook
      </h1>
      <div className="flex flex-wrap items-center justify-center gap-16">
        <Link href="/login" className={primaryLinkClasses}>
          Log in
        </Link>
        <Link href="/sign-up" className={secondaryLinkClasses}>
          Sign up
        </Link>
      </div>
    </main>
  );
}
