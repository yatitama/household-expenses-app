import { Modal, View, Text, TouchableOpacity } from 'react-native';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'danger' | 'primary';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '実行',
}) => {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 items-center justify-center">
        <View className="bg-white rounded-xl p-5 max-w-sm w-full mx-4">
          <Text className="text-base font-bold text-gray-900 mb-2">{title}</Text>
          <Text className="text-sm text-gray-600 mb-5">{message}</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-2 bg-gray-100 rounded-lg items-center"
            >
              <Text className="font-medium text-sm text-gray-900">キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { onConfirm(); onClose(); }}
              className="flex-1 py-2 bg-gray-800 rounded-lg items-center"
            >
              <Text className="font-medium text-sm text-white">{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
