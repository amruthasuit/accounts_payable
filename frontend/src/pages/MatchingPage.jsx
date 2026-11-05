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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">PO & GRN Reconciliation Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            2-Way and 3-Way matching reconciling Billed Invoices against Purchase Orders and Goods Receipt Notes.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedInvoiceId || ''}
            onChange={(e) => setSelectedInvoiceId(Number(e.target.value))}
            className="bg-white border border-slate-300 text-xs text-slate-800 rounded-lg px-3 py-1.5 outline-none font-medium shadow-2xs cursor-pointer"
          >
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                #{inv.invoice_number} ({inv.match_status}) - PO: {inv.po_number_raw || 'None'}
              </option>
            ))}
          </select>

          {/* Tolerance input */}
          <div className="flex items-center space-x-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Tolerance:</span>
            <input
              type="number"
              step="0.5"
              min="0"
              max="10"
              value={tolerance}
              onChange={(e) => setTolerance(e.target.value)}
              className="w-10 text-right font-bold font-mono text-slate-900 outline-none"
            />
            <span className="font-bold text-slate-600">%</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => executeMatch('2-Way')}
              disabled={matching}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium text-xs rounded-lg shadow-2xs transition disabled:opacity-50"
            >
              2-Way Match
            </button>
            <button
              onClick={() => executeMatch('3-Way')}
              disabled={matching}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg shadow-xs transition disabled:opacity-50"
            >
              Run 3-Way Match
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="w-7 h-7 text-sky-600 animate-spin" />
        </div>
      ) : invoice ? (
        <div className="space-y-5">
          {/* Match Outcome Banner */}
          {matchResult ? (
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
              matchResult.within_tolerance && matchResult.status === 'Matched'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/70 border-amber-300 text-amber-950'
            }`}>
              <div className="flex items-center space-x-3">
                {matchResult.within_tolerance && matchResult.status === 'Matched' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white/80 px-2 py-0.2 rounded border border-current">
                      {matchResult.match_type} Reconciliation
                    </span>
                    <span className="text-xs font-mono font-bold">
                      PO #{matchResult.details_json?.po_number || invoice.po_number_raw || 'N/A'}
                    </span>
                    {matchResult.details_json?.grn_number && (
                      <span className="text-xs font-mono bg-white px-2 py-0.2 rounded border">
                        GRN #{matchResult.details_json.grn_number}
                      </span>
                    )}
                  </div>
                  <h2 className="text-sm font-bold mt-1">Status: {matchResult.status}</h2>
                  <p className="text-xs opacity-85">
                    Net variance against PO: <strong>₹{(matchResult.variance_amount || 0).toLocaleString('en-IN')}</strong> (Allowed tolerance: ±{matchResult.tolerance_applied}%)
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('approvals')}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg shadow-xs transition flex items-center gap-1"
                >
                  <span>Go to Approvals</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
              No matching run executed yet for this invoice. Click "Run 3-Way Match" above.
            </div>
          )}

          {/* Line-by-Line 3-Way Match Reconciliation Table */}
          {lineComparisons.length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Line Item Reconciliation Breakdown</h3>
                <p className="text-xs text-slate-500">
                  Itemized comparison across Billed Invoice, Approved Purchase Order, and Accepted Goods Receipt (GRN)
                </p>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase border-b border-slate-200">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 text-center">Inv Qty</th>
                      <th className="py-2.5 px-3 text-center">PO Qty</th>
                      {matchResult.match_type === '3-Way' && (
                        <th className="py-2.5 px-3 text-center">GRN Qty</th>
                      )}
                      <th className="py-2.5 px-3 text-right">Inv Rate</th>
                      <th className="py-2.5 px-3 text-right">PO Rate</th>
                      <th className="py-2.5 px-3 text-center">Price Diff%</th>
                      <th className="py-2.5 px-3 text-center">Reconciliation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {lineComparisons.map((line, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-slate-400">{line.line_number}</td>
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-900">{line.item_description}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-800">{line.invoice_qty}</td>
                        <td className="py-2.5 px-3 text-center text-slate-700">{line.po_qty}</td>
                        {matchResult.match_type === '3-Way' && (
                          <td className="py-2.5 px-3 text-center text-slate-700">
                            {line.grn_qty !== null ? line.grn_qty : '—'}
                          </td>
                        )}
                        <td className="py-2.5 px-3 text-right font-medium text-slate-900">₹{line.invoice_unit_price.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">₹{line.po_unit_price.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            line.price_diff_percent > tolerance
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {line.price_diff_percent > 0 ? `+${line.price_diff_percent}%` : `${line.price_diff_percent}%`}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {line.price_within_tolerance && line.quantity_valid ? (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-sans">
                              Matched
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 font-sans">
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
