# v0 Provider

Integration for [v0.dev](https://v0.dev) by Vercel — doctors describe what they need, v0 builds a live preview using pre-built clinical components from the registry, and deploys with one click.

## How It Works

1. Doctor opens [v0.dev](https://v0.dev)
2. Pastes a prompt referencing the protocol URL (see [install guide](install.md))
3. v0 reads the protocol, fetches registry components, and generates a working app
4. Doctor previews and deploys — gets a URL that works on any device

## Key Files

| File | Purpose |
|------|---------|
| [protocol.md](protocol.md) | Main protocol — v0 reads this to understand how to build clinical interfaces |
| [install.md](install.md) | Doctor-facing install guide with example prompts |
| [workflows/](workflows/) | Per-component build workflows (3-phase: requirements, build, preview) |

## Component Registry

All components are served as shadcn-compatible registry JSONs from:

```
https://medical-protocol.vercel.app/medical-protocol/r/{component}.json
```

Available components:

| Component | Registry JSON |
|-----------|--------------|
| Vital Signs | `vital-signs.json` |
| Acid-Base Analyzer | `acid-base.json` |
| BMI Calculator | `bmi-calculator.json` |
| Water Balance | `water-balance.json` |
| PaFi Calculator | `pafi.json` |
| DKA Monitor | `dka.json` |
| Medical Disclaimer | `medical-disclaimer.json` |
| Layout Disclaimer | `layout-disclaimer.json` |
| Error Boundary | `error-boundary.json` |

## Context Delivery Options

v0 does not natively read arbitrary URLs pasted in chat. There are four practical ways to feed our protocol and component docs into a v0 session:

| Approach | Effort | Dynamic? | How |
|----------|--------|----------|-----|
| **MCP server** | Medium | Yes — v0 auto-discovers tools | Host an MCP server that serves protocol/component docs. v0 supports [bring-your-own MCP servers](https://v0.app/docs/MCP) with auth (No Auth, Custom Headers, Bearer Token, OAuth) and has presets for services like Context7, Notion, Linear, Sentry. |
| **Custom instructions** | Low | No — static text | Paste protocol rules into v0's custom instructions feature (similar to `CLAUDE.md`). Cannot reference URLs dynamically. |
| **GitHub import** | Low | No — snapshot | Import protocol files via GitHub repo import or zip upload. Gives v0 file-system access to the docs but requires manual re-import on updates. |
| **Claude Code agent in terminal** | Low | Yes — same as current flow | v0 sandboxes include [pre-installed Claude Code](https://v0.app/docs/pre-installed-agents). It can `curl`/`fetch` our CDN URLs at runtime, matching our existing Claude Code provider flow. |

### MCP integration details

- v0 supports bring-your-own MCP servers plus Vercel Marketplace integrations
- Three permission modes: Disabled, Manual (asks before each tool call), Auto (executes with 5-second cancel window)
- Presets available: Context7, Glean, Granola, Hex, Linear, Notion, PostHog, Sanity, Sentry, Zapier

### Terminal / npx access

- v0 sandboxes have terminal access and pre-installed agents (Claude Code confirmed)
- The sandbox works "just like your local machine" — `npx` should work in principle
- Only the provided CLI wrappers (e.g., `claude`) routed through Vercel AI Gateway are officially supported; running arbitrary binaries is "at your own risk"

## Privacy

All patient data stays in the browser's localStorage. The deployed app serves only interface code — no patient data is ever uploaded, transmitted, or stored on any server.
