import { ActivityIndicator, Modal, View, Text } from 'react-native';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md' }) => {
  const rnSize = size === 'sm' ? 'small' : 'large';
  return <ActivityIndicator size={rnSize} color="#374151" />;
};

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <Modal transparent animationType="fade">
      <View className="flex-1 bg-black/40 items-center justify-center">
        <View className="bg-white rounded-xl p-8 items-center">
          <ActivityIndicator size="large" color="#374151" />
          {message && (
            <Text className="mt-4 text-gray-900 font-semibold text-center">{message}</Text>
          )}
        </View>
      </View>
    </Modal>
  );
};
