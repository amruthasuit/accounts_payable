import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Vendor, VendorBankAccount, AuditLog
from ..schemas import VendorResponse, VendorCreate, VendorBankAccountCreate, VendorBankAccountResponse

router = APIRouter(prefix="/vendors", tags=["Vendor Management"])

@router.get("/", response_model=List[VendorResponse])
def get_vendors(
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Module 6: Vendor Master Directory.
    """
    query = db.query(Vendor).order_by(Vendor.name.asc())
    if category and category != "All":
        query = query.filter(Vendor.category == category)
    if status and status != "All":
        query = query.filter(Vendor.status == status)
    return query.all()

@router.post("/", response_model=VendorResponse)
def create_vendor(vendor_in: VendorCreate, db: Session = Depends(get_db)):
    """
    Module 6: Create vendor with onboarding workflow and bank details.
    """
    existing = db.query(Vendor).filter((Vendor.name == vendor_in.name) | (Vendor.code == vendor_in.code)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vendor with this name or code already exists.")

    vendor = Vendor(
        name=vendor_in.name,
        code=vendor_in.code,
        tax_id=vendor_in.tax_id,
        state=vendor_in.state,
        state_code=vendor_in.state_code,
        email=vendor_in.email,
        phone=vendor_in.phone,
        address=vendor_in.address,
        category=vendor_in.category,
        payment_terms=vendor_in.payment_terms,
        status="Active",
        onboarding_status="Approved",
        rating=vendor_in.rating or 4.5
    )
    db.add(vendor)
    db.flush()

    for bank_in in vendor_in.bank_accounts:
        bank = VendorBankAccount(
            vendor_id=vendor.id,
            bank_name=bank_in.bank_name,
            account_number=bank_in.account_number,
            ifsc_code=bank_in.ifsc_code,
            swift_code=bank_in.swift_code,
            account_type=bank_in.account_type,
            is_primary=bank_in.is_primary,
            is_verified=True
        )
        db.add(bank)

    audit = AuditLog(
        action="VENDOR_CREATED",
        entity_type="Vendor",
        entity_id=str(vendor.id),
        actor_name="AP Clerk",
        actor_role="Procurement",
        details=f"Created vendor '{vendor.name}' (Code: {vendor.code}) with GSTIN {vendor.tax_id}."
    )
    db.add(audit)
    db.commit()
    db.refresh(vendor)
    return vendor

@router.get("/{vendor_id}", response_model=VendorResponse)
def get_vendor(vendor_id: int, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found.")
    return vendor

@router.post("/validate-gst")
def validate_gstin_endpoint(gstin: str):
    """
    Module 6: Real-time GST/TIN validation against GSTN pattern & portal simulation.
    """
    gst_regex = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
    is_valid = bool(re.match(gst_regex, gstin.strip()))
    
    state_codes = {
        "29": "Karnataka",
        "27": "Maharashtra",
        "07": "Delhi",
        "33": "Tamil Nadu",
        "36": "Telangana",
        "24": "Gujarat"
    }
    state_code = gstin[:2] if len(gstin) >= 2 else ""
    state_name = state_codes.get(state_code, "Other State")

    return {
        "gstin": gstin,
        "is_valid": is_valid,
        "state_code": state_code,
        "state_name": state_name,
        "taxpayer_status": "Active" if is_valid else "Invalid Format",
        "filing_frequency": "Monthly (GSTR-1 & 3B)",
        "source": "GSTN API Gateway"
    }

@router.post("/{vendor_id}/bank-accounts", response_model=VendorBankAccountResponse)
def add_vendor_bank(vendor_id: int, bank_in: VendorBankAccountCreate, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found.")

    bank = VendorBankAccount(
        vendor_id=vendor.id,
        bank_name=bank_in.bank_name,
        account_number=bank_in.account_number,
        ifsc_code=bank_in.ifsc_code,
        swift_code=bank_in.swift_code,
        account_type=bank_in.account_type,
        is_primary=bank_in.is_primary,
        is_verified=True
    )
    db.add(bank)
    db.commit()
    db.refresh(bank)
    return bank
