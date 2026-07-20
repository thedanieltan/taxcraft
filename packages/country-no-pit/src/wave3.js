export const NO_PIT_WAVE_3_JURISDICTIONS = Object.freeze([
  {
    code: "BS",
    name: "Bahamas personal income tax",
    currency: "BSD",
    scopeTitle: "Confirmed Bahamas personal income-tax scope",
    scopeDescription: "The caller confirms that the amount is individual personal income and understands that consumption, property, business, payroll-related and other taxes or contributions remain separate.",
    coveredIncomeTitle: "Covered personal income",
    supported: [
      "individual personal income",
      "personal income tax result for calendar years 2024 through 2026"
    ],
    unsupported: [
      "value-added tax, customs and excise duties",
      "real property tax, stamp tax and other transaction taxes",
      "business licence obligations and the Domestic Minimum Top-Up Tax for in-scope multinational entities",
      "National Insurance contributions and employer obligations",
      "residency and income-classification decisions"
    ],
    assumptions: [
      "The caller has confirmed that the amount is individual personal income rather than a business tax base or an amount governed by another Bahamas tax.",
      "The zero result is personal income tax only and does not determine any other Bahamas tax, fee or contribution obligation."
    ],
    sources: [
      {
        sourceId: "bs.opm.mid-year-budget-2024-25",
        publisher: "Office of the Prime Minister, The Bahamas",
        publisherType: "government-agency",
        title: "The Commonwealth of The Bahamas 2024/2025 Mid-Year Budget Statement",
        url: "https://opm.gov.bs/2024-2025-mid-year-budget-statement/",
        jurisdiction: "BS",
        retrievedAt: "2026-07-20"
      },
      {
        sourceId: "bs.opm.personal-income-tax-policy",
        publisher: "Office of the Prime Minister, The Bahamas",
        publisherType: "government-agency",
        title: "Prime Minister Davis's Opening Contribution to the Mid-Year Budget Debate 2023-2024",
        url: "https://opm.gov.bs/prime-minister-davis-mid-year-budget-debate-contribution-2023-2024/",
        jurisdiction: "BS",
        retrievedAt: "2026-07-20"
      }
    ]
  },
  {
    code: "KW",
    name: "Kuwait employment income",
    currency: "KWD",
    scopeTitle: "Confirmed Kuwait individual employment income",
    scopeDescription: "The caller confirms that the amount is employment remuneration of a natural person and not income attributed to a corporate body carrying on trade or business in Kuwait.",
    coveredIncomeTitle: "Employment income",
    supported: [
      "individual employment remuneration outside the corporate-body income-tax scope",
      "personal income tax result for calendar years 2024 through 2026"
    ],
    unsupported: [
      "income of a corporate body carrying on trade or business in Kuwait",
      "business, permanent-office, contract, property, service and other corporate taxable income",
      "Zakat, national labour support and multinational-entity tax obligations",
      "social security, payroll and employer obligations",
      "residency, source and income-classification decisions"
    ],
    assumptions: [
      "The caller has confirmed that the amount is employment remuneration of a natural person rather than income of a corporate body carrying on trade or business.",
      "The zero result is personal income tax on the confirmed employment-income scope only and does not determine corporate, Zakat, labour-support, social-security or other obligations."
    ],
    sources: [
      {
        sourceId: "kw.mof.income-tax-law-corporate-body",
        publisher: "Ministry of Finance, State of Kuwait",
        publisherType: "finance-ministry",
        title: "Law No. 2 of 2008 amending Kuwait Income Tax Decree No. 3 of 1955 and Executive Bylaw",
        url: "https://mof.gov.kw/Desicions/Decree/PDF/Q3_1955e.pdf",
        jurisdiction: "KW",
        retrievedAt: "2026-07-20"
      }
    ]
  }
]);
