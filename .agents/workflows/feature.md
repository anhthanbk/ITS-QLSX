---
description: "Legacy compatibility workflow: implement and verify a feature."
---

1. Inspect the repository and relevant architecture.
2. Inspect database/RLS/auth if applicable.
3. Produce a concise plan before editing.
4. Implement only the requested feature.
5. Run typecheck, lint, tests and build.
6. Verify the user journey in the browser.
7. Fix verified issues.
8. Re-run verification.
9. Summarize files changed, checks passed and remaining risks.

NOTE: Antigravity Workflows are being migrated toward Agent Skills. Prefer `/feature-development` for new work.
