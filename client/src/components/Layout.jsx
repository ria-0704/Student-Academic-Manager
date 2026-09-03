import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, BookOpen, PenTool, Calendar, ClipboardList,
  BarChart2, User, LogOut, Menu, X, GraduationCap
} from 'lucide-react';

const navItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/subjects',    icon: BookOpen,         label: 'Subjects'      },
  { to: '/mock',        icon: PenTool,          label: 'Mock Practice' },
  { to: '/attempts',    icon: ClipboardList,    label: 'Attempts'      },
  { to: '/datesheet',   icon: Calendar,         label: 'Datesheet'     },
  { to: '/planner',     icon: ClipboardList,    label: 'Study Planner' },
  { to: '/performance', icon: BarChart2,        label: 'Performance'   },
  { to: '/profile',     icon: User,             label: 'Profile'       },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-blue-700">
        <GraduationCap className="w-7 h-7 text-white" />
        <div>
          <div className="text-white font-bold text-sm leading-tight">Academic Manager</div>
          <div className="text-blue-300 text-xs">Thapar University</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-white text-blue-700 font-semibold shadow-sm'
                  : 'text-blue-100 hover:bg-blue-700 hover:text-white'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-blue-700">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-700 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user?.full_name?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <div className="overflow-hidden">
            <div className="text-white text-sm font-medium truncate">{user?.full_name}</div>
            <div className="text-blue-300 text-xs truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white text-sm transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-blue-800 flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <aside className="absolute left-0 top-0 h-full w-64 bg-blue-800 z-50" onClick={e => e.stopPropagation()}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-700" />
            <span className="font-semibold text-gray-800 text-sm">Academic Manager</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
