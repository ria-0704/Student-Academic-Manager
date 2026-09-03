import React, { useState } from 'react';
import { FileText, Download, Trash2, Edit2, Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatDate, formatFileSize, STATUS_CONFIG, FILE_TYPE_CONFIG } from '../utils/helpers';
import Modal from './Modal';

const SUMMARY_TYPES = [
  { value: 'quick_revision',  label: 'Quick Revision'    },
  { value: 'detailed',        label: 'Detailed Summary'  },
  { value: 'exam_oriented',   label: 'Exam-Oriented Notes' },
  { value: 'simple',          label: 'Simple Explanation' },
];

function SummaryPanel({ material, onClose }) {
  const [type, setType]         = useState('exam_oriented');
  const [loading, setLoading]   = useState(false);
  const [summary, setSummary]   = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const { showToast } = useToast();

  const generate = async (regenerate = false) => {
    setLoading(true);
    setSummary(null);
    try {
      const r = await api.post(`/summaries/${material.id}/generate`, { summary_type: type, regenerate });
      setSummary(r.data.summary);
      setFromCache(r.data.fromCache);
      if (!r.data.fromCache) showToast('Summary generated!', 'success');
    } catch (err) {
      showToast(err.userMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Summary Type</label>
        <div className="grid grid-cols-2 gap-2">
          {SUMMARY_TYPES.map(t => (
            <button key={t.value} onClick={() => { setType(t.value); setSummary(null); }}
              className={`py-2 px-3 rounded-lg text-sm border transition ${type === t.value ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {!summary && (
        <button onClick={() => generate(false)} disabled={loading} className="btn-primary w-full">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4" /> Generate Summary</>}
        </button>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 py-6 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-sm">Generating with AI… this may take a moment</span>
        </div>
      )}

      {summary && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">{fromCache ? 'Loaded from saved summary' : 'Freshly generated'}</span>
            <button onClick={() => generate(true)} disabled={loading} className="text-xs text-blue-600 hover:underline">
              Regenerate
            </button>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto border border-gray-200">
            {summary.content}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MaterialCard({ material, units = [], onUpdate, onDelete }) {
  const [showSummary, setShowSummary] = useState(false);
  const [editTitle,   setEditTitle]   = useState(false);
  const [newTitle,    setNewTitle]    = useState(material.title);
  const [savingTitle, setSavingTitle] = useState(false);
  const { showToast } = useToast();

  const fileConf = FILE_TYPE_CONFIG[material.file_type] || { color: 'text-gray-500', bg: 'bg-gray-50' };

  const changeStatus = async (status) => {
    try {
      const r = await api.put(`/materials/${material.id}`, { study_status: status });
      onUpdate(r.data.material);
    } catch (err) {
      showToast(err.userMessage, 'error');
    }
  };

  const saveTitle = async () => {
    if (!newTitle.trim() || newTitle.trim() === material.title) { setEditTitle(false); return; }
    setSavingTitle(true);
    try {
      const r = await api.put(`/materials/${material.id}`, { title: newTitle.trim() });
      onUpdate(r.data.material);
      showToast('Title updated.', 'success');
    } catch (err) {
      showToast(err.userMessage, 'error');
    } finally {
      setSavingTitle(false);
      setEditTitle(false);
    }
  };

  const handleDownload = () => {
    const token = localStorage.getItem('token');
    window.open(`/api/materials/${material.id}/download?token=${token}`, '_blank');
  };

  return (
    <div className="card hover:shadow-md transition">
      <div className="flex items-start gap-3">
        {/* File icon */}
        <div className={`w-10 h-10 rounded-xl ${fileConf.bg} flex items-center justify-center shrink-0`}>
          <FileText className={`w-5 h-5 ${fileConf.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          {editTitle ? (
            <div className="flex gap-2 mb-1">
              <input className="input text-sm py-1" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveTitle()} autoFocus />
              <button onClick={saveTitle} disabled={savingTitle} className="btn-primary text-xs px-3 py-1">Save</button>
              <button onClick={() => setEditTitle(false)} className="btn-secondary text-xs px-3 py-1">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-1 mb-1">
              <h4 className="font-medium text-gray-900 text-sm truncate">{material.title}</h4>
              <button onClick={() => setEditTitle(true)} className="p-1 text-gray-400 hover:text-gray-600 rounded shrink-0">
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center flex-wrap gap-2 text-xs text-gray-400">
            <span className="uppercase font-medium text-gray-500">{material.file_type}</span>
            <span>·</span>
            <span>{formatFileSize(material.file_size)}</span>
            <span>·</span>
            <span>{formatDate(material.created_at)}</span>
            {material.unit_title && <><span>·</span><span className="text-blue-600">{material.unit_title}</span></>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Status selector */}
          <select value={material.study_status} onChange={e => changeStatus(e.target.value)}
            className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${STATUS_CONFIG[material.study_status]?.color}`}>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <button onClick={() => setShowSummary(!showSummary)} title="Summarize"
            className={`p-1.5 rounded-lg transition ${showSummary ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100 text-gray-400'}`}>
            <Sparkles className="w-4 h-4" />
          </button>
          <button onClick={handleDownload} title="View / Download"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={onDelete} title="Delete"
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary panel */}
      {showSummary && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h4 className="font-medium text-gray-800 text-sm">AI Summary — {material.title}</h4>
          </div>
          <SummaryPanel material={material} />
        </div>
      )}
    </div>
  );
}
