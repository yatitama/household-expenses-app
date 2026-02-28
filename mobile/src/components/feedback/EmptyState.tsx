import { View, Text, TouchableOpacity } from 'react-native';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconColor?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <View className="flex flex-col items-center justify-center py-12 px-4">
      <View className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        {icon}
      </View>
      <Text className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">{title}</Text>
      <Text className="text-gray-600 dark:text-gray-400 text-center mb-6">{description}</Text>
      {action && (
        <TouchableOpacity
          onPress={action.onClick}
          className="px-6 py-2.5 bg-primary-700 rounded-lg"
        >
          <Text className="text-white font-medium">{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
