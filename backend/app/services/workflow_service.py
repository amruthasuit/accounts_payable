from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models import Invoice, ApprovalTask, ApprovalMatrix, User, AuditLog
from ..config import settings

class WorkflowService:
    @staticmethod
    def initialize_approval_workflow(db: Session, invoice: Invoice) -> Optional[ApprovalTask]:
        """
        Determines the required approval steps from the Approval Matrix based on
        invoice amount and department, and creates the first pending task.
        """
        # Remove any existing pending tasks for this invoice
        db.query(ApprovalTask).filter(
            ApprovalTask.invoice_id == invoice.id,
            ApprovalTask.status == "Pending"
        ).delete()

        # Find matching matrix rule for Step 1
        matrix_rules = db.query(ApprovalMatrix).filter(
            ApprovalMatrix.is_active == True,
            ApprovalMatrix.min_amount <= invoice.total_amount,
            ApprovalMatrix.max_amount >= invoice.total_amount
        ).order_by(ApprovalMatrix.step_number.asc()).all()

        if not matrix_rules:
            # Fallback default rules based on amount
            if invoice.total_amount <= settings.AUTO_APPROVE_LIMIT:
                role = "AP Clerk"
            elif invoice.total_amount <= settings.MANAGER_APPROVE_LIMIT:
                role = "Approver"
            else:
                role = "Finance Director"
            
            task = ApprovalTask(
                invoice_id=invoice.id,
                step_number=1,
                assigned_role=role,
                status="Pending",
                comments=f"Automated approval routing based on amount: ₹{invoice.total_amount:,.2f}"
            )
            db.add(task)
            invoice.status = "Pending Approval"
            invoice.assigned_to_role = role
            invoice.current_approval_step = 1
            db.commit()
            return task

        first_rule = matrix_rules[0]
        task = ApprovalTask(
            invoice_id=invoice.id,
            step_number=first_rule.step_number,
            assigned_role=first_rule.required_role,
            status="Pending",
            comments=f"Routing to {first_rule.required_role} (SLA: {first_rule.sla_hours}h)"
        )
        db.add(task)
        invoice.status = "Pending Approval"
        invoice.assigned_to_role = first_rule.required_role
        invoice.current_approval_step = first_rule.step_number
        db.commit()
        return task

    @staticmethod
    def process_action(
        db: Session,
        invoice: Invoice,
        action: str,
        comments: str = "",
        actor_name: str = "Finance User",
        actor_role: str = "Approver"
    ) -> Dict[str, Any]:
        """
        Handles APPROVE, REJECT, ESCALATE, or REMINDER for the current pending approval task.
        """
        task = db.query(ApprovalTask).filter(
            ApprovalTask.invoice_id == invoice.id,
            ApprovalTask.status.in_(["Pending", "Escalated"])
        ).first()

        now = datetime.utcnow()

        if action.upper() == "APPROVE":
            if task:
                task.status = "Approved"
                task.actioned_at = now
                task.actioned_by = f"{actor_name} ({actor_role})"
                task.comments = comments or "Approved without reservation"

            # Check if there is a next step required in the matrix
            next_rule = db.query(ApprovalMatrix).filter(
                ApprovalMatrix.is_active == True,
                ApprovalMatrix.min_amount <= invoice.total_amount,
                ApprovalMatrix.max_amount >= invoice.total_amount,
                ApprovalMatrix.step_number > invoice.current_approval_step
            ).order_by(ApprovalMatrix.step_number.asc()).first()

            if next_rule:
                # Progress to next step
                invoice.current_approval_step = next_rule.step_number
                invoice.assigned_to_role = next_rule.required_role
                next_task = ApprovalTask(
                    invoice_id=invoice.id,
                    step_number=next_rule.step_number,
                    assigned_role=next_rule.required_role,
                    status="Pending",
                    comments=f"Step {next_rule.step_number}: Escalated to {next_rule.required_role}"
                )
                db.add(next_task)
            else:
                # Final Approval Completed
                invoice.status = "Approved"
                invoice.assigned_to_role = "Finance Treasury"

            # Audit Log
            audit = AuditLog(
                action="INVOICE_APPROVED",
                entity_type="Invoice",
                entity_id=str(invoice.id),
                actor_name=actor_name,
                actor_role=actor_role,
                details=f"Invoice #{invoice.invoice_number} approved. Status now: {invoice.status}. Comments: {comments}"
            )
            db.add(audit)
            db.commit()
            return {"status": "success", "invoice_status": invoice.status, "message": f"Invoice #{invoice.invoice_number} approved successfully."}

        elif action.upper() == "REJECT":
            if task:
                task.status = "Rejected"
                task.actioned_at = now
                task.actioned_by = f"{actor_name} ({actor_role})"
                task.comments = comments or "Rejected by reviewer"

            invoice.status = "Rejected"
            invoice.rejection_reason = comments or "Rejected during workflow approval."
            
            audit = AuditLog(
                action="INVOICE_REJECTED",
                entity_type="Invoice",
                entity_id=str(invoice.id),
                actor_name=actor_name,
                actor_role=actor_role,
                details=f"Invoice #{invoice.invoice_number} rejected. Reason: {comments}"
            )
            db.add(audit)
            db.commit()
            return {"status": "rejected", "invoice_status": "Rejected", "message": f"Invoice #{invoice.invoice_number} has been rejected."}

        elif action.upper() == "ESCALATE":
            if task:
                task.status = "Escalated"
                task.comments = f"Escalated by {actor_name}: {comments}"

            invoice.is_escalated = True
            invoice.escalation_reason = comments or "SLA breached or manual escalation requested."
            invoice.assigned_to_role = "Finance Director"

            audit = AuditLog(
                action="INVOICE_ESCALATED",
                entity_type="Invoice",
                entity_id=str(invoice.id),
                actor_name=actor_name,
                actor_role=actor_role,
                details=f"Invoice #{invoice.invoice_number} escalated to Finance Director. Reason: {comments}"
            )
            db.add(audit)
            db.commit()
            return {"status": "escalated", "invoice_status": invoice.status, "message": f"Invoice #{invoice.invoice_number} escalated to executive review."}

        elif action.upper() == "REMINDER":
            if task:
                task.reminders_sent = (task.reminders_sent or 0) + 1
            
            audit = AuditLog(
                action="APPROVAL_REMINDER_SENT",
                entity_type="Invoice",
                entity_id=str(invoice.id),
                actor_name=actor_name,
                actor_role=actor_role,
                details=f"Reminder #{task.reminders_sent if task else 1} dispatched to {invoice.assigned_to_role}."
            )
            db.add(audit)
            db.commit()
            return {"status": "reminder_sent", "reminders_sent": task.reminders_sent if task else 1, "message": "Notification reminder dispatched to approver."}

        return {"status": "error", "message": f"Unknown action: {action}"}
