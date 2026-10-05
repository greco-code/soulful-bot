# Soulful Bot development instructions

## Scope and workflow

- Read `docs/v2-plan.md` for requirements and `docs/v2-implementation.md` for progress before v2 work.
- Implement one numbered step per run unless George explicitly requests more. Finish its checks, update its status, and stop before starting the next step.
- A request to continue means the next pending step. A request to review is read-only.
- Briefly state the current step, intended changes, and acceptance checks before editing. Ask only when missing information materially changes behaviour or prevents safe progress.
- Keep progress in the implementation checklist; do not generate extra plans, tracking systems, or architecture documents for routine changes.
- `docs/v2-plan.md` is the source of truth for requirements. When requirements change, update it first and regenerate the Codex plan card from the same text. The checklist tracks execution; it must not introduce conflicting requirements.

## Simple, maintainable code

- Use the installed `karpathy-guidelines` skill for non-trivial coding and refactoring when available. These repo rules remain applicable without it.
- Inspect existing code first. Make the smallest correct change that fully meets the current step's requirements.
- Prefer direct, readable TypeScript and existing patterns. Avoid speculative abstractions, generic frameworks, dependency injection containers, event buses, and configurable systems beyond the agreed requirements.
- Extract shared code when actual repeated behaviour benefits from it; do not create interfaces and layers for every function.
- Add a dependency only for a concrete need in the current step; explain what it replaces or simplifies. Do not upgrade unrelated packages or switch tools for novelty.
- Refactor incrementally where a current requirement or known defect justifies it. No unrelated renames, formatting, folder restructuring, or cleanup.
- Preserve strict type safety. Do not silence failures with `any`, blanket assertions, swallowed exceptions, or fabricated fallback data.
- Simplicity does not excuse missing organisation isolation, permissions, capacity transactions, or required delivery recovery. Handle concrete failure modes without speculative defensive machinery.
- Before finishing, inspect the diff and remove unnecessary code introduced during this step.

## Production boundaries

- Develop v2 on `codex/v2`. `main` currently triggers the existing DigitalOcean deployment; never push or merge v2 into that path as part of routine development.
- Use a dedicated development Telegram token and approved test chats. Do not run development against the production token, chats, or database.
- Keep secrets out of tracked files, logs, fixtures, and responses. Provide placeholders in configuration examples.
- Do not modify live infrastructure, run production migrations, publish to real chats, or delete live data unless explicitly authorised for that operation.
- Preserve legacy event IDs/callback compatibility. Production cutover and rollback are separate release tasks.

## Validation and reporting

- Write acceptance scenarios first. Add meaningful regression tests before changing existing behaviour; add new feature tests alongside or before implementation.
- Test real business outcomes and risks, not implementation details. Use PostgreSQL integration tests for database constraints and transactions; mock AI and Telegram for routine tests.
- Do not contact real Telegram chats or AI providers during automated tests. Live checks use explicit development configuration.
- Run checks appropriate to the change. Documentation-only changes need link/content and diff checks, not an application test suite.
- Record what passed, what could not be verified, and any external prerequisites. Never mark a step complete on command success alone.
- Keep the final report short: current step, result, verification, and next step. Do not automatically commit, push, deploy, or proceed to the next numbered step.
