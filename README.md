# cerul-js

Official TypeScript SDK for the Cerul video search API.

## Requirements

- Node.js 18+
- A Cerul API key

## Install

```bash
npm install cerul
```

## Quick Start

```ts
import { cerul } from "cerul";

const client = cerul({
  apiKey: process.env.CERUL_API_KEY,
});

const result = await client.search({
  query: "Sam Altman on AI video tools",
  max_results: 5,
  include_answer: true,
  filters: {
    speaker: "Sam Altman",
  },
});

console.log(result.results[0]?.title);

const usage = await client.usage();
console.log(`${usage.credits_used}/${usage.credits_limit}`);
```

You can also omit `apiKey` and let the SDK read `CERUL_API_KEY` from the environment.

## Configuration

```ts
import { cerul } from "cerul";

const client = cerul({
  apiKey: "cerul_sk_...",
  baseUrl: "https://api.cerul.ai",
  timeout: 30_000,
  retry: false,
});
```

## API

### `client.search(request)`

Search indexed videos using the public `POST /v1/search` endpoint.

### `client.usage()`

Fetch current credit balance and quota data from `GET /v1/usage`.

## Errors

API failures throw `CerulError`.

```ts
import { CerulError, cerul } from "cerul";

try {
  await cerul().usage();
} catch (error) {
  if (error instanceof CerulError) {
    console.error(error.status, error.code, error.requestId);
  }
}
```

## Development

```bash
npm install
npm run test
npm run build
npm pack
```
