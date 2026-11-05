import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Building2, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  CreditCard, 
  ShieldCheck, 
  RefreshCw,
  X,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const VendorsPage = () => {
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [gstValidationResult, setGstValidationResult] = useState(null);
  const [validatingGst, setValidatingGst] = useState(false);

  // New Vendor Form State
  const [newVendor, setNewVendor] = useState({
    name: '',
    code: '',
    tax_id: '',
    state: 'Karnataka',
    state_code: '29',
    category: 'Software',
    payment_terms: 'Net 30',
    email: '',
    phone: '',
    address: '',
    bank_name: '',
    account_number: '',
    ifsc_code: ''
  });

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vendors/');
      setVendors(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleValidateGst = async (gstin) => {
    if (!gstin || gstin.trim().length < 10) return;
    try {
      setValidatingGst(true);
      const res = await api.post('/vendors/validate-gst', null, { params: { gstin } });
      setGstValidationResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setValidatingGst(false);
    }
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: newVendor.name,
        code: newVendor.code,
        tax_id: newVendor.tax_id,
        state: newVendor.state,
        state_code: newVendor.state_code,
        category: newVendor.category,
        payment_terms: newVendor.payment_terms,
        email: newVendor.email,
        phone: newVendor.phone,
        address: newVendor.address,
        bank_accounts: newVendor.bank_name ? [
          {
            bank_name: newVendor.bank_name,
            account_number: newVendor.account_number,
            ifsc_code: newVendor.ifsc_code,
            account_type: 'Current',
            is_primary: true
          }
        ] : []
      };

      await api.post('/vendors/', payload);
      setShowAddModal(false);
      fetchVendors();
      setNewVendor({
        name: '', code: '', tax_id: '', state: 'Karnataka', state_code: '29',
        category: 'Software', payment_terms: 'Net 30', email: '', phone: '', address: '',
        bank_name: '', account_number: '', ifsc_code: ''
      });
      setGstValidationResult(null);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create vendor.');
    }
  };

  const filteredVendors = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.code.toLowerCase().includes(search.toLowerCase()) ||
    (v.tax_id && v.tax_id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Vendor Master Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered supplier master records, verified bank accounts, and statutory tax compliance status.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Vendor</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter vendors by company name, supplier code, or GSTIN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-4 py-2 text-xs text-slate-900 outline-none focus:border-sky-500 shadow-2xs font-medium"
        />
      </div>

      {/* Vendor Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="w-7 h-7 text-sky-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVendors.map((vendor) => (
            <div key={vendor.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition space-y-3.5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {vendor.code}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    vendor.status === 'Active' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    {vendor.status}
                  </span>
                </div>

                <h2 className="text-sm font-bold text-slate-900 leading-snug">{vendor.name}</h2>
                <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>GSTIN: {vendor.tax_id || 'Not Registered'}</span>
                </div>
                <div className="text-xs text-slate-600">
                  <span>Category: <strong className="text-slate-800">{vendor.category}</strong></span> • 
                  <span className="ml-1">Terms: <strong className="text-slate-800">{vendor.payment_terms}</strong></span>
                </div>
              </div>

              {/* Verified Bank Details */}
              <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200/80 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500 font-semibold text-[10px] uppercase">
                  <span>Disbursement Account</span>
                  <span className="text-emerald-700 font-medium">✓ Verified</span>
                </div>
                {vendor.bank_accounts && vendor.bank_accounts.length > 0 ? (
                  <>
                    <div className="font-semibold text-slate-800">{vendor.bank_accounts[0].bank_name}</div>
                    <div className="text-[11px] text-slate-600 font-mono">
                      A/C: {vendor.bank_accounts[0].account_number}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      IFSC: {vendor.bank_accounts[0].ifsc_code}
                    </div>
                  </>
                ) : (
                  <div className="text-amber-700 text-[11px]">No verified bank account configured.</div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Jurisdiction: {vendor.state} ({vendor.state_code})</span>
                <span className="text-slate-600 font-medium">{vendor.email || 'billing@vendor.com'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Onboarding Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-bold text-slate-900">Register New Supplier Entity</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Company Legal Name *</label>
                  <input
                    required
                    type="text"
                    value={newVendor.name}
                    onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                    className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-1.5 outline-none focus:border-slate-800"
                    placeholder="e.g. Acme Tech Solutions Ltd"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Vendor Code *</label>
                  <input
                    required
                    type="text"
                    value={newVendor.code}
                    onChange={(e) => setNewVendor({ ...newVendor, code: e.target.value })}
                    className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-1.5 outline-none focus:border-slate-800 font-mono"
                    placeholder="VEND-ACME-01"
                  />
                </div>
              </div>

              {/* GSTIN with live verify */}
              <div>
                <label className="font-semibold text-slate-700 flex justify-between">
                  <span>Vendor GSTIN (15 Characters)</span>
                  <button
                    type="button"
                    onClick={() => handleValidateGst(newVendor.tax_id)}
                    className="text-sky-700 hover:text-sky-800 font-semibold"
                  >
                    Check GSTN Status
                  </button>
                </label>
                <input
                  type="text"
                  value={newVendor.tax_id}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setNewVendor({ ...newVendor, tax_id: val, state_code: val.substring(0, 2) });
                  }}
                  className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-1.5 outline-none focus:border-slate-800 font-mono uppercase"
                  placeholder="29AABCA1234F1Z5"
                />
              </div>

              {gstValidationResult && (
                <div className={`p-2.5 rounded-lg border text-[11px] ${
                  gstValidationResult.is_valid ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <strong>GSTN Lookup:</strong> {gstValidationResult.taxpayer_status} • State: {gstValidationResult.state_name} ({gstValidationResult.state_code})
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Category</label>
                  <select
                    value={newVendor.category}
                    onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
                    className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-1.5 outline-none"
                  >
                    <option value="Software">Software</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Supplies">Office Supplies</option>
                    <option value="Logistics">Logistics & Freight</option>
                    <option value="Services">Consulting / Services</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Settlement Terms</label>
                  <select
                    value={newVendor.payment_terms}
                    onChange={(e) => setNewVendor({ ...newVendor, payment_terms: e.target.value })}
                    className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-1.5 outline-none"
                  >
                    <option value="Immediate">Immediate</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                  </select>
                </div>
              </div>

              {/* Bank Details */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-[11px]">Primary Bank Settlement Account</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold">Bank Name</label>
                    <input
                      type="text"
                      placeholder="HDFC Bank"
                      value={newVendor.bank_name}
                      onChange={(e) => setNewVendor({ ...newVendor, bank_name: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold">Account No</label>
                    <input
                      type="text"
                      placeholder="502000123456"
                      value={newVendor.account_number}
                      onChange={(e) => setNewVendor({ ...newVendor, account_number: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2 py-1 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold">IFSC Code</label>
                    <input
                      type="text"
                      placeholder="HDFC0000053"
                      value={newVendor.ifsc_code}
                      onChange={(e) => setNewVendor({ ...newVendor, ifsc_code: e.target.value.toUpperCase() })}
                      className="w-full border border-slate-300 rounded px-2 py-1 font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
