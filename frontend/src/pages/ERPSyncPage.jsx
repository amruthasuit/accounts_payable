import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Send, 
  Code, 
  FileCheck2,
  Building,
  Layers,
  ArrowRight
} from 'lucide-react';

export const ERPSyncPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [erpLogs, setErpLogs] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState('Tally Prime');
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState(null);
  const [payloadModal, setPayloadModal] = useState(null);
  const [message, setMessage] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, logsRes] = await Promise.all([
        api.get('/invoices/'),
        api.get('/erp/logs')
      ]);
      setInvoices(invRes.data);
      setErpLogs(logsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSyncInvoice = async (invoiceId) => {
    try {
      setSyncingId(invoiceId);
      setMessage('');
      const res = await api.post(`/erp/sync/${invoiceId}`, null, {
        params: { target_system: selectedTarget }
      });
      setMessage(`Successfully synced Invoice to ${selectedTarget}! Reference: ${res.data.erp_reference}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'ERP synchronization failed.');
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">General Ledger & ERP Integrations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronize verified AP vouchers directly into Tally Prime, SAP S/4HANA, Zoho Books, or QuickBooks.
          </p>
        </div>

        {/* Target System Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-700">Target System:</label>
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            className="bg-white border border-slate-300 text-xs font-semibold text-slate-900 rounded-lg px-3 py-1.5 outline-none hover:border-slate-800 shadow-2xs"
          >
            <option value="Tally Prime">Tally Prime (XML Voucher)</option>
            <option value="SAP">SAP S/4HANA (BAPI_INCOMINGINVOICE)</option>
            <option value="Zoho Books">Zoho Books (Vendor Bill REST)</option>
            <option value="QuickBooks">QuickBooks Online (Bill Object)</option>
          </select>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Invoices Sync Table */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3.5">
        <div>
          <h2 className="text-sm font-bold text-slate-900">AP Vouchers Eligible for GL Posting</h2>
          <p className="text-xs text-slate-500">Authorized and paid invoices queued for automatic general ledger balance updates</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <RefreshCw className="w-7 h-7 text-sky-600 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase border-b border-slate-200">
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Vendor Entity</th>
                  <th className="py-2.5 px-3 text-right">Gross Total</th>
                  <th className="py-2.5 px-3 text-center">AP Status</th>
                  <th className="py-2.5 px-3 text-center">GL Sync Status</th>
                  <th className="py-2.5 px-3 text-center">ERP Voucher Ref</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const isEligible = ['Approved', 'In Payment', 'Paid'].includes(inv.status);
                  const isSynced = inv.erp_sync_status === 'Synced';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{inv.vendor_name_raw}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{(inv.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isSynced ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {isSynced ? 'Synced' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-sky-800">
                        {inv.erp_reference || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isEligible ? (
                          <button
                            onClick={() => handleSyncInvoice(inv.id)}
                            disabled={syncingId === inv.id}
                            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50 flex items-center gap-1 mx-auto"
                          >
                            {syncingId === inv.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            <span>{isSynced ? 'Re-Sync' : `Sync to ${selectedTarget}`}</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Requires Approval</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sync Log & Payload Inspector */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3.5">
        <div>
          <h2 className="text-sm font-bold text-slate-900">ERP Transmission Log & Gateway History</h2>
          <p className="text-xs text-slate-500">Inspect the exact payloads delivered to ERP endpoints</p>
        </div>

        {erpLogs.length === 0 ? (
          <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            No ERP sync logs recorded yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {erpLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="p-3.5 border border-slate-200 rounded-lg bg-slate-50/50 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{log.target_system}</span>
                    <span className="text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded text-[10px]">
                      {log.sync_status}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">{log.synced_at}</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{log.response}</p>
                </div>

                <button
                  onClick={() => setPayloadModal(log.payload)}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-mono text-[11px] rounded-lg transition flex items-center gap-1 shadow-2xs"
                >
                  <Code className="w-3.5 h-3.5 text-slate-600" />
                  <span>Inspect Payload</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payload Modal */}
      {payloadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 text-white rounded-xl max-w-2xl w-full p-5 shadow-2xl space-y-3.5 max-h-[85vh] flex flex-col border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h2 className="text-xs font-bold text-sky-400 font-mono">ERP Transmission Data Payload</h2>
              <button onClick={() => setPayloadModal(null)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>
            <pre className="flex-1 overflow-auto bg-slate-900 p-4 rounded-lg text-xs font-mono text-emerald-400 border border-slate-800">
              {JSON.stringify(payloadModal, null, 2)}
            </pre>
            <div className="flex justify-end pt-1">
              <button
                onClick={() => setPayloadModal(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
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
