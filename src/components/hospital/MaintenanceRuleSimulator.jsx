import React, { useState, useMemo } from 'react';
import { Calendar, Play, Clock, AlertTriangle, ShieldCheck, RefreshCw, X, ChevronRight } from 'lucide-react';

/**
 * MaintenanceRuleSimulator - Interactive recurrence forecast simulator.
 */
export const MaintenanceRuleSimulator = ({ rule, onClose, onGenerateTasks }) => {
  const [horizonMonths, setHorizonMonths] = useState(6); // 3, 6, or 12 months

  // Calculate forecasted due dates
  const forecast = useMemo(() => {
    if (!rule) return [];

    let intervalDays = 30; // default monthly
    if (rule.frequency === 'DAILY') intervalDays = 1;
    else if (rule.frequency === 'WEEKLY') intervalDays = 7;
    else if (rule.frequency === 'MONTHLY') intervalDays = 30;
    else if (rule.frequency === 'QUARTERLY') intervalDays = 90;
    else if (rule.frequency === 'YEARLY') intervalDays = 365;
    else if (rule.frequency === 'CUSTOM' && rule.customIntervalDays) {
      intervalDays = Number(rule.customIntervalDays);
    }

    const results = [];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + horizonMonths);

    let currentDate = new Date(startDate.getTime() + intervalDays * 24 * 3600 * 1000);

    let count = 1;
    while (currentDate <= endDate && count <= 24) {
      const dueDateStr = currentDate.toISOString().split('T')[0];

      // Calculate Lead Date (when task is generated)
      const leadDate = new Date(currentDate.getTime() - (rule.leadTimeDays || 7) * 24 * 3600 * 1000);
      // Calculate Warning Date (SLA warning)
      const warningDate = new Date(currentDate.getTime() - (rule.slaWarningDays || 3) * 24 * 3600 * 1000);
      // Calculate Breach Date (SLA breach)
      const breachDate = new Date(currentDate.getTime() + (rule.slaBreachDays || 1) * 24 * 3600 * 1000);

      results.push({
        cycle: count,
        dueDate: dueDateStr,
        leadDate: leadDate.toISOString().split('T')[0],
        warningDate: warningDate.toISOString().split('T')[0],
        breachDate: breachDate.toISOString().split('T')[0],
      });

      currentDate = new Date(currentDate.getTime() + intervalDays * 24 * 3600 * 1000);
      count++;
    }

    return results;
  }, [rule, horizonMonths]);

  if (!rule) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 rounded-lg">
                <Calendar className="w-4 h-4" />
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Rule Recurrence Simulator</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simulating projected maintenance dispatch dates for rule: <strong className="text-slate-800 dark:text-slate-200">{rule.name}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Forecast Horizon:</span>
          <div className="flex gap-1.5">
            {[3, 6, 12].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setHorizonMonths(m)}
                className={`px-3 py-1.5 font-bold rounded-lg transition ${
                  horizonMonths === m
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                }`}
              >
                {m} Months
              </button>
            ))}
          </div>
        </div>

        {/* Forecast Timeline Table */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {forecast.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-medium">
              No upcoming cycles found in selected horizon.
            </div>
          ) : (
            forecast.map((item) => (
              <div
                key={item.cycle}
                className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs hover:border-teal-400 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center text-[10px]">
                    #{item.cycle}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Due: {item.dueDate}</span>
                    <span className="text-[10px] text-slate-400">Generated on Lead Date: {item.leadDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 block">
                      Warning: {item.warningDate}
                    </span>
                    <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 block">
                      Breach: {item.breachDate}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Total Projected Cycles: <strong className="text-slate-900 dark:text-white">{forecast.length}</strong>
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Close
            </button>
            <button
              onClick={() => {
                onGenerateTasks && onGenerateTasks(rule);
                onClose();
              }}
              className="px-4 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-md flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Execute Task Generation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceRuleSimulator;
