# Antigravity Production App Starter

This repository is a starter operating system for Google Antigravity vibecoding.

## Important

The project intentionally separates:
- persistent rules: `.agents/rules/`
- forward-compatible Agent Skills: `.agents/skills/`
- legacy compatibility workflows: `.agents/workflows/`
- workspace MCP config: `.agents/mcp_config.json`
- human-readable architecture/prompt documentation: `docs/`

Google Antigravity is migrating Workflows toward Agent Skills. Prefer the Skills in new work.

## First steps

1. Open this repository in Antigravity.
2. Review `AGENTS.md`.
3. Review `docs/ARCHITECTURE.md`.
4. Configure MCP servers in `.agents/mcp_config.json` or via Antigravity's MCP Store.
5. Start with the Phase 0 prompt in `docs/PROMPTS.md`.
6. Do not build the entire application in one request.
7. Work in small verified vertical slices.
