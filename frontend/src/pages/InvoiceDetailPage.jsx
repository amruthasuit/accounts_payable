import React, { useState, useEffect } from 'react';
import api from '../api';
import { useRole } from '../context/RoleContext';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Save, 
  Sparkles, 
  ArrowRight, 
  RefreshCw,
  Building,
  Plus,
  Trash2,
  FileCheck2,
  ShieldCheck,
  ChevronDown,
  ArrowLeft,
  ExternalLink,
  GitCompare,
  CheckSquare,
  History,
  DollarSign,
  Download,
  Sliders,
  Bell,
  Search,
  Filter
} from 'lucide-react';

export const InvoiceDetailPage = ({ selectedInvoiceId, setSelectedInvoiceId, setActiveTab }) => {
  const { currentUser } = useRole();
  const [invoices, setInvoices] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [matching, setMatching] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Filter state for the list view
  const [activeFilterTab, setActiveFilterTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Right pane tab inside Workbench: 'data', 'validation', 'matching', 'approval', 'erp'
  const [workbenchTab, setWorkbenchTab] = useState('data');
  const [tolerance, setTolerance] = useState(2.0);
  const [approvalComment, setApprovalComment] = useState('');

  // Editable Form State
  const [formData, setFormData] = useState({
    invoice_number: '',
    vendor_name_raw: '',
    vendor_gstin_raw: '',
    po_number_raw: '',
    invoice_date: '',
    due_date: '',
    subtotal: 0,
    cgst_amount: 0,
    sgst_amount: 0,
    igst_amount: 0,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 0,
    line_items: []
  });

  const fetchInvoicesList = async () => {
    try {
      setLoading(true);
      const res = await api.get('/invoices/');
      setInvoices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceDetail = async (id) => {
    if (!id) return;
    try {
      const res = await api.get(`/invoices/${id}`);
      setInvoice(res.data);
      setFormData({
        invoice_number: res.data.invoice_number || '',
        vendor_name_raw: res.data.vendor_name_raw || '',
        vendor_gstin_raw: res.data.vendor_gstin_raw || '',
        po_number_raw: res.data.po_number_raw || '',
        invoice_date: res.data.invoice_date ? res.data.invoice_date.split('T')[0] : '',
        due_date: res.data.due_date ? res.data.due_date.split('T')[0] : '',
        subtotal: res.data.subtotal || 0,
        cgst_amount: res.data.cgst_amount || 0,
        sgst_amount: res.data.sgst_amount || 0,
        igst_amount: res.data.igst_amount || 0,
        tax_amount: res.data.tax_amount || 0,
        discount_amount: res.data.discount_amount || 0,
        total_amount: res.data.total_amount || 0,
        line_items: res.data.line_items || []
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInvoicesList();
  }, []);

  useEffect(() => {
    if (selectedInvoiceId) {
      fetchInvoiceDetail(selectedInvoiceId);
    } else {
      setInvoice(null);
    }
  }, [selectedInvoiceId]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const roundToTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

  const handleLineItemChange = (index, field, value) => {
    const updated = [...formData.line_items];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_price' || field === 'tax_rate') {
      const qty = parseFloat(field === 'quantity' ? value : updated[index].quantity) || 0;
      const rate = parseFloat(field === 'unit_price' ? value : updated[index].unit_price) || 0;
      const taxRate = parseFloat(field === 'tax_rate' ? value : updated[index].tax_rate) || 0;
      
      const sub = qty * rate;
      const tax = roundToTwo(sub * (taxRate / 100.0));
      updated[index].tax_amount = tax;
      updated[index].total_amount = roundToTwo(sub + tax);
    }

    setFormData(prev => {
      const newSubtotal = roundToTwo(updated.reduce((sum, item) => sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)), 0));
      const newTaxTotal = roundToTwo(updated.reduce((sum, item) => sum + (parseFloat(item.tax_amount) || 0), 0));
      const newGrand = roundToTwo(newSubtotal + newTaxTotal - (parseFloat(prev.discount_amount) || 0));

      return {
        ...prev,
        line_items: updated,
        subtotal: newSubtotal,
        tax_amount: newTaxTotal,
        total_amount: newGrand
      };
    });
  };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      line_items: [
        ...prev.line_items,
        {
          line_number: prev.line_items.length + 1,
          description: 'Procured Material / Service',
          hsn_code: '998315',
          quantity: 1,
          unit: 'PCS',
          unit_price: 1000,
          tax_rate: 18,
          tax_amount: 180,
          total_amount: 1180,
          confidence: 100
        }
      ]
    }));
  };

  const removeLineItem = (index) => {
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.filter((_, idx) => idx !== index)
    }));
  };

  const saveCorrections = async () => {
    if (!invoice) return;
    setSaving(true);
    setStatusMessage('');
    try {
      const res = await api.put(`/invoices/${invoice.id}`, formData);
      setInvoice(res.data);
      setStatusMessage('Invoice updated & compliance rules re-evaluated successfully.');
      fetchInvoicesList();
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setStatusMessage('Failed to update invoice.');
    } finally {
      setSaving(false);
    }
  };

  const executeMatching = async (matchType = '3-Way') => {
    if (!invoice) return;
    try {
      setMatching(true);
      await api.post(`/matching/run/${invoice.id}`, {
        tolerance_percent: parseFloat(tolerance),
        force_match_type: matchType
      });
      await fetchInvoiceDetail(invoice.id);
      fetchInvoicesList();
      setStatusMessage(`Reconciliation completed: ${matchType} Match.`);
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setMatching(false);
    }
  };

  const handleApprovalAction = async (action) => {
    if (!invoice) return;
    try {
      setActionLoading(action);
      const res = await api.post(`/approvals/${invoice.id}/action`, {
        action: action,
        comments: approvalComment,
        actor_name: currentUser.name,
        actor_role: currentUser.role
      });
      setStatusMessage(res.data.message || `Action ${action} processed successfully.`);
      await fetchInvoiceDetail(invoice.id);
      fetchInvoicesList();
      setApprovalComment('');
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // Filtered list
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.vendor_name_raw?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.po_number_raw?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilterTab === 'All') return true;
    if (activeFilterTab === 'Needs Review') return inv.status === 'Extracted' || inv.status === 'Captured';
    if (activeFilterTab === 'Exceptions') return inv.status === 'Validation Failed' || inv.status === 'Match Exception';
    if (activeFilterTab === 'Approvals') return inv.status === 'Pending Approval' || inv.status === 'Escalated';
    if (activeFilterTab === 'Ready to Pay') return inv.status === 'Approved';
    if (activeFilterTab === 'Paid') return inv.status === 'Paid';
    return true;
  });

  // -------------------------------------------------------------
  // VIEW 1: INVOICES DIRECTORY (When no invoice is selected)
  // -------------------------------------------------------------
  if (!selectedInvoiceId || !invoice) {
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Invoice Management Directory</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review OCR extractions, resolve matching exceptions, and monitor approval progress.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('capture')}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              + Ingest Invoice
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex space-x-1 overflow-x-auto bg-slate-200/70 p-1 rounded-xl text-xs font-medium">
            {['All', 'Needs Review', 'Exceptions', 'Approvals', 'Ready to Pay', 'Paid'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilterTab(tab)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                  activeFilterTab === tab ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by invoice, vendor, PO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Invoices Data Grid */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4 font-mono">PO Ref</th>
                  <th className="py-3 px-4">Invoice Date</th>
                  <th className="py-3 px-4 text-right">Gross Total</th>
                  <th className="py-3 px-4 text-center">OCR Score</th>
                  <th className="py-3 px-4 text-center">Validation</th>
                  <th className="py-3 px-4 text-center">Match Status</th>
                  <th className="py-3 px-4 text-center">Lifecycle Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedInvoiceId(inv.id)}
                        className="font-mono font-bold text-sky-700 hover:text-sky-900 hover:underline"
                      >
                        {inv.invoice_number}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-[180px] truncate">
                      {inv.vendor_name_raw}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {inv.po_number_raw || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {inv.invoice_date ? inv.invoice_date.split('T')[0] : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{(inv.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className="text-[11px] font-semibold text-slate-700">
                        {inv.ocr_accuracy_score}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {inv.status === 'Validation Failed' ? (
                        <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                          Failed
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Passed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                        inv.match_status.includes('Matched')
                          ? 'bg-sky-50 text-sky-800 border border-sky-200'
                          : inv.match_status.includes('Exception')
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                      }`}>
                        {inv.match_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.status === 'Pending Approval' || inv.status === 'Escalated'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedInvoiceId(inv.id)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md font-medium text-[11px] transition"
                      >
                        Workbench →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: UNIFIED INVOICE WORKBENCH (When invoice is selected)
  // -------------------------------------------------------------
  const matchResult = invoice.match_results && invoice.match_results.length > 0 
    ? invoice.match_results[invoice.match_results.length - 1] 
    : null;
  const lineComparisons = matchResult?.details_json?.line_comparisons || [];

  return (
    <div className="space-y-4">
      {/* Workbench Top Bar & Breadcrumb */}
      <div className="bg-white px-5 py-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSelectedInvoiceId(null)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Back to All Invoices"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-base text-slate-900">{invoice.invoice_number}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                invoice.status === 'Paid'
                  ? 'bg-emerald-100 text-emerald-800'
                  : invoice.status === 'Approved'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700'
              }`}>
                {invoice.status}
              </span>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                OCR {invoice.ocr_accuracy_score}%
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              <span>Vendor: <strong>{invoice.vendor_name_raw}</strong></span> • 
              <span className="ml-1">PO: <strong>{invoice.po_number_raw || 'None'}</strong></span>
            </div>
          </div>
        </div>

        {/* Global Workbench Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={saveCorrections}
            disabled={saving}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save & Re-Validate</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Split Grid: Left Document Viewer / Right Inspection Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT PANE: Authentic Rendered Document Preview Sheet */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between max-h-[750px] overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
              <div className="flex items-center space-x-2 text-slate-600 font-medium">
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="font-mono truncate">{invoice.file_name || 'Tax_Invoice.pdf'}</span>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                Page 1 of 1
              </span>
            </div>

            {/* Rendered Invoice Sheet Paper Preview */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-5 font-sans text-xs space-y-4 shadow-inner">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <div className="font-bold text-sm text-slate-900">{formData.vendor_name_raw}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">GSTIN: {formData.vendor_gstin_raw}</div>
                  <div className="text-[10px] text-slate-400">Tax Invoice / Billing Document</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-800">{formData.invoice_number}</div>
                  <div className="text-[11px] text-slate-500">Date: {formData.invoice_date || 'N/A'}</div>
                  <div className="text-[11px] text-slate-500">Due: {formData.due_date || 'Net 30'}</div>
                </div>
              </div>

              {/* Billed To */}
              <div className="bg-white p-3 rounded border border-slate-200/80 text-[11px] space-y-0.5">
                <span className="text-slate-400 font-bold uppercase text-[9px] block">Customer / Payer</span>
                <div className="font-bold text-slate-800">Templegate Enterprise Solutions Ltd.</div>
                <div className="text-slate-500 font-mono">GSTIN: 29AAACT9876Q1Z2 • Karnataka (29)</div>
                <div className="text-slate-500">Purchase Order: {formData.po_number_raw || 'Direct Vendor PO'}</div>
              </div>

              {/* Line Items Preview */}
              <div className="border border-slate-200 rounded overflow-hidden bg-white">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-semibold border-b">
                      <th className="py-1.5 px-2">Item</th>
                      <th className="py-1.5 px-1 font-mono text-center">HSN</th>
                      <th className="py-1.5 px-1 text-right">Qty</th>
                      <th className="py-1.5 px-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formData.line_items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 px-2 text-slate-800 truncate max-w-[140px]">{item.description}</td>
                        <td className="py-1.5 px-1 text-center font-mono text-slate-500">{item.hsn_code || '—'}</td>
                        <td className="py-1.5 px-1 text-right font-mono">{item.quantity}</td>
                        <td className="py-1.5 px-2 text-right font-mono font-medium text-slate-900">₹{(item.total_amount || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="pt-2 border-t border-slate-200 text-right space-y-1 text-xs">
                <div className="text-slate-500">Subtotal: <strong className="font-mono text-slate-800">₹{(formData.subtotal || 0).toLocaleString('en-IN')}</strong></div>
                <div className="text-slate-500">GST Tax: <strong className="font-mono text-slate-800">₹{(formData.tax_amount || 0).toLocaleString('en-IN')}</strong></div>
                <div className="text-sm font-bold text-slate-900 pt-1 border-t">
                  Grand Total: <span className="font-mono">₹{(formData.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* OCR Raw Text Toggle Box */}
            <details className="text-[11px] text-slate-500 bg-slate-50 rounded-lg p-2.5 border border-slate-200">
              <summary className="font-semibold text-slate-700 cursor-pointer">View Raw OCR Text Extraction Stream</summary>
              <pre className="mt-2 font-mono text-[10px] text-slate-600 whitespace-pre-wrap max-h-36 overflow-y-auto bg-white p-2 rounded border">
                {invoice.ocr_raw_text}
              </pre>
            </details>
          </div>
        </div>

        {/* RIGHT PANE: Unified Inspection Tabs */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col">
          {/* Sub Tabs */}
          <div className="flex border-b border-slate-200 px-4 pt-3 overflow-x-auto text-xs font-medium">
            {[
              { id: 'data', label: 'Financials & Lines' },
              { id: 'validation', label: 'Compliance Checks', count: invoice.validations?.length },
              { id: 'matching', label: 'PO Reconciliation', badge: invoice.match_status },
              { id: 'approval', label: 'Approval Workflow' },
              { id: 'erp', label: 'ERP & Audit' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setWorkbenchTab(tab.id)}
                className={`pb-3 px-3 font-semibold transition border-b-2 whitespace-nowrap flex items-center space-x-1.5 ${
                  workbenchTab === tab.id
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.2 rounded">
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                    {tab.badge.split(' ')[0]}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-5 flex-1 overflow-y-auto max-h-[700px]">
            {/* TAB 1: FINANCIALS & LINE ITEMS */}
            {workbenchTab === 'data' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Invoice Number</label>
                    <input
                      type="text"
                      value={formData.invoice_number}
                      onChange={(e) => handleFieldChange('invoice_number', e.target.value)}
                      className="mt-1 w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono font-medium text-slate-900 focus:bg-white focus:border-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">PO Reference</label>
                    <input
                      type="text"
                      value={formData.po_number_raw}
                      onChange={(e) => handleFieldChange('po_number_raw', e.target.value)}
                      className="mt-1 w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono font-medium text-slate-900 focus:bg-white focus:border-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Vendor Entity</label>
                    <input
                      type="text"
                      value={formData.vendor_name_raw}
                      onChange={(e) => handleFieldChange('vendor_name_raw', e.target.value)}
                      className="mt-1 w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Vendor GSTIN</label>
                    <input
                      type="text"
                      value={formData.vendor_gstin_raw}
                      onChange={(e) => handleFieldChange('vendor_gstin_raw', e.target.value)}
                      className="mt-1 w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono uppercase font-medium text-slate-900 focus:bg-white focus:border-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Invoice Date</label>
                    <input
                      type="date"
                      value={formData.invoice_date}
                      onChange={(e) => handleFieldChange('invoice_date', e.target.value)}
                      className="mt-1 w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Due Date</label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => handleFieldChange('due_date', e.target.value)}
                      className="mt-1 w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-slate-900 outline-none"
                    />
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Itemized Material & Service Lines</span>
                    <button
                      type="button"
                      onClick={addLineItem}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium"
                    >
                      + Add Item
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase border-b">
                          <th className="py-2 px-2.5">#</th>
                          <th className="py-2 px-2.5">Description</th>
                          <th className="py-2 px-2 font-mono">HSN</th>
                          <th className="py-2 px-2 text-right">Qty</th>
                          <th className="py-2 px-2 text-right">Rate</th>
                          <th className="py-2 px-2 text-right">Tax%</th>
                          <th className="py-2 px-2.5 text-right">Total</th>
                          <th className="py-2 px-1 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {formData.line_items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-2.5 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                            <td className="py-2 px-2.5">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                                className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-800 outline-none text-xs text-slate-800 font-medium"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={item.hsn_code || ''}
                                onChange={(e) => handleLineItemChange(idx, 'hsn_code', e.target.value)}
                                className="w-14 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-800 outline-none text-xs font-mono text-slate-600"
                              />
                            </td>
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                                className="w-12 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-800 outline-none text-xs font-mono text-slate-900"
                              />
                            </td>
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number"
                                value={item.unit_price}
                                onChange={(e) => handleLineItemChange(idx, 'unit_price', e.target.value)}
                                className="w-16 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-800 outline-none text-xs font-mono text-slate-900"
                              />
                            </td>
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number"
                                value={item.tax_rate}
                                onChange={(e) => handleLineItemChange(idx, 'tax_rate', e.target.value)}
                                className="w-10 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-800 outline-none text-xs font-mono text-slate-900"
                              />
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                              ₹{(item.total_amount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 px-1 text-center">
                              <button
                                type="button"
                                onClick={() => removeLineItem(idx)}
                                className="text-slate-400 hover:text-red-600 p-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Subtotal & Balance */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-500">Taxable: </span>
                    <strong className="font-mono text-slate-800">₹{(formData.subtotal || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Taxes: </span>
                    <strong className="font-mono text-slate-800">₹{(formData.tax_amount || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500">Gross Total: </span>
                    <span className="text-base font-bold font-mono text-slate-900">
                      ₹{(formData.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: COMPLIANCE CHECKS */}
            {workbenchTab === 'validation' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Automated Audit & Compliance Rules</h3>
                    <p className="text-xs text-slate-500">5-point validation verifying arithmetic balance, duplicates, and tax rules</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {invoice.validations?.map((v) => (
                    <div 
                      key={v.id} 
                      className={`p-3.5 rounded-lg border text-xs space-y-1 ${
                        v.status === 'Passed' 
                          ? 'border-slate-200 bg-slate-50/50' 
                          : v.status === 'Warning' 
                            ? 'border-amber-300 bg-amber-50/40' 
                            : 'border-red-300 bg-red-50/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 font-bold text-slate-800">
                          {v.status === 'Passed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                          )}
                          <span>{v.rule_name}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                          v.status === 'Passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {v.status}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{v.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: PO & GRN RECONCILIATION */}
            {workbenchTab === 'matching' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Multi-Way PO & Delivery Receipt Matching</h3>
                    <p className="text-xs text-slate-500">Reconcile Billed quantities and rates against Purchase Orders</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 bg-slate-50 border rounded-lg px-2 py-1 text-xs font-mono">
                      <span className="text-slate-500">Tol:</span>
                      <input
                        type="number"
                        value={tolerance}
                        onChange={(e) => setTolerance(e.target.value)}
                        className="w-10 bg-transparent text-right outline-none font-bold text-slate-800"
                      />
                      <span>%</span>
                    </div>

                    <button
                      onClick={() => executeMatching('3-Way')}
                      disabled={matching}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium shadow-xs"
                    >
                      Run 3-Way Match
                    </button>
                  </div>
                </div>

                {matchResult ? (
                  <div className="space-y-3">
                    <div className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                      matchResult.within_tolerance && matchResult.status === 'Matched'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50 border-amber-300 text-amber-900'
                    }`}>
                      <div>
                        <strong>{matchResult.match_type} Reconciliation: {matchResult.status}</strong>
                        <div className="text-[11px] opacity-80">
                          Variance: ₹{(matchResult.variance_amount || 0).toLocaleString('en-IN')} (Allowed tolerance: ±{matchResult.tolerance_applied}%)
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold">
                        PO #{matchResult.details_json?.po_number || invoice.po_number_raw || 'None'}
                      </span>
                    </div>

                    {lineComparisons.length > 0 && (
                      <div className="border border-slate-200 rounded-lg overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase border-b">
                              <th className="py-2 px-2.5">Item</th>
                              <th className="py-2 px-2 text-center">Inv Qty</th>
                              <th className="py-2 px-2 text-center">PO Qty</th>
                              <th className="py-2 px-2 text-center">GRN Qty</th>
                              <th className="py-2 px-2 text-right">Inv Rate</th>
                              <th className="py-2 px-2 text-right">PO Rate</th>
                              <th className="py-2 px-2 text-center">Variance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                            {lineComparisons.map((lc, idx) => (
                              <tr key={idx}>
                                <td className="py-2 px-2.5 font-sans font-medium text-slate-800 truncate max-w-[120px]">{lc.item_description}</td>
                                <td className="py-2 px-2 text-center text-sky-800">{lc.invoice_qty}</td>
                                <td className="py-2 px-2 text-center text-slate-700">{lc.po_qty}</td>
                                <td className="py-2 px-2 text-center text-emerald-700">{lc.grn_qty !== null ? lc.grn_qty : '—'}</td>
                                <td className="py-2 px-2 text-right">₹{lc.invoice_unit_price}</td>
                                <td className="py-2 px-2 text-right">₹{lc.po_unit_price}</td>
                                <td className="py-2 px-2 text-center">
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                    lc.price_within_tolerance ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                  }`}>
                                    {lc.price_diff_percent}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs border border-dashed rounded-lg">
                    Reconciliation has not been executed yet. Click "Run 3-Way Match".
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: APPROVAL GOVERNANCE */}
            {workbenchTab === 'approval' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Approval Governance & Policy Matrix</h3>
                  <p className="text-xs text-slate-500">Sign-off trail and departmental budget approval</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Current Step:</span>
                    <strong className="text-slate-800">Tier {invoice.current_approval_step} - {invoice.assigned_to_role}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Approval Status:</span>
                    <span className="font-bold text-amber-700">{invoice.status}</span>
                  </div>
                </div>

                {/* Comment & Actions */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-semibold text-slate-700">Audit Remarks / Sign-off Comments</label>
                  <input
                    type="text"
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    placeholder="Enter approval note or exception sign-off reasoning..."
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-slate-800"
                  />

                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      onClick={() => handleApprovalAction('REJECT')}
                      disabled={actionLoading === 'REJECT'}
                      className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprovalAction('ESCALATE')}
                      disabled={actionLoading === 'ESCALATE'}
                      className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-semibold"
                    >
                      Escalate
                    </button>
                    <button
                      onClick={() => handleApprovalAction('APPROVE')}
                      disabled={actionLoading === 'APPROVE'}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Invoice</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: ERP & AUDIT */}
            {workbenchTab === 'erp' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">General Ledger & ERP Posting</h3>
                  <p className="text-xs text-slate-500">ERP synchronization status and historical changes</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ERP Sync Status:</span>
                    <strong className="text-slate-800">{invoice.erp_sync_status}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ERP Document Reference:</span>
                    <strong className="font-mono text-sky-700">{invoice.erp_reference || 'Pending Sync'}</strong>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('erp')}
                  className="px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
                >
                  Manage ERP Gateways & XML Vouchers →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
