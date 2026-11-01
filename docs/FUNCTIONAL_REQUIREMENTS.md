# Mercato AI — Functional Requirements Specification (FRS)

## Document Governance
- **Project Name:** Mercato AI
- **System Version:** 1.0.0 Production Release
- **Target Audience:** Academic Review Board, Software Architects, Retail Inventory Planners

---

## 1. System Requirements Matrix

| ID | Title | Priority | Target User | Academic Relevance |
| :--- | :--- | :--- | :--- | :--- |
| **FR-1** | Transaction Ingestion & Returns Cleaning | Critical | Data Engineer / Merchant | Preprocessing rigor & noise reduction |
| **FR-2** | Continuous Calendar Regularization | Critical | ML Pipeline | Zero-demand handling in retail time-series |
| **FR-3** | Leakage-Free Feature Engineering | Critical | ML Pipeline | Temporal integrity & causal lag structures |
| **FR-4** | Multi-Model Demand Forecasting | Critical | Inventory Planner | Comparative evaluation vs. Seasonal Naive |
| **FR-5** | Empirical Quantile Uncertainty Intervals | High | Demand Analyst | Calibrated interval bounds vs. arbitrary bands |
| **FR-6** | Rolling-Origin Backtesting | High | ML Evaluator | Out-of-sample temporal cross-validation |
| **FR-7** | Continuous-Review Inventory Intelligence | Critical | Supply Chain Analyst | Stochastic safety stock & reorder point math |
| **FR-8** | Purchase Order Generation & Export | Medium | Procurement Lead | Actionable replenishment execution |
| **FR-9** | Croston Demand Profiling & Seasonality | High | Product Analyst | Intermittent & erratic SKU categorization |
| **FR-10**| Executive Briefing & Multi-Format Reporting | High | Executive Leadership | Provenance-rich reporting & Gemini AI analysis |

---

## 2. Detailed Functional Specifications

### FR-1: Transaction Ingestion & Returns Cleaning
- **Description:** The system must accept raw transaction records (CSV upload or benchmark database seed) and clean anomalies prior to aggregation.
- **Input Parameters:** `InvoiceNo`, `StockCode`/`SKU`, `Description`, `Quantity`, `InvoiceDate`, `UnitPrice`, `CustomerID`.
- **Business Logic:**
  1. Detect cancelled invoices or customer returns identified by negative `Quantity` or invoices prefixed with `C` or `c`. Remove these records according to documented academic standards to prevent artificial negative demand spikes.
  2. Filter administrative non-product codes (e.g., `POST`, `D`, `DOT`, `M`, `BANK CHARGES`, `AMAZONFEE`).
  3. Validate numeric timestamps and positive unit prices ($UnitPrice > 0$).
- **Acceptance Criteria:**
  - Returns and administrative codes are isolated and logged.
  - Raw and cleaned record counts are displayed in the UI prior to ingestion commit.

### FR-2: Continuous Calendar Regularization & Zero Filling
- **Description:** Retail sales datasets frequently omit days where no transactions occurred. The pipeline must regularize the time-series into continuous daily intervals.
- **Business Logic:**
  1. Identify earliest date $t_0$ and latest date $t_N$ for each product.
  2. Construct a complete Cartesian calendar grid $\mathcal{T} = \{t_0, t_0+1, \dots, t_N\}$.
  3. Reindex the product sales against $\mathcal{T}$, filling missing days with $Quantity = 0.0$ and $Revenue = 0.0$.
- **Acceptance Criteria:**
  - Zero consecutive calendar gaps exist in `daily_sales`.
  - Zero-sales days are accurately accounted for in lag and rolling calculations.

### FR-3: Leakage-Free Feature Engineering
- **Description:** The feature engineering engine must construct temporal features using exclusively past observations.
- **Business Logic:**
  1. **Strict Lags:** Extract $y_{t-1}, y_{t-2}, y_{t-3}, y_{t-7}, y_{t-14}, y_{t-21}, y_{t-28}$.
  2. **Rolling Statistics:** Apply `shift(1)` prior to rolling calculations:
     $$\text{RollingMean}_k(t) = \frac{1}{k} \sum_{i=1}^{k} y_{t-i}$$
     $$\text{RollingStd}_k(t) = \sqrt{\frac{1}{k-1} \sum_{i=1}^{k} (y_{t-i} - \text{RollingMean}_k(t))^2}$$
  3. **Calendar Encodings:** Extract day-of-week, weekend indicator, day-of-month, month, quarter, and month-boundary flags.
- **Acceptance Criteria:**
  - Unit tests verify that modifying observation $y_t$ causes zero change in features at timestep $t$.

### FR-4: Multi-Model Demand Forecasting
- **Description:** Provide recursive multi-step forecasting for defined horizons (7 days to 28 days) across three distinct model families.
- **Models Implemented:**
  1. *Seasonal Naive Baseline:* $\hat{y}_{t+h} = y_{t+h-7}$.
  2. *Random Forest Regressor:* 100 estimators with dynamic feature feedback.
  3. *Histogram-Based Gradient Boosting:* Optimized tree boosting with native missing-value tolerance.
- **Acceptance Criteria:**
  - Model outputs conform to $y_{pred} \ge 0$.
  - Forecasts persist to `forecast_runs` and `forecast_points` with full run metadata.

### FR-5: Empirical Quantile Uncertainty Intervals
- **Description:** Deliver calibrated prediction intervals without assuming synthetic Gaussian distributions.
- **Business Logic:**
  - Compute in-sample or out-of-fold validation residuals: $e_t = y_t - \hat{y}_t$.
  - Compute non-parametric empirical quantiles at 80% ($q_{10\%}, q_{90\%}$) and 95% ($q_{2.5\%}, q_{97.5\%}$).
  - Bound interval predictions: $[\max(0, \hat{y}_{t+h} + q_{low}), \hat{y}_{t+h} + q_{high}]$.
- **Acceptance Criteria:**
  - Corridors are strictly non-negative and enclose the point prediction.

### FR-6: Rolling-Origin Backtesting & Evaluation
- **Description:** Support expanding-window backtesting across chronological folds.
- **Evaluation Metrics:**
  - Mean Absolute Error (MAE): $\frac{1}{n}\sum |y - \hat{y}|$
  - Root Mean Squared Error (RMSE): $\sqrt{\frac{1}{n}\sum (y - \hat{y})^2}$
  - Weighted Absolute Percentage Error (WAPE): $\frac{\sum |y - \hat{y}|}{\max(\sum y, 10^{-6})}$
  - Forecast Bias: $\frac{\sum (\hat{y} - y)}{\max(\sum y, 10^{-6})}$
  - Baseline Lift: $\frac{\text{WAPE}_{\text{base}} - \text{WAPE}_{\text{model}}}{\text{WAPE}_{\text{base}}} \times 100\%$
- **Acceptance Criteria:**
  - Zero division-by-zero errors when total actual sales equal 0.

### FR-7: Continuous-Review Inventory Intelligence
- **Description:** Calculate replenishment requirements under stochastic demand using classical inventory theory.
- **Formulas:**
  - Lead Time Demand ($D_{LT}$): $\bar{d}_{\text{daily}} \times LT$
  - Safety Stock ($SS$): $Z \times \sigma_d \times \sqrt{LT}$ (default $Z=1.65$ for 95% service level)
  - Reorder Point ($ROP$): $D_{LT} + SS$
  - Days of Supply ($DoS$): $\frac{I_{\text{current}}}{\bar{d}_{\text{daily}}}$
- **Risk Categorization:**
  - **CRITICAL:** $I_{\text{current}} < SS$ (stockout imminent).
  - **REORDER NOW:** $SS \le I_{\text{current}} \le ROP$.
  - **MODERATE:** $ROP < I_{\text{current}} \le 1.5 \times ROP$.
  - **SAFE:** $I_{\text{current}} > 1.5 \times ROP$.
- **Acceptance Criteria:**
  - Immediate visual badge reflecting exact status. Current stock is fully editable inline.

### FR-8: Interactive Purchase Order Drafting
- **Description:** Automatically suggest replenishment quantity:
  $$Q_{\text{reorder}} = \max\left(Q_{\min}, \lceil ROP - I_{\text{current}} \rceil\right)$$
- **Acceptance Criteria:**
  - One-click "Add to PO" adds the item to the order drawer with live capital commitment tallies.

### FR-9: Product Analytics & Croston Demand Profiling
- **Description:** Analyze demand variability ($CV = \sigma / \mu$) and average inter-demand interval ($p$) to categorize SKU demand profiles:
  - *Smooth:* Low $CV$ ($< 0.49$) and short interval ($p < 1.32$).
  - *Erratic:* High $CV$ and short interval.
  - *Intermittent:* Low $CV$ and long interval.
  - *Lumpy:* High $CV$ and long interval.
- **Acceptance Criteria:**
  - Classification badge displayed per SKU alongside day-of-week demand velocity profiles.

### FR-10: Multi-Format Reporting & Executive AI Briefing
- **Description:** Deliver executive reports in both machine-readable CSV and professionally styled PDF format.
- **Acceptance Criteria:**
  - PDF generated on the fly via ReportLab using deep emerald headers, tabular alignment, and formal metric tables.
  - CSV export streams formatted forecast dates and confidence bounds.
