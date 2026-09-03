import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Edit2, Trash2, MapPin, Clock, FileText, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import PageHeader from '../components/PageHeader';
import { formatDate, formatTime, daysUntil } from '../utils/helpers';

function ExamForm({ initial, subjects, onSave, onClose }) {
  const [form, setForm] = useState(initial
    ? { ...initial, exam_date: initial.exam_date?.split('T')[0] || '', exam_time: initial.exam_time?.substring(0,5) || '' }
    : { subject_id: '', subject_name: '', exam_date: '', exam_time: '10:00', location: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubjectChange = (e) => {
    const subId = e.target.value;
    const sub = subjects.find(s => String(s.id) === subId);
    setForm(f => ({ ...f, subject_id: subId, subject_name: sub ? sub.name : f.subject_name }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initial?.id) {
        const r = await api.put(`/exams/${initial.id}`, form);
        onSave(r.data.exam, 'update');
      } else {
        const r = await api.post('/exams', form);
        onSave(r.data.exam, 'create');
      }
      onClose();
    } catch (err) {
      showToast(err.userMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Link to Subject</label>
          <select className="input" value={form.subject_id} onChange={handleSubjectChange}>
            <option value="">Select subject (optional)</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Subject Name *</label>
          <input className="input" required placeholder="e.g. DBMS" value={form.subject_name}
            onChange={e => setForm(f => ({ ...f, subject_name: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Exam Date *</label>
          <input type="date" className="input" required value={form.exam_date}
            onChange={e => setForm(f => ({ ...f, exam_date: e.target.value }))} />
        </div>
        <div>
          <label className="label">Exam Time *</label>
          <input type="time" className="input" required value={form.exam_time}
            onChange={e => setForm(f => ({ ...f, exam_time: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="label">Location</label>
        <input className="input" placeholder="e.g. Block C, Hall 101" value={form.location}
          onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="input resize-none" rows={2} placeholder="Any additional notes…" value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Saving…' : initial?.id ? 'Update Exam' : 'Add Exam'}
        </button>
      </div>
    </form>
  );
}

function ExamCard({ exam, onEdit, onDelete }) {
  const days = daysUntil(exam.exam_date);
  const isPast = days < 0;
  const isToday = days === 0;
  const isSoon = days > 0 && days <= 3;

  let urgencyClass = 'border-gray-200';
  let urgencyBadge = null;
  if (isPast)  { urgencyClass = 'border-gray-200 opacity-60'; }
  if (isToday) { urgencyClass = 'border-red-400 bg-red-50'; urgencyBadge = <span className="badge bg-red-500 text-white">Today!</span>; }
  if (isSoon && !isToday) { urgencyClass = 'border-orange-400 bg-orange-50'; urgencyBadge = <span className="badge bg-orange-100 text-orange-700">In {days} day{days !== 1 ? 's' : ''}</span>; }

  return (
    <div className={`card border-2 ${urgencyClass} transition`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {/* Date block */}
          <div className={`w-14 rounded-xl text-center py-2 shrink-0 ${isPast ? 'bg-gray-100' : 'bg-blue-700 text-white'}`}>
            <div className={`text-xl font-black leading-none ${isPast ? 'text-gray-500' : 'text-white'}`}>
              {new Date(exam.exam_date).getDate()}
            </div>
            <div className={`text-xs font-medium uppercase ${isPast ? 'text-gray-400' : 'text-blue-200'}`}>
              {new Date(exam.exam_date).toLocaleString('en', { month: 'short' })}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 text-base">{exam.subject_name}</h3>
              {urgencyBadge}
              {isPast && <span className="badge bg-gray-100 text-gray-500">Past</span>}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatTime(exam.exam_time)}</span>
              {exam.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{exam.location}</span>}
            </div>
            {exam.notes && (
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <FileText className="w-3 h-3" /> {exam.notes}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!isPast && (
            <div className="text-right mr-3">
              <div className={`text-2xl font-black ${isToday ? 'text-red-500' : isSoon ? 'text-orange-600' : 'text-blue-700'}`}>{Math.abs(days)}</div>
              <div className="text-xs text-gray-400">{isPast ? 'days ago' : days === 0 ? 'today' : 'days left'}</div>
            </div>
          )}
          <button onClick={() => onEdit(exam)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => onDelete(exam)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}

export default function Datesheet() {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showPast, setShowPast] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([api.get('/exams'), api.get('/subjects')])
      .then(([eRes, sRes]) => {
        setExams(eRes.data.exams);
        setSubjects(sRes.data.subjects);
      }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = (exam, action) => {
    if (action === 'create') setExams(prev => [...prev, exam].sort((a,b) => new Date(a.exam_date) - new Date(b.exam_date)));
    else setExams(prev => prev.map(e => e.id === exam.id ? exam : e).sort((a,b) => new Date(a.exam_date) - new Date(b.exam_date)));
    showToast(action === 'create' ? 'Exam added to datesheet!' : 'Exam updated!', 'success');
    setEditing(null);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/exams/${deleting.id}`);
      setExams(prev => prev.filter(e => e.id !== deleting.id));
      showToast('Exam deleted.', 'success');
    } catch (err) { showToast(err.userMessage, 'error'); }
  };

  if (loading) return <div className="p-6"><LoadingSpinner text="Loading datesheet…" /></div>;

  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = exams.filter(e => new Date(e.exam_date) >= today);
  const past     = exams.filter(e => new Date(e.exam_date) <  today);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader
        title="Datesheet"
        subtitle={`${upcoming.length} upcoming exam${upcoming.length !== 1 ? 's' : ''}`}
        action={
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Exam
          </button>
        }
      />

      {exams.length === 0 ? (
        <EmptyState icon={Calendar} title="No exams added"
          description="Add your examination schedule to track upcoming exams and get study reminders."
          action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" />Add Exam</button>} />
      ) : (
        <div className="space-y-6">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Upcoming</h2>
              <div className="space-y-3">
                {upcoming.map(e => (
                  <ExamCard key={e.id} exam={e}
                    onEdit={ex => { setEditing(ex); setShowForm(true); }}
                    onDelete={setDeleting} />
                ))}
              </div>
            </div>
          )}

          {/* Past exams toggle */}
          {past.length > 0 && (
            <div>
              <button onClick={() => setShowPast(!showPast)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                {showPast ? 'Hide' : 'Show'} past exams ({past.length})
              </button>
              {showPast && (
                <div className="space-y-3 mt-3">
                  {past.map(e => (
                    <ExamCard key={e.id} exam={e}
                      onEdit={ex => { setEditing(ex); setShowForm(true); }}
                      onDelete={setDeleting} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditing(null); }}
        title={editing ? 'Edit Exam' : 'Add Exam to Datesheet'}>
        <ExamForm initial={editing} subjects={subjects} onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }} />
      </Modal>

      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete}
        title="Delete Exam" message={`Remove "${deleting?.subject_name}" from your datesheet?`} />
    </div>
  );
}
