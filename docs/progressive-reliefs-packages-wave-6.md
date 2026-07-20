# Progressive-reliefs packages — wave 6

## Ghana

TaxCraft implements a deliberately bounded Ghana individual income-tax package for calendar years 2024, 2025 and 2026. The 2026 model is current; 2024 and 2025 remain historical-supported.

The package supports:

- resident monthly chargeable income through GHS 19,896.67;
- resident annual chargeable income through GHS 238,760;
- non-resident monthly or annual chargeable income at the generally applicable 25% rate.

## Why the resident upper bands fail closed

The Ghana Revenue Authority table and Act 1111 publish the same internal conflict. The stated resident band widths accumulate to GHS 50,416.67 monthly and GHS 605,000 annually, while the 35% rate is stated to begin above GHS 50,000 monthly and GHS 600,000 annually.

That creates an overlap between the listed 30% band and the 35% threshold. TaxCraft does not choose one number, interpolate a replacement width or silently prefer a secondary source.

Resident calculations therefore stop after the unambiguous 25% band. A resident monthly amount above GHS 19,896.67 or annual amount above GHS 238,760 returns an explicit unsupported-scope error.

## Inputs

- confirmation that the request is within the implemented Ghana individual-tax scope;
- monthly or annual income period;
- resident or non-resident schedule;
- caller-confirmed chargeable income in Ghana cedis.

The calculator does not request a name, tax identification number, address, employer, nationality, residence evidence or supporting document.

## Supported resident bands

### Monthly

- first GHS 490: 0%;
- next GHS 110: 5%;
- next GHS 130: 10%;
- next GHS 3,166.67: 17.5%;
- next GHS 16,000: 25%.

### Annual

- first GHS 5,880: 0%;
- next GHS 1,320: 5%;
- next GHS 1,560: 10%;
- next GHS 38,000: 17.5%;
- next GHS 192,000: 25%.

## Non-resident schedule

The generally applicable non-resident individual rate is 25% of chargeable income. This schedule remains available for monthly and annual caller-confirmed chargeable amounts because it does not depend on the contradictory resident upper bands.

## Exclusions

The package does not derive chargeable income, employment benefits, deductions or reliefs. It excludes SSNIT, provident-fund, mortgage-interest, donation and foreign-tax-credit calculations.

It also excludes:

- resident income above the supported ceilings;
- bonus, overtime, casual-worker and modified-taxation schedules;
- rent, investment and business-income schedules;
- withholding administration, payments, reconciliation and refunds;
- residence, source and filing-obligation determinations.

## Sources and maintenance

The package cites the Ghana Revenue Authority PAYE table, its implementation notice for Act 1111, the Parliament of Ghana record for Act 1111 and the GRA personal-income-tax guidance.

The source conflict is covered by executable rejection tests. A future official correction can extend the resident scope only after its effective date is confirmed and new deterministic fixtures pass.

## Delivery state

Repository implementation, public deployment and live acceptance are separate states. This work package adds repository, API and manifest-driven calculator support. It does not by itself claim public deployment or production acceptance.
