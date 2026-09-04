import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Edit2, Trash2, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import PageHeader from '../components/PageHeader';
import ProgressBar from '../components/ProgressBar';

function SubjectForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { name: '', code: '', description: '' });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initial?.id) {
        const r = await api.put(`/subjects/${initial.id}`, form);
        onSave(r.data.subject, 'update');
      } else {
        const r = await api.post('/subjects', form);
        onSave(r.data.subject, 'create');
      }
      onClose();
    } catch (err) {
      showToast(err.userMessage, 'error');
    } finally {
      setLoading(false);
    }
  };
//   const handleSubmit = async (e) => {
//   e.preventDefault();
//   setLoading(true);

//   // TEMPORARY DEMO MODE - no MySQL required
//   if (!initial?.id) {
//     const mockSubject = {
//       id: Date.now(),
//       name: form.name.trim(),
//       code: form.code.trim(),
//       description: form.description.trim(),
//       total_materials: 0,
//       completed_materials: 0
//     };

//     onSave(mockSubject, 'create');
//     showToast('Subject added!', 'success');
//     onClose();
//     setLoading(false);
//     return;
//   }

//   // Real database operation for later
//   try {
//     const r = await api.put(`/subjects/${initial.id}`, form);
//     onSave(r.data.subject, 'update');
//     onClose();
//   } catch (err) {
//     showToast(err.userMessage, 'error');
//   } finally {
//     setLoading(false);
//   }
// };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Subject Name *</label>
        <input className="input" placeholder="e.g. Database Management Systems" required value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </div>
      <div>
        <label className="label">Subject Code</label>
        <input className="input" placeholder="e.g. CS301" value={form.code}
          onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input resize-none" rows={3} placeholder="Brief description…" value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Saving…' : initial?.id ? 'Update Subject' : 'Add Subject'}
        </button>
      </div>
    </form>
  );
}

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    api.get('/subjects').then(r => setSubjects(r.data.subjects)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = (subject, action) => {
    if (action === 'create') setSubjects(prev => [subject, ...prev]);
    else setSubjects(prev => prev.map(s => s.id === subject.id ? subject : s));
    showToast(action === 'create' ? 'Subject added!' : 'Subject updated!', 'success');
    setEditing(null);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/subjects/${deleting.id}`);
      setSubjects(prev => prev.filter(s => s.id !== deleting.id));
      showToast('Subject deleted.', 'success');
    } catch (err) {
      showToast(err.userMessage, 'error');
    }
  };

  if (loading) return <div className="p-6"><LoadingSpinner text="Loading subjects…" /></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="My Subjects"
        subtitle={`${subjects.length} subject${subjects.length !== 1 ? 's' : ''}`}
        action={
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        }
      />

      {subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects yet"
          description="Add your subjects to start organizing your study material and units."
          action={
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Add Subject
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map(s => {
            const total     = Number(s.total_materials     || 0);
            const completed = Number(s.completed_materials || 0);
            const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;
            return (
              <div key={s.id}
                className="card hover:shadow-md transition cursor-pointer group"
                onClick={() => navigate(`/subjects/${s.id}`)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition truncate">{s.name}</h3>
                      {s.code && <p className="text-xs text-blue-600 font-medium">{s.code}</p>}
                      {s.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setEditing(s); setShowForm(true); }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleting(s)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {total > 0 && (
                  <div className="mt-4">
                    <ProgressBar value={completed} max={total} color={pct >= 75 ? 'green' : 'blue'} height="h-1.5" />
                    <p className="text-xs text-gray-400 mt-1">{completed} of {total} materials completed</p>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400">{total} material{total !== 1 ? 's' : ''}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditing(null); }}
        title={editing ? 'Edit Subject' : 'Add New Subject'}>
        <SubjectForm initial={editing} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Subject"
        message={`Delete "${deleting?.name}"? All units, materials and mock attempts for this subject will also be deleted.`}
      />
    </div>
  );
}
