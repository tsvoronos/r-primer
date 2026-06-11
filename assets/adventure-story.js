/*
 * Story graph for the "AI Analyst" choose-your-own-adventure (unit-5.qmd).
 * Rendered by assets/adventure.js. All numbers are consistent with the
 * ten-state dataset used throughout the primer:
 *   - unweighted mean rate 9.0%, population-weighted 9.7%
 *   - expansion group 6.4% vs non-expansion 15.4% (weighted; gap ~9 pts)
 *   - programs join inflates summed population 169,363,608 -> 323,788,140
 *   - 2014-2022 trend: expansion 12.0% -> 7.9%, non-expansion 20.4% -> 18.2%
 */
window.ADVENTURE = {
  version: "v1",
  aiName: "Ada",
  start: "start",

  flagLabels: {
    weighting: "Asked for a population-weighted rate instead of averaging states (Unit 3, Ex. 1)",
    verified: "Insisted on seeing a coded variable before trusting it (Unit 3, Ex. 4)",
    coding: "Caught the reversed Medicaid-expansion coding (Unit 3, Ex. 4)",
    join: "Caught the join that double-counted population (Unit 3, Ex. 3)",
    levels: "Refused to sell a level difference as a causal effect (Unit 4)",
    inspect: "Asked to see the code before trusting the output",
    calibrated: "Chose a headline that says what the data supports — no more, no less",
  },

  nodes: {
    /* ------------------------------------------------------------ opening -- */

    start: {
      note: "*Tuesday, 1:04 PM. Your manager Priya messages: \"Quick turn — the Secretary wants ONE slide on Medicaid expansion and uninsurance in our ten benchmark states. Briefing at 3. Can you own it?\" You open Ada, the office's AI analysis assistant. Ada has access to the benchmark dataset — the same ten-state table you know from this primer.*",
      say: "Hey! I see the benchmark states data is loaded — 10 states, uninsured rates, incomes, populations. What do you need?",
      choices: [
        { label: "Compare uninsured rates between states that expanded Medicaid and states that didn't.", to: "q_weight" },
        { label: "Start simple: what's the overall uninsured rate across our ten states?", to: "q_avg_weight" },
        { label: "Figure out whether expansion reduces uninsurance and make me a slide. Briefing's at 3 — just handle it.", to: "eager_run" },
      ],
    },

    /* ------------------------------------------- the average (a warm-up trap) -- */

    q_avg_weight: {
      say: "Sure — one decision first. Should every **state** count equally, or should bigger states count more? Nevada has 3 million people; California has 39 million.",
      choices: [
        { label: "Every state equally — just average the ten rates.", to: "avg_unweighted" },
        { label: "Weight by population. I want the rate for *people* in these states, not for the average state.", to: "avg_weighted", flags: ["weighting"] },
        { label: "Hmm — does it actually matter here?", to: "avg_explain" },
      ],
    },

    avg_explain: {
      say: "It can matter a lot. Averaging the ten rates treats Nevada and California as equal observations. Weighting by population answers a different question: *of all the people living in these states, what share is uninsured?* They disagree whenever big states differ from small ones — and here the three biggest states (California, Texas, Florida) aren't typical. Which do you want?",
      choices: [
        { label: "Equal — the simple average is fine for a slide.", to: "avg_unweighted" },
        { label: "Weighted. The Secretary cares about people, not abstract states.", to: "avg_weighted", flags: ["weighting"] },
      ],
    },

    avg_unweighted: {
      say: "Done:",
      code: "states |>\n  summarize(overall_uninsured = mean(uninsured_rate))",
      output: "# A tibble: 1 × 1\n  overall_uninsured\n              <dbl>\n1              0.09",
      after: "**9.0% uninsured across our ten states.** Slide-ready. Want me to drop it in?",
      choices: [
        { label: "Yes — 9.0% goes on the slide.", to: "ending_avg_burn" },
        { label: "Hold on — walk me through how you computed that.", to: "avg_code", flags: ["inspect"] },
      ],
    },

    avg_code: {
      say: "Of course. I took the ten state-level uninsured rates and computed their simple mean — each state contributes equally, so Nevada (3.2M people) moves the number exactly as much as California (39M).",
      choices: [
        { label: "That's an average of *states*, not of *people*. Redo it population-weighted.", to: "avg_weighted", flags: ["weighting"] },
        { label: "Sounds fine. Ship the 9.0%.", to: "ending_avg_burn" },
      ],
    },

    avg_weighted: {
      say: "Good call — here's the population-weighted version:",
      code: "states |>\n  mutate(uninsured_n = uninsured_rate * population) |>\n  summarize(rate = sum(uninsured_n) / sum(population))",
      output: "# A tibble: 1 × 1\n   rate\n  <dbl>\n1 0.0973",
      after: "**9.7% of people in our ten states are uninsured** — noticeably higher than the simple state average, because the big states (Texas, Florida, California) run above average.\n\n*Priya pings: \"Nice. But the Secretary's real question is the expansion comparison — that's the slide.\"*",
      choices: [
        { label: "Ada — compare expansion and non-expansion states.", to: "q_weight" },
      ],
    },

    /* ------------------------------------------------ the comparison setup -- */

    q_weight: {
      say: "On it. Same fork as always with state data: equal weight per state, or population-weighted?",
      choices: [
        { label: "Equal per state.", to: "note_unweighted" },
        { label: "Population-weighted.", to: "q_source", flags: ["weighting"] },
        { label: "Remind me why it matters.", to: "weight_explain" },
      ],
    },

    weight_explain: {
      say: "Equal weighting answers \"what's true of the average *state*\"; population weighting answers \"what's true of the average *person*.\" For a briefing about people's coverage, weighted is usually the honest one — especially since our biggest states aren't typical.",
      choices: [
        { label: "Weighted, then.", to: "q_source", flags: ["weighting"] },
        { label: "Equal is fine.", to: "note_unweighted" },
      ],
    },

    note_unweighted: {
      say: "I can do that — though heads-up: with Texas, Florida, and California all on one side of this comparison, equal weighting will understate what most *people* in these states experience. I'll compute both and lead with weighted so the slide can't be picked apart. Fair?",
      choices: [
        { label: "Fair. Lead with weighted.", to: "q_source" },
      ],
    },

    q_source: {
      say: "Next: where should expansion status come from? I can see two options:\n\n1. `expansion_status.csv` — already sitting in the shared drive, fastest.\n2. Code it fresh from the official KFF tracker, and show you the state-by-state table before I use it.",
      choices: [
        { label: "Use the CSV from the drive — clock's ticking.", to: "out_reversed" },
        { label: "Code it from the tracker, and show me the table before anything touches it.", to: "table_correct_verified", flags: ["verified"] },
      ],
    },

    /* ------------------------------------------- the reversed-coding branch -- */

    out_reversed: {
      say: "Done — merged the CSV and compared the groups:",
      output: "  expansion_group   weighted_uninsured\n  <chr>                          <dbl>\n1 Expanded                       0.154\n2 Did not expand                 0.064",
      after: "Interesting! **Expansion states have uninsured rates about 9 points HIGHER than non-expansion states.** Counterintuitive — but counterintuitive findings get attention. Want it on the slide?",
      choices: [
        { label: "Fascinating. The Secretary will love a surprise — use it.", to: "ending_reversed_burn" },
        { label: "That can't be right. Massachusetts expanded years ago and has 3% uninsured. Show me the coding, state by state.", to: "coding_reveal", flags: ["coding"] },
        { label: "Before anything else: show me the code and the merged table.", to: "coding_code", flags: ["inspect"] },
      ],
    },

    coding_code: {
      say: "Here's the merge and the first rows of the result:",
      code: "analysis <- states |>\n  left_join(read_csv(\"expansion_status.csv\"), by = \"state\")",
      output: "  state         uninsured_rate expanded\n  <chr>                  <dbl>    <dbl>\n1 Massachusetts           0.03        0\n2 New York                0.05        0\n3 Florida                 0.13        1\n4 Texas                   0.18        1",
      after: "Looks clean to me — no missing values, every state matched.",
      choices: [
        { label: "Clean, but wrong: Massachusetts is coded 0 and Texas 1. The variable is backwards.", to: "coding_reveal", flags: ["coding"] },
        { label: "Agreed, looks fine. Go with the counterintuitive finding.", to: "ending_reversed_burn" },
      ],
    },

    coding_reveal: {
      say: "...You're right, and I should have caught it. I pulled up the CSV's documentation: the column is actually named `did_not_expand` — someone renamed it `expanded` when they saved the file. Massachusetts, New York, California: all coded 0. Texas, Florida, Georgia: coded 1. The variable is exactly backwards, so my comparison swapped the groups.\n\nRecoding from the official tracker now.",
      choices: [
        { label: "Good. Rerun the comparison with the corrected coding.", to: "table_correct" },
      ],
    },

    table_correct_verified: {
      say: "Here's the freshly coded table — please sanity-check it:",
      output: "  state         expanded     state         expanded\n  Massachusetts yes          Texas         no\n  New York      yes          Illinois      yes\n  Pennsylvania  yes          Ohio          yes\n  Florida       no           California    yes\n  Georgia       no           Nevada        yes",
      after: "Matches the official tracker: seven of our ten expanded; Florida, Georgia, and Texas did not. Proceeding to the comparison.",
      choices: [
        { label: "Checks out — run it.", to: "table_correct" },
      ],
    },

    table_correct: {
      say: "Comparison with verified coding:",
      code: "analysis |>\n  group_by(expanded) |>\n  summarize(\n    weighted_uninsured = weighted.mean(uninsured_rate, population),\n    states = n()\n  )",
      output: "  expanded weighted_uninsured states\n  <chr>                 <dbl>  <int>\n1 no                    0.154      3\n2 yes                   0.064      7",
      after: "**Expansion states: 6.4% uninsured. Non-expansion: 15.4%. A nine-point gap.**\n\nProposed headline: *\"Medicaid expansion lowers uninsurance by ~9 percentage points.\"* Shall I build the slide?",
      choices: [
        { label: "That's the headline. Build it.", to: "ending_causal_burn" },
        { label: "No — that's a *level difference*, not an effect. Texas and Florida were different from Massachusetts long before expansion existed. Can we look at *changes over time* instead?", to: "trend_out", flags: ["levels"] },
        { label: "Pause. If the state economist saw that headline, what would she say?", to: "econ_anticipate" },
      ],
    },

    econ_anticipate: {
      say: "Honestly? She'd say: \"Expansion states were lower-uninsurance states *before* they expanded — richer, different labor markets, different politics. Your nine points is mostly history, not policy.\" And she'd be right to ask whether the gap *changed* after expansion, which my comparison can't see.\n\nI can pull the 2014–2022 panel and compare *changes* instead of levels. Want that?",
      choices: [
        { label: "Yes — that's the comparison that means something. Do it.", to: "trend_out", flags: ["levels"] },
      ],
    },

    /* ------------------------------------------------------ the trend path -- */

    trend_out: {
      say: "Pulled the panel. Population-weighted uninsured rate by group:",
      output: "  group              2014   2022   change\n  Expanded           12.0%   7.9%   -4.1 pts\n  Did not expand     20.4%  18.2%   -2.2 pts",
      after: "Both groups improved — the ACA changed things everywhere — but **uninsurance fell about twice as much in expansion states**. That's a far more defensible comparison than the level gap.",
      choices: [
        { label: "Draft the slide from this.", to: "slide_draft" },
        { label: "First show me the full code that produced it.", to: "trend_code", flags: ["inspect"] },
      ],
    },

    trend_code: {
      say: "Full pipeline:",
      code: "panel |>\n  filter(year %in% c(2014, 2022)) |>\n  mutate(group = if_else(expanded, \"Expanded\", \"Did not expand\")) |>\n  group_by(group, year) |>\n  summarize(\n    rate = weighted.mean(uninsured_rate, population),\n    .groups = \"drop\"\n  )",
      after: "Weighted within group and year; expansion coding is the verified version. The change column is just 2022 minus 2014.",
      choices: [
        { label: "Reads clean. Draft the slide.", to: "slide_draft" },
      ],
    },

    slide_draft: {
      say: "Slide drafted — chart of the two trend lines, plus the change figures. Last call: the headline. Pick one:",
      choices: [
        { label: "\"Medicaid expansion cut uninsurance nearly in half in our states.\"", to: "ending_overclaim" },
        { label: "\"Uninsurance fell in expansion and non-expansion states alike; more research is needed.\"", to: "ending_mush" },
        { label: "\"Uninsurance fell roughly twice as much in expansion states (−4.1 vs −2.2 pts, 2014–2022); today's gap is ~9 points. Descriptive comparison — not a causal estimate.\"", to: "ending_great", flags: ["calibrated"] },
      ],
    },

    /* --------------------------------------------------- the eager AI path -- */

    eager_run: {
      say: "Handled! I merged in expansion status and our outreach-programs registry for context, ran the analysis, and drafted your slide:\n\n**DRAFT SLIDE — Medicaid Expansion & Coverage**\n• Expansion **reduced uninsurance by 8.1 percentage points** (p < 0.01)\n• Analysis covers our 10 benchmark states — home to **324 million residents**\n• [chart placeholder]\n\nReady to send to Priya?",
      choices: [
        { label: "Send it. That's why I have an AI.", to: "ending_eager_burn" },
        { label: "Wait — 324 million? The entire United States is ~340 million. Our ten states are not the whole country. Where did that number come from?", to: "join_reveal", flags: ["join"] },
        { label: "Not yet. Show me every line of code you ran.", to: "join_code", flags: ["inspect"] },
      ],
    },

    join_code: {
      say: "Full pipeline:",
      code: "analysis <- states |>\n  left_join(expansion_status, by = \"state\") |>\n  left_join(programs, by = \"state\")   # outreach registry, for context\n\nanalysis |>\n  summarize(total_population = sum(population))",
      output: "# A tibble: 1 × 1\n  total_population\n             <dbl>\n1        323788140",
      after: "Then a regression of uninsured rate on expansion status for the headline. The merges all completed without errors.",
      choices: [
        { label: "No errors, but look at the second join: states with several outreach programs got duplicated rows, so `sum(population)` counts them multiple times.", to: "join_fixed", flags: ["join"] },
        { label: "Completed without errors is good enough. Send the slide.", to: "ending_eager_burn" },
      ],
    },

    join_reveal: {
      say: "Tracing it... found it. To add \"context\" I joined the outreach-programs registry — and some states run several programs. New York has three, so its 19.7 million people entered the sum **three times**. The join silently grew 10 rows into 16, and `sum(population)` never noticed. Real total: **169 million**, not 324.\n\nI've dropped the registry from the population math.",
      choices: [
        { label: "Good catch — well, *my* catch. What about the other bullet?", to: "join_fixed" },
      ],
    },

    join_fixed: {
      say: "Population corrected to **169 million**. That leaves the headline bullet: *\"Expansion reduced uninsurance by 8.1 percentage points (p < 0.01).\"* The regression behind it compares expansion and non-expansion states in 2022 — the coefficient is real. Keep it?",
      choices: [
        { label: "Keep it — there's a p-value on it.", to: "ending_causal_burn" },
        { label: "No. \"Reduced\" claims causation, but that's a snapshot comparison of states that differed long before expansion. Show me changes over time instead.", to: "trend_out", flags: ["levels"] },
      ],
    },

    /* -------------------------------------------------------------- endings -- */

    ending_avg_burn: {
      ending: {
        title: "Ending: The nine-percent question",
        text: "*2:58 PM. The slide goes up: \"Uninsured rate across benchmark states: 9.0%.\" The state economist squints.* \"Is that weighted? Because if you average states instead of people, Nevada counts the same as California — the people-weighted figure should be higher.\" *She does it in her head:* \"...about 9.7, I'd guess. Who made this?\"\n\n**What happened:** the simple mean of state rates treats every state as one observation. The population-weighted rate — total uninsured people over total population — is 9.7%, meaningfully different because the biggest states run above average. You saw this exact trap in **Unit 3, Exercise 1**. Ada even offered you the choice — the machine did the arithmetic right, and the human picked the wrong question.",
      },
    },

    ending_reversed_burn: {
      ending: {
        title: "Ending: The upside-down map",
        text: "*The deputy secretary stares at the slide.* \"This says expansion states have MORE uninsurance. It also implies Texas expanded Medicaid. Texas... did not expand Medicaid. Massachusetts did, a decade ago. Did anyone look at the data?\"\n\n**What happened:** the shared-drive CSV's column was really `did_not_expand`, renamed somewhere along the way — so every state's status was flipped, and the comparison came out exactly backwards. The giveaway was substantive, not technical: a result that said Massachusetts (3% uninsured) didn't expand should have set off alarms. **Unit 3, Exercise 4** was this exact scenario. The fix costs one question: *\"show me the coding, state by state.\"*",
      },
    },

    ending_causal_burn: {
      ending: {
        title: "Ending: The economist's eyebrow",
        text: "*The slide reads \"expansion lowers uninsurance by ~9 points.\" The state economist raises an eyebrow.* \"Expansion states were lower-uninsurance states before the ACA existed — richer, different labor markets. You're comparing Massachusetts to Texas and calling the difference a policy effect. What happened to the *trends*?\" *Priya glances at you. You do not have the trends.*\n\n**What happened:** a level difference between groups that differed long before the policy isn't an effect — most of that nine-point gap is history. The defensible version compares *changes*: expansion states fell −4.1 points vs −2.2 for non-expansion (2014–2022). This is the central lesson of **Unit 4** — and a p-value doesn't rescue it; significance says the gap is real, not what caused it.",
      },
    },

    ending_eager_burn: {
      ending: {
        title: "Ending: 324 million problems",
        text: "*Priya reads the draft before forwarding it — thankfully.* \"Two things. One: our ten states do not contain 324 million people; that's the entire country. Two: 'reduced by 8.1 points, p<0.01' — is that causal? Walk me through the code.\" *You can't. You never looked at it.*\n\n**What happened:** two separate failures hid in one confident slide. The 324M came from a join to the outreach-programs registry that silently duplicated multi-program states before a `sum()` — **Unit 3, Exercise 3**. And \"reduced\" sold a snapshot comparison as causation — **Unit 4**. The deeper lesson: \"just handle it\" let the AI make every judgment call silently. Delegation is fine; *unexamined* delegation is how plausible-looking nonsense reaches a Secretary.",
      },
    },

    ending_overclaim: {
      ending: {
        title: "Ending: Cut nearly in half",
        text: "*The briefing goes great — until the follow-up memo asks the agency to project that \"halving\" forward for a budget request, and the economist is asked to certify the estimate. She calls you.* \"Twice as fast a decline is real and worth saying. 'Expansion cut uninsurance in half' attributes the entire drop — in a decade when EVERY state improved — to one policy, from ten states, with no design. I can't certify this.\"\n\n**What happened:** you did the hard parts — caught the data issues, moved from levels to changes — and then the headline spent credibility the analysis hadn't earned. Calibration is the last mile: the difference between *\"fell twice as much in expansion states\"* (defensible) and *\"expansion cut it in half\"* (a causal claim wearing a descriptive statistic's clothes).",
      },
    },

    ending_mush: {
      ending: {
        title: "Ending: More research is needed",
        text: "*Priya reads the headline twice.* \"'Fell everywhere; more research is needed'? The Secretary is deciding whether to defend expansion funding **this week**. This slide says nothing. What does the data actually show?\" *You know the answer — it just isn't on the slide.*\n\n**What happened:** over-hedging is also a failure mode. The data genuinely shows uninsurance falling about twice as much in expansion states — a real, defensible, decision-relevant pattern. Refusing to state it isn't rigor; it's abdication. The skill this whole primer builds is saying **exactly what the analysis supports**: not more (the overclaim), not less (this).",
      },
    },

    ending_great: {
      ending: {
        title: "Ending: The slide that survived",
        text: "*2:55 PM. The slide goes up. The economist reads the footnote — \"descriptive, not causal\" — and nods slightly, which colleagues will tell you is the highest honor she confers. The Secretary asks one question:* \"Twice as much — is that holding up in other states too?\" *Priya:* \"We can have that by Friday.\" *Nobody asks who made the slide, which is how you know it worked.*\n\n**What happened:** you treated the AI the way this primer taught you to treat any analyst — including yourself. You made the weighting decision consciously, verified a coded variable before trusting it, read code before shipping its output, refused to let a level difference impersonate a causal effect, and wrote a headline the data can actually carry. That's the whole job. The tools will keep getting faster; the judgment stays yours.",
      },
    },
  },
};
