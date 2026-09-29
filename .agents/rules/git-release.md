---
trigger: model_decision
description: "Apply to git, release, deployment, production and versioning tasks."
---

# Git and Release Rules

- Never commit secrets.
- Never force-push.
- Prefer feature branches.
- Keep commits focused.
- Use conventional commits where practical.
- Before release, verify build, tests, environment variables, database migrations and deployment configuration.
- Production deployment must be treated as a separate verification stage from local development.
