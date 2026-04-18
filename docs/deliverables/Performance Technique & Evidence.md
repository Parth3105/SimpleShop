# Performance Optimization Strategy & Evidence

SimpleShop employs three distinct frontend optimization techniques. These optimizations target the most common React bottlenecks: DOM bloat, unnecessary reconciliation, and excessive state updates.

## 1. DOM Virtualization (Windowing)
Rendering a catalog of 1,000+ items simultaneously causes severe layout thrashing, memory bloat, and scrolling lag, especially on mobile devices.

* **Technique:** We implemented a Virtual List (Windowing) for the `ProductFeed`. Instead of mounting the entire catalog array to the DOM, the virtualizer calculates the user's scroll position and only mounts the specific items currently visible in the viewport (plus a small buffer).
* **Evidence:**
  * **Before Virtualization:** Inspection of the Elements tab revealed a massive DOM tree containing **501+ rendered nodes** (`<div class="bg-white p-4...">`), dragging down page load and scroll performance.
  
  ![Evidence Screenshot - Before Virtualization](<../images/Product Listing without Virtualizer.png>)

  * **After Virtualization:** The Elements tab confirms the DOM footprint has been reduced. Only **11-12 absolutely positioned `div` elements** exist in the DOM at any given time. As the user scrolls, these elements are recycled and their `translateY` values are dynamically updated to simulate a massive scrolling list.

  ![Evidence Screenshot - After Virtualization](<../images/Product Listing with Virtualizer.png>)

## 2. Component Memoization (`React.memo` & `useCallback`)
By default, when a parent component's state changes, React re-renders all of its children. In a large list, clicking "+" on a single product was causing hundreds of unrelated products to recalculate and re-render.

* **Technique:** We wrapped the `ProductCard` component in `React.memo` to skip rendering if its props haven't changed. Crucially, we also wrapped the `handleUpdateQuantity` function passed to these cards in a `useCallback` hook. This prevents React from generating a new function reference on every parent render, which would otherwise break the memoization.
* **Evidence (React Profiler Data):**
  * **Before Memoization:** The Profiler's Ranked Chart and Flamegraph show a severe performance bottleneck. A single click to update a cart quantity triggered a full `ProductFeed` render taking **342.1ms**. The Profiler explicitly states the reason for the child re-renders: *"Props changed: (onUpdateQuantity)"*. Every single `ProductCard` on the page was forced to re-render.

  ![Evidence Screenshot - Flamegraph - Before Memoization](<../images/Profiler (Flamegraph) before memoization.png>)
  ![Evidence Screenshot - Flamegraph - Before Memoization (1)](<../images/Profiler (Flamegraph) before memoization (1).png>)
  ![Evidence Screenshot - Ranked Chart - Before Memoization](<../images/Profiler (Ranked Chart) before memoization.png>)

  * **After Memoization:** The Profiler confirms the optimization was successful. The total commit time dropped to just **10.9ms**. More importantly, the Flamegraph shows that only a *single* `ProductCard` re-rendered (taking just **1.8ms**), with the Profiler noting *"Props changed: (quantity)"*. The rest of the catalog was successfully bypassed.

  ![Evidence Screenshot - Flamegraph - After Memoization](<../images/Profiler (Flamegraph) after memoization.png>)
  ![Evidence Screenshot - Ranked Chart - After Memoization](<../images/Profiler (Ranked Chart) after memoization.png>)


## 3. Input Debouncing
Continuous user input (like typing in a search bar) can trigger expensive array filtering and DOM updates on every single keystroke.

* **Technique:** We applied a debouncing utility to the text input handlers. 
* **Implementation Details:** Instead of firing the state update and filtering the 1,000-item catalog array on every `onChange` event, the application waits for a brief period of inactivity (e.g., 300ms) after the user's last keystroke before executing the filter logic. This significantly reduces CPU overhead and prevents the UI from locking up during rapid typing.