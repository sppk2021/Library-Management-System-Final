/**
 * ENTRY POINT: Application Main Component
 * WHAT: Manages global routing, authentication lifecycle, and responsive layout.
 * WHY: Provides a persistent layout container so state (like sidebar collapses or user sessions) is not lost when navigating between sub-views.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, Library, ShieldAlert, LogOut, ChevronLeft, ChevronRight, Bookmark, Clock, User, CheckCircle, AlertTriangle, X 
} from 'lucide-react';

import { API, getAuthToken, clearAuthStorage } from './lib/api';
import LoginModal from './components/LoginModal';
import Sidebar from './components/Sidebar';
import DashboardOverview from './components/DashboardOverview';
import BooksPage from './components/BooksPage';
import BorrowingPage from './components/BorrowingPage';
import ReservationsPage from './components/ReservationsPage';
import FinesPage from './components/FinesPage';
import UsersPage from './components/UsersPage';
import SettingsPage from './components/SettingsPage';
import { Notification } from './types';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [currentTab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);

  // Live Alerts Notifications State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifPopover, setShowNotifPopover] = useState(false);

  // Resume Session on Mount
  useEffect(() => {
    async function verifySession() {
      const token = getAuthToken();
      if (token) {
        try {
          const res = await API.getMe();
          if (res?.user) {
            setUser(res.user);
            // Default students immediately to book list
            if (res.user.role === 'Student') {
              setTab('books');
            } else {
              setTab('dashboard');
            }
          }
        } catch {
          clearAuthStorage();
        }
      }
      setAuthChecking(false);
    }
    verifySession();
  }, []);

  // Sync notifications on user login
  const loadNotifications = async () => {
    if (!user) return;
    try {
      const data = await API.getNotifications();
      setNotifications(data || []);
    } catch (e) {
      // Slient fail
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Poll every 30 seconds for live alert changes
      const timer = setInterval(loadNotifications, 30000);
      return () => clearInterval(timer);
    }
  }, [user]);

  const handleLoginSuccess = (usr: any) => {
    setUser(usr);
    if (usr.role === 'Student') {
      setTab('books');
    } else {
      setTab('dashboard');
    }
  };

  const handleLogout = () => {
    clearAuthStorage();
    setUser(null);
    setTab('dashboard');
    setShowNotifPopover(false);
  };

  const maskNotificationRead = async (id: number) => {
    try {
      await API.markNotificationRead(id);
      loadNotifications();
    } catch {
      // Slient
    }
  };

  const unreadNotifs = notifications.filter(n => !n.is_read);

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-600 mb-4 animate-bounce">
          <Library className="w-8 h-8" />
        </div>
        <span className="inline-block border-2 border-indigo-600 border-t-transparent rounded-full w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginModal onSuccess={handleLoginSuccess} />;
  }

  // Active Component Selector
  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'books':
        return <BooksPage user={user} />;
      case 'borrowing':
      case 'student-history':
        return <BorrowingPage user={user} />;
      case 'reservations':
        return <ReservationsPage user={user} />;
      case 'fines':
        return <FinesPage user={user} />;
      case 'users':
        return <UsersPage user={user} />;
      case 'settings':
        return <SettingsPage user={user} />;
      default:
        return <DashboardOverview />;
    }
  };

  const tabLabels: { [key: string]: string } = {
    dashboard: 'Library Operations Center',
    books: 'Bibliography Catalog',
    borrowing: 'Borrowing & Return Process',
    'student-history': 'Personal Borrowed Books',
    reservations: 'Pending Holds & Reservations',
    fines: 'Library Fines',
    users: 'Members profile directory',
    settings: 'Backups & System diagnostics'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B226D] via-[#3b4bf3] to-[#4e5dff] flex font-sans text-slate-800 relative overflow-hidden">
      
      {/* Global Fluid Colorful Background Blobs */}
      <div className="absolute top-[-5%] left-[-5%] w-[45rem] h-[45rem] bg-indigo-400/20 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[-10%] w-[40rem] h-[40rem] bg-pink-400/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute top-[35%] left-[20%] w-[35rem] h-[35rem] bg-teal-400/15 rounded-full blur-3xl pointer-events-none z-0" />

      {/* LEFT NAVIGATION DRAWER */}
      <Sidebar 
        currentTab={currentTab}
        setTab={setTab}
        user={user}
        onLogout={handleLogout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        unreadCount={unreadNotifs.length}
      />

      {/* RIGHT WORKSPACE CARD PANEL */}
      <div className={`flex-1 min-h-screen flex flex-col transition-all duration-300 relative z-10 ${sidebarOpen ? 'md:pl-64' : 'md:pl-20'} pl-0`}>
        
        {/* UPPER APPLICATION DOCK HEADER */}
        <div className="m-4 mb-2 md:mb-4 md:mr-4 md:ml-4 flex-1 flex flex-col bg-white rounded-[24px] shadow-2xl border border-white/20 overflow-hidden min-h-[calc(100vh-2rem)]">
          <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 relative z-30 shadow-sm text-slate-800">
            <div className="flex items-center gap-2">
              <button 
                className="md:hidden p-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
              </button>
              <h1 className="text-xs font-bold text-slate-800 uppercase tracking-widest ml-1 font-display">
                {tabLabels[currentTab] || 'Centralized Library MS'}
              </h1>
              <span className="h-4 w-px bg-slate-200 mx-3 hidden sm:block" />
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              
              {/* Realtime alerts button */}
              <div className="relative">
                <button 
                  id="bell-alarm-btn"
                  onClick={() => setShowNotifPopover(!showNotifPopover)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    unreadNotifs.length > 0
                      ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm'
                      : 'bg-slate-50 border-slate-100 text-slate-600 hover:text-brand-blue hover:bg-slate-100 hover:border-blue-100'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifs.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </button>

                {/* POPUP REMINDERS DROPDOWN */}
                <AnimatePresence>
                  {showNotifPopover && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 p-2 text-xs"
                    >
                      <div className="p-2.5 border-b border-slate-150 flex items-center justify-between">
                        <span className="font-bold text-[10px] uppercase text-slate-700 tracking-wider">System Alerts ({unreadNotifs.length})</span>
                        <button onClick={() => setShowNotifPopover(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                      </div>

                      <div className="max-h-64 overflow-y-auto mt-2 space-y-1.5">
                        {notifications.length > 0 ? (
                          notifications.map((n) => (
                            <div 
                              key={n.notification_id} 
                              className={`p-2.5 rounded-xl border text-[11px] leading-relaxed relative flex items-start gap-2 ${
                                n.is_read 
                                  ? 'bg-slate-50 border-slate-100 text-slate-400' 
                                  : 'bg-indigo-50/50 border-indigo-100/50 text-slate-700'
                              }`}
                            >
                              <div className="space-y-1 flex-1">
                                <p className="font-semibold text-slate-800 text-[10px] uppercase tracking-wide">{n.title}</p>
                                <p className="text-slate-500">{n.message}</p>
                                <span className="text-[8px] text-slate-400 font-mono">{new Date(n.created_at).toLocaleDateString()}</span>
                              </div>
                              {!n.is_read && (
                                <button
                                  id={`read-notif-btn-${n.notification_id}`}
                                  onClick={() => maskNotificationRead(n.notification_id)}
                                  className="p-1.5 bg-white border border-slate-250 hover:bg-slate-50 rounded-lg text-brand-blue cursor-pointer text-[9px] font-bold shadow-sm"
                                >
                                  Read
                                </button>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-center py-8 text-slate-400 text-[11px]">Clear inbox. No reminders issued.</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile badge header */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[10px] font-bold bg-slate-100 border border-slate-200 text-brand-blue shadow-sm px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  ROLE: {user.role}
                </span>
              </div>
            </div>
          </header>

          {/* WORKSPACE APP CONTENT WRAPPER */}
          <main className="flex-1 p-6 overflow-y-auto relative z-20 bg-slate-50/50">
            {renderContent()}
          </main>

          {/* FOOTER BAR */}
          <footer className="h-10 border-t border-slate-100 text-[9px] text-slate-400 font-bold flex items-center justify-between px-6 font-mono bg-slate-50 shrink-0">
            <span>CENTRALIZED LIBRARY MS v2.6 • SYSTEM BRAND UPGRADE</span>
            <span>© {new Date().getFullYear()} SECURED DATA PRIVACY</span>
          </footer>
        </div>

      </div>
    </div>
  );
}
