"use client";

export default function Chip({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`chip border ${
        active
          ? "bg-primary text-background border-primary"
          : "bg-surface text-text-secondary border-muted"
      }`}
    >
      {label}
    </button>
  );
}
