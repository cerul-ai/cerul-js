<div align="center">
  <br />
  <a href="https://cerul.ai">
    <img src="https://raw.githubusercontent.com/cerul-ai/cerul/main/assets/logo.png" alt="Cerul" width="80" />
  </a>
  <h1>Cerul TypeScript SDK</h1>
  <p><strong>The video search layer for AI agents.</strong></p>

  <p>
    <a href="https://www.npmjs.com/package/cerul"><img alt="npm" src="https://img.shields.io/npm/v/cerul?style=flat-square&color=3b82f6" /></a>
    <a href="./LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-3b82f6?style=flat-square" /></a>
    <img alt="Node" src="https://img.shields.io/badge/node-18%2B-22c55e?style=flat-square" />
  </p>

  <p>
    <a href="https://cerul.ai/docs">Docs</a> &middot;
    <a href="https://cerul.ai">Website</a> &middot;
    <a href="https://github.com/cerul-ai/cerul">GitHub</a>
  </p>
</div>

<br />

Search what was said, shown, or presented in any video — tech talks, podcasts, conference presentations, and earnings calls.

```bash
npm install cerul
```

```ts
import { cerul } from "cerul";

const client = cerul(); // reads CERUL_API_KEY

for (const r of (await client.search({ query: "Sam Altman on AGI timeline" })).results) {
  console.log(r.title, r.url);
}
```

Get a free API key at [cerul.ai/dashboard](https://cerul.ai/dashboard).

## Examples

```ts
// Search with filters
const result = await client.search({
  query: "Jensen Huang on AI infrastructure",
  max_results: 5,
  ranking_mode: "rerank",
  include_answer: true,
  filters: { speaker: "Jensen Huang", published_after: "2024-01-01" },
});

// AI-generated answer
console.log(result.answer);

// Check credits
const usage = await client.usage();
console.log(`${usage.credits_remaining} credits remaining`);
```

## Configuration

```ts
const client = cerul({
  apiKey: "cerul_sk_...",   // or CERUL_API_KEY env var
  timeout: 30_000,          // default 30s
  retry: true,              // retry 429/5xx/network errors
});
```

## Error handling

```ts
import { CerulError } from "cerul";

try {
  await client.search({ query: "test" });
} catch (error) {
  if (error instanceof CerulError) {
    console.error(error.status, error.code, error.message);
  }
}
```

## Features

- **Zero dependencies** — native `fetch` (Node 18+, Bun, Deno, Cloudflare Workers)
- **Full TypeScript types** — complete type definitions included
- **Retry with backoff** — 429 reads `Retry-After` (capped 60s), 5xx exponential backoff
- **Network error retry** — timeouts and connection errors also retried when `retry: true`

## Links

- [Python SDK](https://pypi.org/project/cerul/) — `pip install cerul`
- [CLI](https://github.com/cerul-ai/cerul-cli) — `curl -fsSL .../install.sh | bash`
- [Main repo](https://github.com/cerul-ai/cerul) — API, docs, skills, remote MCP

## License

[MIT](./LICENSE)
