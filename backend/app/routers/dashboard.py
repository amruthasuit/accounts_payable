from datetime import datetime, timedelta
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import Invoice, Vendor, PaymentBatch, PaymentTransaction

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/metrics")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """
    Module 8: Executive AP Metrics Summary.
    """
    total_invoices = db.query(func.count(Invoice.id)).scalar() or 0
    total_spend = db.query(func.sum(Invoice.total_amount)).scalar() or 0.0
    
    pending_approvals = db.query(Invoice).filter(
        Invoice.status.in_(["Pending Approval", "Escalated"])
    ).count()
    pending_approval_amount = db.query(func.sum(Invoice.total_amount)).filter(
        Invoice.status.in_(["Pending Approval", "Escalated"])
    ).scalar() or 0.0

    paid_invoices = db.query(Invoice).filter(Invoice.status == "Paid").count()
    paid_amount = db.query(func.sum(Invoice.total_amount)).filter(Invoice.status == "Paid").scalar() or 0.0

    in_payment_amount = db.query(func.sum(Invoice.total_amount)).filter(
        Invoice.status.in_(["Approved", "In Payment"])
    ).scalar() or 0.0

    exceptions_count = db.query(Invoice).filter(
        Invoice.status.in_(["Validation Failed", "Match Exception", "Rejected"])
    ).count()

    avg_ocr_accuracy = db.query(func.avg(Invoice.ocr_accuracy_score)).scalar() or 96.5

    # Simulated average turnaround time (TAT in hours)
    avg_tat_hours = 14.8

    return {
        "total_invoices": total_invoices,
        "total_spend": round(total_spend, 2),
        "pending_approvals": pending_approvals,
        "pending_approval_amount": round(pending_approval_amount, 2),
        "paid_invoices": paid_invoices,
        "paid_amount": round(paid_amount, 2),
        "in_payment_amount": round(in_payment_amount, 2),
        "exceptions_count": exceptions_count,
        "ocr_accuracy_percentage": round(avg_ocr_accuracy, 1),
        "avg_tat_hours": avg_tat_hours
    }

@router.get("/aging")
def get_invoice_aging(db: Session = Depends(get_db)):
    """
    Module 8: AP Aging Breakdown (0-30, 31-60, 61-90, 90+ days).
    """
    now = datetime.utcnow()
    invoices = db.query(Invoice).filter(Invoice.status != "Paid").all()

    buckets = {
        "0-30 Days": {"count": 0, "amount": 0.0},
        "31-60 Days": {"count": 0, "amount": 0.0},
        "61-90 Days": {"count": 0, "amount": 0.0},
        "90+ Days": {"count": 0, "amount": 0.0}
    }

    for inv in invoices:
        inv_date = inv.invoice_date or inv.created_at
        age_days = (now - inv_date).days if inv_date else 0
        amt = inv.total_amount or 0.0

        if age_days <= 30:
            buckets["0-30 Days"]["count"] += 1
            buckets["0-30 Days"]["amount"] += amt
        elif age_days <= 60:
            buckets["31-60 Days"]["count"] += 1
            buckets["31-60 Days"]["amount"] += amt
        elif age_days <= 90:
            buckets["61-90 Days"]["count"] += 1
            buckets["61-90 Days"]["amount"] += amt
        else:
            buckets["90+ Days"]["count"] += 1
            buckets["90+ Days"]["amount"] += amt

    return [
        {"bucket": k, "count": v["count"], "amount": round(v["amount"], 2)}
        for k, v in buckets.items()
    ]

@router.get("/vendor-analytics")
def get_vendor_analytics(db: Session = Depends(get_db)):
    """
    Module 8: Vendor-wise spend analytics and turnaround times.
    """
    vendors = db.query(Vendor).all()
    results = []

    for v in vendors:
        invs = db.query(Invoice).filter(Invoice.vendor_id == v.id).all()
        spend = sum(i.total_amount for i in invs)
        paid = sum(i.total_amount for i in invs if i.status == "Paid")
        avg_acc = (sum(i.ocr_accuracy_score for i in invs) / len(invs)) if invs else 95.0

        results.append({
            "vendor_id": v.id,
            "vendor_name": v.name,
            "category": v.category,
            "total_invoices": len(invs),
            "total_spend": round(spend, 2),
            "paid_amount": round(paid, 2),
            "ocr_accuracy": round(avg_acc, 1),
            "rating": v.rating
        })

    # Sort descending by spend
    results.sort(key=lambda x: x["total_spend"], reverse=True)
    return results

@router.get("/status-distribution")
def get_status_distribution(db: Session = Depends(get_db)):
    """
    Returns counts grouped by invoice status.
    """
    counts = db.query(Invoice.status, func.count(Invoice.id), func.sum(Invoice.total_amount)).group_by(Invoice.status).all()
    return [
        {"status": s, "count": c, "amount": round(a or 0.0, 2)}
        for s, c, a in counts
    ]
