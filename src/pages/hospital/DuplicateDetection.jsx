import React, { useEffect, useState } from "react";
import {
  getDuplicateGroups,
  mergeDuplicates,
} from "../../services/EquipmentService";

const MATCHED_ON_LABEL = {
  SERIAL_NUMBER: "Serial Number",
  ASSET_CODE: "Asset ID",
  NAME_MODEL: "Name + Model",
};

/**
 * Duplicate & tag reconciliation (issue #746).
 *
 * Lists clusters of assets that look like the same physical device registered more than once.
 * For each cluster the user picks the record to keep; the others are merged into it (stock
 * combined, history carried over, duplicate archived) and the cluster disappears.
 */
export default function DuplicateDetection({ onNavigate }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [keepByGroup, setKeepByGroup] = useState({});
  const [merging, setMerging] = useState(false);
  const [mergeFeedback, setMergeFeedback] = useState(null);

  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDuplicateGroups();
      setGroups(data || []);
      const initialKeep = {};
      (data || []).forEach((group, index) => {
        initialKeep[index] = group.assets?.[0]?.id ?? null;
      });
      setKeepByGroup(initialKeep);
    } catch (err) {
      console.error("Failed to load duplicate groups", err);
      setError(err.response?.data?.message || "Failed to load duplicate groups.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const mergeGroup = async (index) => {
    const group = groups[index];
    if (!group || group.assets.length < 2) return;
    const keepId = keepByGroup[index];
    if (!keepId) {
      setMergeFeedback({ type: "error", text: "Choose the record to keep first." });
      return;
    }
    setMerging(true);
    setMergeFeedback(null);
    try {
      const others = group.assets.map((asset) => asset.id).filter((id) => id !== keepId);
      for (const mergeId of others) {
        await mergeDuplicates(keepId, mergeId);
      }
      setMergeFeedback({
        type: "success",
        text: `Merged ${others.length} duplicate${others.length === 1 ? "" : "s"} into the kept record.`,
      });
      await loadGroups();
    } catch (err) {
      console.error("Failed to merge duplicates", err);
      setMergeFeedback({
        type: "error",
        text: err.response?.data?.message || "Failed to merge the selected records.",
      });
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight m-0">
              Duplicate &amp; Tag Reconciliation
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
              Records that look like the same physical device registered more than once — review
              and merge before they corrupt counts, history or procurement planning.
            </p>
          </div>
          <button
            onClick={() => onNavigate("equipment")}
            className="px-6 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold cursor-pointer border-none transition-colors"
          >
            ← Back to Inventory
          </button>
        </div>

        {mergeFeedback && (
          <div
            className={`mb-6 p-4 rounded-2xl border text-sm font-bold ${
              mergeFeedback.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-red-50 border-red-300 text-red-700"
            }`}
          >
            {mergeFeedback.text}
          </div>
        )}

        {loading && (
          <div className="text-center py-20">
            <div className="inline-block w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 font-semibold">Scanning inventory for duplicates...</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-3xl">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Unable to load</h3>
            <p className="text-red-500 text-sm font-medium mb-6">{error}</p>
            <button
              onClick={loadGroups}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold cursor-pointer border-none transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && groups.length === 0 && (
          <div className="text-center p-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No duplicates found</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Every serial number, asset ID and name+model combination in the inventory is unique.
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          groups.map((group, index) => {
            const keepId = keepByGroup[index];
            const assets = group.assets || [];
            return (
              <div
                key={`${group.matchedOn}-${index}`}
                className="mb-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-800 dark:text-white m-0">
                      Matched on {MATCHED_ON_LABEL[group.matchedOn] || group.matchedOn}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {assets.length} records share the same {MATCHED_ON_LABEL[group.matchedOn] || "identifier"}
                    </p>
                  </div>
                  <button
                    onClick={() => mergeGroup(index)}
                    disabled={merging}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold cursor-pointer border-none transition-colors disabled:opacity-50"
                  >
                    {merging ? "Merging..." : "Merge into selected"}
                  </button>
                </div>

                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700">
                      <th className="px-6 py-3 font-black">Keep</th>
                      <th className="px-6 py-3 font-black">Asset</th>
                      <th className="px-6 py-3 font-black">Serial No.</th>
                      <th className="px-6 py-3 font-black">Model</th>
                      <th className="px-6 py-3 font-black">Department</th>
                      <th className="px-6 py-3 font-black">Units</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((asset) => (
                      <tr
                        key={asset.id}
                        className={`border-b border-slate-100 dark:border-slate-700 last:border-b-0 ${
                          keepId === asset.id ? "bg-blue-50/60 dark:bg-blue-900/10" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="radio"
                            name={`keep-${index}`}
                            checked={keepId === asset.id}
                            onChange={() =>
                              setKeepByGroup((current) => ({ ...current, [index]: asset.id }))
                            }
                            className="accent-blue-600 w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800 dark:text-white text-sm m-0">
                            {asset.name}
                          </p>
                          <p className="text-xs text-slate-400 font-mono m-0">
                            {asset.equipmentCode || `EQ-${asset.id}`}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-medium">
                          {asset.serialNumber || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-medium">
                          {asset.model || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-medium">
                          {asset.department || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-200">
                          {asset.quantity ?? 1}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="px-6 py-3 text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Merging combines the unit counts and moves all lifecycle, maintenance and
                  location history onto the kept record; the other records are archived, not
                  deleted, so the audit trail survives.
                </p>
              </div>
            );
          })}
      </div>
    </div>
  );
}