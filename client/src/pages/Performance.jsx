import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import { TrendingUp, Award, Target, Activity } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import { formatDateShort, getScoreColor } from '../utils/helpers';

function StatTile({ icon: Icon, label, value, sub, color }) {
  const colors = {
    blue:   'bg-blue-50   text-blue-600',
    green:  'bg-green-50  text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="card text-center">
      <div className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-3xl font-black text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

const SUBJECT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function Performance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/performance').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6"><LoadingSpinner text="Loading performance…" /></div>;

  if (!data || data.total_attempts === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <PageHeader title="Performance" subtitle="Your mock attempt analytics" />
        <EmptyState icon={TrendingUp}
          title="No data yet"
          description="Complete some mock practice sessions to see your performance analytics here."
          action={<a href="/mock" className="btn-primary">Start Mock Practice</a>} />
      </div>
    );
  }

  // Prepare time-series data
  const timeData = data.over_time.map((a, i) => ({
    label: formatDateShort(a.created_at),
    score: parseFloat(a.pct),
    subject: a.subject_name,
    attempt: i + 1,
  }));

  // Subject chart data
  const subjectData = data.by_subject.map(s => ({
    name: s.subject_name?.length > 12 ? s.subject_name.substring(0, 12) + '…' : s.subject_name,
    fullName: s.subject_name,
    avg: s.avg_pct,
    best: s.best_pct,
    attempts: s.attempts,
  }));

  // Difficulty chart data
  const difficultyData = data.by_difficulty.map(d => ({
    name: d.difficulty.charAt(0).toUpperCase() + d.difficulty.slice(1),
    avg: d.avg_pct,
    attempts: d.attempts,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
        <div className="font-semibold text-gray-700 mb-1">{payload[0]?.payload?.fullName || label}</div>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span style={{ color: p.color }}>●</span>
            <span className="text-gray-600">{p.name}: </span>
            <span className="font-bold">{p.value}%</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <PageHeader title="Performance" subtitle={`Based on ${data.total_attempts} mock attempt${data.total_attempts !== 1 ? 's' : ''}`} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile icon={Activity} label="Total Attempts" value={data.total_attempts}     color="blue" />
        <StatTile icon={Target}   label="Average Score"  value={`${data.avg_percentage}%`} color="yellow"
          sub="across all attempts" />
        <StatTile icon={Award}    label="Best Score"     value={`${data.best_percentage}%`} color="green" />
        <StatTile icon={TrendingUp} label="Subjects Practiced" value={data.by_subject.length} color="purple" />
      </div>

      {/* Score over time */}
      {timeData.length > 1 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Score Over Time</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={timeData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2.5}
                dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} name="Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Performance by subject */}
      {subjectData.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Performance by Subject</h2>
          <ResponsiveContainer width="100%" height={Math.max(200, subjectData.length * 55)}>
            <BarChart data={subjectData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey="avg" name="Avg Score" radius={[0,4,4,0]}>
                {subjectData.map((_, i) => <Cell key={i} fill={SUBJECT_COLORS[i % SUBJECT_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Subject table */}
          <div className="mt-4 divide-y divide-gray-100">
            {data.by_subject.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm font-medium text-gray-800">{s.subject_name}</span>
                  <span className="text-xs text-gray-400 ml-2">{s.attempts} attempt{s.attempts !== 1 ? 's' : ''}</span>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${s.avg_pct >= 75 ? 'text-green-600' : s.avg_pct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {s.avg_pct}% avg
                  </span>
                  <span className="text-xs text-gray-400 ml-2">Best: {s.best_pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* By difficulty */}
      {difficultyData.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Performance by Difficulty</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={difficultyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avg" name="Avg Score" radius={[4,4,0,0]}>
                <Cell fill="#10b981" />
                <Cell fill="#f59e0b" />
                <Cell fill="#ef4444" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
