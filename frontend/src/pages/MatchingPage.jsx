import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  GitCompare, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Sliders, 
  ArrowRight,
  PackageCheck,
  FileText,
  Building,
  Check,
  ChevronRight
} from 'lucide-react';

export const MatchingPage = ({ selectedInvoiceId, setSelectedInvoiceId, setActiveTab }) => {
  const [invoices, setInvoices] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [tolerance, setTolerance] = useState(2.0);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices/');
      setInvoices(res.data);
      if (!selectedInvoiceId && res.data.length > 0) {
        setSelectedInvoiceId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInvoiceMatching = async (id) => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/invoices/${id}`);
      setInvoice(res.data);
      if (res.data.match_results && res.data.match_results.length > 0) {
        setMatchResult(res.data.match_results[res.data.match_results.length - 1]);
      } else {
        setMatchResult(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (selectedInvoiceId) {
      fetchInvoiceMatching(selectedInvoiceId);
    }
  }, [selectedInvoiceId]);

  const executeMatch = async (forceType = null) => {
    if (!invoice) return;
    try {
      setMatching(true);
      const res = await api.post(`/matching/run/${invoice.id}`, {
        tolerance_percent: parseFloat(tolerance),
        force_match_type: forceType
      });
      setMatchResult(res.data);
      const refreshed = await api.get(`/invoices/${invoice.id}`);
      setInvoice(refreshed.data);
    } catch (err) {
      console.error(err);
    } finally {
      setMatching(false);
    }
  };

  const lineComparisons = matchResult?.details_json?.line_comparisons || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#232936] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#0D9488]"></span>
            <h1 className="text-lg font-semibold text-[#E5E9F0] tracking-tight">PO & GRN Reconciliation Center</h1>
          </div>
          <p className="text-xs text-[#7E8799] mt-0.5">
            2-way and 3-way matching reconciling billed invoices against purchase orders and goods receipt notes
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedInvoiceId || ''}
            onChange={(e) => setSelectedInvoiceId(Number(e.target.value))}
            className="bg-[#121620] border border-[#232936] text-xs text-[#E5E9F0] rounded-sm px-3 py-1.5 outline-none font-mono cursor-pointer"
          >
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id} className="bg-[#181D28] text-[#E5E9F0]">
                #{inv.invoice_number} ({inv.match_status}) - PO: {inv.po_number_raw || 'None'}
              </option>
            ))}
          </select>

          {/* Tolerance input */}
          <div className="flex items-center space-x-1.5 bg-[#121620] border border-[#232936] rounded-sm px-2.5 py-1 text-xs">
            <Sliders className="w-3.5 h-3.5 text-[#7E8799]" />
            <span className="text-[#8C96A8]">Tolerance:</span>
            <input
              type="number"
              step="0.5"
              min="0"
              max="10"
              value={tolerance}
              onChange={(e) => setTolerance(e.target.value)}
              className="w-10 text-right font-mono text-[#E5E9F0] bg-transparent outline-none"
            />
            <span className="text-[#7E8799] font-mono">%</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => executeMatch('2-Way')}
              disabled={matching}
              className="px-2.5 py-1.5 bg-[#181D28] hover:bg-[#1E2534] border border-[#282F3E] text-[#E5E9F0] text-xs font-medium rounded-sm transition disabled:opacity-50"
            >
              2-Way match
            </button>
            <button
              onClick={() => executeMatch('3-Way')}
              disabled={matching}
              className="px-3 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-medium rounded-sm shadow-2xs transition disabled:opacity-50"
            >
              Run 3-way match
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="w-6 h-6 text-[#0D9488] animate-spin" />
        </div>
      ) : invoice ? (
        <div className="space-y-4">
          {/* Match Outcome Banner */}
          {matchResult ? (
            <div className={`p-4 rounded-sm border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
              matchResult.within_tolerance && matchResult.status === 'Matched'
                ? 'bg-[#0D9488]/10 border-[#0D9488]/30 text-[#E5E9F0]'
                : 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#E5E9F0]'
            }`}>
              <div className="flex items-center space-x-3">
                {matchResult.within_tolerance && matchResult.status === 'Matched' ? (
                  <CheckCircle2 className="w-5 h-5 text-[#2DD4BF] shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0" />
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs border border-current">
                      {matchResult.match_type} reconciliation
                    </span>
                    <span className="text-xs font-mono text-[#C4CBD8]">
                      PO #{matchResult.details_json?.po_number || invoice.po_number_raw || 'N/A'}
                    </span>
                    {matchResult.details_json?.grn_number && (
                      <span className="text-xs font-mono text-[#7E8799] bg-[#181D28] px-2 py-0.5 rounded-xs border border-[#232936]">
                        GRN #{matchResult.details_json.grn_number}
                      </span>
                    )}
                  </div>
                  <h2 className="text-sm font-semibold mt-1">Status: {matchResult.status}</h2>
                  <p className="text-xs text-[#8C96A8] mt-0.5">
                    Net variance against PO: <strong className="font-mono text-[#E5E9F0]">₹{(matchResult.variance_amount || 0).toLocaleString('en-IN')}</strong> (Allowed tolerance: ±{matchResult.tolerance_applied}%)
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('approvals')}
                  className="px-3 py-1.5 bg-[#181D28] hover:bg-[#1E2534] text-[#E5E9F0] border border-[#282F3E] font-medium text-xs rounded-sm transition flex items-center gap-1"
                >
                  <span>Go to approvals</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-[#121620] rounded-sm border border-[#232936] text-[#7E8799] text-xs font-mono">
              No matching run executed yet for this invoice. Click "Run 3-way match" above.
            </div>
          )}

          {/* Line-by-Line 3-Way Match Reconciliation Table */}
          {lineComparisons.length > 0 && (
            <div className="bg-[#121620] p-4 rounded-sm border border-[#232936] space-y-3">
              <div className="border-b border-[#1E2534] pb-2.5">
                <h3 className="text-xs font-semibold text-[#E5E9F0]">Line item reconciliation breakdown</h3>
                <p className="text-[11px] text-[#7E8799]">
                  Itemized comparison across billed invoice, purchase order, and accepted goods receipt note (GRN)
                </p>
              </div>

              <div className="overflow-x-auto border border-[#232936] rounded-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#181D28] text-[10px] text-[#8C96A8] border-b border-[#232936]">
                      <th className="py-2.5 px-3 font-medium">#</th>
                      <th className="py-2.5 px-3 font-medium">Item description</th>
                      <th className="py-2.5 px-3 text-center font-medium">Inv qty</th>
                      <th className="py-2.5 px-3 text-center font-medium">PO qty</th>
                      {matchResult?.match_type === '3-Way' && (
                        <th className="py-2.5 px-3 text-center font-medium">GRN qty</th>
                      )}
                      <th className="py-2.5 px-3 text-right font-medium">Inv rate</th>
                      <th className="py-2.5 px-3 text-right font-medium">PO rate</th>
                      <th className="py-2.5 px-3 text-center font-medium">Price diff%</th>
                      <th className="py-2.5 px-3 text-center font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2534] font-mono text-[11px]">
                    {lineComparisons.map((line, idx) => (
                      <tr key={idx} className="hover:bg-[#181D28]/60 transition">
                        <td className="py-2.5 px-3 text-[#64718A]">{line.line_number}</td>
                        <td className="py-2.5 px-3 font-sans font-medium text-[#C4CBD8]">{line.item_description}</td>
                        <td className="py-2.5 px-3 text-center text-[#2DD4BF]">{line.invoice_qty}</td>
                        <td className="py-2.5 px-3 text-center text-[#C4CBD8]">{line.po_qty}</td>
                        {matchResult?.match_type === '3-Way' && (
                          <td className="py-2.5 px-3 text-center text-[#8C96A8]">
                            {line.grn_qty !== null ? line.grn_qty : '—'}
                          </td>
                        )}
                        <td className="py-2.5 px-3 text-right text-[#E5E9F0]">₹{line.invoice_unit_price.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right text-[#8C96A8]">₹{line.po_unit_price.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          <span className={`px-1.5 py-0.2 rounded-xs text-[10px] font-mono ${
                            line.price_diff_percent > tolerance
                              ? 'bg-[#EF4444]/15 text-[#F87171] border border-[#EF4444]/30'
                              : 'bg-[#0D9488]/15 text-[#2DD4BF] border border-[#0D9488]/30'
                          }`}>
                            {line.price_diff_percent > 0 ? `+${line.price_diff_percent}%` : `${line.price_diff_percent}%`}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {line.price_within_tolerance && line.quantity_valid ? (
                            <span className="text-[10px] font-mono text-[#2DD4BF] bg-[#0D9488]/15 px-2 py-0.5 rounded-xs border border-[#0D9488]/30">
                              Matched
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-[#F87171] bg-[#EF4444]/15 px-2 py-0.5 rounded-xs border border-[#EF4444]/30">
                              Variance
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
