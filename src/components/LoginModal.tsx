import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, UserCheck, Shield, Key, AlertTriangle, User, Mail, Phone, MapPin } from 'lucide-react';
import { API } from '../lib/api';

interface LoginProps {
  onSuccess: (user: any) => void;
}

export default function LoginModal({ onSuccess }: LoginProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [roleId, setRoleId] = useState('3'); // Default Student

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isRegisterMode) {
        if (!username || !email || !password) {
          throw new Error('Please populate all required fields.');
        }
        
        // Password strength validation
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        if (!passwordRegex.test(password)) {
          throw new Error('Password must be at least 8 characters long and contain at least one letter, one number, and one special character.');
        }

        await API.register({
          username,
          email,
          password,
          role_id: 3, // Force Student role
          fullName,
          phone,
          address
        });
        setSuccessMsg('Account registered successfully! You can now log in.');
        setIsRegisterMode(false);
        setPassword('');
      } else {
        if (!username || !password) {
          throw new Error('Please enter both your username and password.');
        }
        const response = await API.login(username, password);
        onSuccess(response.user);
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const triggerDemoLogin = async (user: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.login(user, pass);
      onSuccess(response.user);
    } catch (err: any) {
      setError(err?.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0c0f3a] via-[#111654] to-[#3b4bf3] p-4 relative overflow-hidden font-sans text-slate-700">
      {/* High-vibrancy Dynamic Background Glowing Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[30%] left-[40%] w-[30rem] h-[30rem] bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white rounded-3xl p-8 relative z-10 text-slate-850 shadow-2xl border border-white/20"
      >
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-2xl border border-blue-100 text-brand-blue mb-4 shadow-sm">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900 font-display uppercase leading-tight">
            Centralized Library Management System
          </h1>
          <p className="text-xs text-slate-550 font-bold mt-1 uppercase tracking-wider">
            {isRegisterMode ? 'Form your student credentials' : 'LMS Relational Database Interface'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 animate-pulse" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
              Username *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                id="username-input"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. librarian"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all font-semibold"
              />
            </div>
          </div>

          {isRegisterMode && (
            <>
              <div>
                <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    id="email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@school.edu"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                  Full Name
                </label>
                <input
                  id="fullname-input"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                    </span>
                    <input
                      id="phone-input"
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 555-..."
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all font-semibold"
                    />
                  </div>
                </div>

                <div className="bg-blue-50/50 border border-blue-105 border-blue-100 p-2.5 rounded-xl flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-blue shrink-0 animate-pulse" />
                  <div>
                    <p className="text-[10px] font-bold text-brand-blue">Self-Registration Policy</p>
                    <p className="text-[8px] leading-tight text-slate-500 font-bold mt-0.5">Creating a Student account. Staff must be registered by Admin.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                  Permanent Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 pt-2.5 flex items-start text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <textarea
                    id="address-input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    placeholder="e.g. 101 University Ave, City"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none resize-none transition-all font-semibold"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
              Password *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Key className="w-4 h-4" />
              </span>
              <input
                id="password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all font-semibold"
              />
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-blue hover:bg-[#2b39cc] active:scale-[0.99] disabled:bg-blue-300 text-white text-xs uppercase tracking-widest font-bold rounded-xl transition-all mt-3 flex items-center justify-center cursor-pointer shadow-lg shadow-blue-500/25"
          >
            {loading ? (
              <span className="inline-block border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin" />
            ) : isRegisterMode ? (
              'Create Library Profile'
            ) : (
              'Sign In Securely'
            )}
          </button>
        </form>

        {/* Toggle between Register/Login */}
        <div className="mt-5 text-center">
          <button
            id="toggle-auth-btn"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setError(null);
              setSuccessMsg(null);
            }}
            className="text-[10px] text-brand-blue hover:text-blue-700 font-extrabold uppercase tracking-widest cursor-pointer"
          >
            {isRegisterMode ? 'Already registered? Log in instead' : "Don't have an account? Create one"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}