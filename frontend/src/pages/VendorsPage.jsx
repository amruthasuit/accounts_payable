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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#232936] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#0D9488]"></span>
            <h1 className="text-lg font-semibold text-[#E5E9F0] tracking-tight">Vendor Master Directory</h1>
          </div>
          <p className="text-xs text-[#7E8799] mt-0.5">
            Registered supplier master records, verified bank accounts, and statutory tax compliance status
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-sm text-xs font-medium shadow-2xs transition self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add vendor</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-[#64718A] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter vendors by company name, supplier code, or GSTIN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#121620] border border-[#232936] rounded-sm pl-8 pr-4 py-2 text-xs text-[#E5E9F0] placeholder-[#64718A] outline-none focus:border-[#0D9488]"
        />
      </div>

      {/* Vendor Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="w-6 h-6 text-[#0D9488] animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredVendors.map((vendor) => (
            <div key={vendor.id} className="bg-[#121620] p-4 rounded-sm border border-[#232936] hover:border-[#282F3E] transition space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#2DD4BF] bg-[#0D9488]/15 px-2 py-0.5 rounded-xs border border-[#0D9488]/30">
                    {vendor.code}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-xs border ${
                    vendor.status === 'Active' 
                      ? 'bg-[#0D9488]/15 text-[#2DD4BF] border-[#0D9488]/30' 
                      : 'bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/30'
                  }`}>
                    {vendor.status}
                  </span>
                </div>

                <h2 className="text-sm font-semibold text-[#E5E9F0] leading-snug">{vendor.name}</h2>
                <div className="text-[11px] text-[#7E8799] flex items-center space-x-1.5 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2DD4BF] shrink-0" />
                  <span>GSTIN: {vendor.tax_id || 'Not registered'}</span>
                </div>
                <div className="text-xs text-[#8C96A8] flex items-center space-x-2">
                  <span>Category: <strong className="text-[#C4CBD8]">{vendor.category}</strong></span>
                  <span>/</span>
                  <span>Terms: <strong className="font-mono text-[#C4CBD8]">{vendor.payment_terms}</strong></span>
                </div>
              </div>

              {/* Verified Bank Details */}
              <div className="bg-[#181D28] p-3 rounded-sm border border-[#282F3E] text-xs space-y-1">
                <div className="flex items-center justify-between text-[#7E8799] text-[10px] font-mono">
                  <span>Settlement account</span>
                  <span className="text-[#2DD4BF]">Verified</span>
                </div>
                {vendor.bank_accounts && vendor.bank_accounts.length > 0 ? (
                  <>
                    <div className="font-medium text-[#E5E9F0]">{vendor.bank_accounts[0].bank_name}</div>
                    <div className="text-[11px] text-[#C4CBD8] font-mono">
                      A/C: {vendor.bank_accounts[0].account_number}
                    </div>
                    <div className="text-[10px] text-[#7E8799] font-mono">
                      IFSC: {vendor.bank_accounts[0].ifsc_code}
                    </div>
                  </>
                ) : (
                  <div className="text-[#FBBF24] text-[11px] font-mono">No settlement account configured</div>
                )}
              </div>

              <div className="pt-2 border-t border-[#1E2534] flex items-center justify-between text-[11px] text-[#64718A]">
                <span className="font-mono">{vendor.state} ({vendor.state_code})</span>
                <span className="text-[#8C96A8] font-mono">{vendor.email || 'billing@vendor.com'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Onboarding Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0E1117]/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#121620] rounded-sm max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-[#282F3E]">
            <div className="flex items-center justify-between border-b border-[#232936] pb-3">
              <h2 className="text-xs font-semibold text-[#E5E9F0]">Register new supplier entity</h2>
              <button onClick={() => setShowAddModal(false)} className="text-[#7E8799] hover:text-[#E5E9F0]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#8C96A8]">Company legal name *</label>
                  <input
                    required
                    type="text"
                    value={newVendor.name}
                    onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                    className="w-full mt-1 bg-[#181D28] border border-[#282F3E] rounded-sm px-3 py-1.5 text-xs text-[#E5E9F0] outline-none focus:border-[#0D9488]"
                    placeholder="e.g. Acme Tech Solutions Ltd"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#8C96A8]">Vendor code *</label>
                  <input
                    required
                    type="text"
                    value={newVendor.code}
                    onChange={(e) => setNewVendor({ ...newVendor, code: e.target.value })}
                    className="w-full mt-1 bg-[#181D28] border border-[#282F3E] rounded-sm px-3 py-1.5 text-xs text-[#E5E9F0] outline-none focus:border-[#0D9488] font-mono"
                    placeholder="VEND-ACME-01"
                  />
                </div>
              </div>

              {/* GSTIN with live verify */}
              <div>
                <label className="text-[11px] text-[#8C96A8] flex justify-between">
                  <span>Vendor GSTIN (15 characters)</span>
                  <button
                    type="button"
                    onClick={() => handleValidateGst(newVendor.tax_id)}
                    className="text-[#2DD4BF] hover:underline font-mono"
                  >
                    Verify GSTN
                  </button>
                </label>
                <input
                  type="text"
                  value={newVendor.tax_id}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setNewVendor({ ...newVendor, tax_id: val, state_code: val.substring(0, 2) });
                  }}
                  className="w-full mt-1 bg-[#181D28] border border-[#282F3E] rounded-sm px-3 py-1.5 text-xs text-[#E5E9F0] outline-none focus:border-[#0D9488] font-mono uppercase"
                  placeholder="29AABCA1234F1Z5"
                />
              </div>

              {gstValidationResult && (
                <div className={`p-2.5 rounded-sm border text-[11px] font-mono ${
                  gstValidationResult.is_valid ? 'bg-[#0D9488]/15 border-[#0D9488]/30 text-[#2DD4BF]' : 'bg-[#EF4444]/15 border-[#EF4444]/30 text-[#F87171]'
                }`}>
                  <strong>GSTN Lookup:</strong> {gstValidationResult.taxpayer_status} / State: {gstValidationResult.state_name} ({gstValidationResult.state_code})
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#8C96A8]">Category</label>
                  <select
                    value={newVendor.category}
                    onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
                    className="w-full mt-1 bg-[#181D28] border border-[#282F3E] rounded-sm px-3 py-1.5 text-xs text-[#E5E9F0] outline-none"
                  >
                    <option value="Software" className="bg-[#181D28]">Software</option>
                    <option value="Hardware" className="bg-[#181D28]">Hardware</option>
                    <option value="Supplies" className="bg-[#181D28]">Office supplies</option>
                    <option value="Logistics" className="bg-[#181D28]">Logistics & freight</option>
                    <option value="Services" className="bg-[#181D28]">Consulting / services</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[#8C96A8]">Settlement terms</label>
                  <select
                    value={newVendor.payment_terms}
                    onChange={(e) => setNewVendor({ ...newVendor, payment_terms: e.target.value })}
                    className="w-full mt-1 bg-[#181D28] border border-[#282F3E] rounded-sm px-3 py-1.5 text-xs text-[#E5E9F0] outline-none"
                  >
                    <option value="Immediate" className="bg-[#181D28]">Immediate</option>
                    <option value="Net 15" className="bg-[#181D28]">Net 15</option>
                    <option value="Net 30" className="bg-[#181D28]">Net 30</option>
                    <option value="Net 60" className="bg-[#181D28]">Net 60</option>
                  </select>
                </div>
              </div>

              {/* Bank Details */}
              <div className="pt-2 border-t border-[#232936] space-y-2">
                <span className="text-[11px] font-medium text-[#C4CBD8] block">Primary bank settlement account</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-[#7E8799]">Bank name</label>
                    <input
                      type="text"
                      placeholder="HDFC Bank"
                      value={newVendor.bank_name}
                      onChange={(e) => setNewVendor({ ...newVendor, bank_name: e.target.value })}
                      className="w-full mt-1 bg-[#181D28] border border-[#282F3E] rounded-sm px-2 py-1 text-xs text-[#E5E9F0]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#7E8799]">Account no</label>
                    <input
                      type="text"
                      placeholder="502000123456"
                      value={newVendor.account_number}
                      onChange={(e) => setNewVendor({ ...newVendor, account_number: e.target.value })}
                      className="w-full mt-1 bg-[#181D28] border border-[#282F3E] rounded-sm px-2 py-1 text-xs font-mono text-[#E5E9F0]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#7E8799]">IFSC code</label>
                    <input
                      type="text"
                      placeholder="HDFC0000053"
                      value={newVendor.ifsc_code}
                      onChange={(e) => setNewVendor({ ...newVendor, ifsc_code: e.target.value.toUpperCase() })}
                      className="w-full mt-1 bg-[#181D28] border border-[#282F3E] rounded-sm px-2 py-1 text-xs font-mono uppercase text-[#E5E9F0]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#232936] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-[#282F3E] rounded-sm text-[#C4CBD8] hover:bg-[#181D28] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-medium rounded-sm text-xs shadow-2xs"
                >
                  Save supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
