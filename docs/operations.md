# Operations runbook

## Local service

```bash
npm ci
npm run check
npm start
```

The reference service listens on port 3000 by default.

## Container service

```bash
docker compose up --build taxcraft
```

Check:

```bash
curl http://127.0.0.1:3000/v1/jurisdictions
```

The container runs as a non-root user. The Compose service uses a read-only filesystem, drops Linux capabilities and enables `no-new-privileges`.

## Source watch

Observe the live official source without writing files:

```bash
npm run watch:sources
```

The scheduled workflow fails closed. When blocked, it opens or updates the single issue titled `Tax source watch blocked`. The current calculator remains unchanged. After a successful run, the workflow closes the issue automatically.

Investigate a blocked run in this order:

1. source availability and redirect target;
2. official host and content type;
3. table structure and extractor output;
4. proposal, draft or enactment language;
5. disagreement between the two extractors;
6. model, lifecycle or repository test failure;
7. branch, pull-request or merge permission failure.

Do not bypass a failed source gate by editing the generated model directly. Repair the extractor, source registry or official observation path and rerun the same acceptance tests.

## Dependency updates

Dependabot opens npm and GitHub Actions updates weekly. A write-token workflow does not check out or execute the Dependabot branch. It waits for the read-only CI jobs named `check` and `container` and merges only when both pass.

## Rollback

For a software regression, revert the merge commit and allow CI to validate the revert.

For an incorrect tax model:

1. revert the model change;
2. confirm the prior source-linked model is restored;
3. rerun engine and container checks;
4. open a tax-rule correction issue with the official evidence;
5. repair the source observation or model generator before re-admission.

Never repair production by storing calculation payloads, editing user records or substituting a different tax year.

## Logging and data

Operational logs may contain event type, result status, jurisdiction and tax year. They must not contain request bodies, income values, calculated amounts, identity fields, IP-to-calculation associations or uploaded documents.
