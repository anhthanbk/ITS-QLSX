# Application Architecture

## Recommended stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Zustand only where client/global state is justified
- React Hook Form + Zod
- Vitest + React Testing Library
- Playwright
- GitHub
- Vercel
- Cloudflare DNS

## Suggested source structure

src/
  app/
  components/
  features/
    auth/
    hr/
    warehouse and logistics/
    purchasing/
    production/
    quality control
    maintenance/
    mining/
    financal/
    hsse/
    reports/
  lib/
    supabase/
    validation/
    utils/
  hooks/
  stores/
  types/
  routes/

## Architectural principles

- Feature-oriented organization.
- Thin UI components.
- Centralized data-access patterns.
- Explicit validation.
- Least-privilege permissions.
- Database constraints and RLS are part of the application security model.
- Avoid global state unless justified.
- Avoid full refreshes after small mutations.
