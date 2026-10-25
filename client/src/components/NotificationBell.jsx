/**
 * NotificationBell.jsx
 *
 * Self-contained in-app notification bell component.
 *
 * - Fetches data from the EXISTING /api/exams and /api/planner endpoints.
 * - Derives notifications using pure functions in notificationUtils.js.
 * - Stores read/unread state in browser localStorage ONLY.
 *   This state is local to this browser/device and is not synced to the server.
 * - No new backend endpoints, no database changes.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, CheckCheck, Calendar, ClipboardList, BookOpen, RefreshCw } from 'lucide-react';
import api from '../services/api';
import {
  buildAllNotifications,
  getReadIds,
  saveReadIds,
} from '../utils/notificationUtils';

// ─── Config ───────────────────────────────────────────────────────────────────

// Re-fetch interval: 5 minutes (notifications are low-priority background data)
const REFETCH_INTERVAL_MS = 5 * 60 * 1000;

// ─── Small helpers ────────────────────────────────────────────────────────────

const TYPE_ICON = {
  exam:     Calendar,
  task:     ClipboardList,
  revision: BookOpen,
};

const TYPE_LABEL = {
  exam:     'Exam Reminder',
  task:     'Task Reminder',
  revision: 'Revision Reminder',
};

// Tailwind classes per urgency level — consistent with the app's existing palette
const URGENCY_STYLE = {
  critical: {
    dot:    'bg-red-500',
    badge:  'bg-red-100 text-red-700',
    border: 'border-l-red-400',
  },
  high: {
    dot:    'bg-orange-500',
    badge:  'bg-orange-100 text-orange-700',
    border: 'border-l-orange-400',
  },
  medium: {
    dot:    'bg-yellow-400',
    badge:  'bg-yellow-100 text-yellow-700',
    border: 'border-l-yellow-400',
  },
  low: {
    dot:    'bg-blue-400',
    badge:  'bg-blue-100 text-blue-700',
    border: 'border-l-blue-400',
  },
};

// ─── NotificationItem ─────────────────────────────────────────────────────────

function NotificationItem({ notification, isRead, onRead, onNavigate }) {
  const Icon   = TYPE_ICON[notification.type]   || Bell;
  const style  = URGENCY_STYLE[notification.urgency] || URGENCY_STYLE.low;
  const label  = TYPE_LABEL[notification.type]  || 'Notification';

  const handleClick = () => {
    onRead(notification.id);
    onNavigate(notification.link);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
      className={`
        flex items-start gap-3 px-4 py-3 border-l-4 cursor-pointer transition-colors
        hover:bg-gray-50 focus:outline-none focus:bg-gray-50
        ${style.border}
        ${isRead ? 'opacity-60' : 'bg-white'}
      `}
      aria-label={`${label}: ${notification.message}`}
    >
      {/* Icon + unread dot */}
      <div className="relative shrink-0 mt-0.5">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <Icon className="w-4 h-4 text-gray-600" />
        </div>
        {!isRead && (
          <span
            className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${style.dot}`}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${style.badge}`}>
            {label}
          </span>
          {!isRead && (
            <span className="text-xs text-blue-600 font-medium">New</span>
          )}
        </div>
        <p className="text-sm font-medium text-gray-800 leading-snug truncate">
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>
      </div>
    </div>
  );
}

// ─── NotificationBell (main export) ───────────────────────────────────────────

export default function NotificationBell({ mobileHeader = false }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  const [open,          setOpen]          = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readIds,       setReadIds]       = useState(() => getReadIds());
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [lastFetched,   setLastFetched]   = useState(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Reuse the same existing endpoints used by Datesheet.jsx and Planner.jsx
      const [examsRes, tasksRes] = await Promise.all([
        api.get('/exams'),
        api.get('/planner'),
      ]);

      const exams = examsRes.data.exams  || [];
      const tasks = tasksRes.data.tasks  || [];

      setNotifications(buildAllNotifications(exams, tasks));
      setLastFetched(new Date());
    } catch (err) {
      // Fail silently — the bell stays visible but shows an error state
      setError('Could not load notifications. Check your connection.');
      console.warn('NotificationBell fetch error:', err.userMessage || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount; interval fires every REFETCH_INTERVAL_MS thereafter.
  // The panel-open effect below intentionally does NOT fetch on first open
  // because the mount fetch already covers that case.
  const hasMountFetched = useRef(false);

  useEffect(() => {
    fetchNotifications();
    hasMountFetched.current = true;
    const interval = setInterval(fetchNotifications, REFETCH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Re-fetch when the panel is opened, but skip the very first open if the
  // mount fetch has not completed yet (avoids firing two parallel requests).
  useEffect(() => {
    if (open && hasMountFetched.current) fetchNotifications();
  }, [open, fetchNotifications]);

  // ── Close panel when clicking outside ────────────────────────────────────

  useEffect(() => {
    if (!open) return;

    function handleOutsideClick(e) {
      if (
        panelRef.current  && !panelRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(e) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown',   handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown',   handleEscape);
    };
  }, [open]);

  // ── Read-state management ─────────────────────────────────────────────────

  const markRead = useCallback((id) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    const allIds = new Set(notifications.map(n => n.id));
    saveReadIds(allIds);
    setReadIds(allIds);
  }, [notifications]);

  // ── Derived values ────────────────────────────────────────────────────────

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const handleNavigate = (link) => {
    setOpen(false);
    navigate(link);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative">
      {/* Bell trigger button.
          mobileHeader=true  → dark-text style for the white mobile header.
          mobileHeader=false → light-text style for the dark blue sidebar. */}
      <button
        ref={buttonRef}
        onClick={() => setOpen(o => !o)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`relative p-1.5 rounded-lg transition focus:outline-none focus:ring-2 ${
          mobileHeader
            ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 focus:ring-gray-300'
            : 'text-blue-100 hover:bg-blue-700 hover:text-white focus:ring-white/50'
        }`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification panel */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          className="
            absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)]
            bg-white rounded-xl shadow-xl border border-gray-200
            z-50 overflow-hidden
          "
          style={{ top: '100%' }}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-700" />
              <h2 className="text-sm font-semibold text-gray-900">Notifications</h2>
              {unreadCount > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Refresh */}
              <button
                onClick={fetchNotifications}
                disabled={loading}
                aria-label="Refresh notifications"
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {/* Mark all read */}
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  aria-label="Mark all notifications as read"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              {/* Close */}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* localStorage disclaimer */}
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
            <p className="text-[11px] text-gray-400 leading-tight">
              Read/unread state is saved locally in this browser only and is not
              synced across other devices.
            </p>
          </div>

          {/* Body */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-100">
            {loading && notifications.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-10 text-gray-400 text-sm">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading notifications…
              </div>
            )}

            {error && (
              <div className="px-4 py-4 text-sm text-red-600 bg-red-50 flex items-start gap-2">
                <span className="shrink-0">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm font-medium text-gray-500">You're all caught up!</p>
                <p className="text-xs text-gray-400 mt-1 text-center px-4">
                  Reminders appear here when exams or tasks are approaching.
                </p>
              </div>
            )}

            {notifications.map(n => (
              <NotificationItem
                key={n.id}
                notification={n}
                isRead={readIds.has(n.id)}
                onRead={markRead}
                onNavigate={handleNavigate}
              />
            ))}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {lastFetched
                  ? `Updated ${lastFetched.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`
                  : ''}
              </span>
              <button
                onClick={() => { markAllRead(); setOpen(false); }}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Dismiss all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
