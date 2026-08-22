import { AlertTriangle, Inbox, Loader2 } from "lucide-react";

export function StatusBadge({ status }) {
  const map = {
    Present: "bg-sage-100 text-sage-500",
    Approved: "bg-sage-100 text-sage-500",
    Completed: "bg-sage-100 text-sage-500",
    Available: "bg-sage-100 text-sage-500",
    Paid: "bg-sage-100 text-sage-500",
    Absent: "bg-coral-100 text-coral-500",
    Rejected: "bg-coral-100 text-coral-500",
    "Half-day": "bg-amber-100 text-amber-600",
    Pending: "bg-amber-100 text-amber-600",
    Processing: "bg-sky-100 text-sky-500",
    Leave: "bg-sky-100 text-sky-500",
    Cancelled: "bg-navy-900/[0.06] text-navy-500",
    Weekend: "bg-navy-900/[0.06] text-navy-500",
    "—": "bg-navy-900/[0.06] text-navy-500",
    "Not Checked In": "bg-navy-900/[0.06] text-navy-500",
  };
  const cls = map[status] || "bg-navy-900/[0.06] text-navy-500";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="w-12 h-12 rounded-full bg-navy-900/[0.05] flex items-center justify-center mb-4">
        <Icon size={20} className="text-navy-500" />
      </div>
      <p className="font-display font-semibold text-navy-900">{title}</p>
      {description && <p className="text-sm text-navy-500 mt-1 max-w-xs">{description}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="w-12 h-12 rounded-full bg-coral-100 flex items-center justify-center mb-4">
        <AlertTriangle size={20} className="text-coral-500" />
      </div>
      <p className="font-display font-semibold text-navy-900">Something went wrong</p>
      <p className="text-sm text-navy-500 mt-1 max-w-xs">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 text-sm font-semibold text-amber-600 hover:text-amber-500"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function Spinner({ size = 16, className = "" }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} />;
}

export function SkeletonBlock({ className = "" }) {
  return <div className={`skeleton ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="card p-5">
      <SkeletonBlock className="h-3 w-24 mb-3" />
      <SkeletonBlock className="h-7 w-16" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="p-5 space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((__, c) => (
            <SkeletonBlock key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function PrimaryButton({ children, className = "", loading, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-brand-900 text-white font-semibold text-sm px-4 py-2.5 transition hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  );
}

export function AmberButton({ children, className = "", loading, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 text-white font-semibold text-sm px-4 py-2.5 transition hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_6px_16px_-4px_rgba(232,145,42,0.55)] ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = "", loading, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-surface border border-navy-900/10 text-navy-900 font-semibold text-sm px-4 py-2.5 transition hover:bg-navy-900/[0.03] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  );
}

export function Modal({ open, onClose, title, children, footer, width = "max-w-lg" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-surface rounded-2xl shadow-2xl w-full ${width} max-h-[88vh] flex flex-col animate-[fadeIn_.15s_ease-out]`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-900/[0.06]">
          <h3 className="font-display font-semibold text-lg text-navy-900">{title}</h3>
          <button onClick={onClose} className="text-navy-500 hover:text-navy-900 text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-navy-900/[0.06] flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
