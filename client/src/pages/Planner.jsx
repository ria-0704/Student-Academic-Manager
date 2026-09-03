import React, { useEffect, useState } from 'react';
import { ClipboardList, Plus, Trash2, Check, Sparkles, Loader2, Calendar, Clock } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import PageHeader from '../components/PageHeader';
import { formatDate, PRIORITY_CONFIG } from '../utils/helpers';

function TaskForm({ onSave, onClose }) {
  const [form, setForm] = useState({ title: '', subject_name: '', unit_name: '', task_date: '', estimated_duration: 60, priority: 'medium' });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.post('/planner', form);
      onSave(r.data.task);
      onClose();
    } catch (err) {
      showToast(err.userMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Task *</label>
        <input className="input" required placeholder="e.g. Revise Unit 3 - Normalization" value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Subject</label>
          <input className="input" placeholder="e.g. DBMS" value={form.subject_name}
            onChange={e => setForm(f => ({ ...f, subject_name: e.target.value }))} />
        </div>
        <div>
          <label className="label">Unit</label>
          <input className="input" placeholder="e.g. Unit 3" value={form.unit_name}
            onChange={e => setForm(f => ({ ...f, unit_name: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={form.task_date}
            onChange={e => setForm(f => ({ ...f, task_date: e.target.value }))} />
        </div>
        <div>
          <label className="label">Duration (minutes)</label>
          <input type="number" className="input" min="15" step="15" value={form.estimated_duration}
            onChange={e => setForm(f => ({ ...f, estimated_duration: Number(e.target.value) }))} />
        </div>
      </div>
      <div>
        <label className="label">Priority</label>
        <div className="flex gap-2">
          {['high', 'medium', 'low'].map(p => (
            <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority: p }))}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition capitalize ${form.priority === p ? `${PRIORITY_CONFIG[p]?.color} border-current` : 'border-gray-200'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Adding…' : 'Add Task'}</button>
      </div>
    </form>
  );
}

function TaskCard({ task, onToggle, onDelete }) {
  return (
    <div className={`card flex items-start gap-3 transition ${task.is_completed ? 'opacity-60' : ''}`}>
      <button onClick={() => onToggle(task)}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition ${task.is_completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400'}`}>
        {task.is_completed && <Check className="w-3.5 h-3.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {task.title}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {(task.subject_name || task.subject_name_resolved) && (
            <span className="badge bg-blue-100 text-blue-700">{task.subject_name || task.subject_name_resolved}</span>
          )}
          {(task.unit_name || task.unit_name_resolved) && (
            <span className="badge bg-gray-100 text-gray-600">{task.unit_name || task.unit_name_resolved}</span>
          )}
          <span className={`badge ${PRIORITY_CONFIG[task.priority]?.color}`}>{PRIORITY_CONFIG[task.priority]?.label}</span>
          {task.task_date && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formatDate(task.task_date)}
            </span>
          )}
          {task.estimated_duration && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {task.estimated_duration} min
            </span>
          )}
        </div>
      </div>

      <button onClick={() => onDelete(task)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 shrink-0">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function Planner() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [filter, setFilter] = useState('all'); // all | today | pending | completed
  const { showToast } = useToast();

  useEffect(() => {
    api.get('/planner').then(r => setTasks(r.data.tasks)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleToggle = async (task) => {
    try {
      const r = await api.put(`/planner/${task.id}`, { is_completed: !task.is_completed });
      setTasks(prev => prev.map(t => t.id === task.id ? r.data.task : t));
    } catch (err) { showToast(err.userMessage, 'error'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/planner/${deleting.id}`);
      setTasks(prev => prev.filter(t => t.id !== deleting.id));
      showToast('Task deleted.', 'success');
    } catch (err) { showToast(err.userMessage, 'error'); }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const r = await api.post('/planner/generate');
      setTasks(prev => [...r.data.tasks, ...prev]);
      showToast(`${r.data.tasks.length} study tasks generated by AI!`, 'success');
    } catch (err) {
      showToast(err.userMessage, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const filteredTasks = tasks.filter(t => {
    if (filter === 'today')     return !t.is_completed && (t.task_date === today || !t.task_date);
    if (filter === 'pending')   return !t.is_completed;
    if (filter === 'completed') return t.is_completed;
    return true;
  });

  const pending   = tasks.filter(t => !t.is_completed).length;
  const completed = tasks.filter(t =>  t.is_completed).length;

  if (loading) return <div className="p-6"><LoadingSpinner text="Loading planner…" /></div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader
        title="Study Planner"
        subtitle={`${pending} task${pending !== 1 ? 's' : ''} pending`}
        action={
          <div className="flex gap-2">
            <button onClick={handleGenerate} disabled={generating} className="btn-secondary">
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4" /> AI Plan</>}
            </button>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>
        }
      />

      {/* Progress */}
      {tasks.length > 0 && (
        <div className="card mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">{completed} of {tasks.length} tasks completed</span>
            <span className="text-sm font-semibold text-blue-700">{tasks.length > 0 ? Math.round(completed/tasks.length*100) : 0}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="h-2 rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${tasks.length > 0 ? (completed/tasks.length)*100 : 0}%` }} />
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5">
        {[
          { value: 'all',       label: `All (${tasks.length})` },
          { value: 'today',     label: 'Today'                 },
          { value: 'pending',   label: `Pending (${pending})`  },
          { value: 'completed', label: `Done (${completed})`   },
        ].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${filter === f.value ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* AI hint */}
      {tasks.length === 0 && (
        <div className="card bg-purple-50 border-purple-200 mb-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-purple-800">Let AI plan your study</p>
              <p className="text-xs text-purple-600 mt-0.5">Click "AI Plan" to automatically generate study tasks based on your upcoming exams, incomplete materials, and mock performance.</p>
            </div>
          </div>
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <EmptyState icon={ClipboardList}
          title={filter === 'completed' ? 'No completed tasks' : 'No tasks'}
          description={filter === 'all' ? 'Add tasks manually or use AI to generate a study plan.' : 'Try a different filter.'}
          action={filter === 'all' ? <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" />Add Task</button> : null} />
      ) : (
        <div className="space-y-3">
          {/* Group by priority */}
          {['high', 'medium', 'low'].map(priority => {
            const group = filteredTasks.filter(t => t.priority === priority);
            if (group.length === 0) return null;
            return (
              <div key={priority}>
                <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${PRIORITY_CONFIG[priority]?.color.split(' ')[1]}`}>
                  {PRIORITY_CONFIG[priority]?.label} Priority
                </div>
                {group.map(t => (
                  <div key={t.id} className="mb-2">
                    <TaskCard task={t} onToggle={handleToggle} onDelete={setDeleting} />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add Study Task">
        <TaskForm onSave={(task) => setTasks(prev => [task, ...prev])} onClose={() => setShowForm(false)} />
      </Modal>

      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete}
        title="Delete Task" message={`Delete "${deleting?.title}"?`} />
    </div>
  );
}
