---
name: release
description: "Prepare and verify a production release."
---

# Release Skill

1. Inspect git status and current branch.
2. Review pending changes.
3. Run typecheck, lint, tests and production build.
4. Check environment variable references.
5. Review database migrations and RLS changes.
6. Review security-sensitive changes.
7. Verify production configuration.
8. Deploy through the project's approved CI/CD path.
9. Test the deployed application in the browser.
10. Check console/network errors.
11. Verify authentication and critical CRUD workflows.
12. Report deployment URL/status and any remaining risks.
