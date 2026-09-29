---
trigger: model_decision
description: "Apply to authentication, authorization, secrets, API endpoints, file uploads, database policies and security-sensitive changes."
---

# Security Rules

- Never hard-code credentials or secrets.
- Never expose service-role/admin credentials in frontend code.
- Treat client input as untrusted.
- Validate and sanitize data at boundaries.
- Enforce authorization server-side/database-side, not only by hiding UI.
- Review Supabase RLS for every protected data path.
- Restrict file upload type, size and storage permissions.
- Do not log passwords, tokens, private keys or sensitive personal data.
- Avoid returning more data than the user needs.
- Before production release, run a security review.
