import { useEffect } from "react";
import { useToast } from "../../context/ToastContext";
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react";

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const ICON_COLORS = {
  success: "text-green-500",
  error: "text-red-500",
  warning: "text-amber-500",
  info: "text-blue-500",
};

function ToastItem({ toast, onRemove }) {
  const Icon = ICONS[toast.type] || ICONS.info;

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm min-w-[320px] max-w-[420px] animate-slide-in ${STYLES[toast.type] || STYLES.info}`}
    >
      <Icon size={20} className={`mt-0.5 shrink-0 ${ICON_COLORS[toast.type] || ICON_COLORS.info}`} />
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
}
