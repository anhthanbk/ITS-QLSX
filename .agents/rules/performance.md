---
trigger: model_decision
description: "Apply to performance, Supabase egress, network requests, rendering, caching and large-data features."
---

# Performance Rules

- Measure before optimizing when practical.
- Avoid duplicate API/database calls.
- Avoid full-store refreshes after small mutations.
- Use targeted invalidation/refetch or optimistic updates where safe.
- Paginate large lists.
- Select only required columns.
- Avoid loading attachments/images until needed.
- Prefer URLs/object storage over database-embedded base64.
- Review indexes for frequent filters/sorts.
- For every optimization, state what changed and how it was verified.
