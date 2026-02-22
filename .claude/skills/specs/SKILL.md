---
name: specs
description: Create, update, and reference spec files. Use when asked to write/save a spec, update a spec, or when working on tasks that need a specification document. Specs define the what and how of a feature before implementation begins.
argument-hint: [topic]
allowed-tools: Bash, Read, Glob, Grep, Edit
---

Specs: $ARGUMENTS

## File Location and Naming

- Spec files live in `roadmaps/` alongside roadmap files.
- Naming convention: `<name>.spec.md` — lowercase, hyphen-separated name (e.g. `roadmaps/frontend.spec.md`, `roadmaps/auth.spec.md`).

## Pairing with Roadmaps

Specs and roadmaps are paired by filename prefix. If `roadmaps/frontend.spec.md` exists, its paired roadmap is `roadmaps/frontend.roadmap.md`. The spec defines **what to build and how**; the roadmap tracks **progress of building it**.

- When creating or updating a spec, check if a paired `.roadmap.md` exists and reference it.
- Roadmaps should follow their paired spec — the spec is the source of truth for requirements.
- Standalone specs (no paired roadmap) are fine for features still in design phase.
- Standalone roadmaps (no paired spec) are fine for operational work that doesn't need a spec.

## Creating a spec

When the user asks to create or save a spec, use this template:

```markdown
# <Title> — Spec

Last updated: <YYYY-MM-DD>

<1-2 sentence summary of what this spec covers.>

## Goals

- <Goal 1>
- <Goal 2>

## Non-Goals

- <Explicitly out of scope>

## Constraints

- <Technical, product, or timeline constraints>

## Design

### Overview

<High-level description of the approach. What are the key pieces and how do they fit together?>

### <Section per major component or subsystem>

<Detail the design: data models, APIs, UI flows, algorithms — whatever is relevant.>

## Phases

Break the work into ordered phases. Each phase should be shippable or at least testable.

### Phase N: <Name>

<What this phase delivers. List the key deliverables and acceptance criteria.>

- <Deliverable>
- <Deliverable>

## Open Questions

- <Unresolved decisions or unknowns>

## References

- <Links to related specs, roadmaps, PRs, external docs>
```

Adapt the template to the feature — not every section is required. Skip sections that don't apply, add sections that do. The goal is clarity, not checkbox compliance.

## Updating specs

When requirements change or decisions are made:

1. Update the relevant sections directly.
2. Move resolved items from **Open Questions** to the appropriate section.
3. Update `Last updated:` date.
4. Keep a light touch — specs should stay readable, not accumulate revision history inline.

## Rules

1. Specs define requirements and design. They do not track progress — that's the roadmap's job.
2. Keep specs concise. Prefer bullet points and short paragraphs over walls of text.
3. Do not add requirements without the user asking.
4. Do not speculatively fill in design details — ask the user when uncertain.
5. Do not duplicate content between a spec and its paired roadmap.
6. All spec files go in `roadmaps/`, using the `.spec.md` suffix.
