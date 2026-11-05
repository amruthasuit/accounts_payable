from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Invoice
from ..schemas import POMatchResultResponse, MatchRunRequest
from ..services.matching_service import MatchingService
from ..services.workflow_service import WorkflowService

router = APIRouter(prefix="/matching", tags=["PO Matching"])

@router.post("/run/{invoice_id}", response_model=POMatchResultResponse)
def run_po_matching(
    invoice_id: int, 
    request: MatchRunRequest = MatchRunRequest(),
    db: Session = Depends(get_db)
):
    """
    Module 4: 2-Way and 3-Way PO Matching Engine.
    - 2-Way: PO vs Invoice (Price, Quantity, Total Amount with tolerance)
    - 3-Way: PO vs GRN vs Invoice (Billed <= Received <= Ordered)
    Automatically transitions invoice to approval queue if matched.
    """
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found.")

    match_result = MatchingService.run_matching(
        db=db,
        invoice=invoice,
        force_type=request.force_match_type,
        tolerance_percent=request.tolerance_percent
    )

    # If matched successfully, automatically initiate approval workflow
    if match_result.status == "Matched" and match_result.within_tolerance:
        WorkflowService.initialize_approval_workflow(db, invoice)

    return match_result

@router.get("/{invoice_id}", response_model=Optional[POMatchResultResponse])
def get_match_result(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    
    if invoice.match_results:
        return invoice.match_results[-1]
    return None
