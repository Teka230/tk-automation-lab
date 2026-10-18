# SORT-001 Ascending price label displays descending prices

On the buggy Toolshop edition, choose `Price (Low - High)` after the catalog loads. Expected: prices are nondecreasing in card order. Observed during local qualification: descending prices from 125.23 down to 46.50.

The same ordering test passes on the reference site. It selects the visible label, waits for the sorting response to be rendered, reads the card prices and compares them with an ascending numeric copy. It asserts neither a hard-coded product list nor the option's internal value as its functional oracle.

Each run attaches observed prices and selected internal value; failed runs retain a full-page screenshot, video and trace. See `comparison-evidence` in the CI run linked from `EVIDENCE.md`. Raw reports retain the failure and the campaign verifier checks its specific cause.

The buggy source maps the ascending label to `price,desc` at the source reference in `SOURCE-CONTRACT.md`. This was known before execution. The result demonstrates detecting and diagnosing an intentional fault, not independently discovering a new issue.

Two other buggy-suite failures concern API contracts: numeric IDs and unsupported QUERY. They are not counted as functional defects. An earlier test assumed path routing and received a 404 on the hash-routing buggy deployment; following the actual product link corrected that test assumption.
