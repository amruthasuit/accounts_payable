import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  BarChart3, 
  Download, 
  FileText, 
  AlertTriangle, 
  ShieldCheck, 
  History, 
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

export const ReportsPage = () => {
  const [activeReportTab, setActiveReportTab] = useState('aging'); // 'aging', 'status', 'exceptions', 'audit', 'gst'
  const [reportData, setReportData] = useState([]);
  const [gstSummary, setGstSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReport = async (tab) => {
    try {
      setLoading(true);
      setSearchTerm('');
      if (tab === 'aging') {
        const res = await api.get('/reports/aging');
        setReportData(res.data);
      } else if (tab === 'status') {
        const res = await api.get('/reports/status');
        setReportData(res.data);
      } else if (tab === 'exceptions') {
        const res = await api.get('/reports/exceptions');
        setReportData(res.data);
      } else if (tab === 'audit') {
        const res = await api.get('/reports/audit');
        setReportData(res.data);
      } else if (tab === 'gst') {
        const res = await api.get('/reports/gst');
        setGstSummary(res.data.summary);
        setReportData(res.data.records);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(activeReportTab);
  }, [activeReportTab]);

  const exportToCSV = () => {
    if (reportData.length === 0) return;
    const headers = Object.keys(reportData[0]);
    const csvRows = [
      headers.join(','),
      ...reportData.map(row => 
        headers.map(h => {
          const val = row[h];
          return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
        }).join(',')
      )
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AP_${activeReportTab.toUpperCase()}_REPORT_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredData = reportData.filter(row => {
    if (!searchTerm) return true;
    return JSON.stringify(row).toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#232936] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#0D9488]"></span>
            <h1 className="text-lg font-semibold text-[#E5E9F0] tracking-tight">Financial Reports & Audit Ledger</h1>
          </div>
          <p className="text-xs text-[#7E8799] mt-0.5">
            Statutory aging schedules, lifecycle status, variance logs, Input Tax Credit (ITC) reconciliation, and audit trails
          </p>
        </div>

        <button
          onClick={exportToCSV}
          disabled={reportData.length === 0}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-sm text-xs font-medium shadow-2xs transition disabled:opacity-50 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Report Categories Tabs */}
      <div className="flex space-x-1 overflow-x-auto bg-[#121620] p-1 rounded-sm border border-[#232936] text-xs">
        {[
          { id: 'aging', label: 'AP aging schedule' },
          { id: 'status', label: 'Processing status ledger' },
          { id: 'exceptions', label: 'Variance & exception log' },
          { id: 'audit', label: 'Statutory audit trail' },
          { id: 'gst', label: 'GSTR-2B ITC reconciliation' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id)}
            className={`px-3 py-1 rounded-xs whitespace-nowrap transition text-xs font-medium ${
              activeReportTab === tab.id
                ? 'bg-[#1E2534] text-white border border-[#2E374A]'
                : 'text-[#8C96A8] hover:text-[#E5E9F0]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-[#64718A] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter report records by invoice number, vendor, rule, or actor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#121620] border border-[#232936] rounded-sm pl-8 pr-4 py-2 text-xs text-[#E5E9F0] placeholder-[#64718A] outline-none focus:border-[#0D9488]"
        />
      </div>

      {/* GST Summary Cards if on GST Tab */}
      {activeReportTab === 'gst' && gstSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
          <div className="bg-[#121620] p-3.5 rounded-sm border border-[#232936]">
            <span className="text-[10px] text-[#7E8799] font-mono block">Total ITC claimable</span>
            <div className="text-xl font-semibold font-mono text-[#2DD4BF] mt-1">₹{gstSummary.total_itc_available.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-[#121620] p-3.5 rounded-sm border border-[#232936]">
            <span className="text-[10px] text-[#7E8799] font-mono block">CGST total</span>
            <div className="text-xl font-semibold font-mono text-[#E5E9F0] mt-1">₹{gstSummary.cgst_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-[#121620] p-3.5 rounded-sm border border-[#232936]">
            <span className="text-[10px] text-[#7E8799] font-mono block">SGST total</span>
            <div className="text-xl font-semibold font-mono text-[#E5E9F0] mt-1">₹{gstSummary.sgst_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-[#121620] p-3.5 rounded-sm border border-[#232936]">
            <span className="text-[10px] text-[#7E8799] font-mono block">IGST total</span>
            <div className="text-xl font-semibold font-mono text-[#E5E9F0] mt-1">₹{gstSummary.igst_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
      )}

      {/* Report Table */}
      <div className="bg-[#121620] rounded-sm border border-[#232936] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <RefreshCw className="w-6 h-6 text-[#0D9488] animate-spin" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-8 text-center text-[#7E8799] text-xs font-mono">
            No records found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#181D28] text-[10px] text-[#8C96A8] border-b border-[#232936]">
                  {Object.keys(filteredData[0]).map((key) => (
                    <th key={key} className="py-2.5 px-3 font-medium">
                      {key.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2534]">
                {filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#181D28]/60 transition">
                    {Object.entries(row).map(([k, val], cIdx) => (
                      <td key={cIdx} className="py-2.5 px-3">
                        {typeof val === 'number' && (k.includes('amount') || k.includes('tax') || k.includes('value') || k.includes('total')) ? (
                          <span className="font-mono font-medium text-[#E5E9F0]">
                            ₹{val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        ) : typeof val === 'string' && (val === 'Passed' || val === 'Eligible' || val === 'Settled' || val === 'Approved') ? (
                          <span className="text-[10px] font-mono text-[#2DD4BF] bg-[#0D9488]/15 border border-[#0D9488]/30 px-2 py-0.5 rounded-xs">
                            {val}
                          </span>
                        ) : typeof val === 'string' && (val === 'Failed' || val === 'Critical' || val === 'Rejected' || val.includes('Ineligible')) ? (
                          <span className="text-[10px] font-mono text-[#F87171] bg-[#EF4444]/15 border border-[#EF4444]/30 px-2 py-0.5 rounded-xs">
                            {val}
                          </span>
                        ) : (
                          <span className="text-[#C4CBD8] font-mono text-xs">{String(val)}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
