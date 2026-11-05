-- ============================================================================
-- ACCOUNTS PAYABLE (AP) AUTOMATION PLATFORM — POSTGRESQL PRODUCTION DDL
-- Platform: Templegate AP Ledger Suite
-- Database Engine: PostgreSQL 14+ / 16
-- GitHub Repository: https://github.com/sharath-444/accounts_payable_automation
-- ============================================================================

-- Drop tables in reverse dependency order if resetting
DROP TABLE IF EXISTS erp_sync_logs CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS payment_batches CASCADE;
DROP TABLE IF EXISTS approval_tasks CASCADE;
DROP TABLE IF EXISTS approval_matrix CASCADE;
DROP TABLE IF EXISTS po_match_results CASCADE;
DROP TABLE IF EXISTS validation_results CASCADE;
DROP TABLE IF EXISTS invoice_line_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS grn_lines CASCADE;
DROP TABLE IF EXISTS grn CASCADE;
DROP TABLE IF EXISTS po_lines CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS vendor_bank_accounts CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- ============================================================================
-- 1. ROLE-BASED ACCESS CONTROL & USERS
-- ============================================================================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(200)
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'AP Clerk',
    department VARCHAR(50) DEFAULT 'Finance',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. VENDOR MASTER & BANKING REGISTRY
-- ============================================================================
CREATE TABLE vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    tax_id VARCHAR(50), -- 15-digit GSTIN / PAN
    state VARCHAR(50) DEFAULT 'Karnataka',
    state_code VARCHAR(10) DEFAULT '29',
    email VARCHAR(100),
    phone VARCHAR(30),
    address TEXT,
    category VARCHAR(50) DEFAULT 'Services', -- Hardware, Software, Services, Logistics
    payment_terms VARCHAR(30) DEFAULT 'Net 30', -- Immediate, Net 15, Net 30, Net 60
    status VARCHAR(30) DEFAULT 'Active', -- Active, On Hold, Blacklisted
    onboarding_status VARCHAR(30) DEFAULT 'Approved',
    rating NUMERIC(3, 2) DEFAULT 4.50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendor_bank_accounts (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    swift_code VARCHAR(20),
    account_type VARCHAR(20) DEFAULT 'Current',
    is_primary BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT TRUE
);

-- ============================================================================
-- 3. PROCUREMENT MASTER (PURCHASE ORDERS & GOODS RECEIPT NOTES)
-- ============================================================================
CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id),
    issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) DEFAULT 'Open', -- Open, Partially Received, Received, Invoiced, Closed
    department VARCHAR(50) DEFAULT 'IT',
    currency VARCHAR(10) DEFAULT 'INR',
    subtotal NUMERIC(15, 2) DEFAULT 0.00,
    tax_amount NUMERIC(15, 2) DEFAULT 0.00,
    total_amount NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE po_lines (
    id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    item_description VARCHAR(200) NOT NULL,
    hsn_code VARCHAR(20),
    quantity NUMERIC(12, 2) DEFAULT 1.00,
    unit_price NUMERIC(15, 2) DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) DEFAULT 18.00,
    tax_amount NUMERIC(15, 2) DEFAULT 0.00,
    total_amount NUMERIC(15, 2) DEFAULT 0.00,
    received_qty NUMERIC(12, 2) DEFAULT 0.00,
    invoiced_qty NUMERIC(12, 2) DEFAULT 0.00
);

CREATE TABLE grn (
    id SERIAL PRIMARY KEY,
    grn_number VARCHAR(50) UNIQUE NOT NULL,
    po_id INTEGER NOT NULL REFERENCES purchase_orders(id),
    vendor_id INTEGER NOT NULL REFERENCES vendors(id),
    receipt_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    received_by VARCHAR(100) DEFAULT 'Warehouse Supervisor',
    status VARCHAR(30) DEFAULT 'Accepted', -- Received, Accepted, Rejected, Discrepant
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE grn_lines (
    id SERIAL PRIMARY KEY,
    grn_id INTEGER NOT NULL REFERENCES grn(id) ON DELETE CASCADE,
    po_line_id INTEGER REFERENCES po_lines(id),
    item_description VARCHAR(200),
    quantity_received NUMERIC(12, 2) DEFAULT 1.00,
    quantity_accepted NUMERIC(12, 2) DEFAULT 1.00,
    quantity_rejected NUMERIC(12, 2) DEFAULT 0.00,
    remarks VARCHAR(200)
);

-- ============================================================================
-- 4. INVOICES & OCR TABLE LINE ITEMS
-- ============================================================================
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100),
    vendor_id INTEGER REFERENCES vendors(id),
    vendor_name_raw VARCHAR(150),
    vendor_gstin_raw VARCHAR(50),
    customer_gstin_raw VARCHAR(50),
    po_number_raw VARCHAR(50),
    invoice_date TIMESTAMP,
    due_date TIMESTAMP,
    currency VARCHAR(10) DEFAULT 'INR',
    payment_terms VARCHAR(30) DEFAULT 'Net 30',
    department VARCHAR(50) DEFAULT 'General',
    subtotal NUMERIC(15, 2) DEFAULT 0.00,
    cgst_amount NUMERIC(15, 2) DEFAULT 0.00,
    sgst_amount NUMERIC(15, 2) DEFAULT 0.00,
    igst_amount NUMERIC(15, 2) DEFAULT 0.00,
    tax_amount NUMERIC(15, 2) DEFAULT 0.00,
    discount_amount NUMERIC(15, 2) DEFAULT 0.00,
    round_off NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(15, 2) DEFAULT 0.00,
    source VARCHAR(30) DEFAULT 'Upload', -- Upload, DragDrop, Bulk, Email
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_type VARCHAR(20),
    file_size INTEGER DEFAULT 0,
    ocr_raw_text TEXT,
    ocr_accuracy_score NUMERIC(5, 2) DEFAULT 95.00,
    extraction_confidence NUMERIC(5, 2) DEFAULT 92.50,
    status VARCHAR(50) DEFAULT 'Captured', -- Captured, Extracted, Validated, Matched, Pending Approval, Approved, Paid
    match_status VARCHAR(50) DEFAULT 'Not Matched', -- Not Matched, 2-Way Matched, 3-Way Matched, Exception
    current_approval_step INTEGER DEFAULT 1,
    assigned_to_role VARCHAR(50) DEFAULT 'AP Clerk',
    is_escalated BOOLEAN DEFAULT FALSE,
    escalation_reason VARCHAR(255),
    rejection_reason TEXT,
    erp_sync_status VARCHAR(30) DEFAULT 'Pending',
    erp_reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_po ON invoices(po_number_raw);

CREATE TABLE invoice_line_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    line_number INTEGER DEFAULT 1,
    description VARCHAR(255) NOT NULL,
    hsn_code VARCHAR(30),
    quantity NUMERIC(12, 2) DEFAULT 1.00,
    unit VARCHAR(20) DEFAULT 'PCS',
    unit_price NUMERIC(15, 2) DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) DEFAULT 18.00,
    tax_amount NUMERIC(15, 2) DEFAULT 0.00,
    total_amount NUMERIC(15, 2) DEFAULT 0.00,
    confidence NUMERIC(5, 2) DEFAULT 95.00
);

-- ============================================================================
-- 5. VALIDATION, RECONCILIATION & APPROVAL WORKFLOW
-- ============================================================================
CREATE TABLE validation_results (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    rule_code VARCHAR(50) NOT NULL, -- MANDATORY_FIELDS, DUPLICATE_CHECK, GST_VALIDATION, AMOUNT_MATH, VENDOR_MASTER
    rule_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL, -- Passed, Warning, Failed
    severity VARCHAR(20) DEFAULT 'Critical',
    message TEXT NOT NULL,
    details_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE po_match_results (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    po_id INTEGER REFERENCES purchase_orders(id),
    grn_id INTEGER REFERENCES grn(id),
    match_type VARCHAR(20) DEFAULT '2-Way', -- 2-Way, 3-Way
    status VARCHAR(30) NOT NULL, -- Matched, Price Variance, Quantity Variance, Missing Line
    variance_amount NUMERIC(15, 2) DEFAULT 0.00,
    tolerance_applied NUMERIC(5, 2) DEFAULT 2.00,
    within_tolerance BOOLEAN DEFAULT TRUE,
    details_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE approval_matrix (
    id SERIAL PRIMARY KEY,
    min_amount NUMERIC(15, 2) DEFAULT 0.00,
    max_amount NUMERIC(15, 2) DEFAULT 10000000.00,
    department VARCHAR(50) DEFAULT 'All',
    required_role VARCHAR(50) NOT NULL, -- AP Clerk, Dept Manager, Finance Director, CFO
    step_number INTEGER DEFAULT 1,
    sla_hours INTEGER DEFAULT 24,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE approval_tasks (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    step_number INTEGER DEFAULT 1,
    assigned_role VARCHAR(50) NOT NULL,
    assigned_user_id INTEGER REFERENCES users(id),
    status VARCHAR(30) DEFAULT 'Pending', -- Pending, Approved, Rejected, Escalated
    comments TEXT,
    reminders_sent INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actioned_at TIMESTAMP,
    actioned_by VARCHAR(100)
);

-- ============================================================================
-- 6. SETTLEMENT, AUDIT TRAIL & ERP INTEGRATION
-- ============================================================================
CREATE TABLE payment_batches (
    id SERIAL PRIMARY KEY,
    batch_reference VARCHAR(50) UNIQUE NOT NULL,
    total_amount NUMERIC(15, 2) DEFAULT 0.00,
    invoice_count INTEGER DEFAULT 0,
    format_type VARCHAR(30) DEFAULT 'NEFT_RTGS_CSV', -- NEFT_RTGS_CSV, ISO20022_XML
    status VARCHAR(30) DEFAULT 'Draft', -- Draft, Transmitted, Settled, Failed
    bank_name VARCHAR(100) DEFAULT 'HDFC Bank Corporate Direct',
    file_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

CREATE TABLE payment_transactions (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES payment_batches(id),
    invoice_id INTEGER NOT NULL REFERENCES invoices(id),
    vendor_id INTEGER NOT NULL REFERENCES vendors(id),
    amount NUMERIC(15, 2) NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'NEFT', -- NEFT, RTGS, UPI, IMPS
    utr_number VARCHAR(50), -- Bank Unique Transaction Reference (e.g. HDFCR5202611020084729)
    status VARCHAR(30) DEFAULT 'Pending', -- Pending, Settled, Failed
    payment_advice_path VARCHAR(500),
    processed_at TIMESTAMP,
    failure_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL, -- INVOICE_UPLOAD, OCR_EXTRACT, VALIDATION_RUN, PO_MATCH, APPROVAL, PAYMENT_EXEC, ERP_SYNC
    entity_type VARCHAR(50) DEFAULT 'Invoice',
    entity_id VARCHAR(50),
    actor_name VARCHAR(100) DEFAULT 'System',
    actor_role VARCHAR(50) DEFAULT 'Automation Engine',
    details TEXT,
    ip_address VARCHAR(50) DEFAULT '127.0.0.1',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE erp_sync_logs (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id),
    target_system VARCHAR(50) DEFAULT 'Tally Prime', -- Tally Prime, SAP, Zoho Books, QuickBooks
    sync_status VARCHAR(30) DEFAULT 'Success',
    payload_json JSONB,
    response_details TEXT,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
