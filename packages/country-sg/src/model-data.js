export const SINGAPORE_MODEL_DATA = deepFreeze({
  "schemaVersion": 1,
  "jurisdiction": "SG",
  "taxYears": [
    {
      "taxYear": "YA2024",
      "order": 2024,
      "rateSourceId": "sg-iras-resident-rates-ya2024-onwards",
      "brackets": [
        { "widthMinor": 2000000, "rateBasisPoints": 0 },
        { "widthMinor": 1000000, "rateBasisPoints": 200 },
        { "widthMinor": 1000000, "rateBasisPoints": 350 },
        { "widthMinor": 4000000, "rateBasisPoints": 700 },
        { "widthMinor": 4000000, "rateBasisPoints": 1150 },
        { "widthMinor": 4000000, "rateBasisPoints": 1500 },
        { "widthMinor": 4000000, "rateBasisPoints": 1800 },
        { "widthMinor": 4000000, "rateBasisPoints": 1900 },
        { "widthMinor": 4000000, "rateBasisPoints": 1950 },
        { "widthMinor": 4000000, "rateBasisPoints": 2000 },
        { "widthMinor": 18000000, "rateBasisPoints": 2200 },
        { "widthMinor": 50000000, "rateBasisPoints": 2300 },
        { "widthMinor": null, "rateBasisPoints": 2400 }
      ],
      "rebate": {
        "percentage": 50,
        "capMinor": 20000,
        "sourceId": "sg-iras-pit-rebate-ya2024-ya2025"
      },
      "modelVersion": "1.0.0",
      "status": "historical-supported"
    },
    {
      "taxYear": "YA2025",
      "order": 2025,
      "rateSourceId": "sg-iras-resident-rates-ya2024-onwards",
      "brackets": [
        { "widthMinor": 2000000, "rateBasisPoints": 0 },
        { "widthMinor": 1000000, "rateBasisPoints": 200 },
        { "widthMinor": 1000000, "rateBasisPoints": 350 },
        { "widthMinor": 4000000, "rateBasisPoints": 700 },
        { "widthMinor": 4000000, "rateBasisPoints": 1150 },
        { "widthMinor": 4000000, "rateBasisPoints": 1500 },
        { "widthMinor": 4000000, "rateBasisPoints": 1800 },
        { "widthMinor": 4000000, "rateBasisPoints": 1900 },
        { "widthMinor": 4000000, "rateBasisPoints": 1950 },
        { "widthMinor": 4000000, "rateBasisPoints": 2000 },
        { "widthMinor": 18000000, "rateBasisPoints": 2200 },
        { "widthMinor": 50000000, "rateBasisPoints": 2300 },
        { "widthMinor": null, "rateBasisPoints": 2400 }
      ],
      "rebate": {
        "percentage": 60,
        "capMinor": 20000,
        "sourceId": "sg-iras-pit-rebate-ya2024-ya2025"
      },
      "modelVersion": "1.0.0",
      "status": "historical-supported"
    },
    {
      "taxYear": "YA2026",
      "order": 2026,
      "rateSourceId": "sg-iras-resident-rates-ya2024-onwards",
      "brackets": [
        { "widthMinor": 2000000, "rateBasisPoints": 0 },
        { "widthMinor": 1000000, "rateBasisPoints": 200 },
        { "widthMinor": 1000000, "rateBasisPoints": 350 },
        { "widthMinor": 4000000, "rateBasisPoints": 700 },
        { "widthMinor": 4000000, "rateBasisPoints": 1150 },
        { "widthMinor": 4000000, "rateBasisPoints": 1500 },
        { "widthMinor": 4000000, "rateBasisPoints": 1800 },
        { "widthMinor": 4000000, "rateBasisPoints": 1900 },
        { "widthMinor": 4000000, "rateBasisPoints": 1950 },
        { "widthMinor": 4000000, "rateBasisPoints": 2000 },
        { "widthMinor": 18000000, "rateBasisPoints": 2200 },
        { "widthMinor": 50000000, "rateBasisPoints": 2300 },
        { "widthMinor": null, "rateBasisPoints": 2400 }
      ],
      "rebate": null,
      "modelVersion": "1.0.0",
      "status": "current"
    }
  ]
});

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value)) deepFreeze(nested);
  return value;
}
