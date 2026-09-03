// Format file size
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Format date to readable string
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Format date for display (short)
export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// Format time
export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(h), parseInt(m));
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Days remaining until a date
export function daysUntil(dateStr) {
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

// Study status config
export const STATUS_CONFIG = {
  not_started: { label: 'Not Started', color: 'bg-gray-100 text-gray-600' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700' },
  completed:   { label: 'Completed',   color: 'bg-green-100 text-green-700' },
};

// Difficulty config
export const DIFFICULTY_CONFIG = {
  easy:   { label: 'Easy',   color: 'bg-green-100 text-green-700' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  hard:   { label: 'Hard',   color: 'bg-red-100 text-red-700' },
};

// Priority config
export const PRIORITY_CONFIG = {
  high:   { label: 'High',   color: 'bg-red-100 text-red-700' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  low:    { label: 'Low',    color: 'bg-blue-100 text-blue-700' },
};

// File type icon color
export const FILE_TYPE_CONFIG = {
  pdf:  { color: 'text-red-500',    bg: 'bg-red-50'  },
  ppt:  { color: 'text-orange-500', bg: 'bg-orange-50' },
  pptx: { color: 'text-orange-500', bg: 'bg-orange-50' },
};

// Get score color
export function getScoreColor(pct) {
  if (pct >= 75) return 'text-green-600';
  if (pct >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

// Truncate text
export function truncate(text, maxLen = 100) {
  if (!text) return '';
  return text.length > maxLen ? text.substring(0, maxLen) + '…' : text;
}

// Question type labels
export const QUESTION_TYPE_LABELS = {
  long_answer:  'Long Answer',
  short_answer: 'Short Answer',
  case_study:   'Case Study',
};
