import React from 'react';
import { X, Bell, User, Clock, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';

/**
 * ActivityCenterEventDetailModal - Inspection & resolution drawer for activity events.
 */
export const ActivityCenterEventDetailModal = ({ event, onClose, onMarkAsRead, onNavigate }) => {
  if (!event) return null;

  const handleResolve = () => {
    if (!event.read && onMarkAsRead) {
      onMarkAsRead([event.id]);
    }
    if (event.category === 'MAINTENANCE' || event.category === 'SLA') {
      onNavigate && onNavigate('maintenance');
    } else if (event.category === 'EQUIPMENT') {
      onNavigate && onNavigate('equipment');
    } else if (event.category === 'PROCUREMENT' || event.category === 'APPROVAL') {
      onNavigate && onNavigate('analytics');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Bell className="w-5 h-5" />
            </span>
            <div>
              <span className="text-xs font-mono font-bold text-slate-400">{event.id}</span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight mt-0.5">{event.title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Severity Badge & Details */}
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Category & Severity</span>
            <div className="flex gap-1.5">
              <span className="px-2 py-0.5 rounded font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {event.category}
              </span>
              <span className={`px-2 py-0.5 rounded font-bold ${
                event.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                event.severity === 'WARNING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
              }`}>
                {event.severity}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-800">
            <p className="text-slate-700 dark:text-slate-200 font-medium leading-relaxed">{event.detail || 'No further description available.'}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Triggered By</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                <User className="w-3 h-3 text-teal-500" /> {event.actor || 'System'}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Timestamp</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-indigo-500" /> {new Date(event.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            Dismiss
          </button>
          <button
            onClick={handleResolve}
            className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Resolve & View Console <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityCenterEventDetailModal;
