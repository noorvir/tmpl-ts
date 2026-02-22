---
name: create-skill
description: Create a new Claude Code skill (slash command). Use when asked to create, add, or set up a new skill or slash command.
argument-hint: [skill-name] [description]
---

Create a new skill called: $ARGUMENTS

## How to create a Claude Code skill

### Directory structure

A skill is a **directory** containing a required `SKILL.md` file. Place it at project scope:

```
.claude/skills/<skill-name>/
└── SKILL.md
```

For personal (cross-project) skills, use `~/.claude/skills/<skill-name>/SKILL.md` instead.

### SKILL.md format

Every `SKILL.md` has two parts: YAML frontmatter and markdown instructions.

```yaml
---
name: my-skill
description: When to use this skill. Claude reads this to decide auto-invocation.
---

Instructions Claude follows when this skill is invoked.
```

### Frontmatter fields

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `name` | string | directory name | Slash command name. Lowercase, hyphens only, max 64 chars |
| `description` | string | — | **Important.** Controls when Claude auto-invokes. Be specific |
| `argument-hint` | string | — | Hint shown in autocomplete, e.g. `[filename] [format]` |
| `disable-model-invocation` | bool | `false` | `true` = only the user can invoke (not Claude). Use for side-effect operations like deploy, push |
| `user-invocable` | bool | `true` | `false` = only Claude can invoke (background knowledge skill) |
| `allowed-tools` | string | — | Comma-separated tools usable without asking, e.g. `Read, Grep, Bash` |
| `model` | string | — | Override model for this skill, e.g. `opus`, `sonnet`, `haiku` |
| `context` | string | — | Set to `fork` to run in an isolated subagent context |
| `agent` | string | — | Subagent type when `context: fork` (e.g. `Explore`, `Plan`, `general-purpose`) |

### Argument substitution

Use these variables in the markdown body to reference user-provided arguments:

| Variable | Resolves to |
|----------|-------------|
| `$ARGUMENTS` | All arguments as a single string |
| `$0`, `$1`, `$2` ... | Positional arguments (0-indexed) |
| `$ARGUMENTS[N]` | Same as `$N` |

Example: `/migrate Button React Vue` -> `$0`=Button, `$1`=React, `$2`=Vue


### Invocation modes cheat sheet

| Config | User invokes | Claude invokes | Use case |
|--------|---|---|---|
| (defaults) | yes | yes | General-purpose skills |
| `disable-model-invocation: true` | yes | no | Dangerous/side-effect operations |
| `user-invocable: false` | no | yes | Background knowledge, coding standards |

### Guidelines

1. **Description is critical** — Claude uses it to decide whether to auto-invoke. Write it like a search query: specific verbs and nouns
2. **Keep SKILL.md under 500 lines** — Move large reference material to sibling files (`reference.md`, `examples.md`)
3. **Use `disable-model-invocation: true`** for anything with side effects (deploying, sending messages, pushing code)
4. **Use `allowed-tools`** to pre-authorize tools and avoid permission prompts during the skill
5. **Use `context: fork`** for exploratory skills that produce lots of intermediate output you don't want polluting the main conversation
6. **Skill names**: lowercase, hyphens, no spaces. The name becomes the `/slash-command`
7. **One responsibility per skill** — Don't combine unrelated workflows

### Example: creating the skill

1. Create the directory: `mkdir -p .claude/skills/<skill-name>`
2. Write `SKILL.md` with frontmatter + instructions
3. Test it: `/<skill-name>` or `/<skill-name> some arguments`
