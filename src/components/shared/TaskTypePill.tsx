type TaskTypePillProps = {
  type: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
};

export function TaskTypePill({
  type,
  selected = false,
  onClick,
  disabled = false,
}: TaskTypePillProps) {
  const className = `inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition ${
    selected
      ? "border-brand bg-blue-50 text-brand"
      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
  } ${onClick ? "cursor-pointer" : "cursor-default"} ${
    disabled ? "cursor-not-allowed opacity-50" : ""
  }`;

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={onClick}
        disabled={disabled}
        aria-pressed={selected}
      >
        {type}
      </button>
    );
  }

  return <span className={className}>{type}</span>;
}
