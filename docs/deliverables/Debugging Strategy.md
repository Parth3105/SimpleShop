# Observability, Debugging & Telemetry

## 1. Structured Logging & Diagnostics
* **Implementation:** When the Finite State Machine (FSM) enters the `ORDER_FAILED` or `ORDER_INCONSISTENT` state, the UI exposes a "Copy Diagnostic Info" tool.
* **Structured Output:** This tool serializes the exact state of the FSM into a highly readable, structured JSON payload. Support teams or developers receive a snapshot containing the ISO timestamp, the terminal FSM status, the stringified error reason, the Idempotency UUID, and a sanitized snapshot of the cart payload. This bridges the gap between customer complaints and engineering telemetry.

## 2. Data Transmission Observability
* **Testing Protocol:** Open the browser's **Network Tab**. 
* **Observation:** When clicking "Confirm & Pay", we can observe the outbound `POST` request to `jsonplaceholder.typicode.com`. The Request Payload explicitly reveals item details required to be sent, the generated `idempotencyKey` and the calculated `cartHash`, proving that the frontend is transmitting secure checksums rather than raw price values.

## 3. Console Debugging & Fallbacks
* **Implementation:** Silent failures, such as `QuotaExceededError` during `sessionStorage` serialization or `UnhandledPromiseRejection` during a Dexie database read, are routed through `console.error()`. This ensures that background synchronization failures do not fatally crash the React tree, while still leaving a breadcrumb trail in the console for developers to investigate errors.