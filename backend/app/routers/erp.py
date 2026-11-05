from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Invoice, ERPSyncLog
from ..schemas import ERPSyncRequest, ERPSyncResponse
from ..services.erp_service import ERPService

router = APIRouter(prefix="/erp", tags=["ERP / Accounting Integration"])

@router.post("/sync/{invoice_id}")
def sync_invoice(
    invoice_id: int,
    target_system: str = "Tally Prime",  # Tally Prime, SAP, Zoho Books, QuickBooks
    db: Session = Depends(get_db)
):
    """
    Synchronizes an approved invoice with ERP systems.
    Generates standard Tally XML, SAP BAPI, or Zoho Bills payloads.
    """
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found.")

    try:
        res = ERPService.sync_invoice_to_erp(db, invoice, target_system)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/logs")
def get_erp_logs(db: Session = Depends(get_db)):
    """
    Returns ERP synchronization audit logs and payloads.
    """
    logs = db.query(ERPSyncLog).order_by(ERPSyncLog.synced_at.desc()).limit(50).all()
    return [
        {
            "id": log.id,
            "invoice_id": log.invoice_id,
            "target_system": log.target_system,
            "sync_status": log.sync_status,
            "synced_at": log.synced_at.strftime("%Y-%m-%d %H:%M:%S"),
            "payload": log.payload_json,
            "response": log.response_details
        }
        for log in logs
    ]
