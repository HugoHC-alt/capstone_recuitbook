# RecruitBook

RecruitBook is an international student recruitment web application. Students can build dynamic profiles, connect with counselors, and decide whether verified admissions officers can discover their profiles. Admissions officers can also keep a private shortlist of students they’re interested in.

## Technology

- Next.js App Router
- React and TypeScript
- Supabase Auth and PostgreSQL
- Supabase Row Level Security
- Tailwind CSS

## Core authorization model

Supabase Auth handles sign-in and sessions. RecruitBook keeps each user’s role and account status in application_users.

The application checks the user’s role and status on the server, and Supabase Row Level Security provides the database-level protection.
The available roles are:
- `student`
- `counselor`
- `admissions_officer`
- `platform_admin`

## Local setup

For Recruitbook to work the team needs Node.js, Docker Desktop, and a working Docker engine. The Supabase CLI is already included as a development dependency

1. Install the locked dependency versions:

   ```bash
   npm ci
   ```

2. Start Supabase and reset the local database:

   ```bash
   npx supabase start
   npx supabase db reset
   ```

3. Run `npx supabase status` and copy `.env.example` to `.env.local`. Replace the placeholders with the local API URL, anonymous key, service-role key, and site URL reported by the local stack.

4. Start the application:

   ```bash
   npm run dev
   ```

Public sign-up cannot create a platform_admin account.

## Repo guide

- `app/` — routes, pages, forms, and server actions
- `components/` — shared presentational components
- `lib/` — authorization, validation, and data-access helpers
- `supabase/migrations/` — additive schema and policy migrations
- `supabase/tests/` — adversarial Row Level Security checks
- `recruitbook-diagrams/` — architecture and security diagrams


## Security notes

- Client-supplied identifiers are lookup keys, never authorization evidence.
- Server actions derive the current user on the server and validate role and status independently of page guards.
- Normal user flows use the authenticated Supabase client so RLS applies.
- User-authored narrative text is rendered as plain escaped text.
- Errors shown to users do not expose raw database details or account-existence signals.

