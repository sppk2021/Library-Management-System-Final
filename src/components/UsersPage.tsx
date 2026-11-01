import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, UserCheck, ShieldAlert, Edit, CheckCircle, AlertCircle, Search, X, Mail, Phone, MapPin 
} from 'lucide-react';
import { API } from '../lib/api';
import { Member, User } from '../types';

interface UsersPageProps {
  user: any;
}

export default function UsersPage({ user }: UsersPageProps) {
  const isAdmin = user?.role === 'Admin';
  const isStaff = ['Admin', 'Librarian', 'Staff'].includes(user?.role);

  const [members, setMembers] = useState<Member[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [search, setSearch] = useState('');

  // Modals / Create Account State
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('3');
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const handleRoleChange = async (targetId: number, nextRole: number) => {
    try {
      await API.updateUserRole(targetId, nextRole);
      setSuccess(`User ID ${targetId} role successfully customized.`);
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to update user role.');
    }
  };

  const handleDeleteUser = async (targetId: number) => {
    if (!window.confirm('Are you absolutely sure you want to permanently delete this user account? All corresponding directory entries will also be removed.')) {
      return;
    }
    try {
      await API.deleteUser(targetId);
      setSuccess(`User ID ${targetId} completely removed from the registry.`);
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete user account.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await API.createUser({
        username: newUsername,
        email: newEmail,
        password: newPassword,
        role_id: Number(newRole),
        fullName: newFullName,
        phone: newPhone,
        address: newAddress
      });
      setSuccess(`New account "${newUsername}" successfully established!`);
      setShowCreateModal(false);
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('3');
      setNewFullName('');
      setNewPhone('');
      setNewAddress('');
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to create user account.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const mbList = await API.getMembers();
      setMembers(mbList);

      if (isAdmin) {
        const uList = await API.getUsers();
        setUsersList(uList);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to sync users directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    try {
      await API.updateMember(editingMember.member_id, editingMember);
      setSuccess(`Member profile for "${editingMember.full_name}" successfully saved.`);
      setEditingMember(null);
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to update member profile details.');
    }
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: 'Active' | 'Suspended') => {
    const next = currentStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      await API.updateUserStatus(userId, next);
      setSuccess(`User ID ${userId} authorization status shifted to: ${next}.`);
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to update account authorization access.');
    }
  };

  const filteredMembers = members.filter(m => {
    const term = search.toLowerCase();
    return m.full_name.toLowerCase().includes(term) || m.email.toLowerCase().includes(term) || (m.phone && m.phone.includes(term));
  });

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
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

      {/* Control panel */}
      <div className="glass-card p-4 rounded-xl flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="members-search"
            type="text"
            placeholder="Search student directories by name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white/40 border border-white/50 rounded-lg text-xs text-slate-805 text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>
        <p className="text-[10px] text-slate-400 ml-auto hidden sm:block uppercase font-bold text-wide font-mono">
          Student directory access levels
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="inline-block border-2 border-indigo-600 border-t-transparent rounded-full w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 font-sans">
          {/* Members profiles grid list */}
          <div className="glass-card rounded-2xl p-5 space-y-4 shadow-md">
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-indigo-100 font-display">
              <Users className="w-4 h-4 text-indigo-600 font-extrabold" />
              Student Member Directory ({filteredMembers.length})
            </h2>

            {filteredMembers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMembers.map((m) => (
                  <div key={m.member_id} className="p-4 bg-white/55 border border-white/60 hover:bg-white/90 transition-all rounded-xl space-y-3 shrink-0 flex flex-col justify-between shadow-sm">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-slate-800 uppercase">{m.full_name}</h3>
                          <span className="text-[9px] text-slate-400 font-mono">Member ID: #{m.member_id}</span>
                        </div>
                        <span className={`px-2 py-0.5 text-[8px] font-extrabold rounded uppercase ${
                          m.membership_status === 'Active' ? 'bg-emerald-500/10 text-emerald-700' :
                          'bg-rose-500/10 text-rose-650'
                        }`}>
                          {m.membership_status}
                        </span>
                      </div>

                      <div className="space-y-1 pt-1.5 border-t border-slate-100 text-[10px] text-slate-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-450 text-slate-400 shrink-0" />
                          <span>{m.email}</span>
                        </div>
                        {m.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-450 text-slate-400 shrink-0" />
                            <span>{m.phone || 'N/A'}</span>
                          </div>
                        )}
                        {m.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-450 text-slate-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{m.address || 'N/A'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isStaff && (
                      <div className="flex justify-end pt-2 border-t border-slate-100">
                        <button
                          id={`edit-member-btn-${m.member_id}`}
                          onClick={() => setEditingMember({ ...m })}
                          className="px-3 py-1 bg-white/40 hover:bg-white border border-slate-200 text-slate-600 hover:text-slate-800 text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer shadow-sm transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                          Edit Member Profile
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No member profiles found.</p>
            )}
          </div>

          {/* Users credentials list (Admin exclusive security audit) */}
          {isAdmin && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card rounded-2xl p-5 space-y-4 shadow-md text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-indigo-100">
                <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 font-display">
                  <UserCheck className="w-4 h-4 text-violet-650" />
                  Auth User Logins (Security Access Controls)
                </h2>
                <button
                  id="add-new-user-btn"
                  onClick={() => setShowCreateModal(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-150 transition-all font-sans"
                >
                  Create User Account
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="border-b border-indigo-100 text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50/40 font-display">
                      <th className="p-3">User ID</th>
                      <th className="p-3">Username</th>
                      <th className="p-3">Registered Email</th>
                      <th className="p-3">Designated Role</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Security Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/20 text-slate-705 text-slate-700">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-white/40 transition-colors">
                        <td className="p-3 font-mono text-slate-400 text-[11px] font-semibold">#{u.id}</td>
                        <td className="p-3 text-slate-800 font-bold">{u.username}</td>
                        <td className="p-3">{u.email}</td>
                        <td className="p-3">
                          {u.id !== user.id ? (
                            <select
                              value={u.role_id}
                              onChange={(e) => handleRoleChange(u.id, Number(e.target.value))}
                              className="px-2 py-1 bg-white/60 border border-slate-200 rounded text-[10px] font-semibold text-slate-800 focus:outline-none cursor-pointer"
                            >
                              <option value="1">Admin</option>
                              <option value="2">Librarian</option>
                              <option value="4">Staff</option>
                              <option value="3">Student</option>
                            </select>
                          ) : (
                            <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold rounded border bg-indigo-505/10 text-indigo-705 border-indigo-500/10">
                              Admin (Self)
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded ${
                            u.status === 'Active' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-rose-500/10 text-rose-650'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          {u.id !== user.id ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                id={`toggle-user-status-${u.id}`}
                                onClick={() => handleToggleUserStatus(u.id, u.status)}
                                className={`px-2 py-1 font-bold rounded text-[10px] cursor-pointer transition-all ${
                                  u.status === 'Active' 
                                    ? 'bg-amber-50/50 hover:bg-amber-100/70 border border-amber-200/50 text-amber-700' 
                                    : 'bg-emerald-50/50 hover:bg-emerald-100/70 border border-emerald-200/50 text-emerald-700'
                                }`}
                              >
                                {u.status === 'Active' ? 'Suspend' : 'Activate'}
                              </button>
                              <button
                                id={`delete-user-btn-${u.id}`}
                                onClick={() => handleDeleteUser(u.id)}
                                className="px-2 py-1 bg-rose-50/50 hover:bg-rose-100/70 border border-rose-200/50 text-rose-600 font-bold rounded text-[10px] cursor-pointer transition-all"
                              >
                                Delete
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px] font-medium italic">Self (Protected)</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* ADMIN LEVEL USER CREATION MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl space-y-4 text-xs"
            >
              <button 
                id="close-create-user-modal"
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider font-display">
                Create User Account
              </h2>

              <form onSubmit={handleCreateUser} className="space-y-3.5">
                <div>
                  <label className="block text-slate-505 text-slate-500 mb-1">Username (Login Credentials)</label>
                  <input
                    id="new-username"
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. jsmith"
                    className="w-full px-3 py-2 bg-white/60 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-505 text-slate-500 mb-1">Email Address</label>
                  <input
                    id="new-email"
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. jsmith@academy.org"
                    className="w-full px-3 py-2 bg-white/60 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-505 text-slate-500 mb-1">Account Password</label>
                  <input
                    id="new-password"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 bg-white/60 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-505 text-slate-500 mb-1">Account System Role</label>
                  <select
                    id="new-role"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-2 py-2 bg-white/60 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none"
                  >
                    <option value="3">Student (Standard)</option>
                    <option value="2">Librarian (Staff)</option>
                    <option value="4">Staff (Operations)</option>
                    <option value="1">Admin (System)</option>
                  </select>
                </div>

                <div className="border-t border-slate-100 pt-2 space-y-2">
                  <p className="text-[10px] uppercase font-bold text-slate-450 text-indigo-600">Optional Profile Settings</p>
                  
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Full Legal Name</label>
                    <input
                      id="new-fullname"
                      type="text"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="e.g. Johnathan Smith"
                      className="w-full px-3 py-1.5 bg-white/60 border border-slate-200 rounded-lg text-slate-800 text-[11px] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Phone Number</label>
                    <input
                      id="new-phone"
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="e.g. +1 555-0155"
                      className="w-full px-3 py-1.5 bg-white/60 border border-slate-200 rounded-lg text-slate-800 text-[11px] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                  <button
                    id="cancel-create-user"
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    id="submit-create-user"
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold cursor-pointer shadow-sm"
                  >
                    Establish Account
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl space-y-4"
            >
              <button 
                id="close-profile-modal"
                onClick={() => setEditingMember(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-sm font-extrabold text-slate-805 text-slate-800 uppercase tracking-wider font-display">
                Edit Student Profile
              </h2>

              <form onSubmit={handleUpdateMember} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-505 text-slate-500 mb-1">Full Student Name</label>
                  <input
                    id="member-form-name"
                    type="text"
                    required
                    value={editingMember.full_name || ''}
                    onChange={(e) => setEditingMember({...editingMember, full_name: e.target.value})}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 bg-white/60 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-550 text-slate-500 mb-1">Phone Contact</label>
                  <input
                    id="member-form-phone"
                    type="text"
                    value={editingMember.phone || ''}
                    onChange={(e) => setEditingMember({...editingMember, phone: e.target.value})}
                    placeholder="+1 555-..."
                    className="w-full px-3 py-2 bg-white/60 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-550 text-slate-500 mb-1">Permanent Location Address</label>
                  <textarea
                    id="member-form-address"
                    rows={2}
                    value={editingMember.address || ''}
                    onChange={(e) => setEditingMember({...editingMember, address: e.target.value})}
                    placeholder="e.g. Room 402, Metro"
                    className="w-full px-3 py-2 bg-white/60 border border-slate-200 rounded-lg text-slate-800 resize-none focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-550 text-slate-500 mb-1">Membership Profile Level State</label>
                  <select
                    id="member-form-status"
                    value={editingMember.membership_status || 'Active'}
                    onChange={(e) => setEditingMember({...editingMember, membership_status: e.target.value as any})}
                    className="w-full px-2 py-2.5 bg-white/60 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none"
                  >
                    <option value="Active">Active Profile</option>
                    <option value="Expired">Membership Expired</option>
                    <option value="Suspended">Access Suspended</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                  <button
                    id="cancel-profile-form"
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer transition-colors"
                  >
                    Discard Changes
                  </button>
                  <button
                    id="save-profile-form"
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold cursor-pointer shadow-sm shadow-indigo-150"
                  >
                    Save Changes
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
