from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Invoice
from ..schemas import ValidationResultResponse
from ..services.validation_service import ValidationService

router = APIRouter(prefix="/validation", tags=["Validation Engine"])

@router.post("/run/{invoice_id}", response_model=List[ValidationResultResponse])
def trigger_validation(invoice_id: int, db: Session = Depends(get_db)):
    """
    Module 3: Invoice Validation Engine
    Executes mandatory fields check, duplicate check, GST/tax rules,
    mathematical checks, and vendor master verification.
    """
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found.")

    all_passed, results = ValidationService.run_all_validations(db, invoice)
    db.refresh(invoice)
    return invoice.validations

@router.get("/rules")
def get_validation_rules():
    """
    Lists all active validation rules configured in the engine.
    """
    return [
        {
            "code": "MANDATORY_FIELDS",
            "name": "Mandatory Header & Line Fields",
            "severity": "Critical",
            "description": "Ensures invoice number, invoice date, vendor name, grand total, and at least one line item exist."
        },
        {
            "code": "DUPLICATE_CHECK",
            "name": "Duplicate Invoice Detection",
            "severity": "Critical",
            "description": "Flags identical invoice numbers from the same vendor to prevent double payment."
        },
        {
            "code": "GST_VALIDATION",
            "name": "GSTIN & Tax Breakdown Validation",
            "severity": "Critical",
            "description": "Verifies 15-character GSTIN format, interstate vs intrastate split (CGST+SGST vs IGST), and rate consistency."
        },
        {
            "code": "AMOUNT_MATH",
            "name": "Mathematical Reconciliation",
            "severity": "Critical",
            "description": "Verifies that subtotal + taxes - discounts equals grand total within ₹1.00 tolerance."
        },
        {
            "code": "VENDOR_MASTER",
            "name": "Vendor Master & Bank Verification",
            "severity": "Critical",
            "description": "Verifies vendor active status, onboarding approval, and existence of verified bank payout account."
        }
    ]
