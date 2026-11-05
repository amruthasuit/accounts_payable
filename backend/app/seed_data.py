import datetime
from sqlalchemy.orm import Session
from .models import (
    Role, User, Vendor, VendorBankAccount, PurchaseOrder, PurchaseOrderLine,
    GoodsReceiptNote, GoodsReceiptNoteLine, ApprovalMatrix, Invoice,
    InvoiceLineItem, ValidationResult, POMatchResult, ApprovalTask,
    PaymentBatch, PaymentTransaction, AuditLog
)

def seed_database(db: Session):
    """
    Seeds database with initial master data: roles, users, approval matrix,
    vendors, bank accounts, POs, GRNs, and representative invoices across stages.
    """
    if db.query(Role).first():
        return  # Already seeded

    print("Seeding initial AP Automation data...")

    # 1. Roles
    roles = [
        Role(name="Admin", description="Full system administrator"),
        Role(name="AP Clerk", description="Invoice capture, extraction, data validation"),
        Role(name="Approver", description="Department manager reviewing and approving bills"),
        Role(name="Finance Manager", description="Treasury, payment batches, bank releases"),
        Role(name="Auditor", description="Read-only compliance and reporting access")
    ]
    db.add_all(roles)
    db.flush()

    # 2. Users
    users = [
        User(name="Sharath (Admin)", email="admin@templegate.com", role="Admin", department="Executive"),
        User(name="Priya Sharma (AP Clerk)", email="priya.ap@templegate.com", role="AP Clerk", department="Finance"),
        User(name="Rahul Verma (IT Manager)", email="rahul.it@templegate.com", role="Approver", department="IT"),
        User(name="Anita Desai (Operations Lead)", email="anita.ops@templegate.com", role="Approver", department="Operations"),
        User(name="Kavita Nair (Finance Director)", email="kavita.cfo@templegate.com", role="Finance Manager", department="Finance"),
        User(name="Suresh Menon (Internal Auditor)", email="suresh.audit@templegate.com", role="Auditor", department="Audit")
    ]
    db.add_all(users)
    db.flush()

    # 3. Approval Matrix
    matrix_entries = [
        ApprovalMatrix(min_amount=0.0, max_amount=15000.0, department="All", required_role="AP Clerk", step_number=1, sla_hours=24),
        ApprovalMatrix(min_amount=15000.01, max_amount=100000.0, department="All", required_role="Approver", step_number=1, sla_hours=48),
        ApprovalMatrix(min_amount=100000.01, max_amount=5000000.0, department="All", required_role="Finance Manager", step_number=2, sla_hours=72)
    ]
    db.add_all(matrix_entries)
    db.flush()

    # 4. Vendors & Bank Accounts
    v1 = Vendor(
        name="Apex Cloud Technologies Pvt Ltd",
        code="VEND-APEX-01",
        tax_id="29AABCA1234F1Z5",
        state="Karnataka",
        state_code="29",
        email="billing@apexcloud.in",
        phone="+91 80 4123 4567",
        address="102 Koramangala 4th Block, Bengaluru, Karnataka 560034",
        category="Software",
        payment_terms="Net 30",
        status="Active",
        onboarding_status="Approved",
        rating=4.9
    )
    db.add(v1)
    db.flush()
    db.add(VendorBankAccount(
        vendor_id=v1.id,
        bank_name="HDFC Bank",
        account_number="50200012345678",
        ifsc_code="HDFC0000053",
        account_type="Current",
        is_primary=True,
        is_verified=True
    ))

    v2 = Vendor(
        name="Zenith Hardware & Networking Solutions",
        code="VEND-ZENITH-02",
        tax_id="27AAACZ4321K1Z2",
        state="Maharashtra",
        state_code="27",
        email="accounts@zenithhw.com",
        phone="+91 22 2890 1122",
        address="Tower 2, MIDC Andheri East, Mumbai, Maharashtra 400093",
        category="Hardware",
        payment_terms="Net 30",
        status="Active",
        onboarding_status="Approved",
        rating=4.7
    )
    db.add(v2)
    db.flush()
    db.add(VendorBankAccount(
        vendor_id=v2.id,
        bank_name="ICICI Bank",
        account_number="000405012398",
        ifsc_code="ICIC0000004",
        account_type="Current",
        is_primary=True,
        is_verified=True
    ))

    v3 = Vendor(
        name="Global Office Supplies Corp",
        code="VEND-GLOBOFFICE-03",
        tax_id="29AABCG8888P1Z9",
        state="Karnataka",
        state_code="29",
        email="sales@globalsupplies.co.in",
        phone="+91 80 2345 6789",
        address="45 Peenya Industrial Area, Bengaluru, Karnataka 560058",
        category="Supplies",
        payment_terms="Net 15",
        status="Active",
        onboarding_status="Approved",
        rating=4.4
    )
    db.add(v3)
    db.flush()
    db.add(VendorBankAccount(
        vendor_id=v3.id,
        bank_name="State Bank of India",
        account_number="30981234567",
        ifsc_code="SBIN0001811",
        account_type="Current",
        is_primary=True,
        is_verified=True
    ))

    v4 = Vendor(
        name="Reliable Freight & Logistics Express",
        code="VEND-RELIABLE-04",
        tax_id="29AABCR9999L1Z1",
        state="Karnataka",
        state_code="29",
        email="dispatch@reliablelogistics.in",
        phone="+91 80 6789 0123",
        address="12 Hosur Road, Electronic City, Bengaluru 560100",
        category="Logistics",
        payment_terms="Net 30",
        status="Active",
        onboarding_status="Approved",
        rating=4.6
    )
    db.add(v4)
    db.flush()
    db.add(VendorBankAccount(
        vendor_id=v4.id,
        bank_name="Axis Bank",
        account_number="918020034567890",
        ifsc_code="UTIB0000045",
        account_type="Current",
        is_primary=True,
        is_verified=True
    ))

    v5 = Vendor(
        name="Precision Facility Maintenance",
        code="VEND-PRECISION-05",
        tax_id="29AAACP5555M1Z8",
        state="Karnataka",
        state_code="29",
        email="contact@precisionfm.com",
        phone="+91 80 3344 5566",
        address="78 Whitefield Main Road, Bengaluru 560066",
        category="Services",
        payment_terms="Immediate",
        status="On Hold",
        onboarding_status="Pending Review",
        rating=3.8
    )
    db.add(v5)
    db.flush()

    # 5. Purchase Orders & GRNs
    # PO 1: Apex Cloud (Software)
    po1 = PurchaseOrder(
        po_number="PO-2026-101",
        vendor_id=v1.id,
        issue_date=datetime.datetime.utcnow() - datetime.timedelta(days=20),
        status="Received",
        department="IT",
        currency="INR",
        subtotal=60000.0,
        tax_amount=10800.0,
        total_amount=70800.0
    )
    db.add(po1)
    db.flush()
    db.add_all([
        PurchaseOrderLine(po_id=po1.id, line_number=1, item_description="Enterprise Cloud Server Hosting - Q1", hsn_code="998315", quantity=1.0, unit_price=45000.0, tax_rate=18.0, tax_amount=8100.0, total_amount=53100.0, received_qty=1.0),
        PurchaseOrderLine(po_id=po1.id, line_number=2, item_description="Database Backup & Disaster Recovery Storage", hsn_code="998316", quantity=1.0, unit_price=15000.0, tax_rate=18.0, tax_amount=2700.0, total_amount=17700.0, received_qty=1.0)
    ])

    # PO 2: Zenith Hardware (Hardware, 3-Way Match candidate)
    po2 = PurchaseOrder(
        po_number="PO-2026-102",
        vendor_id=v2.id,
        issue_date=datetime.datetime.utcnow() - datetime.timedelta(days=25),
        status="Received",
        department="IT",
        currency="INR",
        subtotal=467500.0,
        tax_amount=84150.0,
        total_amount=551650.0
    )
    db.add(po2)
    db.flush()
    po2_l1 = PurchaseOrderLine(po_id=po2.id, line_number=1, item_description="Dell Latitude 5540 Core i7 Workstations", hsn_code="847130", quantity=5.0, unit_price=85000.0, tax_rate=18.0, tax_amount=76500.0, total_amount=501500.0, received_qty=5.0)
    po2_l2 = PurchaseOrderLine(po_id=po2.id, line_number=2, item_description="Logitech MX Master 3S Wireless Mice", hsn_code="847160", quantity=5.0, unit_price=8500.0, tax_rate=18.0, tax_amount=7650.0, total_amount=50150.0, received_qty=5.0)
    db.add_all([po2_l1, po2_l2])
    db.flush()

    # GRN for PO 2
    grn2 = GoodsReceiptNote(
        grn_number="GRN-2026-001",
        po_id=po2.id,
        vendor_id=v2.id,
        receipt_date=datetime.datetime.utcnow() - datetime.timedelta(days=10),
        received_by="Anil Kumar (Store Lead)",
        status="Accepted",
        notes="All 5 Dell laptops and 5 mice inspected in sealed condition and verified working."
    )
    db.add(grn2)
    db.flush()
    db.add_all([
        GoodsReceiptNoteLine(grn_id=grn2.id, po_line_id=po2_l1.id, item_description=po2_l1.item_description, quantity_received=5.0, quantity_accepted=5.0, quantity_rejected=0.0, remarks="Passed QA"),
        GoodsReceiptNoteLine(grn_id=grn2.id, po_line_id=po2_l2.id, item_description=po2_l2.item_description, quantity_received=5.0, quantity_accepted=5.0, quantity_rejected=0.0, remarks="Passed QA")
    ])

    # PO 3: Global Office Supplies
    po3 = PurchaseOrder(
        po_number="PO-2026-103",
        vendor_id=v3.id,
        issue_date=datetime.datetime.utcnow() - datetime.timedelta(days=15),
        status="Open",
        department="Operations",
        currency="INR",
        subtotal=88000.0,
        tax_amount=15840.0,
        total_amount=103840.0
    )
    db.add(po3)
    db.flush()
    db.add_all([
        PurchaseOrderLine(po_id=po3.id, line_number=1, item_description="A4 Multipurpose Copier Paper Boxes (5 Reams)", hsn_code="480256", quantity=50.0, unit_price=1200.0, tax_rate=12.0, tax_amount=7200.0, total_amount=67200.0, received_qty=50.0),
        PurchaseOrderLine(po_id=po3.id, line_number=2, item_description="High Yield Toner Cartridge TN-B021", hsn_code="844399", quantity=8.0, unit_price=3500.0, tax_rate=18.0, tax_amount=5040.0, total_amount=33040.0, received_qty=8.0)
    ])

    # 6. Seed Invoices across the 9 modules
    now = datetime.datetime.utcnow()

    # Invoice 1: Zenith Hardware (Paid - complete lifecycle showcase)
    inv1 = Invoice(
        invoice_number="INV-2026-8812",
        vendor_id=v2.id,
        vendor_name_raw=v2.name,
        vendor_gstin_raw=v2.tax_id,
        customer_gstin_raw="29AAACT9876Q1Z2",
        po_number_raw="PO-2026-102",
        invoice_date=now - datetime.timedelta(days=12),
        due_date=now + datetime.timedelta(days=18),
        currency="INR",
        payment_terms="Net 30",
        department="IT",
        subtotal=467500.0,
        cgst_amount=0.0,
        sgst_amount=0.0,
        igst_amount=84150.0,
        tax_amount=84150.0,
        discount_amount=0.0,
        round_off=0.0,
        total_amount=551650.0,
        source="Upload",
        file_name="Zenith_Invoice_8812.pdf",
        ocr_accuracy_score=98.5,
        extraction_confidence=97.2,
        status="Paid",
        match_status="3-Way Matched",
        current_approval_step=2,
        assigned_to_role="Finance Treasury",
        erp_sync_status="Synced",
        erp_reference="SAP-DOC-5105991",
        created_at=now - datetime.timedelta(days=11)
    )
    db.add(inv1)
    db.flush()
    db.add_all([
        InvoiceLineItem(invoice_id=inv1.id, line_number=1, description="Dell Latitude 5540 Core i7 Workstations", hsn_code="847130", quantity=5.0, unit="PCS", unit_price=85000.0, tax_rate=18.0, tax_amount=76500.0, total_amount=501500.0, confidence=98.0),
        InvoiceLineItem(invoice_id=inv1.id, line_number=2, description="Logitech MX Master 3S Wireless Mice", hsn_code="847160", quantity=5.0, unit="PCS", unit_price=8500.0, tax_rate=18.0, tax_amount=7650.0, total_amount=50150.0, confidence=97.5)
    ])
    # Payment batch and transaction for Invoice 1
    batch1 = PaymentBatch(
        batch_reference="BATCH-20261101-901",
        total_amount=551650.0,
        invoice_count=1,
        format_type="NEFT_RTGS_CSV",
        status="Settled",
        bank_name="HDFC Bank Corporate Direct",
        created_at=now - datetime.timedelta(days=2),
        processed_at=now - datetime.timedelta(days=1)
    )
    db.add(batch1)
    db.flush()
    db.add(PaymentTransaction(
        batch_id=batch1.id,
        invoice_id=inv1.id,
        vendor_id=v2.id,
        amount=551650.0,
        payment_method="RTGS",
        utr_number="HDFCR26305981240",
        status="Settled",
        processed_at=now - datetime.timedelta(days=1)
    ))

    # Invoice 2: Apex Cloud (Approved - ready for payment batch)
    inv2 = Invoice(
        invoice_number="INV-2026-4401",
        vendor_id=v1.id,
        vendor_name_raw=v1.name,
        vendor_gstin_raw=v1.tax_id,
        customer_gstin_raw="29AAACT9876Q1Z2",
        po_number_raw="PO-2026-101",
        invoice_date=now - datetime.timedelta(days=5),
        due_date=now + datetime.timedelta(days=25),
        currency="INR",
        payment_terms="Net 30",
        department="IT",
        subtotal=60000.0,
        cgst_amount=5400.0,
        sgst_amount=5400.0,
        igst_amount=0.0,
        tax_amount=10800.0,
        discount_amount=0.0,
        round_off=0.0,
        total_amount=70800.0,
        source="Email",
        file_name="ApexCloud_CloudHosting_Q1.pdf",
        ocr_accuracy_score=97.8,
        extraction_confidence=96.4,
        status="Approved",
        match_status="2-Way Matched",
        current_approval_step=2,
        assigned_to_role="Finance Treasury",
        erp_sync_status="Pending",
        created_at=now - datetime.timedelta(days=4)
    )
    db.add(inv2)
    db.flush()
    db.add_all([
        InvoiceLineItem(invoice_id=inv2.id, line_number=1, description="Enterprise Cloud Server Hosting - Q1", hsn_code="998315", quantity=1.0, unit="PCS", unit_price=45000.0, tax_rate=18.0, tax_amount=8100.0, total_amount=53100.0, confidence=97.0),
        InvoiceLineItem(invoice_id=inv2.id, line_number=2, description="Database Backup & Disaster Recovery Storage", hsn_code="998316", quantity=1.0, unit="PCS", unit_price=15000.0, tax_rate=18.0, tax_amount=2700.0, total_amount=17700.0, confidence=98.0)
    ])

    # Invoice 3: Global Office Supplies (Pending Approval - in Approver inbox)
    inv3 = Invoice(
        invoice_number="INV-2026-7290",
        vendor_id=v3.id,
        vendor_name_raw=v3.name,
        vendor_gstin_raw=v3.tax_id,
        customer_gstin_raw="29AAACT9876Q1Z2",
        po_number_raw="PO-2026-103",
        invoice_date=now - datetime.timedelta(days=2),
        due_date=now + datetime.timedelta(days=13),
        currency="INR",
        payment_terms="Net 15",
        department="Operations",
        subtotal=88000.0,
        cgst_amount=7920.0,
        sgst_amount=7920.0,
        igst_amount=0.0,
        tax_amount=15840.0,
        discount_amount=0.0,
        round_off=0.0,
        total_amount=103840.0,
        source="DragDrop",
        file_name="GlobalSupplies_PaperToner.pdf",
        ocr_accuracy_score=96.4,
        extraction_confidence=95.1,
        status="Pending Approval",
        match_status="2-Way Matched",
        current_approval_step=1,
        assigned_to_role="Approver",
        created_at=now - datetime.timedelta(days=1)
    )
    db.add(inv3)
    db.flush()
    db.add_all([
        InvoiceLineItem(invoice_id=inv3.id, line_number=1, description="A4 Multipurpose Copier Paper Boxes (5 Reams)", hsn_code="480256", quantity=50.0, unit="BOX", unit_price=1200.0, tax_rate=12.0, tax_amount=7200.0, total_amount=67200.0, confidence=96.0),
        InvoiceLineItem(invoice_id=inv3.id, line_number=2, description="High Yield Toner Cartridge TN-B021", hsn_code="844399", quantity=8.0, unit="PCS", unit_price=3500.0, tax_rate=18.0, tax_amount=5040.0, total_amount=33040.0, confidence=95.5)
    ])
    db.add(ApprovalTask(
        invoice_id=inv3.id,
        step_number=1,
        assigned_role="Approver",
        status="Pending",
        comments="Pending Department Lead review."
    ))

    # Invoice 4: Reliable Freight (Validated - awaiting matching)
    inv4 = Invoice(
        invoice_number="INV-2026-5520",
        vendor_id=v4.id,
        vendor_name_raw=v4.name,
        vendor_gstin_raw=v4.tax_id,
        customer_gstin_raw="29AAACT9876Q1Z2",
        po_number_raw="PO-2026-104",
        invoice_date=now - datetime.timedelta(days=1),
        due_date=now + datetime.timedelta(days=29),
        currency="INR",
        payment_terms="Net 30",
        department="Logistics",
        subtotal=42000.0,
        cgst_amount=2600.0,
        sgst_amount=2600.0,
        igst_amount=0.0,
        tax_amount=5200.0,
        discount_amount=0.0,
        round_off=0.0,
        total_amount=47200.0,
        source="Bulk",
        file_name="Freight_Invoice_5520.png",
        ocr_accuracy_score=95.1,
        extraction_confidence=93.8,
        status="Validated",
        match_status="Not Matched",
        current_approval_step=1,
        assigned_to_role="AP Clerk",
        created_at=now
    )
    db.add(inv4)
    db.flush()
    db.add_all([
        InvoiceLineItem(invoice_id=inv4.id, line_number=1, description="Pan-India Surface Freight Transportation", hsn_code="996511", quantity=1.0, unit="PCS", unit_price=28000.0, tax_rate=5.0, tax_amount=1400.0, total_amount=29400.0, confidence=94.0),
        InvoiceLineItem(invoice_id=inv4.id, line_number=2, description="Warehousing & Handling Charges - Oct", hsn_code="996729", quantity=1.0, unit="PCS", unit_price=14000.0, tax_rate=18.0, tax_amount=2520.0, total_amount=16520.0, confidence=93.5)
    ])

    # Invoice 5: Price Variance Discrepancy (Exception showcase)
    inv5 = Invoice(
        invoice_number="INV-2026-9901",
        vendor_id=v1.id,
        vendor_name_raw=v1.name,
        vendor_gstin_raw=v1.tax_id,
        customer_gstin_raw="29AAACT9876Q1Z2",
        po_number_raw="PO-2026-101",
        invoice_date=now - datetime.timedelta(days=3),
        due_date=now + datetime.timedelta(days=27),
        currency="INR",
        payment_terms="Net 30",
        department="IT",
        subtotal=80000.0,
        cgst_amount=7200.0,
        sgst_amount=7200.0,
        igst_amount=0.0,
        tax_amount=14400.0,
        discount_amount=0.0,
        round_off=0.0,
        total_amount=94400.0,
        source="Upload",
        file_name="ApexCloud_UnscheduledRateHike.pdf",
        ocr_accuracy_score=96.0,
        extraction_confidence=94.5,
        status="Match Exception",
        match_status="Match Exception",
        is_escalated=True,
        escalation_reason="Billed price ₹80,000 exceeds PO rate ₹60,000 by 33.3% (+₹20,000 variance, exceeding 2% tolerance)",
        current_approval_step=2,
        assigned_to_role="Finance Director",
        created_at=now - datetime.timedelta(days=3)
    )
    db.add(inv5)
    db.flush()
    db.add(InvoiceLineItem(invoice_id=inv5.id, line_number=1, description="Enterprise Cloud Server Hosting - Price Surcharge", hsn_code="998315", quantity=1.0, unit="PCS", unit_price=80000.0, tax_rate=18.0, tax_amount=14400.0, total_amount=94400.0, confidence=95.0))
    db.add(POMatchResult(
        invoice_id=inv5.id,
        po_id=po1.id,
        match_type="2-Way",
        status="Price Variance Exception",
        variance_amount=23600.0,
        tolerance_applied=2.0,
        within_tolerance=False,
        details_json={
            "po_number": "PO-2026-101",
            "po_total": 70800.0,
            "invoice_total": 94400.0,
            "variance": 23600.0,
            "variance_percent": 33.33
        }
    ))

    # Audit Logs
    db.add_all([
        AuditLog(action="SYSTEM_INIT", entity_type="System", entity_id="0", actor_name="System", actor_role="Admin", details="AP Automation system initialized with master vendors, POs, and workflows."),
        AuditLog(action="INVOICE_UPLOAD", entity_type="Invoice", entity_id=str(inv1.id), actor_name="Priya Sharma", actor_role="AP Clerk", details=f"Uploaded invoice #{inv1.invoice_number}."),
        AuditLog(action="OCR_EXTRACTION", entity_type="Invoice", entity_id=str(inv1.id), actor_name="OCR Engine", actor_role="AI", details="Header fields and line items extracted with 98.5% confidence."),
        AuditLog(action="3WAY_MATCH_SUCCESS", entity_type="Invoice", entity_id=str(inv1.id), actor_name="Matching Engine", actor_role="System", details="3-Way matched with PO-2026-102 and GRN-2026-001 within 0% variance."),
        AuditLog(action="PAYMENT_SETTLED", entity_type="Invoice", entity_id=str(inv1.id), actor_name="Bank Gateway", actor_role="HDFC Host2Host", details="Settled ₹551,650.00 via RTGS. UTR: HDFCR26305981240.")
    ])

    db.commit()
    print("Database seeding completed successfully.")
