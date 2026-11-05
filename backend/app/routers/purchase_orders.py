from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import PurchaseOrder, PurchaseOrderLine, GoodsReceiptNote, GoodsReceiptNoteLine
from ..schemas import PurchaseOrderResponse, PurchaseOrderCreate, GRNResponse

router = APIRouter(prefix="/po", tags=["Purchase Orders & GRN"])

@router.get("/", response_model=List[PurchaseOrderResponse])
def get_purchase_orders(db: Session = Depends(get_db)):
    """
    List all POs with line items and fulfillment status.
    """
    return db.query(PurchaseOrder).order_by(PurchaseOrder.issue_date.desc()).all()

@router.get("/{po_id}", response_model=PurchaseOrderResponse)
def get_purchase_order(po_id: int, db: Session = Depends(get_db)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found.")
    return po

@router.get("/grn/all", response_model=List[GRNResponse])
def get_all_grns(db: Session = Depends(get_db)):
    """
    List all Goods Receipt Notes (GRN).
    """
    return db.query(GoodsReceiptNote).order_by(GoodsReceiptNote.receipt_date.desc()).all()
