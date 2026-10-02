# Antigravity Prompt Pack

## PHASE 0 — Inspect and plan

You are the lead architect.

Do not modify code yet.

Inspect the entire repository and determine:
- current stack
- package manager
- source structure
- dependencies
- routes
- state management
- database/data-access patterns
- authentication
- tests
- build/deployment setup

Then propose:
1. architecture
2. folder structure
3. database strategy
4. security strategy
5. testing strategy
6. deployment strategy
7. phased implementation plan

Do not make changes until the plan is clear.

---

## PHASE 1 — Bootstrap

Prepare the project foundation.

Requirements:
- React + TypeScript + Vite
- Tailwind/shadcn if not already present
- ESLint
- Prettier
- strict TypeScript
- environment variable conventions
- test setup
- Playwright setup

Do not implement business modules yet.

Verify:
typecheck -> lint -> test -> build.

---

## PHASE 2 — Database

Inspect the current Supabase database.

Design the production-management schema with:
- departments
- positions
- employees
- users/roles/permissions
- products
- materials
- warehouses
- inventory transactions
- production plans
- production 
- machines
- maintenance
- mining
- hsse
- financal
- quality
- customers
- suppliers
- sales/orders
- audit logs

Before executing migrations:
1. show proposed schema
2. identify relationships
3. identify indexes
4. define RLS strategy
5. identify risks

Never invent existing columns. Preserve compatibility.

---

## PHASE 3 — Authentication and authorization

Implement:
- login/logout
- protected routes
- user profile
- roles
- permissions
- RLS-aware data access
- session handling
- unauthorized/forbidden states

Test:
- unauthenticated access
- authorized access
- unauthorized access
- logout
- refresh/session persistence.

---

## PHASE 4 — App shell

Build:
- responsive sidebar
- header
- breadcrumbs
- page container
- global loading
- error boundary
- toast/notification
- theme if requested
- navigation based on permissions

Do not build business modules yet.

Browser-test desktop and mobile widths.

---

## PHASE 5 — Module implementation template

Implement [MODULE].

Before coding:
1. inspect architecture
2. inspect schema/RLS
3. identify reusable components
4. plan data flow
5. define acceptance criteria

Implement:
- list
- search/filter
- create
- edit
- delete where appropriate
- detail view
- validation
- loading/empty/error states
- permission handling
- tests

Do not use SELECT *.
Use pagination for large datasets.
Avoid duplicate requests.

Then:
typecheck -> lint -> tests -> build -> browser test.

---

## PHASE 6 — Browser QA

Act as a senior QA engineer.

Do not modify code initially.

Test the complete user journey:
- login
- navigation
- list
- search
- filters
- create
- edit
- delete
- permissions
- refresh
- direct URL
- responsive layout
- console errors
- network errors

Classify:
Critical / High / Medium / Low.

After the report, fix only verified issues and re-test.

---

## PHASE 7 — Performance

Audit:
- query count
- payload size
- SELECT *
- duplicate requests
- N+1 queries
- full refreshes
- unnecessary realtime
- image/base64 usage
- pagination
- indexes
- caching
- client rendering

Prioritize fixes by estimated impact on:
1. database load
2. Supabase egress
3. latency
4. browser memory.

Do not optimize blindly.

---

## PHASE 8 — Security

Audit:
- authentication
- authorization
- RLS
- storage policies
- environment variables
- service-role exposure
- XSS
- input validation
- file upload
- sensitive logs
- overly broad queries

Do not modify initially. Produce findings first.

Then fix approved findings and retest.

---

## PHASE 9 — Production release

Prepare for production.

Run:
- typecheck
- lint
- tests
- build

Review:
- git status
- environment variables
- database migrations
- RLS
- storage
- routes
- deployment config

Deploy through GitHub/Vercel.

Then browser-test the production URL:
- login
- core workflows
- CRUD
- permissions
- refresh
- direct routes
- console/network.

Report:
- deployment status
- production URL
- checks passed
- remaining risks.
