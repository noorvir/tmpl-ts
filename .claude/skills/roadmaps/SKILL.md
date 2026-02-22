---
name: roadmaps
description: Create, update, and reference roadmap files. Use when asked to create/save a roadmap, update roadmap status, or when working on tasks that relate to a roadmap workstream.
argument-hint: [topic]
allowed-tools: Bash, Read, Glob, Grep, Edit
---

Roadmaps: $ARGUMENTS

## File Location and Naming

- `ROADMAP.md` lives at the repo root — the main top-level roadmap.
- All other roadmap files go in `roadmaps/`, using the `.roadmap.md` suffix, lowercase, hyphen-separated (e.g. `roadmaps/backend.roadmap.md`, `roadmaps/auth-overhaul.roadmap.md`).

## Pairing with Specs

Roadmaps and specs are paired by filename prefix. If `roadmaps/frontend.roadmap.md` exists, its paired spec is `roadmaps/frontend.spec.md`. The spec defines **what to build and how**; the roadmap tracks **progress of building it**.

- When creating or updating a roadmap, check if a paired `.spec.md` exists and reference it.
- Roadmaps should follow their paired spec — the spec is the source of truth for requirements.
- Standalone roadmaps (no paired spec) are fine for operational work that doesn't need a spec.

## Creating a roadmap

When the user asks to create or save a roadmap, use this template:

```markdown
# <Title>

Last updated: <YYYY-MM-DD>

<1-2 sentence scope description.>

## Current Snapshot

| Workstream | Status | Notes |
|---|---|---|
| <Workstream> | Not started | <context> |

## Implementation Tracks

### N) <Track Name>

Goal: <one-liner>

- In progress — Task description
- Planned — Task description

Definition of done:
- <criteria>

## Phase Progress Board

| Phase | Status | Progress | Notes |
|---|---|---:|---|
| P0: <name> | In progress | 55% | <context> |

## Immediate Next Priorities

1. <priority>
```

## Updating roadmaps

When a task is completed or its status changes:

1. Update status in the **Current Snapshot** table and the matching **Implementation Tracks** entry.
2. Update the **Phase Progress Board** progress percentage if meaningful progress was made.
3. Update `Last updated:` date.
4. Keep notes short and factual — file paths, what changed, not narrative.

### Status transitions

- Not started → In progress — when work begins.
- In progress → Done — when the work is complete and verified.
- Any → Blocked — include the reason in Notes.
- Planned → In progress — when a planned item gets picked up.

## Referencing other roadmaps

When a workstream in one roadmap has its own sub-roadmap, add a link in the Notes column:

```markdown
| Scraping pipeline | In progress | See [scraping roadmap](roadmaps/scraping-roadmap.md) |
```

Parent roadmaps should stay high-level. Push details into sub-roadmaps and link to them — don't duplicate content across files.

## When to create a sub-roadmap

If a workstream grows beyond 3-4 tasks, break it out into its own file in `roadmaps/` and reference it from the parent. Confirm with user before doing this.

## Rules

1. Status values are plain title-case: Done, In progress, Not started, Planned, Blocked.
2. Keep it concise and human-readable. Short notes, no filler text, no status legends or glossaries.
3. `ROADMAP.md` stays at repo root; all sub-roadmaps go in `roadmaps/`, lowercase.
4. Do not add tasks to a roadmap without the user asking.
5. Do not change progress percentages without real work backing it.
6. Do not rewrite roadmap structure or sections — only update statuses and notes.
