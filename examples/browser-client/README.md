# Browser client example

Serve this directory from any static web server and point the form at a TaxCraft API URL.

```bash
python -m http.server 8080 --directory examples/browser-client
```

The example uses only browser `fetch`. It sends the four supported Singapore worksheet totals, then submits the derived chargeable income to the tax calculation endpoint. It does not collect or persist identity or contact information.

TaxCraft permits credential-free CORS requests from browser clients. The API does not allow cookies or authenticated browser credentials.
