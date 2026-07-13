# TaxCraft maintenance

This package contains the deterministic parts of TaxCraft source maintenance.

For Singapore it:

- extracts the resident rate table through two separate parsers;
- rejects non-official hosts, incomplete schedules and ambiguous language;
- requires both parsers to return the same structured values;
- preserves accepted historical values when an old paragraph disappears;
- builds the latest three assessment-year models;
- records retired years;
- renders the files used by the runtime.

The package does not interpret prose, use confidence scores or approve external country packages.
