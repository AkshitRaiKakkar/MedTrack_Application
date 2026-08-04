import React, { useState, useMemo } from 'react';
import { 
  TrendingDown, AlertTriangle, ShieldAlert, DollarSign, Calendar, 
  Activity, Search, Filter, RefreshCw, ArrowUpRight, BarChart2, 
  Sliders, ShieldCheck, Clock, CheckCircle2, ChevronRight, Download, Cpu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const INITIAL_FLEET_DATA = [
  {
    id: "EQ-1001",
    name: "Siemens Somatom CT Scanner 64",
    department: "Radiology",
    purchaseDate: "2016-04-12",
    purchaseCost: 750000,
    expectedLifespanYears: 10,
    currentAgeYears: 10.3,
    accumulatedMaintenanceCost: 285000,
    failureIncidentsCount: 14,
    riskLevel: "Critical EOL Risk",
    riskScore: 92,
    recommendedAction: "Immediate Capital Replacement",
    tcoRatio: 1.38,
  },
  {
    id: "EQ-1004",
    name: "GE Signa Pioneer MRI 3.0T",
    department: "Radiology",
    purchaseDate: "2018-09-20",
    purchaseCost: 1200000,
    expectedLifespanYears: 12,
    currentAgeYears: 7.9,
    accumulatedMaintenanceCost: 310000,
    failureIncidentsCount: 6,
    riskLevel: "Moderate Risk",
    riskScore: 58,
    recommendedAction: "Schedule Component Refurbishment",
    tcoRatio: 1.25,
  },
  {
    id: "EQ-1009",
    name: "Puritan Bennett 980 Ventilator Fleet (x5)",
    department: "ICU / Critical Care",
    purchaseDate: "2017-02-15",
    purchaseCost: 180000,
    expectedLifespanYears: 8,
    currentAgeYears: 9.5,
    accumulatedMaintenanceCost: 115000,
    failureIncidentsCount: 21,
    riskLevel: "Critical EOL Risk",
    riskScore: 88,
    recommendedAction: "Planned Replacement Q1 2027",
    tcoRatio: 1.64,
  },
  {
    id: "EQ-1012",
    name: "Philips Azurion Cardiac Cath Lab",
    department: "Cardiology",
    purchaseDate: "2021-11-05",
    purchaseCost: 950000,
    expectedLifespanYears: 10,
    currentAgeYears: 4.7,
    accumulatedMaintenanceCost: 82000,
    failureIncidentsCount: 2,
    riskLevel: "Healthy Fleet",
    riskScore: 18,
    recommendedAction: "Routine Preventive Maintenance",
    tcoRatio: 1.08,
  },
  {
    id: "EQ-1018",
    name: "Stryker System 8 Surgical Power Tools",
    department: "Surgical Suite",
    purchaseDate: "2019-06-30",
    purchaseCost: 140000,
    expectedLifespanYears: 7,
    currentAgeYears: 7.1,
    accumulatedMaintenanceCost: 78000,
    failureIncidentsCount: 9,
    riskLevel: "Critical EOL Risk",
    riskScore: 84,
    recommendedAction: "Initiate Trade-in Procurement",
    tcoRatio: 1.55,
  },
  {
    id: "EQ-1025",
    name: "Mindray BeneVision N22 Patient Monitors",
    department: "Emergency",
    purchaseDate: "2022-03-14",
    purchaseCost: 210000,
    expectedLifespanYears: 8,
    currentAgeYears: 4.4,
    accumulatedMaintenanceCost: 24000,
    failureIncidentsCount: 1,
    riskLevel: "Healthy Fleet",
    riskScore: 22,
    recommendedAction: "Routine Calibration",
    tcoRatio: 1.11,
  }
];

export default function EquipmentLifecyclePredictor({ onNavigate }) {
  const { user } = useAuth();
  const [fleet, setFleet] = useState(INITIAL_FLEET_DATA);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // EOL Simulation Parameters
  const [inflationRate, setInflationRate] = useState(3.5);
  const [usageMultiplier, setUsageMultiplier] = useState(1.1);

  const showToast = (text) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Derived KPI Metrics
  const metrics = useMemo(() => {
    const totalAssets = fleet.length;
    const totalCapValue = fleet.reduce((acc, f) => acc + f.purchaseCost, 0);
    const criticalEolCount = fleet.filter(f => f.riskLevel === "Critical EOL Risk").length;
    const avgRiskScore = Math.round(fleet.reduce((acc, f) => acc + f.riskScore, 0) / (totalAssets || 1));

    // Simulated 3-Year Capital Replacement Budget requirement
    const simulatedReplacementCost = fleet
      .filter(f => f.riskLevel === "Critical EOL Risk" || f.riskLevel === "Moderate Risk")
      .reduce((acc, f) => acc + (f.purchaseCost * (1 + (inflationRate / 100) * 3) * usageMultiplier), 0);

    return {
      totalAssets,
      totalCapValue,
      criticalEolCount,
      avgRiskScore,
      simulatedReplacementCost: Math.round(simulatedReplacementCost)
    };
  }, [fleet, inflationRate, usageMultiplier]);

  // Filtering Logic
  const filteredFleet = useMemo(() => {
    return fleet.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRisk = riskFilter === "ALL" || item.riskLevel === riskFilter;
      const matchesDept = deptFilter === "ALL" || item.department === deptFilter;

      return matchesSearch && matchesRisk && matchesDept;
    });
  }, [fleet, searchQuery, riskFilter, deptFilter]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const getRiskBadge = (level, score) => {
    switch (level) {
      case "Critical EOL Risk":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle size={13} className="text-rose-600" /> Critical ({score}/100)
          </span>
        );
      case "Moderate Risk":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock size={13} className="text-amber-600" /> Moderate ({score}/100)
          </span>
        );
      case "Healthy Fleet":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 size={13} className="text-emerald-600" /> Healthy ({score}/100)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-10 space-y-8">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <ShieldCheck size={20} className="text-blue-400" />
          <span className="text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
              <TrendingDown size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                Equipment Lifecycle & Replacement Risk Predictor
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                Total Cost of Ownership (TCO) Analytics, End-of-Life (EOL) Forecasting & Capital Replacement Simulator
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => showToast("Capital Replacement Audit Exported to Financial Planning Ledger.")}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-all active:scale-95"
          >
            <Download size={18} /> Export Budget Forecast
          </button>
        </div>
      </div>

      {/* Overview KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Fleet Capital Value</p>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">{formatCurrency(metrics.totalCapValue)}</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">{metrics.totalAssets} Active Capital Assets</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <DollarSign size={26} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Critical EOL Risk Count</p>
            <h3 className="text-2xl md:text-3xl font-black text-rose-600 mt-1">{metrics.criticalEolCount} Assets</h3>
            <p className="text-xs font-medium text-rose-600 mt-1 flex items-center gap-1">
              <ShieldAlert size={14} /> Immediate Action Urged
            </p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle size={26} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">3-Year Capital Replacement</p>
            <h3 className="text-2xl md:text-3xl font-black text-amber-600 mt-1">{formatCurrency(metrics.simulatedReplacementCost)}</h3>
            <p className="text-xs font-medium text-amber-600 mt-1">Inflation & Usage Adjusted</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <BarChart2 size={26} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Fleet Risk Score</p>
            <h3 className="text-2xl md:text-3xl font-black text-slate-800 mt-1">{metrics.avgRiskScore} / 100</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">Fleet Degradation Index</p>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <Activity size={26} />
          </div>
        </div>
      </div>

      {/* Simulator Parameters Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sliders size={20} className="text-indigo-600" />
          <h2 className="text-base font-extrabold text-slate-900">Capital Replacement Financial Simulator</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Annual Capital Inflation Rate (%)</span>
              <span className="text-indigo-600">{inflationRate}%</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="10.0"
              step="0.5"
              value={inflationRate}
              onChange={(e) => setInflationRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <p className="text-xs text-slate-400 mt-1">Simulates medical equipment procurement cost inflation over time.</p>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Hospital Duty Cycle / Utilization Multiplier</span>
              <span className="text-indigo-600">{usageMultiplier}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="2.0"
              step="0.1"
              value={usageMultiplier}
              onChange={(e) => setUsageMultiplier(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <p className="text-xs text-slate-400 mt-1">Adjusts wear-and-tear degradation based on ICU/Radiology usage intensity.</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by equipment name, ID, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {["ALL", "Critical EOL Risk", "Moderate Risk", "Healthy Fleet"].map((risk) => (
              <button
                key={risk}
                onClick={() => setRiskFilter(risk)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  riskFilter === risk
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {risk === "ALL" ? "All Risk Levels" : risk}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fleet Risk & Lifecycle Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Cpu className="text-indigo-600" size={20} />
            <h2 className="text-base font-bold text-slate-900">Capital Equipment Lifecycle & Risk Ledger</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-lg">
            Showing {filteredFleet.length} items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-5">Equipment & ID</th>
                <th className="py-3.5 px-5">Department</th>
                <th className="py-3.5 px-5">Age / Expected EOL</th>
                <th className="py-3.5 px-5">Purchase Price & Maint Spend</th>
                <th className="py-3.5 px-5">Risk Status</th>
                <th className="py-3.5 px-5">Recommended Capital Action</th>
                <th className="py-3.5 px-5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFleet.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No equipment lifecycle records match your current filter.
                  </td>
                </tr>
              ) : (
                filteredFleet.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{item.id}</div>
                    </td>
                    <td className="py-4 px-5 font-medium text-slate-700">
                      {item.department}
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-semibold text-slate-900">{item.currentAgeYears} yrs / {item.expectedLifespanYears} yrs</div>
                      <div className="text-xs text-slate-400">Purchased: {item.purchaseDate}</div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900">{formatCurrency(item.purchaseCost)}</div>
                      <div className="text-xs text-slate-500">Maint Spend: {formatCurrency(item.accumulatedMaintenanceCost)}</div>
                    </td>
                    <td className="py-4 px-5">
                      {getRiskBadge(item.riskLevel, item.riskScore)}
                    </td>
                    <td className="py-4 px-5 font-semibold text-slate-800">
                      {item.recommendedAction}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => setSelectedAsset(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all border border-indigo-200"
                      >
                        Inspect EOL <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset EOL Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldAlert size={24} className="text-amber-400" />
                <div>
                  <h3 className="text-base font-extrabold">{selectedAsset.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedAsset.id} • {selectedAsset.department}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">Risk Assessment Score:</span>
                  <span className="font-extrabold text-rose-600">{selectedAsset.riskScore} / 100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">Failure Incidents Logged:</span>
                  <span className="font-bold text-slate-800">{selectedAsset.failureIncidentsCount} Breakdown Events</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">TCO Ratio (Spend / Cost):</span>
                  <span className="font-bold text-slate-800">{selectedAsset.tcoRatio}x</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Original Purchase Cost:</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(selectedAsset.purchaseCost)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Accumulated Repair Cost:</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(selectedAsset.accumulatedMaintenanceCost)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Estimated Replacement Cost:</span>
                  <span className="font-extrabold text-indigo-600">
                    {formatCurrency(Math.round(selectedAsset.purchaseCost * (1 + (inflationRate / 100) * 3) * usageMultiplier))}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setSelectedAsset(null)}
                className="px-4 py-2 bg-slate-200 text-slate-800 font-bold text-xs rounded-xl hover:bg-slate-300 transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  showToast(`Replacement request queued for ${selectedAsset.name}.`);
                  setSelectedAsset(null);
                }}
                className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-all"
              >
                Queue Capital Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
