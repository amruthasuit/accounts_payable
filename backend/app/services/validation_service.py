import re
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from ..models import Invoice, Vendor, ValidationResult
from ..config import settings

class ValidationService:
    @staticmethod
    def run_all_validations(db: Session, invoice: Invoice) -> Tuple[bool, List[Dict[str, Any]]]:
        """
        Executes all 5 core validation checks for the invoice:
        1. Mandatory field validation
        2. Duplicate invoice validation
        3. GST/tax validation
        4. Amount validation
        5. Vendor master validation
        
        Returns (is_all_passed, results_list).
        """
        # Clear prior validation results for this invoice
        db.query(ValidationResult).filter(ValidationResult.invoice_id == invoice.id).delete()
        
        results = []
        
        # 1. Mandatory Fields Validation
        v1 = ValidationService._check_mandatory_fields(invoice)
        results.append(v1)
        
        # 2. Duplicate Invoice Validation
        v2 = ValidationService._check_duplicates(db, invoice)
        results.append(v2)
        
        # 3. GST & Tax Validation
        v3 = ValidationService._check_gst_and_tax(invoice)
        results.append(v3)
        
        # 4. Amount Mathematical Validation
        v4 = ValidationService._check_amount_math(invoice)
        results.append(v4)
        
        # 5. Vendor Master Validation
        v5 = ValidationService._check_vendor_master(db, invoice)
        results.append(v5)
        
        # Save results to DB
        all_passed = True
        for r in results:
            vr = ValidationResult(
                invoice_id=invoice.id,
                rule_code=r["rule_code"],
                rule_name=r["rule_name"],
                status=r["status"],
                severity=r["severity"],
                message=r["message"],
                details_json=r.get("details", {})
            )
            db.add(vr)
            if r["status"] == "Failed":
                all_passed = False
                
        # Update invoice status
        if all_passed:
            invoice.status = "Validated"
        else:
            invoice.status = "Validation Failed"
            
        db.commit()
        return all_passed, results

    @staticmethod
    def _check_mandatory_fields(invoice: Invoice) -> Dict[str, Any]:
        missing = []
        if not invoice.invoice_number or invoice.invoice_number.strip() == "":
            missing.append("Invoice Number")
        if not invoice.invoice_date:
            missing.append("Invoice Date")
        if not invoice.vendor_name_raw and not invoice.vendor_id:
            missing.append("Vendor Name")
        if invoice.total_amount is None or invoice.total_amount <= 0:
            missing.append("Grand Total Amount")
        if not invoice.line_items or len(invoice.line_items) == 0:
            missing.append("Line Items (Materials)")

        if missing:
            return {
                "rule_code": "MANDATORY_FIELDS",
                "rule_name": "Mandatory Fields Validation",
                "status": "Failed",
                "severity": "Critical",
                "message": f"Mandatory fields missing: {', '.join(missing)}",
                "details": {"missing_fields": missing}
            }
        return {
            "rule_code": "MANDATORY_FIELDS",
            "rule_name": "Mandatory Fields Validation",
            "status": "Passed",
            "severity": "Info",
            "message": "All mandatory header fields and line items are present and complete.",
            "details": {"checked": ["Invoice Number", "Date", "Vendor Name", "Total Amount", "Line Items"]}
        }

    @staticmethod
    def _check_duplicates(db: Session, invoice: Invoice) -> Dict[str, Any]:
        if not invoice.invoice_number:
            return {
                "rule_code": "DUPLICATE_CHECK",
                "rule_name": "Duplicate Invoice Validation",
                "status": "Failed",
                "severity": "Critical",
                "message": "Cannot check duplicates without an invoice number.",
                "details": {}
            }
            
        # Check if an existing invoice has the same invoice number for the same vendor
        query = db.query(Invoice).filter(
            Invoice.id != invoice.id,
            Invoice.invoice_number == invoice.invoice_number
        )
        
        if invoice.vendor_id:
            query = query.filter(Invoice.vendor_id == invoice.vendor_id)
        elif invoice.vendor_name_raw:
            query = query.filter(Invoice.vendor_name_raw == invoice.vendor_name_raw)

        duplicates = query.all()
        if duplicates:
            dup_ids = [d.id for d in duplicates]
            return {
                "rule_code": "DUPLICATE_CHECK",
                "rule_name": "Duplicate Invoice Validation",
                "status": "Failed",
                "severity": "Critical",
                "message": f"Potential duplicate detected! Matching invoice #{invoice.invoice_number} already exists (Invoice ID: {dup_ids}).",
                "details": {"duplicate_invoice_ids": dup_ids}
            }
        
        return {
            "rule_code": "DUPLICATE_CHECK",
            "rule_name": "Duplicate Invoice Validation",
            "status": "Passed",
            "severity": "Info",
            "message": f"No duplicate found for Invoice #{invoice.invoice_number}.",
            "details": {"checked_number": invoice.invoice_number}
        }

    @staticmethod
    def _check_gst_and_tax(invoice: Invoice) -> Dict[str, Any]:
        gstin = invoice.vendor_gstin_raw or ""
        gst_regex = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
        
        warnings = []
        if not gstin:
            return {
                "rule_code": "GST_VALIDATION",
                "rule_name": "GST/Tax Validation",
                "status": "Warning",
                "severity": "Warning",
                "message": "Vendor GSTIN is missing. Input Tax Credit (ITC) cannot be claimed.",
                "details": {"gstin_provided": False}
            }
            
        if not re.match(gst_regex, gstin.strip()):
            return {
                "rule_code": "GST_VALIDATION",
                "rule_name": "GST/Tax Validation",
                "status": "Failed",
                "severity": "Critical",
                "message": f"Invalid GSTIN format: '{gstin}'. Standard 15-character alphanumeric GST format required.",
                "details": {"gstin": gstin, "format_valid": False}
            }

        # Check state code logic
        vendor_state_code = gstin[:2]
        buyer_state_code = settings.COMPANY_STATE_CODE  # "29" for Karnataka
        
        is_interstate = (vendor_state_code != buyer_state_code)
        
        if is_interstate:
            # Should have IGST, and CGST/SGST should be 0
            if (invoice.cgst_amount > 0 or invoice.sgst_amount > 0) and invoice.igst_amount == 0:
                return {
                    "rule_code": "GST_VALIDATION",
                    "rule_name": "GST/Tax Validation",
                    "status": "Failed",
                    "severity": "Critical",
                    "message": f"Tax Type Mismatch: Interstate transaction (Vendor State: {vendor_state_code}, Buyer State: {buyer_state_code}) must use IGST, but CGST/SGST was applied.",
                    "details": {"vendor_state_code": vendor_state_code, "buyer_state_code": buyer_state_code, "expected": "IGST"}
                }
        else:
            # Intrastate: CGST and SGST should be equal and IGST should be 0
            if invoice.igst_amount > 0 and (invoice.cgst_amount == 0 and invoice.sgst_amount == 0):
                return {
                    "rule_code": "GST_VALIDATION",
                    "rule_name": "GST/Tax Validation",
                    "status": "Failed",
                    "severity": "Critical",
                    "message": f"Tax Type Mismatch: Intrastate transaction (State Code: {buyer_state_code}) must use CGST + SGST, but IGST was charged.",
                    "details": {"state_code": buyer_state_code, "expected": "CGST+SGST"}
                }
            if abs(invoice.cgst_amount - invoice.sgst_amount) > 1.0:
                warnings.append(f"CGST (₹{invoice.cgst_amount}) and SGST (₹{invoice.sgst_amount}) must be equal for intrastate supplies.")

        if warnings:
            return {
                "rule_code": "GST_VALIDATION",
                "rule_name": "GST/Tax Validation",
                "status": "Warning",
                "severity": "Warning",
                "message": "; ".join(warnings),
                "details": {"warnings": warnings}
            }

        return {
            "rule_code": "GST_VALIDATION",
            "rule_name": "GST/Tax Validation",
            "status": "Passed",
            "severity": "Info",
            "message": f"GSTIN verified ({gstin}). Tax split is correct for {'Interstate (IGST)' if is_interstate else 'Intrastate (CGST+SGST)'}.",
            "details": {
                "gstin": gstin,
                "vendor_state_code": vendor_state_code,
                "type": "Interstate (IGST)" if is_interstate else "Intrastate (CGST+SGST)"
            }
        }

    @staticmethod
    def _check_amount_math(invoice: Invoice) -> Dict[str, Any]:
        lines_sum = sum(item.total_amount for item in invoice.line_items)
        subtotal = invoice.subtotal or 0.0
        tax_total = invoice.tax_amount or (invoice.cgst_amount + invoice.sgst_amount + invoice.igst_amount)
        discount = invoice.discount_amount or 0.0
        round_off = invoice.round_off or 0.0
        grand_total = invoice.total_amount or 0.0

        calculated_grand = subtotal + tax_total - discount + round_off
        
        # Check tolerance (₹1.00 rounding tolerance)
        diff_grand = abs(calculated_grand - grand_total)
        diff_lines = abs(lines_sum - grand_total)

        if diff_grand > 1.0:
            return {
                "rule_code": "AMOUNT_MATH",
                "rule_name": "Amount Calculation Validation",
                "status": "Failed",
                "severity": "Critical",
                "message": f"Arithmetic discrepancy: Subtotal (₹{subtotal:,.2f}) + Tax (₹{tax_total:,.2f}) - Discount (₹{discount:,.2f}) = ₹{calculated_grand:,.2f}, which does not match Grand Total ₹{grand_total:,.2f} (diff: ₹{diff_grand:.2f}).",
                "details": {
                    "subtotal": subtotal,
                    "tax_total": tax_total,
                    "calculated_grand": calculated_grand,
                    "invoice_grand": grand_total,
                    "difference": diff_grand
                }
            }

        if len(invoice.line_items) > 0 and diff_lines > 2.0:
            return {
                "rule_code": "AMOUNT_MATH",
                "rule_name": "Amount Calculation Validation",
                "status": "Warning",
                "severity": "Warning",
                "message": f"Sum of line items (₹{lines_sum:,.2f}) has variance against Grand Total (₹{grand_total:,.2f}).",
                "details": {"lines_sum": lines_sum, "grand_total": grand_total, "difference": diff_lines}
            }

        return {
            "rule_code": "AMOUNT_MATH",
            "rule_name": "Amount Calculation Validation",
            "status": "Passed",
            "severity": "Info",
            "message": f"Arithmetic verification passed. Subtotal + Taxes perfectly match Grand Total ₹{grand_total:,.2f}.",
            "details": {"calculated_grand": calculated_grand, "total_amount": grand_total}
        }

    @staticmethod
    def _check_vendor_master(db: Session, invoice: Invoice) -> Dict[str, Any]:
        vendor = None
        if invoice.vendor_id:
            vendor = db.query(Vendor).filter(Vendor.id == invoice.vendor_id).first()
        elif invoice.vendor_gstin_raw:
            vendor = db.query(Vendor).filter(Vendor.tax_id == invoice.vendor_gstin_raw).first()
        elif invoice.vendor_name_raw:
            vendor = db.query(Vendor).filter(Vendor.name.ilike(f"%{invoice.vendor_name_raw}%")).first()

        if not vendor:
            return {
                "rule_code": "VENDOR_MASTER",
                "rule_name": "Vendor Master Validation",
                "status": "Failed",
                "severity": "Critical",
                "message": f"Vendor '{invoice.vendor_name_raw or 'Unknown'}' is not registered in the Vendor Master database. Requires vendor onboarding.",
                "details": {"vendor_found": False}
            }

        # Update link if missing
        if not invoice.vendor_id:
            invoice.vendor_id = vendor.id

        if vendor.status == "Blacklisted":
            return {
                "rule_code": "VENDOR_MASTER",
                "rule_name": "Vendor Master Validation",
                "status": "Failed",
                "severity": "Critical",
                "message": f"Vendor '{vendor.name}' is BLACKLISTED. Invoice processing blocked by compliance policy.",
                "details": {"vendor_id": vendor.id, "vendor_status": vendor.status}
            }

        if vendor.status == "On Hold":
            return {
                "rule_code": "VENDOR_MASTER",
                "rule_name": "Vendor Master Validation",
                "status": "Warning",
                "severity": "Warning",
                "message": f"Vendor '{vendor.name}' is currently ON HOLD. Manual review required prior to payment.",
                "details": {"vendor_id": vendor.id, "vendor_status": vendor.status}
            }

        if not vendor.bank_accounts or len(vendor.bank_accounts) == 0:
            return {
                "rule_code": "VENDOR_MASTER",
                "rule_name": "Vendor Master Validation",
                "status": "Warning",
                "severity": "Warning",
                "message": f"Vendor '{vendor.name}' has no bank account on file. Payout processing will require banking setup.",
                "details": {"vendor_id": vendor.id, "has_bank_account": False}
            }

        return {
            "rule_code": "VENDOR_MASTER",
            "rule_name": "Vendor Master Validation",
            "status": "Passed",
            "severity": "Info",
            "message": f"Vendor verified: '{vendor.name}' (Code: {vendor.code}). Status: Active with verified bank details.",
            "details": {
                "vendor_id": vendor.id,
                "vendor_name": vendor.name,
                "code": vendor.code,
                "status": vendor.status
            }
        }
