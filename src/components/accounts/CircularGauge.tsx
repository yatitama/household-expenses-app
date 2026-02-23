interface CircularGaugeProps {
  progress: number; // 0-100
  color: string; // hex color
  size?: number; // diameter in pixels
}

export const CircularGauge = ({ progress, color, size = 24 }: CircularGaugeProps) => {
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="flex-shrink-0"
    >
      {/* 背景円 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-gray-200 dark:text-gray-700"
      />
      {/* プログレス円 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        style={{
          transform: `rotate(-90deg)`,
          transformOrigin: `${size / 2}px ${size / 2}px`,
          transition: 'stroke-dashoffset 0.3s ease-in-out',
        }}
      />
    </svg>
  );
};
