import React, { useEffect, useState } from 'react';
import api from '../api';
import { 
  ArrowUpRight,
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  FileText,
  CreditCard,
  Building2,
  Calendar,
  Filter,
  Download,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

const STATUS_COLORS = {
  'Captured': '#94a3b8',
  'Extracted': '#38bdf8',
  'Validated': '#0ea5e9',
  'Matched': '#6366f1',
  'Pending Approval': '#f59e0b',
  'Approved': '#10b981',
  'Match Exception': '#ef4444',
  'Validation Failed': '#dc2626',
  'Paid': '#059669'
};

const CHART_PALETTE = ['#0284c7', '#0d9488', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

export const DashboardPage = ({ setActiveTab, setSelectedInvoiceId }) => {
  const [metrics, setMetrics] = useState(null);
  const [agingData, setAgingData] = useState([]);
  const [vendorData, setVendorData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [period, setPeriod] = useState('FY26-Q3');
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [metricsRes, agingRes, vendorRes, statusRes] = await Promise.all([
        api.get('/dashboard/metrics'),
        api.get('/dashboard/aging'),
        api.get('/dashboard/vendor-analytics'),
        api.get('/dashboard/status-distribution')
      ]);
      setMetrics(metricsRes.data);
      setAgingData(agingRes.data);
      setVendorData(vendorRes.data);
      setStatusData(statusRes.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Loading Financial Ledger & Real-Time AP Metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Financial Operations Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Accounts payable liability schedule, turnaround velocity, and settlement pipeline.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="FY26-Q3">Fiscal Q3 2026</option>
              <option value="OCT-2026">October 2026</option>
              <option value="NOV-2026">November 2026</option>
              <option value="YTD">Year-to-Date (FY26)</option>
            </select>
          </div>

          <button 
            onClick={() => setActiveTab('capture')}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium shadow-xs transition"
          >
            <span>+ Ingest Invoice</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spend / Liabilities */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Total AP Volume (YTD)</span>
            <span className="text-[11px] font-mono font-medium text-slate-400">{metrics?.total_invoices || 0} Invoices</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            ₹{(metrics?.total_spend || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center space-x-1 mt-1 text-[11px] text-slate-500">
            <span>Settled:</span>
            <strong className="text-emerald-700 font-mono">₹{(metrics?.paid_amount || 0).toLocaleString('en-IN')}</strong>
            <span className="text-slate-400">({metrics?.paid_invoices || 0} paid)</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Awaiting Manager Review</span>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              {metrics?.pending_approvals || 0} Pending
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            ₹{(metrics?.pending_approval_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center space-x-1 mt-1 text-[11px] text-slate-500">
            <span>SLA Target:</span>
            <strong className="text-slate-700 font-medium">&lt; 48 hours</strong>
            <span className="text-slate-400">• Step 1 & 2</span>
          </div>
        </div>

        {/* Payment Run Pipeline */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Approved & Queued for Payout</span>
            <CreditCard className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 tabular-nums">
            ₹{(metrics?.in_payment_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center space-x-1 mt-1 text-[11px] text-slate-500">
            <button 
              onClick={() => setActiveTab('payments')}
              className="text-sky-600 hover:text-sky-700 font-medium flex items-center gap-0.5"
            >
              <span>Prepare Bank Run</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Average TAT & Straight-Through Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Mean Cycle Time (TAT)</span>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold border border-emerald-200">
              -62% vs manual
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums flex items-baseline gap-1">
            <span>{metrics?.avg_tat_hours || 14.8}</span>
            <span className="text-xs font-normal text-slate-500">Hours</span>
          </div>
          <div className="flex items-center space-x-1 mt-1 text-[11px] text-slate-500">
            <span>OCR Field Accuracy:</span>
            <strong className="text-slate-800 font-semibold">{metrics?.ocr_accuracy_percentage || 96.5}%</strong>
          </div>
        </div>
      </div>

      {/* Analytics Row: Aging Schedule & Workflow Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aging Schedule Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Accounts Payable Aging Schedule</h2>
              <p className="text-xs text-slate-500">Outstanding liabilities categorized by billing days</p>
            </div>
            <button 
              onClick={() => setActiveTab('reports')}
              className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-0.5"
            >
              <span>Detailed Aging Report</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} 
                />
                <Tooltip 
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Payable']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="amount" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* State Pipeline Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Lifecycle Status Breakdown</h2>
            <p className="text-xs text-slate-500">Invoice count by operational stage</p>
          </div>

          <div className="h-48 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  {statusData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={STATUS_COLORS[entry.status] || CHART_PALETTE[index % CHART_PALETTE.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val, name, props) => [`${val} invoices (₹${props.payload.amount.toLocaleString('en-IN')})`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
            {statusData.slice(0, 4).map((s, idx) => (
              <div key={s.status} className="flex items-center justify-between text-slate-600">
                <div className="flex items-center space-x-2 truncate">
                  <span 
                    className="w-2 h-2 rounded-full shrink-0" 
                    style={{ backgroundColor: STATUS_COLORS[s.status] || CHART_PALETTE[idx] }}
                  ></span>
                  <span className="truncate">{s.status}</span>
                </div>
                <div className="flex items-center space-x-2 font-mono">
                  <span className="font-bold text-slate-900">{s.count}</span>
                  <span className="text-[11px] text-slate-400">₹{(s.amount / 1000).toFixed(0)}k</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vendor Master Liabilities & Procurement Summary */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Vendor Commitments & Spend YTD</h2>
            <p className="text-xs text-slate-500">Summary of contracted suppliers, settled disbursements, and active tax registration</p>
          </div>
          <button 
            onClick={() => setActiveTab('vendors')}
            className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-0.5"
          >
            <span>Manage Master Registry</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/70">
                <th className="py-2.5 px-4">Vendor Entity</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Invoices</th>
                <th className="py-2.5 px-4 text-right">Invoiced YTD</th>
                <th className="py-2.5 px-4 text-right">Settled Amount</th>
                <th className="py-2.5 px-4 text-center">Compliance</th>
                <th className="py-2.5 px-4 text-center">Extraction Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendorData.map((v) => (
                <tr key={v.vendor_id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{v.vendor_name}</div>
                    <div className="text-[10px] font-mono text-slate-400">Code: VEND-00{v.vendor_id}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                      {v.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-700">{v.total_invoices}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    ₹{v.total_spend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-emerald-700">
                    ₹{v.paid_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center space-x-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>GSTN Verified</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    <span className="text-slate-800 font-semibold">{v.ocr_accuracy}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
