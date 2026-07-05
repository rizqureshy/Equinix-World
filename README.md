# DealProof

A full sales-execution app for **Equinix Interconnection & Fabric** teams — the
Challenger selling motion running on a **MEDDPICC** evidence backbone, with
dedicated workspaces for **reps** and **managers**, rendered over a live
Three.js/WebGL particle-waveform.

No backend, no build step, no login. Everything persists to `localStorage`.

## Run it

Open `index.html` in any modern browser — that's it. Or grab the portable
single-file build at **`dist/DealProof.html`** (all CSS, JS and
Three.js inlined; safe to email or drop in Slack).

To rebuild the single file after editing source:

```bash
python3 tools/build_single_file.py
```

## What's inside

### Rep workspace
| Section | What it does |
|---|---|
| **01 Playbook** | The operating model: commercial reframe, Teach / Tailor / Take Control, stage map showing where each MEDDPICC letter gets earned, team operating rules. |
| **02 Pipeline** | Multi-deal board: health rings, letter strips, forecast-gate badges, momentum, staleness, sort, create/duplicate/delete. |
| **03 Deal Room** | Per-deal scorecard (0–3 evidence anchors per letter), evidence notes, MEDDPICC radar, health-momentum sparkline, next-best-action, auto gap plan, one-click markdown deal brief. |
| **04 Discovery Bank** | 24 teaching questions with "listen for" coaching, filter by letter, per-deal asked-tracking. |
| **05 Objection Tracks** | 8 objections, each with the vendor trap and the Challenger reframe. |
| **06 Email Templates** | 5 insight-led templates (cold reframe, EB access, mobilizer, renewal leverage, re-engage) with highlighted placeholders. |

### Manager workspace
| Section | What it does |
|---|---|
| **01 Team Command** | Pipeline vs. evidence-weighted pipeline, commit-ready / at-risk counts, deals × letters MEDDPICC heatmap, forecast-gate and health distributions, needs-attention list. |
| **02 Deal Inspect** | Run the five-question review against any deal's live scorecard; where-it-dies gap panel; timestamped coaching log. |
| **03 Coaching Guide** | The 15-minute deal review, forecast gates (Pipeline / Best case / Commit), manager operating rules. |

### App-wide
- **WebGL waveform** — custom GLSL (simplex fbm + weaving ribbon envelopes) on
  a ~70k-point grid, additive-blended; per-section color themes crossfade,
  clicks ripple the field, mouse parallax; adaptive point-density if the GPU is
  slow; honors reduced-motion; graceful fallback without WebGL.
- Command palette (**⌘K / Ctrl+K**), keyboard shortcuts (**1–6**, **R**, **N**, **?**),
  tooltips everywhere, guided first-run tour, toasts.
- Settings: commit threshold, listen-for hints, motion toggle, JSON
  export/import, demo-data reset. Data from the original v1 single-deal
  scorecard is migrated automatically.

## Repo layout

```
index.html              app shell
css/app.css             design system
js/data.js              all content (letters, questions, objections, emails, seeds)
js/store.js             state, persistence, deal math (health, gates, momentum)
js/waves.js             Three.js wave engine (GLSL)
js/charts.js            canvas charts (ring, radar, sparkline, distributions)
js/ui.js                tooltips, toasts, modals, palette, tour
js/app.js               router, views, shell
js/vendor/three.min.js  Three.js r160 (vendored — works offline)
tools/build_single_file.py
dist/DealProof.html
```
