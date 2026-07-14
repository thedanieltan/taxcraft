const TAXABLE_SOURCE_ID = "sg-iras-what-is-taxable";
const RELIEFS_SOURCE_ID = "sg-iras-reliefs-rebates-deductions";
const MONEY_FIELDS = [
  "employmentIncomeMinor",
  "otherTaxableIncomeMinor",
  "allowableDeductionsMinor",
  "personalReliefsMinor"
];
const ALLOWED_FIELDS = new Set([...MONEY_FIELDS, "eligibilityConfirmed"]);

export function calculateChargeableIncomeWorksheet(facts) {
  const issues = validateWorksheetFacts(facts);
  if (issues.length) return { status: "invalid", issues };

  const totalIncomeMinor = facts.employmentIncomeMinor + facts.otherTaxableIncomeMinor;
  const assessableIncomeMinor = totalIncomeMinor - facts.allowableDeductionsMinor;
  const chargeableIncomeMinor = Math.max(0, assessableIncomeMinor - facts.personalReliefsMinor);

  if (![totalIncomeMinor, assessableIncomeMinor, chargeableIncomeMinor].every(Number.isSafeInteger)) {
    return {
      status: "invalid",
      issues: [{ code: "worksheet.safe-integer", path: "$.facts", message: "Worksheet values exceed safe integer arithmetic." }]
    };
  }

  return {
    status: "ok",
    currency: "SGD",
    totals: {
      employmentIncomeMinor: facts.employmentIncomeMinor,
      otherTaxableIncomeMinor: facts.otherTaxableIncomeMinor,
      totalIncomeMinor,
      allowableDeductionsMinor: facts.allowableDeductionsMinor,
      assessableIncomeMinor,
      personalReliefsMinor: facts.personalReliefsMinor,
      chargeableIncomeMinor
    },
    lines: [
      {
        ruleId: "sg.worksheet.taxable-income",
        label: "Taxable income entered",
        amountMinor: totalIncomeMinor,
        sourceIds: [TAXABLE_SOURCE_ID]
      },
      {
        ruleId: "sg.worksheet.allowable-deductions",
        label: "User-confirmed allowable deductions",
        amountMinor: -facts.allowableDeductionsMinor,
        sourceIds: [RELIEFS_SOURCE_ID]
      },
      {
        ruleId: "sg.worksheet.personal-reliefs",
        label: "User-confirmed personal reliefs",
        amountMinor: -Math.min(facts.personalReliefsMinor, assessableIncomeMinor),
        sourceIds: [RELIEFS_SOURCE_ID]
      }
    ],
    assumptions: [
      "The user has confirmed that each income amount is taxable for the selected Year of Assessment.",
      "The user has confirmed eligibility and the entered amounts for deductions and personal reliefs.",
      "TaxCraft performs arithmetic only and does not determine eligibility for a deduction or relief.",
      "The worksheet accepts non-negative whole Singapore-dollar amounts."
    ],
    coverage: {
      supported: [
        "employment income entered by the user",
        "other taxable income entered by the user",
        "user-confirmed allowable deduction total",
        "user-confirmed personal relief total",
        "chargeable-income arithmetic"
      ],
      unsupported: [
        "residency determination",
        "income classification decisions",
        "deduction or relief eligibility",
        "document extraction",
        "filing or tax advice"
      ]
    }
  };
}

export function validateWorksheetFacts(facts) {
  const issues = [];
  if (!facts || typeof facts !== "object" || Array.isArray(facts)) {
    return [{ code: "worksheet.facts", path: "$.facts", message: "Worksheet facts must be an object." }];
  }

  for (const field of Object.keys(facts)) {
    if (!ALLOWED_FIELDS.has(field)) {
      issues.push({
        code: "worksheet.field-not-allowed",
        path: `$.facts.${field}`,
        message: `Worksheet field ${field} is not accepted. TaxCraft does not collect identity or contact fields.`
      });
    }
  }

  if (facts.eligibilityConfirmed !== true) {
    issues.push({
      code: "worksheet.confirmation",
      path: "$.facts.eligibilityConfirmed",
      message: "Confirm that income classification and deduction or relief eligibility were determined outside TaxCraft."
    });
  }

  for (const field of MONEY_FIELDS) {
    const value = facts[field];
    if (!Number.isSafeInteger(value) || value < 0) {
      issues.push({ code: `worksheet.${field}`, path: `$.facts.${field}`, message: `${field} must be a non-negative integer minor-unit amount.` });
    } else if (value % 100 !== 0) {
      issues.push({ code: `worksheet.${field}.whole-dollar`, path: `$.facts.${field}`, message: `${field} must use whole Singapore dollars.` });
    }
  }

  if (issues.length === 0) {
    const totalIncomeMinor = facts.employmentIncomeMinor + facts.otherTaxableIncomeMinor;
    if (!Number.isSafeInteger(totalIncomeMinor)) {
      issues.push({ code: "worksheet.total-income", path: "$.facts", message: "Income values exceed safe integer arithmetic." });
    } else if (facts.allowableDeductionsMinor > totalIncomeMinor) {
      issues.push({
        code: "worksheet.deductions-exceed-income",
        path: "$.facts.allowableDeductionsMinor",
        message: "Allowable deductions cannot exceed the taxable income entered in this worksheet."
      });
    }
  }

  return issues;
}
