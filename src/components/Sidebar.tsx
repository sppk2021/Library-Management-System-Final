import React from 'react';
import { 
  LayoutDashboard, Book, Layers, ArrowLeftRight, CalendarRange, 
  Users, Settings, ShieldAlert, LogOut, ChevronLeft, ChevronRight, Bell, Library 
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  user: any;
  onLogout: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  unreadCount: number;
}

export default function Sidebar({ 
  currentTab, setTab, user, onLogout, sidebarOpen, setSidebarOpen, unreadCount 
}: SidebarProps) {
  const role = user?.role || 'Student';

  // Define sidebar menu options
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Librarian', 'Staff'] },
    { id: 'books', label: 'Books Catalog', icon: Book, roles: ['Admin', 'Librarian', 'Student', 'Staff'] },
    { id: 'borrowing', label: 'Borrow & Return', icon: ArrowLeftRight, roles: ['Admin', 'Librarian', 'Staff'] },
    { id: 'student-history', label: 'My Borrows', icon: ArrowLeftRight, roles: ['Student'] },
    { id: 'reservations', label: 'Reservations', icon: CalendarRange, roles: ['Admin', 'Librarian', 'Student', 'Staff'] },
    { id: 'fines', label: 'Library Fines', icon: ShieldAlert, roles: ['Admin', 'Librarian', 'Student', 'Staff'] },
    { id: 'users', label: 'Members Directory', icon: Users, roles: ['Admin', 'Librarian'] },
    { id: 'settings', label: 'System Settings', icon: Settings, roles: ['Admin'] },
  ];

  const filteredItems = menuItems.filter(item => {
    const perms = user?.permissions;
    if (!perms) {
      return item.roles.includes(role);
    }
    if (item.id === 'dashboard') return !!perms.dashboard;
    if (item.id === 'books') return !!perms.books;
    if (item.id === 'borrowing') return !!perms.borrowing;
    if (item.id === 'student-history') return role === 'Student';
    if (item.id === 'reservations') return role === 'Student' || !!perms.borrowing;
    if (item.id === 'fines') return role === 'Student' || !!perms.borrowing;
    if (item.id === 'users') return !!perms.users;
    if (item.id === 'settings') return !!perms.settings;
    return item.roles.includes(role);
  });

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside 
        className={`fixed top-4 left-4 z-20 h-[calc(100vh-2rem)] bg-white border border-slate-100 rounded-[24px] shadow-2xl transition-all duration-300 flex flex-col justify-between text-slate-800 transform md:transform-none ${
          sidebarOpen ? 'w-56 translate-x-0' : 'w-56 -translate-x-full md:w-20 md:translate-x-0'
        }`}
      >
      {/* Upper Brand Info */}
      <div className="flex flex-col">
        <div className={`h-16 flex items-center ${sidebarOpen ? 'justify-between px-4' : 'justify-center'} border-b border-slate-100 relative`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-2 bg-brand-blue rounded-xl shrink-0 text-white shadow-lg shadow-blue-500/25">
              <Library className="w-5 h-5" />
            </div>
            {sidebarOpen && (
              <span className="font-bold text-[10px] tracking-tight text-slate-900 uppercase font-display leading-tight whitespace-normal max-w-[130px] break-words">
                Centralized Library Management System
              </span>
            )}
          </div>
          <button 
            id="toggle-sidebar-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`rounded-full border border-slate-100 bg-white text-slate-400 hover:text-brand-blue shadow-sm hover:shadow-md transition-all cursor-pointer hidden md:flex items-center justify-center ${
              sidebarOpen ? 'p-1.5' : 'absolute -right-3 top-5 w-6 h-6 z-50'
            }`}
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Menu Navigation Links */}
        <nav className="p-3 space-y-1 mt-3">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                id={`tab-btn-${item.id}`}
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left cursor-pointer group relative font-semibold ${
                  isActive 
                    ? 'bg-brand-blue text-white shadow-lg shadow-blue-500/20' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-brand-blue'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-105 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-blue'}`} />
                <span className={`text-[11px] font-bold tracking-wide uppercase ${!sidebarOpen ? 'md:hidden' : ''}`}>{item.label}</span>
                {!sidebarOpen && (
                  <div className="absolute left-16 bg-white border border-slate-100 text-slate-800 text-[10px] px-2 py-1.5 rounded-lg shadow-xl hidden md:group-hover:block whitespace-nowrap z-50 font-bold uppercase tracking-wider">
                    {item.label}
                  </div>
                )}
                {item.id === 'notifications' && unreadCount > 0 && (
                  <span className="ml-auto bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout Profile Panel */}
      <div className="p-3 border-t border-slate-100 text-slate-800">
        <div className={`flex items-center gap-3 p-2 rounded-xl mb-3 ${sidebarOpen ? 'bg-slate-50 border border-slate-100' : ''}`}>
          <div className="w-9 h-9 rounded-full bg-brand-blue font-bold text-xs text-white flex items-center justify-center border border-white/20 shrink-0 uppercase shadow-md shadow-blue-500/15">
            {user?.username?.substring(0, 2) || 'ST'}
          </div>
          {sidebarOpen && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-850 truncate">{user?.username || 'Library Member'}</p>
              <span className={`inline-block text-[8px] font-extrabold px-2 py-0.5 mt-1 rounded-full uppercase tracking-widest ${
                role === 'Admin' ? 'bg-rose-50 text-brand-orange border border-rose-100' :
                role === 'Librarian' ? 'bg-blue-50 text-brand-blue border border-blue-100' :
                role === 'Staff' ? 'bg-indigo-50 text-brand-iris border border-indigo-100' :
                'bg-amber-50 text-brand-amber border border-amber-100'
              }`}>
                {role}
              </span>
            </div>
          )}
        </div>

        <button
          id="logout-btn"
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer ${
            sidebarOpen ? 'justify-start' : 'justify-center'
          }`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {sidebarOpen && <span className="text-[10px] uppercase font-bold tracking-wider">Sign Out</span>}
        </button>
      </div>
    </aside>
    </>
  );
}
