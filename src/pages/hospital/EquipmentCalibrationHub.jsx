import React, { useState, useMemo } from 'react';
import { 
  Award, CheckCircle2, AlertTriangle, XCircle, Clock, ShieldCheck, 
  Search, Filter, Plus, FileCheck, RefreshCw, Calendar, ArrowUpRight, 
  ChevronRight, Activity, Cpu, AlertCircle, FileText, Download, Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const INITIAL_CALIBRATION_RECORDS = [
  {
    id: "CAL-2026-001",
    equipmentId: "EQ-1001",
    equipmentName: "GE Revolution CT Scanner",
    category: "Radiology",
    location: "Imaging Bay 3",
    lastCalibrated: "2026-06-15",
    nextDueDate: "2026-12-15",
    certificateNo: "CERT-FDA-88421",
    inspector: "Dr. Aris Thorne (Certified BioMed Tech)",
    status: "Compliant",
    deviationPercentage: 0.12,
    toleranceRange: "± 0.50%",
    regulatoryStandard: "FDA 21 CFR Part 820",
  },
  {
    id: "CAL-2026-002",
    equipmentId: "EQ-1004",
    equipmentName: "Philips IntelliVue Patient Monitor",
    category: "ICU / Critical Care",
    location: "ICU Bed 08",
    lastCalibrated: "2026-07-10",
    nextDueDate: "2026-08-25",
    certificateNo: "CERT-ISO-33920",
    inspector: "Sarah Miller (Senior Inspector)",
    status: "Expiring Soon",
    deviationPercentage: 0.38,
    toleranceRange: "± 0.50%",
    regulatoryStandard: "ISO 13485:2016",
  },
  {
    id: "CAL-2026-003",
    equipmentId: "EQ-1009",
    equipmentName: "Medtronic PB980 Ventilator",
    category: "Respiratory",
    location: "ICU Bed 12",
    lastCalibrated: "2025-08-01",
    nextDueDate: "2026-08-01",
    certificateNo: "CERT-JCAHO-1194",
    inspector: "Robert Vance (Biomedical Lead)",
    status: "Overdue",
    deviationPercentage: 0.84,
    toleranceRange: "± 0.40%",
    regulatoryStandard: "Joint Commission Compliance",
  },
  {
    id: "CAL-2026-004",
    equipmentId: "EQ-1012",
    equipmentName: "Siemens Magnetom MRI 3T",
    category: "Radiology",
    location: "MRI Suite A",
    lastCalibrated: "2026-05-20",
    nextDueDate: "2027-05-20",
    certificateNo: "CERT-FDA-99201",
    inspector: "Dr. Aris Thorne",
    status: "Compliant",
    deviationPercentage: 0.05,
    toleranceRange: "± 0.25%",
    regulatoryStandard: "FDA 21 CFR Part 820",
  },
  {
    id: "CAL-2026-005",
    equipmentId: "EQ-1018",
    equipmentName: "Zoll R Series Defibrillator",
    category: "Emergency",
    location: "ER Crash Cart #2",
    lastCalibrated: "2026-07-28",
    nextDueDate: "2026-08-28",
    certificateNo: "CERT-ECRI-55102",
    inspector: "Emily Watson",
    status: "Expiring Soon",
    deviationPercentage: 0.21,
    toleranceRange: "± 0.30%",
    regulatoryStandard: "ECRI Biomedical Standard",
  },
  {
    id: "CAL-2026-006",
    equipmentId: "EQ-1022",
    equipmentName: "Baxter Spectrum IQ Infusion Pump",
    category: "General Ward",
    location: "Ward 4B",
    lastCalibrated: "2026-01-10",
    nextDueDate: "2026-07-10",
    certificateNo: "CERT-ISO-11209",
    inspector: "Michael Chang",
    status: "Non-Compliant",
    deviationPercentage: 1.15,
    toleranceRange: "± 0.50%",
    regulatoryStandard: "ISO 13485:2016",
  }
];

export default function EquipmentCalibrationHub({ onNavigate }) {
  const { user } = useAuth();
  const [records, setRecords] = useState(INITIAL_CALIBRATION_RECORDS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // New Calibration Entry Form State
  const [formData, setFormData] = useState({
    equipmentId: "",
    equipmentName: "",
    category: "Radiology",
    location: "",
    toleranceRange: "± 0.50%",
    measuredValue: "",
    referenceValue: "",
    inspector: user?.name || "Biomedical Specialist",
    regulatoryStandard: "ISO 13485:2016"
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Metrics Calculation
  const metrics = useMemo(() => {
    const total = records.length;
    const compliant = records.filter(r => r.status === "Compliant").length;
    const expiringSoon = records.filter(r => r.status === "Expiring Soon").length;
    const overdue = records.filter(r => r.status === "Overdue" || r.status === "Non-Compliant").length;
    const rate = total > 0 ? Math.round((compliant / total) * 100) : 100;
    return { total, compliant, expiringSoon, overdue, rate };
  }, [records]);

  // Filtering Logic
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesSearch = 
        r.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.equipmentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.certificateNo.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
      const matchesCategory = categoryFilter === "ALL" || r.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [records, searchQuery, statusFilter, categoryFilter]);

  const handleRegisterCalibration = (e) => {
    e.preventDefault();
    if (!formData.equipmentName || !formData.measuredValue || !formData.referenceValue) {
      showToast("Please complete all required calibration measurement fields.");
      return;
    }

    const measured = parseFloat(formData.measuredValue);
    const reference = parseFloat(formData.referenceValue);
    const devPct = Math.abs(((measured - reference) / reference) * 100).toFixed(2);
    const isWithin = parseFloat(devPct) <= 0.50;

    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const dueDate = nextYear.toISOString().split('T')[0];

    const newRecord = {
      id: `CAL-2026-0${records.length + 1}`,
      equipmentId: formData.equipmentId || `EQ-${Math.floor(1000 + Math.random() * 9000)}`,
      equipmentName: formData.equipmentName,
      category: formData.category,
      location: formData.location || "Central BioMed Lab",
      lastCalibrated: today,
      nextDueDate: dueDate,
      certificateNo: `CERT-AUT-${Math.floor(10000 + Math.random() * 90000)}`,
      inspector: formData.inspector,
      status: isWithin ? "Compliant" : "Non-Compliant",
      deviationPercentage: parseFloat(devPct),
      toleranceRange: formData.toleranceRange,
      regulatoryStandard: formData.regulatoryStandard,
    };

    setRecords([newRecord, ...records]);
    setIsModalOpen(false);
    showToast(`Calibration certificate ${newRecord.certificateNo} successfully registered (${newRecord.status})!`);
    setFormData({
      equipmentId: "",
      equipmentName: "",
      category: "Radiology",
      location: "",
      toleranceRange: "± 0.50%",
      measuredValue: "",
      referenceValue: "",
      inspector: user?.name || "Biomedical Specialist",
      regulatoryStandard: "ISO 13485:2016"
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Compliant":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={13} className="text-emerald-600" /> Compliant
          </span>
        );
      case "Expiring Soon":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={13} className="text-amber-600" /> Expiring Soon
          </span>
        );
      case "Overdue":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle size={13} className="text-rose-600" /> Recalibration Overdue
          </span>
        );
      case "Non-Compliant":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
            <XCircle size={13} className="text-red-600" /> Non-Compliant
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-10 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <ShieldCheck size={20} className="text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
              <Award size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                Equipment Calibration & Compliance Hub
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                FDA 21 CFR & ISO 13485 Regulatory Assurance, Tolerance Testing & Audit Verification
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-all duration-200 active:scale-95"
          >
            <Plus size={18} /> Record Calibration Test
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Tracked Assets</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{metrics.total}</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">100% Audit Coverage</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Cpu size={26} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Overall Compliance Rate</p>
            <h3 className="text-3xl font-black text-emerald-600 mt-1">{metrics.rate}%</h3>
            <p className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1">
              <ShieldCheck size={14} /> Regulatory Compliant
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={26} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Expiring in 30 Days</p>
            <h3 className="text-3xl font-black text-amber-600 mt-1">{metrics.expiringSoon}</h3>
            <p className="text-xs font-medium text-amber-600 mt-1">Action Required Soon</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={26} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Overdue / Non-Compliant</p>
            <h3 className="text-3xl font-black text-rose-600 mt-1">{metrics.overdue}</h3>
            <p className="text-xs font-medium text-rose-600 mt-1">Immediate Safety Action</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle size={26} />
          </div>
        </div>
      </div>

      {/* Filter and Control Studio Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by equipment name, asset ID, or certificate #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Preset Status Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {["ALL", "Compliant", "Expiring Soon", "Overdue", "Non-Compliant"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  statusFilter === status
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {status === "ALL" ? "All Statuses" : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calibration Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileCheck className="text-blue-600" size={20} />
            <h2 className="text-base font-bold text-slate-900">Active Equipment Calibration Ledger</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-lg">
            Showing {filteredRecords.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-5">Asset Info</th>
                <th className="py-3.5 px-5">Category & Location</th>
                <th className="py-3.5 px-5">Last Calibrated</th>
                <th className="py-3.5 px-5">Next Due Date</th>
                <th className="py-3.5 px-5">Tolerance / Dev %</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Certificate & Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No matching equipment calibration records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900">{r.equipmentName}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{r.equipmentId}</div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-medium text-slate-700">{r.category}</div>
                      <div className="text-xs text-slate-400">{r.location}</div>
                    </td>
                    <td className="py-4 px-5 font-medium text-slate-600">
                      {r.lastCalibrated}
                    </td>
                    <td className="py-4 px-5 font-semibold text-slate-800">
                      {r.nextDueDate}
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-xs font-semibold text-slate-700">
                        Dev: <span className={r.deviationPercentage > 0.50 ? "text-rose-600 font-bold" : "text-emerald-600"}>{r.deviationPercentage}%</span>
                      </div>
                      <div className="text-xs text-slate-400">Limit: {r.toleranceRange}</div>
                    </td>
                    <td className="py-4 px-5">
                      {getStatusBadge(r.status)}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => setSelectedRecord(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all border border-blue-200"
                      >
                        <FileText size={14} /> Audit Certificate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Calibration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-xl">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">Record New Calibration Test</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterCalibration} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Equipment Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alaris Infusion Pump 8100"
                  value={formData.equipmentName}
                  onChange={(e) => setFormData({ ...formData, equipmentName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Equipment ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EQ-9042"
                    value={formData.equipmentId}
                    onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                  >
                    <option value="Radiology">Radiology</option>
                    <option value="ICU / Critical Care">ICU / Critical Care</option>
                    <option value="Respiratory">Respiratory</option>
                    <option value="Emergency">Emergency</option>
                    <option value="General Ward">General Ward</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Reference Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 100.0"
                    value={formData.referenceValue}
                    onChange={(e) => setFormData({ ...formData, referenceValue: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Measured Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 100.12"
                    value={formData.measuredValue}
                    onChange={(e) => setFormData({ ...formData, measuredValue: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Regulatory Standard
                </label>
                <select
                  value={formData.regulatoryStandard}
                  onChange={(e) => setFormData({ ...formData, regulatoryStandard: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                >
                  <option value="FDA 21 CFR Part 820">FDA 21 CFR Part 820</option>
                  <option value="ISO 13485:2016">ISO 13485:2016 Medical Devices</option>
                  <option value="Joint Commission Compliance">Joint Commission Medical Standard</option>
                  <option value="ECRI Biomedical Standard">ECRI Biomedical Standard</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all active:scale-95"
                >
                  Calculate & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Audit Certificate Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award size={24} className="text-amber-400" />
                <div>
                  <h3 className="text-base font-extrabold">Calibration Certificate</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedRecord.certificateNo}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">Equipment Name:</span>
                  <span className="font-bold text-slate-900">{selectedRecord.equipmentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">Asset ID:</span>
                  <span className="font-mono text-slate-800">{selectedRecord.equipmentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">Standard:</span>
                  <span className="font-medium text-slate-800">{selectedRecord.regulatoryStandard}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Last Calibrated:</span>
                  <span className="font-semibold text-slate-800">{selectedRecord.lastCalibrated}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Next Expiration Date:</span>
                  <span className="font-semibold text-slate-800">{selectedRecord.nextDueDate}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Max Deviation Tolerance:</span>
                  <span className="font-semibold text-slate-800">{selectedRecord.toleranceRange}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Measured Deviation:</span>
                  <span className="font-bold text-emerald-600">{selectedRecord.deviationPercentage}%</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Certified Inspector:</span>
                  <span className="font-medium text-slate-800">{selectedRecord.inspector}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all"
              >
                Close Certificate View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
