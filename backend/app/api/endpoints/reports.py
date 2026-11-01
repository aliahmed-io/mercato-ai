import io
import csv
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from backend.app.db.session import get_db
from backend.app.db.models import Product, DailySales, ForecastRun, ForecastPoint, utc_now
from backend.app.inventory.service import InventoryIntelligenceService

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/csv/forecast")
def export_forecast_csv(sku: str = Query(...), db: Session = Depends(get_db)):
    """Exports forecast points and prediction interval bands as downloadable CSV."""
    latest_run = (
        db.query(ForecastRun)
        .filter(ForecastRun.sku == sku)
        .order_by(ForecastRun.created_at.desc())
        .first()
    )
    if not latest_run:
        raise HTTPException(status_code=404, detail=f"No forecast found for SKU {sku}")

    points = (
        db.query(ForecastPoint)
        .filter(ForecastPoint.forecast_run_id == latest_run.id)
        .order_by(ForecastPoint.target_date.asc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "TargetDate", "SKU", "Model", "PredictedQuantity",
        "LowerBound80", "UpperBound80", "LowerBound95", "UpperBound95"
    ])

    for p in points:
        writer.writerow([
            p.target_date.strftime("%Y-%m-%d"),
            p.sku,
            latest_run.model_name,
            p.predicted_quantity,
            p.lower_bound_80,
            p.upper_bound_80,
            p.lower_bound_95,
            p.upper_bound_95
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=mercato_forecast_{sku}.csv"}
    )

@router.get("/pdf/sales-forecast")
def generate_pdf_report(db: Session = Depends(get_db)):
    """Generates an executive PDF sales forecast and inventory intelligence report."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom Mercato brand styles
    primary_emerald = colors.HexColor("#126B54")
    dark_ink = colors.HexColor("#172B24")
    warm_ivory = colors.HexColor("#F7F7F0")
    soft_gold = colors.HexColor("#E7AD61")
    subtle_border = colors.HexColor("#E2E8F0")

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=primary_emerald,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=11,
        leading=14,
        textColor=dark_ink,
        spaceAfter=14
    )

    heading2_style = ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=primary_emerald,
        spaceBefore=14,
        spaceAfter=8
    )

    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=dark_ink
    )

    bold_cell_style = ParagraphStyle(
        "CellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=dark_ink
    )

    normal_cell_style = ParagraphStyle(
        "CellNormal",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=dark_ink
    )

    story = []

    # Title & Metadata
    story.append(Paragraph("MERCATO AI — Executive Demand & Inventory Report", title_style))
    story.append(Paragraph(
        f"Generated: {utc_now().strftime('%Y-%m-%d %H:%M UTC')} | Enterprise Demand Planning & Replenishment Audit",
        subtitle_style
    ))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_emerald, spaceAfter=14))

    # Executive Overview
    service = InventoryIntelligenceService(db)
    inv_items = service.get_all_inventory_status()
    critical_items = [i for i in inv_items if i["risk_status"] == "CRITICAL"]
    reorder_items = [i for i in inv_items if i["risk_status"] == "REORDER_NOW"]

    story.append(Paragraph("1. Executive Briefing & Inventory Risk Status", heading2_style))
    story.append(Paragraph(
        f"This report presents machine-learning demand forecasts and inventory replenishment recommendations for retail operations. "
        f"Currently, <b>{len(critical_items)} SKUs</b> have stock levels below lead-time demand requiring immediate PO issuance, "
        f"and <b>{len(reorder_items)} SKUs</b> have breached safety reorder thresholds.",
        body_style
    ))
    story.append(Spacer(1, 10))

    # Inventory Table
    table_data = [
        [
            Paragraph("SKU", bold_cell_style),
            Paragraph("Product Name", bold_cell_style),
            Paragraph("Stock", bold_cell_style),
            Paragraph("Lead Time", bold_cell_style),
            Paragraph("LT Demand", bold_cell_style),
            Paragraph("Safety Stock", bold_cell_style),
            Paragraph("ROP", bold_cell_style),
            Paragraph("Status", bold_cell_style),
            Paragraph("Suggested Order", bold_cell_style),
        ]
    ]

    for item in inv_items[:8]:
        table_data.append([
            Paragraph(item["sku"], normal_cell_style),
            Paragraph(item["product_name"][:24], normal_cell_style),
            Paragraph(str(item["current_stock"]), normal_cell_style),
            Paragraph(f"{item['lead_time_days']}d", normal_cell_style),
            Paragraph(f"{item['lead_time_demand']:.0f}", normal_cell_style),
            Paragraph(f"{item['safety_stock']:.0f}", normal_cell_style),
            Paragraph(f"{item['reorder_point']:.0f}", normal_cell_style),
            Paragraph(item["status_badge"], bold_cell_style),
            Paragraph(f"{item['suggested_reorder_qty']} units", bold_cell_style),
        ])

    t = Table(table_data, colWidths=[55, 120, 38, 48, 48, 52, 42, 65, 65])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), warm_ivory),
        ("GRID", (0, 0), (-1, -1), 0.5, subtle_border),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t)
    story.append(Spacer(1, 14))

    # Methodological Rigor & Audit
    story.append(Paragraph("2. Forecasting Methodology & Time-Series Governance", heading2_style))
    method_text = (
        "<b>Time-Series Guarantees:</b> Multi-step forecasts are computed using strictly backward-looking recursive features "
        "(lags 1, 2, 3, 7, 14, 21, 28 and 7/14/28-day rolling statistics with lag 1 shift). No future ground truth was leaked into "
        "training or lag updates. Models are validated chronologically using rolling-origin backtesting against seasonal naive baselines."
    )
    story.append(Paragraph(method_text, body_style))
    story.append(Spacer(1, 14))

    # Build PDF
    doc.build(story)
    buffer.seek(0)

    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=mercato_executive_report.pdf"}
    )

@router.get("/pdf/purchase-order/{po_number}")
def generate_purchase_order_pdf(po_number: str, db: Session = Depends(get_db)):
    """Generates official vendor-facing Purchase Order PDF document."""
    service = InventoryIntelligenceService(db)
    po = service.get_purchase_order_by_number(po_number)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found.")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    primary_emerald = colors.HexColor("#126B54")
    dark_ink = colors.HexColor("#172B24")
    sage = colors.HexColor("#A6CDB9")
    warm_ivory = colors.HexColor("#F7F7F0")
    subtle_border = colors.HexColor("#E5E5DC")

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "POTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=primary_emerald
    )
    meta_style = ParagraphStyle(
        "POMeta",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=dark_ink
    )
    bold_cell_style = ParagraphStyle(
        "POCellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=dark_ink
    )
    normal_cell_style = ParagraphStyle(
        "POCellNormal",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=dark_ink
    )

    story = []
    story.append(Paragraph(f"MERCATO AI — Official Purchase Order: {po['po_number']}", title_style))
    story.append(Paragraph(
        f"Status: <b>{po['status']}</b> | Created: {po['created_at']} | Warehouse: {po['warehouse_location']}",
        meta_style
    ))
    story.append(Paragraph(
        f"Supplier: <b>{po['supplier_name']}</b> ({po['supplier_email']})",
        meta_style
    ))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_emerald, spaceAfter=14))

    table_data = [
        [
            Paragraph("SKU", bold_cell_style),
            Paragraph("Product Name", bold_cell_style),
            Paragraph("Quantity", bold_cell_style),
            Paragraph("Unit Cost", bold_cell_style),
            Paragraph("Line Total", bold_cell_style),
        ]
    ]

    for item in po["items"]:
        table_data.append([
            Paragraph(item["sku"], normal_cell_style),
            Paragraph(item["product_name"], normal_cell_style),
            Paragraph(f"{item['quantity']:,} units", bold_cell_style),
            Paragraph(f"€{item['unit_cost']:.2f}", normal_cell_style),
            Paragraph(f"€{item['total_cost']:,.2f}", bold_cell_style),
        ])

    table_data.append([
        Paragraph("<b>GRAND TOTAL</b>", bold_cell_style),
        Paragraph("", normal_cell_style),
        Paragraph(f"<b>{po['total_units']:,} units</b>", bold_cell_style),
        Paragraph("", normal_cell_style),
        Paragraph(f"<b>€{po['total_cost']:,.2f}</b>", bold_cell_style),
    ])

    t = Table(table_data, colWidths=[90, 230, 75, 75, 70])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), warm_ivory),
        ("GRID", (0, 0), (-1, -1), 0.5, subtle_border),
        ("BACKGROUND", (0, -1), (-1, -1), warm_ivory),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t)
    story.append(Spacer(1, 14))

    story.append(Paragraph("<b>Procurement & Fulfillment Instructions:</b>", meta_style))
    instructions = (
        f"1. Please deliver all merchandise to {po['warehouse_location']} dock receiving.<br/>"
        f"2. Reference order number <b>{po['po_number']}</b> on bill of lading.<br/>"
        f"3. Notes: {po.get('notes') or 'Standard delivery schedule applies.'}<br/>"
        f"4. Payment terms: Net 30 upon verified warehouse receipt."
    )
    story.append(Paragraph(instructions, normal_cell_style))

    doc.build(story)
    buffer.seek(0)
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={po['po_number']}.pdf"}
    )

