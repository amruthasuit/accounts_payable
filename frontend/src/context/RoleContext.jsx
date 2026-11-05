import React, { createContext, useContext, useState } from 'react';

const RoleContext = createContext();

export const ROLES = [
  { 
    id: 'admin', 
    name: 'Sharath Verma', 
    email: 'admin@templegate.com',
    role: 'Admin', 
    department: 'Finance & Systems', 
    initials: 'SV',
    approvalLimit: 'Unlimited',
    description: 'System Administrator & Controller'
  },
  { 
    id: 'ap_clerk', 
    name: 'Priya Sharma', 
    email: 'priya.ap@templegate.com',
    role: 'AP Clerk', 
    department: 'Accounts Payable', 
    initials: 'PS',
    approvalLimit: '₹15,000',
    description: 'Invoice Ingestion, OCR Verification & Data Entry'
  },
  { 
    id: 'approver_it', 
    name: 'Rahul Verma', 
    email: 'rahul.it@templegate.com',
    role: 'Approver', 
    department: 'IT & Infrastructure', 
    initials: 'RV',
    approvalLimit: '₹100,000',
    description: 'Department Head - Hardware, Cloud & Licenses'
  },
  { 
    id: 'approver_ops', 
    name: 'Anita Desai', 
    email: 'anita.ops@templegate.com',
    role: 'Approver', 
    department: 'Operations & Logistics', 
    initials: 'AD',
    approvalLimit: '₹100,000',
    description: 'Department Head - Freight, Supplies & Maintenance'
  },
  { 
    id: 'finance_manager', 
    name: 'Kavita Nair', 
    email: 'kavita.cfo@templegate.com',
    role: 'Finance Manager', 
    department: 'Treasury & Corporate Finance', 
    initials: 'KN',
    approvalLimit: '₹5,000,000',
    description: 'Director of Finance & Bank Payment Authorization'
  },
  { 
    id: 'auditor', 
    name: 'Suresh Menon', 
    email: 'suresh.audit@templegate.com',
    role: 'Auditor', 
    department: 'Internal Audit & Compliance', 
    initials: 'SM',
    approvalLimit: 'Read Only',
    description: 'Statutory Compliance & GST Reconciliation'
  },
];

export const RoleProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(ROLES[0]);
  const [currentEntity, setCurrentEntity] = useState({
    name: 'Templegate Enterprise Solutions Ltd.',
    gstin: '29AAACT9876Q1Z2',
    currency: 'INR (₹)',
    state: 'Karnataka (29)'
  });

  return (
    <RoleContext.Provider value={{ currentUser, setCurrentUser, ROLES, currentEntity, setCurrentEntity }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => useContext(RoleContext);
