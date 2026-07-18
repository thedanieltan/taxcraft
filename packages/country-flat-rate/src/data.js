export const FLAT_RATE_JURISDICTIONS = Object.freeze([
  {
    code: "BG",
    name: "Bulgaria annual personal income tax",
    currency: "BGN",
    kind: "confirmed-tax-base",
    rateBasisPointsByYear: { "2024": 1000, "2025": 1000, "2026": 1000 },
    scopeTitle: "Confirmed Bulgarian general annual tax base",
    scopeDescription: "The caller confirms the general annual tax base after compulsory social-security contributions, statutory expenses and applicable reliefs.",
    taxBaseTitle: "General annual tax base",
    supported: [
      "10% tax on the caller-confirmed general annual tax base",
      "calendar years 2024 through 2026"
    ],
    unsupported: [
      "sole-trader business income taxed at 15%",
      "dividends and other income subject to final or alternative rates",
      "social-security contributions, statutory expenses and relief eligibility",
      "residency and income-classification decisions"
    ],
    assumptions: [
      "The caller supplied the general annual tax base after all applicable deductions and reliefs.",
      "The amount does not include sole-trader income or income subject to a separate final rate."
    ],
    sources: [
      {
        sourceId: "bg.minfin.personal-income-tax",
        publisher: "Ministry of Finance of the Republic of Bulgaria",
        publisherType: "finance-ministry",
        title: "Personal Income Taxes",
        url: "https://www.minfin.bg/en/827",
        jurisdiction: "BG",
        retrievedAt: "2026-07-18"
      },
      {
        sourceId: "bg.nra.advance-income-tax",
        publisher: "National Revenue Agency",
        publisherType: "tax-authority",
        title: "Advance income tax",
        url: "https://nra.bg/wps/portal/nra-en/taxes.en/annual.income.tax.en/advance.income.tax.en",
        jurisdiction: "BG",
        retrievedAt: "2026-07-18"
      }
    ]
  },
  {
    code: "EE",
    name: "Estonia resident annual income tax",
    currency: "EUR",
    kind: "estonia-annual",
    models: {
      "2024": {
        rateBasisPoints: 2000,
        generalExemptionMode: "taper",
        generalMaximumMinor: 784800,
        taperStartIncomeMinor: 1440000,
        taperEndIncomeMinor: 2520000,
        pensionableExemptionMinor: 931200
      },
      "2025": {
        rateBasisPoints: 2200,
        generalExemptionMode: "taper",
        generalMaximumMinor: 784800,
        taperStartIncomeMinor: 1440000,
        taperEndIncomeMinor: 2520000,
        pensionableExemptionMinor: 931200
      },
      "2026": {
        rateBasisPoints: 2200,
        generalExemptionMode: "fixed",
        generalMaximumMinor: 840000,
        pensionableExemptionMinor: 931200
      }
    },
    supported: [
      "resident annual taxable income before the overall basic exemption",
      "general or pensionable-age annual basic exemption",
      "income-dependent general exemption for 2024 and 2025",
      "fixed general exemption for 2026"
    ],
    unsupported: [
      "mandatory funded-pension and unemployment-insurance deductions",
      "training, donation, pension and other tax incentives",
      "income-category exemptions and foreign-tax credits",
      "non-resident taxation and residency decisions"
    ],
    assumptions: [
      "The caller supplied annual income used for the exemption test and taxable income before the overall basic exemption.",
      "Pensionable-age status is caller-confirmed for the selected calendar year.",
      "Other deductions and credits have already been handled outside this basic calculator."
    ],
    sources: [
      {
        sourceId: "ee.emta.tax-rates-2024-2026",
        publisher: "Estonian Tax and Customs Board",
        publisherType: "tax-authority",
        title: "Tax rates",
        url: "https://www.emta.ee/en/business-client/taxes-and-payment/income-and-social-taxes/tax-rates",
        jurisdiction: "EE",
        retrievedAt: "2026-07-18"
      },
      {
        sourceId: "ee.emta.basic-exemption",
        publisher: "Estonian Tax and Customs Board",
        publisherType: "tax-authority",
        title: "Calculation of basic exemption",
        url: "https://www.emta.ee/en/private-client/taxes-and-payment/tax-incentives/calculation-basic-exemption",
        jurisdiction: "EE",
        retrievedAt: "2026-07-18"
      }
    ]
  },
  {
    code: "HU",
    name: "Hungary consolidated personal income tax",
    currency: "HUF",
    kind: "confirmed-tax-base",
    rateBasisPointsByYear: { "2024": 1500, "2025": 1500, "2026": 1500 },
    scopeTitle: "Confirmed Hungarian consolidated tax base",
    scopeDescription: "The caller confirms the consolidated tax base after all applicable personal-income-tax base allowances.",
    taxBaseTitle: "Consolidated tax base after allowances",
    supported: [
      "15% tax on the caller-confirmed consolidated tax base",
      "calendar years 2024 through 2026"
    ],
    unsupported: [
      "determining eligibility for family, age, maternity, disability or first-marriage allowances",
      "separately taxed income and special regimes",
      "social-security contributions and social contribution tax",
      "residency and foreign-tax-credit decisions"
    ],
    assumptions: [
      "The caller supplied the consolidated tax base after all applicable base allowances.",
      "The amount excludes income governed by a separate rate or special regime."
    ],
    sources: [
      {
        sourceId: "hu.njt.pit-act-section-8",
        publisher: "National Legislation Database of Hungary",
        publisherType: "legislation",
        title: "Act CXVII of 1995 on Personal Income Tax, Section 8",
        url: "https://njt.hu/jogszabaly/1995-117-00-00.218",
        jurisdiction: "HU",
        retrievedAt: "2026-07-18"
      },
      {
        sourceId: "hu.nav.pit-base-allowances",
        publisher: "National Tax and Customs Administration",
        publisherType: "tax-authority",
        title: "Personal income tax base allowances",
        url: "https://nav.gov.hu/en/taxation/Booklets/%24rppid0x1484150x112_pageNumber/2",
        jurisdiction: "HU",
        retrievedAt: "2026-07-18"
      }
    ]
  },
  {
    code: "RO",
    name: "Romania personal income tax",
    currency: "RON",
    kind: "confirmed-tax-base",
    rateBasisPointsByYear: { "2024": 1000, "2025": 1000, "2026": 1000 },
    scopeTitle: "Confirmed Romanian taxable income",
    scopeDescription: "The caller confirms taxable income for a category governed by the general 10% personal-income-tax rate.",
    taxBaseTitle: "Taxable income under the general rate",
    supported: [
      "10% tax on caller-confirmed taxable income under the general rate",
      "calendar years 2024 through 2026"
    ],
    unsupported: [
      "income categories with expressly different rates or exemptions",
      "personal deductions and category-specific taxable-income derivation",
      "social-insurance and health-insurance contributions",
      "residency and foreign-income decisions"
    ],
    assumptions: [
      "The caller supplied taxable income for a category governed by the general 10% rate.",
      "Category-specific deductions and exemptions were resolved before using the calculator."
    ],
    sources: [
      {
        sourceId: "ro.anaf.tax-code-article-64",
        publisher: "National Agency for Fiscal Administration",
        publisherType: "tax-authority",
        title: "Fiscal Code, Article 64 — tax rates",
        url: "https://static.anaf.ro/static/10/Anaf/legislatie/Cod_fiscal_norme_21052018.htm",
        jurisdiction: "RO",
        retrievedAt: "2026-07-18"
      },
      {
        sourceId: "ro.anaf.2026-income-tax-updates",
        publisher: "National Agency for Fiscal Administration",
        publisherType: "tax-authority",
        title: "2026 legislative updates — income tax and mandatory social contributions",
        url: "https://www.anaf.ro/anaf/internet/Brasov/asistcontr_brasov/informatii_curente/informatii_privind_noutati_legislative/",
        jurisdiction: "RO",
        retrievedAt: "2026-07-18"
      }
    ]
  }
]);
