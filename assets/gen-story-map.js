#!/usr/bin/env node
/*
 * Generates docs/unit-5-story-map.md from assets/adventure-story.js — a
 * human-readable map of the Unit 5 choose-your-own-adventure: a Mermaid
 * flowchart (renders as a tree on GitHub) plus an indented outline.
 *
 * Run after editing the story:   node assets/gen-story-map.js
 *
 * The story graph remains the single source of truth; this map is derived,
 * so it can't silently drift. (If you edit the .md by hand, re-running
 * overwrites it — treat the .js as canonical and the .md as a view.)
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
global.window = {};
// eslint-disable-next-line no-eval
eval(fs.readFileSync(path.join(__dirname, "adventure-story.js"), "utf8"));
const story = window.ADVENTURE;
const nodes = story.nodes;

// Short, human labels for each node (falls back to the id).
const TITLES = {
  start: "START — Priya needs one slide by 3 PM",
  q_avg_weight: "Warm-up: overall rate — weight by what?",
  avg_explain: "“Does weighting matter?”",
  avg_unweighted: "Ada: simple average = 9.0%",
  avg_code: "Ada explains: mean of state rates",
  avg_weighted: "Ada: population-weighted = 9.7% → on to comparison",
  q_weight: "FORK A — Comparison: weight by what?",
  weight_explain: "“Remind me why weighting matters”",
  q_source: "FORK B — Expansion status: which source? (weighted)",
  out_reversed: "Ada: reversed CSV → expansion looks WORSE (+9)",
  coding_code: "Ada shows merge code (MA=0, TX=1)",
  coding_reveal: "Ada admits coding is backwards",
  table_correct_verified: "Ada shows coded table to sanity-check",
  table_correct: "Ada: correct level gap (6.4 vs 15.4, weighted)",
  econ_anticipate: "“What would the economist say?”",
  trend_out: "Ada: trends (−4.1 vs −2.2, weighted)",
  trend_code: "Ada shows trend code (weighted)",
  slide_draft: "FORK D — Headline? (weighted)",
  eager_run: "Ada “just handles it”: draft slide, 324M + causal",
  join_code: "Ada shows code (324M population)",
  join_reveal: "Ada admits join double-counted population",
  join_fixed: "Population fixed → keep causal headline?",
  q_source_u: "FORK B — Expansion status: which source? (UNWEIGHTED)",
  out_reversed_u: "Ada: reversed CSV → expansion looks WORSE (+8)",
  coding_code_u: "Ada shows merge code (MA=0, TX=1)",
  coding_reveal_u: "Ada admits coding is backwards",
  table_correct_verified_u: "Ada shows coded table to sanity-check",
  table_correct_u: "Ada: correct level gap (6.6 vs 14.7, unweighted)",
  econ_anticipate_u: "“What would the economist say?”",
  trend_out_u: "Ada: trends (−3.6 vs −2.1, unweighted)",
  trend_code_u: "Ada shows trend code (unweighted)",
  slide_draft_u: "FORK D — Headline? (UNWEIGHTED)",
};

// Endings, classified for color/legend.
const ENDING_KIND = {
  ending_great: "win",
  ending_footnote: "win-ish",
  ending_avg_burn: "burn",
  ending_reversed_burn: "burn",
  ending_causal_burn: "burn",
  ending_eager_burn: "burn",
  ending_overclaim: "burn",
  ending_mush: "burn",
};

function shortLabel(node, id) {
  if (node.ending) return node.ending.title.replace(/^Ending:\s*/, "");
  return TITLES[id] || id;
}

// Trim a choice label for an edge caption.
function edgeLabel(choice) {
  let t = choice.label
    .replace(/[*`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length > 46) t = t.slice(0, 44) + "…";
  if (choice.flags && choice.flags.length) t = "✓ " + t;
  return t;
}

/* ----------------------------------------------------------- mermaid -- */

function mermaidId(id) {
  return id.replace(/[^a-zA-Z0-9_]/g, "_");
}

function mermaid() {
  const lines = ["```mermaid", "flowchart TD"];
  // node declarations
  for (const id in nodes) {
    const n = nodes[id];
    const label = shortLabel(n, id).replace(/"/g, "'");
    const mid = mermaidId(id);
    if (n.ending) {
      lines.push(`  ${mid}["🏁 ${label}"]`);
    } else if (/^(start|q_weight|q_source|q_source_u|slide_draft|slide_draft_u)$/.test(id)) {
      lines.push(`  ${mid}{{"${label}"}}`); // decision forks as hexagons
    } else {
      lines.push(`  ${mid}["${label}"]`);
    }
  }
  lines.push("");
  // edges
  for (const id in nodes) {
    const n = nodes[id];
    (n.choices || []).forEach((c) => {
      const cap = edgeLabel(c).replace(/"/g, "'");
      lines.push(`  ${mermaidId(id)} -->|"${cap}"| ${mermaidId(c.to)}`);
    });
  }
  lines.push("");
  // styling
  lines.push("  classDef win fill:#d1e7dd,stroke:#198754,color:#0f5132;");
  lines.push("  classDef winish fill:#fff3cd,stroke:#997404,color:#664d03;");
  lines.push("  classDef burn fill:#f8d7da,stroke:#dc3545,color:#842029;");
  const byKind = { win: [], "win-ish": [], burn: [] };
  for (const id in ENDING_KIND) byKind[ENDING_KIND[id]].push(mermaidId(id));
  if (byKind.win.length) lines.push(`  class ${byKind.win.join(",")} win;`);
  if (byKind["win-ish"].length) lines.push(`  class ${byKind["win-ish"].join(",")} winish;`);
  if (byKind.burn.length) lines.push(`  class ${byKind.burn.join(",")} burn;`);
  lines.push("```");
  return lines.join("\n");
}

/* ----------------------------------------------------------- outline -- */

function outline() {
  const out = [];
  const seen = new Set();
  function walk(id, depth, viaFlags) {
    const n = nodes[id];
    const indent = "  ".repeat(depth);
    const tag = viaFlags && viaFlags.length ? ` _(✓ ${viaFlags.join(", ")})_` : "";
    if (n.ending) {
      const kind = ENDING_KIND[id] || "";
      const mark = kind === "win" ? "🟢" : kind === "win-ish" ? "🟡" : "🔴";
      out.push(`${indent}- ${mark} **${shortLabel(n, id)}**${tag}`);
      return;
    }
    const label = shortLabel(n, id);
    if (seen.has(id)) {
      // Re-entrant node (e.g. trend_out reached from two places): link, don't recurse.
      out.push(`${indent}- ${label} ↪︎ _(see above)_${tag}`);
      return;
    }
    seen.add(id);
    out.push(`${indent}- ${label}${tag}`);
    (n.choices || []).forEach((c) => {
      out.push(`${indent}  - ↘ choose: “${edgeLabel(c).replace(/^✓ /, "")}”`);
      walk(c.to, depth + 2, c.flags);
    });
  }
  walk(story.start, 0, null);
  return out.join("\n");
}

/* -------------------------------------------------------------- emit -- */

const endingCount = Object.values(nodes).filter((n) => n.ending).length;
const md = `# Unit 5 — story map

> **Generated** from \`assets/adventure-story.js\` by \`assets/gen-story-map.js\`.
> The story file is the source of truth; regenerate after edits with
> \`node assets/gen-story-map.js\`. ${Object.keys(nodes).length} nodes, ${endingCount} endings.

This maps every decision point in "The AI Analyst" and where each choice leads.
A **✓** on a choice means it sets a *good-judgment flag* (the things the ending
screen credits you for).

## Flags (good-judgment moves)

${Object.entries(story.flagLabels).map(([k, v]) => `- **${k}** — ${v}`).join("\n")}

## The branch structure

The opening splits into **three strategies**, and the central weighting choice
(**Fork A**) splits everything downstream into two parallel threads — a
\`weighted\` thread and an \`unweighted\` thread that mirror each other but carry
different numbers and different endings:

- **Weighted thread** (Fork A → \`q_source\`): the only road to 🟢 *The slide that survived*.
- **Unweighted thread** (Fork A → \`q_source_u\`): structurally identical, but even a
  flawless run lands at 🟡 *The footnote* — the weighting decision made back at
  Fork A propagates all the way to the end.
- Several **burn endings** (🔴) are shared sinks reachable from both threads
  (reversed coding, causal overclaim, etc.).

## Flowchart

Hexagons \`{{ }}\` are decision forks; 🏁 boxes are endings (🟢 win, 🟡 win-with-caveat, 🔴 burn).

${mermaid()}

## Outline

The same graph as an indented tree. Nodes that can be reached by more than one
path (e.g. the trend step, shared by several routes) are shown once and marked
"see above" thereafter.

${outline()}
`;

const outPath = path.join(ROOT, "docs", "unit-5-story-map.md");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, md);
console.log("wrote", path.relative(ROOT, outPath), `(${Object.keys(nodes).length} nodes, ${endingCount} endings)`);
