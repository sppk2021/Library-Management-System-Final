/**
 * COMPONENT: DashboardOverview
 * WHAT: Displays a high-level visual summary of library metrics (total books, overdue, active loans) and recent activity logs.
 * WHY: Provides librarians and admins a quick glance at system health and daily activity without navigating through multiple reporting tabs.
 */
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, Link, ArrowLeftRight, Clock, Users, ArrowUpRight, TrendingUp, AlertCircle 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { API } from '../lib/api';
import { DashboardStats } from '../types';

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const info = await API.getDashboardStats();
        setStats(info);
        
        // Also fetch active logs for dashboard feed
        const activeLogs = await API.getActivityLogs();
        setLogs(activeLogs.slice(0, 5));
      } catch (err: any) {
        setError(err.message || 'Failed to fetch analytics statistics.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="inline-block border-2 border-brand-blue border-t-transparent rounded-full w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        <span>{error}</span>
      </div>
    );
  }

  const statCards = [
    { 
      label: 'System Catalog', 
      value: stats?.totalBooks || 0, 
      sub: 'Cumulative book inventory', 
      icon: BookOpen, 
      color: 'text-brand-blue bg-blue-50/50 border-blue-100' 
    },
    { 
      label: 'Active Borrowed', 
      value: stats?.borrowedBooks || 0, 
      sub: 'Currently on loan', 
      icon: ArrowLeftRight, 
      color: 'text-brand-blue bg-blue-50/50 border-blue-100' 
    },
    { 
      label: 'Overdue Books', 
      value: stats?.overdueBooks || 0, 
      sub: 'Fines accruing state', 
      icon: Clock, 
      color: 'text-brand-orange bg-rose-50 border-rose-100' 
    },
    { 
      label: 'Library Members', 
      value: stats?.activeUsers || 0, 
      sub: 'Active certified students', 
      icon: Users, 
      color: 'text-brand-amber bg-amber-50/55 border-amber-100' 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Upper Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={card.label}
              className={`p-5 rounded-2xl bg-white border border-slate-100 flex items-start justify-between shadow-sm hover:shadow-md transition-all duration-200 ${
                card.label.includes('Overdue') ? 'border-l-4 border-l-brand-orange' : ''
              }`}
            >
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{card.label}</p>
                <p className={`text-3xl font-extrabold mt-1 tracking-tight font-display ${
                  card.label.includes('Active') || card.label.includes('Catalog') ? 'text-brand-blue' :
                  card.label.includes('Overdue') ? 'text-brand-orange' : 'text-slate-800'
                }`}>{card.value}</p>
                <p className="text-[11px] text-slate-500 mt-2 font-semibold">{card.sub}</p>
              </div>
              <div className={`p-2.5 rounded-xl border shrink-0 ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend Chart Card */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="lg:col-span-2 p-5 bg-white border border-slate-100 rounded-2xl flex flex-col justify-between shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">Borrowing & Returns Activity</h2>
              <p className="text-slate-500 text-[11px] mt-0.5">Borrowing and return frequency map</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-500 font-bold uppercase text-[9px]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-250" /> Borrowed
              </span>
              <span className="flex items-center gap-1.5 text-slate-500 font-bold uppercase text-[9px]">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-blue shadow-sm shadow-blue-200" /> Returned
              </span>
            </div>
          </div>

          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.borrowTrends || []} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBorrowed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReturned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b4bf3" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b4bf3" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <CartesianGrid stroke="rgba(226,232,240,0.3)" strokeDasharray="3 3" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(226,232,240,0.8)', color: '#0f172a', borderRadius: '12px', fontSize: 11, boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="borrowed" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBorrowed)" />
                <Area type="monotone" dataKey="returned" stroke="#3b4bf3" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReturned)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Popular Books Side Panel */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm"
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">Shelf Heatmap</h2>
            <TrendingUp className="w-4 h-4 text-brand-blue" />
          </div>

          <div className="space-y-4">
            {stats?.popularBooks && stats.popularBooks.length > 0 ? (
              stats.popularBooks.map((item, index) => (
                <div key={item.title} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-transparent hover:border-slate-100 transition-all">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">by {item.author}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold text-brand-blue bg-blue-50/50 border border-blue-105 border-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {item.count} loans
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                No borrowing activity logged yet.
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Audit logs + Notifications Alert Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 font-display">Core System Event Logs</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-2.5">Stamp</th>
                  <th className="pb-2.5">Trigger Code</th>
                  <th className="pb-2.5">User Handle</th>
                  <th className="pb-2.5">Relational Context Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.log_id} className="text-xs text-slate-700 hover:bg-slate-50">
                    <td className="py-2.5 text-[11px] text-slate-400 font-mono">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5">
                      <span className="text-[9px] font-bold bg-blue-50/50 px-2.5 py-1 rounded-lg text-brand-blue border border-blue-105 border-blue-100 font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 font-bold text-slate-800">
                      {log.username || 'System'}
                    </td>
                    <td className="py-2.5 text-slate-500 italic">
                      {log.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
