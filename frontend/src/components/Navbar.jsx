import React, { useState } from 'react';
import { useRole } from '../context/RoleContext';
import { 
  LayoutDashboard, 
  FileText, 
  UploadCloud, 
  GitCompare, 
  CheckSquare, 
  Building2, 
  CreditCard, 
  BarChart3, 
  RefreshCw,
  Search,
  Bell,
  ChevronDown,
  Shield,
  HelpCircle,
  Plus,
  Sparkles,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab, onQuickUpload }) => {
  const { currentUser, setCurrentUser, ROLES, currentEntity } = useRole();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navSections = [
    {
      title: 'CORE AP',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'invoices', label: 'Invoices', icon: FileText, count: 5 },
        { id: 'capture', label: 'Capture & Ingest', icon: UploadCloud },
      ]
    },
    {
      title: 'RECONCILIATION & APPROVALS',
      items: [
        { id: 'matching', label: 'PO & GRN Matching', icon: GitCompare },
        { id: 'approvals', label: 'Approval Queue', icon: CheckSquare, badge: '2 Pending' },
      ]
    },
    {
      title: 'VENDORS & SETTLEMENT',
      items: [
        { id: 'vendors', label: 'Vendor Registry', icon: Building2 },
        { id: 'payments', label: 'Payment Runs', icon: CreditCard },
      ]
    },
    {
      title: 'ACCOUNTING & COMPLIANCE',
      items: [
        { id: 'reports', label: 'Reports & Audits', icon: BarChart3 },
        { id: 'erp', label: 'ERP & GL Sync', icon: RefreshCw },
      ]
    }
  ];

  return (
    <>
      {/* Top Application Bar */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 select-none shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left: Brand & Entity */}
            <div className="flex items-center space-x-6">
              <div 
                className="flex items-center space-x-2.5 cursor-pointer"
                onClick={() => setActiveTab('dashboard')}
              >
                <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center font-bold text-white tracking-wider text-sm shadow-sm">
                  TG
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm tracking-tight text-white">Templegate AP</span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700/60">
                      Enterprise
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                    {currentEntity.name.split(' ')[0]} • GSTIN: {currentEntity.gstin.slice(0, 7)}...
                  </span>
                </div>
              </div>

              {/* Entity Indicator Badge */}
              <div className="hidden lg:flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md text-[11px] text-slate-300 border border-slate-700/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="font-medium">FY 2026-27</span>
                <span className="text-slate-500">•</span>
                <span className="font-mono text-slate-400">{currentEntity.currency}</span>
              </div>
            </div>

            {/* Middle: Global Search */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
              <div className="w-full relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search invoices, vendors, PO numbers (Ctrl + K)..."
                  className="w-full bg-slate-800/70 text-xs text-slate-200 placeholder-slate-400 pl-8 pr-12 py-1.5 rounded-lg border border-slate-700/70 focus:outline-none focus:border-sky-500 focus:bg-slate-800 transition"
                />
                <span className="text-[10px] font-mono text-slate-400 border border-slate-700 bg-slate-800 px-1.5 py-0.5 rounded absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  ⌘K
                </span>
              </div>
            </div>

            {/* Right: Quick Ingest + Notifications + Persona Switcher */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setActiveTab('capture')}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Invoice</span>
              </button>

              <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>

              {/* Persona Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-left transition"
                >
                  <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-[10px] font-bold text-sky-300 font-mono">
                    {currentUser.initials}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-medium text-slate-200 leading-tight">{currentUser.name}</div>
                    <div className="text-[10px] text-slate-400">{currentUser.role}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-slate-800">
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Active Workspace Persona</div>
                      <div className="font-bold text-xs text-slate-900 mt-0.5">{currentUser.name}</div>
                      <div className="text-[11px] text-slate-500">{currentUser.department} • Limit: {currentUser.approvalLimit}</div>
                    </div>

                    <div className="px-2 py-1.5">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">Switch Role Persona</div>
                      {ROLES.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            setCurrentUser(r);
                            setUserDropdownOpen(false);
                          }}
                          className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-left text-xs transition ${
                            currentUser.id === r.id ? 'bg-sky-50 text-sky-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="w-6 h-6 rounded bg-slate-200 text-slate-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                            {r.initials}
                          </div>
                          <div className="truncate">
                            <div className="leading-tight truncate">{r.name}</div>
                            <div className="text-[10px] text-slate-400 leading-tight">{r.role} • {r.department}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Primary Sub-Navigation Bar */}
        <nav className="bg-slate-900/90 border-t border-slate-800/80 overflow-x-auto scrollbar-none px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center space-x-1 py-1.5">
            {navSections.flatMap(s => s.items).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-xs font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded">
                      {item.badge}
                    </span>
                  )}
                  {item.count && (
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.2 rounded">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </header>
    </>
  );
};
