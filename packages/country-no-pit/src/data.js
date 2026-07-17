export const NO_PIT_JURISDICTIONS = Object.freeze([
  {
    code: "AE",
    name: "United Arab Emirates employment income",
    currency: "AED",
    scopeTitle: "Confirmed UAE wage or salary income",
    scopeDescription: "The caller confirms that the amount is wage or salary income outside the natural-person business activity scope.",
    coveredIncomeTitle: "Wage or salary income",
    supported: [
      "wages and salaries of a natural person outside business or business activity",
      "personal income tax result for calendar years 2024 through 2026"
    ],
    unsupported: [
      "business or business-activity income",
      "corporate tax registration or turnover thresholds",
      "social contributions, payroll obligations and other taxes",
      "residency and income-classification decisions"
    ],
    assumptions: [
      "The caller has confirmed that the amount is wage or salary income rather than business or business-activity income.",
      "The zero result is personal income tax only and does not determine any other UAE tax obligation."
    ],
    sources: [
      {
        sourceId: "ae.pit.natural-person-wages",
        publisher: "Federal Tax Authority",
        publisherType: "tax-authority",
        title: "Corporate Tax: Natural Person",
        url: "https://tax.gov.ae/en/taxes/corporate.tax/natural.person.aspx",
        jurisdiction: "AE",
        retrievedAt: "2026-07-18"
      }
    ]
  },
  {
    code: "BH",
    name: "Bahrain personal income tax",
    currency: "BHD",
    scopeTitle: "Confirmed individual personal income scope",
    scopeDescription: "The caller confirms that the amount is individual personal income within the ordinary Bahrain no-personal-income-tax scope.",
    coveredIncomeTitle: "Covered personal income",
    supported: [
      "ordinary individual personal income",
      "personal income tax result for calendar years 2024 through 2026"
    ],
    unsupported: [
      "social insurance contributions",
      "employer payroll obligations and other taxes",
      "business licensing, corporate or sector-specific taxes",
      "residency and income-classification decisions"
    ],
    assumptions: [
      "The caller has confirmed that the income falls within the ordinary individual personal income scope described by the official investment authority.",
      "The zero result is personal income tax only and does not determine social insurance or any other Bahrain obligation."
    ],
    sources: [
      {
        sourceId: "bh.pit.investor-guide",
        publisher: "Bahrain Economic Development Board",
        publisherType: "government-agency",
        title: "Your Essential Guide: Top 10 Investor Questions for Expanding into Bahrain",
        url: "https://www.bahrainedb.com/bahrain-pulse/your-essential-guide-top-10-investor-questions-for-expanding-into-bahrain",
        jurisdiction: "BH",
        retrievedAt: "2026-07-18"
      }
    ]
  },
  {
    code: "BM",
    name: "Bermuda personal income tax",
    currency: "BMD",
    scopeTitle: "Confirmed personal income tax scope",
    scopeDescription: "The caller confirms that the amount is being tested for Bermuda personal income tax, excluding payroll tax.",
    coveredIncomeTitle: "Covered personal income",
    supported: [
      "personal income tax result for calendar years 2024 through 2026"
    ],
    unsupported: [
      "payroll tax imposed on remuneration",
      "social insurance contributions",
      "employer obligations and other taxes",
      "residency and income-classification decisions"
    ],
    assumptions: [
      "The zero result is personal income tax only.",
      "Bermuda payroll tax is a separate obligation and is explicitly outside this calculator."
    ],
    sources: [
      {
        sourceId: "bm.pit.eu-position",
        publisher: "Government of Bermuda",
        publisherType: "government-agency",
        title: "Positioning Bermuda on the EU List of Non-Cooperative Tax Jurisdictions",
        url: "https://www.gov.bm/articles/positioning-bermuda-eu-list-non-cooperative-tax-jurisdictions",
        jurisdiction: "BM",
        retrievedAt: "2026-07-18"
      },
      {
        sourceId: "bm.payroll-tax",
        publisher: "Government of Bermuda",
        publisherType: "government-agency",
        title: "Payroll Tax",
        url: "https://www.gov.bm/payroll-tax",
        jurisdiction: "BM",
        retrievedAt: "2026-07-18"
      }
    ]
  },
  {
    code: "BN",
    name: "Brunei Darussalam personal income tax",
    currency: "BND",
    scopeTitle: "Confirmed individual personal income scope",
    scopeDescription: "The caller confirms that the amount is individual personal income rather than company income.",
    coveredIncomeTitle: "Covered personal income",
    supported: [
      "individual personal income",
      "personal income tax result for calendar years 2024 through 2026"
    ],
    unsupported: [
      "company income tax",
      "social security and pension contributions",
      "employer obligations and other taxes",
      "residency and income-classification decisions"
    ],
    assumptions: [
      "The caller has confirmed that the amount is individual personal income and not company income.",
      "The zero result is personal income tax only."
    ],
    sources: [
      {
        sourceId: "bn.pit.taxation-overview",
        publisher: "Ministry of Finance and Economy",
        publisherType: "finance-ministry",
        title: "Taxation",
        url: "https://www.mofe.gov.bn/Divisions/taxation.aspx",
        jurisdiction: "BN",
        retrievedAt: "2026-07-18"
      }
    ]
  },
  {
    code: "KY",
    name: "Cayman Islands personal income tax",
    currency: "KYD",
    scopeTitle: "Confirmed individual personal income scope",
    scopeDescription: "The caller confirms that the amount is individual personal income within the Cayman Islands no-direct-tax structure.",
    coveredIncomeTitle: "Covered personal income",
    supported: [
      "individual personal income",
      "personal income tax result for calendar years 2024 through 2026"
    ],
    unsupported: [
      "work-permit fees, pension or health-insurance obligations",
      "customs duties, stamp duty and other indirect taxes",
      "business and regulatory obligations",
      "residency and income-classification decisions"
    ],
    assumptions: [
      "The caller has confirmed that the amount is individual personal income.",
      "The zero result is personal income tax only and does not represent total Cayman Islands taxes or mandatory contributions."
    ],
    sources: [
      {
        sourceId: "ky.pit.annual-report",
        publisher: "Cayman Islands Government",
        publisherType: "government-agency",
        title: "Cayman Islands Government Annual Report 2023–2024",
        url: "https://www.gov.ky/content/published/api/v1.1/assets/CONT91D91DB8B1694011A35EA89DE69ED7C0/native/CA-2023-2024-Annual-Report.pdf",
        jurisdiction: "KY",
        retrievedAt: "2026-07-18"
      }
    ]
  },
  {
    code: "MC",
    name: "Monaco resident income tax",
    currency: "EUR",
    scopeTitle: "Confirmed Monaco resident income-tax scope",
    scopeDescription: "The caller confirms Monaco residence and that the person is outside the French-national convention exception described by the official service.",
    coveredIncomeTitle: "Covered resident income",
    supported: [
      "resident individual income outside the French-national convention exception",
      "personal income tax result for calendar years 2024 through 2026"
    ],
    unsupported: [
      "French nationals subject to the bilateral convention exception",
      "French-source or foreign tax obligations",
      "social contributions and other Monaco charges",
      "residency and treaty-status decisions"
    ],
    assumptions: [
      "The caller has confirmed Monaco residence and that the person is outside the French-national exception described by the official service.",
      "The zero result is Monaco personal income tax only and does not determine tax obligations in another jurisdiction."
    ],
    sources: [
      {
        sourceId: "mc.pit.income-tax",
        publisher: "Monaco Public Service",
        publisherType: "government-agency",
        title: "Income tax",
        url: "https://monservicepublic.gouv.mc/en/themes/tax/tax-system/income-tax",
        jurisdiction: "MC",
        retrievedAt: "2026-07-18"
      }
    ]
  },
  {
    code: "OM",
    name: "Oman pre-2028 personal income tax",
    currency: "OMR",
    scopeTitle: "Confirmed Oman individual income scope before 2028",
    scopeDescription: "The caller confirms that the selected year precedes the Personal Income Tax Law commencement on 1 January 2028.",
    coveredIncomeTitle: "Covered personal income",
    supported: [
      "individual personal income for calendar years 2024 through 2026 before the announced 2028 commencement"
    ],
    unsupported: [
      "calendar year 2028 and later",
      "future regulations, exemptions and implementation details",
      "social contributions, business obligations and other taxes",
      "residency and income-classification decisions"
    ],
    assumptions: [
      "The selected model year precedes the announced Personal Income Tax Law commencement on 1 January 2028.",
      "The zero result must not be used for 2028 or later."
    ],
    sources: [
      {
        sourceId: "om.pit.personal-income-tax",
        publisher: "Oman Tax Authority",
        publisherType: "tax-authority",
        title: "Personal Income Tax",
        url: "https://taxoman.gov.om/portal/web/taxportal/personal-income-tax",
        jurisdiction: "OM",
        retrievedAt: "2026-07-18"
      }
    ]
  },
  {
    code: "QA",
    name: "Qatar salary and wage income tax",
    currency: "QAR",
    scopeTitle: "Confirmed Qatar salary or wage income",
    scopeDescription: "The caller confirms that the amount is salary or wage income rather than taxable business or other source income.",
    coveredIncomeTitle: "Salary or wage income",
    supported: [
      "salary and wage income of citizens and residents",
      "personal income tax result for calendar years 2024 through 2026"
    ],
    unsupported: [
      "business, permanent-establishment or other taxable source income",
      "withholding tax and corporate obligations",
      "social contributions and payroll obligations",
      "residency and income-classification decisions"
    ],
    assumptions: [
      "The caller has confirmed that the amount is salary or wage income.",
      "The zero result does not apply to business or other taxable Qatar-source income."
    ],
    sources: [
      {
        sourceId: "qa.pit.salary-wages",
        publisher: "General Tax Authority",
        publisherType: "tax-authority",
        title: "GTA workshop clarifying the State of Qatar tax system",
        url: "https://www.gta.gov.qa/en/media-center/news/the-general-tax-authority-gta-organizes-a-workshop-for-representatives-of-several-sectoral-and-specialized-media-outlets-to-clarify-the-mechanisms-of-the-tax-system-in-the-state-of-qatar",
        jurisdiction: "QA",
        retrievedAt: "2026-07-18"
      }
    ]
  }
]);
