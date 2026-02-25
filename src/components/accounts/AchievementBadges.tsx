import type { Achievement } from '../../utils/growthMetrics';

interface AchievementBadgesProps {
  achievements: Achievement[];
}

export const AchievementBadges = ({ achievements }: AchievementBadgesProps) => {
  if (achievements.length === 0) return null;

  const getBadgeColor = (type: Achievement['type']) => {
    switch (type) {
      case 'savings-goal':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/30',
          border: 'border-blue-200 dark:border-blue-700',
          text: 'text-blue-700 dark:text-blue-400',
        };
      case 'spending-reduction':
        return {
          bg: 'bg-purple-50 dark:bg-purple-900/30',
          border: 'border-purple-200 dark:border-purple-700',
          text: 'text-purple-700 dark:text-purple-400',
        };
      case 'net-income-increase':
        return {
          bg: 'bg-green-50 dark:bg-green-900/30',
          border: 'border-green-200 dark:border-green-700',
          text: 'text-green-700 dark:text-green-400',
        };
      case 'streak':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/30',
          border: 'border-amber-200 dark:border-amber-700',
          text: 'text-amber-700 dark:text-amber-400',
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-800',
          border: 'border-gray-200 dark:border-gray-700',
          text: 'text-gray-700 dark:text-gray-400',
        };
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
          達成
        </h3>
      </div>

      {/* Achievements Grid/Scroll */}
      <div
        className={`
          flex gap-2
          ${achievements.length > 2 ? 'overflow-x-auto pb-2 snap-x snap-mandatory md:overflow-visible md:flex-wrap' : 'flex-wrap'}
        `}
      >
        {achievements.map((achievement, idx) => {
          const colors = getBadgeColor(achievement.type);
          return (
            <div
              key={achievement.id}
              className={`
                flex-shrink-0 md:flex-shrink
                border-2 border-dashed rounded-lg p-3
                ${colors.bg} ${colors.border}
                snap-start md:snap-none
                animate-in fade-in slide-in-from-bottom-2
              `}
              style={{
                animationDelay: `${idx * 100}ms`,
              }}
            >
              <div className={`font-semibold text-sm ${colors.text}`}>
                {achievement.title}
              </div>
              <div className={`text-xs ${colors.text} opacity-75`}>
                {achievement.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
