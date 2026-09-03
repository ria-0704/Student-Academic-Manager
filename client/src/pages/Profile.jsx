import React, { useState } from 'react';
import { User, Mail, Calendar, Save, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { formatDate } from '../utils/helpers';
import PageHeader from '../components/PageHeader';

export default function Profile() {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.full_name || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === user?.full_name) { setEditing(false); return; }
    setLoading(true);
    try {
      const r = await api.put('/profile', { full_name: name.trim() });
      setUser(r.data.user);
      showToast('Name updated successfully!', 'success');
      setEditing(false);
    } catch (err) {
      showToast(err.userMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <PageHeader title="Profile" subtitle="Manage your account details" />

      <div className="card">
        {/* Avatar */}
        <div className="flex flex-col items-center py-6 border-b border-gray-100 mb-6">
          <div className="w-20 h-20 rounded-full bg-blue-700 flex items-center justify-center text-white text-3xl font-bold mb-4">
            {user?.full_name?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <h2 className="text-xl font-bold text-gray-900">{user?.full_name}</h2>
          <p className="text-gray-500 text-sm">{user?.email}</p>
          <span className="badge bg-blue-100 text-blue-700 mt-2">Thapar University Student</span>
        </div>

        {/* Fields */}
        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="label flex items-center gap-2"><User className="w-4 h-4" /> Full Name</label>
            {editing ? (
              <form onSubmit={handleSave} className="flex gap-2">
                <input className="input flex-1" value={name} onChange={e => setName(e.target.value)}
                  minLength={2} required autoFocus />
                <button type="submit" disabled={loading} className="btn-primary px-4">
                  {loading ? '…' : <Save className="w-4 h-4" />}
                </button>
                <button type="button" onClick={() => { setEditing(false); setName(user?.full_name); }} className="btn-secondary px-3">
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg">
                <span className="text-gray-800">{user?.full_name}</span>
                <button onClick={() => setEditing(true)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="label flex items-center gap-2"><Mail className="w-4 h-4" /> Email</label>
            <div className="px-3 py-2.5 bg-gray-50 rounded-lg text-gray-700">
              {user?.email}
            </div>
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
          </div>

          {/* Member since */}
          <div>
            <label className="label flex items-center gap-2"><Calendar className="w-4 h-4" /> Member Since</label>
            <div className="px-3 py-2.5 bg-gray-50 rounded-lg text-gray-700">
              {formatDate(user?.created_at)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
