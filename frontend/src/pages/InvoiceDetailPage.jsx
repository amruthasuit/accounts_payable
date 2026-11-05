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
      setStatusMessage('Invoice updated and compliance rules re-evaluated.');
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
    if (activeFilterTab === 'Needs review') return inv.status === 'Extracted' || inv.status === 'Captured';
    if (activeFilterTab === 'Exceptions') return inv.status === 'Validation Failed' || inv.status === 'Match Exception';
    if (activeFilterTab === 'Approvals') return inv.status === 'Pending Approval' || inv.status === 'Escalated';
    if (activeFilterTab === 'Ready to pay') return inv.status === 'Approved';
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#232936] pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#0D9488]"></span>
              <h1 className="text-lg font-semibold text-[#E5E9F0] tracking-tight">Invoice Ledger Directory</h1>
            </div>
            <p className="text-xs text-[#7E8799] mt-0.5">
              Review OCR extractions, inspect line parity, and resolve reconciliation variances
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('capture')}
              className="px-3 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-sm text-xs font-medium transition shadow-2xs"
            >
              + Ingest invoice
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex space-x-1 overflow-x-auto bg-[#121620] p-1 rounded-sm border border-[#232936] text-xs">
            {['All', 'Needs review', 'Exceptions', 'Approvals', 'Ready to pay', 'Paid'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilterTab(tab)}
                className={`px-3 py-1 rounded-xs whitespace-nowrap transition text-xs font-medium ${
                  activeFilterTab === tab ? 'bg-[#1E2534] text-white border border-[#2E374A]' : 'text-[#8C96A8] hover:text-[#E5E9F0]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#64718A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search invoice, vendor, PO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121620] border border-[#232936] rounded-sm pl-8 pr-3 py-1.5 text-xs text-[#E5E9F0] placeholder-[#64718A] outline-none focus:border-[#0D9488]"
            />
          </div>
        </div>

        {/* Invoices Data Grid */}
        <div className="bg-[#121620] rounded-sm border border-[#232936] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#232936] text-[11px] text-[#8C96A8] bg-[#181D28]">
                  <th className="py-2.5 px-3.5 font-medium">Invoice #</th>
                  <th className="py-2.5 px-3.5 font-medium">Vendor</th>
                  <th className="py-2.5 px-3.5 font-mono font-medium">PO ref</th>
                  <th className="py-2.5 px-3.5 font-medium">Date</th>
                  <th className="py-2.5 px-3.5 text-right font-medium">Gross total</th>
                  <th className="py-2.5 px-3.5 text-center font-medium">OCR score</th>
                  <th className="py-2.5 px-3.5 text-center font-medium">Validation</th>
                  <th className="py-2.5 px-3.5 text-center font-medium">Match status</th>
                  <th className="py-2.5 px-3.5 text-center font-medium">Lifecycle</th>
                  <th className="py-2.5 px-3.5 text-center font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2534]">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#181D28]/60 transition">
                    <td className="py-2.5 px-3.5">
                      <button
                        onClick={() => setSelectedInvoiceId(inv.id)}
                        className="font-mono font-medium text-[#2DD4BF] hover:underline"
                      >
                        {inv.invoice_number}
                      </button>
                    </td>
                    <td className="py-2.5 px-3.5 font-medium text-[#E5E9F0] max-w-[180px] truncate">
                      {inv.vendor_name_raw}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-[#8C96A8]">
                      {inv.po_number_raw || '—'}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-[#8C96A8]">
                      {inv.invoice_date ? inv.invoice_date.split('T')[0] : '—'}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-medium text-[#E5E9F0]">
                      ₹{(inv.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3.5 text-center font-mono">
                      <span className="text-[11px] text-[#C4CBD8]">
                        {inv.ocr_accuracy_score}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      {inv.status === 'Validation Failed' ? (
                        <span className="text-[10px] font-mono text-[#F87171] bg-[#EF4444]/15 border border-[#EF4444]/30 px-2 py-0.5 rounded-xs">
                          Failed
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-[#2DD4BF] bg-[#0D9488]/15 border border-[#0D9488]/30 px-2 py-0.5 rounded-xs">
                          Passed
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 text-center font-mono">
                      <span className={`text-[10px] px-2 py-0.5 rounded-xs border ${
                        inv.match_status.includes('Matched')
                          ? 'bg-[#0D9488]/15 text-[#2DD4BF] border-[#0D9488]/30'
                          : inv.match_status.includes('Exception')
                            ? 'bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/30'
                            : 'bg-[#1E2534] text-[#8C96A8] border-[#282F3E]'
                      }`}>
                        {inv.match_status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-center font-mono">
                      <span className={`text-[10px] px-2 py-0.5 rounded-xs border ${
                        inv.status === 'Paid'
                          ? 'bg-[#2DD4BF]/15 text-[#2DD4BF] border-[#2DD4BF]/30'
                          : inv.status === 'Approved'
                            ? 'bg-[#0D9488]/15 text-[#2DD4BF] border-[#0D9488]/30'
                            : inv.status === 'Pending Approval' || inv.status === 'Escalated'
                              ? 'bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/30'
                              : 'bg-[#1E2534] text-[#8C96A8] border-[#282F3E]'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <button
                        onClick={() => setSelectedInvoiceId(inv.id)}
                        className="px-2 py-1 bg-[#1E2534] hover:bg-[#282F3E] text-[#E5E9F0] border border-[#2E374A] rounded-xs text-[11px] transition"
                      >
                        Desk →
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
      <div className="bg-[#121620] px-4 py-3 rounded-sm border border-[#232936] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSelectedInvoiceId(null)}
            className="p-1.5 rounded-sm border border-[#282F3E] bg-[#181D28] text-[#8C96A8] hover:text-white hover:bg-[#1E2534] transition"
            title="Return to directory"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-semibold text-sm text-[#E5E9F0]">{invoice.invoice_number}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-xs border ${
                invoice.status === 'Paid'
                  ? 'bg-[#2DD4BF]/15 text-[#2DD4BF] border-[#2DD4BF]/30'
                  : invoice.status === 'Approved'
                    ? 'bg-[#0D9488]/15 text-[#2DD4BF] border-[#0D9488]/30'
                    : 'bg-[#1E2534] text-[#8C96A8] border-[#282F3E]'
              }`}>
                {invoice.status}
              </span>
              <span className="text-[10px] font-mono text-[#7E8799] bg-[#181D28] px-2 py-0.5 rounded-xs border border-[#232936]">
                OCR {invoice.ocr_accuracy_score}%
              </span>
            </div>
            <div className="text-xs text-[#7E8799] mt-0.5 flex items-center space-x-2">
              <span>Vendor: <strong className="text-[#C4CBD8]">{invoice.vendor_name_raw}</strong></span>
              <span>/</span>
              <span>PO: <strong className="font-mono text-[#C4CBD8]">{invoice.po_number_raw || 'None'}</strong></span>
            </div>
          </div>
        </div>

        {/* Global Workbench Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={saveCorrections}
            disabled={saving}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-sm text-xs font-medium transition disabled:opacity-50 shadow-2xs"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save & re-evaluate</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-[#0D9488]/15 border border-[#0D9488]/30 rounded-sm text-[#2DD4BF] text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Split Grid: Left Document Viewer / Right Inspection Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT PANE: Rendered Document Preview Sheet */}
        <div className="lg:col-span-5 bg-[#121620] rounded-sm border border-[#232936] p-4 flex flex-col justify-between max-h-[750px] overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#1E2534] text-xs">
              <div className="flex items-center space-x-2 text-[#C4CBD8] font-mono">
                <FileText className="w-3.5 h-3.5 text-[#2DD4BF]" />
                <span className="truncate">{invoice.file_name || 'Tax_Invoice.pdf'}</span>
              </div>
              <span className="text-[10px] font-mono bg-[#181D28] text-[#7E8799] px-1.5 py-0.5 rounded-xs border border-[#232936]">
                Page 1 of 1
              </span>
            </div>

            {/* Rendered Invoice Sheet Paper Preview */}
            <div className="bg-[#181D28] border border-[#282F3E] rounded-sm p-4 font-sans text-xs space-y-4 shadow-inner">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-[#232936] pb-3">
                <div>
                  <div className="font-semibold text-sm text-[#E5E9F0]">{formData.vendor_name_raw}</div>
                  <div className="text-[11px] text-[#7E8799] font-mono mt-0.5">GSTIN: {formData.vendor_gstin_raw}</div>
                  <div className="text-[10px] text-[#64718A]">Tax invoice / legal billing document</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-medium text-[#2DD4BF]">{formData.invoice_number}</div>
                  <div className="text-[11px] text-[#7E8799] font-mono">Date: {formData.invoice_date || 'N/A'}</div>
                  <div className="text-[11px] text-[#7E8799] font-mono">Due: {formData.due_date || 'Net 30'}</div>
                </div>
              </div>

              {/* Billed To */}
              <div className="bg-[#121620] p-3 rounded-sm border border-[#232936] text-[11px] space-y-0.5">
                <span className="text-[#64718A] text-[10px] block font-mono">Customer / Payer</span>
                <div className="font-medium text-[#E5E9F0]">Templegate Enterprise Solutions Ltd.</div>
                <div className="text-[#8C96A8] font-mono">GSTIN: 29AAACT9876Q1Z2 / Karnataka (29)</div>
                <div className="text-[#8C96A8] font-mono">Purchase order: {formData.po_number_raw || 'Direct Vendor PO'}</div>
              </div>

              {/* Line Items Preview */}
              <div className="border border-[#232936] rounded-sm overflow-hidden bg-[#121620]">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-[#181D28] text-[#8C96A8] border-b border-[#232936]">
                      <th className="py-1.5 px-2 font-medium">Item</th>
                      <th className="py-1.5 px-1 font-mono text-center font-medium">HSN</th>
                      <th className="py-1.5 px-1 text-right font-medium">Qty</th>
                      <th className="py-1.5 px-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2534]">
                    {formData.line_items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 px-2 text-[#C4CBD8] truncate max-w-[140px]">{item.description}</td>
                        <td className="py-1.5 px-1 text-center font-mono text-[#7E8799]">{item.hsn_code || '—'}</td>
                        <td className="py-1.5 px-1 text-right font-mono text-[#C4CBD8]">{item.quantity}</td>
                        <td className="py-1.5 px-2 text-right font-mono font-medium text-[#E5E9F0]">₹{(item.total_amount || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="pt-2 border-t border-[#232936] text-right space-y-1 text-xs">
                <div className="text-[#7E8799]">Subtotal: <strong className="font-mono text-[#E5E9F0]">₹{(formData.subtotal || 0).toLocaleString('en-IN')}</strong></div>
                <div className="text-[#7E8799]">GST Tax: <strong className="font-mono text-[#E5E9F0]">₹{(formData.tax_amount || 0).toLocaleString('en-IN')}</strong></div>
                <div className="text-sm font-semibold text-[#E5E9F0] pt-1 border-t border-[#232936]">
                  Grand Total: <span className="font-mono text-[#2DD4BF]">₹{(formData.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* OCR Raw Stream Toggle */}
            <details className="text-[11px] text-[#7E8799] bg-[#181D28] rounded-sm p-2.5 border border-[#232936]">
              <summary className="font-medium text-[#C4CBD8] cursor-pointer">View raw OCR stream</summary>
              <pre className="mt-2 font-mono text-[10px] text-[#8C96A8] whitespace-pre-wrap max-h-36 overflow-y-auto bg-[#121620] p-2 rounded-sm border border-[#232936]">
                {invoice.ocr_raw_text}
              </pre>
            </details>
          </div>
        </div>

        {/* RIGHT PANE: Unified Inspection Tabs */}
        <div className="lg:col-span-7 bg-[#121620] rounded-sm border border-[#232936] flex flex-col">
          {/* Sub Tabs */}
          <div className="flex border-b border-[#232936] px-4 pt-2.5 overflow-x-auto text-xs">
            {[
              { id: 'data', label: 'Financials & lines' },
              { id: 'validation', label: 'Compliance rules', count: invoice.validations?.length },
              { id: 'matching', label: 'PO reconciliation', badge: invoice.match_status },
              { id: 'approval', label: 'Approval matrix' },
              { id: 'erp', label: 'ERP & audit' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setWorkbenchTab(tab.id)}
                className={`pb-2.5 px-3 font-medium transition border-b-2 whitespace-nowrap flex items-center space-x-1.5 text-xs ${
                  workbenchTab === tab.id
                    ? 'border-[#2DD4BF] text-white'
                    : 'border-transparent text-[#7E8799] hover:text-[#C4CBD8]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="text-[10px] bg-[#181D28] text-[#8C96A8] font-mono px-1.5 py-0.2 rounded-xs border border-[#232936]">
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="text-[10px] font-mono text-[#8C96A8] bg-[#181D28] px-1.5 py-0.2 rounded-xs border border-[#232936]">
                    {tab.badge.split(' ')[0]}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-4 flex-1 overflow-y-auto max-h-[700px]">
            {/* TAB 1: FINANCIALS & LINE ITEMS */}
            {workbenchTab === 'data' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-[#8C96A8]">Invoice number</label>
                    <input
                      type="text"
                      value={formData.invoice_number}
                      onChange={(e) => handleFieldChange('invoice_number', e.target.value)}
                      className="mt-1 w-full bg-[#181D28] border border-[#282F3E] rounded-sm px-3 py-1.5 text-xs font-mono text-[#E5E9F0] focus:border-[#0D9488] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#8C96A8]">PO reference</label>
                    <input
                      type="text"
                      value={formData.po_number_raw}
                      onChange={(e) => handleFieldChange('po_number_raw', e.target.value)}
                      className="mt-1 w-full bg-[#181D28] border border-[#282F3E] rounded-sm px-3 py-1.5 text-xs font-mono text-[#E5E9F0] focus:border-[#0D9488] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#8C96A8]">Vendor entity</label>
                    <input
                      type="text"
                      value={formData.vendor_name_raw}
                      onChange={(e) => handleFieldChange('vendor_name_raw', e.target.value)}
                      className="mt-1 w-full bg-[#181D28] border border-[#282F3E] rounded-sm px-3 py-1.5 text-xs text-[#E5E9F0] focus:border-[#0D9488] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#8C96A8]">Vendor GSTIN</label>
                    <input
                      type="text"
                      value={formData.vendor_gstin_raw}
                      onChange={(e) => handleFieldChange('vendor_gstin_raw', e.target.value)}
                      className="mt-1 w-full bg-[#181D28] border border-[#282F3E] rounded-sm px-3 py-1.5 text-xs font-mono text-[#E5E9F0] focus:border-[#0D9488] outline-none uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#8C96A8]">Invoice date</label>
                    <input
                      type="date"
                      value={formData.invoice_date}
                      onChange={(e) => handleFieldChange('invoice_date', e.target.value)}
                      className="mt-1 w-full bg-[#181D28] border border-[#282F3E] rounded-sm px-3 py-1.5 text-xs font-mono text-[#E5E9F0] focus:border-[#0D9488] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#8C96A8]">Due date</label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => handleFieldChange('due_date', e.target.value)}
                      className="mt-1 w-full bg-[#181D28] border border-[#282F3E] rounded-sm px-3 py-1.5 text-xs font-mono text-[#E5E9F0] focus:border-[#0D9488] outline-none"
                    />
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#E5E9F0]">Itemized material & service lines</span>
                    <button
                      type="button"
                      onClick={addLineItem}
                      className="px-2 py-1 bg-[#181D28] hover:bg-[#1E2534] text-[#C4CBD8] border border-[#282F3E] rounded-xs text-[11px] font-medium"
                    >
                      + Add line
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-[#232936] rounded-sm">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#181D28] text-[10px] text-[#8C96A8] border-b border-[#232936]">
                          <th className="py-2 px-2.5 font-medium">#</th>
                          <th className="py-2 px-2.5 font-medium">Description</th>
                          <th className="py-2 px-2 font-mono font-medium">HSN</th>
                          <th className="py-2 px-2 text-right font-medium">Qty</th>
                          <th className="py-2 px-2 text-right font-medium">Rate</th>
                          <th className="py-2 px-2 text-right font-medium">Tax%</th>
                          <th className="py-2 px-2.5 text-right font-medium">Total</th>
                          <th className="py-2 px-1 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E2534]">
                        {formData.line_items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-2.5 text-[#64718A] font-mono text-[11px]">{idx + 1}</td>
                            <td className="py-2 px-2.5">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                                className="w-full bg-transparent border-b border-transparent hover:border-[#282F3E] focus:border-[#0D9488] outline-none text-xs text-[#E5E9F0]"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={item.hsn_code || ''}
                                onChange={(e) => handleLineItemChange(idx, 'hsn_code', e.target.value)}
                                className="w-14 bg-transparent border-b border-transparent hover:border-[#282F3E] focus:border-[#0D9488] outline-none text-xs font-mono text-[#8C96A8]"
                              />
                            </td>
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                                className="w-12 text-right bg-transparent border-b border-transparent hover:border-[#282F3E] focus:border-[#0D9488] outline-none text-xs font-mono text-[#E5E9F0]"
                              />
                            </td>
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number"
                                value={item.unit_price}
                                onChange={(e) => handleLineItemChange(idx, 'unit_price', e.target.value)}
                                className="w-16 text-right bg-transparent border-b border-transparent hover:border-[#282F3E] focus:border-[#0D9488] outline-none text-xs font-mono text-[#E5E9F0]"
                              />
                            </td>
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number"
                                value={item.tax_rate}
                                onChange={(e) => handleLineItemChange(idx, 'tax_rate', e.target.value)}
                                className="w-10 text-right bg-transparent border-b border-transparent hover:border-[#282F3E] focus:border-[#0D9488] outline-none text-xs font-mono text-[#E5E9F0]"
                              />
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono font-medium text-[#2DD4BF]">
                              ₹{(item.total_amount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 px-1 text-center">
                              <button
                                type="button"
                                onClick={() => removeLineItem(idx)}
                                className="text-[#64718A] hover:text-[#EF4444] p-1 transition"
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
                <div className="bg-[#181D28] p-3 rounded-sm border border-[#232936] flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[#7E8799]">Taxable base: </span>
                    <strong className="font-mono text-[#E5E9F0]">₹{(formData.subtotal || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span className="text-[#7E8799]">Taxes: </span>
                    <strong className="font-mono text-[#E5E9F0]">₹{(formData.tax_amount || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[#7E8799]">Gross total: </span>
                    <span className="text-sm font-semibold font-mono text-[#2DD4BF]">
                      ₹{(formData.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: COMPLIANCE CHECKS */}
            {workbenchTab === 'validation' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-[#E5E9F0]">5-point automated validation results</h3>
                  <p className="text-[11px] text-[#7E8799]">Verifies arithmetic balance, duplicate hashes, GSTIN compliance, and vendor master status</p>
                </div>

                <div className="space-y-2">
                  {invoice.validations?.map((v) => (
                    <div 
                      key={v.id} 
                      className={`p-3 rounded-sm border text-xs space-y-1 ${
                        v.status === 'Passed' 
                          ? 'border-[#232936] bg-[#181D28]' 
                          : v.status === 'Warning' 
                            ? 'border-[#F59E0B]/30 bg-[#F59E0B]/10' 
                            : 'border-[#EF4444]/30 bg-[#EF4444]/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 font-medium text-[#E5E9F0]">
                          {v.status === 'Passed' ? (
                            <CheckCircle2 className="w-4 h-4 text-[#2DD4BF]" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                          )}
                          <span>{v.rule_name}</span>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.2 rounded-xs border ${
                          v.status === 'Passed' ? 'bg-[#0D9488]/15 text-[#2DD4BF] border-[#0D9488]/30' : 'bg-[#EF4444]/15 text-[#F87171] border-[#EF4444]/30'
                        }`}>
                          {v.status}
                        </span>
                      </div>
                      <p className="text-[#8C96A8] text-[11px] leading-relaxed">{v.message}</p>
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
                    <h3 className="text-xs font-semibold text-[#E5E9F0]">Multi-way PO & delivery receipt matching</h3>
                    <p className="text-[11px] text-[#7E8799]">Reconcile invoiced quantities and unit rates against purchase orders</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 bg-[#181D28] border border-[#282F3E] rounded-sm px-2 py-1 text-xs font-mono">
                      <span className="text-[#7E8799]">Tol:</span>
                      <input
                        type="number"
                        value={tolerance}
                        onChange={(e) => setTolerance(e.target.value)}
                        className="w-8 bg-transparent text-right outline-none font-medium text-[#E5E9F0]"
                      />
                      <span className="text-[#7E8799]">%</span>
                    </div>

                    <button
                      onClick={() => executeMatching('3-Way')}
                      disabled={matching}
                      className="px-2.5 py-1 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-sm text-xs font-medium transition"
                    >
                      Run 3-way match
                    </button>
                  </div>
                </div>

                {matchResult ? (
                  <div className="space-y-3">
                    <div className={`p-3 rounded-sm border flex items-center justify-between text-xs ${
                      matchResult.within_tolerance && matchResult.status === 'Matched'
                        ? 'bg-[#0D9488]/15 border-[#0D9488]/30 text-[#2DD4BF]'
                        : 'bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#FBBF24]'
                    }`}>
                      <div>
                        <strong>{matchResult.match_type} reconciliation: {matchResult.status}</strong>
                        <div className="text-[11px] opacity-80 font-mono mt-0.5">
                          Variance: ₹{(matchResult.variance_amount || 0).toLocaleString('en-IN')} (Allowed: ±{matchResult.tolerance_applied}%)
                        </div>
                      </div>
                      <span className="font-mono text-xs text-[#E5E9F0]">
                        PO #{matchResult.details_json?.po_number || invoice.po_number_raw || 'None'}
                      </span>
                    </div>

                    {lineComparisons.length > 0 && (
                      <div className="border border-[#232936] rounded-sm overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-[#181D28] text-[10px] text-[#8C96A8] border-b border-[#232936]">
                              <th className="py-2 px-2.5 font-medium">Item</th>
                              <th className="py-2 px-2 text-center font-medium">Inv qty</th>
                              <th className="py-2 px-2 text-center font-medium">PO qty</th>
                              <th className="py-2 px-2 text-center font-medium">GRN qty</th>
                              <th className="py-2 px-2 text-right font-medium">Inv rate</th>
                              <th className="py-2 px-2 text-right font-medium">PO rate</th>
                              <th className="py-2 px-2 text-center font-medium">Variance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1E2534] font-mono text-[11px]">
                            {lineComparisons.map((lc, idx) => (
                              <tr key={idx}>
                                <td className="py-2 px-2.5 font-sans font-medium text-[#C4CBD8] truncate max-w-[120px]">{lc.item_description}</td>
                                <td className="py-2 px-2 text-center text-[#2DD4BF]">{lc.invoice_qty}</td>
                                <td className="py-2 px-2 text-center text-[#C4CBD8]">{lc.po_qty}</td>
                                <td className="py-2 px-2 text-center text-[#8C96A8]">{lc.grn_qty !== null ? lc.grn_qty : '—'}</td>
                                <td className="py-2 px-2 text-right text-[#C4CBD8]">₹{lc.invoice_unit_price}</td>
                                <td className="py-2 px-2 text-right text-[#C4CBD8]">₹{lc.po_unit_price}</td>
                                <td className="py-2 px-2 text-center">
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded-xs font-mono ${
                                    lc.price_within_tolerance ? 'bg-[#0D9488]/15 text-[#2DD4BF]' : 'bg-[#EF4444]/15 text-[#F87171]'
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
                  <div className="p-6 text-center text-[#7E8799] text-xs border border-dashed border-[#282F3E] rounded-sm">
                    Reconciliation has not been executed yet. Click "Run 3-way match".
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: APPROVAL GOVERNANCE */}
            {workbenchTab === 'approval' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-[#E5E9F0]">Approval governance & policy matrix</h3>
                  <p className="text-[11px] text-[#7E8799]">Sign-off trail and departmental budget sign-off</p>
                </div>

                <div className="bg-[#181D28] p-3 rounded-sm border border-[#232936] text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#7E8799]">Current step:</span>
                    <strong className="text-[#E5E9F0] font-mono">Tier {invoice.current_approval_step} - {invoice.assigned_to_role}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#7E8799]">Status:</span>
                    <span className="font-mono text-[#FBBF24]">{invoice.status}</span>
                  </div>
                </div>

                {/* Comment & Actions */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-medium text-[#C4CBD8]">Audit remarks / sign-off comments</label>
                  <input
                    type="text"
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    placeholder="Enter approval note or exception sign-off reasoning..."
                    className="w-full bg-[#181D28] border border-[#282F3E] rounded-sm px-3 py-2 text-xs text-[#E5E9F0] outline-none focus:border-[#0D9488]"
                  />

                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      onClick={() => handleApprovalAction('REJECT')}
                      disabled={actionLoading === 'REJECT'}
                      className="px-3 py-1.5 bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#F87171] border border-[#EF4444]/30 rounded-sm text-xs font-medium transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprovalAction('ESCALATE')}
                      disabled={actionLoading === 'ESCALATE'}
                      className="px-3 py-1.5 bg-[#F59E0B]/15 hover:bg-[#F59E0B]/25 text-[#FBBF24] border border-[#F59E0B]/30 rounded-sm text-xs font-medium transition"
                    >
                      Escalate
                    </button>
                    <button
                      onClick={() => handleApprovalAction('APPROVE')}
                      disabled={actionLoading === 'APPROVE'}
                      className="px-3.5 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-sm text-xs font-medium shadow-2xs flex items-center gap-1.5 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve invoice</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: ERP & AUDIT */}
            {workbenchTab === 'erp' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-[#E5E9F0]">General ledger & ERP sync</h3>
                  <p className="text-[11px] text-[#7E8799]">ERP posting status and historical payload generation</p>
                </div>

                <div className="bg-[#181D28] p-3 rounded-sm border border-[#232936] text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#7E8799]">ERP status:</span>
                    <strong className="text-[#E5E9F0] font-mono">{invoice.erp_sync_status}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7E8799]">Voucher ref:</span>
                    <strong className="font-mono text-[#2DD4BF]">{invoice.erp_reference || 'Pending Sync'}</strong>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('erp')}
                  className="px-3 py-1.5 bg-[#181D28] hover:bg-[#1E2534] text-[#E5E9F0] border border-[#282F3E] rounded-sm text-xs font-medium transition"
                >
                  Manage ERP gateways & vouchers →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
