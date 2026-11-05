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
      setMessage(`Successfully synced invoice to ${selectedTarget}. Voucher reference: ${res.data.erp_reference}`);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#232936] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#0D9488]"></span>
            <h1 className="text-lg font-semibold text-[#E5E9F0] tracking-tight">General Ledger & ERP Integrations</h1>
          </div>
          <p className="text-xs text-[#7E8799] mt-0.5">
            Synchronize verified AP vouchers directly into Tally Prime, SAP S/4HANA, Zoho Books, or QuickBooks
          </p>
        </div>

        {/* Target System Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-xs text-[#8C96A8]">Target system:</label>
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            className="bg-[#121620] border border-[#232936] text-xs font-mono text-[#E5E9F0] rounded-sm px-3 py-1.5 outline-none cursor-pointer"
          >
            <option value="Tally Prime" className="bg-[#181D28]">Tally Prime (XML Voucher)</option>
            <option value="SAP" className="bg-[#181D28]">SAP S/4HANA (BAPI_INCOMINGINVOICE)</option>
            <option value="Zoho Books" className="bg-[#181D28]">Zoho Books (Vendor Bill REST)</option>
            <option value="QuickBooks" className="bg-[#181D28]">QuickBooks Online (Bill Object)</option>
          </select>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-[#0D9488]/15 border border-[#0D9488]/30 rounded-sm text-[#2DD4BF] text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-[#2DD4BF] shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Invoices Sync Table */}
      <div className="bg-[#121620] p-4 rounded-sm border border-[#232936] space-y-3">
        <div className="border-b border-[#1E2534] pb-2.5">
          <h2 className="text-xs font-semibold text-[#E5E9F0]">AP vouchers eligible for general ledger posting</h2>
          <p className="text-[11px] text-[#7E8799]">Authorized and settled invoices queued for automatic general ledger updates</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <RefreshCw className="w-6 h-6 text-[#0D9488] animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#232936] rounded-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#181D28] text-[10px] text-[#8C96A8] border-b border-[#232936]">
                  <th className="py-2.5 px-3 font-medium">Invoice #</th>
                  <th className="py-2.5 px-3 font-medium">Vendor entity</th>
                  <th className="py-2.5 px-3 text-right font-medium">Gross total</th>
                  <th className="py-2.5 px-3 text-center font-medium">AP status</th>
                  <th className="py-2.5 px-3 text-center font-medium">GL sync status</th>
                  <th className="py-2.5 px-3 text-center font-medium">ERP voucher ref</th>
                  <th className="py-2.5 px-3 text-center font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2534]">
                {invoices.map((inv) => {
                  const isEligible = ['Approved', 'In Payment', 'Paid'].includes(inv.status);
                  const isSynced = inv.erp_sync_status === 'Synced';

                  return (
                    <tr key={inv.id} className="hover:bg-[#181D28]/60 transition">
                      <td className="py-2.5 px-3 font-mono font-medium text-[#2DD4BF]">{inv.invoice_number}</td>
                      <td className="py-2.5 px-3 font-medium text-[#E5E9F0]">{inv.vendor_name_raw}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-[#E5E9F0]">
                        ₹{(inv.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-[#181D28] text-[#8C96A8] border border-[#232936]">
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-xs border ${
                          isSynced ? 'bg-[#0D9488]/15 text-[#2DD4BF] border-[#0D9488]/30' : 'bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/30'
                        }`}>
                          {isSynced ? 'Synced' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[#2DD4BF]">
                        {inv.erp_reference || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isEligible ? (
                          <button
                            onClick={() => handleSyncInvoice(inv.id)}
                            disabled={syncingId === inv.id}
                            className="px-2.5 py-1 bg-[#181D28] hover:bg-[#1E2534] border border-[#282F3E] text-[#E5E9F0] rounded-sm text-xs font-medium transition disabled:opacity-50 flex items-center gap-1 mx-auto"
                          >
                            {syncingId === inv.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin text-[#2DD4BF]" />
                            ) : (
                              <Send className="w-3 h-3 text-[#2DD4BF]" />
                            )}
                            <span>{isSynced ? 'Re-sync' : `Post to ${selectedTarget}`}</span>
                          </button>
                        ) : (
                          <span className="text-[#64718A] text-[11px] font-mono">Requires approval</span>
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
      <div className="bg-[#121620] p-4 rounded-sm border border-[#232936] space-y-3">
        <div className="border-b border-[#1E2534] pb-2.5">
          <h2 className="text-xs font-semibold text-[#E5E9F0]">ERP transmission logs & gateway history</h2>
          <p className="text-[11px] text-[#7E8799]">Inspect the structural payload schemas dispatched to target accounting engines</p>
        </div>

        {erpLogs.length === 0 ? (
          <div className="p-6 text-center text-[#7E8799] bg-[#181D28] rounded-sm border border-[#232936] text-xs font-mono">
            No ERP sync logs recorded yet.
          </div>
        ) : (
          <div className="space-y-2">
            {erpLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="p-3 border border-[#232936] rounded-sm bg-[#181D28] flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-[#E5E9F0]">{log.target_system}</span>
                    <span className="text-[#2DD4BF] font-mono bg-[#0D9488]/15 border border-[#0D9488]/30 px-2 py-0.2 rounded-xs text-[10px]">
                      {log.sync_status}
                    </span>
                    <span className="text-[#64718A] font-mono text-[11px]">{log.synced_at}</span>
                  </div>
                  <p className="text-[#8C96A8] mt-0.5 text-[11px]">{log.response}</p>
                </div>

                <button
                  onClick={() => setPayloadModal(log.payload)}
                  className="px-2.5 py-1 bg-[#121620] hover:bg-[#1E2534] border border-[#282F3E] text-[#C4CBD8] font-mono text-[11px] rounded-sm transition flex items-center gap-1"
                >
                  <Code className="w-3.5 h-3.5 text-[#2DD4BF]" />
                  <span>Inspect payload</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payload Modal */}
      {payloadModal && (
        <div className="fixed inset-0 bg-[#0E1117]/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#121620] rounded-sm max-w-2xl w-full p-4 shadow-2xl space-y-3 max-h-[85vh] flex flex-col border border-[#282F3E]">
            <div className="flex items-center justify-between border-b border-[#232936] pb-2.5">
              <h2 className="text-xs font-semibold text-[#2DD4BF] font-mono">ERP transmission payload schema</h2>
              <button onClick={() => setPayloadModal(null)} className="text-[#7E8799] hover:text-[#E5E9F0]">
                ✕
              </button>
            </div>
            <pre className="flex-1 overflow-auto bg-[#181D28] p-3.5 rounded-sm text-xs font-mono text-[#2DD4BF] border border-[#232936]">
              {JSON.stringify(payloadModal, null, 2)}
            </pre>
            <div className="flex justify-end pt-1">
              <button
                onClick={() => setPayloadModal(null)}
                className="px-3 py-1.5 bg-[#181D28] hover:bg-[#1E2534] border border-[#282F3E] text-[#E5E9F0] rounded-sm text-xs font-medium"
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
