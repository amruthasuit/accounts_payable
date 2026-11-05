import React, { useState } from 'react';
import { RoleProvider } from './context/RoleContext';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { CapturePage } from './pages/CapturePage';
import { InvoiceDetailPage } from './pages/InvoiceDetailPage';
import { MatchingPage } from './pages/MatchingPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { VendorsPage } from './pages/VendorsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ERPSyncPage } from './pages/ERPSyncPage';

export function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  return (
    <div className="min-h-screen bg-[#0E1117] text-[#E5E9F0] flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'dashboard' && (
          <DashboardPage 
            setActiveTab={setActiveTab} 
            setSelectedInvoiceId={setSelectedInvoiceId} 
          />
        )}
        {activeTab === 'capture' && (
          <CapturePage 
            setActiveTab={setActiveTab} 
            setSelectedInvoiceId={setSelectedInvoiceId} 
          />
        )}
        {activeTab === 'invoices' && (
          <InvoiceDetailPage 
            selectedInvoiceId={selectedInvoiceId} 
            setSelectedInvoiceId={setSelectedInvoiceId} 
            setActiveTab={setActiveTab} 
          />
        )}
        {activeTab === 'matching' && (
          <MatchingPage 
            selectedInvoiceId={selectedInvoiceId} 
            setSelectedInvoiceId={setSelectedInvoiceId} 
            setActiveTab={setActiveTab} 
          />
        )}
        {activeTab === 'approvals' && (
          <ApprovalsPage 
            setActiveTab={setActiveTab} 
            setSelectedInvoiceId={setSelectedInvoiceId} 
          />
        )}
        {activeTab === 'vendors' && (
          <VendorsPage />
        )}
        {activeTab === 'payments' && (
          <PaymentsPage />
        )}
        {activeTab === 'reports' && (
          <ReportsPage />
        )}
        {activeTab === 'erp' && (
          <ERPSyncPage />
        )}
      </main>

      <footer className="bg-[#121620] border-t border-[#232936] py-3.5 text-xs text-[#7E8799]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-[#C4CBD8]">Templegate AP Ledger</span>
            <span className="text-[#3A4459]">/</span>
            <span>Enterprise Payable Processing Engine</span>
          </div>
          <div className="text-[#64718A] font-mono flex items-center space-x-3">
            <span>Direct Bank Settlement</span>
            <span className="text-[#3A4459]">/</span>
            <span>ISO 20022 & NEFT</span>
            <span className="text-[#3A4459]">/</span>
            <span>ERP Connectors</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <RoleProvider>
      <AppContent />
    </RoleProvider>
  );
}
