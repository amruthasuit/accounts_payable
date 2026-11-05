import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  CreditCard, 
  CheckCircle2, 
  Download, 
  RefreshCw, 
  FileText, 
  Send, 
  ExternalLink,
  Building,
  DollarSign,
  Layers,
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export const PaymentsPage = () => {
  const [batches, setBatches] = useState([]);
  const [approvedInvoices, setApprovedInvoices] = useState([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);
  const [formatType, setFormatType] = useState('NEFT_RTGS_CSV');
  const [bankName, setBankName] = useState('HDFC Bank Corporate Direct');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [adviceModalUrl, setAdviceModalUrl] = useState(null);
  const [message, setMessage] = useState('');

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      const [batchesRes, invoicesRes] = await Promise.all([
        api.get('/payments/batches'),
        api.get('/invoices/', { params: { status: 'Approved' } })
      ]);
      setBatches(batchesRes.data);
      setApprovedInvoices(invoicesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const handleToggleSelect = (id) => {
    setSelectedInvoiceIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedInvoiceIds.length === approvedInvoices.length) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(approvedInvoices.map(i => i.id));
    }
  };

  const handleCreateBatch = async () => {
    if (selectedInvoiceIds.length === 0) return;
    try {
      setActionLoading('create_batch');
      setMessage('');
      const res = await api.post('/payments/batches', {
        invoice_ids: selectedInvoiceIds,
        bank_name: bankName,
        format_type: formatType
      });
      setMessage(`Payment run ${res.data.batch_reference} created with ${res.data.invoice_count} approved invoices.`);
      setSelectedInvoiceIds([]);
      fetchPaymentData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create payment batch.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExecutePayout = async (batchId) => {
    try {
      setActionLoading(`execute_${batchId}`);
      setMessage('');
      const res = await api.post(`/payments/batches/${batchId}/execute`);
      setMessage(res.data.message || 'Bank execution completed. Payouts settled!');
      fetchPaymentData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Bank execution failed.');
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
            <h1 className="text-lg font-semibold text-[#E5E9F0] tracking-tight">Payment Disbursement Runs</h1>
          </div>
          <p className="text-xs text-[#7E8799] mt-0.5">
            Prepare banking payment runs, export NEFT/RTGS clearing files, and execute Host-to-Host direct bank settlements
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-[#0D9488]/15 border border-[#0D9488]/30 rounded-sm text-[#2DD4BF] text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-[#2DD4BF] shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Approved Invoices Awaiting Payment Run */}
      <div className="bg-[#121620] p-4 rounded-sm border border-[#232936] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#1E2534] pb-2.5">
          <div>
            <h2 className="text-xs font-semibold text-[#E5E9F0]">Approved invoices ready for payment ({approvedInvoices.length})</h2>
            <p className="text-[11px] text-[#7E8799]">Group authorized invoices into a banking disbursement batch</p>
          </div>

          {approvedInvoices.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={formatType}
                onChange={(e) => setFormatType(e.target.value)}
                className="bg-[#181D28] border border-[#282F3E] text-xs text-[#E5E9F0] rounded-sm px-2.5 py-1.5 outline-none font-mono"
              >
                <option value="NEFT_RTGS_CSV">NEFT / RTGS Corporate CSV (HDFC/ICICI)</option>
                <option value="ISO20022_XML">ISO 20022 pain.001 XML</option>
              </select>

              <button
                onClick={handleCreateBatch}
                disabled={selectedInvoiceIds.length === 0 || actionLoading === 'create_batch'}
                className="px-3 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-medium text-xs rounded-sm shadow-2xs disabled:opacity-50 transition flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Create payment batch ({selectedInvoiceIds.length})</span>
              </button>
            </div>
          )}
        </div>

        {approvedInvoices.length === 0 ? (
          <div className="p-6 text-center text-[#7E8799] bg-[#181D28] rounded-sm border border-[#232936] text-xs font-mono">
            No approved invoices pending payment. Invoices must be signed-off by the designated approver before disbursement.
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#232936] rounded-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#181D28] text-[10px] text-[#8C96A8] border-b border-[#232936]">
                  <th className="py-2 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedInvoiceIds.length === approvedInvoices.length && approvedInvoices.length > 0}
                      onChange={handleSelectAll}
                      className="rounded-xs cursor-pointer accent-[#0D9488]"
                    />
                  </th>
                  <th className="py-2 px-3 font-medium">Invoice #</th>
                  <th className="py-2 px-3 font-medium">Vendor entity</th>
                  <th className="py-2 px-3 font-medium">Beneficiary account</th>
                  <th className="py-2 px-3 text-right font-medium">Gross amount</th>
                  <th className="py-2 px-3 text-center font-medium">Authorization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2534]">
                {approvedInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#181D28]/60 transition">
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={selectedInvoiceIds.includes(inv.id)}
                        onChange={() => handleToggleSelect(inv.id)}
                        className="rounded-xs cursor-pointer accent-[#0D9488]"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-[#2DD4BF]">{inv.invoice_number}</td>
                    <td className="py-2.5 px-3 font-medium text-[#E5E9F0]">{inv.vendor_name_raw}</td>
                    <td className="py-2.5 px-3 text-[#8C96A8] font-mono text-[11px]">
                      {inv.vendor?.bank_accounts?.[0]?.bank_name || 'HDFC Bank'} / A/C: {inv.vendor?.bank_accounts?.[0]?.account_number || '5020...'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-[#E5E9F0]">
                      ₹{(inv.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] font-mono text-[#2DD4BF] bg-[#0D9488]/15 border border-[#0D9488]/30 px-2 py-0.5 rounded-xs">
                        Approved
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Batches & Bank Settlement History */}
      <div className="bg-[#121620] p-4 rounded-sm border border-[#232936] space-y-3">
        <div className="border-b border-[#1E2534] pb-2.5">
          <h2 className="text-xs font-semibold text-[#E5E9F0]">Disbursement runs & settlement records</h2>
          <p className="text-[11px] text-[#7E8799]">Monitor bank payout execution, download transmission files, and inspect remittance advice</p>
        </div>

        {batches.length === 0 ? (
          <div className="p-6 text-center text-[#7E8799] bg-[#181D28] rounded-sm border border-[#232936] text-xs font-mono">
            No payment runs created yet.
          </div>
        ) : (
          <div className="space-y-3">
            {batches.map((batch) => (
              <div key={batch.id} className="border border-[#232936] rounded-sm p-3.5 bg-[#181D28] hover:border-[#282F3E] transition space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#232936] pb-2.5">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono font-medium text-xs text-[#E5E9F0]">{batch.batch_reference}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-xs border ${
                      batch.status === 'Settled'
                        ? 'bg-[#0D9488]/15 text-[#2DD4BF] border-[#0D9488]/30'
                        : 'bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/30'
                    }`}>
                      {batch.status}
                    </span>
                    <span className="text-[11px] text-[#8C96A8] font-mono">
                      {batch.invoice_count} invoices via {batch.bank_name}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className="text-[10px] text-[#64718A] block font-mono">Run total</span>
                      <div className="text-sm font-semibold font-mono text-[#E5E9F0]">
                        ₹{batch.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <a
                      href={`/api/payments/batches/${batch.id}/download-file`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-[#121620] hover:bg-[#1E2534] border border-[#282F3E] text-[#C4CBD8] font-medium text-xs rounded-sm transition flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Bank CSV</span>
                    </a>

                    {batch.status !== 'Settled' && (
                      <button
                        onClick={() => handleExecutePayout(batch.id)}
                        disabled={actionLoading === `execute_${batch.id}`}
                        className="px-3 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-medium text-xs rounded-sm shadow-2xs transition flex items-center gap-1.5"
                      >
                        {actionLoading === `execute_${batch.id}` ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Execute payout (Host-to-Host)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Transactions Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-[10px] text-[#8C96A8] border-b border-[#232936]">
                        <th className="py-1.5 font-medium">Tx ID</th>
                        <th className="py-1.5 font-medium">Invoice #</th>
                        <th className="py-1.5 font-medium">Mode</th>
                        <th className="py-1.5 font-medium">Bank UTR reference</th>
                        <th className="py-1.5 text-right font-medium">Amount</th>
                        <th className="py-1.5 text-center font-medium">Remittance advice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#232936] font-mono text-[11px]">
                      {batch.transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-[#121620]/60">
                          <td className="py-2 text-[#64718A]">#{tx.id}</td>
                          <td className="py-2 font-medium text-[#C4CBD8]">INV-{tx.invoice_id}</td>
                          <td className="py-2">
                            <span className="text-[10px] font-mono bg-[#121620] px-1.5 py-0.2 rounded-xs border border-[#232936] text-[#8C96A8]">
                              {tx.payment_method}
                            </span>
                          </td>
                          <td className="py-2 text-[#2DD4BF]">
                            {tx.utr_number || 'Pending settlement'}
                          </td>
                          <td className="py-2 text-right font-medium text-[#E5E9F0]">
                            ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 text-center font-sans">
                            {tx.status === 'Settled' ? (
                              <button
                                onClick={() => setAdviceModalUrl(`/api/payments/advice/${tx.id}`)}
                                className="text-xs text-[#2DD4BF] hover:underline font-medium inline-flex items-center gap-1"
                              >
                                <span>Advice sheet</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            ) : (
                              <span className="text-[#64718A] text-[11px]">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Remittance Advice Modal */}
      {adviceModalUrl && (
        <div className="fixed inset-0 bg-[#0E1117]/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#121620] rounded-sm max-w-3xl w-full p-4 shadow-2xl space-y-3 max-h-[90vh] flex flex-col border border-[#282F3E]">
            <div className="flex items-center justify-between border-b border-[#232936] pb-2.5">
              <h2 className="text-xs font-semibold text-[#E5E9F0]">Settlement remittance advice sheet</h2>
              <button onClick={() => setAdviceModalUrl(null)} className="text-[#7E8799] hover:text-[#E5E9F0]">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden border border-[#232936] rounded-sm">
              <iframe
                src={adviceModalUrl}
                title="Remittance Advice"
                className="w-full h-[520px] border-none bg-white"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={() => setAdviceModalUrl(null)}
                className="px-3.5 py-1.5 bg-[#181D28] hover:bg-[#1E2534] border border-[#282F3E] text-[#E5E9F0] rounded-sm text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
