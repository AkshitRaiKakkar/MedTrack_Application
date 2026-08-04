import React from 'react';
import { Calendar, CheckCircle2, Clock, AlertTriangle, Activity, Wrench } from 'lucide-react';

/**
 * MaintenanceSummaryCards - Metric badges displaying real-time maintenance KPI stats.
 */
export const MaintenanceSummaryCards = ({ tasks = [] }) => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
  const scheduled = tasks.filter((t) => t.status === 'Scheduled').length;
  const needsPartOrHold = tasks.filter((t) => t.status === 'Needs Part' || t.status === 'On Hold').length;
  const breachedOrWarning = tasks.filter((t) => t.slaState === 'Breached' || t.slaState === 'Warning').length;

  const cards = [
    {
      title: 'Total Tasks',
      value: total,
      icon: Activity,
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      badge: 'Active Workload',
    },
    {
      title: 'Scheduled',
      value: scheduled,
      icon: Calendar,
      color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
      badge: 'Upcoming',
    },
    {
      title: 'In Progress',
      value: inProgress,
      icon: Wrench,
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      badge: 'Underway',
    },
    {
      title: 'Needs Part / Hold',
      value: needsPartOrHold,
      icon: Clock,
      color: 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-800',
      badge: 'Pending Supply',
    },
    {
      title: 'Completed',
      value: completed,
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      badge: `${total ? Math.round((completed / total) * 100) : 0}% Done`,
    },
    {
      title: 'SLA Risk / Breached',
      value: breachedOrWarning,
      icon: AlertTriangle,
      color: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800',
      badge: 'Requires Focus',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`p-3.5 rounded-xl border transition-all duration-200 shadow-sm ${c.color} flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider opacity-80">{c.title}</span>
              <Icon className="w-4 h-4" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black">{c.value}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-white/60 dark:bg-black/20">
                {c.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MaintenanceSummaryCards;
