---
name: frontend-dev
description: Use when making frontend changes. Launches Chrome in debug mode with AI profile, connects Chrome DevTools MCP, runs the dev server, and inspects work visually. Always use this skill before and after frontend modifications to verify the UI.
user-invocable: false
allowed-tools: Bash, Read, Glob, Grep, Edit, Write
---

# Frontend Development — Visual Verification

Whenever you make frontend changes, you MUST visually verify your work using Chrome DevTools MCP. This means:

1. Ensuring Chrome is running in debug mode
2. Ensuring the dev server is running
3. Navigating to the relevant page
4. Taking screenshots and inspecting the DOM to verify your changes

## Chrome Debug Instance

All Chrome management is handled by the `scripts/chrome.sh` script in this skill directory. The script path is:

```
.claude/skills/frontend-dev/scripts/chrome.sh
```

### Commands

| Command | Description |
|---|---|
| `chrome.sh start` | Launch Chrome in headless mode (default, no window) |
| `chrome.sh start --headful` | Launch Chrome with a visible window |
| `chrome.sh stop` | Save open tabs and kill Chrome |
| `chrome.sh switch` | Toggle headless <-> headful, preserving all tabs |
| `chrome.sh status` | Show mode and list open tabs |

Chrome runs on port **9225** using `~/.chrome-debug-ai/` as the data directory. Sessions and cookies persist across restarts. Tabs are saved and restored automatically on `stop` and `switch`.

### Default mode: headless

Always start Chrome in **headless** mode (no `--headful` flag). This prevents the browser from stealing window focus. CDP works identically in headless — screenshots, navigation, console, network all function normally.

Switch to headful only when the user explicitly asks to see the browser (e.g., for manual sign-in or visual debugging). Use `chrome.sh switch` to toggle — tabs are preserved.

### First-time setup

The first time, Chrome must be launched in headful mode so the user can sign into accounts:

```bash
.claude/skills/frontend-dev/scripts/chrome.sh start --headful
```

After the user signs in and you stop Chrome, subsequent launches in headless mode will have those sessions.

### Attaching to an existing Chrome

If the user says to connect to an existing Chrome (e.g., "attach to port 9224"), check if it's running:

```bash
curl -s http://127.0.0.1:<PORT>/json/version
```

If the port differs from 9225, update `.mcp.json` to point the Chrome DevTools MCP to the correct port and inform the user they need to restart the MCP connection.

## Chrome DevTools MCP

The MCP server is configured in `.mcp.json` at the project root and connects to `http://127.0.0.1:9225`.

Use Chrome DevTools MCP tools to:
- **Navigate** to pages
- **Take screenshots** to visually verify changes
- **Inspect DOM elements**
- **Check console** for errors
- **Monitor network** requests
- **Evaluate JS** in the page context

## Verification Workflow

After making frontend changes:

1. **Ensure Chrome is running**: `chrome.sh start` (idempotent — safe to call every time)
2. **Ensure dev server is running** — check if it's up, if not ask the user before starting it
3. **Navigate** to the page you changed using Chrome DevTools MCP
4. **Screenshot** the result
5. **Check console** for errors or warnings
6. **Report** what you see — describe the visual result and any issues

## Chrome Lifecycle

Keep Chrome running for the entire session. Do NOT stop Chrome between individual changes — starting and stopping repeatedly wastes time and loses in-memory page state.

- **Start once** at the beginning of frontend work. `chrome.sh start` is idempotent so calling it multiple times is safe.
- **Keep running** throughout the session while iterating on frontend changes.
- **Stop only** when the user's frontend work is clearly finished (e.g., they move on to backend work, end the conversation, or explicitly ask to close it).

## Rules

1. ALWAYS verify frontend changes visually. Do not assume your code works — look at it.
2. Check the browser console for errors after every change.
3. Keep Chrome running throughout the session. Only run `chrome.sh stop` when frontend work is done for the session.
4. If Chrome DevTools MCP tools are not available, remind the user to restart Claude Code to pick up the `.mcp.json` config.
5. If the dev server is not running, ask the user before starting it.
