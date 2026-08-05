// src/pages/hospital/EquipmentLifecyclePredictor.jsx
import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  AlertTriangle,
  TrendingDown,
  Clock,
  DollarSign,
  Search,
  Filter,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Zap,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

/* Demo Equipment Lifecycle Dataset */
const DEMO_LIFECYCLE_DATA = [
  {
    id: 'EQ-1001',
    name: 'MRI Scanner 3T Signature',
    category: 'IMAGING',
    department: 'Radiology',
    purchaseDate: '2017-03-15',
    expectedLifespanYears: 10,
    ageYears: 7.4,
    healthIndex: 42, // %
    failureProbability: 78, // %
    mtbfHours: 420,
    maintenanceCount: 14,
    estimatedReplacementCost: 450000,
    riskTier: 'HIGH_RISK', // 'LOW_RISK' | 'MODERATE' | 'HIGH_RISK' | 'CRITICAL'
    rulMonths: 8,
    lastCalibrated: '2023-11-10',
    recommendation: 'Plan procurement replacement within 2 quarters. High compressor wear.',
  },
  {
    id: 'EQ-1002',
    name: 'Ventilator Servo-U ICU',
    category: 'RESPIRATORY',
    department: 'Intensive Care Unit (ICU)',
    purchaseDate: '2020-06-20',
    expectedLifespanYears: 7,
    ageYears: 4.1,
    healthIndex: 84,
    failureProbability: 12,
    mtbfHours: 1250,
    maintenanceCount: 4,
    estimatedReplacementCost: 35000,
    riskTier: 'LOW_RISK',
    rulMonths: 35,
    lastCalibrated: '2023-12-01',
    recommendation: 'Optimal operating condition. Perform routine preventive maintenance.',
  },
  {
    id: 'EQ-1003',
    name: 'CT Scanner Revolution 128-Slice',
    category: 'IMAGING',
    department: 'Radiology',
    purchaseDate: '2016-01-10',
    expectedLifespanYears: 8,
    ageYears: 8.6,
    healthIndex: 28,
    failureProbability: 92,
    mtbfHours: 180,
    maintenanceCount: 22,
    estimatedReplacementCost: 380000,
    riskTier: 'CRITICAL',
    rulMonths: 2,
    lastCalibrated: '2023-10-05',
    recommendation: 'X-ray tube at end of life. Urgent replacement requisition advised.',
  },
  {
    id: 'EQ-1004',
    name: 'Anesthesia Workstation Primus',
    category: 'SURGICAL',
    department: 'Operating Room 2',
    purchaseDate: '2019-09-12',
    expectedLifespanYears: 9,
    ageYears: 4.9,
    healthIndex: 68,
    failureProbability: 34,
    mtbfHours: 850,
    maintenanceCount: 7,
    estimatedReplacementCost: 65000,
    riskTier: 'MODERATE',
    rulMonths: 22,
    lastCalibrated: '2023-11-22',
    recommendation: 'Vaporizer flow sensor calibration recommended next month.',
  },
  {
    id: 'EQ-1005',
    name: 'Patient Monitor IntelliVue MX800',
    category: 'MONITORING',
    department: 'Cardiology',
    purchaseDate: '2021-04-05',
    expectedLifespanYears: 6,
    ageYears: 3.3,
    healthIndex: 91,
    failureProbability: 8,
    mtbfHours: 1800,
    maintenanceCount: 2,
    estimatedReplacementCost: 18000,
    riskTier: 'LOW_RISK',
    rulMonths: 32,
    lastCalibrated: '2023-12-10',
    recommendation: 'Excellent status. All telemetry metrics operating nominal.',
  },
  {
    id: 'EQ-1006',
    name: 'Haemodialysis Machine 5008S',
    category: 'LABORATORY',
    department: 'Nephrology',
    purchaseDate: '2018-11-30',
    expectedLifespanYears: 7,
    ageYears: 5.7,
    healthIndex: 51,
    failureProbability: 64,
    mtbfHours: 520,
    maintenanceCount: 11,
    estimatedReplacementCost: 42000,
    riskTier: 'MODERATE',
    rulMonths: 14,
    lastCalibrated: '2023-11-18',
    recommendation: 'Hydraulic blood pump seal showing initial degradation.',
  },
];

export default function EquipmentLifecyclePredictor({ onNavigate }) {
  const { user } = useAuth();
  const [data, setData] = useState(DEMO_LIFECYCLE_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedItemModal, setSelectedItemModal] = useState(null);

  // Departments List
  const departmentsList = useMemo(() => {
    const set = new Set();
    data.forEach((d) => set.add(d.department));
    return Array.from(set);
  }, [data]);

  // Filtered Equipment Data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRisk = selectedRisk === 'ALL' || item.riskTier === selectedRisk;
      const matchesDept = selectedDepartment === 'ALL' || item.department === selectedDepartment;

      return matchesSearch && matchesRisk && matchesDept;
    });
  }, [data, searchQuery, selectedRisk, selectedDepartment]);

  // Metrics
  const metrics = useMemo(() => {
    const total = data.length;
    const criticalCount = data.filter((d) => d.riskTier === 'CRITICAL' || d.riskTier === 'HIGH_RISK').length;
    const avgHealth = Math.round(data.reduce((acc, d) => acc + d.healthIndex, 0) / (total || 1));
    const totalReplacementBudget = data
      .filter((d) => d.riskTier === 'CRITICAL' || d.riskTier === 'HIGH_RISK')
      .reduce((acc, d) => acc + d.estimatedReplacementCost, 0);

    return { total, criticalCount, avgHealth, totalReplacementBudget };
  }, [data]);

  const riskBadgeStyle = (tier) => {
    switch (tier) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300';
      case 'HIGH_RISK':
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300';
      case 'MODERATE':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300';
      default:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300';
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedRisk('ALL');
    setSelectedDepartment('ALL');
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-card border-b border-subtle sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-600 rounded-lg text-white shadow-md">
                  <Activity className="w-5 h-5" />
                </span>
                <h1 className="text-xl font-bold text-primary">Equipment Lifecycle & Predictive Failure Analytics</h1>
              </div>
              <p className="text-sm text-secondary mt-1">
                AI-driven Remaining Useful Life (RUL) estimation & replacement capital budgeting
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onNavigate && onNavigate('equipment')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg shadow-sm border border-subtle transition cursor-pointer"
              >
                Inventory List
              </button>
              <button
                onClick={() => onNavigate && onNavigate('request-equipment')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1"
              >
                + Capital Request
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-card rounded-2xl border border-subtle shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center justify-between">
              Monitored Fleet <Layers className="w-4 h-4 text-indigo-500" />
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-primary">{metrics.total}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                100% Active
              </span>
            </div>
          </div>

          <div className="p-4 bg-card rounded-2xl border border-subtle shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center justify-between">
              Replacement Due <AlertTriangle className="w-4 h-4 text-rose-500" />
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-rose-600">{metrics.criticalCount}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-600">
                High Priority
              </span>
            </div>
          </div>

          <div className="p-4 bg-card rounded-2xl border border-subtle shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center justify-between">
              Fleet Health Index <Activity className="w-4 h-4 text-emerald-500" />
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-primary">{metrics.avgHealth}%</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                Nominal
              </span>
            </div>
          </div>

          <div className="p-4 bg-card rounded-2xl border border-subtle shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center justify-between">
              Est. CapEx Needed <DollarSign className="w-4 h-4 text-amber-500" />
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-primary">
                ${(metrics.totalReplacementBudget / 1000).toFixed(0)}k
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600">
                Next 2Q
              </span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-card p-4 rounded-xl border border-subtle shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by equipment name, ID, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-surface border border-subtle rounded-lg text-primary focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="px-3 py-2 bg-surface border border-subtle rounded-lg text-secondary font-medium"
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="CRITICAL">Critical (End of Life)</option>
              <option value="HIGH_RISK">High Risk (&lt;12 mo RUL)</option>
              <option value="MODERATE">Moderate Risk</option>
              <option value="LOW_RISK">Low Risk (Healthy)</option>
            </select>

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 bg-surface border border-subtle rounded-lg text-secondary font-medium"
            >
              <option value="ALL">All Departments</option>
              {departmentsList.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {(searchQuery || selectedRisk !== 'ALL' || selectedDepartment !== 'ALL') && (
              <button
                onClick={handleReset}
                className="px-3 py-2 text-secondary hover:bg-hover border border-subtle rounded-lg transition flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Equipment Lifecycle Table */}
        <div className="bg-card rounded-2xl border border-subtle shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-subtle">
              <thead className="bg-surface border-b border-subtle">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Equipment</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Age / Span</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Health Index</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Est. RUL</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Risk Tier</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Est. CapEx</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle bg-card">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-16 text-secondary">
                      <div className="flex flex-col items-center">
                        <Activity className="w-8 h-8 text-slate-300 mb-2" />
                        <p className="font-bold">No lifecycle analytics match your criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItemModal(item)}
                      className="hover:bg-hover transition cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-primary text-sm">{item.name}</div>
                        <div className="text-xs text-secondary font-mono">{item.id} · {item.category}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-secondary font-medium">
                        {item.department}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-secondary font-mono">
                        {item.ageYears} yrs / {item.expectedLifespanYears} yrs
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.healthIndex < 40 ? 'bg-rose-500' : item.healthIndex < 70 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${item.healthIndex}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-primary">{item.healthIndex}%</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-primary">
                        {item.rulMonths} months
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border ${riskBadgeStyle(item.riskTier)}`}>
                          {item.riskTier.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-primary">
                        ${item.estimatedReplacementCost.toLocaleString()}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItemModal(item);
                          }}
                          className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold rounded-lg border border-indigo-200 flex items-center gap-1 transition"
                        >
                          Inspect <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Item Inspection & Failure Prediction Modal */}
      {selectedItemModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-subtle space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-subtle">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-500">{selectedItemModal.id}</span>
                <h3 className="text-lg font-bold text-primary mt-0.5">{selectedItemModal.name}</h3>
              </div>
              <button
                onClick={() => setSelectedItemModal(null)}
                className="p-1 text-secondary hover:text-primary rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-surface rounded-xl border border-subtle space-y-2 text-xs">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 block uppercase tracking-wider">
                AI Recommendation
              </span>
              <p className="text-primary font-medium">{selectedItemModal.recommendation}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-surface rounded-xl border border-subtle">
                <span className="text-secondary block font-medium">Failure Probability</span>
                <span className="text-lg font-black text-rose-600">{selectedItemModal.failureProbability}%</span>
              </div>
              <div className="p-3 bg-surface rounded-xl border border-subtle">
                <span className="text-secondary block font-medium">MTBF Metric</span>
                <span className="text-lg font-black text-primary">{selectedItemModal.mtbfHours} hrs</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-subtle">
              <button
                onClick={() => setSelectedItemModal(null)}
                className="px-4 py-2 text-xs font-semibold text-secondary hover:bg-hover rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedItemModal(null);
                  onNavigate && onNavigate('request-equipment');
                }}
                className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md flex items-center gap-1"
              >
                Requisition Replacement <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
