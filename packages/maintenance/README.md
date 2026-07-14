# TaxCraft maintenance

This package contains the deterministic parts of TaxCraft source maintenance.

For each maintained jurisdiction it:

- extracts allowlisted official publications through two separate parsers;
- rejects non-official hosts, incomplete schedules and ambiguous language;
- requires both parsers to return the same structured values;
- builds the latest three supported year models;
- records retired years;
- renders the files used by the runtime.

Singapore additionally preserves accepted historical rebate values when an old paragraph disappears from the current IRAS page.

The UK monitor reads HMRC's current-and-previous-years allowance and England, Wales and Northern Ireland rate tables. Scotland and unsupported income classes remain outside the package.

The maintenance package does not interpret prose, use confidence scores or approve external country packages.
