# PIT calculation families

The calculation-family catalogue groups jurisdictions by implementation shape. It controls sequencing and primitive reuse; it does not decide whether a jurisdiction belongs in TaxCraft.

## Families

| Family | Shape | Wave |
| --- | --- | ---: |
| `NO_PIT` | Explicit zero ordinary national PIT for the supported scope | 1 |
| `FLAT` | One principal rate on a confirmed tax base | 2 |
| `FLAT_WITH_ALLOWANCE` | One principal rate after a fixed allowance or standard deduction | 2 |
| `SIMPLE_PROGRESSIVE` | One principal progressive schedule with limited adjustments | 3 |
| `PROGRESSIVE_RELIEFS` | Progressive rates with deductions, allowances, credits, rebates or phase-outs | 4 |
| `HOUSEHOLD_FILING` | Material dependence on filing status, spouses, dependants or household computation | 5 |
| `MULTI_LAYER` | National tax combined with state, provincial, cantonal, regional or municipal tax | 6 |
| `MULTI_SCHEDULE` | Materially different schedules by income category | 7 |
| `COMPLEX_COMPOSITE` | Alternative calculations, extensive credits, multiple layers or other cross-cutting rules | 8 |

`UNMAPPED` is a backlog state and has no implementation wave.

## Classification

A jurisdiction is assigned to the earliest family that accurately represents the intended calculator slice. A package may expose a bounded first slice and later move to a more capable family when its supported coverage expands.

Examples:

- a caller-confirmed taxable base under one rate is `FLAT`;
- progressive employment income with a standard allowance is `SIMPLE_PROGRESSIVE` or `PROGRESSIVE_RELIEFS`, depending on the adjustments;
- national and provincial tax is `MULTI_LAYER`;
- separate employment, dividend and capital-gain schedules are `MULTI_SCHEDULE`;
- a system combining filing statuses, multiple government layers, alternative tax and extensive credits is `COMPLEX_COMPOSITE`.

Classification describes implementation structure, not legal simplicity or taxpayer burden.
