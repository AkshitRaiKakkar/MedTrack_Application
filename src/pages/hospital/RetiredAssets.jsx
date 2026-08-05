import React, { useCallback, useEffect, useState } from "react";
import {
  getRetiredEquipment,
  getEquipmentDisposals,
  downloadDisposalCertificate,
} from "../../services/EquipmentService";
import { useAuth } from "../../context/AuthContext";
import Pagination from "../../components/common/Pagination";

const STATUS_BADGE = {
  RETIRED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  DISPOSED: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

const DISPOSAL_BADGE = {
  PENDING_APPROVAL: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  APPROVED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  REJECTED: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  CANCELLED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export default function RetiredAssets({ onNavigate }) {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  const [disposals, setDisposals] = useState({});
  const [disposalsLoading, setDisposalsLoading] = useState({});
  const [downloadState, setDownloadState] = useState({});
  const [error, setError] = useState(null);

  const fetchRetired = useCallback(async (targetPage = 0) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getRetiredEquipment(targetPage, pageSize);
      const items = response?.content || response?.data || [];
      setEquipment(Array.isArray(items) ? items : []);
      if (response?.totalPages) setTotalPages(response.totalPages);
      if (response?.page !== undefined) setPage(response.page);
    } catch (err) {
      console.error("Failed to fetch retired assets", err);
      setError(err.response?.data?.message || "Failed to load retired assets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRetired();
  }, [fetchRetired]);

  const toggleDisposals = async (id) => {
    if (disposals[id]) {
      setDisposals((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      return;
    }
    setDisposalsLoading((current) => ({ ...current, [id]: true }));
    try {
      const records = await getEquipmentDisposals(id);
      setDisposals((current) => ({ ...current, [id]: records || [] }));
    } catch (err) {
      console.error("Failed to fetch disposal records", err);
      setDisposals((current) => ({ ...current, [id]: [] }));
    } finally {
      setDisposalsLoading((current) => ({ ...current, [id]: false }));
    }
  };

  const handleDownloadCertificate = async (disposal) => {
    setDownloadState((current) => ({ ...current, [disposal.id]: true }));
    try {
      const blob = await downloadDisposalCertificate(disposal.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `disposal-certificate-${disposal.certificateNumber || disposal.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download certificate", err);
      setError(err.response?.data?.message || "Failed to download the certificate of disposal.");
    } finally {
      setDownloadState((current) => ({ ...current, [disposal.id]: false }));
    }
  };

  const formatDate = (value) => value || "N/A";

  const filtered = equipment.filter((item) => {
    const searchValue = search.toLowerCase().trim();
    if (!searchValue) return true;
    return (
      item.name?.toLowerCase().includes(searchValue) ||
      String(item.id).toLowerCase().includes(searchValue) ||
      item.equipmentCode?.toLowerCase().includes(searchValue) ||
      item.model?.toLowerCase().includes(searchValue) ||
      item.department?.toLowerCase().includes(searchValue) ||
      String(item.status || "").toLowerCase().includes(searchValue)
    );
  });

  return (
    <div className="min-h-screen bg-surface p-10 font-sans text-primary">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-5">
        <div>
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 m-0">
            Retired &amp; Disposed Assets
          </h1>
          <p className="text-secondary text-sm mt-2 mb-0">
            Decommissioned equipment keeps its full history and remains searchable here instead of
            being deleted. Certificates of disposal are available for completed records.
          </p>
        </div>

        <div className="flex gap-4 items-center flex-wrap">
          <input
            type="text"
            placeholder="Search retired assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-5 py-3 rounded-lg border border-subtle bg-surface text-primary w-72 text-base shadow-sm outline-none transition-colors focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
          {user?.role === "hospital" && (
            <button
              onClick={() => onNavigate && onNavigate("equipment")}
              className="bg-blue-600 hover:bg-blue-700 text-white border-none px-6 py-3 rounded-lg text-base font-semibold cursor-pointer shadow-md transition-colors"
            >
              ← Inventory
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm font-semibold border border-red-200 dark:border-red-900">
          {error}
        </div>
      )}

      <div className="mb-6 rounded-xl border border-subtle bg-card p-4 shadow-sm">
        <p className="text-primary font-semibold">
          Showing {filtered.length} of {equipment.length} retired asset(s) (Page {page + 1} of {totalPages})
        </p>
      </div>

      {loading && (
        <div className="text-center py-10 text-secondary font-semibold">
          Loading retired assets...
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-10 text-secondary">
          No retired assets match your current search.
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div key={item.id} className="bg-card rounded-xl border border-subtle shadow-sm overflow-hidden">
              <div className="p-5 flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold uppercase inline-block w-fit ${
                        STATUS_BADGE[item.status] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.status || "UNKNOWN"}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase inline-block w-fit bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {item.equipmentCode || "N/A"}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-primary mb-1">{item.name}</h3>
                  <p className="text-sm text-secondary m-0">
                    <strong>ID:</strong> {item.id} · <strong>Model:</strong> {item.model || "N/A"} ·{" "}
                    <strong>Department:</strong> {item.department || "N/A"}
                  </p>
                  <p className="text-sm text-secondary mt-1 m-0">
                    <strong>Serial:</strong> {item.serialNumber || "N/A"} ·{" "}
                    <strong>Purchased:</strong> {formatDate(item.purchaseDate)}
                  </p>
                </div>
                <button
                  onClick={() => toggleDisposals(item.id)}
                  className="shrink-0 px-4 py-2 rounded-lg border border-subtle bg-surface text-secondary text-sm font-bold hover:bg-subtle cursor-pointer transition-colors"
                >
                  {disposals[item.id] ? "Hide Disposal Records" : "View Disposal Records"}
                </button>
              </div>

              {disposalsLoading[item.id] && (
                <div className="px-5 pb-5 text-sm text-secondary font-semibold">
                  Loading disposal records...
                </div>
              )}

              {disposals[item.id] && !disposalsLoading[item.id] && (
                <div className="px-5 pb-5 space-y-3">
                  {disposals[item.id].length === 0 && (
                    <p className="text-sm text-secondary m-0">
                      No disposal records found. This asset may have been retired through the older
                      lifecycle workflow.
                    </p>
                  )}
                  {disposals[item.id].map((disposal) => (
                    <div key={disposal.id} className="rounded-xl border border-subtle bg-surface p-4">
                      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase inline-block w-fit ${
                              DISPOSAL_BADGE[disposal.status] || "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {disposal.status?.replaceAll("_", " ")}
                          </span>
                          <span className="text-xs font-bold text-secondary uppercase tracking-wide">
                            {disposal.disposalMethod?.replaceAll("_", " ")}
                          </span>
                          {disposal.certificateNumber && (
                            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              {disposal.certificateNumber}
                            </span>
                          )}
                        </div>
                        {disposal.status === "COMPLETED" && (
                          <button
                            onClick={() => handleDownloadCertificate(disposal)}
                            disabled={downloadState[disposal.id]}
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold cursor-pointer border-none transition-colors"
                          >
                            {downloadState[disposal.id] ? "Preparing..." : "⬇ Download Certificate (PDF)"}
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-[11px] text-secondary font-bold uppercase tracking-wider block">
                            Reason
                          </span>
                          <p className="m-0 mt-0.5 text-primary font-medium">
                            {disposal.disposalReason || "N/A"}
                          </p>
                        </div>
                        <div>
                          <span className="text-[11px] text-secondary font-bold uppercase tracking-wider block">
                            Effective Date
                          </span>
                          <p className="m-0 mt-0.5 text-primary font-medium">
                            {formatDate(disposal.effectiveDate)}
                          </p>
                        </div>
                        <div>
                          <span className="text-[11px] text-secondary font-bold uppercase tracking-wider block">
                            Data Sanitisation
                          </span>
                          <p className="m-0 mt-0.5 text-primary font-medium">
                            {disposal.storesPatientData ? "Device stored data — " : "No stored data — "}
                            {disposal.dataSanitizationConfirmed
                              ? `Confirmed${disposal.dataSanitizedBy ? ` by ${disposal.dataSanitizedBy}` : ""}`
                              : "Not confirmed"}
                          </p>
                        </div>
                        <div>
                          <span className="text-[11px] text-secondary font-bold uppercase tracking-wider block">
                            Requested By
                          </span>
                          <p className="m-0 mt-0.5 text-primary font-medium">
                            {disposal.requestedBy || "N/A"}
                          </p>
                        </div>
                        <div>
                          <span className="text-[11px] text-secondary font-bold uppercase tracking-wider block">
                            Approved By
                          </span>
                          <p className="m-0 mt-0.5 text-primary font-medium">
                            {disposal.approvedBy || "N/A"}
                          </p>
                        </div>
                        <div>
                          <span className="text-[11px] text-secondary font-bold uppercase tracking-wider block">
                            Completed
                          </span>
                          <p className="m-0 mt-0.5 text-primary font-medium">
                            {disposal.completedAt ? new Date(disposal.completedAt).toLocaleString() : "N/A"}
                          </p>
                        </div>
                      </div>
                      {disposal.notes && (
                        <p className="m-0 mt-3 text-xs text-secondary">{disposal.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <Pagination page={page} totalPages={totalPages} onPageChange={(newPage) => fetchRetired(newPage)} />
      )}
    </div>
  );
}
