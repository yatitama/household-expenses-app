import { useMemo } from 'react';

interface PiggyBankVisualizationProps {
  totalBalance: number;
  totalSavings: number;
  particleCount: number;
}

export const PiggyBankVisualization = ({
  totalBalance,
  totalSavings,
}: PiggyBankVisualizationProps) => {
  const grandTotal = totalBalance + totalSavings;

  // 金額に応じた色の決定
  const piggyColor = useMemo(() => {
    if (grandTotal === 0) return '#d1d5db'; // gray-300
    if (grandTotal < 1000000) return '#3b82f6'; // blue-500
    if (grandTotal < 5000000) return '#8b5cf6'; // violet-500
    if (grandTotal < 10000000) return '#ec4899'; // pink-500
    return '#f59e0b'; // amber-500
  }, [grandTotal]);

  const fillPercentage = useMemo(() => {
    // 最大1000万円を基準に100%とする
    return Math.min(100, (grandTotal / 10000000) * 100);
  }, [grandTotal]);

  return (
    <div className="relative w-full max-w-sm h-96 flex items-center justify-center">

      {/* 貯金箱（豚）のSVG */}
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full max-w-xs"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* 定義 */}
        <defs>
          {/* グラデーション */}
          <linearGradient id="piggyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={piggyColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={piggyColor} stopOpacity="0.7" />
          </linearGradient>

          {/* 液体のフィルグラデーション */}
          <linearGradient id="liquidGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={piggyColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={piggyColor} stopOpacity="0" />
          </linearGradient>

          {/* アニメーション定義 */}
          <style>{`
            @keyframes piggy-bob {
              0%, 100% {
                transform: translateY(0);
              }
              50% {
                transform: translateY(-4px);
              }
            }

            .piggy-main {
              animation: piggy-bob 2s ease-in-out infinite;
            }
          `}</style>
        </defs>

        {/* 背景サークル（影） */}
        <circle
          cx="100"
          cy="100"
          r="95"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-gray-200 dark:text-gray-700"
        />

        <g className="piggy-main">
          {/* 胴体（メイン） */}
          <ellipse
            cx="100"
            cy="110"
            rx="50"
            ry="55"
            fill="url(#piggyGradient)"
            stroke={piggyColor}
            strokeWidth="2"
          />

          {/* 液体レベル表示 */}
          <ellipse
            cx="100"
            cy={110 + 55 - (55 * fillPercentage) / 100}
            rx="48"
            ry={(55 * fillPercentage) / 100}
            fill="url(#liquidGradient)"
            opacity="0.5"
          />

          {/* 頭 */}
          <circle
            cx="100"
            cy="50"
            r="28"
            fill="url(#piggyGradient)"
            stroke={piggyColor}
            strokeWidth="2"
          />

          {/* 耳左 */}
          <ellipse
            cx="75"
            cy="32"
            rx="10"
            ry="16"
            fill="url(#piggyGradient)"
            stroke={piggyColor}
            strokeWidth="1.5"
          />

          {/* 耳右 */}
          <ellipse
            cx="125"
            cy="32"
            rx="10"
            ry="16"
            fill="url(#piggyGradient)"
            stroke={piggyColor}
            strokeWidth="1.5"
          />

          {/* 鼻 */}
          <ellipse
            cx="100"
            cy="58"
            rx="8"
            ry="6"
            fill={piggyColor}
            opacity="0.8"
          />

          {/* 鼻孔 */}
          <circle
            cx="96"
            cy="58"
            r="1.5"
            fill="#1f2937"
            className="dark:fill-gray-100"
          />
          <circle
            cx="104"
            cy="58"
            r="1.5"
            fill="#1f2937"
            className="dark:fill-gray-100"
          />

          {/* 目左 */}
          <circle
            cx="88"
            cy="45"
            r="2.5"
            fill="#1f2937"
            className="dark:fill-gray-100"
          />

          {/* 目右 */}
          <circle
            cx="112"
            cy="45"
            r="2.5"
            fill="#1f2937"
            className="dark:fill-gray-100"
          />

          {/* 脚左前 */}
          <rect
            x="75"
            y="155"
            width="10"
            height="25"
            rx="5"
            fill={piggyColor}
            stroke={piggyColor}
            strokeWidth="1.5"
          />

          {/* 脚右前 */}
          <rect
            x="115"
            y="155"
            width="10"
            height="25"
            rx="5"
            fill={piggyColor}
            stroke={piggyColor}
            strokeWidth="1.5"
          />

          {/* 脚左後 */}
          <rect
            x="60"
            y="155"
            width="10"
            height="25"
            rx="5"
            fill={piggyColor}
            stroke={piggyColor}
            strokeWidth="1.5"
            opacity="0.8"
          />

          {/* 脚右後 */}
          <rect
            x="130"
            y="155"
            width="10"
            height="25"
            rx="5"
            fill={piggyColor}
            stroke={piggyColor}
            strokeWidth="1.5"
            opacity="0.8"
          />

          {/* 尻尾 */}
          <path
            d="M 150 105 Q 165 100 170 85"
            stroke={piggyColor}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />

          {/* 尻尾カール */}
          <circle
            cx="170"
            cy="85"
            r="2"
            fill={piggyColor}
          />

          {/* コイン投入口 */}
          <ellipse
            cx="100"
            cy="65"
            rx="6"
            ry="4"
            fill="#1f2937"
            className="dark:fill-gray-100"
            opacity="0.7"
          />
        </g>

        {/* 光沢（ハイライト） */}
        <ellipse
          cx="75"
          cy="85"
          rx="12"
          ry="16"
          fill="white"
          opacity="0.15"
          className="dark:opacity-10"
        />
      </svg>

      {/* パーセンテージ表示 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <p className="text-2xl md:text-3xl font-bold" style={{ color: piggyColor }}>
          {Math.round(fillPercentage)}%
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          目標達成度
        </p>
      </div>
    </div>
  );
};
