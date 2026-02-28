import { View } from 'react-native';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <View className={`bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`} />
);

export const SkeletonCard: React.FC = () => (
  <View className="bg-white rounded-xl p-4 gap-4">
    <View className="flex-row items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-full" />
      <View className="flex-1 gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </View>
    </View>
    <View className="gap-3">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </View>
  </View>
);
