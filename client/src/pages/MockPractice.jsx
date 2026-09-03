import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PenTool, Sparkles, Send, Loader2, ChevronRight,
  BookOpen, BarChart2, Clock, HelpCircle, FileText
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { DIFFICULTY_CONFIG, QUESTION_TYPE_LABELS } from '../utils/helpers';

const STEPS = { SETUP: 'setup', QUESTION: 'question', WRITING: 'writing', EVALUATING: 'evaluating' };

const DIFFICULTY_OPTIONS = [
  { value: 'easy',   label: 'Easy',   desc: 'Basic conceptual questions', color: 'border-green-300  bg-green-50  text-green-700' },
  { value: 'medium', label: 'Medium', desc: 'Application & analysis',      color: 'border-yellow-300 bg-yellow-50 text-yellow-700' },
  { value: 'hard',   label: 'Hard',   desc: 'Advanced evaluation',         color: 'border-red-300    bg-red-50    text-red-700' },
];

const TYPE_OPTIONS = [
  { value: 'long_answer',  label: 'Long Answer',  desc: 'Detailed theoretical explanation' },
  { value: 'short_answer', label: 'Short Answer', desc: 'Concise but complete answer'       },
  { value: 'case_study',   label: 'Case Study',   desc: 'Scenario-based analysis'           },
];

const MARKS_OPTIONS = [2, 5, 10, 15];

export default function MockPractice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const [subjects, setSubjects] = useState([]);
  const [units,    setUnits]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [step,     setStep]     = useState(STEPS.SETUP);

  // Form state
  const [selectedSubject,    setSelectedSubject]    = useState('');
  const [selectedUnit,       setSelectedUnit]       = useState('');
  const [difficulty,         setDifficulty]         = useState('medium');
  const [questionType,       setQuestionType]       = useState('long_answer');
  const [marks,              setMarks]              = useState(10);
  const [generating,         setGenerating]         = useState(false);

  // Question & answer state
  const [question,           setQuestion]           = useState(null);
  const [answer,             setAnswer]             = useState('');
  const [wordCount,          setWordCount]          = useState(0);
  const [submitting,         setSubmitting]         = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    api.get('/subjects').then(r => {
      setSubjects(r.data.subjects);
      const preselect = searchParams.get('subject');
      if (preselect) setSelectedSubject(preselect);
    }).catch(console.error).finally(() => setLoading(false));
  }, [searchParams]);

  useEffect(() => {
    if (selectedSubject) {
      setSelectedUnit('');
      api.get(`/units?subject_id=${selectedSubject}`)
        .then(r => setUnits(r.data.units))
        .catch(() => setUnits([]));
    } else {
      setUnits([]);
      setSelectedUnit('');
    }
  }, [selectedSubject]);

  const handleAnswerChange = (e) => {
    const val = e.target.value;
    setAnswer(val);
    setWordCount(val.trim() ? val.trim().split(/\s+/).length : 0);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedSubject) { showToast('Please select a subject.', 'error'); return; }
    setGenerating(true);
    try {
      const r = await api.post('/mock/generate', {
        subject_id:    selectedSubject,
        unit_id:       selectedUnit || undefined,
        difficulty,
        question_type: questionType,
        marks,
      });
      setQuestion(r.data.question);
      setAnswer('');
      setWordCount(0);
      setStep(STEPS.QUESTION);
    } catch (err) {
      showToast(err.userMessage, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleStartWriting = () => {
    setStep(STEPS.WRITING);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleSubmit = async () => {
    if (!answer.trim() || answer.trim().length < 10) {
      showToast('Please write a meaningful answer before submitting.', 'error');
      return;
    }
    setStep(STEPS.EVALUATING);
    setSubmitting(true);
    try {
      const r = await api.post('/mock/submit', {
        question_id:    question.id,
        student_answer: answer.trim(),
      });
      // Navigate to attempt detail with full result
      navigate(`/attempts/${r.data.attempt_id}`, { state: { result: r.data } });
    } catch (err) {
      showToast(err.userMessage, 'error');
      setStep(STEPS.WRITING);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(STEPS.SETUP);
    setQuestion(null);
    setAnswer('');
    setWordCount(0);
  };

  if (loading) return <div className="p-6"><LoadingSpinner text="Loading subjects…" /></div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <PenTool className="w-4 h-4" />
          <span>Mock Practice</span>
          {step !== STEPS.SETUP && (
            <><ChevronRight className="w-3 h-3" /><span className="capitalize">{step === STEPS.EVALUATING ? 'Evaluating' : step}</span></>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Mock Practice</h1>
        <p className="text-gray-500 text-sm mt-1">Generate university-style theoretical questions and get AI evaluation</p>
      </div>

      {/* ── SETUP STEP ───────────────────────────────────────────────────────── */}
      {step === STEPS.SETUP && (
        <form onSubmit={handleGenerate} className="space-y-6">
          {subjects.length === 0 ? (
            <div className="card text-center py-10">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium mb-2">No subjects found</p>
              <p className="text-gray-400 text-sm mb-4">Add subjects first to start mock practice.</p>
              <button type="button" onClick={() => navigate('/subjects')} className="btn-primary mx-auto">
                Go to Subjects
              </button>
            </div>
          ) : (
            <>
              {/* Subject & Unit */}
              <div className="card space-y-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" /> Select Topic
                </h2>
                <div>
                  <label className="label">Subject *</label>
                  <select className="input" required value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                    <option value="">Choose a subject…</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ''}</option>)}
                  </select>
                </div>
                {units.length > 0 && (
                  <div>
                    <label className="label">Unit <span className="text-gray-400 font-normal">(optional — leave blank for entire subject)</span></label>
                    <select className="input" value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)}>
                      <option value="">Entire Subject</option>
                      {units.map(u => <option key={u.id} value={u.id}>Unit {u.unit_number}: {u.title}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Difficulty */}
              <div className="card">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <BarChart2 className="w-5 h-5 text-blue-600" /> Difficulty
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {DIFFICULTY_OPTIONS.map(d => (
                    <button key={d.value} type="button"
                      onClick={() => setDifficulty(d.value)}
                      className={`p-3 rounded-xl border-2 text-left transition ${difficulty === d.value ? d.color + ' border-current' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="font-semibold text-sm">{d.label}</div>
                      <div className="text-xs opacity-70 mt-0.5">{d.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Type */}
              <div className="card">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <HelpCircle className="w-5 h-5 text-blue-600" /> Question Type
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {TYPE_OPTIONS.map(t => (
                    <button key={t.value} type="button"
                      onClick={() => setQuestionType(t.value)}
                      className={`p-3 rounded-xl border-2 text-left transition ${questionType === t.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="font-semibold text-sm">{t.label}</div>
                      <div className="text-xs opacity-70 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Marks */}
              <div className="card">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-blue-600" /> Maximum Marks
                </h2>
                <div className="flex gap-3">
                  {MARKS_OPTIONS.map(m => (
                    <button key={m} type="button"
                      onClick={() => setMarks(m)}
                      className={`flex-1 py-3 rounded-xl border-2 font-bold text-lg transition ${marks === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={generating} className="btn-primary w-full py-4 text-base">
                {generating
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating Question…</>
                  : <><Sparkles className="w-5 h-5" /> Generate Question</>}
              </button>
            </>
          )}
        </form>
      )}

      {/* ── QUESTION STEP ─────────────────────────────────────────────────────── */}
      {step === STEPS.QUESTION && question && (
        <div className="space-y-5">
          {/* Info bar */}
          <div className="flex flex-wrap gap-2">
            <span className="badge bg-blue-100 text-blue-700">{question.subject_name}</span>
            {question.unit_title && <span className="badge bg-gray-100 text-gray-600">Unit {question.unit_number}: {question.unit_title}</span>}
            <span className={`badge ${DIFFICULTY_CONFIG[question.difficulty]?.color}`}>{DIFFICULTY_CONFIG[question.difficulty]?.label}</span>
            <span className="badge bg-gray-100 text-gray-600">{QUESTION_TYPE_LABELS[question.question_type]}</span>
            <span className="badge bg-purple-100 text-purple-700">{question.marks} marks</span>
          </div>

          {/* Question */}
          <div className="card border-l-4 border-blue-500">
            <div className="flex items-center gap-2 text-blue-600 text-sm font-medium mb-3">
              <HelpCircle className="w-4 h-4" /> Question
            </div>
            <p className="text-gray-900 text-base leading-relaxed font-medium">{question.question_text}</p>
          </div>

          <div className="flex gap-3">
            <button onClick={handleReset} className="btn-secondary">Generate New</button>
            <button onClick={handleStartWriting} className="btn-primary flex-1">
              <PenTool className="w-4 h-4" /> Start Writing Answer
            </button>
          </div>
        </div>
      )}

      {/* ── WRITING STEP ─────────────────────────────────────────────────────── */}
      {step === STEPS.WRITING && question && (
        <div className="space-y-5">
          {/* Info */}
          <div className="flex flex-wrap gap-2">
            <span className="badge bg-blue-100 text-blue-700">{question.subject_name}</span>
            {question.unit_title && <span className="badge bg-gray-100 text-gray-600">{question.unit_title}</span>}
            <span className={`badge ${DIFFICULTY_CONFIG[question.difficulty]?.color}`}>{DIFFICULTY_CONFIG[question.difficulty]?.label}</span>
            <span className="badge bg-purple-100 text-purple-700">{question.marks} marks</span>
          </div>

          {/* Question */}
          <div className="card border-l-4 border-blue-500 bg-blue-50/30">
            <div className="text-xs text-blue-600 font-medium mb-2 uppercase tracking-wide">Question ({question.marks} marks)</div>
            <p className="text-gray-900 leading-relaxed">{question.question_text}</p>
          </div>

          {/* Answer area */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <label className="font-semibold text-gray-800">Your Answer</label>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{wordCount} words</span>
                {marks >= 10 && <span className="text-gray-300">· Aim for {marks * 40}–{marks * 60} words</span>}
              </div>
            </div>
            <textarea
              ref={textareaRef}
              value={answer}
              onChange={handleAnswerChange}
              placeholder={`Write your ${QUESTION_TYPE_LABELS[question.question_type].toLowerCase()} answer here…\n\nTips:\n• Cover all key concepts\n• Use proper terminology\n• Include examples where relevant\n• Structure your answer clearly`}
              className="w-full border border-gray-300 rounded-xl p-4 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              rows={marks <= 2 ? 6 : marks <= 5 ? 10 : 18}
            />
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
              <span>
                {marks === 2  && 'Short answer: 2–4 sentences'}
                {marks === 5  && 'Short-medium answer: 1–2 paragraphs'}
                {marks === 10 && 'Detailed answer: 3–5 paragraphs with examples'}
                {marks === 15 && 'Comprehensive answer: 5+ paragraphs, structured with headings'}
              </span>
              <span>{answer.length} characters</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(STEPS.QUESTION)} className="btn-secondary">Back</button>
            <button onClick={handleSubmit} disabled={submitting || !answer.trim()}
              className="btn-primary flex-1 py-3">
              <Send className="w-4 h-4" /> Submit for Evaluation
            </button>
          </div>
        </div>
      )}

      {/* ── EVALUATING STEP ──────────────────────────────────────────────────── */}
      {step === STEPS.EVALUATING && (
        <div className="card text-center py-16">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Sparkles className="w-10 h-10 text-blue-600 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Evaluating your answer…</h2>
          <p className="text-gray-500 text-sm mb-6">AI is reviewing your answer like a university examiner.<br />This usually takes 10–20 seconds.</p>
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
          <p className="text-xs text-gray-400 mt-6">Please wait — do not close this page</p>
        </div>
      )}
    </div>
  );
}
