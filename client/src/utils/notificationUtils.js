/**
 * notificationUtils.js
 *
 * Pure functions that derive in-app notifications from existing exam and task
 * data. No API calls, no side-effects, no new dependencies.
 *
 * All date arithmetic uses midnight-normalised Date objects (time zeroed out)
 * to avoid timezone-related off-by-one errors. exam_date and task_date from
 * the API are plain YYYY-MM-DD strings which are parsed as LOCAL date strings
 * using a split-and-construct approach so they are never interpreted as UTC.
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse a YYYY-MM-DD date string as a LOCAL midnight Date.
 * new Date('2024-12-12') is parsed as UTC midnight which shifts by tz offset,
 * so we construct from parts instead.
 */
function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Today at midnight, local time. */
function todayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Integer days between two midnight dates (positive = future). */
function daysBetween(from, to) {
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

// ─── Exam reminders ───────────────────────────────────────────────────────────

/**
 * Generate exam reminder notifications.
 *
 * Thresholds: today (0), 1 day, 3 days, 7 days.
 * Only future exams (days >= 0) are included.
 *
 * @param {Array} exams  Raw exam objects from GET /api/exams
 * @returns {Array}      Notification objects
 */
export function buildExamNotifications(exams) {
  const today = todayMidnight();
  const notifications = [];

  for (const exam of exams) {
    const examDate = parseLocalDate(exam.exam_date);
    if (!examDate) continue;

    const days = daysBetween(today, examDate);

    // Only upcoming or today
    if (days < 0) continue;

    let urgency = null;
    let message = '';

    if (days === 0) {
      urgency = 'critical';
      message = `Your ${exam.subject_name} exam is TODAY. Good luck!`;
    } else if (days === 1) {
      urgency = 'high';
      message = `${exam.subject_name} exam is TOMORROW. Make sure you've revised everything.`;
    } else if (days === 3) {
      urgency = 'medium';
      message = `${exam.subject_name} exam is in 3 days. Start your final revision now.`;
    } else if (days === 7) {
      urgency = 'low';
      message = `${exam.subject_name} exam is in 1 week. Begin focused preparation.`;
    }

    if (!urgency) continue; // days not at a reminder threshold

    notifications.push({
      id:        `exam-${exam.id}-days${days}`,
      type:      'exam',
      urgency,
      title:     exam.subject_name,
      message,
      date:      exam.exam_date,
      daysAway:  days,
      link:      '/datesheet',
    });
  }

  // Sort: most urgent first
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  notifications.sort((a, b) => order[a.urgency] - order[b.urgency]);

  return notifications;
}

// ─── Pending task reminders ───────────────────────────────────────────────────

/**
 * Generate reminders for overdue, due-today, and due-tomorrow tasks.
 *
 * Rules:
 *  - Skip completed tasks.
 *  - Skip tasks with no task_date (undated tasks don't trigger reminders).
 *  - Overdue  = task_date < today
 *  - Today    = task_date === today
 *  - Tomorrow = task_date === today + 1
 *
 * @param {Array} tasks  Raw task objects from GET /api/planner
 * @returns {Array}      Notification objects
 */
export function buildTaskNotifications(tasks) {
  const today = todayMidnight();
  const notifications = [];

  for (const task of tasks) {
    if (task.is_completed) continue;
    if (!task.task_date)   continue;

    const taskDate = parseLocalDate(task.task_date);
    if (!taskDate) continue;

    const days = daysBetween(today, taskDate); // negative = overdue

    let urgency = null;
    let message = '';

    if (days < 0) {
      urgency = 'high';
      message = `Overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''}: "${task.title}"`;
    } else if (days === 0) {
      urgency = 'medium';
      message = `Due today: "${task.title}"`;
    } else if (days === 1) {
      urgency = 'low';
      message = `Due tomorrow: "${task.title}"`;
    }

    if (!urgency) continue;

    const subjectLabel = task.subject_name || task.subject_name_resolved || null;

    notifications.push({
      id:       `task-${task.id}-days${days}`,
      type:     'task',
      urgency,
      title:    subjectLabel ? `${subjectLabel} — task reminder` : 'Task reminder',
      message,
      date:     task.task_date,
      priority: task.priority,
      daysAway: days,
      link:     '/planner',
    });
  }

  // Overdue first, then today, then tomorrow
  notifications.sort((a, b) => a.daysAway - b.daysAway);

  return notifications;
}

// ─── Revision reminders ───────────────────────────────────────────────────────

/**
 * Rule-based revision reminders.
 *
 * Logic:
 *  For each upcoming exam within the next 10 days, look for incomplete tasks
 *  whose subject_name (or subject_name_resolved) matches the exam's subject_name
 *  (case-insensitive substring match to handle minor naming differences).
 *
 *  If matching incomplete tasks exist → emit one "revision reminder" for
 *  that exam, listing up to 3 pending task titles.
 *
 *  One notification per exam to avoid flooding.
 *  Tasks already flagged by buildTaskNotifications are NOT duplicated here —
 *  we only emit a revision reminder when the task is not already overdue/today/tomorrow.
 *
 * @param {Array} exams   Raw exam objects
 * @param {Array} tasks   Raw task objects
 * @returns {Array}       Notification objects
 */
export function buildRevisionNotifications(exams, tasks) {
  const today = todayMidnight();
  const notifications = [];

  // Build a set of task IDs already covered by task reminders
  // (overdue, today, tomorrow) so we don't double-emit
  const alreadyRemindedTaskIds = new Set(
    tasks
      .filter(t => !t.is_completed && t.task_date)
      .filter(t => {
        const d = daysBetween(today, parseLocalDate(t.task_date));
        return d <= 1; // overdue or due today/tomorrow
      })
      .map(t => t.id)
  );

  const incompleteTasks = tasks.filter(
    t => !t.is_completed && !alreadyRemindedTaskIds.has(t.id)
  );

  for (const exam of exams) {
    const examDate = parseLocalDate(exam.exam_date);
    if (!examDate) continue;

    const daysToExam = daysBetween(today, examDate);
    // Only generate revision reminders for exams in the next 10 days
    if (daysToExam < 2 || daysToExam > 10) continue;

    const examNameLower = (exam.subject_name || '').toLowerCase();

    // Find incomplete tasks relevant to this exam
    const relevant = incompleteTasks.filter(t => {
      const taskSubject = (
        t.subject_name || t.subject_name_resolved || t.title || ''
      ).toLowerCase().trim();

      // Guard: skip empty subject strings to prevent vacuous matches
      if (!taskSubject || !examNameLower) return false;

      // Match if either string contains the other.
      // Also check the first word of the task subject against the exam name
      // (handles "DBMS" vs "Database Management Systems" style mismatches).
      const firstWord = taskSubject.split(' ')[0];
      return (
        taskSubject.includes(examNameLower) ||
        (firstWord.length >= 3 && examNameLower.includes(firstWord))
      );
    });

    if (relevant.length === 0) continue;

    const taskTitles = relevant
      .slice(0, 3)
      .map(t => `"${t.title}"`)
      .join(', ');

    const more = relevant.length > 3 ? ` and ${relevant.length - 3} more` : '';

    notifications.push({
      id:       `revision-${exam.id}`,
      type:     'revision',
      urgency:  'medium',
      title:    `Revise for ${exam.subject_name}`,
      message:  `Exam in ${daysToExam} days. Pending tasks: ${taskTitles}${more}.`,
      date:     exam.exam_date,
      daysAway: daysToExam,
      link:     '/planner',
    });
  }

  notifications.sort((a, b) => a.daysAway - b.daysAway);
  return notifications;
}

// ─── Combine all notifications ────────────────────────────────────────────────

/**
 * Build the full notification list from raw API data.
 * Deduplicates by id. Exam reminders first, task reminders second, revision last.
 *
 * @param {Array} exams
 * @param {Array} tasks
 * @returns {Array}
 */
export function buildAllNotifications(exams, tasks) {
  const exam     = buildExamNotifications(exams);
  const task     = buildTaskNotifications(tasks);
  const revision = buildRevisionNotifications(exams, tasks);

  // Deduplicate by id (revision ids are distinct from task/exam ids)
  const seen = new Set();
  const all  = [];
  for (const n of [...exam, ...task, ...revision]) {
    if (!seen.has(n.id)) {
      seen.add(n.id);
      all.push(n);
    }
  }
  return all;
}

// ─── localStorage read-state helpers ─────────────────────────────────────────

const LS_KEY = 'sam_notification_read_ids';

/** Return a Set of notification ids the user has already marked as read. */
export function getReadIds() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

/** Persist an updated Set of read ids. */
export function saveReadIds(readSet) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...readSet]));
  } catch {
    // localStorage unavailable — degrade silently
  }
}
