# Node client example

Start TaxCraft locally, then run:

```bash
node examples/node-client/example.mjs
```

Set `TAXCRAFT_API_URL` to use another TaxCraft deployment.

The client has no dependencies. It first calls the Singapore chargeable-income worksheet and then passes the derived amount to the tax calculation endpoint. It does not send names, contact details or identity numbers.
