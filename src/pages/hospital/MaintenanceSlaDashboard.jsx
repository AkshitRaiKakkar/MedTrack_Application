// src/pages/hospital/MaintenanceSlaDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  getSlaSummary,
  refreshSla,
  getTechnicianWorkload,
} from "../../services/MaintenanceService";

const SLA_COLORS = {
  Upcoming: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  Warning: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  Breached: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  Escalated: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
};

const slaName = (slaState) => {
  if (!slaState) return "Upcoming";
  if (typeof slaState === "string") return slaState;
  return slaState.displayName || slaState.name || "Upcoming";
};

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export default function MaintenanceSlaDashboard({ onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [workload, setWorkload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [sla, wl] = await Promise.all([getSlaSummary(), getTechnicianWorkload()]);
      setSummary(sla);
      setWorkload(wl);
    } catch (err) {
      console.error("Failed to load SLA dashboard:", err);
      setError("Failed to load the SLA dashboard. Please make sure you are logged in as a hospital.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await refreshSla();
      const [sla, wl] = await Promise.all([getSlaSummary(), getTechnicianWorkload()]);
      setSummary(sla);
      setWorkload(wl);
    } catch (err) {
      setError("Failed to refresh SLA state.");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading SLA dashboard...</div>;
  }

  const cards = summary
    ? [
        { label: "Upcoming", value: summary.upcoming ?? 0, color: "text-blue-600" },
        { label: "Warning", value: summary.warning ?? 0, color: "text-amber-600" },
        { label: "Breached", value: summary.breached ?? 0, color: "text-red-600" },
        { label: "Escalated", value: summary.escalated ?? 0, color: "text-purple-600" },
      ]
    : [];

  const slaLists = summary
    ? [
        { key: "warningTasks", label: "Warning", color: "amber" },
        { key: "breachedTasks", label: "Breached", color: "red" },
        { key: "escalatedTasks", label: "Escalated", color: "purple" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-card border-b border-subtle sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-primary">SLA & Compliance Dashboard</h1>
              <p className="text-sm text-secondary mt-1">Service-level health and technician workload</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onNavigate("maintenance-rules")}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg shadow-sm transition-colors border border-subtle cursor-pointer"
              >
                Rules
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {refreshing ? "Refreshing..." : "Recompute SLA"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-100 text-red-800 text-sm font-medium border border-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {cards.map((card) => (
            <div key={card.label} className="bg-card rounded-xl shadow-sm border border-subtle p-5">
              <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
              <div className="text-xs font-semibold text-secondary uppercase tracking-wider mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-card rounded-xl shadow-sm border border-subtle p-5">
              <div className="text-3xl font-bold text-green-600">{summary.completedOnTime ?? 0}</div>
              <div className="text-xs font-semibold text-secondary uppercase tracking-wider mt-1">Completed On Time</div>
            </div>
            <div className="bg-card rounded-xl shadow-sm border border-subtle p-5">
              <div className="text-3xl font-bold text-red-600">{summary.completedLate ?? 0}</div>
              <div className="text-xs font-semibold text-secondary uppercase tracking-wider mt-1">Completed Late</div>
            </div>
            <div className="bg-card rounded-xl shadow-sm border border-subtle p-5">
              <div className="text-3xl font-bold text-teal-600">{summary.complianceRate ?? 0}%</div>
              <div className="text-xs font-semibold text-secondary uppercase tracking-wider mt-1">Compliance Rate</div>
            </div>
          </div>
        )}

        {workload && workload.technicians?.length > 0 && (
          <div className="mb-8 bg-card rounded-xl shadow-sm border border-subtle p-6">
            <h2 className="text-lg font-bold text-primary mb-4">Technician Workload</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workload.technicians.map((tech) => (
                <div key={tech.technicianId} className="p-4 rounded-lg bg-surface border border-subtle">
                  <div className="font-medium text-primary text-sm truncate">{tech.technicianEmail}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${tech.openTasks >= 5 ? "bg-red-500" : tech.openTasks >= 3 ? "bg-amber-500" : "bg-teal-500"}`}
                        style={{ width: `${Math.min(100, (tech.openTasks / 10) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-secondary">{tech.openTasks} open</span>
                  </div>
                </div>
              ))}
            </div>

            {workload.suggestions?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-md font-bold text-primary mb-3">Suggested Assignments</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-subtle">
                    <thead className="bg-surface border-b border-subtle">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-bold text-secondary uppercase tracking-wider">Task</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-secondary uppercase tracking-wider">Equipment</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-secondary uppercase tracking-wider">Priority</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-secondary uppercase tracking-wider">Deadline</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-secondary uppercase tracking-wider">Suggested Technician</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-secondary uppercase tracking-wider">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle bg-card">
                      {workload.suggestions.map((suggestion) => (
                        <tr key={suggestion.taskId} className="hover:bg-hover transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-primary whitespace-nowrap">{suggestion.taskCode}</td>
                          <td className="px-4 py-3 text-sm text-secondary">{suggestion.equipment}</td>
                          <td className="px-4 py-3 text-sm text-secondary whitespace-nowrap">{suggestion.priority}</td>
                          <td className="px-4 py-3 text-sm text-secondary whitespace-nowrap">{formatDate(suggestion.deadline)}</td>
                          <td className="px-4 py-3 text-sm text-secondary whitespace-nowrap">
                            {suggestion.suggestedTechnicianEmail}
                            <span className="ml-1 text-xs text-secondary">
                              ({suggestion.suggestedTechnicianOpenTasks} open)
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-secondary">{suggestion.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {slaLists.map((section) => {
          const tasks = summary?.[section.key] || [];
          if (tasks.length === 0) return null;
          return (
            <div key={section.key} className="mb-8 bg-card rounded-xl shadow-sm border border-subtle p-6">
              <h2 className={`text-lg font-bold mb-4 ${
                section.color === "red" ? "text-red-600" : section.color === "amber" ? "text-amber-600" : "text-purple-600"
              }`}>
                {section.label} Tasks
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-subtle">
                  <thead className="bg-surface border-b border-subtle">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-bold text-secondary uppercase tracking-wider">Task</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-secondary uppercase tracking-wider">Equipment</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-secondary uppercase tracking-wider">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-secondary uppercase tracking-wider">Priority</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-secondary uppercase tracking-wider">Deadline</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-secondary uppercase tracking-wider">SLA State</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-secondary uppercase tracking-wider">Escalated To</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle bg-card">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-hover transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-primary whitespace-nowrap">{task.taskCode}</td>
                        <td className="px-4 py-3 text-sm text-secondary">{task.equipment}</td>
                        <td className="px-4 py-3 text-sm text-secondary">{task.maintenanceType}</td>
                        <td className="px-4 py-3 text-sm text-secondary whitespace-nowrap">{task.priority}</td>
                        <td className="px-4 py-3 text-sm text-secondary whitespace-nowrap">{formatDate(task.deadline)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                            SLA_COLORS[slaName(task.slaState)] || SLA_COLORS.Upcoming
                          }`}>
                            {slaName(task.slaState)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-secondary whitespace-nowrap">{task.escalatedTo || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
