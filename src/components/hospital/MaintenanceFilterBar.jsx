import React from 'react';
import { Search, Filter, RefreshCw, X } from 'lucide-react';

/**
 * MaintenanceFilterBar - Search & Filtering bar for Maintenance Kanban and Table views.
 */
export const MaintenanceFilterBar = ({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedTechnician,
  onTechnicianChange,
  selectedSla,
  onSlaChange,
  techniciansList = [],
  onResetFilters,
}) => {
  const hasActiveFilters = searchQuery || selectedStatus !== 'ALL' || selectedTechnician !== 'ALL' || selectedSla !== 'ALL';

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by equipment name, ID, or maintenance type..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 dark:text-white"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Select Dropdowns */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium"
        >
          <option value="ALL">All Statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="In Progress">In Progress</option>
          <option value="Needs Part">Needs Part</option>
          <option value="On Hold">On Hold</option>
          <option value="Completed">Completed</option>
        </select>

        {/* Technician Filter */}
        <select
          value={selectedTechnician}
          onChange={(e) => onTechnicianChange(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium"
        >
          <option value="ALL">All Technicians</option>
          <option value="Unassigned">Unassigned</option>
          {techniciansList.map((tech) => (
            <option key={tech} value={tech}>
              {tech}
            </option>
          ))}
        </select>

        {/* SLA Filter */}
        <select
          value={selectedSla}
          onChange={(e) => onSlaChange(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium"
        >
          <option value="ALL">All SLA States</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Warning">Warning</option>
          <option value="Breached">Breached</option>
          <option value="Escalated">Escalated</option>
        </select>

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition flex items-center gap-1 font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default MaintenanceFilterBar;
