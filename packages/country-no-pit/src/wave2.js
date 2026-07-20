export const NO_PIT_WAVE_2_JURISDICTIONS = Object.freeze([
  {
    code: "SA",
    name: "Saudi Arabia employment income",
    currency: "SAR",
    scopeTitle: "Confirmed Saudi employment income",
    scopeDescription: "The caller confirms that the amount is employment remuneration and not income from a taxable business activity, permanent establishment or other Saudi-source activity.",
    coveredIncomeTitle: "Employment income",
    supported: [
      "employment remuneration outside the taxable business-activity scope",
      "personal income tax result for calendar years 2024 through 2026"
    ],
    unsupported: [
      "business, professional, investment or other profit-seeking activity",
      "non-resident permanent-establishment and other Saudi-source income",
      "withholding tax, Zakat, social insurance and payroll obligations",
      "residency, source and income-classification decisions"
    ],
    assumptions: [
      "The caller has confirmed that the amount is employment remuneration rather than income from a business or other taxable activity.",
      "The zero result is personal income tax on the confirmed employment-income scope only and does not determine any other Saudi tax or contribution obligation."
    ],
    sources: [
      {
        sourceId: "sa.zatca.income-tax-scope",
        publisher: "Zakat, Tax and Customs Authority",
        publisherType: "tax-authority",
        title: "Income Tax",
        url: "https://zatca.gov.sa/en/Pages/IncomeTax.aspx",
        jurisdiction: "SA",
        retrievedAt: "2026-07-20"
      }
    ]
  },
  {
    code: "VG",
    name: "British Virgin Islands personal income tax",
    currency: "USD",
    scopeTitle: "Confirmed British Virgin Islands personal income-tax scope",
    scopeDescription: "The caller confirms that the amount is being tested for personal income tax only and understands that payroll tax on remuneration is a separate obligation.",
    coveredIncomeTitle: "Covered personal income",
    supported: [
      "personal income tax result for calendar years 2024 through 2026"
    ],
    unsupported: [
      "payroll tax imposed on employers and self-employed persons in respect of remuneration",
      "employee payroll-tax deductions and the annual remuneration exemption",
      "social security, National Health Insurance and pension obligations",
      "property, stamp, hotel accommodation, business and other taxes or fees",
      "residency and income-classification decisions"
    ],
    assumptions: [
      "The zero result is personal income tax only.",
      "British Virgin Islands payroll tax is a separate tax on remuneration and is explicitly outside this calculator."
    ],
    sources: [
      {
        sourceId: "vg.ird.tax-inventory",
        publisher: "Government of the Virgin Islands",
        publisherType: "government-agency",
        title: "Inland Revenue Department",
        url: "https://www.bvi.gov.vg/departments/inland-revenue-department-0",
        jurisdiction: "VG",
        retrievedAt: "2026-07-20"
      },
      {
        sourceId: "vg.ird.payroll-tax",
        publisher: "Government of the Virgin Islands",
        publisherType: "government-agency",
        title: "Payroll Tax",
        url: "https://www.bvi.gov.vg/content/payroll-tax",
        jurisdiction: "VG",
        retrievedAt: "2026-07-20"
      }
    ]
  }
]);
