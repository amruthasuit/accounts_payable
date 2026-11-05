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
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

      <footer className="bg-white border-t border-slate-200 py-3 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px]">
          <div>
            <strong>Templegate Technologies</strong> • Accounts Payable Operations Suite
          </div>
          <div className="text-slate-400 font-mono">
            Direct Bank Settlement • ISO 20022 / NEFT / RTGS • ERP Connectors (Tally, SAP)
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
