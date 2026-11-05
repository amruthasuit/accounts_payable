from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Invoice, AuditLog, ValidationResult, POMatchResult, Vendor
from ..schemas import AuditLogResponse

router = APIRouter(prefix="/reports", tags=["Reports & Audit Logs"])

@router.get("/aging")
def get_ap_aging_report(db: Session = Depends(get_db)):
    """
    Module 9: Comprehensive AP Aging Report by Vendor.
    """
    now = datetime.utcnow()
    invoices = db.query(Invoice).filter(Invoice.status != "Paid").all()
    
    report_data = []
    for inv in invoices:
        inv_date = inv.invoice_date or inv.created_at
        due_date = inv.due_date or (inv_date)
        age_days = (now - inv_date).days if inv_date else 0
        overdue_days = (now - due_date).days if (due_date and now > due_date) else 0

        bucket = "0-30 Days"
        if age_days > 90:
            bucket = "90+ Days"
        elif age_days > 60:
            bucket = "61-90 Days"
        elif age_days > 30:
            bucket = "31-60 Days"

        report_data.append({
            "invoice_id": inv.id,
            "invoice_number": inv.invoice_number,
            "vendor_name": inv.vendor.name if inv.vendor else inv.vendor_name_raw,
            "invoice_date": inv.invoice_date.strftime("%Y-%m-%d") if inv.invoice_date else "N/A",
            "due_date": inv.due_date.strftime("%Y-%m-%d") if inv.due_date else "N/A",
            "age_days": age_days,
            "overdue_days": max(0, overdue_days),
            "aging_bucket": bucket,
            "total_amount": inv.total_amount,
            "status": inv.status
        })

    return report_data

@router.get("/status")
def get_invoice_status_report(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Module 9: Full lifecycle status tracking report.
    """
    query = db.query(Invoice).order_by(Invoice.created_at.desc())
    if status and status != "All":
        query = query.filter(Invoice.status == status)

    invoices = query.all()
    return [
        {
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "vendor": inv.vendor.name if inv.vendor else inv.vendor_name_raw,
            "source": inv.source,
            "total_amount": inv.total_amount,
            "status": inv.status,
            "match_status": inv.match_status,
            "assigned_to": inv.assigned_to_role,
            "ocr_accuracy": inv.ocr_accuracy_score,
            "created_at": inv.created_at.strftime("%Y-%m-%d %H:%M")
        }
        for inv in invoices
    ]

@router.get("/exceptions")
def get_exception_report(db: Session = Depends(get_db)):
    """
    Module 9: Exceptions Report (Validation failures, Price/Qty variances, Missing POs).
    """
    failed_invoices = db.query(Invoice).filter(
        Invoice.status.in_(["Validation Failed", "Match Exception", "Rejected"])
    ).all()

    exceptions = []
    for inv in failed_invoices:
        # Check validation errors
        for v in inv.validations:
            if v.status in ["Failed", "Warning"]:
                exceptions.append({
                    "invoice_id": inv.id,
                    "invoice_number": inv.invoice_number,
                    "vendor": inv.vendor.name if inv.vendor else inv.vendor_name_raw,
                    "category": "Validation",
                    "rule": v.rule_name,
                    "severity": v.severity,
                    "description": v.message,
                    "date": v.created_at.strftime("%Y-%m-%d %H:%M")
                })
        # Check match errors
        for m in inv.match_results:
            if not m.within_tolerance or "Variance" in m.status or "Missing" in m.status:
                exceptions.append({
                    "invoice_id": inv.id,
                    "invoice_number": inv.invoice_number,
                    "vendor": inv.vendor.name if inv.vendor else inv.vendor_name_raw,
                    "category": "Matching",
                    "rule": f"{m.match_type} Match Discrepancy",
                    "severity": "Critical",
                    "description": f"Status: {m.status}. Variance: ₹{m.variance_amount:,.2f} against PO.",
                    "date": m.created_at.strftime("%Y-%m-%d %H:%M")
                })

    return exceptions

@router.get("/audit", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Module 9: Immutable Audit Logs tracking all user and automated actions.
    """
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()

@router.get("/gst")
def get_gst_reports(db: Session = Depends(get_db)):
    """
    Module 9: GST Reconciliation & Input Tax Credit (ITC) Report.
    """
    invoices = db.query(Invoice).all()
    
    total_itc_available = 0.0
    cgst_total = 0.0
    sgst_total = 0.0
    igst_total = 0.0
    itc_ineligible = 0.0

    records = []
    for inv in invoices:
        has_valid_gst = bool(inv.vendor_gstin_raw and len(inv.vendor_gstin_raw) == 15)
        itc_status = "Eligible" if has_valid_gst else "Ineligible (Missing/Invalid GSTIN)"

        cgst_total += (inv.cgst_amount or 0.0)
        sgst_total += (inv.sgst_amount or 0.0)
        igst_total += (inv.igst_amount or 0.0)

        if has_valid_gst:
            total_itc_available += (inv.tax_amount or 0.0)
        else:
            itc_ineligible += (inv.tax_amount or 0.0)

        records.append({
            "invoice_number": inv.invoice_number,
            "vendor_name": inv.vendor.name if inv.vendor else inv.vendor_name_raw,
            "vendor_gstin": inv.vendor_gstin_raw or "Unregistered",
            "invoice_date": inv.invoice_date.strftime("%Y-%m-%d") if inv.invoice_date else "N/A",
            "taxable_value": inv.subtotal,
            "cgst": inv.cgst_amount,
            "sgst": inv.sgst_amount,
            "igst": inv.igst_amount,
            "total_tax": inv.tax_amount,
            "itc_status": itc_status
        })

    return {
        "summary": {
            "total_itc_available": round(total_itc_available, 2),
            "cgst_total": round(cgst_total, 2),
            "sgst_total": round(sgst_total, 2),
            "igst_total": round(igst_total, 2),
            "itc_ineligible": round(itc_ineligible, 2)
        },
        "records": records
    }
