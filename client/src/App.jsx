import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import Login         from './pages/Login';
import Register      from './pages/Register';
import Dashboard     from './pages/Dashboard';
import Subjects      from './pages/Subjects';
import SubjectDetail from './pages/SubjectDetail';
import MockPractice  from './pages/MockPractice';
import Attempts      from './pages/Attempts';
import AttemptDetail from './pages/AttemptDetail';
import Datesheet     from './pages/Datesheet';
import Planner       from './pages/Planner';
import Performance   from './pages/Performance';
import Profile       from './pages/Profile';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><LoadingSpinner text="Loading..." /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><LoadingSpinner text="Loading..." /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"         element={<Navigate to="/dashboard" replace />} />
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      <Route path="/dashboard"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/subjects"        element={<ProtectedRoute><Subjects /></ProtectedRoute>} />
      <Route path="/subjects/:id"    element={<ProtectedRoute><SubjectDetail /></ProtectedRoute>} />
      <Route path="/mock"            element={<ProtectedRoute><MockPractice /></ProtectedRoute>} />
      <Route path="/attempts"        element={<ProtectedRoute><Attempts /></ProtectedRoute>} />
      <Route path="/attempts/:id"    element={<ProtectedRoute><AttemptDetail /></ProtectedRoute>} />
      <Route path="/datesheet"       element={<ProtectedRoute><Datesheet /></ProtectedRoute>} />
      <Route path="/planner"         element={<ProtectedRoute><Planner /></ProtectedRoute>} />
      <Route path="/performance"     element={<ProtectedRoute><Performance /></ProtectedRoute>} />
      <Route path="/profile"         element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}
