import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

function ToastItem({ toast, onRemove }) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />,
    error:   <XCircle    className="w-5 h-5 text-red-500   shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />,
    info:    <Info        className="w-5 h-5 text-blue-500  shrink-0" />,
  };
  const colors = {
    success: 'border-green-200 bg-green-50',
    error:   'border-red-200 bg-red-50',
    warning: 'border-yellow-200 bg-yellow-50',
    info:    'border-blue-200 bg-blue-50',
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border shadow-md max-w-sm ${colors[toast.type]}`}>
      {icons[toast.type]}
      <p className="text-sm text-gray-800 flex-1">{toast.message}</p>
      <button onClick={() => onRemove(toast.id)} className="text-gray-400 hover:text-gray-600 shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={removeToast} />)}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
