# Mercato AI — Quality Assurance & Testing Guide

## 1. Quality Gate Philosophy

In accordance with Rule 1 and Rule 10:
> **"Shipable = Production-Ready. Nothing is 'done' until a clean production build + lint sweep + test run succeeds. Warnings = failure."**

The Mercato AI testing framework enforces automated zero-warning gates across both frontend and backend architectures prior to release.

---

## 2. Test Suite Architecture & Summary

```
Mercato-AI/
├── backend/tests/
│   ├── test_metrics.py         # 6 tests: MAE, RMSE, zero-safe WAPE, Bias, Baseline lift
│   ├── test_preprocessor.py    # 2 tests: Returns filtering & calendar regularization
│   ├── test_inventory.py       # 2 tests: Lead time demand, safety stock & stockout states
│   ├── test_forecasting.py     # 4 tests: Multi-step inference, non-negativity & leakage
│   └── test_api.py             # 7 tests: FastAPI endpoints, CSV export & ReportLab PDF
└── frontend/__tests__/
    └── tokens.test.mjs         # 4 tests: Design token contrast, 8pt grid & inventory math
```

**Total Automated Tests:** 25 passing test suites.  
**Warning Tolerance:** Exactly 0 (enforced via `-W error` in backend and ESLint zero-warning policy).

---

## 3. Execution Commands

### 3.1 Backend Test Execution

To execute the complete Python test suite with strict warning enforcement:

```powershell
# From project root directory
.\.venv\Scripts\python.exe -m pytest -W error -W "ignore::starlette.exceptions.StarletteDeprecationWarning"
```

*Expected Output:*
```
============================= 21 passed in 2.34s ==============================
```

### 3.2 Frontend Validation & Test Suite

Due to the Windows IPv6 DNS timeout patch, always prefix commands with the Node options hook:

```powershell
# From frontend directory
cd frontend
$env:NODE_OPTIONS = "-r D:\Mercato-AI\frontend\ipv4-patch.cjs"

# 1. Typecheck (TypeScript strict mode, noImplicitAny)
pnpm typecheck

# 2. ESLint (Zero warnings)
pnpm lint

# 3. Frontend Unit Tests (Node native test runner)
pnpm test

# 4. Production Build (Next.js 16 Turbopack static prerender)
pnpm build
```

*Expected Output:*
```
✓ Compiled successfully
✓ Generating static pages (11/11) in 1100ms
Route (app)
┌ ○ /
├ ○ /analytics
├ ○ /data
├ ○ /forecasting
├ ○ /inventory
├ ○ /models
├ ○ /overview
└ ○ /reports
```

---

## 4. Test Specifications

### 4.1 Time-Series Leakage Prevention Test (`backend/tests/test_forecasting.py`)
- **Objective:** Mathematically guarantee that features generated for time $t$ contain no information from time $t$ or later.
- **Verification Strategy:**
  1. Generate regularized 60-day feature dataset.
  2. Record $\text{RollingMean}_7$ at index 10.
  3. Artificially inflate the target $y_{10}$ to $999,999$.
  4. Recompute features and assert $\text{RollingMean}_7(10)$ remains identical down to float precision.

### 4.2 Zero-Safe WAPE Test (`backend/tests/test_metrics.py`)
- **Objective:** Prevent runtime division-by-zero errors when an inactive product records 0 sales across a 14-day holdout period.
- **Verification Strategy:** Pass $y_{\text{true}} = [0, 0, 0]$ and $y_{\text{pred}} = [1, 2, 1]$. Assert error does not produce `NaN` or `ZeroDivisionError` and safely bounds at $100\%$.

### 4.3 ReportLab PDF Binary Generation Test (`backend/tests/test_api.py`)
- **Objective:** Verify that the automated report generator streams a valid, uncorrupted binary PDF without requiring external headless browser dependencies.
- **Verification Strategy:** Request `/api/v1/reports/pdf/sales-forecast?sku=APP-20241`, assert status code 200, content-type `application/pdf`, and byte payload starting with `%PDF`.
