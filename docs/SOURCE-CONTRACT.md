# Source contracts and observed deployments

Source reference inspected during the initial local qualification:
[testsmith-io/practice-software-testing at ae7caecb811dd8952c09d997e69be7cb946ecd44](https://github.com/testsmith-io/practice-software-testing/tree/ae7caecb811dd8952c09d997e69be7cb946ecd44).
This is not a verified SHA of either hosted deployment.

- `sprint5/API/app/Models/Product.php` uses `HasUlids`. The reference API returns string IDs; the buggy API returns numeric IDs. The reference test stays strict; comparison classifies the numeric difference explicitly.
- `sprint5/UI/src/app/products/overview/overview.component.html` defines catalog cards and `data-test` selectors for search, sorting, product names and prices. `overview.component.ts` sets `search_completed` and `sorting_completed` after the corresponding responses.
- `sprint5/UI/src/app/products/detail/detail.component.html` exposes `product-name` and a two-decimal base `unit-price`.
- `sprint5/UI/src/app/_services/product.service.ts` uses HTTP QUERY with JSON criteria. The reference hosted API supports it; the buggy API returns 405.
- `sprint5-with-bugs/UI/src/app/products/overview/overview.component.html` maps the label `Price (Low - High)` to `price,desc`. Tests select the user-facing label and check the actual rendered order. The internal value is diagnostic evidence, not the product test's ordering oracle.
- `sprint5-with-bugs/UI/src/app/app-routing.module.ts` uses hash routing. Tests follow the product's real catalog link, supporting either path or hash routing without duplicating application routing decisions.

Source evidence explains intent and supports diagnosis. Only recorded executions establish what the hosted targets actually did at the time of the run.
