export const SIMPLE_PROGRESSIVE_JURISDICTIONS = Object.freeze([
  {
    code: "NZ",
    name: "New Zealand basic yearly income tax",
    currency: "NZD",
    taxYearBasis: "tax-year",
    kind: "taxable-income",
    scopeTitle: "Confirmed New Zealand total taxable income",
    scopeDescription: "The caller confirms total taxable income for the selected New Zealand tax year ending 31 March.",
    taxableIncomeTitle: "Total taxable income",
    taxableIncomeMultipleOf: 100,
    models: {
      "2024": {
        bands: [
          [1_400_000, 1050],
          [4_800_000, 1750],
          [7_000_000, 3000],
          [18_000_000, 3300],
          [null, 3900]
        ]
      },
      "2025": {
        bands: [
          [1_400_000, 1050],
          [1_560_000, 1282],
          [4_800_000, 1750],
          [5_350_000, 2164],
          [7_000_000, 3000],
          [7_810_000, 3099],
          [18_000_000, 3300],
          [null, 3900]
        ]
      },
      "2026": {
        bands: [
          [1_560_000, 1050],
          [5_350_000, 1750],
          [7_810_000, 3000],
          [18_000_000, 3300],
          [null, 3900]
        ]
      }
    },
    supported: [
      "basic yearly income tax on total taxable income",
      "tax years ending 31 March 2024, 2025 and 2026"
    ],
    unsupported: [
      "tax credits including the independent earner tax credit",
      "tax already deducted or paid",
      "ACC earners' levy, student loans, KiwiSaver and payroll deductions",
      "prescribed investor rates and income-classification decisions"
    ],
    assumptions: [
      "The caller supplied total taxable income for the selected tax year in whole New Zealand dollars.",
      "The result is basic yearly income tax and excludes credits, prior payments and the ACC earners' levy."
    ],
    sources: [
      {
        sourceId: "nz.ird.individual-tax-rates",
        publisher: "Inland Revenue",
        publisherType: "tax-authority",
        title: "Tax rates for individuals",
        url: "https://www.ird.govt.nz/income-tax/income-tax-for-individuals/tax-codes-and-tax-rates-for-individuals/tax-rates-for-individuals",
        jurisdiction: "NZ",
        retrievedAt: "2026-07-18"
      },
      {
        sourceId: "nz.ird.yearly-income-calculator-scope",
        publisher: "Inland Revenue",
        publisherType: "tax-authority",
        title: "Work out tax on your yearly income",
        url: "https://www.ird.govt.nz/income-tax/income-tax-for-individuals/how-income-is-taxed/work-out-tax-on-your-yearly-income",
        jurisdiction: "NZ",
        retrievedAt: "2026-07-18"
      }
    ]
  },
  {
    code: "PY",
    name: "Paraguay personal-services income tax",
    currency: "PYG",
    taxYearBasis: "calendar-year",
    kind: "paraguay-personal-services",
    models: {
      "2024": {},
      "2025": {},
      "2026": {}
    },
    supported: [
      "personal-services IRP on caller-confirmed net income",
      "gross-income payment threshold of PYG 80,000,000",
      "calendar years 2024 through 2026"
    ],
    unsupported: [
      "capital income and gains taxed under the separate 8% schedule",
      "deductible-expense and net-income derivation",
      "registration, filing and formal obligations below the payment threshold",
      "social-security contributions, residency and source decisions"
    ],
    assumptions: [
      "The caller supplied gross and net Paraguayan-source personal-services income for the calendar year.",
      "The net amount already reflects deductible expenses allowed under the personal-services regime.",
      "A zero payment below the gross-income threshold does not remove formal registration or filing obligations."
    ],
    sources: [
      {
        sourceId: "py.dnit.irp-overview",
        publisher: "Dirección Nacional de Ingresos Tributarios",
        publisherType: "tax-authority",
        title: "Impuesto a la Renta Personal",
        url: "https://www.dnit.gov.py/web/portal-institucional/irp",
        jurisdiction: "PY",
        retrievedAt: "2026-07-18"
      },
      {
        sourceId: "py.law-6380-article-69",
        publisher: "Dirección Nacional de Ingresos Tributarios",
        publisherType: "legislation",
        title: "Law No. 6380/2019, Article 69",
        url: "https://www.dnit.gov.py/en/web/portal-institucional/w/ley-n-6380-19",
        jurisdiction: "PY",
        retrievedAt: "2026-07-18"
      }
    ]
  },
  {
    code: "CY",
    name: "Cyprus individual income tax",
    currency: "EUR",
    taxYearBasis: "calendar-year",
    kind: "taxable-income",
    scopeTitle: "Confirmed Cyprus taxable income",
    scopeDescription: "The caller confirms taxable income after all applicable exemptions and deductions for the selected calendar year.",
    taxableIncomeTitle: "Taxable income",
    models: {
      "2024": {
        bands: [
          [1_950_000, 0],
          [2_800_000, 2000],
          [3_630_000, 2500],
          [6_000_000, 3000],
          [null, 3500]
        ]
      },
      "2025": {
        bands: [
          [1_950_000, 0],
          [2_800_000, 2000],
          [3_630_000, 2500],
          [6_000_000, 3000],
          [null, 3500]
        ]
      },
      "2026": {
        bands: [
          [2_200_000, 0],
          [3_200_000, 2000],
          [4_200_000, 2500],
          [7_200_000, 3000],
          [null, 3500]
        ]
      }
    },
    supported: [
      "progressive individual income tax on caller-confirmed taxable income",
      "pre-reform brackets for 2024 and 2025",
      "Tax Reform 2026 brackets for 2026"
    ],
    unsupported: [
      "family, housing, green-investment and other deduction eligibility",
      "Special Defence Contribution and General Healthcare System contributions",
      "capital gains tax and income-category derivation",
      "residency, domicile and filing-obligation decisions"
    ],
    assumptions: [
      "The caller supplied taxable income after all applicable exemptions and deductions.",
      "The result is income tax only and excludes Special Defence Contribution, healthcare contributions and capital gains tax."
    ],
    sources: [
      {
        sourceId: "cy.tax-department-individual-rates",
        publisher: "Cyprus Tax Department",
        publisherType: "tax-authority",
        title: "Individual income tax return and tax rates",
        url: "https://www.gov.cy/mof-tax/en/documents/forologiki-dilosi-eisodimatos-atomoy/",
        jurisdiction: "CY",
        retrievedAt: "2026-07-18"
      },
      {
        sourceId: "cy.tax-reform-2026",
        publisher: "Cyprus Tax Department",
        publisherType: "tax-authority",
        title: "Tax Reform 2026",
        url: "https://www.gov.cy/mof-tax/en/documents/forologiki-metarrythmisi-2026/",
        jurisdiction: "CY",
        retrievedAt: "2026-07-18"
      }
    ]
  },
  {
    code: "PA",
    name: "Panama individual income tax",
    currency: "PAB",
    taxYearBasis: "calendar-year",
    kind: "taxable-income",
    scopeTitle: "Confirmed Panama net taxable income",
    scopeDescription: "The caller confirms annual net taxable income after allowable deductions for Panama-source income.",
    taxableIncomeTitle: "Net taxable income",
    models: {
      "2024": { "bands": [[1_100_000, 0], [5_000_000, 1500], [null, 2500]] },
      "2025": { "bands": [[1_100_000, 0], [5_000_000, 1500], [null, 2500]] },
      "2026": { "bands": [[1_100_000, 0], [5_000_000, 1500], [null, 2500]] }
    },
    supported: [
      "individual income tax on caller-confirmed net taxable income",
      "calendar years 2024 through 2026"
    ],
    unsupported: [
      "deductible-expense and net-taxable-income derivation",
      "educational insurance, social-security contributions and payroll withholding",
      "special regimes, occasional payroll and non-resident withholding",
      "source, filing-period and residence decisions"
    ],
    assumptions: [
      "The caller supplied net taxable Panama-source income after allowable deductions.",
      "The result is annual individual income tax only and excludes educational insurance and social contributions."
    ],
    sources: [
      {
        sourceId: "pa.dgi.individual-income-tax-rates",
        publisher: "Dirección General de Ingresos",
        publisherType: "tax-authority",
        title: "Income tax rates — natural persons",
        url: "https://dgi.mef.gob.pa/DInforme/Tarifa",
        jurisdiction: "PA",
        retrievedAt: "2026-07-18"
      },
      {
        sourceId: "pa.dgi.individual-return",
        publisher: "Dirección General de Ingresos",
        publisherType: "tax-authority",
        title: "Individual income tax return",
        url: "https://dgi.mef.gob.pa/DInforme/D-IsRenta",
        jurisdiction: "PA",
        retrievedAt: "2026-07-18"
      }
    ]
  },
  {
    code: "HN",
    name: "Honduras individual income tax",
    currency: "HNL",
    taxYearBasis: "calendar-year",
    kind: "taxable-income",
    scopeTitle: "Confirmed Honduran taxable income",
    scopeDescription: "The caller confirms annual taxable income after applicable deductions and exemptions.",
    taxableIncomeTitle: "Taxable income",
    models: {
      "2024": { "bands": [[20_936_962, 0], [31_925_154, 1500], [74_244_549, 2000], [null, 2500]] },
      "2025": { "bands": [[21_749_316, 0], [33_163_850, 1500], [77_125_238, 2000], [null, 2500]] },
      "2026": { "bands": [[22_832_432, 0], [34_815_410, 1500], [80_966_075, 2000], [null, 2500]] }
    },
    supported: [
      "annual progressive income tax on caller-confirmed taxable income",
      "official indexed brackets for 2024, 2025 and 2026"
    ],
    unsupported: [
      "taxable-income derivation, deductions and medical-expense allowances",
      "employment withholding reconciliation and prior payments",
      "social contributions and other taxes",
      "residence, source and filing-obligation decisions"
    ],
    assumptions: [
      "The caller supplied annual taxable income after applicable deductions and exemptions.",
      "The result excludes withholding reconciliation, social contributions and other taxes."
    ],
    sources: [
      {
        sourceId: "hn.sar.progressive-table-2024",
        publisher: "Servicio de Administración de Rentas",
        publisherType: "tax-authority",
        title: "Progressive income-tax table 2024 — Agreement SAR-07-2024",
        url: "https://www.sar.gob.hn/download/acuerdo-numero-sar-07-2024-publicado-en-fecha-lunes-12-de-febrero-del-2024-en-la-gaceta-num-36458/",
        jurisdiction: "HN",
        retrievedAt: "2026-07-18"
      },
      {
        sourceId: "hn.sar.progressive-table-2025",
        publisher: "Servicio de Administración de Rentas",
        publisherType: "tax-authority",
        title: "Progressive income-tax table 2025 — Agreement SAR-07-2025",
        url: "https://www.sar.gob.hn/download/acuerdo-numero-sar-07-2025-publicado-en-fecha-9-de-enero-del-2025-en-la-gaceta-no-36735/",
        jurisdiction: "HN",
        retrievedAt: "2026-07-18"
      },
      {
        sourceId: "hn.sar.progressive-table-2026",
        publisher: "Servicio de Administración de Rentas",
        publisherType: "tax-authority",
        title: "Progressive income-tax table 2026 — Agreement SAR-01-2026",
        url: "https://www.sar.gob.hn/download/acuerdo-numero-sar-01-2026-publicado-en-fecha-23-de-enero-del-2026-en-la-gaceta-no-37051/",
        jurisdiction: "HN",
        retrievedAt: "2026-07-18"
      }
    ]
  },
  {
    code: "DO",
    name: "Dominican Republic individual income tax",
    currency: "DOP",
    taxYearBasis: "calendar-year",
    kind: "published-base-scale",
    scopeTitle: "Confirmed Dominican net taxable income",
    scopeDescription: "The caller confirms annual net taxable income after allowable expenses and deductions.",
    taxableIncomeTitle: "Net taxable income",
    models: {
      "2024": {},
      "2025": {},
      "2026": {}
    },
    supported: [
      "resident or domiciled natural-person income tax on caller-confirmed net taxable income",
      "official annual scale for 2024, 2025 and 2026"
    ],
    unsupported: [
      "net-taxable-income and deductible-expense derivation",
      "salary withholding reconciliation and prior tax payments",
      "social-security contributions and special withholding regimes",
      "residence, source and filing-obligation decisions"
    ],
    assumptions: [
      "The caller supplied annual net taxable income after allowable expenses and deductions.",
      "The published accumulated-tax amounts are applied exactly at the upper brackets."
    ],
    sources: [
      {
        sourceId: "do.dgii.individual-income-tax-scale",
        publisher: "Dirección General de Impuestos Internos",
        publisherType: "tax-authority",
        title: "Income tax — natural-person annual scale",
        url: "https://dgii.gov.do/cicloContribuyente/obligacionesTributarias/principalesImpuestos/Paginas/impuestoSobreRenta.aspx",
        jurisdiction: "DO",
        retrievedAt: "2026-07-18"
      },
      {
        sourceId: "do.dgii.scale-2026-confirmation",
        publisher: "Dirección General de Impuestos Internos",
        publisherType: "tax-authority",
        title: "Official 2026 income-tax scale confirmation",
        url: "https://ayuda.dgii.gov.do/conversations/impuesto-sobre-la-renta-isr/ca687-cul-es-la-escala-salarial-correspondiente-al-ao-2026-del-impuesto-sobre-la-renta-isr/696a664277932619036537b8",
        jurisdiction: "DO",
        retrievedAt: "2026-07-18"
      }
    ]
  }
]);
