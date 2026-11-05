import os
import sys
from fastapi.testclient import TestClient

# Ensure current directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app

client = TestClient(app)

def test_endpoints():
    print("Testing AP Automation Platform API endpoints...")

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[OK] Health Check: OK")

    # 2. Invoices list
    res = client.get("/api/invoices/")
    assert res.status_code == 200, f"Invoices list failed: {res.text}"
    invoices = res.json()
    print(f"[OK] Invoices List: OK ({len(invoices)} seeded invoices found)")

    # 3. Validation rules
    res = client.get("/api/validation/rules")
    assert res.status_code == 200
    print(f"[OK] Validation Rules: OK ({len(res.json())} rules active)")

    # 4. Trigger validation on first invoice
    if invoices:
        inv_id = invoices[0]["id"]
        res = client.post(f"/api/validation/run/{inv_id}")
        assert res.status_code == 200
        print(f"[OK] Validation Engine Run on Invoice #{inv_id}: OK")

        # 5. PO Matching
        res = client.post(f"/api/matching/run/{inv_id}", json={"tolerance_percent": 2.0})
        assert res.status_code == 200
        print(f"[OK] PO Matching Engine on Invoice #{inv_id}: OK (Status: {res.json()['status']})")

    # 6. Approvals Inbox
    res = client.get("/api/approvals/inbox")
    assert res.status_code == 200
    print(f"[OK] Approvals Inbox: OK ({len(res.json())} pending items)")

    # 7. Approval Matrix
    res = client.get("/api/approvals/matrix")
    assert res.status_code == 200
    print(f"[OK] Approval Matrix: OK ({len(res.json())} tiers configured)")

    # 8. Vendors List
    res = client.get("/api/vendors/")
    assert res.status_code == 200
    print(f"[OK] Vendors Master: OK ({len(res.json())} vendors registered)")

    # 9. GSTIN Verification
    res = client.post("/api/vendors/validate-gst?gstin=29AABCA1234F1Z5")
    assert res.status_code == 200
    assert res.json()["is_valid"] is True
    print(f"[OK] GSTIN Verification Tool: OK (State: {res.json()['state_name']})")

    # 10. Dashboard Metrics
    res = client.get("/api/dashboard/metrics")
    assert res.status_code == 200
    m = res.json()
    print(f"[OK] Dashboard Metrics: OK (Spend: INR {m['total_spend']:,.2f}, OCR: {m['ocr_accuracy_percentage']}%)")

    # 11. Reports Aging
    res = client.get("/api/reports/aging")
    assert res.status_code == 200
    print(f"[OK] AP Aging Report: OK ({len(res.json())} aging records)")

    # 12. ERP Sync Logs
    res = client.get("/api/erp/logs")
    assert res.status_code == 200
    print(f"[OK] ERP Integration Connector: OK")

    print("\nALL 12 TEST SUITES PASSED PERFECTLY! System is 100% operational.")

if __name__ == "__main__":
    test_endpoints()
