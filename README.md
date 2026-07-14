# TaxCraft

TaxCraft is an open-source personal income tax calculation engine, API and reference calculator.

It takes structured tax facts, applies a supported country model and returns a deterministic estimate, calculation breakdown, coverage limits and official sources.

TaxCraft does not store user calculation data. It does not provide tax, legal, accounting or financial advice.

## Supported package

The official service currently supports Singapore resident personal income tax for YA 2024, YA 2025 and YA 2026. The caller supplies confirmed resident status and whole-dollar chargeable income. TaxCraft does not determine residency, derive chargeable income or decide relief eligibility.

Each jurisdiction supports no more than three tax years at a time. Older versions are retired from the calculator and API.

## Run locally

```bash
npm ci
npm run build
npm start
```

Open `http://localhost:3000` to use the reference calculator. The same process serves the stateless API and `GET /openapi.json`.

## Run with Docker

```bash
docker compose up --build taxcraft
```

The container runs as a non-root user. The Compose service uses a read-only filesystem, drops Linux capabilities and does not persist calculation requests or results.

## Deploy to Cloudflare

`wrangler.jsonc` packages the stateless API Worker and the calculator assets as one deployment. Deployment is gated until the repository has scoped Cloudflare credentials and `CLOUDFLARE_DEPLOY_ENABLED=true`.

See `docs/deployment.md` for the required secrets, live acceptance and rollback procedure.

## Check the repository

```bash
npm run check
```

CI also builds the service image, exercises jurisdiction discovery and a Singapore calculation, and verifies that the service does not set cookies.

## Current-source maintenance

A scheduled workflow checks the allowlisted official IRAS rate page. Two separate extractors must agree before a candidate is generated. The workflow then runs the complete repository check, opens a bot pull request and merges the checked candidate. Ambiguous or incomplete changes fail without modifying the calculator.

```bash
npm run watch:sources
```

A blocked source watch opens or updates one public operational issue. A later successful run closes it automatically.

## Project documents

- `docs/product.md` — product scope
- `docs/api.md` — API contract and example
- `docs/deployment.md` — Cloudflare deployment and live acceptance
- `docs/autonomous-maintenance.md` — source admission and lifecycle
- `docs/operations.md` — operational and rollback procedures
- `docs/release-policy.md` — model and contract versioning
- `CONTRIBUTING.md` — contribution and tax-correction requirements
- `SECURITY.md` — private vulnerability reporting

The official calculator loads only country packages maintained in this repository. External packages may implement the public SDK in their own repositories; TaxCraft does not review, list or endorse them.
