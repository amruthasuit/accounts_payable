from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any, Dict
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: str
    name: str
    role: str
    department: Optional[str] = "Finance"
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Bank Account Schemas
class VendorBankAccountBase(BaseModel):
    bank_name: str
    account_number: str
    ifsc_code: str
    swift_code: Optional[str] = None
    account_type: Optional[str] = "Current"
    is_primary: Optional[bool] = True
    is_verified: Optional[bool] = True

class VendorBankAccountCreate(VendorBankAccountBase):
    pass

class VendorBankAccountResponse(VendorBankAccountBase):
    id: int
    vendor_id: int
    class Config:
        from_attributes = True

# Vendor Schemas
class VendorBase(BaseModel):
    name: str
    code: str
    tax_id: Optional[str] = None
    state: Optional[str] = "Karnataka"
    state_code: Optional[str] = "29"
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    category: Optional[str] = "Services"
    payment_terms: Optional[str] = "Net 30"
    status: Optional[str] = "Active"
    onboarding_status: Optional[str] = "Approved"
    rating: Optional[float] = 4.5

class VendorCreate(VendorBase):
    bank_accounts: Optional[List[VendorBankAccountCreate]] = []

class VendorResponse(VendorBase):
    id: int
    created_at: datetime
    bank_accounts: List[VendorBankAccountResponse] = []
    class Config:
        from_attributes = True

# Purchase Order Schemas
class PurchaseOrderLineBase(BaseModel):
    line_number: int
    item_description: str
    hsn_code: Optional[str] = None
    quantity: float
    unit_price: float
    tax_rate: Optional[float] = 18.0
    tax_amount: Optional[float] = 0.0
    total_amount: Optional[float] = 0.0
    received_qty: Optional[float] = 0.0
    invoiced_qty: Optional[float] = 0.0

class PurchaseOrderLineCreate(PurchaseOrderLineBase):
    pass

class PurchaseOrderLineResponse(PurchaseOrderLineBase):
    id: int
    po_id: int
    class Config:
        from_attributes = True

class PurchaseOrderBase(BaseModel):
    po_number: str
    vendor_id: int
    issue_date: Optional[datetime] = None
    status: Optional[str] = "Open"
    department: Optional[str] = "IT"
    currency: Optional[str] = "INR"
    subtotal: Optional[float] = 0.0
    tax_amount: Optional[float] = 0.0
    total_amount: Optional[float] = 0.0

class PurchaseOrderCreate(PurchaseOrderBase):
    lines: List[PurchaseOrderLineCreate]

class PurchaseOrderResponse(PurchaseOrderBase):
    id: int
    created_at: datetime
    lines: List[PurchaseOrderLineResponse] = []
    vendor: Optional[VendorResponse] = None
    class Config:
        from_attributes = True

# GRN Schemas
class GRNLineResponse(BaseModel):
    id: int
    grn_id: int
    po_line_id: Optional[int]
    item_description: Optional[str]
    quantity_received: float
    quantity_accepted: float
    quantity_rejected: float
    remarks: Optional[str]
    class Config:
        from_attributes = True

class GRNResponse(BaseModel):
    id: int
    grn_number: str
    po_id: int
    vendor_id: int
    receipt_date: datetime
    received_by: str
    status: str
    notes: Optional[str]
    lines: List[GRNLineResponse] = []
    class Config:
        from_attributes = True

# Invoice Line Items
class InvoiceLineItemBase(BaseModel):
    line_number: int
    description: str
    hsn_code: Optional[str] = None
    quantity: float
    unit: Optional[str] = "PCS"
    unit_price: float
    tax_rate: Optional[float] = 18.0
    tax_amount: Optional[float] = 0.0
    total_amount: Optional[float] = 0.0
    confidence: Optional[float] = 95.0

class InvoiceLineItemCreate(InvoiceLineItemBase):
    pass

class InvoiceLineItemResponse(InvoiceLineItemBase):
    id: int
    invoice_id: int
    class Config:
        from_attributes = True

# Invoice Schemas
class InvoiceBase(BaseModel):
    invoice_number: Optional[str] = None
    vendor_id: Optional[int] = None
    vendor_name_raw: Optional[str] = None
    vendor_gstin_raw: Optional[str] = None
    customer_gstin_raw: Optional[str] = None
    po_number_raw: Optional[str] = None
    invoice_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    currency: Optional[str] = "INR"
    payment_terms: Optional[str] = "Net 30"
    department: Optional[str] = "General"
    subtotal: Optional[float] = 0.0
    cgst_amount: Optional[float] = 0.0
    sgst_amount: Optional[float] = 0.0
    igst_amount: Optional[float] = 0.0
    tax_amount: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    round_off: Optional[float] = 0.0
    total_amount: Optional[float] = 0.0

class InvoiceUpdate(InvoiceBase):
    line_items: Optional[List[InvoiceLineItemBase]] = None

class ValidationResultResponse(BaseModel):
    id: int
    rule_code: str
    rule_name: str
    status: str
    severity: str
    message: str
    details_json: Optional[Any] = None
    created_at: datetime
    class Config:
        from_attributes = True

class POMatchResultResponse(BaseModel):
    id: int
    match_type: str
    status: str
    variance_amount: float
    tolerance_applied: float
    within_tolerance: bool
    details_json: Optional[Any] = None
    created_at: datetime
    class Config:
        from_attributes = True

class ApprovalTaskResponse(BaseModel):
    id: int
    step_number: int
    assigned_role: str
    assigned_user_id: Optional[int]
    status: str
    comments: Optional[str]
    reminders_sent: int
    created_at: datetime
    actioned_at: Optional[datetime]
    actioned_by: Optional[str]
    class Config:
        from_attributes = True

class InvoiceResponse(InvoiceBase):
    id: int
    source: str
    file_name: Optional[str]
    file_path: Optional[str]
    file_type: Optional[str]
    ocr_accuracy_score: float
    extraction_confidence: float
    status: str
    match_status: str
    current_approval_step: int
    assigned_to_role: str
    is_escalated: bool
    escalation_reason: Optional[str]
    rejection_reason: Optional[str]
    erp_sync_status: str
    erp_reference: Optional[str]
    created_at: datetime
    updated_at: datetime
    vendor: Optional[VendorResponse] = None
    line_items: List[InvoiceLineItemResponse] = []
    validations: List[ValidationResultResponse] = []
    match_results: List[POMatchResultResponse] = []
    approval_tasks: List[ApprovalTaskResponse] = []
    class Config:
        from_attributes = True

# Approval Matrix
class ApprovalMatrixBase(BaseModel):
    min_amount: float
    max_amount: float
    department: Optional[str] = "All"
    required_role: str
    step_number: Optional[int] = 1
    sla_hours: Optional[int] = 24
    is_active: Optional[bool] = True

class ApprovalMatrixCreate(ApprovalMatrixBase):
    pass

class ApprovalMatrixResponse(ApprovalMatrixBase):
    id: int
    class Config:
        from_attributes = True

# Actions
class ApprovalActionRequest(BaseModel):
    action: str  # APPROVE, REJECT, ESCALATE, DELEGATE
    comments: Optional[str] = ""
    actor_name: Optional[str] = "Current User"
    actor_role: Optional[str] = "Approver"

class MatchRunRequest(BaseModel):
    tolerance_percent: Optional[float] = 2.0
    force_match_type: Optional[str] = None  # "2-Way" or "3-Way"

# Payments
class PaymentBatchCreate(BaseModel):
    invoice_ids: List[int]
    bank_name: Optional[str] = "HDFC Bank Corporate Direct"
    format_type: Optional[str] = "NEFT_RTGS_CSV"

class PaymentTransactionResponse(BaseModel):
    id: int
    batch_id: Optional[int]
    invoice_id: int
    vendor_id: int
    amount: float
    payment_method: str
    utr_number: Optional[str]
    status: str
    payment_advice_path: Optional[str]
    processed_at: Optional[datetime]
    failure_reason: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

class PaymentBatchResponse(BaseModel):
    id: int
    batch_reference: str
    total_amount: float
    invoice_count: int
    format_type: str
    status: str
    bank_name: str
    file_path: Optional[str]
    created_at: datetime
    processed_at: Optional[datetime]
    transactions: List[PaymentTransactionResponse] = []
    class Config:
        from_attributes = True

# Audit Log
class AuditLogResponse(BaseModel):
    id: int
    action: str
    entity_type: str
    entity_id: Optional[str]
    actor_name: str
    actor_role: str
    details: Optional[str]
    ip_address: str
    timestamp: datetime
    class Config:
        from_attributes = True

# ERP Sync
class ERPSyncRequest(BaseModel):
    target_system: Optional[str] = "Tally Prime"  # SAP, Tally Prime, Zoho Books, QuickBooks
    invoice_ids: Optional[List[int]] = None

class ERPSyncResponse(BaseModel):
    status: str
    message: str
    target_system: str
    synced_invoices: int
    export_payload: Optional[Any] = None
