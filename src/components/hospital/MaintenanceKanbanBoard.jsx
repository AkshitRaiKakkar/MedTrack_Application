import React, { useState } from 'react';
import { Calendar, User, Clock, AlertCircle, ArrowRight, MoreHorizontal } from 'lucide-react';

export const KANBAN_COLUMNS = [
  { id: 'Scheduled', label: 'Scheduled', color: 'border-blue-500 text-blue-700 bg-blue-50 dark:bg-blue-950/30' },
  { id: 'In Progress', label: 'In Progress', color: 'border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-950/30' },
  { id: 'Needs Part', label: 'Needs Part', color: 'border-orange-500 text-orange-700 bg-orange-50 dark:bg-orange-950/30' },
  { id: 'On Hold', label: 'On Hold', color: 'border-slate-400 text-slate-700 bg-slate-100 dark:bg-slate-800/40' },
  { id: 'Completed', label: 'Completed', color: 'border-emerald-500 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30' },
];

/**
 * MaintenanceKanbanBoard - Interactive drag & column Kanban board view for Maintenance tasks.
 */
export const MaintenanceKanbanBoard = ({ tasks = [], onTaskClick, onMoveTaskStatus }) => {
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId && onMoveTaskStatus) {
      onMoveTaskStatus(taskId, targetStatus);
    }
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const slaBadgeColor = (slaState) => {
    switch (slaState) {
      case 'Breached':
        return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300';
      case 'Warning':
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300';
      case 'Escalated':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300';
      default:
        return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-6">
      {KANBAN_COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => (t.status || 'Scheduled') === col.id);
        const isTarget = dragOverColumn === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col bg-slate-100/70 dark:bg-slate-800/50 rounded-2xl p-3 border-2 transition-all min-h-[500px] ${
              isTarget ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 shadow-md' : 'border-slate-200/60 dark:border-slate-700/50'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-700/80 px-1">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full border ${col.color.split(' ')[0]}`} />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{col.label}</h3>
              </div>
              <span className="px-2 py-0.5 text-xs font-bold bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full shadow-sm">
                {colTasks.length}
              </span>
            </div>

            {/* Task Cards Container */}
            <div className="flex-1 space-y-3">
              {colTasks.length === 0 ? (
                <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-400 font-medium">
                  Drop tasks here
                </div>
              ) : (
                colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => onTaskClick && onTaskClick(task)}
                    className="bg-white dark:bg-slate-900 rounded-xl p-3.5 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md hover:border-teal-400 dark:hover:border-teal-600 transition cursor-grab active:cursor-grabbing group"
                  >
                    {/* Card Top Row */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-400">{task.id}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${slaBadgeColor(task.slaState)}`}>
                        {task.slaState || 'Upcoming'}
                      </span>
                    </div>

                    {/* Equipment & Maintenance Type */}
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition line-clamp-1">
                      {task.equipmentName}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{task.maintenanceType}</p>

                    {/* Card Footer Details */}
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {task.scheduledDate}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        <User className="w-3 h-3 text-teal-500" />
                        {task.assignedTechnician ? task.assignedTechnician.split(' ')[0] : 'Unassigned'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MaintenanceKanbanBoard;
