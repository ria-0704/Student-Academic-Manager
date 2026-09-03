import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm_password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const isThaparEmail = form.email.endsWith('@thapar.edu');
  const emailValid = form.email.length > 0 && isThaparEmail;
  const emailInvalid = form.email.length > 0 && !isThaparEmail;
  const pwMatch = form.password && form.confirm_password && form.password === form.confirm_password;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isThaparEmail) { showToast('Only @thapar.edu emails are allowed.', 'error'); return; }
    if (form.password !== form.confirm_password) { showToast('Passwords do not match.', 'error'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      login(res.data.token, res.data.user);
      showToast('Account created! Welcome to Academic Manager.', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.userMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <GraduationCap className="w-9 h-9 text-blue-700" />
          </div>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-blue-200 mt-1">Thapar University</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Join Academic Manager</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                className="input"
                placeholder="Your full name"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Thapar Email</label>
              <div className="relative">
                <input
                  type="email"
                  className={`input pr-10 ${emailInvalid ? 'border-red-400 focus:ring-red-400' : emailValid ? 'border-green-400 focus:ring-green-400' : ''}`}
                  placeholder="yourname@thapar.edu"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
                {emailValid   && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
                {emailInvalid && <XCircle     className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />}
              </div>
              {emailInvalid && <p className="text-xs text-red-500 mt-1">Only @thapar.edu emails are allowed.</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className={`input pr-10 ${form.confirm_password && !pwMatch ? 'border-red-400' : form.confirm_password && pwMatch ? 'border-green-400' : ''}`}
                  placeholder="Repeat password"
                  value={form.confirm_password}
                  onChange={e => setForm(f => ({ ...f, confirm_password: e.target.value }))}
                  required
                />
                {form.confirm_password && pwMatch   && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
                {form.confirm_password && !pwMatch  && <XCircle     className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />}
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
