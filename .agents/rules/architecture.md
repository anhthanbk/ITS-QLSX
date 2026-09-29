---
trigger: always_on
description: "Project architecture and maintainability constraints."
---

# Architecture Rules

- Follow the repository's established architecture.
- Keep presentation, domain/business logic, data access and validation separated.
- Prefer feature-oriented modules for business domains.
- Do not create giant components or giant utility files.
- Reuse existing abstractions before creating new ones.
- Do not introduce global state when local state or server state is sufficient.
- Keep routes/pages thin; move reusable logic into feature modules/hooks/services.
- Do not change foundational architecture during a feature task unless explicitly approved.
- Before changing shared code, inspect all major consumers.
