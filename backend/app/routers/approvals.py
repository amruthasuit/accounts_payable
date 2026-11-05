from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Invoice, ApprovalTask, ApprovalMatrix
from ..schemas import InvoiceResponse, ApprovalActionRequest, ApprovalMatrixResponse, ApprovalMatrixCreate
from ..services.workflow_service import WorkflowService

router = APIRouter(prefix="/approvals", tags=["Workflow & Approvals"])

@router.get("/inbox", response_model=List[InvoiceResponse])
def get_approvals_inbox(
    role: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Module 5: Role-based approval inbox.
    Returns invoices currently awaiting approval by the designated role.
    """
    query = db.query(Invoice).filter(
        Invoice.status.in_(["Pending Approval", "Escalated", "Match Exception"])
    )
    if role and role != "All" and role != "Admin":
        query = query.filter(Invoice.assigned_to_role == role)
        
    return query.order_by(Invoice.created_at.desc()).all()

@router.post("/{invoice_id}/action")
def take_approval_action(
    invoice_id: int,
    action_req: ApprovalActionRequest,
    db: Session = Depends(get_db)
):
    """
    Module 5: Approve, Reject, Escalate, or Send Reminder.
    Supports mobile / direct quick action token payload.
    """
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found.")

    result = WorkflowService.process_action(
        db=db,
        invoice=invoice,
        action=action_req.action,
        comments=action_req.comments,
        actor_name=action_req.actor_name,
        actor_role=action_req.actor_role
    )
    return result

@router.get("/matrix", response_model=List[ApprovalMatrixResponse])
def get_approval_matrix(db: Session = Depends(get_db)):
    """
    Returns configured tiered approval matrix rules.
    """
    return db.query(ApprovalMatrix).order_by(ApprovalMatrix.min_amount.asc()).all()

@router.post("/matrix", response_model=ApprovalMatrixResponse)
def add_approval_matrix_rule(rule: ApprovalMatrixCreate, db: Session = Depends(get_db)):
    matrix_rule = ApprovalMatrix(**rule.model_dump())
    db.add(matrix_rule)
    db.commit()
    db.refresh(matrix_rule)
    return matrix_rule
