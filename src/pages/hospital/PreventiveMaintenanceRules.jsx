// src/pages/hospital/PreventiveMaintenanceRules.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  listRules,
  createRule,
  updateRule,
  deleteRule,
  previewRule,
  generateTasks,
} from "../../services/MaintenanceService";
import { getAllEquipment } from "../../services/EquipmentService";

const EMPTY_FORM = {
  name: "",
  description: "",
  ruleScope: "EQUIPMENT_CATEGORY",
  equipmentCategory: "MONITORING",
  equipmentRecordId: "",
  manufacturer: "",
  priority: "Normal",
  frequency: "MONTHLY",
  customIntervalDays: "",
  maintenanceType: "Preventive",
  slaWarningDays: 3,
  slaBreachDays: 1,
  leadTimeDays: 7,
  active: true,
};

const SCOPE_LABELS = {
  EQUIPMENT_CATEGORY: "Equipment Category",
  INDIVIDUAL_EQUIPMENT: "Individual Equipment",
  MANUFACTURER_INTERVAL: "Manufacturer Interval",
  PRIORITY: "Priority",
};

const FREQUENCY_LABELS = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
  CUSTOM: "Custom",
};

export default function PreventiveMaintenanceRules({ onNavigate }) {
  const [rules, setRules] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadRules = useCallback(async () => {
    try {
      const data = await listRules();
      setRules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load maintenance rules:", err);
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRules();
    getAllEquipment()
      .then((data) => setEquipmentList(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to load equipment:", err));
  }, [loadRules]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setPreview(null);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
    setError(null);
    setMessage(null);
  };

  const openEdit = (rule) => {
    setEditingId(rule.id);
    setForm({
      name: rule.name || "",
      description: rule.description || "",
      ruleScope: rule.ruleScope || "EQUIPMENT_CATEGORY",
      equipmentCategory: rule.equipmentCategory || "MONITORING",
      equipmentRecordId: rule.equipmentRecordId || "",
      manufacturer: rule.manufacturer || "",
      priority: rule.priority || "Normal",
      frequency: rule.frequency || "MONTHLY",
      customIntervalDays: rule.customIntervalDays || "",
      maintenanceType: rule.maintenanceType || "Preventive",
      slaWarningDays: rule.slaWarningDays ?? 3,
      slaBreachDays: rule.slaBreachDays ?? 1,
      leadTimeDays: rule.leadTimeDays ?? 7,
      active: rule.active !== false,
    });
    setPreview(null);
    setShowForm(true);
    setError(null);
    setMessage(null);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        ...form,
        equipmentRecordId: form.equipmentRecordId ? Number(form.equipmentRecordId) : null,
        customIntervalDays: form.customIntervalDays ? Number(form.customIntervalDays) : null,
      };
      if (editingId) {
        await updateRule(editingId, payload);
        setMessage("Rule updated successfully.");
      } else {
        await createRule(payload);
        setMessage("Rule created successfully.");
      }
      setShowForm(false);
      resetForm();
      await loadRules();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save the rule.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rule) => {
    if (!window.confirm(`Delete rule "${rule.name}"?`)) return;
    try {
      await deleteRule(rule.id);
      await loadRules();
    } catch (err) {
      alert("Failed to delete the rule.");
    }
  };

  const runPreview = async (rule) => {
    setPreviewing(true);
    setError(null);
    try {
      const data = await previewRule(rule.id);
      setPreview(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to preview the rule.");
      setPreview(null);
    } finally {
      setPreviewing(false);
    }
  };

  const runGenerate = async (rule) => {
    if (!window.confirm(`Generate tasks now for rule "${rule.name}"?`)) return;
    setGenerating(true);
    setError(null);
    try {
      const run = await generateTasks(rule.id);
      setMessage(
        `Generated ${run.tasksGenerated ?? 0} tasks (skipped ${run.skippedExisting ?? 0} existing) for the ${run.windowStart} to ${run.windowEnd} window.`
      );
      await loadRules();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to generate tasks.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading preventive maintenance rules...</div>;
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-card border-b border-subtle sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-primary">Preventive Maintenance Rules</h1>
              <p className="text-sm text-secondary mt-1">Recurrence, SLA, and workload automation</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onNavigate("sla-dashboard")}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg shadow-sm transition-colors border border-subtle cursor-pointer"
              >
                SLA Dashboard
              </button>
              <button
                onClick={openCreate}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                + New Rule
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {message && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-green-100 text-green-800 text-sm font-medium border border-green-200">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-100 text-red-800 text-sm font-medium border border-red-200">
            {error}
          </div>
        )}

        {showForm && (
          <div className="mb-8 bg-card rounded-xl shadow-sm border border-subtle p-6">
            <h2 className="text-lg font-bold text-primary mb-4">
              {editingId ? "Edit Rule" : "Create Recurrence Rule"}
            </h2>
            <form onSubmit={submitForm} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Rule Name *</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Description</label>
                  <input
                    name="description"
                    value={form.description}
                    onChange={onChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Rule Scope *</label>
                  <select
                    name="ruleScope"
                    value={form.ruleScope}
                    onChange={onChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {Object.entries(SCOPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {form.ruleScope === "EQUIPMENT_CATEGORY" && (
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Equipment Category *</label>
                    <select
                      name="equipmentCategory"
                      value={form.equipmentCategory}
                      onChange={onChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {["IMAGING", "SURGICAL", "MONITORING", "LABORATORY", "RESPIRATORY", "OTHER"].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}

                {form.ruleScope === "INDIVIDUAL_EQUIPMENT" && (
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Equipment *</label>
                    <select
                      name="equipmentRecordId"
                      value={form.equipmentRecordId}
                      onChange={onChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Select equipment</option>
                      {equipmentList.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.equipmentCode || item.deviceCode || item.id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {form.ruleScope === "MANUFACTURER_INTERVAL" && (
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Manufacturer *</label>
                    <input
                      name="manufacturer"
                      value={form.manufacturer}
                      onChange={onChange}
                      placeholder="e.g. GE Healthcare"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                )}

                {form.ruleScope === "PRIORITY" && (
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Priority *</label>
                    <select
                      name="priority"
                      value={form.priority}
                      onChange={onChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Recurrence Frequency *</label>
                  <select
                    name="frequency"
                    value={form.frequency}
                    onChange={onChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {form.frequency === "CUSTOM" && (
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Custom Interval (days) *</label>
                    <input
                      type="number"
                      name="customIntervalDays"
                      value={form.customIntervalDays}
                      onChange={onChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Maintenance Type *</label>
                  <input
                    name="maintenanceType"
                    value={form.maintenanceType}
                    onChange={onChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Warning (days)</label>
                    <input
                      type="number"
                      name="slaWarningDays"
                      value={form.slaWarningDays}
                      onChange={onChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Breach (days)</label>
                    <input
                      type="number"
                      name="slaBreachDays"
                      value={form.slaBreachDays}
                      onChange={onChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Lead (days)</label>
                    <input
                      type="number"
                      name="leadTimeDays"
                      value={form.leadTimeDays}
                      onChange={onChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-secondary">
                <input type="checkbox" name="active" checked={form.active} onChange={onChange} />
                Active
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-subtle">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-4 py-2 bg-hover hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingId ? "Update Rule" : "Create Rule"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
          {rules.length === 0 ? (
            <div className="text-center py-16 text-secondary">
              <div className="flex flex-col items-center">
                <span className="text-4xl mb-2">🔁</span>
                <p className="font-medium">No preventive maintenance rules yet.</p>
                <button
                  onClick={openCreate}
                  className="mt-4 text-teal-600 hover:text-teal-700 text-sm font-semibold cursor-pointer"
                >
                  Create your first rule
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-subtle">
                <thead className="bg-surface border-b border-subtle">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Rule</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Scope</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Frequency</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">SLA</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle bg-card">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-hover transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-primary">{rule.name}</div>
                        {rule.description && <div className="text-xs text-secondary">{rule.description}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-secondary whitespace-nowrap">
                        {SCOPE_LABELS[rule.ruleScope] || rule.ruleScope}
                        {rule.equipmentName && (
                          <div className="text-xs text-secondary">→ {rule.equipmentName}</div>
                        )}
                        {rule.equipmentCategory && (
                          <div className="text-xs text-secondary">→ {rule.equipmentCategory}</div>
                        )}
                        {rule.manufacturer && (
                          <div className="text-xs text-secondary">→ {rule.manufacturer}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-secondary whitespace-nowrap">
                        {FREQUENCY_LABELS[rule.frequency] || rule.frequency}
                        {rule.frequency === "CUSTOM" && rule.customIntervalDays && (
                          <div className="text-xs text-secondary">every {rule.customIntervalDays} days</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-secondary whitespace-nowrap">{rule.maintenanceType}</td>
                      <td className="px-6 py-4 text-sm text-secondary whitespace-nowrap">
                        warn {rule.slaWarningDays}d · breach {rule.slaBreachDays}d
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                          rule.active
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}>
                          {rule.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => runPreview(rule)}
                            disabled={previewing}
                            className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-md border border-blue-200 cursor-pointer disabled:opacity-50"
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => runGenerate(rule)}
                            disabled={generating}
                            className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold rounded-md border border-teal-200 cursor-pointer disabled:opacity-50"
                          >
                            Generate
                          </button>
                          <button
                            onClick={() => openEdit(rule)}
                            className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(rule)}
                            className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-md border border-red-200 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {preview && (
          <div className="mt-8 bg-card rounded-xl shadow-sm border border-subtle p-6">
            <h3 className="text-lg font-bold text-primary mb-4">
              Preview: {preview.ruleName}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-surface border border-subtle">
                <div className="text-2xl font-bold text-primary">{preview.totalDueDates}</div>
                <div className="text-xs text-secondary">Due dates</div>
              </div>
              <div className="p-3 rounded-lg bg-surface border border-subtle">
                <div className="text-2xl font-bold text-primary">{preview.matchedEquipment}</div>
                <div className="text-xs text-secondary">Matching equipment</div>
              </div>
              <div className="p-3 rounded-lg bg-surface border border-subtle">
                <div className="text-2xl font-bold text-teal-600">{preview.wouldCreate}</div>
                <div className="text-xs text-secondary">Would create</div>
              </div>
              <div className="p-3 rounded-lg bg-surface border border-subtle">
                <div className="text-2xl font-bold text-amber-600">{preview.skippedExisting}</div>
                <div className="text-xs text-secondary">Skipped (already exist)</div>
              </div>
            </div>
            <div className="text-sm text-secondary mb-2">
              Window: <span className="font-medium text-primary">{preview.windowStart}</span> →{" "}
              <span className="font-medium text-primary">{preview.windowEnd}</span>
            </div>
            <div className="text-sm text-secondary mb-4">
              Due dates:{" "}
              <span className="font-medium text-primary">
                {preview.dueDates?.join(", ") || "None in window"}
              </span>
            </div>
            {preview.matchedEquipmentCodes?.length > 0 && (
              <div className="text-sm text-secondary">
                Matching equipment:{" "}
                <span className="font-medium text-primary">{preview.matchedEquipmentCodes.join(", ")}</span>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => runGenerate(rules.find((r) => r.id === preview.ruleId))}
                disabled={generating}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {generating ? "Generating..." : "Generate these tasks"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
