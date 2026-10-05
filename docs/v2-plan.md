# Soulful Bot v2 implementation roadmap

Status: agreed scope; implementation not started. Updated 2026-10-05.

## Summary and source of truth

Build v2 separately while the existing production bot continues working. Support multiple organisations, configurable chats/topics, saved venues and templates, attendance history, configurable notifications, and AI-assisted administration.

This file is the canonical requirements and architecture plan. The Codex plan card is a snapshot of this text. Update this file first when requirements change, then regenerate the card from it. Track execution in [v2-implementation.md](v2-implementation.md), completing one numbered step per run.

## Product behaviour

- **Organisations and roles:** App admins create organisations and appoint initial organisation admins. App admins and authorised organisation admins configure their destinations; organisation admins manage their club's admins, settings, venues, and events. Every operation enforces organisation boundaries.
- **Destinations:** Register chats and optional topics with friendly names and purposes: registrations, announcements, admin interaction, or notifications. A destination may serve multiple purposes; there is no fixed number of chats. Support different topics in one group and multiple announcement/notification destinations. Verify bindings and required bot permissions. Public-group topics are not private; private history and notifications require an explicitly designated private destination.
- **Venues and templates:** Save venue names/aliases, addresses, parking instructions, and contacts. Save usual hours, price/currency, payment instructions, minimum/maximum attendance, and message templates. Resolve values from explicit event input, then venue defaults, then organisation defaults. Payment-detail changes require explicit admin input and review.
- **Easy event creation:** Requests such as “open an event for next Sunday at 90 Stadium Road” select saved information and prepare a preview showing exact dates, times, and destinations. Ask about missing or ambiguous details. Never invent instructions, contacts, or payment details. Snapshot resolved settings on each event. Render attendee lists separately; the illustrative message is not approved seed data.
- **One signup post:** Each event has one active registration post; announcements link to it. Admins can explicitly recreate a deleted post while preserving the event, attendees, guests, and history. Do not rely on deletion notifications. Attempt to remove/replace the old post, treating a missing-message result as expected; surface permission or uncertain errors before risking a second active post. Replace message references, reject obsolete callbacks, and update tracked announcement links where possible.
- **Attendance and history:** Preserve registration, cancellation, guests, and manual additions/removals. Everyone counts towards capacity and the minimum. Enforce capacity transactionally. Record changes, actors, and timestamps without deleting history when attendance is removed. Do not claim to recover cancellations already deleted by v1.
- **Notifications:** Configure announcement/alert types, destinations, and enabled state through organisation defaults and per-event overrides. Include minimum reached and below-minimum alerts with the count and relevant change. Suppress duplicate/unchanged-state alerts. Disabling a type cancels unsent deliveries; re-enabling does not replay historical alerts.
- **Defaults and exclusions:** Russian output, English/Russian admin requests, and America/Toronto timezone. Immediate publication after confirmation. No deadline automation or deadline-based cancellation. Delayed publication, recurring events, scheduled reminders, and waitlists are deferred.

## Architecture and implementation sequence

### 1. Protect production and establish tests

- Develop on codex/v2 using a separate development Telegram token and test chats. Keep v2 outside the current main-triggered production deployment path.
- Verify the live DigitalOcean deployment/database location and document backup/restore procedures before migration. Inventory legacy events and verified chat/topic mappings; the current schema lacks chat IDs.
- Write acceptance scenarios and regression tests for intended behaviour before refactoring. Fix permission and concurrency defects rather than preserving them.

### 2. Establish infrastructure and refactor the core

- Keep TypeScript, grammY, pg, Winston, Docker Compose, and DigitalOcean bot hosting. Use Node.js 24 LTS and PostgreSQL 17 on Neon with separate development/production branches. Development uses synthetic data; the live bot retains its database until cutover.
- Add validated configuration, TLS connections, versioned migrations, and operational logging. Remove unused Express; update other dependencies only when justified.
- Separate Telegram handlers, application services, persistence, rendering, and AI integration with direct modules. Commands and AI share application services; avoid generic frameworks and speculative layers.
- Introduce organisation-scoped roles/settings, destination references, venues/templates, structured events, attendance history, and persisted outgoing deliveries. Message identity uses chat ID plus message ID; topic ID controls routing.
- Persist required notifications atomically with attendance changes. Use in-process wakeups for known work and recover pending deliveries on startup, avoiding continuous idle Neon polling. Do not add pg-boss by default.
- Honour Telegram rate limits, track delivery per destination, and surface uncertain send outcomes rather than blindly duplicating posts.

### 3. Implement event operations without AI

- Build organisation setup, destination/topic binding, venue/template management, and notification configuration through commands/buttons.
- Implement previews, single-post publication, event updates, deleted-post recovery, history queries, and minimum-crossing alerts before model interpretation.
- Preview event/announcement text and destinations. Publish registration first, then announcements, and report destination-specific results. Registrations belong to the event, not its message.

### 4. Add controlled AI administration

- Use the official Gemini SDK with a configurable free-tier model and no automatic paid fallback. Commands/buttons continue working during AI failures.
- Process explicit mentions/replies from authorised admins in approved admin destinations. Use typed internal actions; no MCP server is needed.
- Authorise before retrieving context. Derive organisation/user identity from trusted application context. Validate model arguments with Zod, then enforce ownership, permissions, business rules, and allowed destinations in application code.
- Require previews and confirmation for AI-requested publication and event changes. Bind confirmation to the actor, organisation, action, and draft revision; revalidate before execution and prevent replay.
- Provide no shell, raw SQL, credentials, filesystem, arbitrary network access, or unrestricted Telegram sending. Treat prompts, stored text, and model output as untrusted; escape Telegram formatting and filter returned fields.
- Send minimal necessary context to the provider, avoiding full chats and unnecessary attendee identities. Where possible, let AI select a supported query and render sensitive results locally from database facts.

## Testing and acceptance

- Write acceptance cases first; add meaningful regression tests before refactors and feature tests alongside or before implementation. Unit-test permissions, settings resolution, rendering, dates, and notification decisions.
- Use real isolated PostgreSQL integration tests for migrations, transactions, constraints, and organisation isolation. Mock AI and Telegram routinely; use the development bot for manual end-to-end checks.
- Verify isolation across two organisations, forged callbacks/destination IDs, unauthorised admins, malicious prompts, and stored text.
- Test concurrent final-place signups, duplicate updates, guests, manual changes, minimum crossings, and notification toggles.
- Test topics, multiple announcement destinations, partial failures, restart recovery, stale confirmations, and uncertain sends. Delete/recreate a signup post and verify preserved attendance/history, corrected references, and rejected obsolete callbacks.
- Test English/Russian requests, ambiguous dates, unknown venues, missing defaults, snapshots, formatting, and AI quota exhaustion. Verify no deadline automation exists.

## Migration and rollout

- Rehearse migration with a database copy. Preserve legacy event IDs and callback formats; verify existing buttons, counts, guests, and admin mappings.
- During a separately authorised maintenance window, stop the old bot, take a final backup, migrate the latest data, validate it, and start v2 with the production token. Never run both consumers with that token; preserve queued updates.
- Retain the old deployment and backup. Rehearse rollback with reconciliation of changes accepted by v2; restoring an old snapshot alone is insufficient after new writes.
- Monitor delivery failures, database/free-tier usage, AI errors, and legacy callback failures. Obtain approved venue defaults, destination mappings, credentials, and the maintenance window during setup; do not infer them from the example message.
