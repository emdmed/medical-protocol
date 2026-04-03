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
| Clinical Notes | `clinical-notes.json` |
| Acid-Base Analyzer | `acid-base.json` |
| BMI Calculator | `bmi-calculator.json` |
| Water Balance | `water-balance.json` |
| PaFi Calculator | `pafi.json` |
| DKA Monitor | `dka.json` |
| Pulse Oximetry | `telemonitoring.json` |
| Clinical Timeline | `timeline.json` |
| Medical Disclaimer | `medical-disclaimer.json` |
| Layout Disclaimer | `layout-disclaimer.json` |
| Error Boundary | `error-boundary.json` |

## Privacy

All patient data stays in the browser's localStorage. The deployed app serves only interface code — no patient data is ever uploaded, transmitted, or stored on any server.
