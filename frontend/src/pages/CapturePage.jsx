import React, { useState, useRef } from 'react';
import api from '../api';
import { 
  UploadCloud, 
  FileText, 
  Mail, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  RefreshCw,
  Eye,
  FileCheck,
  Check,
  Building,
  ShieldCheck,
  Inbox
} from 'lucide-react';

export const CapturePage = ({ setActiveTab, setSelectedInvoiceId }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [emailIngesting, setEmailIngesting] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const executeUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('source', selectedFiles.length > 1 ? 'Bulk' : 'Upload');

      const res = await api.post('/invoices/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadResults(res.data);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to process document intake.');
    } finally {
      setUploading(false);
    }
  };

  const triggerEmailIngestion = async () => {
    setEmailIngesting(true);
    setErrorMsg('');
    try {
      const res = await api.post('/invoices/ingest-email', null, {
        params: {
          vendor_email: 'billing@apexcloud.in',
          subject: 'Invoice for Q1 Cloud Infrastructure & Server Hosting'
        }
      });
      setUploadResults(prev => [res.data, ...prev]);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Vendor email poller failed.');
    } finally {
      setEmailIngesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Invoice Intake & Ingestion</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingest invoices via drag-and-drop, batch scanning, or automated supplier email monitoring.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={triggerEmailIngestion}
            disabled={emailIngesting}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium shadow-2xs transition disabled:opacity-50"
          >
            {emailIngesting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
            ) : (
              <Mail className="w-3.5 h-3.5 text-sky-600" />
            )}
            <span>Poll Invoices Mailbox (IMAP)</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Upload Dropzone & Email / Channel Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Zone */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Upload Invoices</h2>
            <span className="text-[11px] text-slate-400">PDF, JPG, PNG, TIFF up to 25MB</span>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center ${
              dragActive 
                ? 'border-sky-500 bg-sky-50/40' 
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mb-2.5">
              <UploadCloud className="w-6 h-6 text-sky-600" />
            </div>
            <p className="text-xs font-semibold text-slate-800">
              Drag & drop invoice files here, or <span className="text-sky-600 underline">browse device</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports single files or multi-document batch ingestion
            </p>
          </div>

          {/* Staged Files List */}
          {selectedFiles.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} staged for extraction:
                </span>
                <button
                  onClick={executeUpload}
                  disabled={uploading}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Extracting fields & line items...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Start OCR Extraction</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-1 max-h-36 overflow-y-auto">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80">
                    <div className="flex items-center space-x-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">{file.name}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ingestion Channels & Email Polling Status */}
        <div className="bg-slate-900 text-white p-5 rounded-xl flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center space-x-2 text-xs text-sky-400 font-semibold uppercase tracking-wider">
              <Inbox className="w-4 h-4" />
              <span>Configured Inbound Channels</span>
            </div>
            
            <div className="mt-4 space-y-3 text-xs">
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
                <div className="font-semibold text-slate-200 flex items-center justify-between">
                  <span>Vendor AP Mailbox</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.2 rounded">Active</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">invoices@templegate.com</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Poll frequency: Every 5 minutes</div>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
                <div className="font-semibold text-slate-200 flex items-center justify-between">
                  <span>Supplier Portal Upload</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.2 rounded">Online</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Direct upload via vendor onboarding portal</div>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
                <div className="font-semibold text-slate-200">Optical Character Recognition</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Full multi-page parsing, table boundary extraction, HSN/SAC identification, and GST tax decomposition.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Ingested documents undergo instant automated validation & PO matching checks.
          </div>
        </div>
      </div>

      {/* Recently Ingested Invoices */}
      {uploadResults.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Recently Ingested Invoices ({uploadResults.length})</h2>
            <button
              onClick={() => setActiveTab('invoices')}
              className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1"
            >
              <span>View All in Invoices Workbench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadResults.map((inv) => (
              <div key={inv.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-slate-900">{inv.invoice_number}</span>
                  <span className="text-[10px] font-semibold font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    OCR {inv.ocr_accuracy_score}%
                  </span>
                </div>

                <div className="text-xs space-y-0.5">
                  <div className="font-medium text-slate-800 truncate">{inv.vendor_name_raw || 'Unknown Vendor'}</div>
                  <div className="text-[11px] text-slate-500 font-mono">GSTIN: {inv.vendor_gstin_raw || 'Missing'}</div>
                  <div className="text-[11px] text-slate-500 font-mono">PO Ref: {inv.po_number_raw || 'None'}</div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Grand Total</span>
                    <span className="font-bold text-slate-900 font-mono">₹{(inv.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedInvoiceId(inv.id);
                      setActiveTab('invoices');
                    }}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Review</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
