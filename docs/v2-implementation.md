# Soulful Bot v2 implementation checklist

Requirements: [v2-plan.md](v2-plan.md). This file tracks execution, not a second specification.

## How to work

Implement one numbered step per run. At the start, state its scope and checks. Complete the step, inspect the diff for unnecessary complexity, record verification here, and stop. Keep later steps brief; refine the active step using the repo facts before coding. Fix a failed prerequisite before advancing.

Use one focused change or PR per step where practical. Do not auto-commit or push. External credentials can block live checks without blocking unrelated local work; clearly distinguish implemented from verified live.

## Current state

- Development branch: `codex/v2`.
- Setup complete: project instructions and implementation checklist created; Karpathy Guidelines installed globally in Codex.
- Step 1 complete: 40 regression tests in five suites; application code and production deployment unchanged.
- Next: step 2, development runtime and validated configuration.
- Live database location, backups, credentials, and chat mappings have not been verified.

## Steps

### 1. Baseline acceptance cases and regression tests — complete

Scope: establish repeatable local verification before changing the core.

- Inspect commands, callbacks, services, and persistence; document intended acceptance scenarios in test names or short fixtures.
- Add a minimal TypeScript-compatible test setup. Prefer an existing compatible runner if present; choose one runner without a custom test framework.
- Cover registration/unregistration, guest prerequisites/removal, manual attendee actions, protected admin actions, and attendee-list rendering using isolated mocks.
- Record known defects separately from expected behaviour. Keep regression tests passing for intended working flows; write defect tests when the corresponding fix is implemented.
- Ensure importing test targets does not start the bot, connect to a real database, or send messages. Keep any required testability extraction small.
- Check the existing TypeScript build and the new tests. Report baseline failures accurately rather than hiding them with broad cleanup.

Done when: repeatable local tests and build results are recorded, with no production credentials or network side effects. No v2 schema, AI SDK, or Neon migration in this step.

### 2. Development runtime and validated configuration — pending

Upgrade to Node 24 LTS; configure separate development credentials, TLS-capable database connections, and reproducible local execution. Keep existing production deployment intact. Verify missing/invalid configuration fails clearly and tests never use live settings.

### 3. Versioned migrations and PostgreSQL integration tests — pending

Introduce explicit migration execution and an isolated local PostgreSQL test database. Verify migration replay, schema constraints, and backup/restore tooling against disposable data. Prepare Neon connection instructions; do not migrate production.

### 4. Organisations, roles, and destination/topic bindings — pending

Implement scoped permissions and configurable destination purposes through commands/buttons. Verify two organisations cannot read or mutate each other's records, and two topics in one group route independently.

### 5. Transactional attendance and history — pending

Refactor the existing attendance flows into shared application services, enforce capacity atomically, and retain change history. Verify concurrent final-place signups, guests, manual additions, and cancellation queries.

### 6. Venues, templates, and structured event drafts — pending

Implement saved venue/default settings, event snapshots, date/time handling, safe rendering, and preview/confirmation through commands/buttons. Verify precedence and missing details; never seed the illustrative roster as registrations. No deadline automation.

### 7. Publication and deleted-post recovery — pending

Publish one registration post per event and link announcements to it. Implement explicit replacement/recreation preserving attendance/history, legacy callback compatibility, and superseded-reference handling. Verify topics and partial publication outcomes.

### 8. Configurable alerts and persisted delivery recovery — pending

Implement notification toggles, destination selection, per-event overrides, minimum-crossing alerts, and persisted delivery retries. Verify restart recovery and rate limits without continuous idle polling of Neon or blind retries of uncertain sends.

### 9. AI event creation and updates — pending

Add the official Gemini SDK and schema validation. Interpret authorised English/Russian requests into existing application actions with scoped context and confirmation. Test adversarial input, ambiguous dates/venues, stale confirmations, and free-quota failures using fixed model responses.

### 10. AI attendance/history questions and development checks — pending

Answer supported questions from database records with minimal provider-visible information. Verify access control, factual results, provider failure fallback, and actual workflows in approved development groups/topics. Obtain development credentials only when required.

### 11. Migration and rollback rehearsal — pending

Verify live deployment/database location read-only, take an authorised backup, and rehearse migration on a copy with verified chat mappings. Validate old event buttons and reconcile v2 writes in a rollback drill. No live cutover.

### 12. Production cutover and observation — pending; separate release authorisation

Use the rehearsed maintenance procedure to migrate the latest data and switch the production consumer. Verify attendance, admin access, legacy messages, delivery errors, and Neon usage. Retain the old deployment and backup through release validation.

## Deferred

Deadline automation, delayed publication, recurring events, scheduled reminders, and waitlists. Immediate publication after confirmation is the first-release baseline; delayed publication requires a separate scope decision.

## Verification log

- 2026-10-05: workflow setup only. Confirmed `codex/v2` exists; reviewed the installed skill (one Markdown file); added repo instructions and this checklist. No application code, dependencies, production services, or databases changed.
- 2026-10-05: reconciled the canonical roadmap and Codex plan snapshot, checked the checklist against the agreed scope, and added the source-of-truth rule to AGENTS.md. Step 1 remains pending.

- 2026-10-05: step 1 complete. Baseline and final `yarn build` passed on local Node 24.19.0. `yarn test` passed 40 tests across five suites; `yarn test:types` passed. Jest/ts-jest are dev-only dependencies; no existing dependency versions changed. Tests mock the database connection, file logger, and Telegram boundary; loading pg/dotenv or attempting Telegram network calls fails the suite. No production source changes or testability refactors were needed. Docker's Node 18 runtime was not tested; runtime alignment belongs to step 2.

## Known existing defects to address in later steps

These are source-review findings, not accepted behaviour or claims established by database integration tests. Add failing regression cases when implementing each fix.

- Steps 4/7: `/event` is registered without admin authentication; event lookups use message ID without chat identity, and callbacks do not verify ownership of their source message.
- Step 5: capacity checks and inserts are separate operations, with no uniqueness constraint protecting concurrent registrations; manual additions bypass capacity checks.
- Steps 4/5/7: several database helpers swallow write errors, allowing services to report success after a failed write. Review failure propagation while refactoring each affected flow.
- Step 5: manual removal by name does not remove a registered player's guests, unlike removal by Telegram ID.
- Step 6: event creation accepts non-positive or partially numeric capacity values, and rendered names/descriptions are not consistently escaped for Telegram HTML.
- Steps 7/8: the registration message is sent before persistence, so failures can leave an orphan post; delivery failures are logged without recovery.

The baseline mocks SQL results and cannot establish database concurrency, constraint, or transaction correctness. Real PostgreSQL integration tests remain in step 3 and the corresponding feature steps.
