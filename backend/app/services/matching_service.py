from typing import Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from ..models import Invoice, PurchaseOrder, GoodsReceiptNote, POMatchResult
from ..config import settings

class MatchingService:
    @staticmethod
    def run_matching(
        db: Session, 
        invoice: Invoice, 
        force_type: Optional[str] = None, 
        tolerance_percent: float = None
    ) -> POMatchResult:
        """
        Executes 2-Way or 3-Way matching.
        If GRN exists for the PO -> conducts 3-Way match (PO vs GRN vs Invoice).
        Otherwise -> conducts 2-Way match (PO vs Invoice).
        """
        if tolerance_percent is None:
            tolerance_percent = settings.PRICE_TOLERANCE_PERCENT
            
        # Delete existing match results for this invoice
        db.query(POMatchResult).filter(POMatchResult.invoice_id == invoice.id).delete()

        po = None
        if invoice.po_number_raw:
            po = db.query(PurchaseOrder).filter(
                PurchaseOrder.po_number == invoice.po_number_raw.strip()
            ).first()

        # If not found by raw PO number, check vendor open POs
        if not po and invoice.vendor_id:
            po = db.query(PurchaseOrder).filter(
                PurchaseOrder.vendor_id == invoice.vendor_id,
                PurchaseOrder.status.in_(["Open", "Partially Received", "Received"])
            ).first()

        if not po:
            result = POMatchResult(
                invoice_id=invoice.id,
                po_id=None,
                grn_id=None,
                match_type=force_type or "2-Way",
                status="Missing PO",
                variance_amount=invoice.total_amount,
                tolerance_applied=tolerance_percent,
                within_tolerance=False,
                details_json={"message": f"No Purchase Order found for PO reference '{invoice.po_number_raw}'."}
            )
            invoice.match_status = "Match Exception"
            db.add(result)
            db.commit()
            return result

        # Check for associated Goods Receipt Note (GRN)
        grn = db.query(GoodsReceiptNote).filter(
            GoodsReceiptNote.po_id == po.id,
            GoodsReceiptNote.status == "Accepted"
        ).first()

        match_type = force_type or ("3-Way" if grn else "2-Way")
        
        # Line-by-line comparison
        line_comparisons = []
        has_price_variance = False
        has_qty_variance = False
        total_price_diff = 0.0

        for inv_line in invoice.line_items:
            # Match by line number or description similarity
            matched_po_line = None
            for po_line in po.lines:
                if po_line.line_number == inv_line.line_number:
                    matched_po_line = po_line
                    break
                elif po_line.item_description.lower() in inv_line.description.lower() or inv_line.description.lower() in po_line.item_description.lower():
                    matched_po_line = po_line
                    break
            
            if not matched_po_line and len(po.lines) > 0:
                matched_po_line = po.lines[0]

            po_price = matched_po_line.unit_price if matched_po_line else inv_line.unit_price
            po_qty = matched_po_line.quantity if matched_po_line else inv_line.quantity
            
            # Unit price difference
            price_diff = inv_line.unit_price - po_price
            price_pct_diff = (abs(price_diff) / po_price * 100.0) if po_price > 0 else 0.0
            price_within_tol = price_pct_diff <= tolerance_percent
            
            if not price_within_tol:
                has_price_variance = True
                
            total_price_diff += (price_diff * inv_line.quantity)

            # GRN comparison if 3-Way
            grn_qty = po_qty
            grn_status = "N/A"
            if grn and matched_po_line:
                for grn_line in grn.lines:
                    if grn_line.po_line_id == matched_po_line.id:
                        grn_qty = grn_line.quantity_accepted
                        break
                        
            # Check quantity
            if match_type == "3-Way":
                qty_valid = (inv_line.quantity <= grn_qty)
                if not qty_valid:
                    has_qty_variance = True
            else:
                qty_valid = (inv_line.quantity <= po_qty)
                if not qty_valid:
                    has_qty_variance = True

            line_comparisons.append({
                "line_number": inv_line.line_number,
                "item_description": inv_line.description,
                "invoice_qty": inv_line.quantity,
                "po_qty": po_qty,
                "grn_qty": grn_qty if match_type == "3-Way" else None,
                "invoice_unit_price": inv_line.unit_price,
                "po_unit_price": po_price,
                "price_diff_percent": round(price_pct_diff, 2),
                "price_within_tolerance": price_within_tol,
                "quantity_valid": qty_valid
            })

        # Overall Status
        variance_amount = round(invoice.total_amount - po.total_amount, 2)
        total_pct_diff = (abs(variance_amount) / po.total_amount * 100.0) if po.total_amount > 0 else 0.0
        overall_within_tol = total_pct_diff <= tolerance_percent and not has_qty_variance

        status = "Matched"
        if has_qty_variance:
            status = "Quantity Variance Exception"
        elif has_price_variance or not overall_within_tol:
            status = "Price Variance Exception"

        result = POMatchResult(
            invoice_id=invoice.id,
            po_id=po.id,
            grn_id=grn.id if grn else None,
            match_type=match_type,
            status=status,
            variance_amount=variance_amount,
            tolerance_applied=tolerance_percent,
            within_tolerance=overall_within_tol,
            details_json={
                "po_number": po.po_number,
                "po_total": po.total_amount,
                "invoice_total": invoice.total_amount,
                "grn_number": grn.grn_number if grn else None,
                "tolerance_percent": tolerance_percent,
                "line_comparisons": line_comparisons
            }
        )
        
        db.add(result)
        
        if overall_within_tol and status == "Matched":
            invoice.match_status = f"{match_type} Matched"
            # Advance invoice status
            invoice.status = "Matched"
        else:
            invoice.match_status = "Match Exception"
            invoice.status = "Match Exception"

        db.commit()
        return result
