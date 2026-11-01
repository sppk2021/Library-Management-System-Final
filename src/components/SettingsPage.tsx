import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Database, Shield, RefreshCw, Layers, CheckCircle, AlertCircle, FileCode, Clock, Server, Play, ShieldAlert, X 
} from 'lucide-react';
import { API } from '../lib/api';
import { Backup, ActivityLog } from '../types';

interface SettingsPageProps {
  user: any;
}

export default function SettingsPage({ user }: SettingsPageProps) {
  const isAdmin = user?.role === 'Admin';

  const [backups, setBackups] = useState<Backup[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isBackupRunning, setIsBackupRunning] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [rolePerms, setRolePerms] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const bList = await API.getBackups();
      const lList = await API.getActivityLogs();
      setBackups(bList);
      setLogs(lList);

      if (isAdmin) {
        const rpList = await API.getRolePermissions();
        setRolePerms(rpList);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to download systems diagnostics.');
    } finally {
      setLoading(false);
    }
  };

  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; message: string; onConfirm: () => void } | null>(null);

  const handleReseedBooks = async () => {
    setConfirmDialog({
      isOpen: true,
      message: 'CRITICAL ACTION: This will completely replace the books database with 100 original sample books and wipe all current loan/reservation histories. Do you want to proceed?',
      onConfirm: async () => {
        setConfirmDialog(null);
        setIsSeeding(true);
        setError(null);
        setSuccess(null);
        try {
          const response = await API.seedBooks();
          if (response.success) {
            setSuccess(response.message);
            loadData();
          }
        } catch (err: any) {
          setError(err?.message || 'Failed to seed database.');
        } finally {
          setIsSeeding(false);
        }
      }
    });
  };

  const handleTogglePermission = async (roleId: number, field: string) => {
    const targetPerm = rolePerms.find(rp => rp.role_id === roleId);
    if (!targetPerm) return;

    const updatedPermissions = {
      dashboard: targetPerm.dashboard,
      books: targetPerm.books,
      borrowing: targetPerm.borrowing,
      reports: targetPerm.reports || targetPerm.borrowing,
      users: targetPerm.users,
      settings: targetPerm.settings,
      [field]: !targetPerm[field]
    };

    try {
      await API.updateRolePermissions(roleId, updatedPermissions);
      setSuccess(`Permissions updated successfully for user category (ID #${roleId}).`);
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to update dynamic role permission.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunBackup = async () => {
    setIsBackupRunning(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await API.triggerBackup();
      if (response.success) {
        setSuccess(`Full database schema successfully backed up to file: ${response.backup_file}`);
        loadData();
      }
    } catch (err: any) {
      setError(err?.message || 'Backup failed.');
    } finally {
      setIsBackupRunning(false);
    }
  };

  const handleRestoreBackup = async (backupFile: string) => {
    setConfirmDialog({
      isOpen: true,
      message: `CRITICAL WARNING: This will overwrite ALL current database rows with the values inside ${backupFile}. Are you sure?`,
      onConfirm: async () => {
        setConfirmDialog(null);
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
          const res = await API.restoreBackup(backupFile);
          setSuccess(res.message || 'Database successfully restored from snap file.');
          loadData();
        } catch (err: any) {
          setError(err?.message || 'Failed to restore database.');
          setLoading(false);
        }
      }
    });
  };

  return (
    <div className="space-y-6 text-xs text-slate-700 font-sans">
      {/* Alert panels */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-650 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="cursor-pointer text-slate-400 hover:text-slate-650"><X className="w-4 h-4" /></button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-teal-500/10 border border-teal-500/20 text-teal-700 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-teal-600" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="cursor-pointer text-slate-400 hover:text-slate-650"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Backup Section */}
        <div className="lg:col-span-1 glass-card p-5 rounded-2xl space-y-4 shadow-md flex flex-col justify-between">
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-indigo-100 font-display">
              <Database className="w-4 h-4 text-indigo-600" />
              Backup Manager
            </h2>
            <p className="text-slate-500 font-medium text-[10px] sm:text-xs">
              Take full relational SQL snapshot dumps of tables (Users, Members, Books, Borrows, Reservations). Backups are safely archived on Cloud server volumes.
            </p>
          </div>

          <div className="space-y-2 mt-4">
            <button
              id="run-backup-btn"
              onClick={handleRunBackup}
              disabled={isBackupRunning}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              {isBackupRunning ? (
                <span className="inline-block border-2 border-white border-t-transparent rounded-full.w-4.h-4 animate-spin" />
              ) : (
                <>
                  <Server className="w-4 h-4" />
                  Snapshot Full Database
                </>
              )}
            </button>

            {isAdmin && (
              <button
                id="reseed-books-btn"
                onClick={handleReseedBooks}
                disabled={isSeeding}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                {isSeeding ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Seed 100 Sample Books
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Backups List Table */}
        <div className="lg:col-span-2 glass-card p-5 rounded-2xl space-y-4 shadow-md mb-4">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-indigo-100 font-display">
            <FileCode className="w-4 h-4 text-violet-600" />
            System Backups History ({backups.length})
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <span className="inline-block border-2 border-indigo-605 border-indigo-600 border-t-transparent rounded-full w-6 h-6 animate-spin" />
            </div>
          ) : backups.length > 0 ? (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {backups.map((b) => (
                <div key={b.backup_id} className="flex items-center justify-between p-3 bg-white/45 border border-white/60 rounded-lg hover:bg-white/80 transition-colors">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="font-bold text-slate-800 truncate text-xs font-mono">{b.backup_file}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-450 text-slate-550 text-slate-500 font-mono">
                      <span>By: {b.created_by_username || 'Admin'}</span>
                      <span>•</span>
                      <span>{new Date(b.created_at).toLocaleDateString()} {new Date(b.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <button
                    id={`restore-backup-btn-${b.backup_id}`}
                    onClick={() => handleRestoreBackup(b.backup_file)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-650 hover:text-rose-700 rounded text-[10px] font-extrabold flex items-center gap-1 ml-4 cursor-pointer shadow-sm transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Restore System
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 py-6 text-center">No snapshot backups found. Create one now.</p>
          )}
        </div>
      </div>

      {/* Role-Based Permissions Administration Matrix */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 rounded-2xl space-y-4 shadow-md"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-indigo-100">
            <Shield className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider font-display">
                Dynamic Role Permissions Matrix
              </h2>
              <p className="text-[10px] text-slate-400">
                Grant or restrict access to navigation links, action triggers, and API routes dynamically in real-time.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-indigo-50 text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50/40">
                  <th className="p-3">Module / Page Name</th>
                  <th className="p-3 text-center">Admin (ID #1)</th>
                  <th className="p-3 text-center">Librarian (ID #2)</th>
                  <th className="p-3 text-center">Student (ID #3)</th>
                  <th className="p-3 text-center">Staff (ID #4)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20 text-slate-750">
                {[
                  { field: 'dashboard', label: 'Dashboard Stats', desc: 'Summary counters, charts, reports & transaction histories' },
                  { field: 'books', label: 'Books Catalog', desc: 'Browse catalog, view availability states & register search inputs' },
                  { field: 'borrowing', label: 'Borrowing Manager', desc: 'Create new borrows, record returns & levy fines' },
                  { field: 'users', label: 'Members & Roles Control', desc: 'Review member registrations, change status & edit details' },
                  { field: 'settings', label: 'System Configuration', desc: 'Perform system snap dumps, restores & dynamic permissions mapping' }
                ].map((row) => (
                  <tr key={row.field} className="hover:bg-white/40 transition-colors">
                    <td className="p-3">
                      <p className="font-bold text-slate-800">{row.label}</p>
                      <p className="text-[9px] text-slate-450 text-slate-500 font-medium">{row.desc}</p>
                    </td>
                    {[1, 2, 3, 4].map((roleId) => {
                      const permRecord = rolePerms.find(rp => rp.role_id === roleId);
                      const isChecked = permRecord ? !!permRecord[row.field] : false;
                      const isSelfProtect = roleId === 1 && row.field === 'settings'; // Admin can't remove settings access for self

                      return (
                        <td key={roleId} className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isSelfProtect || !permRecord}
                            onChange={() => handleTogglePermission(roleId, row.field)}
                            className="w-4.5 h-4.5 rounded text-indigo-650 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus:outline-none transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Audit Logs full list terminal */}
      <div className="glass-card p-5 rounded-2xl space-y-4 shadow-md">
        <h2 className="text-sm font-extrabold text-slate-805 text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-indigo-100 font-display">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          Full Activity Auditing Log Directory ({logs.length})
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <span className="inline-block border-2 border-indigo-600 border-t-transparent rounded-full w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto pr-2 space-y-2 font-mono text-[11px]">
            {logs.map((log) => (
              <div key={log.log_id} className="p-2 sm:p-3 bg-white/50 border border-slate-100 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-slate-600">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-400 text-[10px]">{new Date(log.created_at).toLocaleString()}</span>
                  <span className="text-indigo-700 font-black text-[10px] border border-indigo-100 bg-indigo-50/50 px-1.5 py-0.5 rounded">
                    {log.action}
                  </span>
                  <span className="text-[10px] text-slate-800 font-extrabold font-mono">BY: {log.username || 'System'}</span>
                </div>
                <div className="text-slate-600 italic text-[11px] font-sans sm:text-right">
                  {log.description}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-fade-in border border-slate-100">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              Confirm Action
            </h3>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="mt-6 flex justify-end gap-3 font-sans text-sm">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white transition-colors font-medium rounded-lg"
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
