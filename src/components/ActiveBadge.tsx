interface ActiveBadgeProps {
  visible: boolean;
  label?: string;
}

export default function ActiveBadge({ visible, label = 'Active' }: ActiveBadgeProps) {
  if (!visible) return null;

  return (
    <div className="absolute top-4 right-4 z-10">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400 backdrop-blur-sm">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        {label}
      </span>
    </div>
  );
}
