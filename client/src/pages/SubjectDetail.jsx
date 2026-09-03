import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen, Plus, Edit2, Trash2, ChevronLeft, FileText, PenTool,
  Upload, ArrowRight, GripVertical
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ProgressBar from '../components/ProgressBar';
import EmptyState from '../components/EmptyState';
import MaterialCard from '../components/MaterialCard';
import { formatDateShort, DIFFICULTY_CONFIG, truncate } from '../utils/helpers';

function UnitForm({ initial, subjectId, onSave, onClose }) {
  const [form, setForm] = useState(initial || { unit_number: '', title: '', description: '' });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initial?.id) {
        const r = await api.put(`/units/${initial.id}`, form);
        onSave(r.data.unit, 'update');
      } else {
        const r = await api.post('/units', { ...form, subject_id: subjectId });
        onSave(r.data.unit, 'create');
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
          <label className="label">Unit Number *</label>
          <input type="number" className="input" min="1" required value={form.unit_number}
            onChange={e => setForm(f => ({ ...f, unit_number: e.target.value }))} />
        </div>
        <div>
          <label className="label">Unit Title *</label>
          <input className="input" placeholder="e.g. Introduction to DBMS" required value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input resize-none" rows={2} value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Saving…' : initial?.id ? 'Update Unit' : 'Add Unit'}
        </button>
      </div>
    </form>
  );
}

export default function SubjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [subject,  setSubject]  = useState(null);
  const [units,    setUnits]    = useState([]);
  const [materials,setMaterials]= useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const [showUnitForm,   setShowUnitForm]   = useState(false);
  const [editingUnit,    setEditingUnit]    = useState(null);
  const [deletingUnit,   setDeletingUnit]   = useState(null);
  const [showUpload,     setShowUpload]     = useState(false);
  const [deletingMat,    setDeletingMat]    = useState(null);
  const [activeTab,      setActiveTab]      = useState('syllabus');

  const load = useCallback(async () => {
    try {
      const r = await api.get(`/subjects/${id}`);
      setSubject(r.data.subject);
      setUnits(r.data.units);
      setMaterials(r.data.materials);
      setAttempts(r.data.recentAttempts);
    } catch {
      navigate('/subjects');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const handleUnitSave = (unit, action) => {
    if (action === 'create') setUnits(prev => [...prev, unit].sort((a,b) => a.unit_number - b.unit_number));
    else setUnits(prev => prev.map(u => u.id === unit.id ? unit : u).sort((a,b) => a.unit_number - b.unit_number));
    showToast(action === 'create' ? 'Unit added!' : 'Unit updated!', 'success');
    setEditingUnit(null);
  };

  const handleDeleteUnit = async () => {
    try {
      await api.delete(`/units/${deletingUnit.id}`);
      setUnits(prev => prev.filter(u => u.id !== deletingUnit.id));
      showToast('Unit deleted.', 'success');
    } catch (err) { showToast(err.userMessage, 'error'); }
  };

  const handleMaterialUpdate = (updated) => {
    setMaterials(prev => prev.map(m => m.id === updated.id ? updated : m));
  };

  const handleMaterialDelete = async () => {
    try {
      await api.delete(`/materials/${deletingMat.id}`);
      setMaterials(prev => prev.filter(m => m.id !== deletingMat.id));
      showToast('Material deleted.', 'success');
    } catch (err) { showToast(err.userMessage, 'error'); }
  };

  if (loading) return <div className="p-6"><LoadingSpinner text="Loading subject…" /></div>;
  if (!subject) return null;

  const total     = materials.length;
  const completed = materials.filter(m => m.study_status === 'completed').length;

  const tabs = ['syllabus', 'materials', 'attempts'];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/subjects')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{subject.name}</h1>
            {subject.code && <span className="badge bg-blue-100 text-blue-700">{subject.code}</span>}
          </div>
          {subject.description && <p className="text-gray-500 text-sm mt-0.5">{subject.description}</p>}
        </div>
        <button onClick={() => navigate(`/mock?subject=${id}`)} className="btn-primary">
          <PenTool className="w-4 h-4" /> Practice Mock
        </button>
      </div>

      {/* Progress */}
      {total > 0 && (
        <div className="card mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Material Completion</span>
            <span className="text-sm text-gray-500">{completed}/{total} completed</span>
          </div>
          <ProgressBar value={completed} max={total} color={completed/total >= 0.75 ? 'green' : 'blue'} height="h-2" showLabel={false} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${activeTab === t ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'syllabus' ? 'Syllabus & Units' : t === 'materials' ? `Materials (${total})` : `Attempts (${attempts.length})`}
          </button>
        ))}
      </div>

      {/* Syllabus Tab */}
      {activeTab === 'syllabus' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Units</h2>
            <button onClick={() => { setEditingUnit(null); setShowUnitForm(true); }} className="btn-secondary text-sm">
              <Plus className="w-4 h-4" /> Add Unit
            </button>
          </div>
          {units.length === 0 ? (
            <EmptyState icon={BookOpen} title="No units added"
              description="Break down your subject into units to organize your study."
              action={<button onClick={() => setShowUnitForm(true)} className="btn-primary"><Plus className="w-4 h-4" />Add Unit</button>} />
          ) : (
            <div className="space-y-2">
              {units.map(u => (
                <div key={u.id} className="card flex items-start gap-3 hover:shadow-md transition">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {u.unit_number}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{u.title}</p>
                    {u.description && <p className="text-sm text-gray-500 mt-0.5">{u.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingUnit(u); setShowUnitForm(true); }}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeletingUnit(u)}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Materials Tab */}
      {activeTab === 'materials' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Study Materials</h2>
            <button onClick={() => setShowUpload(true)} className="btn-primary text-sm">
              <Upload className="w-4 h-4" /> Upload
            </button>
          </div>
          {materials.length === 0 ? (
            <EmptyState icon={FileText} title="No materials uploaded"
              description="Upload PDFs and PPTs to keep all your study material in one place."
              action={<button onClick={() => setShowUpload(true)} className="btn-primary"><Upload className="w-4 h-4" />Upload Material</button>} />
          ) : (
            <div className="space-y-3">
              {materials.map(m => (
                <MaterialCard key={m.id} material={m} units={units}
                  onUpdate={handleMaterialUpdate}
                  onDelete={() => setDeletingMat(m)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attempts Tab */}
      {activeTab === 'attempts' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Recent Mock Attempts</h2>
            <button onClick={() => navigate(`/mock?subject=${id}`)} className="btn-primary text-sm">
              <PenTool className="w-4 h-4" /> New Practice
            </button>
          </div>
          {attempts.length === 0 ? (
            <EmptyState icon={PenTool} title="No attempts yet"
              description="Practice mock questions for this subject to test your knowledge."
              action={<button onClick={() => navigate(`/mock?subject=${id}`)} className="btn-primary"><PenTool className="w-4 h-4" />Start Practicing</button>} />
          ) : (
            <div className="space-y-3">
              {attempts.map(a => {
                const pct = a.max_marks > 0 ? Math.round((a.score / a.max_marks) * 100) : 0;
                return (
                  <div key={a.id} onClick={() => navigate(`/attempts/${a.id}`)}
                    className="card hover:shadow-md cursor-pointer transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{truncate(a.question_text, 80)}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {a.unit_title && <span className="text-xs text-gray-500">Unit {a.unit_number}: {a.unit_title}</span>}
                          <span className={`badge ${DIFFICULTY_CONFIG[a.difficulty]?.color}`}>{DIFFICULTY_CONFIG[a.difficulty]?.label}</span>
                          <span className="text-xs text-gray-400">{formatDateShort(a.created_at)}</span>
                        </div>
                      </div>
                      {a.score !== null && (
                        <div className={`text-right ml-4 font-bold ${pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          <div className="text-lg">{a.score}/{a.marks}</div>
                          <div className="text-xs font-normal text-gray-400">{pct}%</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={showUnitForm} onClose={() => { setShowUnitForm(false); setEditingUnit(null); }}
        title={editingUnit ? 'Edit Unit' : 'Add Unit'}>
        <UnitForm initial={editingUnit} subjectId={id} onSave={handleUnitSave}
          onClose={() => { setShowUnitForm(false); setEditingUnit(null); }} />
      </Modal>

      <Modal isOpen={showUpload} onClose={() => { setShowUpload(false); load(); }} title="Upload Study Material" size="md">
        <UploadForm subjectId={id} units={units} onSuccess={(m) => { setMaterials(prev => [m, ...prev]); setShowUpload(false); showToast('Material uploaded!', 'success'); }} onClose={() => setShowUpload(false)} />
      </Modal>

      <ConfirmDialog isOpen={!!deletingUnit} onClose={() => setDeletingUnit(null)} onConfirm={handleDeleteUnit}
        title="Delete Unit" message={`Delete "Unit ${deletingUnit?.unit_number}: ${deletingUnit?.title}"?`} />

      <ConfirmDialog isOpen={!!deletingMat} onClose={() => setDeletingMat(null)} onConfirm={handleMaterialDelete}
        title="Delete Material" message={`Delete "${deletingMat?.title}"? This cannot be undone.`} />
    </div>
  );
}

// Upload form embedded
function UploadForm({ subjectId, units, onSuccess, onClose }) {
  const [form, setForm] = useState({ title: '', unit_id: '', subject_id: subjectId });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { showToast('Please select a file.', 'error'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('subject_id', subjectId);
      fd.append('title', form.title || file.name.replace(/\.[^.]+$/, ''));
      if (form.unit_id) fd.append('unit_id', form.unit_id);
      const r = await api.post('/materials', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSuccess(r.data.material);
    } catch (err) {
      showToast(err.userMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">File (PDF, PPT, PPTX) *</label>
        <input type="file" accept=".pdf,.ppt,.pptx" required className="input file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 file:text-sm"
          onChange={e => { setFile(e.target.files[0]); if (!form.title) setForm(f => ({ ...f, title: e.target.files[0]?.name?.replace(/\.[^.]+$/, '') || '' })); }} />
      </div>
      <div>
        <label className="label">Title</label>
        <input className="input" placeholder="Material title" value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      </div>
      {units.length > 0 && (
        <div>
          <label className="label">Unit (optional)</label>
          <select className="input" value={form.unit_id} onChange={e => setForm(f => ({ ...f, unit_id: e.target.value }))}>
            <option value="">No unit</option>
            {units.map(u => <option key={u.id} value={u.id}>Unit {u.unit_number}: {u.title}</option>)}
          </select>
        </div>
      )}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Uploading…' : 'Upload'}
        </button>
      </div>
    </form>
  );
}
