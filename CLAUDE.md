# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Reading R Code" — a Quarto website teaching incoming HKS API-201 students to *read* (not write) tidyverse R code. It is a static site with live in-browser R execution, AI-graded free-response questions, an AI tutoring sidebar, and a scripted branching scenario. Published to GitHub Pages at https://teddysvoronos.com/r-primer/ (custom domain over the `tsvoronos.github.io` Pages site).

Content lives in `index.qmd` and `unit-1.qmd` … `unit-5.qmd`. `r-literacy-module-plan.md` is the original design brief. `docs/` holds derived design references, not site pages.

## The architecture that matters

**Two runtimes, and the line between them is the thing to internalize.**

- **Build time (Quarto + knitr):** `quarto render` turns `.qmd` → static HTML. It does **not** run any R analysis. Local rendering needs only `knitr` + `rmarkdown` (R itself, via apt: `r-base-core r-cran-knitr r-cran-rmarkdown`). `dplyr`/`ggplot2` are **not** needed to build — they run in the browser.
- **Browser time (quarto-live / webR):** fenced ```` ```{webr} ```` chunks are shipped to the page and executed in the student's browser via WebAssembly R (webR), pulling `dplyr`/`ggplot2` from a CDN. Per-page packages are declared in the front-matter `webr.packages:` list.

**The knitr engine shim is load-bearing.** Every unit page that uses `{webr}` chunks must include, right after the front matter:

```
{{< include ./_extensions/r-wasm/live/_knitr.qmd >}}
```

Without it, the `webr` engine is unregistered, chunks render as inert text, and **page datasets silently never load**. There is no project-level `format`/`execute` block in `_quarto.yml` on purpose — a stale `format: html` block there does not reach the `live-html` format the units use and previously broke theming; keep theming defaults uniform by leaving it out.

**Datasets load via hidden auto-run cells.** Page data (e.g. `states`, `districts`) is defined in a chunk marked `#| include: false` and `#| autorun: true` — hidden from the page, evaluated in the browser at load. Edit these to change a page's data; the visible chunks reference the variables they create.

**The single server-side piece is the Cloudflare Worker** in `ai-feedback/` (`src/index.js`). The static site can't hold an API key, so the Worker is the only place that calls the OpenAI API. Two routes:
- `POST /` — grades a free-response answer against a page-embedded rubric → `{verdict, feedback}` (strict JSON schema).
- `POST /chat` — the tutoring sidebar → `{reply}`.

Both use the OpenAI Responses API, model from the `OPENAI_MODEL` var (`gpt-5.4-mini`), tagged with `safety_identifier`. CORS is locked to the site origins via `ALLOWED_ORIGIN` (comma-separated) in `wrangler.toml`. **The Worker must never throw uncaught** — a crash returns Cloudflare's error page with no CORS headers, which the browser reports as an opaque "Load failed"; the top-level `try/catch` returns CORS-tagged JSON for every path, and errors carry an upstream `detail` string surfaced in the UI.

**Client components are authored in plain Markdown, enhanced by JS.** Scripts and styles are wired into every page once via `_metadata.yml` (`include-after-body` + `css`), which also sets `window.EXERCISE_CONFIG.aiFeedbackUrl` (the Worker URL — empty string disables all AI features and the site degrades to self-check). Conventions:
- `::: {.mcq}` — a Markdown task list becomes instant-feedback multiple choice; the `[x]` item is the answer key, text after ` — ` is per-option feedback, a nested `.mcq-explanation` reveals on correct. (`assets/exercises.js`)
- `::: {.free-response question-id="..."}` with nested `.model-answer` and `.grading-notes` — a textarea with AI feedback (or self-check). The rubric divs are hidden from students but shipped in the HTML and sent to the Worker. (`assets/exercises.js`)
- `::: {.read-first}` around a **plain** ```` ```r ```` block — static read-only code, no Run button. (style in `assets/exercises.css`)
- The tutoring sidebar (`assets/assistant.js`) is global; conversation persists in `localStorage`, and each request carries a snapshot of the page (visible text + chunk code + the hidden answer keys, labeled instructor-only) so it can give grounded, ladder-gated hints.
- `::: {#adventure}` on `unit-5.qmd` renders the choose-your-own-adventure from the story graph in `assets/adventure-story.js` via the engine in `assets/adventure.js`.

## Common commands

```sh
# Render the whole site (or one page)
quarto render
quarto render unit-2.qmd

# Regenerate the Unit 5 story map after editing the story graph
node assets/gen-story-map.js

# Worker: local dev and manual deploy (normally deployed via CI — see below)
cd ai-feedback && npm install && npm run dev      # wrangler dev
npm run deploy                                     # wrangler deploy
```

There is no test runner. Verification is done two ways and **should be** for any change to interactive behavior or pipeline outputs:
- **Pipeline/answer-key correctness:** run the R locally with `Rscript` (dplyr is installed) to confirm every number a page or the adventure claims is actually what the code produces.
- **Component behavior:** drive the rendered `_site/*.html` with the globally-installed Playwright (`/opt/node22/lib/node_modules/playwright`, Chromium under `/opt/pw-browsers`) — e.g. MCQ check/retry, free-response flow against a **mocked** `/chat` or `/feedback` route, sidebar persistence, adventure paths. The Worker handler can be unit-tested by importing `ai-feedback/src/index.js` and stubbing `globalThis.fetch`.

## Deployment

Two GitHub Actions workflows, both on push to `main`:
- `.github/workflows/publish.yml` — renders and publishes the site to the `gh-pages` branch.
- `.github/workflows/deploy-worker.yml` — deploys the Worker (runs on `ai-feedback/**` changes), pushing `OPENAI_API_KEY` / `OPENAI_SAFETY_IDENTIFIER` from repo secrets onto it. Also needs `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` secrets.

Switching the grading/chat model is a one-line `OPENAI_MODEL` change in `ai-feedback/wrangler.toml`; it redeploys automatically and needs no site rebuild.

## Sandbox network caveats (this dev environment)

The webR CDN (`webr.r-wasm.org`, `repo.r-wasm.org`) and `*.workers.dev` are **blocked** by the environment's network policy. Consequences: live `{webr}` chunks cannot actually execute here (so browser tests mock the Worker and don't rely on R running in-page — they're disregard-able `Cannot read properties of undefined (reading 'paths')` page errors), and the deployed Worker can't be reached from here (test the handler by import + stubbed fetch, or against a Playwright-mocked route). Quarto is not preinstalled; it was fetched to `/tmp/quarto-1.6.43/bin/quarto`.

## Conventions

- All numbers in prose, exercises, and the adventure must match what the R actually produces — validate against `Rscript` before committing.
- `assets/adventure-story.js` is the single source of truth for Unit 5; `docs/unit-5-story-map.md` is generated from it (don't hand-edit the map). The story is stateless (a node can't vary by earlier choice), so a choice that must change downstream numbers needs its own parallel thread of nodes.
- Bump `window.ADVENTURE.version` when changing the story graph — it namespaces the `localStorage` save and resets in-progress playthroughs.
