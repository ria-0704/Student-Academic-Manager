import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, FileText, PenTool, Calendar, CheckCircle, Clock,
  TrendingUp, Plus, ArrowRight, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ProgressBar from '../components/ProgressBar';
import { formatDate, formatTime, daysUntil, STATUS_CONFIG, DIFFICULTY_CONFIG, truncate } from '../utils/helpers';

function StatCard({ icon: Icon, label, value, color, sub }) {
  const colors = {
    blue:   'bg-blue-50   text-blue-600   border-blue-100',
    green:  'bg-green-50  text-green-600  border-green-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return <div className="p-6"><LoadingSpinner text="Loading dashboard…" /></div>;

  const exam = data?.upcoming_exam;
  const days = data?.days_remaining;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting()}, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Here's your academic overview for today</p>
        </div>
        <div className="text-right text-sm text-gray-400">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen}   label="Subjects"    value={data?.subject_count || 0}         color="blue" />
        <StatCard icon={FileText}   label="Materials"   value={data?.total_materials || 0}        color="green"
          sub={`${data?.completed_materials || 0} completed`} />
        <StatCard icon={TrendingUp} label="Completion"  value={`${data?.completion_percentage || 0}%`} color="yellow" />
        <StatCard icon={PenTool}    label="Mock Attempts" value={data?.recent_attempts?.length || 0} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Material Completion */}
          {(data?.total_materials || 0) > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">Overall Study Progress</h2>
                <span className="text-sm text-gray-500">{data.completed_materials}/{data.total_materials} materials</span>
              </div>
              <ProgressBar
                value={data.completed_materials}
                max={data.total_materials}
                color={data.completion_percentage >= 75 ? 'green' : data.completion_percentage >= 40 ? 'yellow' : 'blue'}
                height="h-3"
                showLabel={false}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                <span>{data.completed_materials} completed</span>
                <span>{data.completion_percentage}%</span>
              </div>
            </div>
          )}

          {/* Incomplete Materials */}
          {data?.incomplete_materials?.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">Pending Study Material</h2>
                <button onClick={() => navigate('/subjects')} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-2">
                {data.incomplete_materials.map(m => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{truncate(m.title, 50)}</p>
                      <p className="text-xs text-gray-400">{m.subject_name}</p>
                    </div>
                    <span className={`badge ${STATUS_CONFIG[m.study_status]?.color}`}>
                      {STATUS_CONFIG[m.study_status]?.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Attempts */}
          {data?.recent_attempts?.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">Recent Mock Attempts</h2>
                <button onClick={() => navigate('/attempts')} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-2">
                {data.recent_attempts.map(a => {
                  const pct = a.max_marks > 0 ? Math.round((a.score / a.max_marks) * 100) : 0;
                  return (
                    <div key={a.id} onClick={() => navigate(`/attempts/${a.id}`)}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 cursor-pointer transition border border-transparent hover:border-gray-200">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{truncate(a.question_text, 60)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{a.subject_name} · {DIFFICULTY_CONFIG[a.difficulty]?.label}</p>
                      </div>
                      {a.score !== null && (
                        <div className="text-right ml-3">
                          <div className={`font-bold text-sm ${pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {a.score}/{a.max_marks}
                          </div>
                          <div className="text-xs text-gray-400">{pct}%</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!data?.subject_count && (
            <div className="card text-center py-10">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-700 mb-1">Welcome to Academic Manager!</h3>
              <p className="text-sm text-gray-500 mb-4">Start by adding your subjects to organize your study material.</p>
              <button onClick={() => navigate('/subjects')} className="btn-primary mx-auto">
                <Plus className="w-4 h-4" /> Add Your First Subject
              </button>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Upcoming Exam */}
          {exam ? (
            <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl p-5 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-blue-300" />
                <span className="text-blue-200 text-xs font-medium uppercase tracking-wide">Upcoming Exam</span>
              </div>
              <h3 className="font-bold text-lg leading-tight mb-1">{exam.subject_name}</h3>
              <p className="text-blue-200 text-sm mb-3">{formatDate(exam.exam_date)} · {formatTime(exam.exam_time)}</p>
              {exam.location && <p className="text-blue-300 text-xs mb-3">📍 {exam.location}</p>}
              <div className="bg-white/20 rounded-lg px-4 py-3 text-center">
                <div className="text-3xl font-black">{days}</div>
                <div className="text-blue-200 text-xs">{days === 1 ? 'day remaining' : 'days remaining'}</div>
              </div>
            </div>
          ) : (
            <div className="card text-center">
              <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-3">No upcoming exams</p>
              <button onClick={() => navigate('/datesheet')} className="btn-secondary text-xs">
                <Plus className="w-3 h-3" /> Add Exam
              </button>
            </div>
          )}

          {/* Today's Tasks */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Today's Tasks</h2>
              <button onClick={() => navigate('/planner')} className="text-xs text-blue-600 hover:underline">
                View planner
              </button>
            </div>
            {data?.today_tasks?.length > 0 ? (
              <div className="space-y-2">
                {data.today_tasks.map(t => (
                  <div key={t.id} className="flex items-start gap-2 py-1.5">
                    <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-800">{t.title}</p>
                      {t.subject_name && <p className="text-xs text-gray-400">{t.subject_name}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-2">No tasks for today</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Add Subject',      icon: BookOpen,  to: '/subjects',  color: 'bg-blue-50   text-blue-700  hover:bg-blue-100' },
                { label: 'Upload Material',  icon: FileText,  to: '/subjects',  color: 'bg-green-50  text-green-700 hover:bg-green-100' },
                { label: 'Practice Mock',    icon: PenTool,   to: '/mock',      color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
                { label: 'Add Exam',         icon: Calendar,  to: '/datesheet', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
              ].map(({ label, icon: Icon, to, color }) => (
                <button key={label} onClick={() => navigate(to)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-medium transition ${color}`}>
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
