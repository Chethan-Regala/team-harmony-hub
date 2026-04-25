# Team Harmony Hub

Production-oriented HR portal built with TanStack Start, React, Vite, and Supabase.

## Overview

Team Harmony Hub is a role-based HR application with dedicated flows for:
- Admin
- Manager
- Employee

The app uses:
- TanStack Start for full-stack React routing and server functions
- Supabase for authentication, Postgres data, and role-backed access
- Vite for fast local development and production builds

## Core Features

- Role-based dashboards and route segments
- User management and initial admin bootstrap
- Attendance and leaves modules
- Announcements and updates
- Documents and profile workflows
- Payroll-related structures and payslip views

## Tech Stack

- React 19
- TanStack Start and TanStack Router
- TypeScript (strict mode)
- Supabase (`@supabase/supabase-js`)
- Tailwind CSS and Radix UI components
- Vite 7

## Project Structure

```text
.
├─ src/
│  ├─ routes/                      # File-based routes and role modules
│  ├─ components/                  # UI shell and reusable components
│  ├─ integrations/supabase/       # Supabase clients, middleware, generated types
│  ├─ server/                      # Server functions (admin operations, salary setup)
│  ├─ router.tsx                   # Router creation and default error boundary
│  └─ routeTree.gen.ts             # Generated TanStack route tree
├─ supabase/
│  ├─ migrations/                  # Database migrations
│  └─ config.toml                  # Supabase project config reference
├─ vercel.json                     # Vercel install/build commands
└─ package.json                    # Scripts and dependencies
```

## Prerequisites

- Node.js 20+ (Node 22 recommended)
- npm 10+
- Supabase project with applied migrations
- Vercel account for deployment

## Environment Variables

Copy `.env.example` to `.env` for local development and set all values.

Client-side variables (safe to expose in browser bundle):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Server-side variables (must stay secret):
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Notes:
- Client code reads only `VITE_*` variables.
- `SUPABASE_SERVICE_ROLE_KEY` is used only in server code (`client.server.ts` and server functions).

## Local Development

Install dependencies:

```bash
npm ci
```

Start the app:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build locally:

```bash
npm run preview
```

## Quality and Verification

Available scripts:
- `npm run lint` - ESLint checks
- `npm run typecheck` - TypeScript `--noEmit`
- `npm run format` - Prettier write
- `npm run format:check` - Prettier check
- `npm run verify` - Production safety gate (`typecheck` + `build`)

Recommended pre-deploy command:

```bash
npm run verify
```

## Authentication and Authorization

- Auth middleware validates incoming bearer tokens for protected server functions.
- Admin-only server functions enforce role checks before mutating privileged data.
- Server Supabase admin client is isolated from client bundles and should never be imported in client components.

## Database and Migrations

Supabase migration files are in:
- `supabase/migrations/`

Apply migrations in your Supabase workflow before deploying app changes that depend on schema updates.

## Deployment (Vercel)

This repository includes `vercel.json` with deterministic commands:
- Install: `npm ci`
- Build: `npm run build`

In Vercel project settings, configure all required environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Deployment checklist:
- `npm run verify` passes locally
- Required Supabase migrations are applied
- All Vercel environment variables are set for the target environment
- Initial admin state is validated for fresh environments

## CI

GitHub Actions workflow:
- `.github/workflows/ci.yml`

Current CI gate runs:
- install
- typecheck
- build

## Security Notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code or public logs.
- Keep `.env` out of version control.
- Use least-privilege access patterns for any future server function additions.

## Troubleshooting

Missing Supabase env errors:
- Verify both `VITE_*` and server-side variables are configured correctly.

401 from protected server functions:
- Ensure requests include `Authorization: Bearer <access_token>`.

Build warnings about large chunks:
- App can still build and deploy; optimize with route-level/lazy splitting if needed.

## Contributing

1. Create a feature branch.
2. Keep changes scoped and production-safe.
3. Run `npm run verify` before opening a PR.
4. Include migration files for schema changes.

## License

Proprietary or internal use unless your organization defines otherwise.
