# Mercato AI — Non-Functional Requirements Specification (NFRS)

## 1. Performance & Web Vitals Standards

| Metric | Target Baseline | Emulated 3G / Low-End | Monitoring Mechanism |
| :--- | :--- | :--- | :--- |
| **Largest Contentful Paint (LCP)** | $\le 1.8\text{ s}$ | $\le 2.5\text{ s}$ | Next.js Core Web Vitals report & Lighthouse |
| **Cumulative Layout Shift (CLS)** | $\le 0.05$ | $\le 0.10$ | Static aspect ratios on charts & image slots |
| **Total Blocking Time (TBT)** | $\le 150\text{ ms}$ | $\le 300\text{ ms}$ | Turbopack code splitting & tree-shaking |
| **First Input Delay (FID) / INP** | $\le 50\text{ ms}$ | $\le 100\text{ ms}$ | React 19 concurrent transitions |
| **API Response Time (Inference)** | $\le 250\text{ ms}$ | $\le 500\text{ ms}$ | In-memory feature engineering & caching |
| **PDF Generation Latency** | $\le 600\text{ ms}$ | $\le 1200\text{ ms}$ | Direct streaming via ReportLab buffer |

---

## 2. Accessibility (WCAG 2.1 Level AA Baseline)

1. **Color Contrast:**
   - Deep Emerald (`#126B54`) on Warm Ivory (`#F7F7F0`): Contrast ratio **5.14:1** (Exceeds AA standard of 4.5:1).
   - Dark Ink (`#172B24`) on Warm Ivory (`#F7F7F0`): Contrast ratio **13.82:1** (Exceeds AAA standard of 7.0:1).
   - High-contrast text on all interactive buttons and badges.
2. **Keyboard Navigation & Focus Management:**
   - Full keyboard accessibility for modal drawers, tab bars, product dropdowns, and pagination controls.
   - Distinct, visible focus rings using Emerald 600 ring offsets (`focus-visible:ring-2 focus-visible:ring-[#126B54]`).
3. **Screen Reader Compatibility:**
   - Semantic HTML elements (`<nav>`, `<main>`, `<article>`, `<header>`, `<footer>`).
   - Accessible ARIA labels on chart legends, icon buttons, and modal dialogs.
4. **Motion Discipline:**
   - Strict adherence to `prefers-reduced-motion` media queries: all transition durations fold to zero or subtle opacity changes when reduced motion is requested.

---

## 3. Type Safety & Software Quality Standards

1. **TypeScript Strict Mode:**
   - `strict: true`, `noImplicitAny: true`, `noUncheckedIndexedAccess: true`.
   - Complete prohibition of the `any` keyword across the entire codebase.
2. **Deterministic Schemas:**
   - Strict runtime schema validation via Pydantic v2 on backend and TypeScript interfaces on frontend.
3. **8-Point Spacing Grid:**
   - Spatial layout, component padding, margins, and gaps are multiples of 8 (`8px`, `16px`, `24px`, `32px`, `48px`, `64px`).

---

## 4. Security, Isolation & Key Governance

1. **Zero Client Secrets:**
   - Absolutely no AI provider keys (e.g., `GEMINI_API_KEY`) or administrative secrets are exposed to the browser.
   - All external intelligence queries are proxied and sanitized via `backend/app/api/endpoints/ai_insights.py`.
2. **Graceful Offline Fallbacks:**
   - When external LLM APIs are unreachable or unconfigured, the application immediately serves an offline deterministic summary without failing the HTTP request.
3. **Data Sanitization & Input Validation:**
   - File uploads are validated for MIME type (`text/csv`) and checked for malformed headers before entering memory buffers.
   - Database operations use parameterized queries through SQLAlchemy ORM, eliminating SQL injection attack surfaces.

---

## 5. Academic Reproducibility & Portability

1. **Deterministic Pseudo-Random Seeds:**
   - Explicit random seeds (`seed = 42`) set across Python `random`, NumPy `np.random`, and Scikit-learn estimators (`RandomForestRegressor`, `HistGradientBoostingRegressor`).
2. **Self-Contained Persistence:**
   - SQLite relational storage enables zero-dependency execution across Windows, macOS, and Linux workstations without requiring external database server daemons.
3. **Zero Deprecation Warnings:**
   - Codebase enforces `-W error` clean compliance across Python 3.12, Pandas 3.x, and Next.js 16.
