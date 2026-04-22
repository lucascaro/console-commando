# Contributing

## Setup

<Clone, install dependencies, run locally.>

```
git clone <repo>
cd <project>
<install command>
<run command>
```

## Build / Test / Lint

See `AGENTS.md` → "Build / Test / Lint Commands". All commands must pass before opening a PR.

## Feature Workflow

This project uses the [hivesmith](https://github.com/lucascaro/hivesmith) feature pipeline. From inside your AI coding agent (Claude Code, Codex, Gemini, Copilot, Factory):

1. `/hs-feature-next` — see the current pipeline state and next recommended action
2. `/hs-feature-new <description>` or `/hs-feature-ingest <issue#>` — add a new item
3. `/hs-feature-triage [#]` → `/hs-feature-research [#]` → `/hs-feature-plan [#]` → `/hs-feature-implement [#]`
4. `/hs-changelog-update` — add an `[Unreleased]` entry for any user-visible change
5. `/hs-review-pr <#>` — deep parallel review before merge
6. `/hs-release <version>` — cut a release once `[Unreleased]` is ready

Feature files live under `features/active/`. `features/BACKLOG.md` is the index.

## Commit Style

<Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`, `release:`. Link issues with `Fixes #<number>`.>

## Pull Request Checklist

- [ ] Build, lint, and tests pass (see `AGENTS.md`)
- [ ] `CHANGELOG.md` updated under `[Unreleased]` if user-visible (use `/hs-changelog-update`)
- [ ] `AGENTS.md` updated if module map or conventions changed
- [ ] Relevant docs updated (`README.md`, `docs/`)
- [ ] PR description references the issue (`Fixes #<number>`)

## Design Guidelines

<Project-specific design/UX rules go here. Delete this section if not applicable.>
