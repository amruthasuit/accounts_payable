import React, { useState, useEffect } from 'react';
import api from '../api';
import { useRole } from '../context/RoleContext';
import { 
  CheckSquare, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Bell, 
  UserCheck, 
  RefreshCw, 
  Sliders, 
  Building, 
  DollarSign,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export const ApprovalsPage = ({ setActiveTab, setSelectedInvoiceId }) => {
  const { currentUser } = useRole();
  const [inboxInvoices, setInboxInvoices] = useState([]);
  const [matrixRules, setMatrixRules] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('inbox'); // 'inbox', 'matrix'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [commentsMap, setCommentsMap] = useState({});
  const [message, setMessage] = useState('');

  const fetchApprovalData = async () => {
    try {
      setLoading(true);
      const [inboxRes, matrixRes] = await Promise.all([
        api.get('/approvals/inbox', { params: { role: currentUser.role } }),
        api.get('/approvals/matrix')
      ]);
      setInboxInvoices(inboxRes.data);
      setMatrixRules(matrixRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovalData();
  }, [currentUser]);

  const handleAction = async (invoiceId, action) => {
    try {
      setActionLoading(`${invoiceId}-${action}`);
      setMessage('');
      const comments = commentsMap[invoiceId] || '';

      const res = await api.post(`/approvals/${invoiceId}/action`, {
        action: action,
        comments: comments,
        actor_name: currentUser.name,
        actor_role: currentUser.role
      });

      setMessage(res.data.message || `Invoice ${action.toLowerCase()}ed successfully.`);
      fetchApprovalData();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.detail || 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#232936] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#0D9488]"></span>
            <h1 className="text-lg font-semibold text-[#E5E9F0] tracking-tight">Invoice Authorization & Sign-off Queue</h1>
          </div>
          <p className="text-xs text-[#7E8799] mt-0.5">
            Role-based authorization queue according to fiscal limits and departmental matrix policies
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center space-x-1 bg-[#121620] p-1 rounded-sm border border-[#232936] text-xs">
          <button
            onClick={() => setActiveSubTab('inbox')}
            className={`px-3 py-1 rounded-xs transition text-xs font-medium ${
              activeSubTab === 'inbox' ? 'bg-[#1E2534] text-white border border-[#2E374A]' : 'text-[#8C96A8] hover:text-[#E5E9F0]'
            }`}
          >
            Pending queue ({inboxInvoices.length})
          </button>
          <button
            onClick={() => setActiveSubTab('matrix')}
            className={`px-3 py-1 rounded-xs transition text-xs font-medium ${
              activeSubTab === 'matrix' ? 'bg-[#1E2534] text-white border border-[#2E374A]' : 'text-[#8C96A8] hover:text-[#E5E9F0]'
            }`}
          >
            Policy threshold matrix
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-[#0D9488]/15 border border-[#0D9488]/30 rounded-sm text-[#2DD4BF] text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-[#2DD4BF] shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Approver Context Ribbon */}
      <div className="bg-[#121620] border border-[#232936] px-4 py-2.5 rounded-sm flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-[#7E8799]">Signed in as:</span>
          <strong className="text-[#E5E9F0] font-medium">{currentUser.name}</strong>
          <span className="text-[#8C96A8] font-mono text-[11px]">({currentUser.role} / Limit: {currentUser.approvalLimit})</span>
        </div>
        <div className="text-[11px] text-[#64718A] font-mono">
          Scope: {currentUser.role === 'Admin' ? 'All tiers (administrative bypass enabled)' : currentUser.role}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="w-6 h-6 text-[#0D9488] animate-spin" />
        </div>
      ) : activeSubTab === 'inbox' ? (
        inboxInvoices.length === 0 ? (
          <div className="p-12 text-center bg-[#121620] rounded-sm border border-[#232936] space-y-2">
            <CheckCircle2 className="w-7 h-7 text-[#2DD4BF] mx-auto" />
            <h3 className="text-xs font-semibold text-[#E5E9F0]">Queue clear</h3>
            <p className="text-[11px] text-[#7E8799]">No invoices currently awaiting sign-off for {currentUser.role}.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {inboxInvoices.map((inv) => (
              <div key={inv.id} className="bg-[#121620] p-4 rounded-sm border border-[#232936] hover:border-[#282F3E] transition space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#1E2534] pb-2.5">
                  <div className="flex items-center space-x-2.5">
                    <button
                      onClick={() => {
                        setSelectedInvoiceId(inv.id);
                        setActiveTab('invoices');
                      }}
                      className="font-mono font-medium text-xs text-[#2DD4BF] hover:underline"
                    >
                      #{inv.invoice_number}
                    </button>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-xs border ${
                      inv.is_escalated 
                        ? 'bg-[#EF4444]/15 text-[#F87171] border-[#EF4444]/30' 
                        : 'bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/30'
                    }`}>
                      {inv.is_escalated ? 'Escalated to executive' : inv.status}
                    </span>
                    <span className="text-[10px] font-mono bg-[#181D28] text-[#8C96A8] px-2 py-0.5 rounded-xs border border-[#232936]">
                      Step {inv.current_approval_step}: {inv.assigned_to_role}
                    </span>
                  </div>

                  <div className="text-right flex items-center space-x-3">
                    <div>
                      <span className="text-[10px] text-[#64718A] block font-mono">Gross payable</span>
                      <div className="text-sm font-semibold font-mono text-[#E5E9F0]">
                        ₹{(inv.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[#64718A] block text-[10px] font-mono">Vendor</span>
                    <span className="font-medium text-[#E5E9F0] truncate block">{inv.vendor_name_raw}</span>
                  </div>
                  <div>
                    <span className="text-[#64718A] block text-[10px] font-mono">PO number</span>
                    <span className="font-mono text-[#C4CBD8]">{inv.po_number_raw || 'No PO attached'}</span>
                  </div>
                  <div>
                    <span className="text-[#64718A] block text-[10px] font-mono">Matching verification</span>
                    <span className="font-mono text-[#2DD4BF]">{inv.match_status}</span>
                  </div>
                  <div>
                    <span className="text-[#64718A] block text-[10px] font-mono">OCR score</span>
                    <span className="font-mono text-[#E5E9F0]">{inv.ocr_accuracy_score}%</span>
                  </div>
                </div>

                {inv.escalation_reason && (
                  <div className="p-2.5 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-sm text-[#F87171] text-xs flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-[#EF4444]" />
                    <span><strong>Escalation note:</strong> {inv.escalation_reason}</span>
                  </div>
                )}

                {/* Approval Comments & Action Buttons */}
                <div className="flex flex-col md:flex-row items-center gap-2 pt-2.5 border-t border-[#1E2534]">
                  <input
                    type="text"
                    placeholder="Enter approval note or sign-off reasoning..."
                    value={commentsMap[inv.id] || ''}
                    onChange={(e) => setCommentsMap({ ...commentsMap, [inv.id]: e.target.value })}
                    className="w-full md:flex-1 bg-[#181D28] border border-[#282F3E] rounded-sm px-3 py-1.5 text-xs text-[#E5E9F0] outline-none focus:border-[#0D9488]"
                  />

                  <div className="flex items-center space-x-1.5 w-full md:w-auto justify-end">
                    <button
                      onClick={() => handleAction(inv.id, 'REMINDER')}
                      disabled={actionLoading === `${inv.id}-REMINDER`}
                      className="px-2.5 py-1.5 bg-[#181D28] hover:bg-[#1E2534] border border-[#282F3E] text-[#C4CBD8] rounded-sm text-xs font-medium transition flex items-center gap-1"
                      title="Send reminder notice"
                    >
                      <Bell className="w-3.5 h-3.5 text-[#7E8799]" />
                      <span>Remind</span>
                    </button>

                    <button
                      onClick={() => handleAction(inv.id, 'ESCALATE')}
                      disabled={actionLoading === `${inv.id}-ESCALATE`}
                      className="px-2.5 py-1.5 bg-[#F59E0B]/15 hover:bg-[#F59E0B]/25 text-[#FBBF24] border border-[#F59E0B]/30 rounded-sm text-xs font-medium transition"
                    >
                      Escalate
                    </button>

                    <button
                      onClick={() => handleAction(inv.id, 'REJECT')}
                      disabled={actionLoading === `${inv.id}-REJECT`}
                      className="px-2.5 py-1.5 bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#F87171] border border-[#EF4444]/30 rounded-sm text-xs font-medium transition"
                    >
                      Reject
                    </button>

                    <button
                      onClick={() => handleAction(inv.id, 'APPROVE')}
                      disabled={actionLoading === `${inv.id}-APPROVE`}
                      className="px-3.5 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-sm text-xs font-medium shadow-2xs transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Sign-off</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* APPROVAL POLICY MATRIX TABLE */
        <div className="bg-[#121620] p-4 rounded-sm border border-[#232936] space-y-3">
          <div className="border-b border-[#1E2534] pb-2.5">
            <h2 className="text-xs font-semibold text-[#E5E9F0]">Configured authorization threshold policies</h2>
            <p className="text-[11px] text-[#7E8799]">
              Corporate approval tiers based on invoice monetary value, cost center, and SLA expectations
            </p>
          </div>

          <div className="overflow-x-auto border border-[#232936] rounded-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#181D28] text-[10px] text-[#8C96A8] border-b border-[#232936]">
                  <th className="py-2.5 px-3 font-medium">Policy tier</th>
                  <th className="py-2.5 px-3 font-medium">Min amount</th>
                  <th className="py-2.5 px-3 font-medium">Max amount</th>
                  <th className="py-2.5 px-3 font-medium">Department</th>
                  <th className="py-2.5 px-3 font-medium">Authorized role</th>
                  <th className="py-2.5 px-3 text-center font-medium">SLA benchmark</th>
                  <th className="py-2.5 px-3 text-center font-medium">Policy status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2534] font-mono text-[11px]">
                {matrixRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-[#181D28]/60 transition">
                    <td className="py-2.5 px-3 font-sans font-medium text-[#E5E9F0]">Step {rule.step_number}</td>
                    <td className="py-2.5 px-3">₹{rule.min_amount.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3">₹{rule.max_amount.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 font-sans text-[#8C96A8]">{rule.department}</td>
                    <td className="py-2.5 px-3 font-sans font-medium text-[#C4CBD8]">{rule.required_role}</td>
                    <td className="py-2.5 px-3 text-center text-[#8C96A8]">{rule.sla_hours} hours</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] font-mono text-[#2DD4BF] bg-[#0D9488]/15 px-2 py-0.5 rounded-xs border border-[#0D9488]/30">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
