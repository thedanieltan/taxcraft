# Deployment

TaxCraft can run as one Cloudflare Worker with the reference calculator uploaded as static assets.

The Worker remains stateless. It has no database or user account binding and does not persist calculation inputs or results.

## Repository settings

Add these GitHub Actions secrets:

- `CLOUDFLARE_API_TOKEN` — a scoped token allowed to deploy Workers;
- `CLOUDFLARE_ACCOUNT_ID` — the target Cloudflare account.

Add these repository variables:

- `CLOUDFLARE_DEPLOY_ENABLED=true` — enables the production deployment job;
- `TAXCRAFT_LIVE_URL` — the deployed `https://...workers.dev` or custom-domain URL used for acceptance checks.

Do not commit Cloudflare credentials to the repository.

## Deployment

The `Deploy Cloudflare Worker` workflow runs the full repository checks, deploys `wrangler.jsonc`, and then performs live acceptance when `TAXCRAFT_LIVE_URL` is configured.

The live checks verify:

- `/healthz` returns an operational response;
- no cookie is set;
- Singapore jurisdiction discovery works;
- the YA2026 reference calculation returns the expected deterministic result.

## Rollback

Use Cloudflare deployment rollback to restore the last accepted Worker version. Keep `CLOUDFLARE_DEPLOY_ENABLED` set to `false` while investigating a failed deployment.

A repository merge is implementation acceptance. A successful deployment workflow against `TAXCRAFT_LIVE_URL` is live acceptance. These statuses must not be conflated.
