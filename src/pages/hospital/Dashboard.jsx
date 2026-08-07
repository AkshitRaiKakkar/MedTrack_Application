import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getAllEquipment } from "../../services/EquipmentService";
import { getAllTasks } from "../../services/MaintenanceService";
import {
  AlertTriangle,
  Award,
  Bell,
  Bot,
  Box,
  CheckCircle2,
  ChevronsUpDown,
  ClipboardList,
  Clock3,
  Download,
  HelpCircle,
  LayoutGrid,
  LineChart,
  Mail,
  MessageCircle,
  Puzzle,
  RefreshCw,
  Search,
  Settings,
  Share2,
  TrendingUp,
  Users,
  Wrench,
  Workflow,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import MedTrackLogo from "../../components/common/MedTrackLogo";

const DASHBOARD_DEMO_EQUIPMENT = [
  {
    id: "EQ-401",
    code: "EQ-401",
    name: "MRI Scanner",
    model: "GE Signa Voyager",
    department: "Radiology",
    category: "Imaging",
    status: "OPERATIONAL",
    warrantyStatus: "ACTIVE",
    warrantyExpiry: "2027-03-14",
    lastMaintenanceDate: "2026-07-18",
  },
  {
    id: "EQ-402",
    code: "EQ-402",
    name: "Ventilator Pro",
    model: "Philips V680",
    department: "ICU",
    category: "Critical Care",
    status: "NEEDS_MAINTENANCE",
    warrantyStatus: "EXPIRING_SOON",
    warrantyExpiry: "2026-09-01",
    lastMaintenanceDate: "2026-06-02",
  },
  {
    id: "EQ-403",
    code: "EQ-403",
    name: "Ultrasound Suite",
    model: "SonoSite PX",
    department: "Cardiology",
    category: "Imaging",
    status: "UNDER_MAINTENANCE",
    warrantyStatus: "ACTIVE",
    warrantyExpiry: "2027-01-19",
    lastMaintenanceDate: "2026-08-02",
  },
  {
    id: "EQ-404",
    code: "EQ-404",
    name: "Defibrillator",
    model: "Zoll R Series",
    department: "Emergency",
    category: "Resuscitation",
    status: "OPERATIONAL",
    warrantyStatus: "ACTIVE",
    warrantyExpiry: "2026-12-11",
    lastMaintenanceDate: "2026-07-25",
  },
  {
    id: "EQ-405",
    code: "EQ-405",
    name: "Infusion Pump",
    model: "Baxter Sigma Spectrum",
    department: "General Ward",
    category: "Infusion",
    status: "OUT_OF_SERVICE",
    warrantyStatus: "EXPIRED",
    warrantyExpiry: "2026-05-20",
    lastMaintenanceDate: "2026-05-09",
  },
  {
    id: "EQ-406",
    code: "EQ-406",
    name: "ECG Monitor",
    model: "GE MAC 5500",
    department: "Cardiology",
    category: "Monitoring",
    status: "OPERATIONAL",
    warrantyStatus: "ACTIVE",
    warrantyExpiry: "2027-07-02",
    lastMaintenanceDate: "2026-07-29",
  },
];

const DASHBOARD_DEMO_TASKS = [
  {
    id: "MNT-2401",
    taskCode: "MNT-2401",
    description: "Cooling assembly inspection",
    equipment: "MRI Scanner",
    assignedTechnician: "Aarav Nair",
    status: "Scheduled",
    deadline: "2026-08-12",
    priority: "High",
  },
  {
    id: "MNT-2402",
    taskCode: "MNT-2402",
    description: "Ventilator airflow recalibration",
    equipment: "Ventilator Pro",
    assignedTechnician: "Nisha Kapoor",
    status: "In Progress",
    deadline: "2026-08-08",
    priority: "Critical",
  },
  {
    id: "MNT-2403",
    taskCode: "MNT-2403",
    description: "Battery replacement validation",
    equipment: "Defibrillator",
    assignedTechnician: "Rohan Mehta",
    status: "Scheduled",
    deadline: "2026-08-15",
    priority: "Normal",
  },
  {
    id: "MNT-2404",
    taskCode: "MNT-2404",
    description: "Infusion pump safety audit",
    equipment: "Infusion Pump",
    assignedTechnician: "",
    status: "Needs Part",
    deadline: "2026-08-06",
    priority: "High",
  },
];

const EQUIPMENT_FILTERS = [
  { id: "all", label: "All Assets" },
  { id: "operational", label: "Operational" },
  { id: "attention", label: "Needs Attention" },
  { id: "maintenance", label: "In Maintenance" },
  { id: "retired", label: "Retired" },
];

const EQUIPMENT_STATUS_META = {
  operational: {
    label: "Operational",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    accentClass: "bg-emerald-500",
  },
  attention: {
    label: "Needs Attention",
    badgeClass: "bg-amber-50 text-amber-700 border border-amber-200",
    accentClass: "bg-amber-500",
  },
  maintenance: {
    label: "In Maintenance",
    badgeClass: "bg-blue-50 text-blue-700 border border-blue-200",
    accentClass: "bg-blue-500",
  },
  retired: {
    label: "Retired",
    badgeClass: "bg-slate-100 text-slate-600 border border-slate-200",
    accentClass: "bg-slate-500",
  },
};

const WARRANTY_META = {
  active: {
    label: "Warranty Active",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  expiring: {
    label: "Warranty Expiring Soon",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  expired: {
    label: "Warranty Expired",
    className: "bg-rose-50 text-rose-700 border border-rose-200",
  },
  none: {
    label: "No Warranty",
    className: "bg-slate-100 text-slate-600 border border-slate-200",
  },
};

const TASK_STATUS_META = {
  scheduled: {
    label: "Scheduled",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  inProgress: {
    label: "In Progress",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  blocked: {
    label: "Blocked",
    className: "bg-rose-50 text-rose-700 border border-rose-200",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
};

function SidebarNavButton({ active = false, icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 text-sm rounded-xl transition-colors ${
        active
          ? "bg-white border border-gray-100 shadow-sm text-gray-900 font-bold"
          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-medium"
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

function StatCard({ title, value, subtitle, delta, tone = "slate", icon: Icon }) {
  const toneClasses = {
    slate: "bg-slate-50 text-slate-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
  };

  return (
    <div className="border border-gray-100 rounded-2xl p-5 shadow-sm bg-white">
      <div className="flex justify-between items-start gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-500">{title}</p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
          <p className="mt-2 text-xs font-medium text-gray-400">{subtitle}</p>
        </div>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${toneClasses[tone]}`}>
          <Icon size={20} />
        </div>
      </div>
      {delta ? (
        <div className={`mt-4 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${toneClasses[tone]}`}>
          <TrendingUp size={12} />
          {delta}
        </div>
      ) : null}
    </div>
  );
}

function Panel({ title, subtitle, actions, children }) {
  return (
    <section className="bg-white border border-gray-100 rounded-[28px] shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        {actions ? <div className="flex items-center gap-2 flex-wrap">{actions}</div> : null}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function formatDateLabel(value) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeLabel(value) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const today = new Date("2026-08-07T00:00:00");
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((target - today) / 86400000);
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays > 1) return `Due in ${diffDays} days`;
  if (diffDays === -1) return "Overdue by 1 day";
  return `Overdue by ${Math.abs(diffDays)} days`;
}

function daysUntil(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date("2026-08-07T00:00:00");
  return Math.round((date - today) / 86400000);
}

function unwrapCollection(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function titleFromEnum(value) {
  if (!value) return "";
  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeEquipmentStatus(status) {
  const raw = String(status || "").toLowerCase();

  if (raw.includes("retired") || raw.includes("disposed") || raw.includes("decommissioned")) {
    return { key: "retired", label: EQUIPMENT_STATUS_META.retired.label };
  }

  if (raw.includes("maintenance") && !raw.includes("needs")) {
    return { key: "maintenance", label: EQUIPMENT_STATUS_META.maintenance.label };
  }

  if (
    raw.includes("attention") ||
    raw.includes("needs") ||
    raw.includes("out_of_service") ||
    raw.includes("out of service") ||
    raw.includes("critical") ||
    raw.includes("fault")
  ) {
    return { key: "attention", label: EQUIPMENT_STATUS_META.attention.label };
  }

  return { key: "operational", label: EQUIPMENT_STATUS_META.operational.label };
}

function normalizeWarranty(item) {
  const explicit = String(item?.warrantyStatus || "").toUpperCase();
  if (explicit === "ACTIVE") return { key: "active", label: WARRANTY_META.active.label };
  if (explicit === "EXPIRING_SOON") return { key: "expiring", label: WARRANTY_META.expiring.label };
  if (explicit === "EXPIRED") return { key: "expired", label: WARRANTY_META.expired.label };

  const expiry = item?.warrantyExpiry || item?.warrantyEndDate;
  if (!expiry) return { key: "none", label: WARRANTY_META.none.label };

  const remainingDays = daysUntil(expiry);
  if (remainingDays === null) return { key: "none", label: WARRANTY_META.none.label };
  if (remainingDays < 0) return { key: "expired", label: WARRANTY_META.expired.label };
  if (remainingDays <= 60) return { key: "expiring", label: WARRANTY_META.expiring.label };
  return { key: "active", label: WARRANTY_META.active.label };
}

function normalizeEquipmentItem(item, index) {
  if (!item) return null;

  const status = normalizeEquipmentStatus(item.status);
  const warranty = normalizeWarranty(item);
  const fallbackId = item.equipmentCode || item.assetCode || item.serialNumber || `EQ-${index + 1}`;

  return {
    id: String(item.id ?? fallbackId),
    code: item.equipmentCode || item.assetCode || String(item.id ?? fallbackId),
    name: item.name || item.equipmentName || item.assetName || "Unnamed equipment",
    model: item.model || item.manufacturerModel || "Unknown model",
    department: item.department || item.location || "Unassigned department",
    category: titleFromEnum(item.category) || "General",
    statusKey: status.key,
    statusLabel: status.label,
    warrantyKey: warranty.key,
    warrantyLabel: warranty.label,
    warrantyExpiry: item.warrantyExpiry || item.warrantyEndDate || "",
    lastMaintenanceDate: item.lastMaintenanceDate || item.updatedAt || item.purchaseDate || "",
  };
}

function normalizeTaskStatus(task) {
  const raw = String(task?.status || "").toLowerCase();
  if (raw.includes("complete") || raw.includes("done")) {
    return { key: "completed", label: TASK_STATUS_META.completed.label };
  }
  if (raw.includes("progress")) {
    return { key: "inProgress", label: TASK_STATUS_META.inProgress.label };
  }
  if (raw.includes("hold") || raw.includes("part") || raw.includes("block")) {
    return { key: "blocked", label: TASK_STATUS_META.blocked.label };
  }
  return { key: "scheduled", label: TASK_STATUS_META.scheduled.label };
}

function normalizeTaskItem(task, index) {
  if (!task) return null;

  const status = normalizeTaskStatus(task);
  const dueDate = task.deadline || task.scheduledDate || task.dueDate || "";
  const dueDelta = daysUntil(dueDate);
  const isCompleted = status.key === "completed";
  const dueState =
    isCompleted || dueDelta === null ? "normal" : dueDelta < 0 ? "overdue" : dueDelta <= 2 ? "soon" : "normal";

  return {
    id: String(task.id ?? task.taskCode ?? `TASK-${index + 1}`),
    taskCode: task.taskCode || String(task.id ?? `TASK-${index + 1}`),
    title: task.description || task.title || "Maintenance task",
    equipmentName: task.equipment || task.equipmentName || "Unassigned equipment",
    assignedTechnician: task.assignedTechnician || task.technician || "Unassigned",
    priority: titleFromEnum(task.priority) || "Normal",
    statusKey: status.key,
    statusLabel: status.label,
    dueDate,
    dueState,
  };
}

function buildDepartmentChartData(equipmentList) {
  const grouped = equipmentList.reduce((accumulator, item) => {
    const key = item.department || "Unassigned";
    if (!accumulator.has(key)) {
      accumulator.set(key, { department: key, operational: 0, attention: 0, maintenance: 0, total: 0 });
    }

    const current = accumulator.get(key);
    current.total += 1;

    if (item.statusKey === "operational") current.operational += 1;
    if (item.statusKey === "attention") current.attention += 1;
    if (item.statusKey === "maintenance") current.maintenance += 1;

    return accumulator;
  }, new Map());

  return Array.from(grouped.values())
    .sort((left, right) => right.total - left.total)
    .slice(0, 6);
}

export default function Dashboard({ onNavigate }) {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [equipmentList, setEquipmentList] = useState([]);
  const [tasksList, setTasksList] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dashboardNotice, setDashboardNotice] = useState("");
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("Just now");
  const [isBotOpen, setIsBotOpen] = useState(false);

  const deferredSearch = useDeferredValue(searchQuery);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      if (user?.id?.startsWith("demo-")) {
        setEquipmentList(DASHBOARD_DEMO_EQUIPMENT.map(normalizeEquipmentItem).filter(Boolean));
        setTasksList(DASHBOARD_DEMO_TASKS.map(normalizeTaskItem).filter(Boolean));
        setDashboardNotice("Demo workspace is showing seeded operational data.");
        setLastUpdatedLabel("Moments ago");
        return;
      }

      const [equipmentResult, tasksResult] = await Promise.allSettled([
        getAllEquipment(0, 50),
        getAllTasks({ page: 0, size: 12 }),
      ]);

      const nextEquipment =
        equipmentResult.status === "fulfilled"
          ? unwrapCollection(equipmentResult.value).map(normalizeEquipmentItem).filter(Boolean)
          : [];
      const nextTasks =
        tasksResult.status === "fulfilled"
          ? unwrapCollection(tasksResult.value).map(normalizeTaskItem).filter(Boolean)
          : [];

      setEquipmentList(nextEquipment);
      setTasksList(nextTasks);

      if (equipmentResult.status === "rejected" && tasksResult.status === "rejected") {
        setDashboardNotice("Live dashboard data is temporarily unavailable. The screen is ready, but upstream data sources failed to respond.");
      } else if (equipmentResult.status === "rejected") {
        setDashboardNotice("Equipment inventory could not be refreshed, but maintenance data is still available.");
      } else if (tasksResult.status === "rejected") {
        setDashboardNotice("Maintenance backlog could not be refreshed, but inventory data is still available.");
      } else {
        setDashboardNotice("");
      }

      setLastUpdatedLabel(new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }));
    } catch (error) {
      console.error("Dashboard data fetch failed:", error);
      setDashboardNotice("Dashboard refresh failed. Please try again in a moment.");
      setEquipmentList([]);
      setTasksList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredEquipment = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return equipmentList.filter((item) => {
      const matchesFilter = statusFilter === "all" || item.statusKey === statusFilter;
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query) ||
        item.model.toLowerCase().includes(query) ||
        item.department.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [deferredSearch, equipmentList, statusFilter]);

  const featuredEquipment = useMemo(
    () =>
      [...filteredEquipment].sort((left, right) => {
        const priorityRank = { attention: 0, maintenance: 1, operational: 2, retired: 3 };
        return (priorityRank[left.statusKey] ?? 99) - (priorityRank[right.statusKey] ?? 99);
      }).slice(0, 6),
    [filteredEquipment],
  );

  const prioritizedTasks = useMemo(
    () =>
      [...tasksList].sort((left, right) => {
        const rank = { overdue: 0, soon: 1, normal: 2 };
        const dueRank = (rank[left.dueState] ?? 9) - (rank[right.dueState] ?? 9);
        if (dueRank !== 0) return dueRank;
        return new Date(left.dueDate || "2100-01-01") - new Date(right.dueDate || "2100-01-01");
      }),
    [tasksList],
  );

  const overview = useMemo(() => {
    const operational = equipmentList.filter((item) => item.statusKey === "operational").length;
    const attention = equipmentList.filter((item) => item.statusKey === "attention").length;
    const maintenance = equipmentList.filter((item) => item.statusKey === "maintenance").length;
    const overdueTasks = tasksList.filter((item) => item.dueState === "overdue").length;
    const completionRate = tasksList.length
      ? Math.round((tasksList.filter((item) => item.statusKey === "completed").length / tasksList.length) * 100)
      : 0;

    return {
      operational,
      attention,
      maintenance,
      overdueTasks,
      completionRate,
    };
  }, [equipmentList, tasksList]);

  const departmentChartData = useMemo(() => buildDepartmentChartData(equipmentList), [equipmentList]);

  const topAttentionAssets = useMemo(
    () => equipmentList.filter((item) => item.statusKey !== "operational").slice(0, 4),
    [equipmentList],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#f5f7fb] font-sans text-gray-900 overflow-hidden">
      <aside className="w-[260px] flex flex-col justify-between p-6 border-r border-gray-100 shrink-0 bg-[#fbfbfb]">
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="mb-10 px-2 pt-2">
            <MedTrackLogo size="text-2xl" />
          </div>

          <nav className="space-y-1">
            <SidebarNavButton active icon={LayoutGrid} label="Dashboard" onClick={() => onNavigate?.("dashboard")} />
            <SidebarNavButton icon={Box} label="Equipment" onClick={() => onNavigate?.("equipment")} />
            <SidebarNavButton icon={ClipboardList} label="Maintenance" onClick={() => onNavigate?.("maintenance")} />
            <SidebarNavButton icon={Award} label="Calibration & Compliance" onClick={() => onNavigate?.("calibration")} />
            <SidebarNavButton icon={Users} label="Staff (SCIM)" onClick={() => onNavigate?.("scim-provisioning")} />
            <SidebarNavButton icon={LineChart} label="Analytics" onClick={() => onNavigate?.("analytics")} />

            <div className="my-4 border-t border-gray-100"></div>

            <SidebarNavButton icon={Mail} label="Notifications" onClick={() => onNavigate?.("security-commandcenter")} />
            <SidebarNavButton icon={Workflow} label="Workflows (SOAR)" onClick={() => onNavigate?.("soar-security")} />
            <SidebarNavButton icon={Puzzle} label="Integrations (SSO)" onClick={() => onNavigate?.("sso-security")} />

            <div className="my-4 border-t border-gray-100"></div>

            <SidebarNavButton icon={HelpCircle} label="Help Center" onClick={() => onNavigate?.("help")} />
            <SidebarNavButton icon={MessageCircle} label="Feedback" onClick={() => onNavigate?.("help")} />
            <SidebarNavButton icon={Settings} label="Settings" onClick={() => onNavigate?.("authority-security")} />
          </nav>
        </div>

        <div className="mt-6">
          <button
            onClick={logout}
            className="w-full p-3 bg-white border border-gray-100 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || "Demo"}`}
                className="w-10 h-10 rounded-full bg-gray-50"
                alt="Avatar"
              />
              <div className="text-left">
                <p className="text-xs font-bold text-gray-900">{user?.name || "Demo Admin"}</p>
                <p className="text-[10px] text-gray-400 font-medium">{user?.email || "admin@medtrack.com"}</p>
              </div>
            </div>
            <ChevronsUpDown size={14} className="text-gray-400" />
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto px-8 py-8 min-w-0">
        <header className="mb-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 border border-slate-200">
                <Bell size={12} />
                Operational command center
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Hospital operations dashboard</h1>
              <p className="mt-2 text-sm text-slate-500 max-w-2xl">
                Live inventory health, maintenance urgency, and department readiness in one place.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500">
                Last updated {lastUpdatedLabel}
              </div>
              <button
                onClick={() => fetchDashboardData({ silent: true })}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
              <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                <Share2 size={16} />
                Share
              </button>
              <button className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-black transition-colors">
                <Download size={16} />
                Export snapshot
              </button>
            </div>
          </div>

          {dashboardNotice ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 flex items-start gap-3">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <span>{dashboardNotice}</span>
            </div>
          ) : null}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Tracked assets"
            value={equipmentList.length}
            subtitle={`${overview.operational} operating normally right now`}
            delta={equipmentList.length ? "Live inventory synced" : null}
            tone="blue"
            icon={Box}
          />
          <StatCard
            title="Needs attention"
            value={overview.attention}
            subtitle="Assets likely to require near-term intervention"
            delta={overview.attention ? "Immediate review recommended" : null}
            tone={overview.attention ? "amber" : "emerald"}
            icon={AlertTriangle}
          />
          <StatCard
            title="In maintenance"
            value={overview.maintenance}
            subtitle={`${tasksList.length} maintenance tasks currently tracked`}
            delta={overview.maintenance ? "Workorders active" : null}
            tone="blue"
            icon={Wrench}
          />
          <StatCard
            title="Task completion"
            value={`${overview.completionRate}%`}
            subtitle={`${overview.overdueTasks} overdue task${overview.overdueTasks === 1 ? "" : "s"} need follow-up`}
            delta={tasksList.length ? "Based on live backlog" : null}
            tone={overview.overdueTasks ? "rose" : "emerald"}
            icon={CheckCircle2}
          />
        </div>

        <Panel
          title="Equipment watchlist"
          subtitle="The equipment panel now renders inventory data directly instead of accidentally reusing task rows."
          actions={
            <>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by name, code, model, or department"
                  className="w-[280px] max-w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>
              {EQUIPMENT_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={`rounded-full px-3 py-2 text-xs font-bold transition-colors ${
                    statusFilter === filter.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </>
          }
        >
          {featuredEquipment.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
              <p className="text-lg font-bold text-slate-900">No equipment matches the current watchlist filters.</p>
              <p className="mt-2 text-sm text-slate-500">Try clearing the search or switching back to All Assets.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="mt-4 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
              >
                Reset watchlist
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {featuredEquipment.map((item) => {
                const statusMeta = EQUIPMENT_STATUS_META[item.statusKey] || EQUIPMENT_STATUS_META.operational;
                const warrantyMeta = WARRANTY_META[item.warrantyKey] || WARRANTY_META.none;

                return (
                  <article
                    key={item.id}
                    className="rounded-3xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusMeta.badgeClass}`}>
                            <span className={`w-2 h-2 rounded-full ${statusMeta.accentClass}`}></span>
                            {item.statusLabel}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${warrantyMeta.className}`}>
                            {item.warrantyLabel}
                          </span>
                        </div>
                        <h3 className="mt-4 text-xl font-bold text-slate-900">{item.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {item.code} • {item.model}
                        </p>
                      </div>
                      <button
                        onClick={() => onNavigate?.("equipment")}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Open inventory
                      </button>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-white p-3 border border-slate-100">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold">Department</p>
                        <p className="mt-2 text-sm font-bold text-slate-900">{item.department}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-3 border border-slate-100">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold">Category</p>
                        <p className="mt-2 text-sm font-bold text-slate-900">{item.category}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-3 border border-slate-100">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold">Last service</p>
                        <p className="mt-2 text-sm font-bold text-slate-900">{formatDateLabel(item.lastMaintenanceDate)}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-3 border border-slate-100">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold">Warranty expiry</p>
                        <p className="mt-2 text-sm font-bold text-slate-900">
                          {item.warrantyExpiry ? formatDateLabel(item.warrantyExpiry) : "Not recorded"}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Panel>

        <div className="grid grid-cols-1 2xl:grid-cols-[1.5fr_1fr] gap-6 mt-8">
          <Panel
            title="Maintenance queue"
            subtitle="Highest urgency work orders are prioritized first, even when the API returns paginated payloads."
            actions={
              <button
                onClick={() => onNavigate?.("maintenance")}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Open maintenance board
              </button>
            }
          >
            {prioritizedTasks.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                <p className="text-lg font-bold text-slate-900">No maintenance tasks are currently available.</p>
                <p className="mt-2 text-sm text-slate-500">Create a task from the maintenance module to populate this queue.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {prioritizedTasks.map((task) => {
                  const statusMeta = TASK_STATUS_META[task.statusKey] || TASK_STATUS_META.scheduled;
                  const dueTone =
                    task.dueState === "overdue"
                      ? "text-rose-600"
                      : task.dueState === "soon"
                        ? "text-amber-600"
                        : "text-slate-500";

                  return (
                    <div
                      key={task.id}
                      className="rounded-3xl border border-slate-100 bg-slate-50/70 px-4 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{task.taskCode}</span>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusMeta.className}`}>
                            {task.statusLabel}
                          </span>
                        </div>
                        <h3 className="mt-2 text-lg font-bold text-slate-900">{task.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {task.equipmentName} • {task.assignedTechnician}
                        </p>
                      </div>

                      <div className="flex items-center gap-6 flex-wrap">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold">Priority</p>
                          <p className="mt-1 text-sm font-bold text-slate-900">{task.priority}</p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold">Due date</p>
                          <p className={`mt-1 text-sm font-bold ${dueTone}`}>{formatRelativeLabel(task.dueDate)}</p>
                        </div>
                        <button
                          onClick={() => onNavigate?.("maintenance")}
                          className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-black transition-colors"
                        >
                          Review task
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          <div className="space-y-6">
            <Panel title="Department readiness" subtitle="Operational versus disrupted equipment by department.">
              {departmentChartData.length === 0 ? (
                <div className="h-[280px] rounded-3xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-sm font-medium text-slate-500">
                  Department readiness will appear once equipment data is available.
                </div>
              ) : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="department" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                      <Tooltip
                        cursor={{ fill: "#f8fafc" }}
                        contentStyle={{ borderRadius: "16px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}
                      />
                      <Bar dataKey="operational" fill="#10b981" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="attention" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="maintenance" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>

            <Panel title="Intervention shortlist" subtitle="Assets that should be reviewed first based on current dashboard state.">
              {topAttentionAssets.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                  <p className="text-sm font-semibold text-slate-600">No high-risk assets in the current snapshot.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topAttentionAssets.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.department} • {item.code}
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${(EQUIPMENT_STATUS_META[item.statusKey] || EQUIPMENT_STATUS_META.operational).badgeClass}`}>
                          {item.statusLabel}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-xs font-medium text-slate-500">
                        <span>{item.warrantyLabel}</span>
                        <span>{formatDateLabel(item.lastMaintenanceDate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </div>
      </main>

      {isBotOpen ? (
        <aside className="w-[340px] flex flex-col p-7 border-l border-gray-100 shrink-0 bg-white relative">
          <button
            onClick={() => setIsBotOpen(false)}
            className="absolute top-4 right-4 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>

          <div className="rounded-[32px] bg-slate-50 p-7 text-center border border-slate-100">
            <div className="mx-auto w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center">
              <Bot size={28} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">MedTrack Assistant</h3>
            <p className="mt-1 text-sm text-slate-500">Daily operational briefing for hospital admins.</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-600 font-bold">Stable assets</p>
              <p className="mt-2 text-2xl font-bold text-emerald-900">{overview.operational}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4 border border-amber-100">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-600 font-bold">Urgent tasks</p>
              <p className="mt-2 text-2xl font-bold text-amber-900">{overview.overdueTasks}</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900">Suggested next moves</h4>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-4">
                Route overdue tasks to the maintenance board and confirm technician ownership before end of day.
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                Review devices marked as Needs Attention and create a maintenance schedule for any unassigned asset.
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                Use the Equipment page to inspect warranties expiring within the next 60 days.
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900">Live queue snapshot</h4>
            <div className="mt-4 space-y-3">
              {prioritizedTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-900">{task.equipmentName}</p>
                  <p className="mt-1 text-xs text-slate-500">{task.title}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Clock3 size={12} />
                    {formatRelativeLabel(task.dueDate)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      ) : null}

      {!isBotOpen ? (
        <button
          onClick={() => setIsBotOpen(true)}
          className="absolute bottom-8 right-8 w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-black hover:scale-105 transition-all z-50"
          aria-label="Open dashboard assistant"
        >
          <Bot size={24} />
        </button>
      ) : null}
    </div>
  );
}
