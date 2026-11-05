import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Invoice, InvoiceLineItem, AuditLog, Vendor
from ..schemas import InvoiceResponse, InvoiceUpdate
from ..services.ocr_service import OCRService
from ..services.validation_service import ValidationService
from ..config import settings

router = APIRouter(prefix="/invoices", tags=["Invoices"])

@router.post("/upload", response_model=List[InvoiceResponse])
async def upload_invoices(
    files: List[UploadFile] = File(...),
    source: str = Form("Upload"),  # Upload, DragDrop, Bulk
    db: Session = Depends(get_db)
):
    """
    Module 1 & 2: Multi-format invoice capture and automated OCR extraction.
    Supports PDF, JPG, PNG, TIFF. Handles single and bulk upload.
    """
    created_invoices = []

    for file in files:
        ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
        if ext not in ["pdf", "jpg", "jpeg", "png", "tiff", "tif"]:
            raise HTTPException(status_code=400, detail=f"Unsupported file format '.{ext}'. Supported: PDF, JPG, PNG, TIFF.")

        # Save to disk
        file_path = os.path.join(settings.INVOICE_UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = os.path.getsize(file_path)

        # Module 2: Run OCR & AI field extraction
        extracted = OCRService.extract_from_file(file_path, ext)

        # Match vendor if recognized
        matched_vendor = None
        if extracted.get("vendor_gstin"):
            matched_vendor = db.query(Vendor).filter(Vendor.tax_id == extracted["vendor_gstin"]).first()
        if not matched_vendor and extracted.get("vendor_name"):
            matched_vendor = db.query(Vendor).filter(Vendor.name.ilike(f"%{extracted['vendor_name']}%")).first()

        invoice = Invoice(
            invoice_number=extracted.get("invoice_number"),
            vendor_id=matched_vendor.id if matched_vendor else None,
            vendor_name_raw=extracted.get("vendor_name"),
            vendor_gstin_raw=extracted.get("vendor_gstin"),
            customer_gstin_raw=extracted.get("customer_gstin"),
            po_number_raw=extracted.get("po_number"),
            invoice_date=extracted.get("invoice_date"),
            due_date=extracted.get("due_date"),
            currency=extracted.get("currency", "INR"),
            payment_terms=extracted.get("payment_terms", "Net 30"),
            department=extracted.get("department", "General"),
            subtotal=extracted.get("subtotal", 0.0),
            cgst_amount=extracted.get("cgst_amount", 0.0),
            sgst_amount=extracted.get("sgst_amount", 0.0),
            igst_amount=extracted.get("igst_amount", 0.0),
            tax_amount=extracted.get("tax_amount", 0.0),
            discount_amount=extracted.get("discount_amount", 0.0),
            round_off=extracted.get("round_off", 0.0),
            total_amount=extracted.get("total_amount", 0.0),
            source=source,
            file_name=file.filename,
            file_path=f"/uploads/invoices/{file.filename}",
            file_type=ext.upper(),
            file_size=file_size,
            ocr_raw_text=extracted.get("ocr_raw_text", ""),
            ocr_accuracy_score=extracted.get("ocr_accuracy_score", 95.0),
            extraction_confidence=extracted.get("extraction_confidence", 94.0),
            status="Extracted",
            match_status="Not Matched"
        )
        db.add(invoice)
        db.flush()

        # Add line items
        for item in extracted.get("line_items", []):
            line_item = InvoiceLineItem(
                invoice_id=invoice.id,
                line_number=item.get("line_number", 1),
                description=item.get("description", "Material Item"),
                hsn_code=item.get("hsn_code"),
                quantity=item.get("quantity", 1.0),
                unit=item.get("unit", "PCS"),
                unit_price=item.get("unit_price", 0.0),
                tax_rate=item.get("tax_rate", 18.0),
                tax_amount=item.get("tax_amount", 0.0),
                total_amount=item.get("total_amount", 0.0),
                confidence=item.get("confidence", 95.0)
            )
            db.add(line_item)

        # Run automated validation immediately
        ValidationService.run_all_validations(db, invoice)

        # Audit Log
        audit = AuditLog(
            action="INVOICE_CAPTURED_AND_EXTRACTED",
            entity_type="Invoice",
            entity_id=str(invoice.id),
            actor_name="System Ingestion Engine",
            actor_role="Capture Module",
            details=f"Captured {file.filename} via {source}. OCR accuracy: {invoice.ocr_accuracy_score}%. Validation status: {invoice.status}."
        )
        db.add(audit)
        db.commit()
        db.refresh(invoice)
        created_invoices.append(invoice)

    return created_invoices

@router.post("/ingest-email", response_model=InvoiceResponse)
async def ingest_email_invoice(
    vendor_email: str = Query("billing@apexcloud.in"),
    subject: str = Query("Invoice INV-2026-9092 for Cloud Infrastructure Services"),
    db: Session = Depends(get_db)
):
    """
    Module 1: Email Ingestion Poller simulator.
    Ingests invoice PDF attachment from configured vendor email stream.
    """
    simulated_filename = f"Email_Attachment_INV_{os.urandom(2).hex().upper()}.pdf"
    file_path = os.path.join(settings.INVOICE_UPLOAD_DIR, simulated_filename)
    
    # Create mock attachment file
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(f"%PDF-1.4 Simulated Invoice Attachment from {vendor_email} subject: {subject}")

    extracted = OCRService.extract_from_file(file_path, "pdf")
    matched_vendor = db.query(Vendor).filter(Vendor.email == vendor_email).first()

    invoice = Invoice(
        invoice_number=f"INV-MAIL-{os.urandom(2).hex().upper()}",
        vendor_id=matched_vendor.id if matched_vendor else 1,
        vendor_name_raw=matched_vendor.name if matched_vendor else "Apex Cloud Technologies Pvt Ltd",
        vendor_gstin_raw=matched_vendor.tax_id if matched_vendor else "29AABCA1234F1Z5",
        customer_gstin_raw=settings.COMPANY_GSTIN,
        po_number_raw="PO-2026-101",
        invoice_date=extracted.get("invoice_date"),
        due_date=extracted.get("due_date"),
        currency="INR",
        subtotal=extracted.get("subtotal", 60000.0),
        cgst_amount=extracted.get("cgst_amount", 5400.0),
        sgst_amount=extracted.get("sgst_amount", 5400.0),
        igst_amount=extracted.get("igst_amount", 0.0),
        tax_amount=extracted.get("tax_amount", 10800.0),
        total_amount=extracted.get("total_amount", 70800.0),
        source="Email",
        file_name=simulated_filename,
        file_path=f"/uploads/invoices/{simulated_filename}",
        file_type="PDF",
        file_size=1024,
        ocr_accuracy_score=97.5,
        extraction_confidence=96.0,
        status="Extracted"
    )
    db.add(invoice)
    db.flush()

    for item in extracted.get("line_items", []):
        db.add(InvoiceLineItem(
            invoice_id=invoice.id,
            line_number=item.get("line_number", 1),
            description=item.get("description", "Cloud Services"),
            hsn_code=item.get("hsn_code", "998315"),
            quantity=item.get("quantity", 1.0),
            unit="PCS",
            unit_price=item.get("unit_price", 60000.0),
            tax_rate=18.0,
            tax_amount=item.get("tax_amount", 10800.0),
            total_amount=item.get("total_amount", 70800.0)
        ))

    ValidationService.run_all_validations(db, invoice)
    
    audit = AuditLog(
        action="EMAIL_INGESTION",
        entity_type="Invoice",
        entity_id=str(invoice.id),
        actor_name="IMAP Ingestion Worker",
        actor_role="Email Poller",
        details=f"Ingested invoice from {vendor_email}. Subject: '{subject}'."
    )
    db.add(audit)
    db.commit()
    db.refresh(invoice)
    return invoice

@router.get("/", response_model=List[InvoiceResponse])
def get_invoices(
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    List all invoices with optional status filter and keyword search.
    """
    query = db.query(Invoice).order_by(Invoice.created_at.desc())
    if status and status != "All":
        query = query.filter(Invoice.status == status)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Invoice.invoice_number.ilike(search_filter)) |
            (Invoice.vendor_name_raw.ilike(search_filter)) |
            (Invoice.po_number_raw.ilike(search_filter))
        )
    return query.offset(skip).limit(limit).all()

@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    return invoice

@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(invoice_id: int, update_data: InvoiceUpdate, db: Session = Depends(get_db)):
    """
    Side-by-side verification editor: update header fields and line items.
    Re-runs validation automatically after correction.
    """
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found.")

    update_dict = update_data.model_dump(exclude_unset=True, exclude={"line_items"})
    for key, value in update_dict.items():
        setattr(invoice, key, value)

    # If line items are provided, replace them
    if update_data.line_items is not None:
        db.query(InvoiceLineItem).filter(InvoiceLineItem.invoice_id == invoice.id).delete()
        for idx, item in enumerate(update_data.line_items):
            db.add(InvoiceLineItem(
                invoice_id=invoice.id,
                line_number=idx + 1,
                description=item.description,
                hsn_code=item.hsn_code,
                quantity=item.quantity,
                unit=item.unit,
                unit_price=item.unit_price,
                tax_rate=item.tax_rate,
                tax_amount=item.tax_amount,
                total_amount=item.total_amount,
                confidence=100.0  # Manually verified
            ))

    # Re-run validation
    ValidationService.run_all_validations(db, invoice)
    
    # Audit log
    audit = AuditLog(
        action="INVOICE_FIELDS_CORRECTED",
        entity_type="Invoice",
        entity_id=str(invoice.id),
        actor_name="AP Clerk",
        actor_role="Reviewer",
        details=f"Invoice #{invoice.invoice_number} manually corrected in side-by-side review."
    )
    db.add(audit)
    db.commit()
    db.refresh(invoice)
    return invoice

@router.delete("/{invoice_id}")
def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    db.delete(invoice)
    db.commit()
    return {"message": f"Invoice #{invoice_id} deleted successfully."}
