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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Financial Reports & Audit Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Statutory aging schedules, lifecycle status, variance logs, Input Tax Credit (ITC) reconciliation, and audit trails.
          </p>
        </div>

        <button
          onClick={exportToCSV}
          disabled={reportData.length === 0}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Report Categories Tabs */}
      <div className="flex space-x-1.5 overflow-x-auto bg-slate-200/70 p-1 rounded-xl text-xs font-medium">
        {[
          { id: 'aging', label: 'AP Aging Schedule' },
          { id: 'status', label: 'Invoice Processing Ledger' },
          { id: 'exceptions', label: 'Variance & Exception Log' },
          { id: 'audit', label: 'Statutory Audit Trail' },
          { id: 'gst', label: 'GSTR-2B ITC Reconciliation' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeReportTab === tab.id
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter report records by invoice number, vendor, rule, or actor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-4 py-2 text-xs text-slate-900 outline-none focus:border-sky-500 shadow-2xs font-medium"
        />
      </div>

      {/* GST Summary Cards if on GST Tab */}
      {activeReportTab === 'gst' && gstSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-semibold text-slate-500">Total ITC Claimable</span>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-1">₹{gstSummary.total_itc_available.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-semibold text-slate-500">CGST Total</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">₹{gstSummary.cgst_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-semibold text-slate-500">SGST Total</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">₹{gstSummary.sgst_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-semibold text-slate-500">IGST Total</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">₹{gstSummary.igst_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
      )}

      {/* Report Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <RefreshCw className="w-7 h-7 text-sky-600 animate-spin" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No records found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase border-b border-slate-200">
                  {Object.keys(filteredData[0]).map((key) => (
                    <th key={key} className="py-2.5 px-3 capitalize">
                      {key.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    {Object.entries(row).map(([k, val], cIdx) => (
                      <td key={cIdx} className="py-2.5 px-3">
                        {typeof val === 'number' && (k.includes('amount') || k.includes('tax') || k.includes('value') || k.includes('total')) ? (
                          <span className="font-mono font-bold text-slate-900">
                            ₹{val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        ) : typeof val === 'string' && (val === 'Passed' || val === 'Eligible' || val === 'Settled' || val === 'Approved') ? (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            {val}
                          </span>
                        ) : typeof val === 'string' && (val === 'Failed' || val === 'Critical' || val === 'Rejected' || val.includes('Ineligible')) ? (
                          <span className="text-[10px] font-semibold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            {val}
                          </span>
                        ) : (
                          <span className="text-slate-700 font-medium">{String(val)}</span>
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
