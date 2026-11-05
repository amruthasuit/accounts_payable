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
  ChevronDown,
  Plus
} from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab }) => {
  const { currentUser, setCurrentUser, ROLES, currentEntity } = useRole();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Ledger', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileText, count: 5 },
    { id: 'capture', label: 'Intake', icon: UploadCloud },
    { id: 'matching', label: 'Reconciliation', icon: GitCompare },
    { id: 'approvals', label: 'Approvals', icon: CheckSquare, badge: '2' },
    { id: 'vendors', label: 'Vendors', icon: Building2 },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'erp', label: 'ERP Sync', icon: RefreshCw },
  ];

  return (
    <header className="bg-[#121620] border-b border-[#232936] text-[#E5E9F0] sticky top-0 z-40 select-none">
      {/* Top Application Bar */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Left: Brand Identity */}
          <div className="flex items-center space-x-6">
            <button 
              className="flex items-center space-x-2.5 text-left focus:outline-none"
              onClick={() => setActiveTab('dashboard')}
            >
              <div className="w-7 h-7 rounded-sm bg-[#0D9488] flex items-center justify-center font-mono font-bold text-white text-xs tracking-wider">
                TG
              </div>
              <div>
                <div className="font-semibold text-xs text-white tracking-tight leading-tight">Templegate Ledger</div>
                <div className="text-[11px] text-[#7E8799] font-mono leading-tight">FY 2026-27 / INR</div>
              </div>
            </button>

            {/* Jurisdiction Badge */}
            <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 bg-[#181D28] border border-[#232936] rounded-sm text-[11px] font-mono text-[#8C96A8]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]"></span>
              <span>GSTIN {currentEntity.gstin}</span>
            </div>
          </div>

          {/* Center: Primary Navigation */}
          <nav className="hidden md:flex items-center space-x-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-sm text-xs transition-colors font-medium ${
                    isActive
                      ? 'bg-[#1E2534] text-white shadow-2xs border border-[#2E374A]'
                      : 'text-[#8C96A8] hover:text-[#E5E9F0] hover:bg-[#181D28]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#2DD4BF]' : 'text-[#7E8799]'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-xs bg-[#F59E0B]/20 text-[#FBBF24] border border-[#F59E0B]/30 font-semibold">
                      {item.badge}
                    </span>
                  )}
                  {item.count && !item.badge && (
                    <span className="text-[10px] font-mono px-1 py-0.2 text-[#7E8799]">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Actions & User Persona */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setActiveTab('capture')}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-sm text-xs font-medium transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload Invoice</span>
            </button>

            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 px-2 py-1 bg-[#181D28] hover:bg-[#1E2534] border border-[#232936] rounded-sm text-left transition"
              >
                <div className="w-5 h-5 rounded-xs bg-[#242C3D] text-[#2DD4BF] font-mono text-[10px] font-bold flex items-center justify-center">
                  {currentUser.initials}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-medium text-[#E5E9F0] leading-none">{currentUser.name}</div>
                  <div className="text-[10px] text-[#7E8799] leading-none mt-0.5">{currentUser.role}</div>
                </div>
                <ChevronDown className="w-3 h-3 text-[#7E8799]" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-68 bg-[#181D28] rounded-sm shadow-xl border border-[#282F3E] py-1.5 z-50 text-[#E5E9F0]">
                  <div className="px-3 py-1.5 border-b border-[#232936]">
                    <div className="text-[11px] text-[#7E8799]">Current User</div>
                    <div className="font-semibold text-xs text-white">{currentUser.name}</div>
                    <div className="text-[10px] text-[#8C96A8] font-mono">{currentUser.department} • Signing Limit: {currentUser.approvalLimit}</div>
                  </div>

                  <div className="px-1.5 py-1">
                    <div className="text-[10px] text-[#7E8799] px-2 py-1 font-mono">Switch Role</div>
                    {ROLES.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setCurrentUser(r);
                          setUserDropdownOpen(false);
                        }}
                        className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-xs text-left text-xs transition ${
                          currentUser.id === r.id ? 'bg-[#1E2534] text-white font-medium border border-[#2E374A]' : 'text-[#8C96A8] hover:bg-[#151922] hover:text-[#E5E9F0]'
                        }`}
                      >
                        <div className="w-5 h-5 rounded-xs bg-[#242C3D] text-[#8C96A8] font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                          {r.initials}
                        </div>
                        <div className="truncate">
                          <div className="truncate text-xs leading-none text-[#E5E9F0]">{r.name}</div>
                          <div className="text-[10px] text-[#7E8799] leading-none mt-0.5 font-mono">{r.role}</div>
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

      {/* Mobile Sub Navigation (Horizontal scrolling for smaller screens) */}
      <div className="md:hidden flex items-center space-x-1 px-4 py-1.5 overflow-x-auto border-t border-[#232936] bg-[#0E1117]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xs text-xs whitespace-nowrap ${
                isActive ? 'bg-[#1E2534] text-white border border-[#2E374A]' : 'text-[#8C96A8]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
