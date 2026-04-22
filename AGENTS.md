# AGENTS.md

Guidance for AI agents (and humans) working in this repo. Keep this file current — many of the hivesmith skills read it to calibrate their work.

## Project Overview

<Describe what this project is, the tech stack, and the core user problem it solves. 2-4 sentences.>

## Module Map

<List the top-level packages/directories/modules with one line each describing what lives there. Example:>

- `src/core/` — domain logic, no I/O
- `src/api/` — HTTP handlers
- `src/db/` — persistence layer
- `cmd/` — CLI entrypoints
- `tests/` — integration tests

## Key Types / Concepts

<List the 5-10 most important types or concepts a new contributor must understand. One line each.>

## Data Flows

<Describe 2-3 critical data flows end to end — e.g. "Request lifecycle: HTTP → handler → service → repo → DB → response".>

## Build / Test / Lint Commands

All of these must pass before a PR merges. The `/hs-feature-implement` skill runs these.

- **Build:** `<command>`
- **Lint:** `<command>`
- **Unit tests:** `<command>`
- **Integration / functional tests:** `<command>`
- **Everything:** `<single command that runs all of the above>`

## Testing Conventions

- **Unit tests** live <where>, named <pattern>, and cover <what>.
- **Integration / functional tests** live <where>, named <pattern>, and cover <what>.
- Every behavioral change MUST ship with tests. Plans without concrete test function names are incomplete.
- <Any fixtures, helpers, or golden-file conventions go here.>

## Common Change Patterns

<For each recurring change type, describe where code lives and the order of edits. Example:>

### Adding an API endpoint
1. Define the request/response types in `src/api/types/`
2. Add the handler in `src/api/handlers/`
3. Wire the route in `src/api/router.go`
4. Add an integration test in `tests/api/`

### Adding a new CLI command
<…>

## UX Guidelines

<If the project has a user-facing surface, document any cross-cutting UX rules here. Examples:>

- Every destructive action requires confirmation
- Error messages must include the actionable next step
- Status must be visible for any operation taking > 200ms

## Documentation Maintenance

- **`CHANGELOG.md`** — update under `[Unreleased]` for every user-visible change (use the `/hs-changelog-update` skill; `/hs-release` stamps the date at release time)
- **This file (`AGENTS.md`)** — update when module map, conventions, or data flows change
- **`README.md`** — update for user-visible feature additions or setup changes
- **`docs/`** — update alongside the feature, not after

## Commit Style

<Conventional commits recommended: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`, `release:`. Link issues with `Fixes #<number>`.>
