import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Users, Tag, CreditCard, RefreshCw, Database,
  ChevronDown, ChevronUp, Plus, Trash2,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import {
  accountService, transactionService, categoryService,
  memberService, paymentMethodService, recurringPaymentService,
  cardBillingService, linkedPaymentMethodService, savingsGoalService,
} from '../services/storage';
import { initializeDefaultData } from '../services/initialData';
import { ICON_NAMES, getCategoryIcon } from '../utils/categoryIcons';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog';
import { COLORS } from '../components/accounts/constants';
import type { Member, Category, TransactionType } from '../types';

const Section = ({
  title, icon, isOpen, onToggle, children,
}: {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <View className="bg-white dark:bg-slate-800 rounded-xl mb-3 overflow-hidden">
    <TouchableOpacity
      onPress={onToggle}
      className="flex-row items-center justify-between px-4 py-3.5"
    >
      <View className="flex-row items-center gap-2">
        {icon}
        <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</Text>
      </View>
      {isOpen ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
    </TouchableOpacity>
    {isOpen && (
      <View className="border-t border-gray-100 dark:border-gray-700 px-4 pb-4 pt-3">
        {children}
      </View>
    )}
  </View>
);

export const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const [membersOpen, setMembersOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);

  const [members, setMembers] = useState(() => memberService.getAll());
  const [categories, setCategories] = useState(() => categoryService.getAll());
  const [categoryType, setCategoryType] = useState<TransactionType>('expense');

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false, title: '', message: '', onConfirm: () => {},
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm });
  };

  const handleDeleteAllData = () => {
    showConfirm(
      '全データを削除',
      'すべてのデータを削除します。この操作は取り消せません。',
      () => {
        accountService.getAll().forEach((a) => accountService.delete(a.id));
        transactionService.getAll().forEach((t) => transactionService.delete(t.id));
        categoryService.getAll().forEach((c) => categoryService.delete(c.id));
        memberService.getAll().filter((m) => !m.isDefault).forEach((m) => memberService.delete(m.id));
        paymentMethodService.getAll().forEach((p) => paymentMethodService.delete(p.id));
        recurringPaymentService.getAll().forEach((r) => recurringPaymentService.delete(r.id));
        cardBillingService.getAll().forEach((b) => cardBillingService.delete(b.id));
        linkedPaymentMethodService.getAll().forEach((l) => linkedPaymentMethodService.delete(l.id));
        savingsGoalService.getAll().forEach((g) => savingsGoalService.delete(g.id));
        initializeDefaultData();
        setMembers(memberService.getAll());
        setCategories(categoryService.getAll());
        Toast.show({ type: 'success', text1: 'データを削除しました' });
      },
    );
  };

  const filteredCategories = categories.filter((c) => c.type === categoryType);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-900" style={{ paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
        <View className="px-4 pt-2 pb-3">
          <Text className="text-2xl font-bold text-gray-900 dark:text-gray-50">設定</Text>
        </View>

        <View className="px-4">
          {/* メンバー管理 */}
          <Section
            title="メンバー管理"
            icon={<Users size={16} color="#6b7280" />}
            isOpen={membersOpen}
            onToggle={() => setMembersOpen(!membersOpen)}
          >
            {members.map((m) => (
              <View key={m.id} className="flex-row items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: m.color }}>
                  <Users size={14} color="#fff" />
                </View>
                <Text className="flex-1 text-sm text-gray-900 dark:text-gray-100">{m.name}</Text>
                {!m.isDefault && (
                  <TouchableOpacity
                    onPress={() => showConfirm('メンバーを削除', `「${m.name}」を削除しますか？`, () => {
                      memberService.delete(m.id);
                      setMembers(memberService.getAll());
                    })}
                  >
                    <Trash2 size={15} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </Section>

          {/* カテゴリ管理 */}
          <Section
            title="カテゴリ管理"
            icon={<Tag size={16} color="#6b7280" />}
            isOpen={categoriesOpen}
            onToggle={() => setCategoriesOpen(!categoriesOpen)}
          >
            <View className="flex-row gap-2 mb-3">
              {(['expense', 'income'] as TransactionType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setCategoryType(t)}
                  className={`px-3 py-1 rounded-full ${categoryType === t ? 'bg-gray-800' : 'bg-gray-100 dark:bg-slate-700'}`}
                >
                  <Text className={`text-xs font-medium ${categoryType === t ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                    {t === 'expense' ? '支出' : '収入'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {filteredCategories.map((cat) => (
              <View key={cat.id} className="flex-row items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <View className="w-7 h-7 rounded-full items-center justify-center mr-3" style={{ backgroundColor: cat.color }}>
                  {getCategoryIcon(cat.icon ?? '', 13, '#fff')}
                </View>
                <Text className="flex-1 text-sm text-gray-900 dark:text-gray-100">{cat.name}</Text>
                <TouchableOpacity
                  onPress={() => showConfirm('カテゴリを削除', `「${cat.name}」を削除しますか？`, () => {
                    categoryService.delete(cat.id);
                    setCategories(categoryService.getAll());
                  })}
                >
                  <Trash2 size={15} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            ))}
          </Section>

          {/* データ管理 */}
          <Section
            title="データ管理"
            icon={<Database size={16} color="#6b7280" />}
            isOpen={dataOpen}
            onToggle={() => setDataOpen(!dataOpen)}
          >
            <TouchableOpacity
              onPress={handleDeleteAllData}
              className="flex-row items-center gap-2 py-2.5 px-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
            >
              <Trash2 size={15} color="#ef4444" />
              <Text className="text-sm text-red-600 dark:text-red-400 font-medium">全データを削除</Text>
            </TouchableOpacity>
          </Section>
        </View>
      </ScrollView>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((p) => ({ ...p, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmVariant="danger"
      />
    </View>
  );
};
