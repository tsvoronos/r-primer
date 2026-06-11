# AI feedback service

A minimal Cloudflare Worker that lets the static Quarto site grade free-text
answers with the OpenAI API. The site can't hold an API key (it's all
client-side), so this Worker is the one server-side piece: the page POSTs the
student's answer plus the question's model answer and grading notes, the
Worker calls the OpenAI Responses API (default model `gpt-5.5`, structured
output, low reasoning effort), and returns:

```json
{ "verdict": "strong" | "partial" | "needs_work", "feedback": "2-4 sentences…" }
```

Every request is tagged with your `safety_identifier` (OpenAI's stable
abuse-detection identifier — max 64 characters; OpenAI recommends a hashed
value rather than anything personally identifying).

## Deploy (no local tooling needed)

Deployment runs through GitHub Actions (`.github/workflows/deploy-worker.yml`)
so the API key never appears in the repo or anywhere else in plain sight.

**One-time setup:**

1. Create a free [Cloudflare account](https://dash.cloudflare.com/sign-up) if
   you don't have one.
2. In the Cloudflare dashboard create an API token using the **"Edit Cloudflare
   Workers"** template, and copy your **Account ID** (shown on the dashboard's
   right sidebar / Workers overview page).
3. In the GitHub repo, go to **Settings → Secrets and variables → Actions** and
   add four repository secrets:
   - `CLOUDFLARE_API_TOKEN` — the token from step 2
   - `CLOUDFLARE_ACCOUNT_ID` — the account ID from step 2
   - `OPENAI_API_KEY` — your OpenAI API key
   - `OPENAI_SAFETY_IDENTIFIER` — your safety identifier string
4. Run the **"Deploy AI feedback worker"** workflow from the repo's Actions tab
   (it also runs automatically whenever `ai-feedback/**` changes on main).

The workflow's run summary prints the deployed Worker URL, e.g.
`https://r-primer-ai-feedback.<your-subdomain>.workers.dev`.

## Point the site at it

Set the URL in `_metadata.yml` at the repo root:

```js
window.EXERCISE_CONFIG = {
  aiFeedbackUrl: "https://r-primer-ai-feedback.<your-subdomain>.workers.dev"
};
```

Push to main and every `.free-response` question on the site gains a
"Get feedback" button. If `aiFeedbackUrl` is left empty, students self-check
with "Show model answer" instead — the site works fine either way.

## Local development (optional)

```sh
cd ai-feedback
npm install
npx wrangler login
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put OPENAI_SAFETY_IDENTIFIER
npm run dev      # local test server
npm run deploy   # manual deploy
```

## Operational notes

- **CORS is locked** to `https://tsvoronos.github.io` in `wrangler.toml` —
  change `ALLOWED_ORIGIN` if the site moves.
- **Model** is set via the `OPENAI_MODEL` var in `wrangler.toml` (default
  `gpt-5.5`); swap it without touching code.
- **Cost/abuse**: each click is one API call (well under a cent at these
  sizes). For a hard ceiling, set a monthly budget on the OpenAI account
  and/or add a [Cloudflare rate limiting rule](https://developers.cloudflare.com/waf/rate-limiting-rules/)
  on the Worker (e.g. 10 requests/minute per IP).
- **Answer keys are in the page**: the model answer and grading notes ship
  (hidden) in the page HTML, which is fine for a low-stakes summer primer. If
  that ever matters, move the rubrics into this Worker keyed by `questionId`
  and stop embedding them in the `.qmd` files.
