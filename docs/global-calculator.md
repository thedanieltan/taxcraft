# Global PIT calculator interface

The TaxCraft reference interface is generated from the global catalogue and each implemented package's executable PIT manifest.

## Catalogue states

The country selector includes all 249 registered countries and territories and separates them into:

- implemented calculators;
- source-indexed jurisdictions whose calculator is pending;
- jurisdictions still in source discovery.

Selecting an unimplemented jurisdiction displays its provisional calculation family or discovery state. It does not display a calculation form or imply that a calculator exists.

## Manifest-driven forms

For an implemented country and tax year, the browser requests:

```text
GET /v1/pit/jurisdictions/{code}/{taxYear}/input-schema
```

It renders controls from the declared `factsSchema`:

- booleans as confirmations;
- enums and subdivision codes as select controls;
- integer facts as numeric controls;
- money facts in major currency units using the runtime currency minor-unit convention.

The browser converts money back to integer minor units before calling `POST /v1/pit/calculate`.

No jurisdiction-specific form is embedded in the interface. Adding an implemented package with a valid manifest makes its calculator form available without editing the browser application.

## Results

The result renderer is also package-neutral. It displays:

- the package's selected tax-payable total;
- all reconciled money totals;
- calculation lines;
- official sources;
- coverage and assumptions.

## Privacy and boundaries

The interface stores no calculation history and sends only facts declared by the selected package. It does not collect identity data or infer residency, filing status, income classification or relief eligibility.

The browser interface is a deployment surface. Repository acceptance proves its implementation; public deployment and live acceptance remain separate states.
