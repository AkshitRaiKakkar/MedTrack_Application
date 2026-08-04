// src/pages/hospital/MaintenanceSchedule.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllTasks, exportTasksToICal } from '../../services/MaintenanceService';
import Pagination from "../../components/common/Pagination";
import MaintenanceSummaryCards from "../../components/hospital/MaintenanceSummaryCards";
import MaintenanceFilterBar from "../../components/hospital/MaintenanceFilterBar";
import MaintenanceKanbanBoard from "../../components/hospital/MaintenanceKanbanBoard";
import MaintenanceTaskDetailModal from "../../components/hospital/MaintenanceTaskDetailModal";
import { LayoutGrid, Table, Plus, Download, SlidersHorizontal, ShieldAlert } from 'lucide-react';

/* ===========================
   BIG TEMPORARY DEMO DATA
   30 Entries for Testing
=========================== */

const DEMO_TASKS = [
  // --- Completed Past Tasks ---
  { id: "MNT-001", equipmentName: "MRI Scanner", maintenanceType: "Preventive", scheduledDate: "2023-10-15", assignedTechnician: "John Doe", status: "Completed", slaState: "Upcoming" },
  { id: "MNT-002", equipmentName: "CT Scanner", maintenanceType: "Calibration", scheduledDate: "2023-10-20", assignedTechnician: "Sarah Smith", status: "Completed", slaState: "Upcoming" },
  { id: "MNT-003", equipmentName: "Ventilator A", maintenanceType: "Corrective", scheduledDate: "2023-11-01", assignedTechnician: "Mike Johnson", status: "Completed", slaState: "Upcoming" },
  { id: "MNT-004", equipmentName: "X-Ray Machine", maintenanceType: "Inspection", scheduledDate: "2023-11-05", assignedTechnician: "Emily Davis", status: "Completed", slaState: "Upcoming" },
  { id: "MNT-005", equipmentName: "Ultrasound Unit", maintenanceType: "Preventive", scheduledDate: "2023-11-10", assignedTechnician: "Chris Wilson", status: "Completed", slaState: "Upcoming" },
  { id: "MNT-006", equipmentName: "Defibrillator", maintenanceType: "Battery Check", scheduledDate: "2023-11-12", assignedTechnician: "Jessica Brown", status: "Completed", slaState: "Upcoming" },
  { id: "MNT-007", equipmentName: "ECG Machine", maintenanceType: "Calibration", scheduledDate: "2023-11-15", assignedTechnician: "Daniel Miller", status: "Completed", slaState: "Upcoming" },
  { id: "MNT-008", equipmentName: "Infusion Pump", maintenanceType: "Software Update", scheduledDate: "2023-11-18", assignedTechnician: "Sarah Smith", status: "Completed", slaState: "Upcoming" },
  
  // --- In Progress & Needs Part Tasks ---
  { id: "MNT-009", equipmentName: "MRI Scanner 3T", maintenanceType: "Cooling System Check", scheduledDate: "2023-12-05", assignedTechnician: "John Doe", status: "In Progress", slaState: "Warning" },
  { id: "MNT-010", equipmentName: "Ventilator B", maintenanceType: "Corrective", scheduledDate: "2023-12-06", assignedTechnician: "Mike Johnson", status: "In Progress", slaState: "Upcoming" },
  { id: "MNT-011", equipmentName: "Anesthesia Machine", maintenanceType: "Preventive", scheduledDate: "2023-12-07", assignedTechnician: "Emily Davis", status: "Needs Part", slaState: "Breached" },
  { id: "MNT-012", equipmentName: "Patient Monitor", maintenanceType: "Sensor Replacement", scheduledDate: "2023-12-08", assignedTechnician: "Chris Wilson", status: "In Progress", slaState: "Upcoming" },
  { id: "MNT-013", equipmentName: "Surgical Table", maintenanceType: "Hydraulic Check", scheduledDate: "2023-12-09", assignedTechnician: "Unassigned", status: "On Hold", slaState: "Escalated" },

  // --- Scheduled Future Tasks ---
  { id: "MNT-014", equipmentName: "CT Scanner", maintenanceType: "Preventive", scheduledDate: "2023-12-12", assignedTechnician: "Sarah Smith", status: "Scheduled", slaState: "Upcoming" },
  { id: "MNT-015", equipmentName: "X-Ray Machine", maintenanceType: "Radiation Check", scheduledDate: "2023-12-13", assignedTechnician: "John Doe", status: "Scheduled", slaState: "Upcoming" },
  { id: "MNT-016", equipmentName: "Ultrasound Unit", maintenanceType: "Probe Inspection", scheduledDate: "2023-12-14", assignedTechnician: "Jessica Brown", status: "Scheduled", slaState: "Upcoming" },
  { id: "MNT-017", equipmentName: "Defibrillator", maintenanceType: "Preventive", scheduledDate: "2023-12-15", assignedTechnician: "Daniel Miller", status: "Scheduled", slaState: "Upcoming" },
  { id: "MNT-018", equipmentName: "ECG Machine", maintenanceType: "Calibration", scheduledDate: "2023-12-16", assignedTechnician: "Emily Davis", status: "Scheduled", slaState: "Upcoming" },
  { id: "MNT-019", equipmentName: "Infusion Pump 2", maintenanceType: "Preventive", scheduledDate: "2023-12-17", assignedTechnician: "Mike Johnson", status: "Scheduled", slaState: "Upcoming" },
  { id: "MNT-020", equipmentName: "Autoclave", maintenanceType: "Deep Clean", scheduledDate: "2023-12-18", assignedTechnician: "Unassigned", status: "Scheduled", slaState: "Upcoming" },
  { id: "MNT-021", equipmentName: "Centrifuge", maintenanceType: "Inspection", scheduledDate: "2023-12-19", assignedTechnician: "Chris Wilson", status: "Scheduled", slaState: "Upcoming" },
  { id: "MNT-022", equipmentName: "Blood Gas Analyzer", maintenanceType: "Reagent Replace", scheduledDate: "2023-12-20", assignedTechnician: "Sarah Smith", status: "Scheduled", slaState: "Upcoming" },
  { id: "MNT-023", equipmentName: "Ventilator C", maintenanceType: "Filter Change", scheduledDate: "2023-12-21", assignedTechnician: "John Doe", status: "Scheduled", slaState: "Upcoming" },
  { id: "MNT-024", equipmentName: "Oxygen Concentrator", maintenanceType: "Inspection", scheduledDate: "2023-12-22", assignedTechnician: "Jessica Brown", status: "Scheduled", slaState: "Upcoming" },
  { id: "MNT-025", equipmentName: "Surgical Light", maintenanceType: "Bulb Check", scheduledDate: "2023-12-23", assignedTechnician: "Daniel Miller", status: "Scheduled", slaState: "Upcoming" },
  { id: "MNT-026", equipmentName: "Nebulizer", maintenanceType: "Cleaning", scheduledDate: "2023-12-24", assignedTechnician: "Emily Davis", status: "Scheduled", slaState: "Upcoming" },
  { id: "MNT-027", equipmentName: "Endoscope", maintenanceType: "Leak Test", scheduledDate: "2023-12-25", assignedTechnician: "Unassigned", status: "Scheduled", slaState: "Upcoming" },
  { id: "MNT-028", equipmentName: "Dialysis Machine", maintenanceType: "Preventive", scheduledDate: "2023-12-26", assignedTechnician: "Mike Johnson", status: "Scheduled", slaState: "Upcoming" },
  { id: "MNT-029", equipmentName: "Thermometer (Digital)", maintenanceType: "Calibration", scheduledDate: "2023-12-27", assignedTechnician: "Chris Wilson", status: "Scheduled", slaState: "Upcoming" },
  { id: "MNT-030", equipmentName: "Wheelchair Scale", maintenanceType: "Calibration", scheduledDate: "2023-12-28", assignedTechnician: "Sarah Smith", status: "Scheduled", slaState: "Upcoming" },
];

export default function MaintenanceSchedule({ onNavigate }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedTechnician, setSelectedTechnician] = useState('ALL');
  const [selectedSla, setSelectedSla] = useState('ALL');

  // Modal State
  const [activeTaskModal, setActiveTaskModal] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async (pageNum = 0) => {
    try {
      const response = await getAllTasks({ page: pageNum, size: pageSize });
      const items = response?.content || response?.data || [];
      if (Array.isArray(items) && items.length > 0) {
        const mapped = items.map(t => ({
          id: t.taskCode || `MNT-${t.id}`,
          equipmentName: t.equipment || "N/A",
          maintenanceType: t.maintenanceType || "N/A",
          scheduledDate: t.deadline || "",
          assignedTechnician: t.assignedTechnician || "Unassigned",
          status: t.status ? (t.status.getDisplayName ? t.status.getDisplayName() : t.status) : "Scheduled",
          slaState: t.slaState ? (t.slaState.getDisplayName ? t.slaState.getDisplayName() : t.slaState) : "Upcoming",
          ruleSource: t.policyRuleId ? `Rule #${t.policyRuleId}` : null,
          escalatedTo: t.escalatedTo || null
        }));
        setTasks(mapped);
        if (response?.totalPages) setTotalPages(response.totalPages);
        if (response?.page !== undefined) setPage(response.page);
      } else {
        loadLocalTasks();
      }
    } catch (err) {
      console.error("Failed to load tasks from backend, using local/demo:", err);
      loadLocalTasks();
    }
  };

  const loadLocalTasks = () => {
    const storedTasks = localStorage.getItem("medtrack_maintenance");
    const parsedTasks = storedTasks ? JSON.parse(storedTasks) : [];
    if (parsedTasks.length > 0) {
      setTasks([...DEMO_TASKS, ...parsedTasks]);
    } else {
      setTasks(DEMO_TASKS);
    }
  };

  // Status Change Handler
  const handleUpdateStatus = (taskId, newStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  // Technician Assignment Handler
  const handleAssignTechnician = (taskId, techName) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, assignedTechnician: techName } : t))
    );
  };

  // Unique Technicians List for Filter
  const techniciansList = useMemo(() => {
    const set = new Set();
    tasks.forEach((t) => {
      if (t.assignedTechnician && t.assignedTechnician !== 'Unassigned') {
        set.add(t.assignedTechnician);
      }
    });
    return Array.from(set);
  }, [tasks]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        !searchQuery ||
        task.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.maintenanceType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === 'ALL' || task.status === selectedStatus;
      const matchesTech =
        selectedTechnician === 'ALL' ||
        (selectedTechnician === 'Unassigned'
          ? !task.assignedTechnician || task.assignedTechnician === 'Unassigned'
          : task.assignedTechnician === selectedTechnician);

      const matchesSla = selectedSla === 'ALL' || (task.slaState || 'Upcoming') === selectedSla;

      return matchesSearch && matchesStatus && matchesTech && matchesSla;
    });
  }, [tasks, searchQuery, selectedStatus, selectedTechnician, selectedSla]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('ALL');
    setSelectedTechnician('ALL');
    setSelectedSla('ALL');
  };

  const handleExportICal = async () => {
    setExporting(true);
    try {
      const icalContent = await exportTasksToICal();
      const blob = new Blob([icalContent], { type: "text/calendar;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", "medtrack_maintenance.ics");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("iCal export failed:", err);
      alert("Failed to export iCal feed. Please make sure you are logged in.");
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const statusStyles = {
    "Scheduled": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    "In Progress": "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
    "Needs Part": "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
    "On Hold": "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700",
    "Completed": "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  };

  const slaStyles = {
    "Upcoming": "bg-blue-50 text-blue-600 border-blue-200",
    "Warning": "bg-amber-50 text-amber-600 border-amber-200",
    "Breached": "bg-red-50 text-red-600 border-red-200",
    "Escalated": "bg-purple-50 text-purple-600 border-purple-200",
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header Section */}
      <header className="bg-card border-b border-subtle sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-primary">Maintenance Schedule & Kanban Timeline</h1>
              <p className="text-sm text-secondary mt-1">
                Showing {filteredTasks.length} of {tasks.length} maintenance tasks
              </p>
            </div>

            {/* Header Right Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* View Toggle */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-subtle">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                    viewMode === 'kanban'
                      ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" /> Kanban Board
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" /> Table View
                </button>
              </div>

              {user?.role === "hospital" && (
                <>
                  <button
                    onClick={() => onNavigate('maintenance-rules')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg shadow-sm transition-colors border border-subtle cursor-pointer"
                  >
                    ⚙️ Rules
                  </button>
                  <button
                    onClick={() => onNavigate('sla-dashboard')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg shadow-sm transition-colors border border-subtle cursor-pointer"
                  >
                    📊 SLA
                  </button>
                </>
              )}
              <button
                onClick={handleExportICal}
                disabled={exporting}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg shadow-sm transition-colors border border-subtle flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> {exporting ? "Exporting..." : "iCal Feed"}
              </button>
              {user?.role === "hospital" && (
                <button
                  onClick={() => onNavigate('schedule-maintenance')}
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> New Schedule
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* KPI Summary Metrics */}
        <MaintenanceSummaryCards tasks={tasks} />

        {/* Filter & Search Bar */}
        <MaintenanceFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedTechnician={selectedTechnician}
          onTechnicianChange={setSelectedTechnician}
          selectedSla={selectedSla}
          onSlaChange={setSelectedSla}
          techniciansList={techniciansList}
          onResetFilters={handleResetFilters}
        />

        {/* Views: Kanban vs Table */}
        {viewMode === 'kanban' ? (
          <MaintenanceKanbanBoard
            tasks={filteredTasks}
            onTaskClick={(task) => setActiveTaskModal(task)}
            onMoveTaskStatus={handleUpdateStatus}
          />
        ) : (
          <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-subtle">
                <thead className="bg-surface border-b border-subtle">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Equipment</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Technician</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle bg-card">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-16 text-secondary">
                        <div className="flex flex-col items-center">
                          <span className="text-4xl mb-2">🛠️</span>
                          <p className="font-medium">No maintenance tasks match your filters.</p>
                          <button
                            onClick={handleResetFilters}
                            className="mt-3 text-teal-600 hover:text-teal-700 text-xs font-bold"
                          >
                            Reset Search & Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => (
                      <tr
                        key={task.id}
                        onClick={() => setActiveTaskModal(task)}
                        className="hover:bg-hover transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-lg mr-3">🩺</span>
                            <div>
                              <span className="font-medium text-primary block">{task.equipmentName}</span>
                              <span className="text-xs text-secondary">{task.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                          {task.maintenanceType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-primary font-medium">{formatDate(task.scheduledDate)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-hover flex items-center justify-center text-xs font-bold text-secondary border border-subtle">
                              {task.assignedTechnician ? task.assignedTechnician.charAt(0) : "?"}
                            </div>
                            {task.assignedTechnician || 'Unassigned'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${statusStyles[task.status] || statusStyles.Scheduled}`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${slaStyles[task.slaState] || slaStyles.Upcoming}`}>
                            {task.slaState || 'Upcoming'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
          </div>
        )}

        {/* Task Detail / Status Update Modal */}
        {activeTaskModal && (
          <MaintenanceTaskDetailModal
            task={activeTaskModal}
            onClose={() => setActiveTaskModal(null)}
            onUpdateStatus={handleUpdateStatus}
            onAssignTechnician={handleAssignTechnician}
          />
        )}
      </main>
    </div>
  );
}