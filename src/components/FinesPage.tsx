import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, Landmark, Coins, CheckCircle, AlertCircle, Search, Clock, HelpCircle, X, Edit2
} from 'lucide-react';
import { API } from '../lib/api';
import { Fine } from '../types';

const formatKyat = (amount: number): string => {
  return `${Math.round(amount).toLocaleString()} Ks`;
};

interface FinesPageProps {
  user: any;
}

export default function FinesPage({ user }: FinesPageProps) {
  const isStaff = ['Admin', 'Librarian', 'Staff'].includes(user?.role);

  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Fine Adjustment Modal
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);
  const [actionStatus, setActionStatus] = useState<'Paid' | 'Waived'>('Paid');
  const [customRemarks, setCustomRemarks] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await API.getFines();
      setFines(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to sync fine lists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateFine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFine) return;
    try {
      await API.updateFineStatus(selectedFine.fine_id, actionStatus, customRemarks);
      setSuccess(`Fine #${selectedFine.fine_id} marked as ${actionStatus}.`);
      setSelectedFine(null);
      setCustomRemarks('');
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to process fine status update.');
    }
  };

  // Derived statistics for layout header
  const openFinesCount = fines.filter(f => f.status === 'Pending').length;
  const totalOutstanding = fines
    .filter(f => f.status === 'Pending')
    .reduce((sum, f) => sum + f.amount, 0);

  const filteredFines = fines.filter(f => {
    const term = search.toLowerCase();
    const matchesName = f.borrow_details?.member_name?.toLowerCase().includes(term) || f.remarks?.toLowerCase().includes(term) || f.fine_id.toString() === term;
    const matchesStatus = statusFilter === 'All' || f.status === statusFilter;
    return matchesName && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Alert Notices */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 glass-card rounded-2xl flex items-center justify-between shadow-md">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Outstanding Fines</p>
            <p className="text-2xl font-black text-rose-600 mt-1">{formatKyat(totalOutstanding)}</p>
            <p className="text-[10px] text-slate-550 text-slate-500 mt-1">Accruing 500 Ks per late day</p>
          </div>
          <div className="p-3 bg-rose-500/10 border border-rose-200 rounded-xl text-rose-600 shadow-sm shadow-rose-50 animate-pulse">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 glass-card rounded-2xl flex items-center justify-between shadow-md">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Open Overdue Fines</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{openFinesCount} Pending</p>
            <p className="text-[10px] text-slate-550 text-slate-500 mt-1">Fines that have not been settled yet</p>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-200 rounded-xl text-amber-600 shadow-sm shadow-amber-50">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Ribbon Control */}
      <div className="flex bg-white border border-slate-100 p-4 rounded-2xl items-center gap-3 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="fine-search"
            type="text"
            placeholder="Search fines by member, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all font-semibold"
          />
        </div>

        <select
          id="fine-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-850 font-semibold focus:outline-none ml-auto focus:bg-white transition-all cursor-pointer"
        >
          <option value="All">All Fines</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid Only</option>
          <option value="Waived">Waived Only</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="inline-block border-2 border-brand-blue border-t-transparent rounded-full w-8 h-8 animate-spin" />
        </div>
      ) : filteredFines.length > 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-blue-50 p-4 text-[10px] font-bold uppercase tracking-wider text-brand-blue bg-blue-50/40 font-display font-black">
                  <th className="p-4 font-black">Fine #</th>
                  <th className="p-4 font-black">Member Account</th>
                  <th className="p-4 font-black">Reference Book</th>
                  <th className="p-4 font-black">Amount Due</th>
                  <th className="p-4 font-black">Status</th>
                  <th className="p-4 font-black">Notes & Remarks</th>
                  {isStaff && <th className="p-4 text-center font-black">Reconciliation Filing</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredFines.map((f) => {
                  const isPending = f.status === 'Pending';
                  return (
                    <tr key={f.fine_id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-mono text-[11px] text-slate-400 font-bold">#{f.fine_id}</td>
                      <td className="p-4 text-slate-800 font-bold">{f.borrow_details?.member_name || 'N/A'}</td>
                      <td className="p-4 text-slate-600 truncate max-w-xs">{f.borrow_details?.book_title || 'General Loan'}</td>
                      <td className="p-4 font-bold text-slate-800 font-mono text-[12px]">
                        {formatKyat(f.amount)}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-0.5 text-[9px] font-extrabold rounded-full uppercase ${
                          f.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/10 font-black' :
                          f.status === 'Waived' ? 'bg-slate-100 border border-slate-200 text-slate-600 font-black' :
                          'bg-rose-500/10 text-rose-600 border border-rose-500/10 font-black'
                        }`}>
                          {f.status}
                        </span>
                        {f.payment_date && (
                          <div className="text-[8px] text-slate-400 mt-1 font-bold">Paid: {f.payment_date}</div>
                        )}
                      </td>
                      <td className="p-4 italic text-[10px] text-slate-500 truncate max-w-xs font-semibold">{f.remarks || 'No notes appended'}</td>
                      {isStaff && (
                        <td className="p-4 text-center whitespace-nowrap">
                          {isPending ? (
                            <button
                              id={`adjust-fine-btn-${f.fine_id}`}
                              onClick={() => {
                                setSelectedFine(f);
                                setActionStatus('Paid');
                                setCustomRemarks(f.remarks || '');
                              }}
                              className="px-3 py-1 bg-brand-blue hover:bg-[#2b39cc] text-white text-[10px] font-bold rounded-lg flex items-center gap-1 mx-auto cursor-pointer shadow-md shadow-blue-500/10 uppercase tracking-wide"
                            >
                              <Edit2 className="w-3 h-3" />
                              Settle Fine
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wide">Settled Fine</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <Landmark className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-bold uppercase tracking-wide">Clear record! No fines require collection filing.</p>
        </div>
      )}

      {/* FINE RECONCILIATION MODAL */}
      <AnimatePresence>
        {selectedFine && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-md p-4 font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-100 rounded-3xl w-full max-w-md p-7 relative shadow-2xl space-y-5"
            >
              <button 
                id="close-fine-modal"
                onClick={() => setSelectedFine(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 cursor-pointer transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest font-display">
                Settle Fine #{selectedFine.fine_id}
              </h2>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Member Account:</span>
                  <span className="text-slate-800 font-bold">{selectedFine.borrow_details?.member_name}</span>
                </div>
                <div className="flex justify-between items-center font-mono">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Fine Due:</span>
                  <span className="text-rose-600 font-black text-sm">{formatKyat(selectedFine.amount)}</span>
                </div>
              </div>

              <form onSubmit={handleUpdateFine} className="space-y-4 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Select Action</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="fine-action-pay"
                      type="button"
                      onClick={() => setActionStatus('Paid')}
                      className={`py-2 px-3 text-xs font-extrabold rounded-xl cursor-pointer border transition-all ${
                        actionStatus === 'Paid' 
                          ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' 
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-400'
                      }`}
                    >
                      Process Payment (Paid)
                    </button>
                    <button
                      id="fine-action-waive"
                      type="button"
                      onClick={() => setActionStatus('Waived')}
                      className={`py-2 px-3 text-xs font-extrabold rounded-xl cursor-pointer border transition-all ${
                        actionStatus === 'Waived' 
                          ? 'bg-blue-50/50 text-brand-blue border-blue-200' 
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-400'
                      }`}
                    >
                      Waive/Cancel Fine
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 ">Reconciliation Remarks</label>
                  <textarea
                    id="fine-form-remarks"
                    required
                    rows={3}
                    value={customRemarks}
                    onChange={(e) => setCustomRemarks(e.target.value)}
                    placeholder="e.g. Fine collected by desk librarian. Copy returning complete."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 resize-none font-semibold focus:bg-white focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 transition-all text-xs"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                  <button
                    id="cancel-fine-form"
                    type="button"
                    onClick={() => setSelectedFine(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-bold cursor-pointer transition-colors uppercase tracking-wider text-[10px]"
                  >
                    Discard Adjustment
                  </button>
                  <button
                    id="confirm-fine-form"
                    type="submit"
                    className="px-5 py-2 bg-brand-blue hover:bg-[#2b39cc] text-white rounded-xl font-bold cursor-pointer shadow-lg shadow-blue-500/15 uppercase tracking-wider text-[10px]"
                  >
                    Apply Adjustment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
