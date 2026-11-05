import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from .database import Base

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # Admin, AP Clerk, Approver, Finance Manager, Auditor
    description = Column(String(200))

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False, default="AP Clerk")
    department = Column(String(50), default="Finance")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, index=True, nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    tax_id = Column(String(50), index=True)  # GSTIN or PAN/TIN
    state = Column(String(50), default="Karnataka")
    state_code = Column(String(10), default="29")
    email = Column(String(100))
    phone = Column(String(30))
    address = Column(Text)
    category = Column(String(50), default="Services")  # Hardware, Software, Services, Logistics
    payment_terms = Column(String(30), default="Net 30")  # Net 15, Net 30, Net 60, Immediate
    status = Column(String(30), default="Active")  # Active, On Hold, Blacklisted
    onboarding_status = Column(String(30), default="Approved")  # Draft, Pending Review, Approved
    rating = Column(Float, default=4.5)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    bank_accounts = relationship("VendorBankAccount", back_populates="vendor", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="vendor")
    purchase_orders = relationship("PurchaseOrder", back_populates="vendor")

class VendorBankAccount(Base):
    __tablename__ = "vendor_bank_accounts"
    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    bank_name = Column(String(100), nullable=False)
    account_number = Column(String(50), nullable=False)
    ifsc_code = Column(String(20), nullable=False)
    swift_code = Column(String(20))
    account_type = Column(String(20), default="Current")  # Savings, Current
    is_primary = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=True)

    vendor = relationship("Vendor", back_populates="bank_accounts")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String(50), unique=True, index=True, nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    issue_date = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(30), default="Open")  # Open, Partially Received, Received, Invoiced, Closed
    department = Column(String(50), default="IT")
    currency = Column(String(10), default="INR")
    subtotal = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    vendor = relationship("Vendor", back_populates="purchase_orders")
    lines = relationship("PurchaseOrderLine", back_populates="purchase_order", cascade="all, delete-orphan")
    grns = relationship("GoodsReceiptNote", back_populates="purchase_order")

class PurchaseOrderLine(Base):
    __tablename__ = "po_lines"
    id = Column(Integer, primary_key=True, index=True)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    line_number = Column(Integer, nullable=False)
    item_description = Column(String(200), nullable=False)
    hsn_code = Column(String(20))
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float, default=0.0)
    tax_rate = Column(Float, default=18.0)
    tax_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    received_qty = Column(Float, default=0.0)
    invoiced_qty = Column(Float, default=0.0)

    purchase_order = relationship("PurchaseOrder", back_populates="lines")

class GoodsReceiptNote(Base):
    __tablename__ = "grn"
    id = Column(Integer, primary_key=True, index=True)
    grn_number = Column(String(50), unique=True, index=True, nullable=False)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    receipt_date = Column(DateTime, default=datetime.datetime.utcnow)
    received_by = Column(String(100), default="Warehouse Supervisor")
    status = Column(String(30), default="Accepted")  # Received, Accepted, Rejected, Discrepant
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    purchase_order = relationship("PurchaseOrder", back_populates="grns")
    lines = relationship("GoodsReceiptNoteLine", back_populates="grn", cascade="all, delete-orphan")

class GoodsReceiptNoteLine(Base):
    __tablename__ = "grn_lines"
    id = Column(Integer, primary_key=True, index=True)
    grn_id = Column(Integer, ForeignKey("grn.id"), nullable=False)
    po_line_id = Column(Integer, ForeignKey("po_lines.id"), nullable=True)
    item_description = Column(String(200))
    quantity_received = Column(Float, default=1.0)
    quantity_accepted = Column(Float, default=1.0)
    quantity_rejected = Column(Float, default=0.0)
    remarks = Column(String(200))

    grn = relationship("GoodsReceiptNote", back_populates="lines")

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(100), index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True)
    vendor_name_raw = Column(String(150))
    vendor_gstin_raw = Column(String(50))
    customer_gstin_raw = Column(String(50))
    po_number_raw = Column(String(50), index=True)
    
    invoice_date = Column(DateTime)
    due_date = Column(DateTime)
    currency = Column(String(10), default="INR")
    payment_terms = Column(String(30), default="Net 30")
    department = Column(String(50), default="General")

    # Financial breakdown
    subtotal = Column(Float, default=0.0)
    cgst_amount = Column(Float, default=0.0)
    sgst_amount = Column(Float, default=0.0)
    igst_amount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    round_off = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)

    # Ingestion & OCR metadata
    source = Column(String(30), default="Upload")  # Upload, DragDrop, Bulk, Email
    file_name = Column(String(255))
    file_path = Column(String(500))
    file_type = Column(String(20))
    file_size = Column(Integer, default=0)
    ocr_raw_text = Column(Text)
    ocr_accuracy_score = Column(Float, default=95.0)
    extraction_confidence = Column(Float, default=92.5)

    # Lifecycle state
    # States: Captured, Extracted, Validated, Validation Failed, Matched, Match Exception, 
    #         Pending Approval, Approved, Rejected, Escalated, In Payment, Paid, Synced
    status = Column(String(50), default="Captured", index=True)
    match_status = Column(String(50), default="Not Matched")  # Not Matched, 2-Way Matched, 3-Way Matched, Exception
    
    current_approval_step = Column(Integer, default=1)
    assigned_to_role = Column(String(50), default="AP Clerk")
    is_escalated = Column(Boolean, default=False)
    escalation_reason = Column(String(255))
    rejection_reason = Column(Text)

    erp_sync_status = Column(String(30), default="Pending")  # Pending, Synced, Failed
    erp_reference = Column(String(100))

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    vendor = relationship("Vendor", back_populates="invoices")
    line_items = relationship("InvoiceLineItem", back_populates="invoice", cascade="all, delete-orphan")
    validations = relationship("ValidationResult", back_populates="invoice", cascade="all, delete-orphan")
    match_results = relationship("POMatchResult", back_populates="invoice", cascade="all, delete-orphan")
    approval_tasks = relationship("ApprovalTask", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("PaymentTransaction", back_populates="invoice")

class InvoiceLineItem(Base):
    __tablename__ = "invoice_line_items"
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    line_number = Column(Integer, default=1)
    description = Column(String(255), nullable=False)
    hsn_code = Column(String(30))
    quantity = Column(Float, default=1.0)
    unit = Column(String(20), default="PCS")
    unit_price = Column(Float, default=0.0)
    tax_rate = Column(Float, default=18.0)
    tax_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    confidence = Column(Float, default=95.0)

    invoice = relationship("Invoice", back_populates="line_items")

class ValidationResult(Base):
    __tablename__ = "validation_results"
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    rule_code = Column(String(50), nullable=False)  # MANDATORY_FIELDS, DUPLICATE_CHECK, GST_VALIDATION, AMOUNT_MATH, VENDOR_MASTER
    rule_name = Column(String(100), nullable=False)
    status = Column(String(20), nullable=False)  # Passed, Warning, Failed
    severity = Column(String(20), default="Critical")  # Critical, Warning, Info
    message = Column(Text, nullable=False)
    details_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    invoice = relationship("Invoice", back_populates="validations")

class POMatchResult(Base):
    __tablename__ = "po_match_results"
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=True)
    grn_id = Column(Integer, ForeignKey("grn.id"), nullable=True)
    match_type = Column(String(20), default="2-Way")  # 2-Way, 3-Way
    status = Column(String(30), nullable=False)  # Matched, Price Variance, Quantity Variance, Missing Line, Missing GRN, Missing PO
    variance_amount = Column(Float, default=0.0)
    tolerance_applied = Column(Float, default=2.0)
    within_tolerance = Column(Boolean, default=True)
    details_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    invoice = relationship("Invoice", back_populates="match_results")

class ApprovalMatrix(Base):
    __tablename__ = "approval_matrix"
    id = Column(Integer, primary_key=True, index=True)
    min_amount = Column(Float, default=0.0)
    max_amount = Column(Float, default=10000000.0)
    department = Column(String(50), default="All")
    required_role = Column(String(50), nullable=False)  # AP Clerk, Dept Manager, Finance Director, CFO
    step_number = Column(Integer, default=1)
    sla_hours = Column(Integer, default=24)
    is_active = Column(Boolean, default=True)

class ApprovalTask(Base):
    __tablename__ = "approval_tasks"
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    step_number = Column(Integer, default=1)
    assigned_role = Column(String(50), nullable=False)
    assigned_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(30), default="Pending")  # Pending, Approved, Rejected, Escalated
    comments = Column(Text)
    reminders_sent = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    actioned_at = Column(DateTime)
    actioned_by = Column(String(100))

    invoice = relationship("Invoice", back_populates="approval_tasks")

class PaymentBatch(Base):
    __tablename__ = "payment_batches"
    id = Column(Integer, primary_key=True, index=True)
    batch_reference = Column(String(50), unique=True, index=True, nullable=False)
    total_amount = Column(Float, default=0.0)
    invoice_count = Column(Integer, default=0)
    format_type = Column(String(30), default="NEFT_RTGS_CSV")  # NEFT_RTGS_CSV, ISO20022_XML, UPI_BULK
    status = Column(String(30), default="Draft")  # Draft, Transmitted, Settled, Failed
    bank_name = Column(String(100), default="HDFC Bank Corporate Direct")
    file_path = Column(String(500))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    processed_at = Column(DateTime)

    transactions = relationship("PaymentTransaction", back_populates="batch")

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("payment_batches.id"), nullable=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(20), default="NEFT")  # NEFT, RTGS, UPI, IMPS
    utr_number = Column(String(50), index=True)
    status = Column(String(30), default="Pending")  # Pending, Processing, Settled, Failed
    payment_advice_path = Column(String(500))
    processed_at = Column(DateTime)
    failure_reason = Column(String(255))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    batch = relationship("PaymentBatch", back_populates="transactions")
    invoice = relationship("Invoice", back_populates="payments")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), nullable=False)  # INVOICE_UPLOAD, OCR_EXTRACT, VALIDATION_RUN, PO_MATCH, APPROVAL, PAYMENT_EXEC, ERP_SYNC
    entity_type = Column(String(50), default="Invoice")
    entity_id = Column(String(50))
    actor_name = Column(String(100), default="System")
    actor_role = Column(String(50), default="Automation Engine")
    details = Column(Text)
    ip_address = Column(String(50), default="127.0.0.1")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class ERPSyncLog(Base):
    __tablename__ = "erp_sync_logs"
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    target_system = Column(String(50), default="Tally Prime")  # SAP, Tally Prime, Zoho Books, QuickBooks
    sync_status = Column(String(30), default="Success")  # Success, Failed
    payload_json = Column(JSON)
    response_details = Column(Text)
    synced_at = Column(DateTime, default=datetime.datetime.utcnow)
