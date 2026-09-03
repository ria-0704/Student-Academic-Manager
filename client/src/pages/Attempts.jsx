import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Filter, Search, ChevronRight } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import { formatDateShort, DIFFICULTY_CONFIG, QUESTION_TYPE_LABELS, truncate, getScoreColor } from '../utils/helpers';

export default function Attempts() {
  const [attempts, setAttempts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/attempts').then(r => {
      setAttempts(r.data.attempts);
      setFiltered(r.data.attempts);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let list = [...attempts];
    if (search) list = list.filter(a => a.question_text?.toLowerCase().includes(search.toLowerCase()) || a.subject_name?.toLowerCase().includes(search.toLowerCase()));
    if (filterSubject) list = list.filter(a => a.subject_name === filterSubject);
    setFiltered(list);
  }, [search, filterSubject, attempts]);

  const subjects = [...new Set(attempts.map(a => a.subject_name).filter(Boolean))];

  if (loading) return <div className="p-6"><LoadingSpinner text="Loading attempts…" /></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Mock Attempt History"
        subtitle={`${attempts.length} total attempt${attempts.length !== 1 ? 's' : ''}`}
        action={
          <button onClick={() => navigate('/mock')} className="btn-primary">
            Practice Mock
          </button>
        }
      />

      {/* Filters */}
      {attempts.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9" placeholder="Search questions…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-auto" value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      )}

      {attempts.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No attempts yet"
          description="Complete a mock practice session to see your attempt history here."
          action={<button onClick={() => navigate('/mock')} className="btn-primary">Start Mock Practice</button>} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No attempts match your search.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const pct = a.max_marks > 0 ? Math.round((a.score / a.max_marks) * 100) : 0;
            return (
              <div key={a.id}
                onClick={() => navigate(`/attempts/${a.id}`)}
                className="card hover:shadow-md cursor-pointer transition group">
                <div className="flex items-start gap-4">
                  {/* Score */}
                  <div className={`text-center w-16 shrink-0 ${getScoreColor(pct)}`}>
                    <div className="text-2xl font-black">{a.score ?? '—'}</div>
                    <div className="text-xs text-gray-400">/{a.max_marks}</div>
                    {a.score !== null && <div className="text-xs font-medium">{pct}%</div>}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition leading-snug">
                      {truncate(a.question_text, 100)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="badge bg-blue-100 text-blue-700">{a.subject_name}</span>
                      {a.unit_title && <span className="badge bg-gray-100 text-gray-600">Unit {a.unit_number}: {a.unit_title}</span>}
                      <span className={`badge ${DIFFICULTY_CONFIG[a.difficulty]?.color}`}>{DIFFICULTY_CONFIG[a.difficulty]?.label}</span>
                      <span className="badge bg-gray-100 text-gray-600">{QUESTION_TYPE_LABELS[a.question_type]}</span>
                      <span className="text-xs text-gray-400">{formatDateShort(a.created_at)}</span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition shrink-0 mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
