<div align="center">
  <br />
  <a href="https://cerul.ai">
    <img src="https://raw.githubusercontent.com/cerul-ai/cerul/main/assets/logo.png" alt="Cerul" width="80" />
  </a>
  <h1>Cerul TypeScript SDK</h1>
  <p><strong>The video search layer for AI agents.</strong></p>
  <p>Teach your AI agents to see — search by meaning across visual scenes, speech, and on-screen content.</p>

  <p>
    <a href="https://cerul.ai/docs"><strong>Docs</strong></a> &middot;
    <a href="https://cerul.ai"><strong>Website</strong></a> &middot;
    <a href="https://github.com/cerul-ai/cerul"><strong>Main Repo</strong></a> &middot;
    <a href="https://x.com/cerul_hq"><img src="https://img.shields.io/badge/follow-%40cerul__hq-000?style=flat-square&logo=x" alt="Follow on X" /></a>
  </p>

  <p>
    <a href="https://www.npmjs.com/package/cerul"><img alt="npm" src="https://img.shields.io/npm/v/cerul?style=flat-square&color=3b82f6" /></a>
    <a href="./LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-3b82f6?style=flat-square" /></a>
    <img alt="Node" src="https://img.shields.io/badge/node-18%2B-22c55e?style=flat-square" />
  </p>
</div>

<br />

## Install

```bash
npm install cerul
```

## Quick Start

```ts
import { cerul } from "cerul";

const client = cerul(); // reads CERUL_API_KEY

const result = await client.search({ query: "Sam Altman on AGI timeline" });

for (const r of result.results) {
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

## Error Handling

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
- **Retry with backoff** — 429 reads `Retry-After`, 5xx exponential backoff
- **Network error retry** — timeouts and connection errors also retried when `retry: true`

## Links

- [CLI](https://github.com/cerul-ai/cerul-cli) — `curl -fsSL https://cli.cerul.ai/install.sh | bash`
- [Python SDK](https://pypi.org/project/cerul/) — `pip install cerul`
- [Main repo](https://github.com/cerul-ai/cerul) — docs, skills, remote MCP

## License

[MIT](./LICENSE)
