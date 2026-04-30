# SimpleShop

SimpleShop is a frontend-only React application built to demonstrate advanced UI state management, rendering performance optimization, and graceful error handling. It utilizes mock API data to simulate an e-commerce checkout flow, focusing heavily on how the frontend architecture manages complex user interactions, large datasets, and unpredictable network responses.

**Application Demo: [https://drive.google.com/file/d/1tbFANFMhfmyeGzU6THL1hiBN-XQpj5MA/view?usp=sharing](https://drive.google.com/file/d/1tbFANFMhfmyeGzU6THL1hiBN-XQpj5MA/view?usp=sharing)**


## Key Features

* **Finite State Machine (FSM) Checkout:** The checkout flow is strictly controlled by a `useReducer` state machine (states include `CART_READY`, `CHECKOUT_VALIDATED`, `ORDER_SUBMITTED`, etc.) to prevent conflicting UI states.
* **Large List Virtualization:** The product feed effortlessly handles a bloated 1000 item dataset by using `@tanstack/react-virtual` to only render the DOM nodes currently visible in the user's viewport.
* **Render Optimization & Debouncing:** Utilizes `React.memo`, `useCallback`, and `useMemo` to prevent unnecessary child component re-renders during cart updates. Search input is debounced by 300ms to prevent UI blocking during rapid typing.
* **Client-Side Caching & Validation:** Uses Dexie.js (IndexedDB) to cache the product catalog locally. Before checkout, the application validates the cart's current prices against a fresh snapshot to detect stale data.
* **Network Chaos Simulation:** The checkout submission includes a randomized "Chaos Simulator" that intentionally triggers network timeouts, partial/corrupted data payloads, or standard failures to demonstrate the UI's error recovery and retry flows.
* **Diagnostic Telemetry Tool:** If the FSM enters an error state, the UI exposes a tool to copy a structured JSON snapshot of the current state, idempotency key, and error reason to the user's clipboard for simulated debugging.
* **Custom Notification Engine:** Includes an ARIA-compliant, Context-driven toast notification system with built-in deduplication and auto & manual dismissal logic.


## Tech Stack

* **Framework:** React 18, Vite
* **Styling:** Tailwind CSS
* **Browser Storage:** IndexedDB, Local Storage, Session Storage
* **Mock APIs:** Fake Store API, JSONPlaceholder

## Documentation
For an in-depth look at the engineering decisions behind this application, please review the dedicated architectural documents included in this repository:
* [Architecture Write-up (Data Flow + State Machine)](./docs/deliverables/Architecture.md) - Data Flow Diagram & State Machine Diagram.

* [Edge Case Matrix](./docs/deliverables/Edge%20Case%20Matrix.md) - A tabular breakdown of specific UI, storage, or network failure scenarios and the frontend mitigation strategies implemented to handle them.

* [Performance Techniques & Evidence](./docs/deliverables/Performance%20Technique%20&%20Evidence.md) - Documents the implementation and React Profiler evidence for DOM virtualization, component memoization, and input debouncing.

* [Security & Tampering Strategy](./docs/deliverables/Security%20Strategy.md) - Explains the client-side mechanisms built to simulate transactional security, including IndexedDB cart hashing, idempotency tokens, and cross-tab session locking.

* [Notification Design & Rules](./docs/deliverables/Notification%20design%20&%20rules.md) - Outlines the programmatic logic and accessibility (ARIA) standards for the custom toast notification system, including deduplication and queueing rules.

* [Observability & Debugging](./docs/deliverables/Debugging%20Strategy.md) - Documents the debugging strategies used in the application, their implementation, and the insights gained from observing their behavior.


## Declaration of Originality
This project was developed as a demonstration of frontend architectural capabilities. While standard open-source libraries and mock APIs were utilized, the core system design, state machine logic, and security mitigations are original implementations. See the **[Declaration of Originality](./docs/deliverables/Originality%20Declaration.md)** for full attribution details.
