This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, set up your environment variables by creating a `.env.local` file in the `task-evaluator` directory, based on the template below.

### Environment variables

Create a file named `.env.local` with values appropriate for your environment:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Auth (if using Supabase auth helpers)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Analytics / monitoring (optional)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# Other third-party APIs (add as needed)
# MY_SERVICE_API_KEY=
# MY_SERVICE_API_URL=
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Authentication overview

- **Email/password login & signup** powered by Supabase Auth via the forms under `/login` and `/signup`.
- **Session management** handled by `@supabase/auth-helpers-nextjs` plus a custom middleware that keeps Supabase cookies in sync.
- **Protected routes**: `/dashboard` (and any route added to the middleware matcher) requires an active session; unauthenticated users are redirected to `/login`.
- **Post-login redirect**: after a successful login the app redirects to `/dashboard` (or to any path passed via the `redirectedFrom` query string).
- **API callback**: Supabase OAuth/callback flows are handled by `/api/auth/callback`, which completes the code exchange.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
