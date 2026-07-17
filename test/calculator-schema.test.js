import assert from "node:assert/strict";
import test from "node:test";
import {
  createFieldModel,
  currencyScale,
  formatFieldHint,
  humanizeKey,
  parseFieldValue,
  selectPrimaryTotal,
} from "../apps/calculator/public/schema.js";

test("money fact models convert major currency units to integer minor units", () => {
  const model = createFieldModel("chargeableIncomeMinor", {
    type: "integer",
    title: "Chargeable income",
    minimum: 0,
    multipleOf: 100,
    "x-taxcraft-kind": "money-minor",
    "x-taxcraft-currency": "SGD",
  }, true);

  assert.equal(model.scale, 100);
  assert.equal(model.minimum, 0);
  assert.equal(model.step, 1);
  assert.equal(parseFieldValue(model, "85000"), 8_500_000);
  assert.equal(formatFieldHint(model), "SGD · amount · required");
});

test("currency scales follow the runtime currency minor-unit convention", () => {
  assert.equal(currencyScale("JPY"), 1);
  assert.equal(currencyScale("GBP"), 100);
  assert.equal(currencyScale("KWD"), 1_000);

  const model = createFieldModel("amountMinor", {
    type: "integer",
    title: "Amount",
    minimum: 0,
    "x-taxcraft-kind": "money-minor",
    "x-taxcraft-currency": "KWD",
  });
  assert.equal(model.step, 0.001);
  assert.equal(parseFieldValue(model, "1.234"), 1_234);
});

test("boolean and enum facts generate appropriate controls", () => {
  const confirmation = createFieldModel("resident", {
    type: "boolean",
    title: "Confirmed resident",
    const: true,
    "x-taxcraft-kind": "confirmed-status",
  }, true);
  const territory = createFieldModel("territory", {
    type: "string",
    title: "Territory",
    enum: ["England", "Wales"],
    "x-taxcraft-kind": "subdivision-code",
  }, true);

  assert.equal(confirmation.control, "checkbox");
  assert.equal(parseFieldValue(confirmation, "", true), true);
  assert.equal(territory.control, "select");
  assert.deepEqual(territory.enumValues, ["England", "Wales"]);
  assert.equal(parseFieldValue(territory, "Wales"), "Wales");
});

test("result helpers select tax payable rather than arbitrary income totals", () => {
  assert.deepEqual(selectPrimaryTotal({
    chargeableIncomeMinor: 10_000,
    grossTaxMinor: 1_000,
    netTaxPayableMinor: 800,
  }), { key: "netTaxPayableMinor", valueMinor: 800 });
  assert.deepEqual(selectPrimaryTotal({ taxableIncomeMinor: 10_000, incomeTaxMinor: 1_000 }), {
    key: "incomeTaxMinor",
    valueMinor: 1_000,
  });
  assert.equal(humanizeKey("netTaxPayableMinor"), "Net Tax Payable");
});
