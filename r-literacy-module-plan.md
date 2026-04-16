# R Code Literacy Module — Project Plan

## Purpose
Build a self-contained online learning module for Harvard Kennedy School students taking API-201 (Data Analysis for Public Policy). Students complete this independently over the summer before the course begins (~10 hours total).

## Learning Goal
**Code literacy**: students can read a tidyverse R pipeline and produce an accurate plain-English description of what it did — what data was used, what transformations were applied, what the output shows, and what decisions the analyst made.

This is a reading skill, not a writing skill. Students are not expected to write R code from scratch.

## Pedagogical Assumptions
- AI may be used to *produce* code (that's realistic), but not to *explain* code during exercises (that's the muscle we're building)
- Tidyverse only — no base R
- Policy datasets and contexts throughout — students should be able to sanity-check outputs using domain knowledge
- Progressive scaffolding: heavy annotation and hints early, none by the end

## Delivery Format
A static **Quarto website** deployed to **Quarto Pub**.

- One page per unit
- Code chunks with syntax highlighting (students read, do not execute)
- Questions embedded after each code chunk
- Answers submitted via a simple Google Form linked from each page (one form per unit)
- No server, no authentication, no interactivity beyond links

## Structure

### Unit 1: The Building Blocks (~2 hours)
Teach the ~8 tidyverse verbs students need to recognize:
`filter`, `select`, `mutate`, `group_by`, `summarize`, `arrange`, `left_join`, and the pipe (`|>`)

Format: for each verb — one annotated example in a policy context, a plain-English explanation of what it does, and the output shown as a table. Ends with a short Google Form quiz asking students to match verbs to descriptions.

### Unit 2: Read a Pipeline (~3 hours)
Progressively longer code chunks (3 lines → 15 lines). Each chunk is followed by:
1. The output (table or plot)
2. A prompt: "In plain English, describe what this code did."
3. Early chunks have hints; later chunks have none

Pipelines build in complexity: filter + select → add mutate → add group_by + summarize → add ggplot. Final examples include a simple `lm()` regression and its output.

Responses submitted via Google Form.

### Unit 3: Spot the Problem (~3 hours)
Same format as Unit 2 but code contains a deliberate error — a wrong filter condition, a variable miscoded before a regression, a grouped summary that inflates counts, a plot with the wrong axis. Output looks plausible.

Students must:
1. Describe what the code did
2. Identify what's wrong
3. Explain why the output is misleading

Errors should be *plausible*, not obvious typos. Policy context should make the error detectable to someone thinking carefully about the substance.

### Unit 4: Full Narration (~2 hours)
One complete analysis script, 30–40 lines. A realistic policy analysis: load data, clean, transform, summarize, visualize, run a regression, present results.

Students write a 2–3 paragraph narration of what the analyst did, and flag at least one decision they would want to question.

Submitted as a short written response via Google Form.

## Content Notes
- Datasets should be policy-relevant and publicly available (suggestions: CDC BRFSS, IPUMS CPS, a city open data portal, or synthetic datasets modeled on these)
- All code should be generated with AI assistance (Claude or Copilot) and reviewed for correctness before use
- Unit 3 errors should be introduced manually after generation — do not rely on AI to produce subtly wrong code

## Technical Stack
- Quarto website (`type: website` in `_quarto.yml`)
- R code chunks with `eval: false` (display only, no execution)
- Deployed via `quarto publish quarto-pub`
- Google Forms for student responses (one form per unit, links embedded in pages)
- No R package dependencies beyond `knitr` for rendering

## Out of Scope
- Writing R code from scratch
- Base R syntax
- Package installation or environment setup
- Anything beyond: load, filter/select/mutate, summarize, join, visualize, regress

## First Steps for Claude Code
1. Scaffold the Quarto website structure (`_quarto.yml`, `index.qmd`, one `.qmd` per unit)
2. Build Unit 1 content with placeholder policy datasets
3. Confirm rendering and Quarto Pub deployment work before building remaining units
