# Browser client example

Serve this directory from any static web server and point the form at a TaxCraft API URL.

```bash
python -m http.server 8080 --directory examples/browser-client
```

The example uses only browser `fetch`. It sends the four supported Singapore worksheet totals, then submits the derived chargeable income to the tax calculation endpoint. It does not collect or persist identity or contact information.

A separately hosted browser client needs the TaxCraft deployment to permit its origin through an explicit CORS policy. The first-party calculator is served from the same origin and does not require CORS.
