import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft, CheckCircle2, XCircle, AlertCircle, Lightbulb,
  BookOpen, Star, TrendingUp, PenTool, Award, BarChart2
} from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate, DIFFICULTY_CONFIG, QUESTION_TYPE_LABELS, getScoreColor } from '../utils/helpers';

function ScoreRing({ score, max }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 75 ? '#16a34a' : pct >= 50 ? '#ca8a04' : '#dc2626';

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black" style={{ color }}>{score}</span>
        <span className="text-gray-400 text-sm">/ {max}</span>
      </div>
    </div>
  );
}

function BreakdownBar({ label, value, max = 10 }) {
  const pct = (value / max) * 100;
  const color = pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-44 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-10 text-right">{value}/10</span>
    </div>
  );
}

function FeedbackSection({ icon: Icon, title, content, color }) {
  if (!content || content.toLowerCase() === 'none') return null;
  const bg = { green: 'bg-green-50 border-green-200', red: 'bg-red-50 border-red-200', yellow: 'bg-yellow-50 border-yellow-200', blue: 'bg-blue-50 border-blue-200' };
  const ic = { green: 'text-green-600', red: 'text-red-600', yellow: 'text-yellow-600', blue: 'text-blue-600' };
  return (
    <div className={`rounded-xl border p-4 ${bg[color]}`}>
      <div className={`flex items-center gap-2 font-semibold text-sm mb-2 uppercase tracking-wide ${ic[color]}`}>
        <Icon className="w-4 h-4" /> {title}
      </div>
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{content}</p>
    </div>
  );
}

export default function AttemptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Prefer fresh result from navigation state, but still fetch for direct URL access
    if (location.state?.result) {
      const r = location.state.result;
      // Merge into attempt shape
      setAttempt({
        id,
        question_text: r.question?.question_text,
        subject_name:  r.question?.subject_name,
        unit_title:    r.question?.unit_title,
        difficulty:    r.question?.difficulty,
        question_type: r.question?.question_type,
        marks:         r.max_marks,
        score:         r.score,
        max_marks:     r.max_marks,
        student_answer: r.student_answer || '',
        breakdown_conceptual:  r.evaluation?.breakdown?.conceptual_understanding,
        breakdown_accuracy:    r.evaluation?.breakdown?.accuracy,
        breakdown_completeness:r.evaluation?.breakdown?.completeness,
        breakdown_structure:   r.evaluation?.breakdown?.structure,
        breakdown_examples:    r.evaluation?.breakdown?.examples,
        strengths:             r.evaluation?.strengths,
        missing_points:        r.evaluation?.missing_points,
        incorrect_points:      r.evaluation?.incorrect_points,
        improvement_suggestions: r.evaluation?.improvement_suggestions,
        model_answer:          r.evaluation?.model_answer,
        created_at:            new Date().toISOString(),
      });
      setLoading(false);
    } else {
      api.get(`/attempts/${id}`)
        .then(r => setAttempt(r.data.attempt))
        .catch(() => navigate('/attempts'))
        .finally(() => setLoading(false));
    }
  }, [id, location.state, navigate]);

  if (loading) return <div className="p-6"><LoadingSpinner text="Loading evaluation…" /></div>;
  if (!attempt) return null;

  const pct = attempt.max_marks > 0 ? Math.round((attempt.score / attempt.max_marks) * 100) : 0;
  const grade = pct >= 90 ? 'Excellent' : pct >= 75 ? 'Good' : pct >= 60 ? 'Satisfactory' : pct >= 40 ? 'Needs Improvement' : 'Insufficient';
  const gradeColor = pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/attempts')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evaluation Result</h1>
          <p className="text-gray-500 text-sm">{formatDate(attempt.created_at)}</p>
        </div>
      </div>

      {/* Score card */}
      <div className="card bg-gradient-to-br from-slate-50 to-blue-50 border-blue-100">
        <div className="text-center">
          <div className="flex flex-wrap justify-center gap-2 mb-5">
            <span className="badge bg-blue-100 text-blue-700">{attempt.subject_name}</span>
            {attempt.unit_title && <span className="badge bg-gray-100 text-gray-600">{attempt.unit_title}</span>}
            <span className={`badge ${DIFFICULTY_CONFIG[attempt.difficulty]?.color}`}>{DIFFICULTY_CONFIG[attempt.difficulty]?.label}</span>
            <span className="badge bg-gray-100 text-gray-600">{QUESTION_TYPE_LABELS[attempt.question_type]}</span>
          </div>

          <ScoreRing score={attempt.score} max={attempt.max_marks} />

          <div className={`text-xl font-bold mt-3 ${gradeColor}`}>{grade}</div>
          <div className="text-gray-500 text-sm mt-1">
            {pct}% · {attempt.score} out of {attempt.max_marks} marks
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      {attempt.breakdown_conceptual !== null && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-blue-600" /> Score Breakdown
          </h2>
          <div className="space-y-3">
            <BreakdownBar label="Conceptual Understanding" value={attempt.breakdown_conceptual} />
            <BreakdownBar label="Accuracy"                 value={attempt.breakdown_accuracy}    />
            <BreakdownBar label="Completeness"             value={attempt.breakdown_completeness}/>
            <BreakdownBar label="Structure"                value={attempt.breakdown_structure}   />
            <BreakdownBar label="Use of Examples"          value={attempt.breakdown_examples}    />
          </div>
        </div>
      )}

      {/* AI Feedback */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-600" /> Detailed Feedback
        </h2>
        <FeedbackSection icon={CheckCircle2} title="What You Did Well"    content={attempt.strengths}             color="green"  />
        <FeedbackSection icon={AlertCircle}  title="What You Missed"      content={attempt.missing_points}        color="yellow" />
        <FeedbackSection icon={XCircle}      title="Incorrect Points"     content={attempt.incorrect_points}      color="red"    />
        <FeedbackSection icon={Lightbulb}    title="How to Improve"       content={attempt.improvement_suggestions} color="blue" />
      </div>

      {/* Your Answer */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
          <PenTool className="w-5 h-5 text-gray-600" /> Your Answer
        </h2>
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-200">
          {attempt.student_answer || <span className="text-gray-400 italic">Not available</span>}
        </div>
      </div>

      {/* Model Answer */}
      {attempt.model_answer && (
        <div className="card border-green-200">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-green-600" /> Model Answer
          </h2>
          <p className="text-xs text-gray-400 mb-3">
            This is an ideal {attempt.max_marks}-mark answer. Use it to understand what a complete answer looks like.
          </p>
          <div className="bg-green-50 rounded-xl p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap border border-green-200">
            {attempt.model_answer}
          </div>
        </div>
      )}

      {/* Question for reference */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-2">Question</div>
        <p className="text-gray-800 text-sm leading-relaxed">{attempt.question_text}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => navigate('/attempts')} className="btn-secondary flex-1">View All Attempts</button>
        <button onClick={() => navigate('/mock')} className="btn-primary flex-1">
          <PenTool className="w-4 h-4" /> Practice Again
        </button>
      </div>
    </div>
  );
}
