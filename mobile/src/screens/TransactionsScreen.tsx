import { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import { Search, List, Sliders } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTransactionFilter } from '../hooks/useTransactionFilter';
import { categoryService, accountService, paymentMethodService, transactionService } from '../services/storage';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getCategoryIcon } from '../utils/categoryIcons';
import { revertTransactionBalance, applyTransactionBalance } from '../components/accounts/balanceHelpers';
import type { Transaction } from '../types';

export const TransactionsScreen = () => {
  const insets = useSafeAreaInsets();
  const { filters, filteredTransactions, updateFilter } = useTransactionFilter();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const categories = useMemo(() => categoryService.getAll(), []);
  const accounts = useMemo(() => accountService.getAll(), []);
  const paymentMethods = useMemo(() => paymentMethodService.getAll(), []);

  // 日付でグループ化
  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filteredTransactions) {
      const dateKey = t.date.slice(0, 10);
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(t);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredTransactions]);

  const totalExpense = useMemo(
    () => filteredTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [filteredTransactions],
  );
  const totalIncome = useMemo(
    () => filteredTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [filteredTransactions],
  );

  const handleDelete = (t: Transaction) => {
    revertTransactionBalance(t);
    transactionService.delete(t.id);
    Toast.show({ type: 'success', text1: '取引を削除しました' });
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-900" style={{ paddingTop: insets.top }}>
      {/* ヘッダー */}
      <View className="px-4 pt-2 pb-2">
        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-3">履歴</Text>
        {/* 検索バー */}
        <View className="flex-row items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 gap-2">
          <Search size={16} color="#9ca3af" />
          <TextInput
            className="flex-1 py-2.5 text-sm text-gray-900 dark:text-gray-100"
            placeholder="検索..."
            placeholderTextColor="#9ca3af"
            value={filters.searchQuery}
            onChangeText={(v) => updateFilter('searchQuery', v)}
          />
        </View>
      </View>

      {/* 合計 */}
      <View className="mx-4 mb-2 bg-white dark:bg-slate-800 rounded-lg px-4 py-2.5 flex-row gap-6">
        <View>
          <Text className="text-xs text-gray-500">支出</Text>
          <Text className="text-sm font-bold text-red-500">{formatCurrency(totalExpense)}</Text>
        </View>
        <View>
          <Text className="text-xs text-gray-500">収入</Text>
          <Text className="text-sm font-bold text-green-500">{formatCurrency(totalIncome)}</Text>
        </View>
        <View>
          <Text className="text-xs text-gray-500">件数</Text>
          <Text className="text-sm font-bold text-gray-900 dark:text-gray-100">{filteredTransactions.length}件</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
        {grouped.length === 0 ? (
          <View className="items-center justify-center py-16">
            <List size={40} color="#d1d5db" />
            <Text className="text-gray-400 mt-3">取引がありません</Text>
          </View>
        ) : (
          grouped.map(([dateKey, txns]) => (
            <View key={dateKey} className="mb-1">
              {/* 日付ヘッダー */}
              <View className="px-4 py-1.5 bg-gray-100 dark:bg-slate-800">
                <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {formatDate(dateKey)}
                </Text>
              </View>
              {/* 取引リスト */}
              <View className="bg-white dark:bg-slate-900">
                {txns.map((t, idx) => {
                  const cat = categories.find((c) => c.id === t.categoryId);
                  const acc = accounts.find((a) => a.id === t.accountId);
                  const pm = paymentMethods.find((p) => p.id === t.paymentMethodId);
                  const isLast = idx === txns.length - 1;

                  return (
                    <TouchableOpacity
                      key={t.id}
                      className={`flex-row items-center px-4 py-3 ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
                      onLongPress={() => handleDelete(t)}
                    >
                      {/* カテゴリアイコン */}
                      <View
                        className="w-8 h-8 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: cat?.color ?? '#9ca3af' }}
                      >
                        {getCategoryIcon(cat?.icon ?? '', 14, '#fff')}
                      </View>
                      {/* 情報 */}
                      <View className="flex-1 min-w-0">
                        <Text className="text-sm font-medium text-gray-900 dark:text-gray-100" numberOfLines={1}>
                          {cat?.name ?? '不明'}
                        </Text>
                        <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
                          {pm?.name ?? acc?.name ?? ''}
                          {t.memo ? ` · ${t.memo}` : ''}
                        </Text>
                      </View>
                      {/* 金額 */}
                      <Text
                        className={`text-sm font-semibold ${t.type === 'expense' ? 'text-red-500' : 'text-green-600'}`}
                      >
                        {t.type === 'expense' ? '-' : '+'}
                        {formatCurrency(t.amount)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};
