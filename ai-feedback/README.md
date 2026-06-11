# AI feedback service

A minimal Cloudflare Worker that lets the static Quarto site grade free-text
answers with Claude. The site can't hold an API key (it's all client-side),
so this Worker is the one server-side piece: the page POSTs the student's
answer plus the question's model answer and grading notes, the Worker calls
the Claude API, and returns:

```json
{ "verdict": "strong" | "partial" | "needs_work", "feedback": "2-4 sentences…" }
```

## Deploy

```sh
cd ai-feedback
npm install
npx wrangler login                       # one-time Cloudflare auth
npx wrangler secret put ANTHROPIC_API_KEY  # paste an Anthropic API key
npm run deploy
```

`wrangler deploy` prints the Worker URL, e.g.
`https://r-primer-ai-feedback.<your-subdomain>.workers.dev`.

## Point the site at it

In `unit-1.qmd` (and any future unit with `.free-response` questions), set the
URL in the `include-in-header` config block:

```js
window.EXERCISE_CONFIG = {
  aiFeedbackUrl: "https://r-primer-ai-feedback.<your-subdomain>.workers.dev"
};
```

If `aiFeedbackUrl` is left empty, the "Get feedback" button doesn't render and
students self-check with the "Show model answer" button instead — so the site
works fine before this Worker exists.

## Before going live

- **Lock CORS down**: set `ALLOWED_ORIGIN` in `wrangler.toml` to the published
  site origin (e.g. `https://yourname.quarto.pub`) so other sites can't use
  your Worker.
- **Cost/abuse**: each click is one Claude API call (a few cents at most). For
  a class-sized audience this is negligible, but if you want a hard ceiling,
  add a [Cloudflare rate limiting rule](https://developers.cloudflare.com/waf/rate-limiting-rules/)
  on the Worker route or a per-IP counter via Workers KV.
- **Answer keys are in the page**: the model answer and grading notes are
  shipped (hidden) in the page HTML, which is fine for a low-stakes summer
  primer. If that ever matters, move the rubrics into this Worker keyed by
  `questionId` and stop embedding them in the `.qmd` files.
