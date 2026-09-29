---
trigger: model_decision
description: "Apply when adding or changing tests, fixing bugs, or declaring features complete."
---

# Testing Rules

- Reproduce a bug before fixing it when practical.
- Add regression coverage for important bugs.
- Test behavior, not implementation details.
- Cover happy path and important failure/permission paths.
- Run typecheck, lint and build before completion when available.
- For UI work, perform browser verification.
- For critical flows, prefer end-to-end tests with Playwright.
