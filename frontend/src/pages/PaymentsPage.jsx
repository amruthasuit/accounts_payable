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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Payment Disbursement Runs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Prepare banking payment runs, export NEFT/RTGS clearing files, and execute Host-to-Host direct bank settlements.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Approved Invoices Awaiting Payment Run */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Approved Invoices Ready for Payment ({approvedInvoices.length})</h2>
            <p className="text-xs text-slate-500">Group authorized invoices into a banking disbursement batch</p>
          </div>

          {approvedInvoices.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={formatType}
                onChange={(e) => setFormatType(e.target.value)}
                className="bg-white border border-slate-300 text-xs text-slate-800 rounded-lg px-2.5 py-1.5 outline-none font-medium shadow-2xs"
              >
                <option value="NEFT_RTGS_CSV">NEFT / RTGS Corporate CSV (HDFC/ICICI)</option>
                <option value="ISO20022_XML">ISO 20022 pain.001 XML</option>
              </select>

              <button
                onClick={handleCreateBatch}
                disabled={selectedInvoiceIds.length === 0 || actionLoading === 'create_batch'}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-xs disabled:opacity-50 transition flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Create Payment Batch ({selectedInvoiceIds.length})</span>
              </button>
            </div>
          )}
        </div>

        {approvedInvoices.length === 0 ? (
          <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            No approved invoices pending payment. Invoices must be signed-off by the designated approver before disbursement.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase border-b border-slate-200">
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedInvoiceIds.length === approvedInvoices.length && approvedInvoices.length > 0}
                      onChange={handleSelectAll}
                      className="rounded text-slate-900 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Vendor Entity</th>
                  <th className="py-2.5 px-3">Beneficiary Account</th>
                  <th className="py-2.5 px-3 text-right">Gross Amount</th>
                  <th className="py-2.5 px-3 text-center">Authorization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvedInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={selectedInvoiceIds.includes(inv.id)}
                        onChange={() => handleToggleSelect(inv.id)}
                        className="rounded text-slate-900 cursor-pointer"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{inv.vendor_name_raw}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                      {inv.vendor?.bank_accounts?.[0]?.bank_name || 'HDFC Bank'} • A/C: {inv.vendor?.bank_accounts?.[0]?.account_number || '5020...'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{(inv.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
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
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3.5">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Disbursement Runs & Settlement Records</h2>
          <p className="text-xs text-slate-500">Monitor bank payout execution, download transmission files, and inspect remittance advice</p>
        </div>

        {batches.length === 0 ? (
          <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            No payment runs created yet.
          </div>
        ) : (
          <div className="space-y-3.5">
            {batches.map((batch) => (
              <div key={batch.id} className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono font-bold text-xs text-slate-900">{batch.batch_reference}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      batch.status === 'Settled'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {batch.status === 'Settled' ? 'Settled' : batch.status}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {batch.invoice_count} Invoices via {batch.bank_name}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Run Total</span>
                      <div className="text-sm font-bold font-mono text-slate-900">
                        ₹{batch.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <a
                      href={`/api/payments/batches/${batch.id}/download-file`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition flex items-center gap-1 shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Bank CSV</span>
                    </a>

                    {batch.status !== 'Settled' && (
                      <button
                        onClick={() => handleExecutePayout(batch.id)}
                        disabled={actionLoading === `execute_${batch.id}`}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-xs transition flex items-center gap-1.5"
                      >
                        {actionLoading === `execute_${batch.id}` ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Execute Bank Payout (API)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Transactions Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-[10px] uppercase font-semibold text-slate-400 border-b">
                        <th className="py-1.5">Tx ID</th>
                        <th className="py-1.5">Invoice #</th>
                        <th className="py-1.5">Mode</th>
                        <th className="py-1.5">Bank UTR Reference</th>
                        <th className="py-1.5 text-right">Amount</th>
                        <th className="py-1.5 text-center">Remittance Advice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {batch.transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/50">
                          <td className="py-2 text-slate-400">#{tx.id}</td>
                          <td className="py-2 font-bold text-slate-800">INV-{tx.invoice_id}</td>
                          <td className="py-2">
                            <span className="text-[10px] font-sans font-medium bg-slate-100 px-1.5 py-0.2 rounded text-slate-700">
                              {tx.payment_method}
                            </span>
                          </td>
                          <td className="py-2 font-bold text-sky-800">
                            {tx.utr_number || 'Pending Settlement'}
                          </td>
                          <td className="py-2 text-right font-bold text-slate-900">
                            ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 text-center font-sans">
                            {tx.status === 'Settled' ? (
                              <button
                                onClick={() => setAdviceModalUrl(`/api/payments/advice/${tx.id}`)}
                                className="text-xs text-sky-700 hover:text-sky-900 font-medium underline inline-flex items-center gap-1"
                              >
                                <span>Advice Sheet</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full p-5 shadow-2xl space-y-3.5 max-h-[90vh] flex flex-col border border-slate-200">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h2 className="text-sm font-bold text-slate-900">Settlement Remittance Advice</h2>
              <button onClick={() => setAdviceModalUrl(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden border border-slate-200 rounded-lg">
              <iframe
                src={adviceModalUrl}
                title="Remittance Advice"
                className="w-full h-[520px] border-none"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={() => setAdviceModalUrl(null)}
                className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
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
