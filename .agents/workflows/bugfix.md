---
description: "Legacy compatibility workflow: reproduce, fix and verify a bug."
---

1. Reproduce the bug.
2. Identify the root cause.
3. Implement the smallest safe fix.
4. Add regression coverage where practical.
5. Run typecheck, lint, tests and build.
6. Re-test the original scenario in the browser.
7. Check for regressions.
8. Summarize root cause, fix and verification.

NOTE: Prefer `/bugfix` as the forward-compatible Agent Skill.
