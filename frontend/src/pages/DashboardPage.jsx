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
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

const STATUS_COLORS = {
  'Captured': '#64718A',
  'Extracted': '#38BDF8',
  'Validated': '#0EA5E9',
  'Matched': '#818CF8',
  'Pending Approval': '#F59E0B',
  'Approved': '#10B981',
  'Match Exception': '#EF4444',
  'Validation Failed': '#DC2626',
  'Paid': '#2DD4BF'
};

const CHART_PALETTE = ['#0D9488', '#2DD4BF', '#F59E0B', '#EF4444', '#818CF8', '#64718A'];

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
        <div className="flex flex-col items-center space-y-3">
          <div className="w-7 h-7 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-[#8C96A8] font-mono">Synchronizing ledger registers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ledger Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#232936] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#0D9488]"></span>
            <h1 className="text-lg font-semibold text-[#E5E9F0] tracking-tight">Financial Operations Desk</h1>
          </div>
          <p className="text-xs text-[#7E8799] mt-0.5">
            Accounts payable liability schedule, turnaround velocity, and settlement pipeline
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="flex items-center bg-[#181D28] border border-[#232936] rounded-sm px-2.5 py-1.5 text-xs text-[#C4CBD8]">
            <Calendar className="w-3.5 h-3.5 text-[#7E8799] mr-2" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent font-mono text-xs text-[#E5E9F0] outline-none cursor-pointer"
            >
              <option value="FY26-Q3" className="bg-[#181D28] text-[#E5E9F0]">Fiscal Q3 2026</option>
              <option value="OCT-2026" className="bg-[#181D28] text-[#E5E9F0]">October 2026</option>
              <option value="NOV-2026" className="bg-[#181D28] text-[#E5E9F0]">November 2026</option>
              <option value="YTD" className="bg-[#181D28] text-[#E5E9F0]">Year-to-date (FY26)</option>
            </select>
          </div>

          <button 
            onClick={() => setActiveTab('capture')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-sm text-xs font-medium transition shadow-2xs"
          >
            <span>+ Ingest invoice</span>
          </button>
        </div>
      </div>

      {/* KPI Structural Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Spend */}
        <div className="bg-[#121620] p-4 rounded-sm border border-[#232936]">
          <div className="flex items-center justify-between text-[#8C96A8] text-xs">
            <span>Total liabilities (YTD)</span>
            <span className="font-mono text-[11px] text-[#64718A]">{metrics?.total_invoices || 0} bills</span>
          </div>
          <div className="mt-2 text-2xl font-semibold text-[#E5E9F0] font-mono tabular-nums">
            ₹{(metrics?.total_spend || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center space-x-1.5 mt-1.5 text-[11px] text-[#7E8799]">
            <span>Settled:</span>
            <span className="text-[#2DD4BF] font-mono">₹{(metrics?.paid_amount || 0).toLocaleString('en-IN')}</span>
            <span className="text-[#64718A]">({metrics?.paid_invoices || 0} paid)</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-[#121620] p-4 rounded-sm border border-[#232936]">
          <div className="flex items-center justify-between text-[#8C96A8] text-xs">
            <span>Pending manager sign-off</span>
            <span className="font-mono text-[10px] text-[#FBBF24] bg-[#F59E0B]/15 px-1.5 py-0.5 rounded-xs border border-[#F59E0B]/30 font-medium">
              {metrics?.pending_approvals || 0} open
            </span>
          </div>
          <div className="mt-2 text-2xl font-semibold text-[#E5E9F0] font-mono tabular-nums">
            ₹{(metrics?.pending_approval_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center space-x-1.5 mt-1.5 text-[11px] text-[#7E8799]">
            <span>SLA benchmark:</span>
            <span className="text-[#C4CBD8] font-mono">&lt; 48 hours</span>
          </div>
        </div>

        {/* Queued For Settlement */}
        <div className="bg-[#121620] p-4 rounded-sm border border-[#232936]">
          <div className="flex items-center justify-between text-[#8C96A8] text-xs">
            <span>Approved & queued for payout</span>
            <CreditCard className="w-3.5 h-3.5 text-[#64718A]" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-[#2DD4BF] font-mono tabular-nums">
            ₹{(metrics?.in_payment_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1.5 text-[11px]">
            <button 
              onClick={() => setActiveTab('payments')}
              className="text-[#2DD4BF] hover:text-[#5EEAD4] font-medium flex items-center gap-1 transition"
            >
              <span>Prepare bank run</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Cycle Velocity & OCR Score */}
        <div className="bg-[#121620] p-4 rounded-sm border border-[#232936]">
          <div className="flex items-center justify-between text-[#8C96A8] text-xs">
            <span>Turnaround velocity</span>
            <span className="font-mono text-[10px] text-[#2DD4BF] bg-[#0D9488]/15 px-1.5 py-0.5 rounded-xs border border-[#0D9488]/30 font-medium">
              -62% manual
            </span>
          </div>
          <div className="mt-2 text-2xl font-semibold text-[#E5E9F0] font-mono tabular-nums flex items-baseline gap-1.5">
            <span>{metrics?.avg_tat_hours || 14.8}</span>
            <span className="text-xs font-normal text-[#7E8799] font-sans">hours</span>
          </div>
          <div className="flex items-center space-x-1.5 mt-1.5 text-[11px] text-[#7E8799]">
            <span>Extraction precision:</span>
            <span className="text-[#C4CBD8] font-mono">{metrics?.ocr_accuracy_percentage || 96.5}%</span>
          </div>
        </div>
      </div>

      {/* Analytics Row: Aging Schedule & Lifecycle Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Aging Schedule Chart */}
        <div className="lg:col-span-2 bg-[#121620] p-4 rounded-sm border border-[#232936]">
          <div className="flex items-center justify-between mb-3 border-b border-[#1E2534] pb-2.5">
            <div>
              <h2 className="text-xs font-semibold text-[#E5E9F0]">Accounts payable aging schedule</h2>
              <p className="text-[11px] text-[#7E8799]">Outstanding liabilities categorized by ledger maturity</p>
            </div>
            <button 
              onClick={() => setActiveTab('reports')}
              className="text-[11px] text-[#2DD4BF] hover:text-[#5EEAD4] font-medium flex items-center gap-0.5 transition"
            >
              <span>Full aging report</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: '#7E8799', fontFamily: 'IBM Plex Mono' }} axisLine={{ stroke: '#232936' }} tickLine={false} />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#7E8799', fontFamily: 'IBM Plex Mono' }} 
                  axisLine={{ stroke: '#232936' }} 
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} 
                />
                <Tooltip 
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Payable']}
                  contentStyle={{ backgroundColor: '#181D28', borderColor: '#2E374A', borderRadius: '3px', color: '#E5E9F0', fontSize: '11px', fontFamily: 'IBM Plex Mono' }}
                  itemStyle={{ color: '#2DD4BF' }}
                />
                <Bar dataKey="amount" fill="#0D9488" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* State Pipeline Breakdown */}
        <div className="bg-[#121620] p-4 rounded-sm border border-[#232936] flex flex-col justify-between">
          <div>
            <div className="border-b border-[#1E2534] pb-2.5 mb-2">
              <h2 className="text-xs font-semibold text-[#E5E9F0]">Lifecycle status breakdown</h2>
              <p className="text-[11px] text-[#7E8799]">Invoice volume across operational states</p>
            </div>

            <div className="h-44 my-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={68}
                    paddingAngle={2}
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
                    contentStyle={{ backgroundColor: '#181D28', borderColor: '#2E374A', borderRadius: '3px', color: '#E5E9F0', fontSize: '11px', fontFamily: 'IBM Plex Mono' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-[#1E2534] text-xs">
            {statusData.slice(0, 4).map((s, idx) => (
              <div key={s.status} className="flex items-center justify-between text-[#8C96A8]">
                <div className="flex items-center space-x-2 truncate">
                  <span 
                    className="w-1.5 h-1.5 rounded-full shrink-0" 
                    style={{ backgroundColor: STATUS_COLORS[s.status] || CHART_PALETTE[idx] }}
                  ></span>
                  <span className="truncate text-[11px]">{s.status}</span>
                </div>
                <div className="flex items-center space-x-2 font-mono text-[11px]">
                  <span className="font-semibold text-[#E5E9F0]">{s.count}</span>
                  <span className="text-[#64718A]">₹{(s.amount / 1000).toFixed(0)}k</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vendor Master Commitments & Spend YTD */}
      <div className="bg-[#121620] rounded-sm border border-[#232936] overflow-hidden">
        <div className="p-3.5 border-b border-[#232936] flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-[#E5E9F0]">Vendor commitments & settlement schedule</h2>
            <p className="text-[11px] text-[#7E8799]">Contracted suppliers, settled disbursements, and active tax compliance</p>
          </div>
          <button 
            onClick={() => setActiveTab('vendors')}
            className="text-[11px] text-[#2DD4BF] hover:text-[#5EEAD4] font-medium flex items-center gap-0.5 transition"
          >
            <span>Master registry</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#232936] text-[11px] text-[#8C96A8] bg-[#181D28]">
                <th className="py-2 px-3.5 font-medium">Vendor entity</th>
                <th className="py-2 px-3.5 font-medium">Category</th>
                <th className="py-2 px-3.5 font-medium">Invoices</th>
                <th className="py-2 px-3.5 text-right font-medium">Invoiced YTD</th>
                <th className="py-2 px-3.5 text-right font-medium">Settled amount</th>
                <th className="py-2 px-3.5 text-center font-medium">Compliance</th>
                <th className="py-2 px-3.5 text-center font-medium">Extraction score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2534]">
              {vendorData.map((v) => (
                <tr key={v.vendor_id} className="hover:bg-[#181D28]/60 transition">
                  <td className="py-2.5 px-3.5">
                    <div className="font-medium text-[#E5E9F0]">{v.vendor_name}</div>
                    <div className="text-[10px] font-mono text-[#64718A]">VEND-00{v.vendor_id}</div>
                  </td>
                  <td className="py-2.5 px-3.5">
                    <span className="px-2 py-0.5 rounded-xs text-[10px] font-mono bg-[#1E2534] text-[#A6B2C4] border border-[#282F3E]">
                      {v.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-[#C4CBD8]">{v.total_invoices}</td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-medium text-[#E5E9F0]">
                    ₹{v.total_spend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-medium text-[#2DD4BF]">
                    ₹{v.paid_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-[#2DD4BF] bg-[#0D9488]/15 px-2 py-0.5 rounded-xs border border-[#0D9488]/30">
                      <ShieldCheck className="w-3 h-3 text-[#2DD4BF]" />
                      <span>GSTN active</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-center font-mono">
                    <span className="text-[#E5E9F0]">{v.ocr_accuracy}%</span>
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
