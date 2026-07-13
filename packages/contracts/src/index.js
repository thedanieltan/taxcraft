export const CONTRACT_VERSION = "taxcraft.contracts.v1";

export const CALCULATION_STATUS = Object.freeze({
  OK: "ok",
  UNSUPPORTED: "unsupported",
  INVALID: "invalid",
});

export const MODEL_STATUS = Object.freeze({
  CANDIDATE: "candidate",
  CURRENT: "current",
  HISTORICAL_SUPPORTED: "historical-supported",
  RETIRED: "retired",
  WITHDRAWN: "withdrawn",
});

export const RESULT_NOTICE =
  "This is an estimate based on the information entered and the supported rules for the selected tax year. It is not tax, legal, accounting or financial advice.";

export const ACCEPTED_SOURCE_TYPES = Object.freeze([
  "tax-authority",
  "legislation",
  "official-gazette",
  "finance-ministry",
  "official-budget",
  "mandatory-contribution-authority",
  "government-archive",
]);

export const PROHIBITED_PII_FIELDS = Object.freeze([
  "name",
  "fullname",
  "firstname",
  "lastname",
  "nationalidentitynumber",
  "nationalid",
  "passportnumber",
  "address",
  "email",
  "emailaddress",
  "phone",
  "phonenumber",
  "bankaccount",
  "bankaccountnumber",
]);
