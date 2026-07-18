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
  },
  {
    code: "AM",
    name: "Armenia general personal income tax",
    currency: "AMD",
    kind: "confirmed-tax-base",
    rateBasisPointsByYear: { "2024": 2000, "2025": 2000, "2026": 2000 },
    scopeTitle: "Confirmed Armenian general income-tax base",
    scopeDescription: "The caller confirms a tax base governed by the general Armenian personal-income-tax rate after deductible income has been resolved.",
    taxBaseTitle: "General income-tax base",
    supported: [
      "20% tax on a caller-confirmed general income-tax base",
      "calendar years 2024 through 2026"
    ],
    unsupported: [
      "qualifying high-technology salary taxed at a special 10% rate",
      "dividends, rent, crypto-assets and other income with special rates",
      "deductible-income derivation, social payments and funded-pension contributions",
      "residency, source and foreign-tax-credit decisions"
    ],
    assumptions: [
      "The caller supplied an Armenian tax base governed by the general rate under Article 150.",
      "The amount excludes income expressly governed by a special rate."
    ],
    sources: [
      {
        sourceId: "am.arlis.tax-code-article-150",
        publisher: "Armenian Legal Information System",
        publisherType: "legislation",
        title: "Tax Code of the Republic of Armenia, Article 150",
        url: "https://arlis.am/hy/acts/221385",
        jurisdiction: "AM",
        retrievedAt: "2026-07-18"
      },
      {
        sourceId: "am.src.tax-types",
        publisher: "State Revenue Committee of the Republic of Armenia",
        publisherType: "tax-authority",
        title: "What are the tax types applied in Armenia?",
        url: "https://src.am/en/getNews/478",
        jurisdiction: "AM",
        retrievedAt: "2026-07-18"
      }
    ]
  },
  {
    code: "GE",
    name: "Georgia general personal income tax",
    currency: "GEL",
    kind: "confirmed-tax-base",
    rateBasisPointsByYear: { "2024": 2000, "2025": 2000, "2026": 2000 },
    scopeTitle: "Confirmed Georgian general taxable income",
    scopeDescription: "The caller confirms taxable income governed by the general 20% natural-person income-tax rate.",
    taxBaseTitle: "Taxable income under the general rate",
    supported: [
      "20% tax on caller-confirmed taxable income under the general rate",
      "calendar years 2024 through 2026"
    ],
    unsupported: [
      "residential rent, dividends, interest and other income with special rates",
      "small-business, micro-business and other preferential entrepreneur regimes",
      "pension contributions, deductions and tax-credit derivation",
      "residency, source and permanent-establishment decisions"
    ],
    assumptions: [
      "The caller supplied taxable income governed by the general natural-person rate in Article 81.",
      "The amount excludes income governed by a preferential or special regime."
    ],
    sources: [
      {
        sourceId: "ge.matsne.tax-code-article-81",
        publisher: "Legislative Herald of Georgia",
        publisherType: "legislation",
        title: "Tax Code of Georgia — personal income tax rate",
        url: "https://matsne.gov.ge/en/document/view/1043717/1000?publication=220",
        jurisdiction: "GE",
        retrievedAt: "2026-07-18"
      }
    ]
  },
  {
    code: "MD",
    name: "Moldova general individual income tax",
    currency: "MDL",
    kind: "confirmed-tax-base",
    rateBasisPointsByYear: { "2024": 1200, "2025": 1200, "2026": 1200 },
    scopeTitle: "Confirmed Moldovan taxable income under the general rate",
    scopeDescription: "The caller confirms taxable income after applicable exemptions and mandatory health-insurance deductions.",
    taxBaseTitle: "Taxable income under the general rate",
    supported: [
      "12% tax on caller-confirmed taxable income under the general individual rate",
      "calendar years 2024 through 2026"
    ],
    unsupported: [
      "personal and dependent exemption eligibility and annual limits",
      "mandatory health-insurance and social-insurance calculations",
      "independent activity, rent, royalties and other special or final-rate income",
      "residency, source and foreign-tax-credit decisions"
    ],
    assumptions: [
      "The caller supplied taxable income after applicable exemptions and mandatory employee deductions.",
      "The amount is governed by Moldova's general 12% individual rate rather than a special regime."
    ],
    sources: [
      {
        sourceId: "md.mof.2026-salary-tax-example",
        publisher: "Ministry of Finance of the Republic of Moldova",
        publisherType: "finance-ministry",
        title: "Current 2026 salary taxation rules",
        url: "https://mf.gov.md/ro/content/reforma-salarial%C4%83-din-sectorul-bugetar-nu-modific%C4%83-regulile-actuale-de-impozitare-salariilor",
        jurisdiction: "MD",
        retrievedAt: "2026-07-18"
      },
      {
        sourceId: "md.sfs.income-tax-rates-2025",
        publisher: "State Tax Service of the Republic of Moldova",
        publisherType: "tax-authority",
        title: "Informative data on income-tax rates for 2025",
        url: "https://www.sfs.md/uploads/governmentdata/4/document/anul-2025pdf-6710a5d156d3b.pdf",
        jurisdiction: "MD",
        retrievedAt: "2026-07-18"
      }
    ]
  },
  {
    code: "MK",
    name: "North Macedonia general personal income tax",
    currency: "MKD",
    kind: "confirmed-tax-base",
    rateBasisPointsByYear: { "2024": 1000, "2025": 1000, "2026": 1000 },
    scopeTitle: "Confirmed North Macedonian personal-income-tax base",
    scopeDescription: "The caller confirms a category-specific tax base governed by the general 10% personal-income-tax rate.",
    taxBaseTitle: "Tax base under the general rate",
    supported: [
      "10% tax on a caller-confirmed category-specific tax base",
      "calendar years 2024 through 2026"
    ],
    unsupported: [
      "gambling gains taxed at 15%",
      "category-specific tax-base and recognised-expense derivation",
      "social contributions and payroll withholding administration",
      "residency, source and foreign-tax-credit decisions"
    ],
    assumptions: [
      "The caller supplied a tax base governed by the general personal-income-tax rate.",
      "The amount excludes gambling gains and other income subject to a special treatment."
    ],
    sources: [
      {
        sourceId: "mk.ujp.personal-income-tax",
        publisher: "Public Revenue Office of the Republic of North Macedonia",
        publisherType: "tax-authority",
        title: "Personal income tax — individuals",
        url: "https://ujp.gov.mk/E/fizicki_lica",
        jurisdiction: "MK",
        retrievedAt: "2026-07-18"
      },
      {
        sourceId: "mk.ujp.tax-rates",
        publisher: "Public Revenue Office of the Republic of North Macedonia",
        publisherType: "tax-authority",
        title: "Tax rates",
        url: "https://www.ujp.gov.mk/en/plakjanje/category/21",
        jurisdiction: "MK",
        retrievedAt: "2026-07-18"
      }
    ]
  },
  {
    code: "UA",
    name: "Ukraine general personal income tax",
    currency: "UAH",
    kind: "confirmed-tax-base",
    rateBasisPointsByYear: { "2024": 1800, "2025": 1800, "2026": 1800 },
    scopeTitle: "Confirmed Ukrainian general personal-income-tax base",
    scopeDescription: "The caller confirms a tax base governed by the general 18% personal-income-tax rate.",
    taxBaseTitle: "Tax base under the general PIT rate",
    supported: [
      "18% personal income tax on a caller-confirmed general tax base",
      "calendar years 2024 through 2026"
    ],
    unsupported: [
      "military levy, including its rate changes",
      "dividends, property transactions and other income subject to 0%, 5% or 9% rates",
      "simplified entrepreneur regimes, tax social benefits and deductions",
      "residency, source and foreign-tax-credit decisions"
    ],
    assumptions: [
      "The caller supplied a tax base governed by Article 167.1's general 18% PIT rate.",
      "The result is personal income tax only and deliberately excludes the military levy."
    ],
    sources: [
      {
        sourceId: "ua.sts.tax-code-section-iv-article-167",
        publisher: "State Tax Service of Ukraine",
        publisherType: "tax-authority",
        title: "Tax Code, Section IV — Personal Income Tax, Article 167",
        url: "https://tax.gov.ua/nk/rozdil-iv--podatok-na-dohodi-fizichnih-o/",
        jurisdiction: "UA",
        retrievedAt: "2026-07-18"
      },
      {
        sourceId: "ua.sts.declaration-2026-rates",
        publisher: "State Tax Service of Ukraine",
        publisherType: "tax-authority",
        title: "Personal income tax and military levy rates",
        url: "https://tax.gov.ua/deklaratsiyna-kampaniya-2026/stavki-podatku-na-dohodi-fizichnih-osib-ta-viyskovogo-zboru/",
        jurisdiction: "UA",
        retrievedAt: "2026-07-18"
      }
    ]
  },
  {
    code: "UZ",
    name: "Uzbekistan resident employment income tax",
    currency: "UZS",
    kind: "confirmed-tax-base",
    rateBasisPointsByYear: { "2024": 1200, "2025": 1200, "2026": 1200 },
    scopeTitle: "Confirmed Uzbek resident employment tax base",
    scopeDescription: "The caller confirms resident employment income governed by the general 12% personal-income-tax rate.",
    taxBaseTitle: "Resident employment tax base",
    supported: [
      "12% tax on caller-confirmed resident employment taxable income",
      "calendar years 2024 through 2026"
    ],
    unsupported: [
      "non-resident and highly qualified foreign-worker rates",
      "dividends, interest, material benefits and other special income categories",
      "deductions, exemptions and social-contribution calculations",
      "residency, source and employer-withholding administration"
    ],
    assumptions: [
      "The caller supplied resident employment taxable income governed by the general 12% rate.",
      "The amount excludes income governed by a special rate or exemption."
    ],
    sources: [
      {
        sourceId: "uz.gov.personal-income-tax-rates",
        publisher: "Government Portal of the Republic of Uzbekistan",
        publisherType: "government-agency",
        title: "Personal income tax rates",
        url: "https://www.uzbekistan.uz/ru/advice/NaN/document/1325",
        jurisdiction: "UZ",
        retrievedAt: "2026-07-18"
      },
      {
        sourceId: "uz.gov.investment-tax-system",
        publisher: "Ministry of Investment, Industry and Trade of the Republic of Uzbekistan",
        publisherType: "government-agency",
        title: "Tax system in Uzbekistan",
        url: "https://gov.uz/en/miit/sections/view/17619",
        jurisdiction: "UZ",
        retrievedAt: "2026-07-18"
      }
    ]
  }
]);
