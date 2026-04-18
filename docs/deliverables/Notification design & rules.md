# Notification System Design & Rules

## 1. The UX Philosophy: "Show, Don't Tell (Twice)"
During the architecture phase, we established a strict rule against notification spam. 
* **UI-First Feedback:** If a user action results in a direct UI change (e.g., clicking "+" updates the inline quantity counter, or submitting an order moves the Timeline UI), we **do not** fire a redundant toast notification. 
* **Reserved Usage:** Toast notifications are strictly reserved for background events, cross-tab synchronization alerts, and system-level failures where the user needs immediate, out-of-band awareness.

## 2. System Architecture & Hard Rules
The system is powered by `NotificationContext.jsx` (State Manager) and `NotificationContainer.jsx` (Renderer). It enforces the following strict operational rules:

### A. Queueing (Non-Blocking)
Notifications are never overwritten. When multiple events fire simultaneously, they are pushed into a state array and rendered as a vertical stack. This ensures the user has time to read every distinct message.

### B. Deduplication Logic (Anti-Spam)
To prevent "flood" scenarios, the Context engine evaluates the incoming payload. If a notification with the **exact same message string** is currently active in the queue, the system silently drops the duplicate.

### C. Lifecycle Management (Auto/Manual Dismiss)
* **Auto-Dismiss:** By default, notifications are stamped with a 5000ms Time-To-Live (TTL). A `setTimeout` function automatically removes the notification from the state array when the timer expires.
* **Manual Dismiss:** Every notification includes a `✕` button. Clicking it instantly removes the notification by its unique UUID, preventing frustration if a user wants to quickly clear their screen.

### D. Accessibility (ARIA Standards)
The notification wrapper is built as a highly accessible Live Region, ensuring visually impaired users receive the same critical information.
* **`aria-live="polite"`:** Screen readers will announce the notification at the next available pause, rather than aggressively interrupting the user's current screen-reading task.
* **`role="alert"`:** Applied to error-tier notifications to signal that the content requires immediate attention.
* **`aria-atomic="true"`:** Ensures the screen reader reads the entire notification message contextually, rather than just the new word that was added.

## 3. Visual Positioning Strategy
A common anti-pattern in e-commerce is placing toasts at the bottom of the screen, which often covers the "Confirm & Pay" Call-to-Action. 
* **Mobile Positioning:** Notifications float at the **Top-Center**, just below the status bar.
* **Desktop Positioning:** Notifications anchor to the **Top-Right** corner. 
This strategic placement ensures the bottom half of the screen, where the user's mouse and primary attention are focused during checkout, remains completely unobstructed.