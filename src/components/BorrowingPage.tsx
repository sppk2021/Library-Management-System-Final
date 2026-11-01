import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, ArrowLeftRight, CornerDownLeft, RefreshCw, Calendar, CheckCircle, 
  AlertCircle, ShieldAlert, ArrowUpRight, UserCheck, Trash2, Search, X, Book as BookIcon 
} from 'lucide-react';
import { API } from '../lib/api';
import { BorrowRecord, Book, Member } from '../types';

const formatKyat = (amount: number): string => {
  return `${Math.round(amount).toLocaleString()} Ks`;
};

interface BorrowingPageProps {
  user: any;
}

export default function BorrowingPage({ user }: BorrowingPageProps) {
  const isStaff = ['Admin', 'Librarian', 'Staff'].includes(user?.role);

  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Issue Book Modal State
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [borrowDays, setBorrowDays] = useState('14');

  // Search Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const bList = await API.getBorrows();
      setBorrows(bList);

      if (isStaff) {
        const bkList = await API.getBooks();
        const mbList = await API.getMembers();
        // Offer only books with available copies for issue
        setBooks((bkList || []).filter((b: Book) => b.available_quantity > 0));
        setMembers((mbList || []).filter((m: Member) => m.membership_status === 'Active'));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to sync borrow transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBorrowBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId || !selectedMemberId || !borrowDays) {
      setError('Please populate both Book and Member attributes.');
      return;
    }

    try {
      await API.borrowBook(Number(selectedBookId), Number(selectedMemberId), Number(borrowDays));
      setSuccess('Book borrowed successfully. Stock quantities decremented.');
      setIsBorrowModalOpen(false);
      setSelectedBookId('');
      setSelectedMemberId('');
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Transaction rejected by relational database lock.');
    }
  };

  const handleReturn = async (borrowId: number) => {
    try {
      await API.returnBook(borrowId);
      setSuccess('Book return filed. Inventory and overdue fines reconciled.');
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to register book return.');
    }
  };

  const handleRenew = async (borrowId: number) => {
    try {
      await API.renewBook(borrowId, 14);
      setSuccess('Loan renewed successfully for an additional 14 days.');
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Renewal rejected.');
    }
  };

  const handleUpdateStatus = async (borrowId: number, status: string) => {
    try {
      await API.updateBorrowStatus(borrowId, status);
      setSuccess(`Borrow request marked as ${status}.`);
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to update borrow attempt.');
    }
  };

  // Searching & status logic
  const filteredBorrows = borrows.filter(b => {
    const term = search.toLowerCase();
    const matchName = b.member_name?.toLowerCase().includes(term) || b.book_title?.toLowerCase().includes(term) || b.borrow_id.toString() === term;
    const matchStatus = statusFilter === 'All' || b.borrow_status === statusFilter;
    return matchName && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Messages */}
      {!isStaff && (
        <div className="p-4 bg-teal-500/10 border border-teal-500/20 text-teal-800 rounded-xl text-sm flex items-start gap-3 shadow-sm mb-6">
          <BookIcon className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            <strong>My Borrows Flow:</strong> This tab tracks books you have actively checked out from the library. You must return them safely by the listed Due Date. If you need more time, you can ask a Librarian to renew your loan, or else you will accrue Late Fines for overdue items.
          </p>
        </div>
      )}
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

      {/* Staff Actions Bar */}
      {isStaff && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4 rounded-xl">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                id="borrow-search"
                type="text"
                placeholder="Search borrows by title, code, member..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white/40 border border-white/50 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white/85"
              />
            </div>

            <select
              id="borrow-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-2 bg-white/40 border border-white/50 rounded-lg text-xs text-slate-800 focus:outline-none focus:bg-white"
            >
              <option value="All">All Transactions</option>
              <option value="Pending">Pending Request</option>
              <option value="Borrowed">Active borrowed</option>
              <option value="Returned">Returned matches</option>
              <option value="Overdue">Overdue warning</option>
            </select>
          </div>

          <button
            id="issue-book-btn"
            onClick={() => setIsBorrowModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md shadow-indigo-100"
          >
            <Plus className="w-4 h-4" />
            Borrow Book
          </button>
        </div>
      )}

      {/* Borrows Grid Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="inline-block border-2 border-indigo-600 border-t-transparent rounded-full w-8 h-8 animate-spin" />
        </div>
      ) : filteredBorrows.length > 0 ? (
        <div className="glass-card rounded-2xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-indigo-100 p-4 text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-55 bg-indigo-50/40 font-display">
                  <th className="p-4">Transaction #</th>
                  <th className="p-4">Book Title</th>
                  <th className="p-4">Borrowing Member</th>
                  <th className="p-4">Borrow Date</th>
                  <th className="p-4">Return / Due Date</th>
                  <th className="p-4">Staff Signoff</th>
                  <th className="p-4 text-center">Status</th>
                  {isStaff && <th className="p-4 text-center">Filing Check</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20 text-slate-705 text-slate-700">
                {filteredBorrows.map((b) => (
                  <tr key={b.borrow_id} className="hover:bg-white/40 transition-colors">
                    <td className="p-4 font-mono text-[11px] text-slate-400">#{b.borrow_id}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{b.book_title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Book Reference: {b.book_id}</div>
                    </td>
                    <td className="p-4 font-medium text-slate-600">{b.member_name}</td>
                    <td className="p-4 text-slate-500 font-mono text-[11px]">
                      {new Date(b.issue_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-4 font-mono text-[11px]">
                      {b.return_date ? (
                        <span className="text-emerald-600 font-bold">
                          Returned: {new Date(b.return_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      ) : (
                        <span className={b.borrow_status === 'Overdue' ? 'text-rose-600 font-bold' : 'text-slate-505 text-slate-555'}>
                          Due: {new Date(b.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 font-mono text-[11px]">{b.approved_by_username || 'Librarian'}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold rounded-full uppercase ${
                        b.borrow_status === 'Returned' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/10' :
                        b.borrow_status === 'Overdue' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/10' :
                        b.borrow_status === 'Pending' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/10' :
                        b.borrow_status === 'Rejected' ? 'bg-slate-500/10 text-slate-600 border border-slate-500/10' :
                        'bg-violet-500/10 text-violet-700 border border-violet-500/10'
                      }`}>
                        {b.borrow_status}
                      </span>
                      {b.fine_amount !== undefined && b.fine_amount > 0 && (
                        <div className="text-[9px] font-bold text-rose-600 mt-1 uppercase">
                          Fine Accrued: {formatKyat(b.fine_amount)} ({b.fine_status})
                        </div>
                      )}
                    </td>
                    {isStaff && (
                      <td className="p-4 whitespace-nowrap text-center">
                        {b.borrow_status === 'Pending' ? (
                          <div className="inline-flex gap-1.5 items-center justify-center">
                            <button
                              onClick={() => handleUpdateStatus(b.borrow_id, 'Borrowed')}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-sm shadow-indigo-100"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(b.borrow_id, 'Rejected')}
                              className="px-2.5 py-1 bg-white/40 hover:bg-white/80 hover:text-rose-600 text-slate-600 rounded text-[10px] border border-white/50 flex items-center gap-1 cursor-pointer shadow-sm"
                            >
                              Reject
                            </button>
                          </div>
                        ) : !b.return_date && b.borrow_status !== 'Rejected' ? (
                          <div className="inline-flex gap-1.5 items-center justify-center">
                            <button
                              id={`return-btn-${b.borrow_id}`}
                              onClick={() => handleReturn(b.borrow_id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-sm shadow-emerald-100"
                            >
                              <CornerDownLeft className="w-3 h-3" />
                              Return Book
                            </button>
                            <button
                              id={`renew-btn-${b.borrow_id}`}
                              onClick={() => handleRenew(b.borrow_id)}
                              className="px-2.5 py-1 bg-white/40 hover:bg-white/80 text-indigo-700 border border-white/50 rounded text-[10px] font-semibold cursor-pointer shadow-sm shadow-indigo-50"
                            >
                              Renew (14d)
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] font-medium">{b.borrow_status === 'Rejected' ? 'Archived' : 'Returned & Closed'}</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 glass-card rounded-2xl">
          <ArrowLeftRight className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">No borrowing activities filed or tracked.</p>
        </div>
      )}

      {/* BORROW BOOK DIALOG MODAL */}
      <AnimatePresence>
        {isBorrowModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl w-full max-w-md p-6 relative shadow-2xl space-y-4"
            >
              <button 
                id="close-issue-modal"
                onClick={() => { setIsBorrowModalOpen(false); setSelectedBookId(''); setSelectedMemberId(''); }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 font-display">
                <UserCheck className="w-4 h-4 text-indigo-650" />
                Borrow Book
              </h2>

              <form onSubmit={handleBorrowBook} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">Select Book Title *</label>
                  <select
                    id="issue-select-book"
                    required
                    value={selectedBookId}
                    onChange={(e) => setSelectedBookId(e.target.value)}
                    className="w-full px-2 py-2.5 bg-white/60 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Choose Book copy --</option>
                    {books.map(b => (
                      <option key={b.book_id} value={b.book_id}>
                        {b.title} (Available: {b.available_quantity} copies)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Select Student Member Profile *</label>
                  <select
                    id="issue-select-member"
                    required
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full px-2 py-2.5 bg-white/60 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Choose Member Profile --</option>
                    {members.map(m => (
                      <option key={m.member_id} value={m.member_id}>
                        {m.full_name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-505 text-slate-500 mb-1">Configured Borrow Duration</label>
                  <select
                    id="issue-select-days"
                    value={borrowDays}
                    onChange={(e) => setBorrowDays(e.target.value)}
                    className="w-full px-2 py-2.5 bg-white/60 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none"
                  >
                    <option value="7">7 Days (Short term)</option>
                    <option value="14">14 Days (Standard loan)</option>
                    <option value="21">21 Days (Undergrad course)</option>
                    <option value="30">30 Days (Extended study)</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                  <button
                    id="cancel-issue"
                    type="button"
                    onClick={() => { setIsBorrowModalOpen(false); setSelectedBookId(''); setSelectedMemberId(''); }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    id="confirm-issue"
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold cursor-pointer shadow-sm shadow-indigo-150"
                  >
                    Confirm Borrow
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
