import { AlertCircle, RefreshCw } from "lucide-react";

export default function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 text-center px-4">
      <AlertCircle size={40} className="text-red-400" />
      <p className="text-sm text-secondary font-medium max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={16} />
          Retry
        </button>
      )}
    </div>
  );
}
