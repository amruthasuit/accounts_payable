import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import PaymentBatch, PaymentTransaction, Invoice
from ..schemas import PaymentBatchResponse, PaymentBatchCreate, PaymentTransactionResponse
from ..services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["Payment Processing"])

@router.get("/batches", response_model=List[PaymentBatchResponse])
def get_payment_batches(db: Session = Depends(get_db)):
    """
    Module 7: List all payment batches.
    """
    return db.query(PaymentBatch).order_by(PaymentBatch.created_at.desc()).all()

@router.post("/batches", response_model=PaymentBatchResponse)
def create_payment_batch(batch_in: PaymentBatchCreate, db: Session = Depends(get_db)):
    """
    Module 7: Create a payment batch for approved invoices.
    Generates banking payment file (NEFT/RTGS CSV).
    """
    try:
        batch = PaymentService.create_batch(
            db=db,
            invoice_ids=batch_in.invoice_ids,
            bank_name=batch_in.bank_name,
            format_type=batch_in.format_type
        )
        return batch
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/batches/{batch_id}/execute")
def execute_batch_payment(batch_id: int, db: Session = Depends(get_db)):
    """
    Module 7: Host-to-Host / Banking API direct payout settlement.
    Generates real bank UTRs and Remittance Advice.
    """
    try:
        result = PaymentService.execute_bank_transfer(db, batch_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/batches/{batch_id}/download-file")
def download_payment_file(batch_id: int, db: Session = Depends(get_db)):
    """
    Download generated bank payment format (NEFT/RTGS CSV).
    """
    batch = db.query(PaymentBatch).filter(PaymentBatch.id == batch_id).first()
    if not batch or not batch.file_path or not os.path.exists(batch.file_path):
        raise HTTPException(status_code=404, detail="Payment file not found.")
    return FileResponse(
        batch.file_path,
        media_type="text/csv",
        filename=os.path.basename(batch.file_path)
    )

@router.get("/advice/{transaction_id}")
def view_payment_advice(transaction_id: int, db: Session = Depends(get_db)):
    """
    Module 7: View or download generated Payment Advice (Remittance Advice).
    """
    tx = db.query(PaymentTransaction).filter(PaymentTransaction.id == transaction_id).first()
    if not tx or not tx.payment_advice_path or not os.path.exists(tx.payment_advice_path):
        raise HTTPException(status_code=404, detail="Payment advice document not available.")
    with open(tx.payment_advice_path, "r", encoding="utf-8") as f:
        html = f.read()
    return HTMLResponse(content=html)
