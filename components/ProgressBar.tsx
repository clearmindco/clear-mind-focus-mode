"use client";

interface Props {
  value: number; // 0-100
  label?: string;
  color?: string;
  height?: number;
  showPercent?: boolean;
}

export default function ProgressBar({ value, label, color = "#00d4ff", height = 6, showPercent = false }: Props) {
  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-gray-400">{label}</span>}
          {showPercent && <span className="text-xs font-mono" style={{ color }}>{value}%</span>}
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ background: "#1e2433", height }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
            background: `linear-gradient(90deg, ${color} 0%, ${color}99 100%)`,
            boxShadow: `0 0 8px ${color}55`,
          }}
        />
      </div>
    </div>
  );
}
