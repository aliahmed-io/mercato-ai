const isBrowser = typeof window !== "undefined";
const configuredPublicUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

export const API_BASE_URL =
  configuredPublicUrl && configuredPublicUrl.length > 0
    ? configuredPublicUrl
    : isBrowser
    ? "/api/v1"
    : (process.env.BACKEND_URL || "http://127.0.0.1:8008") + "/api/v1";

export interface Product {
  sku: string;
  name: string;
  category: string;
  unit_price: number;
  cost_price: number;
  description?: string;
  image_url?: string;
}

export interface KPICard {
  title: string;
  value: string;
  subtitle: string;
  delta_pct?: number;
  delta_direction?: "up" | "down" | "neutral";
}

export interface CategoryPerformance {
  category: string;
  units_sold: number;
  revenue: number;
  product_count: number;
  share_pct: number;
}

export interface TopProductItem {
  sku: string;
  name: string;
  category: string;
  units_sold: number;
  revenue: number;
  trend_pct: number;
  current_stock: number;
  status_badge: string;
}

export interface ExecutiveOverview {
  total_historical_revenue: number;
  total_units_sold: number;
  total_forecasted_revenue: number;
  total_forecasted_units: number;
  active_skus_count: number;
  critical_stockouts_count: number;
  reorder_now_count: number;
  kpis: KPICard[];
  category_breakdown: CategoryPerformance[];
  top_products: TopProductItem[];
  recent_trend: { date: string; quantity: number; revenue: number }[];
  ai_executive_summary?: string;
}

export interface ForecastPoint {
  target_date: string;
  predicted_quantity: number;
  lower_80: number;
  upper_80: number;
  lower_95: number;
  upper_95: number;
  actual_quantity?: number;
}

export interface HistoricalPoint {
  date: string;
  quantity: number;
  revenue: number;
}

export interface ForecastResponse {
  forecast_run_id: number;
  sku: string;
  product_name: string;
  category: string;
  model_name: string;
  horizon_days: number;
  metrics: {
    mae?: number;
    rmse?: number;
    wape?: number;
    wape_pct?: number;
    bias?: number;
    lift_vs_baseline_pct?: number;
  };
  feature_importance: Record<string, number>;
  history: HistoricalPoint[];
  points: ForecastPoint[];
  summary_stats: {
    total_forecasted_units: number;
    expected_revenue: number;
    historical_revenue_window: number;
    unit_price: number;
    cutoff_date: string;
  };
}

export interface InventoryItem {
  sku: string;
  product_name: string;
  category: string;
  unit_price: number;
  cost_price: number;
  current_stock: number;
  warehouse_location: string;
  lead_time_days: number;
  lead_time_std_days?: number;
  safety_stock_factor: number;
  daily_demand_std: number;
  avg_daily_forecast: number;
  lead_time_demand: number;
  safety_stock: number;
  safety_stock_deterministic?: number;
  safety_stock_stochastic?: number;
  reorder_point: number;
  reorder_point_deterministic?: number;
  supplier_reliability_score?: number;
  supplier_name?: string;
  supplier_email?: string;
  days_of_supply: number;
  risk_status: "CRITICAL" | "REORDER_NOW" | "MODERATE" | "SAFE";
  status_badge: string;
  urgency: "high" | "medium" | "low" | "none";
  suggested_reorder_qty: number;
  capital_required: number;
  assumptions: string[];
}

export interface PromotionEvent {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  discount_pct: number;
  expected_lift_factor: number;
  sku_scope: string;
  is_active: boolean;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  expected_lift_factor: number;
  type: "calendar_holiday" | "merchant_promotion";
  is_fixed: boolean;
}

export interface PurchaseOrderItem {
  id: number;
  sku: string;
  product_name?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  created_at: string;
  status: "DRAFT" | "DISPATCHED" | "RECEIVED" | "CANCELLED";
  supplier_name: string;
  supplier_email: string;
  warehouse_location: string;
  dispatched_at?: string;
  received_at?: string;
  actual_lead_time_days?: number;
  expected_delivery_date?: string;
  total_units: number;
  total_cost: number;
  notes?: string;
  items: PurchaseOrderItem[];
  mailto_url?: string;
  procurement_letter?: string;
}

export interface ProductAnalytics {
  sku: string;
  name: string;
  category: string;
  unit_price: number;
  cost_price: number;
  total_quantity: number;
  total_revenue: number;
  daily_mean: number;
  daily_std: number;
  cv_variability: number;
  demand_profile: "Smooth" | "Erratic" | "Intermittent" | "Lumpy";
  zero_days_pct: number;
  weekday_pattern: { day: string; avg_demand: number }[];
}

export interface ModelBenchmarkItem {
  model_id: string;
  model_name: string;
  is_baseline: boolean;
  mae: number;
  rmse: number;
  wape_pct: number;
  bias: number;
  lift_vs_baseline_pct: number;
  feature_importance?: Record<string, number>;
}

export interface BacktestResult {
  sku: string;
  horizon_days: number;
  n_splits: number;
  summary: Record<string, {
    mean_mae: number;
    mean_rmse: number;
    mean_wape_pct: number;
    mean_bias: number;
    mean_lift_pct: number;
  }>;
  folds: {
    fold: number;
    origin_date: string;
    test_start_date: string;
    test_end_date: string;
    actuals: number[];
    predictions: Record<string, number[]>;
  }[];
}

export interface AIBriefing {
  sku?: string;
  narrative: string;
  ai_generated: boolean;
  model_provenance: string;
  confidence_level: number;
  methodology: string;
}

export interface ImportPreviewResult {
  total_raw_rows: number;
  valid_rows: number;
  return_rows_detected: number;
  admin_rows_filtered: number;
  skus_detected: number;
  date_range_start: string;
  date_range_end: string;
  preview_rows: Record<string, unknown>[];
  validation_status: "valid" | "warnings" | "invalid";
  messages: string[];
  detected_columns?: Record<string, string>;
}

// Client helper functions
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Accept": "application/json",
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API error [${res.status}]: ${err}`);
    }
    return await res.json() as T;
  } catch (error) {
    console.warn(`[Mercato API] Fetch failed for ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  getProducts: (category?: string) =>
    apiFetch<Product[]>(`/data/products${category ? `?category=${encodeURIComponent(category)}` : ""}`),

  seedBenchmark: () =>
    apiFetch<{ status: string; message: string; transactions_loaded: number }>(`/data/seed`, {
      method: "POST",
    }),

  getExecutiveOverview: () =>
    apiFetch<ExecutiveOverview>(`/analytics/overview`),

  getProductAnalytics: () =>
    apiFetch<ProductAnalytics[]>(`/analytics/products`),

  getForecast: (sku: string, horizonDays: number = 7) =>
    apiFetch<ForecastResponse>(`/forecast/${encodeURIComponent(sku)}?horizon_days=${horizonDays}`),

  generateForecast: (sku: string, modelName: string, horizonDays: number = 7) =>
    apiFetch<ForecastResponse>(`/forecast/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku, model_name: modelName, horizon_days: horizonDays }),
    }),

  compareModels: (sku: string, horizonDays: number = 7) =>
    apiFetch<{ sku: string; horizon_days: number; comparison: ModelBenchmarkItem[] }>(
      `/forecast/compare/${encodeURIComponent(sku)}?horizon_days=${horizonDays}`
    ),

  getInventoryStatus: () =>
    apiFetch<InventoryItem[]>(`/inventory/status`),

  updateInventoryItem: (item: {
    sku: string;
    current_stock: number;
    lead_time_days?: number;
    safety_stock_factor?: number;
    warehouse_location?: string;
  }) =>
    apiFetch<InventoryItem>(`/inventory/item`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    }),

  createPurchaseOrder: (items: { sku: string; quantity: number }[], notes?: string) =>
    apiFetch<{
      po_number: string;
      status: string;
      total_units: number;
      total_cost: number;
      currency: string;
      items: Record<string, unknown>[];
    }>(`/inventory/purchase-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, supplier_notes: notes }),
    }),

  getModelLeaderboard: (sku?: string) =>
    apiFetch<{
      sku: string;
      evaluation_period: string;
      leaderboard: ModelBenchmarkItem[];
    }>(`/models/leaderboard${sku ? `?sku=${encodeURIComponent(sku)}` : ""}`),

  runBacktest: (sku: string, nSplits: number = 3) =>
    apiFetch<BacktestResult>(`/models/backtest?sku=${encodeURIComponent(sku)}&n_splits=${nSplits}`, {
      method: "POST",
    }),

  getAIBriefing: (sku?: string) =>
    apiFetch<AIBriefing>(`/ai/briefing${sku ? `?sku=${encodeURIComponent(sku)}` : ""}`),

  previewCsv: (formData: FormData) =>
    apiFetch<ImportPreviewResult>(`/data/preview`, {
      method: "POST",
      body: formData,
    }),

  importCsv: (formData: FormData) =>
    apiFetch<{ status: string; imported_transactions: number; products_configured: number }>(`/data/import`, {
      method: "POST",
      body: formData,
    }),

  getPdfReportUrl: () => `${API_BASE_URL}/reports/pdf/sales-forecast`,
  getForecastCsvUrl: (sku: string) => `${API_BASE_URL}/reports/csv/forecast?sku=${encodeURIComponent(sku)}`,
  getSampleCsvUrl: () => `${API_BASE_URL}/data/sample-csv`,
  getPoPdfUrl: (poNumber: string) => `${API_BASE_URL}/reports/pdf/purchase-order/${encodeURIComponent(poNumber)}`,

  getPurchaseOrders: () =>
    apiFetch<PurchaseOrder[]>(`/inventory/purchase-orders`),

  dispatchPurchaseOrder: (poNumber: string) =>
    apiFetch<PurchaseOrder & { mailto_url: string; procurement_letter: string }>(
      `/inventory/purchase-order/${encodeURIComponent(poNumber)}/dispatch`,
      { method: "POST" }
    ),

  receivePurchaseOrder: (poNumber: string, actualLeadTimeDays: number = 14) =>
    apiFetch<PurchaseOrder>(
      `/inventory/purchase-order/${encodeURIComponent(poNumber)}/receive?actual_lead_time_days=${actualLeadTimeDays}`,
      { method: "POST" }
    ),

  getPromotions: () =>
    apiFetch<PromotionEvent[]>(`/promotions`),

  createPromotion: (promo: {
    name: string;
    start_date: string;
    end_date: string;
    discount_pct: number;
    expected_lift_factor: number;
    sku_scope?: string;
  }) =>
    apiFetch<PromotionEvent>(`/promotions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(promo),
    }),

  deletePromotion: (id: number) =>
    apiFetch<{ status: string; message: string }>(`/promotions/${id}`, {
      method: "DELETE",
    }),

  getPromotionalCalendar: () =>
    apiFetch<{ today: string; total_events: number; events: CalendarEvent[] }>(`/promotions/calendar`),
};
