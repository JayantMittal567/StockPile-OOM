import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function ToastAlert({ alert, onClose }) {
  if (!alert) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full px-4 animate-in fade-in slide-in-from-top-3">
      <div
        className={`p-4 rounded-xl shadow-lg border flex items-start gap-3 ${
          alert.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}
      >
        {alert.type === 'success' ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 text-xs font-medium">{alert.message}</div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
