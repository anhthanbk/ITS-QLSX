# Antigravity AI Development Workflow

## Golden rule
Plan -> Approve -> Implement -> Verify -> Commit -> Deploy.

## Never ask the agent to build the whole application in one prompt.

Build by vertical slices:
1. Foundation
2. Auth/Roles/RLS
3. App shell
4. Master data
5. Business modules
6. Reports
7. Performance
8. Security
9. Release

## Standard feature prompt

Inspect the repository first. Do not code immediately.

Goal:
[DESCRIBE FEATURE]

Requirements:
[LIST REQUIREMENTS]

Constraints:
- Do not break existing functionality.
- Do not modify unrelated modules.
- Reuse existing architecture/components.
- Inspect database/RLS before data changes.
- Do not expose secrets.
- Use explicit database columns.
- Add tests where appropriate.

Process:
1. Analyze.
2. Create implementation plan.
3. Wait for approval if the change is architectural, security-sensitive or destructive.
4. Implement.
5. Typecheck.
6. Lint.
7. Test.
8. Build.
9. Browser-test the user journey.
10. Fix verified defects.
11. Report exactly what changed.

## Standard bug prompt

Reproduce the issue first.
Do not change code until the root cause is understood.
Then implement the smallest safe fix, add regression coverage where practical, and re-run the original browser scenario.

## Standard UI prompt

Review the requested screen in the browser first.
List UI/UX defects.
Do not change business logic.
After approval, implement the UI fixes and browser-test again.

## Standard release prompt

Run all quality checks, inspect git/environment/database/RLS/security, deploy through the approved pipeline, then test production in the browser.
