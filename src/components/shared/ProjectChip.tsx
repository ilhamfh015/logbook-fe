import type { ProjectColor } from "@/types/task";

type ProjectChipProps = {
  name: string;
  color?: ProjectColor;
  hours?: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
};

const colors: Record<ProjectColor, string> = {
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  orange: "border-orange-200 bg-orange-50 text-orange-700",
};

export function ProjectChip({
  name,
  color = "blue",
  hours,
  selected = false,
  onClick,
  disabled = false,
}: ProjectChipProps) {
  const className = `inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${colors[color]} ${
    selected ? "ring-2 ring-brand/20" : ""
  } ${onClick ? "cursor-pointer hover:brightness-95" : ""} ${
    disabled ? "cursor-not-allowed opacity-50" : ""
  }`;
  const content = (
    <>
      <span className={`h-2 w-2 rounded-full ${color === "blue" ? "bg-blue-600" : "bg-orange-600"}`} aria-hidden="true" />
      <span>{name}</span>
      {hours ? <span className="font-medium opacity-75">· {hours}</span> : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={onClick}
        disabled={disabled}
        aria-pressed={selected}
      >
        {content}
      </button>
    );
  }

  return <span className={className}>{content}</span>;
}
