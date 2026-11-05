import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  ShieldCheck, 
  ArrowRight,
  Info,
  Building,
  Calculator,
  Copy,
  Receipt
} from 'lucide-react';

export const ValidationPage = ({ selectedInvoiceId, setSelectedInvoiceId, setActiveTab }) => {
  const [invoices, setInvoices] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [validations, setValidations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

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

  const fetchInvoiceValidations = async (id) => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/invoices/${id}`);
      setInvoice(res.data);
      setValidations(res.data.validations || []);
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
      fetchInvoiceValidations(selectedInvoiceId);
    }
  }, [selectedInvoiceId]);

  const runValidations = async () => {
    if (!invoice) return;
    try {
      setRunning(true);
      const res = await api.post(`/validation/run/${invoice.id}`);
      setValidations(res.data);
      // Refresh invoice state
      const refreshed = await api.get(`/invoices/${invoice.id}`);
      setInvoice(refreshed.data);
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  const getRuleIcon = (code) => {
    switch (code) {
      case 'MANDATORY_FIELDS': return Receipt;
      case 'DUPLICATE_CHECK': return Copy;
      case 'GST_VALIDATION': return ShieldCheck;
      case 'AMOUNT_MATH': return Calculator;
      case 'VENDOR_MASTER': return Building;
      default: return Info;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Module 3</span>
            <span className="text-xs text-slate-500 font-medium">Compliance & Verification Engine</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Invoice Automated Validation</h1>
          <p className="text-xs text-slate-500">
            5-point automated rule checks: mandatory fields, duplicate detection, GST tax logic, math reconciliation, and vendor master.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedInvoiceId || ''}
            onChange={(e) => setSelectedInvoiceId(Number(e.target.value))}
            className="bg-slate-50 border border-slate-300 text-xs text-slate-800 rounded-xl px-3 py-2 outline-none font-medium hover:border-sky-500 focus:border-sky-500"
          >
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                #{inv.invoice_number} ({inv.status}) - ₹{(inv.total_amount || 0).toLocaleString('en-IN')}
              </option>
            ))}
          </select>

          <button
            onClick={runValidations}
            disabled={running}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 disabled:opacity-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
            <span>Run All Rules</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : invoice ? (
        <div className="space-y-6">
          {/* Status Alert Banner */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            invoice.status === 'Validation Failed'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-center space-x-3">
              {invoice.status === 'Validation Failed' ? (
                <XCircle className="w-6 h-6 text-red-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              )}
              <div>
                <h2 className="text-sm font-bold">
                  Validation Status: {invoice.status}
                </h2>
                <p className="text-xs opacity-80 mt-0.5">
                  {invoice.status === 'Validation Failed'
                    ? 'Exceptions detected. Correct issues in the Review tab or review discrepancy logs below.'
                    : 'All critical checks passed. Ready for 2-Way / 3-Way PO Matching.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab(invoice.status === 'Validation Failed' ? 'invoices' : 'matching')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                invoice.status === 'Validation Failed'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <span>{invoice.status === 'Validation Failed' ? 'Review & Correct Fields' : 'Proceed to PO Match'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 5-Rule Validation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {validations.map((v) => {
              const Icon = getRuleIcon(v.rule_code);
              const isPassed = v.status === 'Passed';
              const isWarning = v.status === 'Warning';
              const isFailed = v.status === 'Failed';

              return (
                <div
                  key={v.id}
                  className={`p-5 rounded-2xl border transition shadow-sm space-y-3 bg-white ${
                    isFailed 
                      ? 'border-red-300 ring-1 ring-red-200' 
                      : isWarning 
                        ? 'border-amber-300 ring-1 ring-amber-100' 
                        : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isFailed ? 'bg-red-100 text-red-600' : isWarning ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs text-slate-900">{v.rule_name}</span>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isFailed 
                        ? 'bg-red-100 text-red-700' 
                        : isWarning 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {v.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {v.message}
                  </p>

                  {v.details_json && Object.keys(v.details_json).length > 0 && (
                    <div className="pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-500 bg-slate-50 p-2 rounded-lg">
                      {JSON.stringify(v.details_json, null, 1)}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                    <span>Severity: <strong>{v.severity}</strong></span>
                    <span>Rule ID: {v.rule_code}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};
