# Country packages

A country package supplies tax-year manifests, official sources, fact validation, calculation logic and coverage data to the TaxCraft engine.

## Official packages

The official calculator and API load only packages maintained directly in this repository. Adding an official jurisdiction is a deliberate project decision, not an open submission channel.

## External packages

Developers may publish compatible packages in their own repositories and load them into their own TaxCraft deployment. They are responsible for correctness, source maintenance, security, licensing and support.

TaxCraft does not review, list, endorse or provide support for external packages.

## Lifecycle

A package exposes no more than three tax years. When a new current version is added, the former current version becomes historical-supported and versions beyond the three-year window are retired.
