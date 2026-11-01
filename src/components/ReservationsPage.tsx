import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CalendarRange, CheckSquare, XCircle, AlertCircle, CheckCircle, Clock, Search, X 
} from 'lucide-react';
import { API } from '../lib/api';
import { Reservation } from '../types';

interface ReservationsPageProps {
  user: any;
}

export default function ReservationsPage({ user }: ReservationsPageProps) {
  const isStaff = ['Admin', 'Librarian', 'Staff'].includes(user?.role);

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await API.getReservations();
      setReservations(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve active reservations catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (resId: number, status: string) => {
    try {
      await API.updateReservationStatus(resId, status);
      setSuccess(`Reservation successfully marked as: ${status}.`);
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to update reservation.');
    }
  };

  const filteredReservations = reservations.filter(r => {
    const term = search.toLowerCase();
    const matchesName = r.book_title?.toLowerCase().includes(term) || r.member_name?.toLowerCase().includes(term);
    return matchesName;
  });

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {!isStaff && (
        <div className="p-4 bg-teal-500/10 border border-teal-500/20 text-teal-800 rounded-xl text-sm flex items-start gap-3 shadow-sm mb-6">
          <CalendarRange className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            <strong>My Reservations Flow:</strong> This tab shows books you have requested to be held. When a book is unavailable, you can reserve it. Once a Librarian approves the hold, you will have until the Hold Expiry Limit to visit the library and check out the book before your reservation is cancelled.
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

      {/* Action panel with search */}
      <div className="glass-card p-4 rounded-xl flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="res-search"
            type="text"
            placeholder="Search reservations by book, borrower..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white/40 border border-white/50 rounded-lg text-xs text-slate-805 text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>
        <p className="text-[10px] text-slate-400 ml-auto hidden sm:block uppercase font-bold text-wide font-mono">
          Pending &amp; Hold Catalog Management
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="inline-block border-2 border-indigo-600 border-t-transparent rounded-full w-8 h-8 animate-spin" />
        </div>
      ) : filteredReservations.length > 0 ? (
        <div className="glass-card rounded-2xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-indigo-100 p-4 text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50/40 font-display">
                  <th className="p-4">Hold #</th>
                  <th className="p-4">Reserved Book</th>
                  <th className="p-4">Requester Profiles</th>
                  <th className="p-4">Reserved Date</th>
                  <th className="p-4">Hold Expiry Limit</th>
                  <th className="p-4 text-center">Hold Status</th>
                  <th className="p-4 text-center">Filing Adjustments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20 text-slate-700">
                {filteredReservations.map((r) => {
                  const isPending = r.status === 'Pending';
                  const isApproved = r.status === 'Approved';
                  return (
                    <tr key={r.reservation_id} className="hover:bg-white/40 transition-colors">
                      <td className="p-4 font-mono text-[11px] text-slate-400">#{r.reservation_id}</td>
                      <td className="p-4 font-bold text-slate-800">{r.book_title}</td>
                      <td className="p-4 text-slate-600 font-medium">{r.member_name}</td>
                      <td className="p-4 text-slate-500 font-mono text-[11px]">
                        {new Date(r.reserve_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="p-4 text-slate-500 font-mono text-[11px]">
                        {new Date(r.expiry_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold rounded-full uppercase ${
                          r.status === 'Approved' ? 'bg-violet-500/10 text-violet-700 border border-violet-500/10' :
                          r.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/10' :
                          r.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/10' :
                          'bg-amber-500/10 text-amber-605 text-amber-600 border border-amber-500/10'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex gap-1.5 justify-center">
                          {isPending && isStaff && (
                            <button
                              id={`approve-res-btn-${r.reservation_id}`}
                              onClick={() => handleUpdateStatus(r.reservation_id, 'Approved')}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-sm shadow-indigo-100"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Approve Hold
                            </button>
                          )}
                          
                          {isApproved && isStaff && (
                            <button
                              id={`complete-res-btn-${r.reservation_id}`}
                              onClick={() => handleUpdateStatus(r.reservation_id, 'Completed')}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-sm shadow-emerald-100"
                            >
                              Mark Collected
                            </button>
                          )}

                          {['Pending', 'Approved'].includes(r.status) && (
                            <button
                              id={`cancel-res-btn-${r.reservation_id}`}
                              onClick={() => handleUpdateStatus(r.reservation_id, 'Cancelled')}
                              className="px-2.5 py-1 bg-white/40 hover:bg-white/80 hover:text-rose-600 text-slate-600 rounded text-[10px] border border-white/50 cursor-pointer shadow-sm"
                            >
                              Cancel hold
                            </button>
                          )}

                          {!['Pending', 'Approved'].includes(r.status) && (
                            <span className="text-slate-400 text-[10px] font-medium">Archived Hold</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 glass-card rounded-2xl">
          <CalendarRange className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">No book holds or reservations filed at this time.</p>
        </div>
      )}
    </div>
  );
}
