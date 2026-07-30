export default function EmptyState({ icon, title = "No data found", description, action }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 text-center px-4">
      {icon && <span className="text-4xl">{icon}</span>}
      <div>
        <p className="text-primary font-semibold">{title}</p>
        {description && <p className="text-sm text-secondary mt-1">{description}</p>}
      </div>
      {action && action}
    </div>
  );
}
