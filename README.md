# TaxCraft

TaxCraft is an open-source personal income tax calculation engine, API and reference calculator.

It takes structured tax facts, applies a supported country model and returns a deterministic estimate, calculation breakdown, coverage limits and official sources.

TaxCraft does not store user calculation data. It does not provide tax, legal, accounting or financial advice.

## Supported packages

The official API maintains:

- Singapore resident personal income tax for YA 2024, YA 2025 and YA 2026. Its optional worksheet derives chargeable income from user-confirmed income, deduction and relief totals.
- UK non-savings Income Tax for England, Wales and Northern Ireland for 2024–25, 2025–26 and 2026–27. The caller supplies user-confirmed adjusted net income. Scotland, savings, dividends and National Insurance are excluded.

TaxCraft performs arithmetic but does not determine residency, territorial status, income classification or eligibility for deductions and reliefs.

Each jurisdiction supports no more than three tax years at a time. Older versions are retired from the API and active maintenance.

## Global PIT programme

The canonical register covers all 249 ISO 3166-1 countries and territories. The machine-readable rule map keeps every jurisdiction visible, assigns source-indexed systems to provisional calculation families and retains unsourced jurisdictions for discovery.

The global summaries used for sequencing are not calculator parameter sources. Each country package continues to require official tax-year rules and deterministic fixtures.

Country packages share deterministic Node.js arithmetic through `@taxcraft/country-sdk`: progressive bands, deductions, allowance tapers, capped rebates, credits, alternative calculations, household quotients, income schedules and tax layers. Intermediate arithmetic uses `BigInt`, while public amounts remain integer minor units.

Maintained packages declare a closed, executable PIT facts schema covering tax unit, currencies, income schedules, tax layers, rounding and source-maintenance mode.

The stateless API exposes the complete global catalogue, calculation families, evidence state, implemented coverage and executable per-model input schemas. Registered jurisdictions without calculators remain visible and return an explicit `not_implemented` result from model-specific routes.

The browser interface consumes the same catalogue and schemas. It lists every jurisdiction, renders implemented calculator forms without country-specific UI code and clearly labels mapped or discovery-only entries that do not yet have calculators.

```bash
npm run check:catalog
```

See `docs/global-pit-roadmap.md`, `docs/global-pit-rule-map.md`, `docs/pit-primitives.md`, `docs/pit-country-package-contract.md`, `docs/global-calculator.md` and `docs/jurisdiction-register.md`.

## Run locally

```bash
npm ci
npm run build
npm start
```

Open `http://localhost:3000` to browse the global catalogue and use any implemented calculator. The same process serves the stateless API and `GET /openapi.json`.

## Client examples

- `examples/node-client` — dependency-free Node client and runnable example;
- `examples/browser-client` — dependency-free cross-origin browser client.

The public API permits credential-free CORS requests. It does not permit cookies or authenticated browser credentials.

## Run with Docker

```bash
docker compose up --build taxcraft
```

The container runs as a non-root user. The Compose service uses a read-only filesystem, drops Linux capabilities and does not persist worksheet requests, calculation requests or results.

## Deploy to Cloudflare

`wrangler.jsonc` packages the stateless API Worker and the calculator assets as one deployment. Deployment is gated until the repository has scoped Cloudflare credentials and `CLOUDFLARE_DEPLOY_ENABLED=true`.

See `docs/deployment.md` for the required secrets, live acceptance and rollback procedure.

## Check the repository

```bash
npm run check
```

CI validates the PIT register and rule map, builds the generated runtime catalogue and all packages, then builds the service image and verifies the stateless API behavior.

## Current-source maintenance

A scheduled workflow checks allowlisted IRAS and HMRC publications. Each jurisdiction uses two separate extractors that must produce the same structured observation before a candidate is generated. The workflow runs the complete repository check, opens a bot pull request and merges only the checked candidate. Ambiguous or incomplete changes leave the current models untouched.

```bash
npm run watch:sources
```

A blocked source watch opens or updates one public operational issue. A later successful run closes it automatically.

## Project documents

- `docs/product.md` — product scope
- `docs/global-pit-roadmap.md` — global PIT implementation programme
- `docs/global-pit-rule-map.md` — global structure map and provenance
- `docs/pit-primitives.md` — shared deterministic arithmetic contract
- `docs/pit-country-package-contract.md` — executable package manifest and input contract
- `docs/global-calculator.md` — manifest-driven browser interface
- `docs/jurisdiction-register.md` — canonical jurisdiction backlog and lifecycle
- `docs/calculation-families.md` — calculator sequencing families
- `docs/api.md` — global catalogue and calculation API
- `docs/deployment.md` — Cloudflare deployment and live acceptance
- `docs/autonomous-maintenance.md` — source admission and lifecycle
- `docs/operations.md` — operational and rollback procedures
- `docs/release-policy.md` — model and contract versioning
- `CONTRIBUTING.md` — contribution and tax-correction requirements
- `SECURITY.md` — private vulnerability reporting

The official API loads only country packages maintained in this repository. External packages may implement the public SDK in their own repositories; TaxCraft does not review, list or endorse them.
