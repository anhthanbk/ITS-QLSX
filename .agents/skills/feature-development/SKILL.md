---
name: feature-development
description: "End-to-end workflow for implementing a new application feature safely."
---

# Feature Development Skill

1. Inspect the repository and identify relevant files.
2. Inspect database schema and existing data-access patterns if the feature touches data.
3. Inspect authentication/RLS/permissions if access is involved.
4. Write a concise implementation plan.
5. Identify risks and affected existing functionality.
6. Implement the smallest coherent change.
7. Run typecheck and lint.
8. Run relevant tests.
9. Run a production build.
10. Start the app and verify the user journey in the browser.
11. Fix verified defects.
12. Re-run verification.
13. Report:
   - requirements satisfied
   - files changed
   - database changes
   - tests/checks
   - remaining risks
