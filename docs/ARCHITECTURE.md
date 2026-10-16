# المعمارية — CloneCraft Studio

```text
User URL
  ↓
Local Arabic UI (Express on 127.0.0.1)
  ↓
Public URL validation → DNS public-host preflight
  ↓
Playwright / fresh Chromium / GET only / 15 pages max
  ↓
DOM structure + visual snapshot + navigation map
  ↓
report.json + screenshots + BLUEPRINT.md
  ↓
Claude Code / Codex / Agent OS [separate, human-authorized]
  ↓
Independent app code + tests + parity review
```

## Design decisions

- A separate **reporting** stage prevents confusing observed interfaces with unavailable backend internals.
- CLI and the Arabic web dashboard call the same function `analyzeSite()`.
- This repository is independent of Agent OS and FilmCraft. REA is an optional external MCP provider.
- This release does not inspect internal application binaries or deobfuscate site bundles by default; REA handles those specialized cases separately where authorized.
- The site-reconstruction agent is intentionally not automatically connected to privileged repositories, secrets, databases or deployment.

## Production requirements before hosting

The current web interface is **local-only**, not a multi-tenant production service. Before remote hosting: authentication, user quotas, network-layer egress allowlist, DNS pinning or safe browsing proxy, hardened browser sandbox, job isolation, audit log, robots compliance, asset-rights confirmation, storage lifecycle, abuse protections and user approval gates.

## Future development

- Site inspector plugin: accessible elements, animations, breakpoints, page state machines.
- Behavior contracts: click paths, validation messages, route transitions and API descriptions where explicitly observable.
- Scaffold engine: Next.js templates with independent design assets.
- Visual parity: deterministic screenshots, threshold diff and responsive-matrix testing.
- Agent control protocol: typed commands, receipts, dry run, human approvals, influenced by FilmCraft's control patterns.
