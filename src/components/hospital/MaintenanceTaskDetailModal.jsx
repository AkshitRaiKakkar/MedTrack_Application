import React, { useEffect, useState } from 'react';
import { X, Calendar, User, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

/**
 * MaintenanceTaskDetailModal - Quick inspection & status update modal.
 */
export const MaintenanceTaskDetailModal = ({ task, onClose, onUpdateStatus, onAssignTechnician }) => {
  const [currentStatus, setCurrentStatus] = useState(task?.status || 'Scheduled');
  const [tech, setTech] = useState(task?.assignedTechnician || 'Unassigned');

  useEffect(() => {
    setCurrentStatus(task?.status || 'Scheduled');
    setTech(task?.assignedTechnician || 'Unassigned');
  }, [task]);

  if (!task) return null;

  const handleSave = () => {
    if (onUpdateStatus && currentStatus !== task.status) {
      onUpdateStatus(task.id, currentStatus);
    }
    if (onAssignTechnician && tech !== task.assignedTechnician) {
      onAssignTechnician(task.id, tech);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 rounded">
                {task.id}
              </span>
              <span className="text-xs text-slate-400 font-medium">{task.maintenanceType}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{task.equipmentName}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-teal-500" /> Scheduled Date
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{task.scheduledDate}</p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> SLA Health
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{task.slaState || 'Upcoming'}</p>
          </div>
        </div>

        {/* Status Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-indigo-500" /> Change Status
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['Scheduled', 'In Progress', 'Needs Part', 'On Hold', 'Completed'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setCurrentStatus(st)}
                className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition ${
                  currentStatus === st
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Technician Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-indigo-500" /> Assigned Technician
          </label>
          <input
            type="text"
            value={tech}
            onChange={(e) => setTech(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            placeholder="Enter technician name..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-md flex items-center gap-1"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceTaskDetailModal;
