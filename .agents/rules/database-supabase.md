---
trigger: model_decision
description: "Apply when working with PostgreSQL, Supabase, migrations, queries, RLS, Storage or database-related code."
---

# Supabase/PostgreSQL Rules

- Inspect the real schema before writing SQL or data-access code.
- Prefer explicit column lists; never default to `select('*')`.
- Add indexes only when justified by query patterns.
- Use server-side pagination for large datasets.
- Avoid N+1 queries.
- Avoid fetching entire related datasets when only IDs/counts are required.
- Keep mutations transactional when atomicity is required.
- Every protected table must have appropriate RLS policies.
- Never expose a service-role key to the browser.
- Storage buckets and object policies must be reviewed together.
- Do not put large binary payloads/base64 into PostgreSQL if Storage is suitable.
- After schema changes, verify affected queries, types, RLS and indexes.
- For performance work, report expected impact on query count, payload size and egress.
