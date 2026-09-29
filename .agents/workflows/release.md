---
description: "Legacy compatibility workflow: production release verification."
---

1. Inspect git status and pending changes.
2. Run typecheck, lint, tests and build.
3. Review environment variables, migrations and RLS.
4. Review security-sensitive changes.
5. Deploy using the approved CI/CD path.
6. Test the production URL in the browser.
7. Verify authentication and critical workflows.
8. Check console and network errors.
9. Report release status and remaining risks.

NOTE: Prefer `/release` as the forward-compatible Agent Skill.
