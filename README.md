<div align="center">
  <br />
  <a href="https://cerul.ai">
    <img src="https://raw.githubusercontent.com/cerul-ai/cerul/main/assets/logo.png" alt="Cerul" width="80" />
  </a>
  <h1>Cerul TypeScript SDK</h1>
  <p><strong>The video search layer for AI agents.</strong></p>
  <p>Teach your AI agents to see. Search what was said, shown, or presented in any video.</p>

  <p>
    <a href="https://cerul.ai/docs"><strong>Docs</strong></a> &middot;
    <a href="https://cerul.ai"><strong>Website</strong></a> &middot;
    <a href="https://github.com/cerul-ai/cerul"><strong>Main Repo</strong></a>
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

const client = cerul(); // reads CERUL_API_KEY from env

const { results, answer } = await client.search({
  query: "Sam Altman on AGI timeline",
  max_results: 5,
  include_answer: true,
  filters: { speaker: "Sam Altman" },
});

for (const r of results) {
  console.log(`${r.title} (${r.score}) — ${r.url}`);
}
```

## Features

- **Zero dependencies** — native `fetch` only (Node 18+, Bun, Deno, Cloudflare Workers)
- **Full TypeScript types** — `SearchRequest`, `SearchResponse`, `UsageResponse`, `CerulError`
- **Timeout** — configurable via `AbortController`, default 30s
- **Optional retry** — 429 reads `Retry-After`, 5xx exponential backoff, capped at 60s
- **API key resolution** — parameter > `CERUL_API_KEY` env var

## Configuration

```ts
const client = cerul({
  apiKey: "cerul_sk_...",       // or reads CERUL_API_KEY
  timeout: 30_000,              // ms, default 30s
  retry: true,                  // retry 429/5xx, default false
});
```

## Usage Monitoring

```ts
const usage = await client.usage();
console.log(`${usage.credits_used} / ${usage.credits_remaining} credits`);
```

## Errors

```ts
import { CerulError, cerul } from "cerul";

try {
  await cerul().search({ query: "test" });
} catch (error) {
  if (error instanceof CerulError) {
    console.error(error.status, error.code, error.message);
  }
}
```

## Ecosystem

| Package | Description |
|---------|-------------|
| [`cerul`](https://github.com/cerul-ai/cerul) | Main repo — API, docs, skills, remote MCP |
| [`cerul`](https://pypi.org/project/cerul/) | Python SDK |
| [`cerul-cli`](https://github.com/cerul-ai/cerul-cli) | CLI tool (Rust) |

## License

[MIT](./LICENSE)
