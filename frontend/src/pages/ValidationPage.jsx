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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#232936] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#0D9488]"></span>
            <h1 className="text-lg font-semibold text-[#E5E9F0] tracking-tight">Invoice Automated Validation</h1>
          </div>
          <p className="text-xs text-[#7E8799] mt-0.5">
            5-point automated rule checks: mandatory fields, duplicate detection, GST tax logic, math reconciliation, and vendor master
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedInvoiceId || ''}
            onChange={(e) => setSelectedInvoiceId(Number(e.target.value))}
            className="bg-[#121620] border border-[#232936] text-xs font-mono text-[#E5E9F0] rounded-sm px-3 py-1.5 outline-none cursor-pointer"
          >
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id} className="bg-[#181D28]">
                #{inv.invoice_number} ({inv.status}) - ₹{(inv.total_amount || 0).toLocaleString('en-IN')}
              </option>
            ))}
          </select>

          <button
            onClick={runValidations}
            disabled={running}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-sm text-xs font-medium shadow-2xs disabled:opacity-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
            <span>Run all rules</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="w-6 h-6 text-[#0D9488] animate-spin" />
        </div>
      ) : invoice ? (
        <div className="space-y-4">
          {/* Status Alert Banner */}
          <div className={`p-4 rounded-sm border flex items-center justify-between ${
            invoice.status === 'Validation Failed'
              ? 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#E5E9F0]'
              : 'bg-[#0D9488]/10 border-[#0D9488]/30 text-[#E5E9F0]'
          }`}>
            <div className="flex items-center space-x-3">
              {invoice.status === 'Validation Failed' ? (
                <XCircle className="w-5 h-5 text-[#EF4444] shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-[#2DD4BF] shrink-0" />
              )}
              <div>
                <h2 className="text-xs font-semibold">
                  Validation status: {invoice.status}
                </h2>
                <p className="text-[11px] text-[#8C96A8] mt-0.5">
                  {invoice.status === 'Validation Failed'
                    ? 'Exceptions detected. Correct issues in the reconciliation desk or inspect discrepancies below.'
                    : 'All critical checks passed. Ready for 2-way / 3-way PO matching.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab(invoice.status === 'Validation Failed' ? 'invoices' : 'matching')}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium transition flex items-center gap-1.5 ${
                invoice.status === 'Validation Failed'
                  ? 'bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#F87171] border border-[#EF4444]/30'
                  : 'bg-[#0D9488] hover:bg-[#0F766E] text-white shadow-2xs'
              }`}
            >
              <span>{invoice.status === 'Validation Failed' ? 'Review & correct fields' : 'Proceed to PO match'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 5-Rule Validation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {validations.map((v) => {
              const Icon = getRuleIcon(v.rule_code);
              const isPassed = v.status === 'Passed';
              const isWarning = v.status === 'Warning';
              const isFailed = v.status === 'Failed';

              return (
                <div
                  key={v.id}
                  className={`p-4 rounded-sm border transition space-y-2.5 bg-[#121620] ${
                    isFailed 
                      ? 'border-[#EF4444]/40' 
                      : isWarning 
                        ? 'border-[#F59E0B]/40' 
                        : 'border-[#232936] hover:border-[#282F3E]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-7 h-7 rounded-xs flex items-center justify-center ${
                        isFailed ? 'bg-[#EF4444]/15 text-[#EF4444]' : isWarning ? 'bg-[#F59E0B]/15 text-[#F59E0B]' : 'bg-[#0D9488]/15 text-[#2DD4BF]'
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium text-xs text-[#E5E9F0]">{v.rule_name}</span>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-xs border ${
                      isFailed 
                        ? 'bg-[#EF4444]/15 text-[#F87171] border-[#EF4444]/30' 
                        : isWarning 
                          ? 'bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/30' 
                          : 'bg-[#0D9488]/15 text-[#2DD4BF] border-[#0D9488]/30'
                    }`}>
                      {v.status}
                    </span>
                  </div>

                  <p className="text-xs text-[#8C96A8] leading-relaxed">
                    {v.message}
                  </p>

                  {v.details_json && Object.keys(v.details_json).length > 0 && (
                    <div className="pt-2 border-t border-[#1E2534] text-[10px] font-mono text-[#7E8799] bg-[#181D28] p-2 rounded-xs">
                      {JSON.stringify(v.details_json, null, 1)}
                    </div>
                  )}

                  <div className="text-[10px] text-[#64718A] font-mono flex items-center justify-between pt-1">
                    <span>Severity: {v.severity}</span>
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
