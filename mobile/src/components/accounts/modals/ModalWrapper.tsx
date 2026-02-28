import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { X } from 'lucide-react-native';

interface ModalWrapperProps {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** フォーム入力モーダルは isForm=true（角丸あり、外タッチで閉じる） */
  isForm?: boolean;
  /** フッターに表示するコンテンツ（保存ボタンなど） */
  footer?: React.ReactNode;
  /** タイトル右横のアクションアイコン（削除ボタンなど） */
  headerAction?: React.ReactNode;
}

export const ModalWrapper = ({
  onClose,
  title,
  children,
  isForm = false,
  footer,
  headerAction,
}: ModalWrapperProps) => {
  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={isForm ? onClose : undefined}>
        <View className="flex-1 bg-black/50 justify-end">
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className={`bg-white dark:bg-slate-800 w-full max-h-[90%] ${isForm ? 'rounded-t-xl' : ''}`}
            >
              {/* ヘッダー */}
              <View className="flex-row items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                <View className="flex-row items-center gap-2 flex-1">
                  <Text className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</Text>
                  {headerAction}
                </View>
                <TouchableOpacity onPress={onClose} className="p-1.5">
                  <X size={18} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {/* コンテンツ */}
              <ScrollView className="p-3" keyboardShouldPersistTaps="handled">
                {children}
              </ScrollView>

              {/* フッター */}
              {footer && (
                <View className="p-3 border-t border-gray-200 dark:border-gray-700">
                  {footer}
                </View>
              )}
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
