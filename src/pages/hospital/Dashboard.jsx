import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllEquipment } from '../../services/EquipmentService';
import { getAllTasks } from '../../services/MaintenanceService';
import { computeEquipmentHealthScore } from '../../services/AnalyticsService';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Home, LayoutGrid, CheckSquare, Users, Settings, HelpCircle, LogOut,
  ThumbsUp, Clock, Activity, Calendar, ChevronDown, MoreHorizontal,
  Phone, Video, Paperclip, Smile, Mic, CheckCircle2, CircleDashed, Download,
  Box, ClipboardList, MessageSquare, LineChart, Mail, Workflow, Puzzle, MessageCircle, ChevronsUpDown, Diamond,
  Bot, X, Bell, Search, Share, RefreshCw, Upload, TrendingUp, TrendingDown, Award, Package
} from 'lucide-react';
import MedTrackLogo from '../../components/common/MedTrackLogo';

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
    <div className="flex h-screen w-full bg-white font-sans text-gray-900 overflow-hidden">
        
        {/* COLUMN 1: LEFT SIDEBAR */}
        <aside className="w-[260px] flex flex-col justify-between p-6 border-r border-gray-100 shrink-0 bg-[#fbfbfb]">
          <div className="flex-1 overflow-y-auto pr-2">
            
            {/* Logo */}
            <div className="mb-10 px-2 pt-2">
              <MedTrackLogo size="text-2xl" />
            </div>

            <nav className="space-y-1">
              {/* Main Menu */}
              <button onClick={() => onNavigate && onNavigate("dashboard")} className="w-full flex items-center gap-4 px-4 py-3 text-sm font-bold text-gray-900 bg-white rounded-xl shadow-sm border border-gray-100 mb-1 hover:bg-gray-50 transition-colors">
                <LayoutGrid size={18} className="text-gray-900" /> Dashboard
              </button>
              <button onClick={() => onNavigate && onNavigate("equipment")} className="w-full flex items-center gap-4 px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
                <Box size={18} /> Equipment
              </button>
              <button onClick={() => onNavigate && onNavigate("retired-assets")} className="w-full flex items-center gap-4 px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
                <Diamond size={18} /> Retired Assets
              </button>
              <button onClick={() => onNavigate && onNavigate("maintenance")} className="w-full flex items-center gap-4 px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
                <ClipboardList size={18} /> Maintenance
              </button>
              <button onClick={() => onNavigate && onNavigate("calibration")} className="w-full flex items-center gap-4 px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
                <Award size={18} /> Calibration & Compliance
              </button>
              <button onClick={() => onNavigate && onNavigate("lifecycle-predictor")} className="w-full flex items-center gap-4 px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
                <TrendingDown size={18} /> Lifecycle & EOL Risk
              </button>
              <button onClick={() => onNavigate && onNavigate("scim-provisioning")} className="w-full flex items-center gap-4 px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
                <Users size={18} /> Staff (SCIM)
              </button>
              <button onClick={() => onNavigate && onNavigate("siem-security")} className="w-full flex items-center gap-4 px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
                <MessageSquare size={18} /> Messages (SIEM)
              </button>
              <button onClick={() => onNavigate && onNavigate("analytics")} className="w-full flex items-center gap-4 px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
                <LineChart size={18} /> Analytics
              </button>
              <button onClick={() => onNavigate && onNavigate("tenders")} className="w-full flex items-center gap-4 px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
                <Award size={18} /> Tenders &amp; E-Auction
              </button>

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

            <div className="space-y-3">
              {equipmentList.slice(0, 5).map((equipment, idx) => {
                const health = computeEquipmentHealthScore(equipment);
                const healthColorClass = health?.color === 'red' ? 'bg-red-500' : health?.color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500';
                return (
                <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-colors group">
                  <div className="flex items-center gap-4 w-1/2">
                    <div className="w-10 h-10 rounded-full bg-[#f4f3ef] flex items-center justify-center text-gray-700">
                      <Box size={18} />
                    </div>
                    <span className="font-bold text-sm text-gray-900">{equipment.name}</span>
                  </div>
                  
                  <div className="w-1/4 flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${equipment.status === 'OPERATIONAL' || equipment.status === 'ACTIVE' || equipment.status === 'Operational' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    <span className="text-[11px] font-bold text-gray-700">{equipment.status}</span>
                  </div>

                  <div className="w-1/4 flex items-center justify-end gap-6 text-gray-400">
                    {health && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Health:</span>
                        <span className={`px-2 py-0.5 rounded-full text-white text-[10px] font-bold ${healthColorClass}`}>
                          {health.score}
                        </span>
                      </div>
                    )}
                    <button className="p-1 hover:bg-gray-200 rounded-md transition-colors"><MoreHorizontal size={14} /></button>
                  </div>
                </div>
              )})}
            </div>
          </div>
        </main>

        {/* COLUMN 3: RIGHT SIDEBAR */}
        {isBotOpen && (
          <aside className="w-[360px] flex flex-col p-8 border-l border-gray-100 shrink-0 bg-white relative animate-in slide-in-from-right duration-300">
            
            <button onClick={() => setIsBotOpen(false)} className="absolute top-4 left-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors z-10">
              <X size={16} />
            </button>

            <div className="bg-[#f4f3ef] rounded-[32px] p-8 flex flex-col items-center text-center mb-8 shrink-0 relative mt-4">
              <div className="relative mb-4">
                <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center border-4 border-[#f4f3ef] bg-blue-600 text-white shadow-sm">
                  <Bot size={36} />
                </div>
                <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#f4f3ef] rounded-full"></div>
              </div>
              <h3 className="font-bold text-lg mb-1">MedTrack Assistant</h3>
              <p className="text-xs text-gray-500 font-medium mb-6">@medtrackbot</p>
            <div className="flex gap-4">
              <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-700 hover:bg-gray-50 transition-colors"><Phone size={16}/></button>
              <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-700 hover:bg-gray-50 transition-colors"><Video size={16}/></button>
              <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-700 hover:bg-gray-50 transition-colors"><MoreHorizontal size={16}/></button>
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
