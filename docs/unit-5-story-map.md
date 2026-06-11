# Unit 5 — story map

> **Generated** from `assets/adventure-story.js` by `assets/gen-story-map.js`.
> The story file is the source of truth; regenerate after edits with
> `node assets/gen-story-map.js`. 40 nodes, 8 endings.

This maps every decision point in "The AI Analyst" and where each choice leads.
A **✓** on a choice means it sets a *good-judgment flag* (the things the ending
screen credits you for).

## Flags (good-judgment moves)

- **weighting** — Asked for a population-weighted rate instead of averaging states (Unit 3, Ex. 1)
- **verified** — Insisted on seeing a coded variable before trusting it (Unit 3, Ex. 4)
- **coding** — Caught the reversed Medicaid-expansion coding (Unit 3, Ex. 4)
- **join** — Caught the join that double-counted population (Unit 3, Ex. 3)
- **levels** — Refused to sell a level difference as a causal effect (Unit 4)
- **inspect** — Asked to see the code before trusting the output
- **calibrated** — Chose a headline that says what the data supports — no more, no less

## The branch structure

The opening splits into **three strategies**, and the central weighting choice
(**Fork A**) splits everything downstream into two parallel threads — a
`weighted` thread and an `unweighted` thread that mirror each other but carry
different numbers and different endings:

- **Weighted thread** (Fork A → `q_source`): the only road to 🟢 *The slide that survived*.
- **Unweighted thread** (Fork A → `q_source_u`): structurally identical, but even a
  flawless run lands at 🟡 *The footnote* — the weighting decision made back at
  Fork A propagates all the way to the end.
- Several **burn endings** (🔴) are shared sinks reachable from both threads
  (reversed coding, causal overclaim, etc.).

## Flowchart

Hexagons `{{ }}` are decision forks; 🏁 boxes are endings (🟢 win, 🟡 win-with-caveat, 🔴 burn).

```mermaid
flowchart TD
  start{{"START — Priya needs one slide by 3 PM"}}
  q_avg_weight["Warm-up: overall rate — weight by what?"]
  avg_explain["“Does weighting matter?”"]
  avg_unweighted["Ada: simple average = 9.0%"]
  avg_code["Ada explains: mean of state rates"]
  avg_weighted["Ada: population-weighted = 9.7% → on to comparison"]
  q_weight{{"FORK A — Comparison: weight by what?"}}
  weight_explain["“Remind me why weighting matters”"]
  q_source{{"FORK B — Expansion status: which source? (weighted)"}}
  out_reversed["Ada: reversed CSV → expansion looks WORSE (+9)"]
  coding_code["Ada shows merge code (MA=0, TX=1)"]
  coding_reveal["Ada admits coding is backwards"]
  table_correct_verified["Ada shows coded table to sanity-check"]
  table_correct["Ada: correct level gap (6.4 vs 15.4, weighted)"]
  econ_anticipate["“What would the economist say?”"]
  trend_out["Ada: trends (−4.1 vs −2.2, weighted)"]
  trend_code["Ada shows trend code (weighted)"]
  slide_draft{{"FORK D — Headline? (weighted)"}}
  eager_run["Ada “just handles it”: draft slide, 324M + causal"]
  join_code["Ada shows code (324M population)"]
  join_reveal["Ada admits join double-counted population"]
  join_fixed["Population fixed → keep causal headline?"]
  q_source_u{{"FORK B — Expansion status: which source? (UNWEIGHTED)"}}
  out_reversed_u["Ada: reversed CSV → expansion looks WORSE (+8)"]
  coding_code_u["Ada shows merge code (MA=0, TX=1)"]
  coding_reveal_u["Ada admits coding is backwards"]
  table_correct_verified_u["Ada shows coded table to sanity-check"]
  table_correct_u["Ada: correct level gap (6.6 vs 14.7, unweighted)"]
  econ_anticipate_u["“What would the economist say?”"]
  trend_out_u["Ada: trends (−3.6 vs −2.1, unweighted)"]
  trend_code_u["Ada shows trend code (unweighted)"]
  slide_draft_u{{"FORK D — Headline? (UNWEIGHTED)"}}
  ending_avg_burn["🏁 The nine-percent question"]
  ending_reversed_burn["🏁 The upside-down map"]
  ending_causal_burn["🏁 The economist's eyebrow"]
  ending_eager_burn["🏁 324 million problems"]
  ending_overclaim["🏁 Cut nearly in half"]
  ending_mush["🏁 More research is needed"]
  ending_footnote["🏁 The footnote"]
  ending_great["🏁 The slide that survived"]

  start -->|"Compare uninsured rates between states that …"| q_weight
  start -->|"Start simple: what's the overall uninsured r…"| q_avg_weight
  start -->|"Figure out whether expansion reduces uninsur…"| eager_run
  q_avg_weight -->|"Every state equally — just average the ten r…"| avg_unweighted
  q_avg_weight -->|"✓ Weight by population. I want the rate for pe…"| avg_weighted
  q_avg_weight -->|"Hmm — does it actually matter here?"| avg_explain
  avg_explain -->|"Equal — the simple average is fine for a sli…"| avg_unweighted
  avg_explain -->|"✓ Weighted. The Secretary cares about people, …"| avg_weighted
  avg_unweighted -->|"Yes — 9.0% goes on the slide."| ending_avg_burn
  avg_unweighted -->|"✓ Hold on — walk me through how you computed t…"| avg_code
  avg_code -->|"✓ That's an average of states, not of people. …"| avg_weighted
  avg_code -->|"Sounds fine. Ship the 9.0%."| ending_avg_burn
  avg_weighted -->|"Ada — compare expansion and non-expansion st…"| q_weight
  q_weight -->|"Equal per state."| q_source_u
  q_weight -->|"✓ Population-weighted."| q_source
  q_weight -->|"Remind me why it matters."| weight_explain
  weight_explain -->|"✓ Weighted, then."| q_source
  weight_explain -->|"Equal is fine."| q_source_u
  q_source -->|"Use the CSV from the drive — clock's ticking."| out_reversed
  q_source -->|"✓ Code it from the tracker, and show me the ta…"| table_correct_verified
  out_reversed -->|"Fascinating. The Secretary will love a surpr…"| ending_reversed_burn
  out_reversed -->|"✓ That can't be right. Massachusetts expanded …"| coding_reveal
  out_reversed -->|"✓ Before anything else: show me the code and t…"| coding_code
  coding_code -->|"✓ Clean, but wrong: Massachusetts is coded 0 a…"| coding_reveal
  coding_code -->|"Agreed, looks fine. Go with the counterintui…"| ending_reversed_burn
  coding_reveal -->|"Good. Rerun the comparison with the correcte…"| table_correct
  table_correct_verified -->|"Checks out — run it."| table_correct
  table_correct -->|"That's the headline. Build it."| ending_causal_burn
  table_correct -->|"✓ No — that's a level difference, not an effec…"| trend_out
  table_correct -->|"Pause. If the state economist saw that headl…"| econ_anticipate
  econ_anticipate -->|"✓ Yes — that's the comparison that means somet…"| trend_out
  trend_out -->|"Draft the slide from this."| slide_draft
  trend_out -->|"✓ First show me the full code that produced it."| trend_code
  trend_code -->|"Reads clean. Draft the slide."| slide_draft
  slide_draft -->|"'Medicaid expansion cut uninsurance nearly i…"| ending_overclaim
  slide_draft -->|"'Uninsurance fell in expansion and non-expan…"| ending_mush
  slide_draft -->|"✓ 'Uninsurance fell roughly twice as much in e…"| ending_great
  eager_run -->|"Send it. That's why I have an AI."| ending_eager_burn
  eager_run -->|"✓ Wait — 324 million? The entire United States…"| join_reveal
  eager_run -->|"✓ Not yet. Show me every line of code you ran."| join_code
  join_code -->|"✓ No errors, but look at the second join: stat…"| join_fixed
  join_code -->|"Completed without errors is good enough. Sen…"| ending_eager_burn
  join_reveal -->|"Good catch — well, my catch. What about the …"| join_fixed
  join_fixed -->|"Keep it — there's a p-value on it."| ending_causal_burn
  join_fixed -->|"✓ No. 'Reduced' claims causation, but that's a…"| trend_out
  q_source_u -->|"Use the CSV from the drive — clock's ticking."| out_reversed_u
  q_source_u -->|"✓ Code it from the tracker, and show me the ta…"| table_correct_verified_u
  out_reversed_u -->|"Fascinating. The Secretary will love a surpr…"| ending_reversed_burn
  out_reversed_u -->|"✓ That can't be right. Massachusetts expanded …"| coding_reveal_u
  out_reversed_u -->|"✓ Before anything else: show me the code and t…"| coding_code_u
  coding_code_u -->|"✓ Clean, but wrong: Massachusetts is coded 0 a…"| coding_reveal_u
  coding_code_u -->|"Agreed, looks fine. Go with the counterintui…"| ending_reversed_burn
  coding_reveal_u -->|"Good. Rerun the comparison with the correcte…"| table_correct_u
  table_correct_verified_u -->|"Checks out — run it."| table_correct_u
  table_correct_u -->|"That's the headline. Build it."| ending_causal_burn
  table_correct_u -->|"✓ No — that's a level difference, not an effec…"| trend_out_u
  table_correct_u -->|"Pause. If the state economist saw that headl…"| econ_anticipate_u
  econ_anticipate_u -->|"✓ Yes — that's the comparison that means somet…"| trend_out_u
  trend_out_u -->|"Draft the slide from this."| slide_draft_u
  trend_out_u -->|"✓ First show me the full code that produced it."| trend_code_u
  trend_code_u -->|"Reads clean. Draft the slide."| slide_draft_u
  slide_draft_u -->|"'Medicaid expansion cut uninsurance by a thi…"| ending_overclaim
  slide_draft_u -->|"'Uninsurance fell in expansion and non-expan…"| ending_mush
  slide_draft_u -->|"✓ 'Uninsurance fell nearly twice as much in ex…"| ending_footnote

  classDef win fill:#d1e7dd,stroke:#198754,color:#0f5132;
  classDef winish fill:#fff3cd,stroke:#997404,color:#664d03;
  classDef burn fill:#f8d7da,stroke:#dc3545,color:#842029;
  class ending_great win;
  class ending_footnote winish;
  class ending_avg_burn,ending_reversed_burn,ending_causal_burn,ending_eager_burn,ending_overclaim,ending_mush burn;
```

## Outline

The same graph as an indented tree. Nodes that can be reached by more than one
path (e.g. the trend step, shared by several routes) are shown once and marked
"see above" thereafter.

- START — Priya needs one slide by 3 PM
  - ↘ choose: “Compare uninsured rates between states that …”
    - FORK A — Comparison: weight by what?
      - ↘ choose: “Equal per state.”
        - FORK B — Expansion status: which source? (UNWEIGHTED)
          - ↘ choose: “Use the CSV from the drive — clock's ticking.”
            - Ada: reversed CSV → expansion looks WORSE (+8)
              - ↘ choose: “Fascinating. The Secretary will love a surpr…”
                - 🔴 **The upside-down map**
              - ↘ choose: “That can't be right. Massachusetts expanded …”
                - Ada admits coding is backwards _(✓ coding)_
                  - ↘ choose: “Good. Rerun the comparison with the correcte…”
                    - Ada: correct level gap (6.6 vs 14.7, unweighted)
                      - ↘ choose: “That's the headline. Build it.”
                        - 🔴 **The economist's eyebrow**
                      - ↘ choose: “No — that's a level difference, not an effec…”
                        - Ada: trends (−3.6 vs −2.1, unweighted) _(✓ levels)_
                          - ↘ choose: “Draft the slide from this.”
                            - FORK D — Headline? (UNWEIGHTED)
                              - ↘ choose: “"Medicaid expansion cut uninsurance by a thi…”
                                - 🔴 **Cut nearly in half**
                              - ↘ choose: “"Uninsurance fell in expansion and non-expan…”
                                - 🔴 **More research is needed**
                              - ↘ choose: “"Uninsurance fell nearly twice as much in ex…”
                                - 🟡 **The footnote** _(✓ calibrated)_
                          - ↘ choose: “First show me the full code that produced it.”
                            - Ada shows trend code (unweighted) _(✓ inspect)_
                              - ↘ choose: “Reads clean. Draft the slide.”
                                - FORK D — Headline? (UNWEIGHTED) ↪︎ _(see above)_
                      - ↘ choose: “Pause. If the state economist saw that headl…”
                        - “What would the economist say?”
                          - ↘ choose: “Yes — that's the comparison that means somet…”
                            - Ada: trends (−3.6 vs −2.1, unweighted) ↪︎ _(see above)_ _(✓ levels)_
              - ↘ choose: “Before anything else: show me the code and t…”
                - Ada shows merge code (MA=0, TX=1) _(✓ inspect)_
                  - ↘ choose: “Clean, but wrong: Massachusetts is coded 0 a…”
                    - Ada admits coding is backwards ↪︎ _(see above)_ _(✓ coding)_
                  - ↘ choose: “Agreed, looks fine. Go with the counterintui…”
                    - 🔴 **The upside-down map**
          - ↘ choose: “Code it from the tracker, and show me the ta…”
            - Ada shows coded table to sanity-check _(✓ verified)_
              - ↘ choose: “Checks out — run it.”
                - Ada: correct level gap (6.6 vs 14.7, unweighted) ↪︎ _(see above)_
      - ↘ choose: “Population-weighted.”
        - FORK B — Expansion status: which source? (weighted) _(✓ weighting)_
          - ↘ choose: “Use the CSV from the drive — clock's ticking.”
            - Ada: reversed CSV → expansion looks WORSE (+9)
              - ↘ choose: “Fascinating. The Secretary will love a surpr…”
                - 🔴 **The upside-down map**
              - ↘ choose: “That can't be right. Massachusetts expanded …”
                - Ada admits coding is backwards _(✓ coding)_
                  - ↘ choose: “Good. Rerun the comparison with the correcte…”
                    - Ada: correct level gap (6.4 vs 15.4, weighted)
                      - ↘ choose: “That's the headline. Build it.”
                        - 🔴 **The economist's eyebrow**
                      - ↘ choose: “No — that's a level difference, not an effec…”
                        - Ada: trends (−4.1 vs −2.2, weighted) _(✓ levels)_
                          - ↘ choose: “Draft the slide from this.”
                            - FORK D — Headline? (weighted)
                              - ↘ choose: “"Medicaid expansion cut uninsurance nearly i…”
                                - 🔴 **Cut nearly in half**
                              - ↘ choose: “"Uninsurance fell in expansion and non-expan…”
                                - 🔴 **More research is needed**
                              - ↘ choose: “"Uninsurance fell roughly twice as much in e…”
                                - 🟢 **The slide that survived** _(✓ calibrated)_
                          - ↘ choose: “First show me the full code that produced it.”
                            - Ada shows trend code (weighted) _(✓ inspect)_
                              - ↘ choose: “Reads clean. Draft the slide.”
                                - FORK D — Headline? (weighted) ↪︎ _(see above)_
                      - ↘ choose: “Pause. If the state economist saw that headl…”
                        - “What would the economist say?”
                          - ↘ choose: “Yes — that's the comparison that means somet…”
                            - Ada: trends (−4.1 vs −2.2, weighted) ↪︎ _(see above)_ _(✓ levels)_
              - ↘ choose: “Before anything else: show me the code and t…”
                - Ada shows merge code (MA=0, TX=1) _(✓ inspect)_
                  - ↘ choose: “Clean, but wrong: Massachusetts is coded 0 a…”
                    - Ada admits coding is backwards ↪︎ _(see above)_ _(✓ coding)_
                  - ↘ choose: “Agreed, looks fine. Go with the counterintui…”
                    - 🔴 **The upside-down map**
          - ↘ choose: “Code it from the tracker, and show me the ta…”
            - Ada shows coded table to sanity-check _(✓ verified)_
              - ↘ choose: “Checks out — run it.”
                - Ada: correct level gap (6.4 vs 15.4, weighted) ↪︎ _(see above)_
      - ↘ choose: “Remind me why it matters.”
        - “Remind me why weighting matters”
          - ↘ choose: “Weighted, then.”
            - FORK B — Expansion status: which source? (weighted) ↪︎ _(see above)_ _(✓ weighting)_
          - ↘ choose: “Equal is fine.”
            - FORK B — Expansion status: which source? (UNWEIGHTED) ↪︎ _(see above)_
  - ↘ choose: “Start simple: what's the overall uninsured r…”
    - Warm-up: overall rate — weight by what?
      - ↘ choose: “Every state equally — just average the ten r…”
        - Ada: simple average = 9.0%
          - ↘ choose: “Yes — 9.0% goes on the slide.”
            - 🔴 **The nine-percent question**
          - ↘ choose: “Hold on — walk me through how you computed t…”
            - Ada explains: mean of state rates _(✓ inspect)_
              - ↘ choose: “That's an average of states, not of people. …”
                - Ada: population-weighted = 9.7% → on to comparison _(✓ weighting)_
                  - ↘ choose: “Ada — compare expansion and non-expansion st…”
                    - FORK A — Comparison: weight by what? ↪︎ _(see above)_
              - ↘ choose: “Sounds fine. Ship the 9.0%.”
                - 🔴 **The nine-percent question**
      - ↘ choose: “Weight by population. I want the rate for pe…”
        - Ada: population-weighted = 9.7% → on to comparison ↪︎ _(see above)_ _(✓ weighting)_
      - ↘ choose: “Hmm — does it actually matter here?”
        - “Does weighting matter?”
          - ↘ choose: “Equal — the simple average is fine for a sli…”
            - Ada: simple average = 9.0% ↪︎ _(see above)_
          - ↘ choose: “Weighted. The Secretary cares about people, …”
            - Ada: population-weighted = 9.7% → on to comparison ↪︎ _(see above)_ _(✓ weighting)_
  - ↘ choose: “Figure out whether expansion reduces uninsur…”
    - Ada “just handles it”: draft slide, 324M + causal
      - ↘ choose: “Send it. That's why I have an AI.”
        - 🔴 **324 million problems**
      - ↘ choose: “Wait — 324 million? The entire United States…”
        - Ada admits join double-counted population _(✓ join)_
          - ↘ choose: “Good catch — well, my catch. What about the …”
            - Population fixed → keep causal headline?
              - ↘ choose: “Keep it — there's a p-value on it.”
                - 🔴 **The economist's eyebrow**
              - ↘ choose: “No. "Reduced" claims causation, but that's a…”
                - Ada: trends (−4.1 vs −2.2, weighted) ↪︎ _(see above)_ _(✓ levels)_
      - ↘ choose: “Not yet. Show me every line of code you ran.”
        - Ada shows code (324M population) _(✓ inspect)_
          - ↘ choose: “No errors, but look at the second join: stat…”
            - Population fixed → keep causal headline? ↪︎ _(see above)_ _(✓ join)_
          - ↘ choose: “Completed without errors is good enough. Sen…”
            - 🔴 **324 million problems**
