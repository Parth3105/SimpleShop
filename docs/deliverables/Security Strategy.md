# Frontend Security & Tampering Strategy

## 1. Data Integrity & Anti-Tampering
* **Problem:** A common vulnerability in e-commerce frontends occurs when malicious users manipulate the price of an item from $500 to $5 before checking out using Dev Tools.
* **The Mitigation:**
  * **IndexedDB Snapshots:** SimpleShop treats the UI purely as a presentation layer. When a user proceeds to checkout, the application ignores the UI prices. Instead, it queries the secure, locally cached IndexedDB (`dbProducts`) which synced directly from the catalog API. If the API prices have changed, it is validated, informed and corrected on checkout.
  * **Validation Hash:** The system computes a checksum (cartHash) of the cart data, which is sent along with the order request to the mock backend (JSONPlaceholder) to verify the integrity of the cart and detect possible tampering.

## 2. Transaction Safety
* **Problem:** Network timeouts and impatient users double-clicking the "Pay" button frequently result in accidental double-charges.
* **The Mitigation:**
  * **UI Lock:** After the checkout process begins, the checkout button in the cart is temporarily disabled to prevent multiple submissions. Similarly, on the “Confirm & Pay” screen, once the button is clicked it disappears and a processing status is displayed to inform the user that the request is being processed and to prevent repeated attempts.
  * **Idempotency Key:** An idempotency key is generated during checkout and sent along with the order request to the mock backend (JSONPlaceholder). The backend uses the idempotency key to ensure that repeated requests with the same key are processed only once.

## 3. Session Concurrency (Cross-Tab Locks)
* **Problem:** A complex race condition occurs when a user opens the application in two separate browser tabs. If Tab A sits on the final "Confirm & Pay" screen, and Tab B adds a new, expensive item to the cart, clicking "Pay" in Tab A would process an outdated, invalid cart payload.
* **The Mitigation:**
  * **Live Syncing:** Any cart modification broadcasts a standard `localStorage` event, instantly syncing the cart UI across all open tabs.
  * **The Checkout Lock:** The moment Tab A enters the `CHECKOUT_VALIDATED` state, it writes a `checkout_lock` token to `localStorage`. Tab B instantly detects this lock and forces its own FSM into the inescapable `LOCKED_BY_OTHER_TAB` state. Tab B visually disables all "Add to Cart" buttons and renders a warning banner, guaranteeing the cart payload remains perfectly static while Tab A finalizes the transaction.

## 4. State Machine Purity (Session Reset)
To prevent "Ghost Tokens" or accidental session bleeding, the Finite State Machine strictly enforces lifecycle closure. Once a transaction reaches a terminal state (`ORDER_SUCCESS` or `ORDER_FAILED`), all security tokens are wiped from memory and `sessionStorage`. The user must explicitly acknowledge the terminal state (e.g., clicking "Return to Shop") to dispatch a `RESET_CHECKOUT` action, completely resetting the FSM before they are allowed to modify their cart again.