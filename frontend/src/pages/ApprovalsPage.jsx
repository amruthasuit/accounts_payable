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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Invoice Approval Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based authorization queue according to fiscal limits and departmental matrix policies.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center space-x-1 bg-slate-200/80 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveSubTab('inbox')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeSubTab === 'inbox' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending Queue ({inboxInvoices.length})
          </button>
          <button
            onClick={() => setActiveSubTab('matrix')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeSubTab === 'matrix' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Policy Threshold Matrix
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Approver Context Ribbon */}
      <div className="bg-slate-900 text-white px-4 py-2.5 rounded-lg flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Signed In As:</span>
          <strong className="text-slate-200 font-semibold">{currentUser.name}</strong>
          <span className="text-slate-400 font-mono text-[11px]">({currentUser.role} • Limit: {currentUser.approvalLimit})</span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          Queue Scope: {currentUser.role === 'Admin' ? 'All Roles (Admin Privilege)' : currentUser.role}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="w-7 h-7 text-sky-600 animate-spin" />
        </div>
      ) : activeSubTab === 'inbox' ? (
        inboxInvoices.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Queue is Clear</h3>
            <p className="text-xs text-slate-500">No invoices currently awaiting sign-off for {currentUser.role}.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {inboxInvoices.map((inv) => (
              <div key={inv.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <button
                      onClick={() => {
                        setSelectedInvoiceId(inv.id);
                        setActiveTab('invoices');
                      }}
                      className="font-mono font-bold text-sm text-sky-700 hover:text-sky-900 hover:underline"
                    >
                      #{inv.invoice_number}
                    </button>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      inv.is_escalated 
                        ? 'bg-red-50 text-red-700 border border-red-200' 
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {inv.is_escalated ? 'Escalated to Executive' : inv.status}
                    </span>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      Step {inv.current_approval_step}: {inv.assigned_to_role}
                    </span>
                  </div>

                  <div className="text-right flex items-center space-x-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Payable Gross</span>
                      <div className="text-base font-bold font-mono text-slate-900">
                        ₹{(inv.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Vendor</span>
                    <span className="font-semibold text-slate-900 truncate block">{inv.vendor_name_raw}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">PO Number</span>
                    <span className="font-mono text-slate-700">{inv.po_number_raw || 'No PO Attached'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Matching Verification</span>
                    <span className="font-medium text-slate-800 font-mono">{inv.match_status}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">OCR Quality</span>
                    <span className="font-semibold text-slate-800 font-mono">{inv.ocr_accuracy_score}% Accuracy</span>
                  </div>
                </div>

                {inv.escalation_reason && (
                  <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg text-red-800 text-xs flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                    <span><strong>Escalation Flag:</strong> {inv.escalation_reason}</span>
                  </div>
                )}

                {/* Approval Comments & Action Buttons */}
                <div className="flex flex-col md:flex-row items-center gap-2.5 pt-3 border-t border-slate-100">
                  <input
                    type="text"
                    placeholder="Enter approval / rejection remarks..."
                    value={commentsMap[inv.id] || ''}
                    onChange={(e) => setCommentsMap({ ...commentsMap, [inv.id]: e.target.value })}
                    className="w-full md:flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-800"
                  />

                  <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                    <button
                      onClick={() => handleAction(inv.id, 'REMINDER')}
                      disabled={actionLoading === `${inv.id}-REMINDER`}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1 shadow-2xs"
                      title="Send notification reminder"
                    >
                      <Bell className="w-3.5 h-3.5 text-slate-500" />
                      <span>Remind</span>
                    </button>

                    <button
                      onClick={() => handleAction(inv.id, 'ESCALATE')}
                      disabled={actionLoading === `${inv.id}-ESCALATE`}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-medium transition"
                    >
                      Escalate
                    </button>

                    <button
                      onClick={() => handleAction(inv.id, 'REJECT')}
                      disabled={actionLoading === `${inv.id}-REJECT`}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-medium transition"
                    >
                      Reject
                    </button>

                    <button
                      onClick={() => handleAction(inv.id, 'APPROVE')}
                      disabled={actionLoading === `${inv.id}-APPROVE`}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
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
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Configured Authorization Threshold Policies</h2>
            <p className="text-xs text-slate-500">
              Corporate approval thresholds based on invoice monetary value, cost center, and SLA expectations.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase border-b">
                  <th className="py-2.5 px-3">Policy Tier</th>
                  <th className="py-2.5 px-3">Min Amount</th>
                  <th className="py-2.5 px-3">Max Amount</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Authorized Role</th>
                  <th className="py-2.5 px-3 text-center">SLA Target</th>
                  <th className="py-2.5 px-3 text-center">Policy Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {matrixRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-900">Step {rule.step_number}</td>
                    <td className="py-2.5 px-3">₹{rule.min_amount.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3">₹{rule.max_amount.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-700">{rule.department}</td>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">{rule.required_role}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{rule.sla_hours} Hours</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] font-sans font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
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
