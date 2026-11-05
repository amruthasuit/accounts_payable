# Accounts Payable (AP) Automation Software with OCR & Workflows

An enterprise Accounts Payable (AP) Automation platform designed to take a vendor invoice from receipt to payment with minimal manual work.

---

## 🏗 End-to-End Workflow

```
Invoice Received (Upload / Email / Drag & Drop / Bulk)
        ↓
OCR + AI Extraction (Header fields + Line item materials + Multi-page)
        ↓
Validation Engine (Mandatory fields, Duplicates, GST, Amounts math, Vendor Master)
        ↓
PO Matching (2-Way: PO vs Inv | 3-Way: PO vs GRN vs Inv with ±2% tolerance)
        ↓
Approval Workflow (Tiered Matrix, Role-based, Escalation, Reminders, Mobile)
        ↓
Payment Processing (Payment Batches, Bank API Simulation, NEFT/RTGS CSV, Payment Advice)
        ↓
ERP & Accounting Sync (Tally Prime XML, SAP S/4HANA BAPI, Zoho Books, QuickBooks)
        ↓
Executive Dashboards, Aging Reports, Exception Tracking, Immutable Audit Trail
```

---

## 📦 The 9 Core Modules

| # | Module | Core Capabilities |
|---|--------|-------------------|
| **1** | **Invoice Capture** | Multi-channel ingestion: PDF, JPG, PNG, TIFF, drag-and-drop, bulk ingestion, and automated vendor mailbox polling (IMAP). |
| **2** | **OCR & AI Extraction** | Reads text from documents, extracts headers (Invoice #, Date, GSTIN, PO ref) and line-item tables with HSN/SAC codes, quantities, rates, and confidence scoring. Multi-page support. Side-by-side verification editor. |
| **3** | **Validation Engine** | 5-point automated rule checks: (1) Mandatory fields presence, (2) Duplicate invoice detection, (3) GST syntax and Interstate (IGST) vs Intrastate (CGST+SGST) tax logic, (4) Mathematical reconciliation, (5) Vendor master & verified bank account check. |
| **4** | **PO Matching** | **2-Way Match**: PO vs Invoice (Price, Qty, Total). **3-Way Match**: PO vs GRN (Goods Receipt Note) vs Invoice (`Billed Qty ≤ Received Qty ≤ Ordered Qty`). Configurable price tolerance slider (default ±2.0%). |
| **5** | **Workflow & Approval Engine** | Configurable tiered approval matrix based on financial value & department. Role-based routing (AP Clerk, Dept Manager, Finance Director). Escalation deadlines, notification reminders, and mobile quick-action approvals. |
| **6** | **Vendor Management** | Vendor master database, bank account registry (IFSC, Account Number, Bank Name), real-time GSTIN pattern & portal verification, onboarding lifecycle (Approved, On Hold, Blacklisted). |
| **7** | **Payment Processing** | Payment batch aggregation, banking export file generation (NEFT/RTGS corporate CSV format & ISO 20022 XML), simulated Host-to-Host Bank API execution with real UTR numbers, and downloadable Payment Advice (Remittance Advice) generation. |
| **8** | **Dashboard** | AP aging schedule (0-30, 31-60, 61-90, 90+ days), pending approval counts and values, average turnaround time (TAT in hours), OCR accuracy percentage, pipeline status distribution, and vendor spend analytics. |
| **9** | **Reports & Audit Trail** | AP aging reports, invoice lifecycle status reports, exception reports (price/qty variances, GST errors), Input Tax Credit (ITC) reconciliation, and immutable audit logs tracking every event timestamped with actor name and role. |
| **+** | **ERP Sync Connector** | Connectors for **Tally Prime** (Purchase Voucher XML envelope), **SAP S/4HANA** (`BAPI_INCOMINGINVOICE_CREATE`), **Zoho Books** (REST API), and **QuickBooks Online**. |

---

## ⚡ Deployment to Vercel (Serverless Full-Stack)

The repository is pre-configured for **1-click zero-configuration deployment to Vercel**:

- **Frontend**: Built via `vite build` into static assets deployed globally across Vercel's Edge CDN.
- **Backend API**: The Python FastAPI backend runs as a high-performance **Vercel Serverless Function** through `api/index.py`.
- **Automatic Routing**: `vercel.json` automatically maps `/api/*` and `/uploads/*` requests to the Python serverless runtime, and routes all web traffic to the React SPA.
- **Serverless Storage**: Configured to safely store SQLite databases and documents in `/tmp` in serverless execution environments, or connect directly to any managed PostgreSQL instance (e.g. Neon, Supabase, Vercel Postgres) via the `DATABASE_URL` environment variable.

---

## 👥 Seed Test Accounts & Personas

Switch between users using the top-right persona selector in the UI:
- **Sharath Chandra (Admin)**: Full administrative access across all modules.
- **Priya Sharma (AP Clerk)**: Data capture, OCR verification, side-by-side editing, rule checks.
- **Rahul Verma (IT Manager)**: Approver for IT hardware and software invoices.
- **Anita Desai (Operations Lead)**: Approver for logistics and supplies invoices.
- **Kavita Nair (Finance Director)**: High-value approvals, payment batches, bank releases.
- **Suresh Menon (Internal Auditor)**: Read-only audit logs and GST reconciliation.
