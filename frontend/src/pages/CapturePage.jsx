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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#232936] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#0D9488]"></span>
            <h1 className="text-lg font-semibold text-[#E5E9F0] tracking-tight">Invoice Intake & Multi-Channel Capture</h1>
          </div>
          <p className="text-xs text-[#7E8799] mt-0.5">
            Ingest invoices via batch scanning, file drop, or automated supplier inbox monitoring
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={triggerEmailIngestion}
            disabled={emailIngesting}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#181D28] hover:bg-[#1E2534] text-[#E5E9F0] border border-[#282F3E] rounded-sm text-xs font-medium transition disabled:opacity-50"
          >
            {emailIngesting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#2DD4BF]" />
            ) : (
              <Mail className="w-3.5 h-3.5 text-[#2DD4BF]" />
            )}
            <span>Poll supplier mailbox (IMAP)</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-sm text-[#FCA5A5] text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#EF4444]" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Upload Dropzone & Email / Channel Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upload Zone */}
        <div className="lg:col-span-2 bg-[#121620] p-5 rounded-sm border border-[#232936] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2534] pb-2.5">
            <div>
              <h2 className="text-xs font-semibold text-[#E5E9F0]">Document upload station</h2>
              <p className="text-[11px] text-[#7E8799]">Direct optical extraction with automated field normalization</p>
            </div>
            <span className="text-[11px] font-mono text-[#64718A]">PDF, JPG, PNG, TIFF up to 25MB</span>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-sm p-8 text-center cursor-pointer transition flex flex-col items-center justify-center ${
              dragActive 
                ? 'border-[#0D9488] bg-[#0D9488]/10' 
                : 'border-[#282F3E] hover:border-[#3E485E] bg-[#181D28]/60'
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
            <div className="w-10 h-10 rounded-sm bg-[#1E2534] text-[#2DD4BF] flex items-center justify-center mb-2.5 border border-[#2E374A]">
              <UploadCloud className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-[#E5E9F0]">
              Drag and drop invoice files here, or <span className="text-[#2DD4BF] underline">browse local storage</span>
            </p>
            <p className="text-[11px] text-[#7E8799] mt-1 font-mono">
              Engine processes header key-values, line tables, and HSN/SAC codes
            </p>
          </div>

          {/* Staged Files List */}
          {selectedFiles.length > 0 && (
            <div className="pt-3 border-t border-[#1E2534] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#C4CBD8]">
                  {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} staged for optical extraction:
                </span>
                <button
                  onClick={executeUpload}
                  disabled={uploading}
                  className="px-3 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-medium text-xs rounded-sm shadow-2xs flex items-center gap-1.5 disabled:opacity-50 transition"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Parsing tables & lines...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Start extraction</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-[#181D28] px-3 py-2 rounded-sm border border-[#232936]">
                    <div className="flex items-center space-x-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-[#7E8799] shrink-0" />
                      <span className="font-mono text-[#E5E9F0] truncate">{file.name}</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#7E8799]">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ingestion Channels & Pipeline Status */}
        <div className="bg-[#121620] border border-[#232936] p-4 rounded-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-[#E5E9F0] border-b border-[#1E2534] pb-2.5">
              <Inbox className="w-4 h-4 text-[#2DD4BF]" />
              <span>Configured intake listeners</span>
            </div>
            
            <div className="mt-3.5 space-y-2.5 text-xs">
              <div className="bg-[#181D28] p-3 rounded-sm border border-[#232936]">
                <div className="font-medium text-[#E5E9F0] flex items-center justify-between">
                  <span>Vendor AP Mailbox</span>
                  <span className="text-[10px] font-mono text-[#2DD4BF] bg-[#0D9488]/15 border border-[#0D9488]/30 px-1.5 py-0.2 rounded-xs">Listening</span>
                </div>
                <div className="text-[11px] text-[#8C96A8] mt-1 font-mono">invoices@templegate.com</div>
                <div className="text-[10px] text-[#64718A] mt-0.5 font-mono">Poll cadence: every 5 minutes</div>
              </div>

              <div className="bg-[#181D28] p-3 rounded-sm border border-[#232936]">
                <div className="font-medium text-[#E5E9F0] flex items-center justify-between">
                  <span>Supplier Self-Serve Portal</span>
                  <span className="text-[10px] font-mono text-[#2DD4BF] bg-[#0D9488]/15 border border-[#0D9488]/30 px-1.5 py-0.2 rounded-xs">Online</span>
                </div>
                <div className="text-[11px] text-[#8C96A8] mt-1">Direct upload via supplier vendor interface</div>
              </div>

              <div className="bg-[#181D28] p-3 rounded-sm border border-[#232936]">
                <div className="font-medium text-[#E5E9F0]">OCR parsing pipeline</div>
                <div className="text-[11px] text-[#8C96A8] mt-1 leading-relaxed">
                  Automatic table bounding, itemized quantity/rate extraction, and multi-slab GST tax reconciliation.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1E2534] text-[11px] text-[#7E8799]">
            Ingested records immediately queue into the 5-point validation and 3-way matching routines.
          </div>
        </div>
      </div>

      {/* Recently Ingested Invoices */}
      {uploadResults.length > 0 && (
        <div className="bg-[#121620] p-4 rounded-sm border border-[#232936] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1E2534] pb-2.5">
            <div>
              <h2 className="text-xs font-semibold text-[#E5E9F0]">Recently ingested items ({uploadResults.length})</h2>
              <p className="text-[11px] text-[#7E8799]">Awaiting review or automated matching pass</p>
            </div>
            <button
              onClick={() => setActiveTab('invoices')}
              className="text-xs text-[#2DD4BF] hover:text-[#5EEAD4] font-medium flex items-center gap-1 transition"
            >
              <span>View in invoices ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {uploadResults.map((inv) => (
              <div key={inv.id} className="border border-[#232936] rounded-sm p-3.5 bg-[#181D28] hover:border-[#2E374A] transition space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-medium text-xs text-[#E5E9F0]">{inv.invoice_number}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-[#0D9488]/15 text-[#2DD4BF] border border-[#0D9488]/30">
                    OCR {inv.ocr_accuracy_score}%
                  </span>
                </div>

                <div className="text-xs space-y-0.5">
                  <div className="font-medium text-[#C4CBD8] truncate">{inv.vendor_name_raw || 'Unidentified supplier'}</div>
                  <div className="text-[11px] text-[#7E8799] font-mono">GSTIN: {inv.vendor_gstin_raw || 'Pending'}</div>
                  <div className="text-[11px] text-[#7E8799] font-mono">PO ref: {inv.po_number_raw || 'None'}</div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#232936] text-xs">
                  <div>
                    <span className="text-[#64718A] text-[10px] block font-mono">Grand total</span>
                    <span className="font-medium text-[#E5E9F0] font-mono">₹{(inv.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedInvoiceId(inv.id);
                      setActiveTab('invoices');
                    }}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-[#1E2534] hover:bg-[#282F3E] text-[#E5E9F0] border border-[#2E374A] rounded-sm text-xs font-medium transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#2DD4BF]" />
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
