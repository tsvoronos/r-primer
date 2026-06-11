# docs/

Design and reference material for the primer (not part of the rendered site).

- **`unit-5-story-map.md`** — a map of the Unit 5 "AI Analyst" branching
  scenario: a Mermaid flowchart (renders as a tree on GitHub) plus an indented
  outline, showing every decision point and where each choice leads. It is
  **generated** from `assets/adventure-story.js` — edit the story there, then
  regenerate the map:

  ```sh
  node assets/gen-story-map.js
  ```

  Treat the `.js` as canonical and this `.md` as a derived view (re-running the
  generator overwrites it).
