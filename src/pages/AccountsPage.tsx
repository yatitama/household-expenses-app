import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ChevronLeft, ChevronRight, PiggyBank, TrendingDown, TrendingUp, LayoutGrid, CreditCard, Users } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useModalManager } from '../hooks/useModalManager';
import { useAccountOperations } from '../hooks/accounts/useAccountOperations';
import { useSwipeMonth } from '../hooks/useSwipeMonth';
import { getRecurringPaymentsForMonth } from '../utils/billingUtils';
import { CardGridSection, type CardGridViewMode } from '../components/accounts/CardGridSection';
import { RecurringPaymentModal } from '../components/accounts/modals/RecurringPaymentModal';
import { RecurringPaymentMonthSheet } from '../components/accounts/modals/RecurringPaymentMonthSheet';
import { EditTransactionModal } from '../components/accounts/modals/EditTransactionModal';
import { CategoryTransactionsModal } from '../components/accounts/modals/CategoryTransactionsModal';
import { RecurringListModal } from '../components/accounts/modals/RecurringListModal';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog';
import { EmptyState } from '../components/feedback/EmptyState';
import { categoryService, transactionService, paymentMethodService, memberService, accountService, savingsGoalService, recurringPaymentService } from '../services/storage';
import { formatCurrency } from '../utils/formatters';
import { calculateMonthlyAmount, getEffectiveMonthlyAmount, isMonthExcluded, getEffectiveRecurringAmount } from '../utils/savingsUtils';
import { getCategoryIcon } from '../utils/categoryIcons';
import { SavingsMonthSheet } from '../components/savings/SavingsMonthSheet';
import type { RecurringPayment, Transaction, Category, SavingsGoal } from '../types';

export const AccountsPage = () => {
  const navigate = useNavigate();
  const {
    accounts,
    handleSaveRecurring, handleDeleteRecurring,
    confirmDialog, closeConfirmDialog,
  } = useAccountOperations();

  const { activeModal, closeModal } = useModalManager();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const viewMonth = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  const setCurrentMonth = useCallback((month: string) => {
    const [y, m] = month.split('-').map(Number);
    setSelectedYear(y);
    setSelectedMonth(m);
  }, []);

  const { containerRef, contentRef, handlePrevMonth, handleNextMonth, getAnimationClass } = useSwipeMonth(viewMonth, setCurrentMonth);

  // グルーピング機能
  type GroupByType = 'category' | 'payment' | 'member';
  const groupByOptions: GroupByType[] = ['category', 'payment', 'member'];

  const handleCycleGroupBy = () => {
    const currentIndex = groupByOptions.indexOf(viewMode);
    const nextIndex = (currentIndex + 1) % groupByOptions.length;
    setViewMode(groupByOptions[nextIndex]);
  };

  const getGroupByLabel = (type: CardGridViewMode) => {
    switch (type) {
      case 'category':
        return { label: 'カテゴリ', icon: <LayoutGrid size={16} /> };
      case 'payment':
        return { label: '支払方法', icon: <CreditCard size={16} /> };
      case 'member':
        return { label: 'メンバー', icon: <Users size={16} /> };
      default:
        return { label: '', icon: null };
    }
  };

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedCategoryForModal, setSelectedCategoryForModal] = useState<Category | undefined>(undefined);
  const [categoryModalTransactions, setCategoryModalTransactions] = useState<Transaction[]>([]);
  const [categoryModalRecurringItems, setCategoryModalRecurringItems] = useState<RecurringPayment[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedDisplayName, setSelectedDisplayName] = useState<string | undefined>(undefined);
  const [selectedDisplayColor, setSelectedDisplayColor] = useState<string | undefined>(undefined);
  const [selectedDisplayIconType, setSelectedDisplayIconType] = useState<'account' | 'user' | undefined>(undefined);
  const [isRecurringExpenseListOpen, setIsRecurringExpenseListOpen] = useState(false);
  const [isRecurringIncomeListOpen, setIsRecurringIncomeListOpen] = useState(false);
  const [viewMode, setViewMode] = useState<CardGridViewMode>('category');
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => savingsGoalService.getAll());
  const [selectedGoalForSheet, setSelectedGoalForSheet] = useState<SavingsGoal | null>(null);
  const [selectedRecurringForMonthSheet, setSelectedRecurringForMonthSheet] = useState<RecurringPayment | null>(null);
  const [recurringMonthSheetSource, setRecurringMonthSheetSource] = useState<'categoryModal' | 'expenseList' | 'incomeList' | null>(null);

  useBodyScrollLock(
    !!activeModal ||
    !!editingTransaction ||
    isCategoryModalOpen ||
    isRecurringExpenseListOpen ||
    isRecurringIncomeListOpen ||
    !!selectedGoalForSheet ||
    !!selectedRecurringForMonthSheet
  );

  const allMonthExpenses = transactionService.getAll().filter((t) => {
    if (t.type !== 'expense') return false;
    const [y, m] = t.date.split('-').map(Number);
    return y === selectedYear && m === selectedMonth;
  });

  const allMonthIncomes = transactionService.getAll().filter((t) => {
    if (t.type !== 'income') return false;
    const [y, m] = t.date.split('-').map(Number);
    return y === selectedYear && m === selectedMonth;
  });

  const allMonthRecurring = getRecurringPaymentsForMonth(selectedYear, selectedMonth);
  const allUpcomingExpense = allMonthRecurring.filter((rp) => rp.type === 'expense');
  const allUpcomingIncome = allMonthRecurring.filter((rp) => rp.type === 'income');

  const categories = categoryService.getAll();
  const paymentMethods = paymentMethodService.getAll();
  const members = memberService.getAll();
  const allAccounts = accountService.getAll();

  const totalExpenses = allMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncomes = allMonthIncomes.reduce((sum, t) => sum + t.amount, 0);
  const totalRecurringExpense = allUpcomingExpense.reduce((sum, rp) => sum + getEffectiveRecurringAmount(rp, viewMonth), 0);
  const totalRecurringIncome = allUpcomingIncome.reduce((sum, rp) => sum + getEffectiveRecurringAmount(rp, viewMonth), 0);

  // 貯金: 表示中の月が除外されていなければ月額を計上 (月別上書きがあればその金額)
  const totalSavings = savingsGoals.reduce((sum, goal) => {
    const targetMonth = goal.targetDate.substring(0, 7);
    if (viewMonth < goal.startMonth || viewMonth > targetMonth) return sum;
    if (isMonthExcluded(goal, viewMonth)) return sum;
    return sum + getEffectiveMonthlyAmount(goal, viewMonth);
  }, 0);

  const totalNet = (totalIncomes + totalRecurringIncome) - (totalExpenses + totalRecurringExpense + totalSavings);

  // 前月データの計算
  const getPreviousMonth = (year: number, month: number) => {
    if (month === 1) {
      return { year: year - 1, month: 12 };
    }
    return { year, month: month - 1 };
  };

  const prevMonthInfo = getPreviousMonth(selectedYear, selectedMonth);
  const prevViewMonth = `${prevMonthInfo.year}-${String(prevMonthInfo.month).padStart(2, '0')}`;

  const prevMonthExpenses = transactionService.getAll().filter((t) => {
    if (t.type !== 'expense') return false;
    const [y, m] = t.date.split('-').map(Number);
    return y === prevMonthInfo.year && m === prevMonthInfo.month;
  });

  const prevMonthIncomes = transactionService.getAll().filter((t) => {
    if (t.type !== 'income') return false;
    const [y, m] = t.date.split('-').map(Number);
    return y === prevMonthInfo.year && m === prevMonthInfo.month;
  });

  const prevMonthRecurring = getRecurringPaymentsForMonth(prevMonthInfo.year, prevMonthInfo.month);
  const prevUpcomingExpense = prevMonthRecurring.filter((rp) => rp.type === 'expense');
  const prevUpcomingIncome = prevMonthRecurring.filter((rp) => rp.type === 'income');

  const prevTotalExpenses = prevMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
  const prevTotalIncomes = prevMonthIncomes.reduce((sum, t) => sum + t.amount, 0);
  const prevTotalRecurringExpense = prevUpcomingExpense.reduce((sum, rp) => sum + getEffectiveRecurringAmount(rp, prevViewMonth), 0);
  const prevTotalRecurringIncome = prevUpcomingIncome.reduce((sum, rp) => sum + getEffectiveRecurringAmount(rp, prevViewMonth), 0);

  const prevTotalSavings = savingsGoals.reduce((sum, goal) => {
    const targetMonth = goal.targetDate.substring(0, 7);
    if (prevViewMonth < goal.startMonth || prevViewMonth > targetMonth) return sum;
    if (isMonthExcluded(goal, prevViewMonth)) return sum;
    return sum + getEffectiveMonthlyAmount(goal, prevViewMonth);
  }, 0);

  const prevTotalNet = (prevTotalIncomes + prevTotalRecurringIncome) - (prevTotalExpenses + prevTotalRecurringExpense + prevTotalSavings);

  // 前月比の計算
  const monthlyChange = totalNet - prevTotalNet;
  const monthlyChangePercent = prevTotalNet !== 0 ? ((monthlyChange / Math.abs(prevTotalNet)) * 100) : 0;

  // セクション別の前月比計算
  const totalCurrentExpenses = totalExpenses + totalRecurringExpense;
  const totalCurrentIncomes = totalIncomes + totalRecurringIncome;
  const totalPrevExpenses = prevTotalExpenses + prevTotalRecurringExpense;
  const totalPrevIncomes = prevTotalIncomes + prevTotalRecurringIncome;

  const expenseMonthlyChange = totalCurrentExpenses - totalPrevExpenses;
  const expenseMonthlyChangePercent = totalPrevExpenses !== 0 ? ((expenseMonthlyChange / totalPrevExpenses) * 100) : 0;
  const incomeMonthlyChange = totalCurrentIncomes - totalPrevIncomes;
  const incomeMonthlyChangePercent = totalPrevIncomes !== 0 ? ((incomeMonthlyChange / totalPrevIncomes) * 100) : 0;

  const handleSaveSavingsMonth = (goalId: string, excluded: boolean, overrideAmount: number | null) => {
    const goal = savingsGoals.find((g) => g.id === goalId);
    if (!goal) return;

    const wasExcluded = isMonthExcluded(goal, viewMonth);
    if (excluded !== wasExcluded) {
      savingsGoalService.toggleExcludeMonth(goalId, viewMonth);
    }
    savingsGoalService.setMonthlyOverride(goalId, viewMonth, overrideAmount);
    setSavingsGoals(savingsGoalService.getAll());
    setSelectedGoalForSheet(null);
  };

  // 定期支払い月別シートを閉じた後、元の親シートを再表示する共通ヘルパー
  const handleReopenAfterRecurringMonthSheet = (source: 'categoryModal' | 'expenseList' | 'incomeList' | null) => {
    if (source === 'categoryModal') {
      const latestAllRecurring = getRecurringPaymentsForMonth(selectedYear, selectedMonth);
      if (selectedCategoryForModal !== undefined) {
        // カテゴリビュー: categoryIdでフィルタリングして再表示
        const allTransactions = transactionService.getAll();
        const filteredTransactions = allTransactions.filter((t) => {
          const [y, m] = t.date.split('-').map(Number);
          return y === selectedYear && m === selectedMonth && t.categoryId === selectedCategoryForModal.id;
        });
        const latestRecurring = latestAllRecurring.filter((rp) => rp.categoryId === selectedCategoryForModal.id);
        setIsCategoryModalOpen(false);
        setTimeout(() => {
          setCategoryModalTransactions(filteredTransactions);
          setCategoryModalRecurringItems(latestRecurring);
          setIsCategoryModalOpen(true);
        }, 0);
      } else {
        // 支払い元/メンバービュー: IDで定期支払いを更新して再表示
        const updatedRecurring = categoryModalRecurringItems
          .map((rp) => latestAllRecurring.find((lrp) => lrp.id === rp.id))
          .filter((rp): rp is RecurringPayment => rp !== undefined);
        setIsCategoryModalOpen(false);
        setTimeout(() => {
          setCategoryModalRecurringItems(updatedRecurring);
          setIsCategoryModalOpen(true);
        }, 0);
      }
    } else if (source === 'expenseList') {
      setIsRecurringExpenseListOpen(false);
      setTimeout(() => setIsRecurringExpenseListOpen(true), 0);
    } else if (source === 'incomeList') {
      setIsRecurringIncomeListOpen(false);
      setTimeout(() => setIsRecurringIncomeListOpen(true), 0);
    }
  };

  const handleSaveRecurringMonth = (rpId: string, overrideAmount: number | null) => {
    const source = recurringMonthSheetSource;
    recurringPaymentService.setMonthlyOverride(rpId, viewMonth, overrideAmount);
    setSelectedRecurringForMonthSheet(null);
    setRecurringMonthSheetSource(null);
    handleReopenAfterRecurringMonthSheet(source);
  };

  const handleCloseRecurringMonthSheet = () => {
    const source = recurringMonthSheetSource;
    setSelectedRecurringForMonthSheet(null);
    setRecurringMonthSheetSource(null);
    handleReopenAfterRecurringMonthSheet(source);
  };

  const handleCloseSavingsMonthSheet = () => {
    setSelectedGoalForSheet(null);
  };

  const handleRecurringItemClick = (rp: RecurringPayment) => {
    setSelectedRecurringForMonthSheet(rp);
  };

  const handleCategoryClick = (category: Category | undefined, transactions: Transaction[], recurring: RecurringPayment[], displayName?: string, displayColor?: string, displayIconType?: 'account' | 'user') => {
    setSelectedCategoryForModal(category);
    setCategoryModalTransactions(transactions);
    setCategoryModalRecurringItems(recurring);
    setSelectedDisplayName(displayName);
    setSelectedDisplayColor(displayColor);
    setSelectedDisplayIconType(displayIconType);
    setIsCategoryModalOpen(true);
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleCloseEditingTransaction = () => {
    setEditingTransaction(null);
    // 明細一覧シートが開いていた場合、最新データを再取得してから再度開く
    if (isCategoryModalOpen) {
      const allTransactions = transactionService.getAll();
      if (selectedCategoryForModal !== undefined) {
        // カテゴリビュー: categoryIdでフィルタリング
        const filtered = allTransactions.filter((t) => {
          const [y, m] = t.date.split('-').map(Number);
          return y === selectedYear && m === selectedMonth && t.categoryId === selectedCategoryForModal.id;
        });
        setIsCategoryModalOpen(false);
        setTimeout(() => {
          setCategoryModalTransactions(filtered);
          setIsCategoryModalOpen(true);
        }, 0);
      } else {
        // 支払い元/メンバービュー: IDで更新（編集・削除を反映）
        const updatedTransactions = categoryModalTransactions
          .map((t) => allTransactions.find((at) => at.id === t.id))
          .filter((t): t is Transaction => t !== undefined);
        setIsCategoryModalOpen(false);
        setTimeout(() => {
          setCategoryModalTransactions(updatedTransactions);
          setIsCategoryModalOpen(true);
        }, 0);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col">
      {/* 月セレクタ（固定ヘッダー） */}
      <div
        className="sticky bg-white dark:bg-slate-900 z-20 p-3 md:p-4 border-b dark:border-gray-700"
        style={{ top: 'max(0px, env(safe-area-inset-top))' }}
      >
        <div className="max-w-7xl mx-auto px-1 md:px-2 lg:px-3 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 min-w-[8rem] text-center tabular-nums">
              {selectedYear}年{selectedMonth}月
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 overflow-clip pb-32">
        {accounts.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={<Wallet size={32} className="text-gray-500 dark:text-gray-400" />}
              title="口座がありません"
              description="設定から口座を追加してください"
              action={{
                label: "設定を開く",
                onClick: () => navigate('/settings')
              }}
            />
          </div>
        ) : (
          <div ref={contentRef} className={`px-1 md:px-2 lg:px-3 pt-2 md:pt-4 lg:pt-6 pb-16 md:pb-20 ${getAnimationClass()}`}>
            {/* 支出セクション */}
            <div data-section-name="支出" className="relative">
              <div className="bg-white dark:bg-slate-900 p-2 border-b dark:border-gray-700">
                <div className="flex items-center justify-between">
                  {/* 左側：タイトル */}
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1"><TrendingDown size={14} />支出</h3>
                  {/* 右側：金額と前月比 */}
                  <div className="flex flex-col items-end gap-0.5">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      -{formatCurrency(totalExpenses + totalRecurringExpense)}
                    </p>
                    {totalPrevExpenses !== 0 && (
                      <span className={`text-xs font-medium whitespace-nowrap ${expenseMonthlyChangePercent === 0 ? 'text-gray-400 dark:text-gray-500' : expenseMonthlyChangePercent < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {expenseMonthlyChangePercent === 0 ? '→' : expenseMonthlyChangePercent < 0 ? '↓' : '↑'} {formatCurrency(Math.abs(expenseMonthlyChange))} ({Math.abs(expenseMonthlyChangePercent).toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-2 pb-3 md:pb-4">
                <CardGridSection
                  transactions={allMonthExpenses}
                  categories={categories}
                  paymentMethods={paymentMethods}
                  members={members}
                  accounts={allAccounts}
                  viewMode={viewMode}
                  onCategoryClick={handleCategoryClick}
                  recurringPayments={allUpcomingExpense}
                  recurringLabel="定期支出"
                  onRecurringClick={() => setIsRecurringExpenseListOpen(true)}
                  emptyMessage="支出なし"
                  month={viewMonth}
                  prevTransactions={prevMonthExpenses}
                  prevRecurringPayments={prevUpcomingExpense}
                  transactionType="expense"
                />
              </div>
            </div>

            {/* 収入セクション */}
            <div data-section-name="収入" className="relative">
              <div className="bg-white dark:bg-slate-900 p-2 border-b dark:border-gray-700">
                <div className="flex items-center justify-between">
                  {/* 左側：タイトル */}
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1"><TrendingUp size={14} />収入</h3>
                  {/* 右側：金額と前月比 */}
                  <div className="flex flex-col items-end gap-0.5">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      +{formatCurrency(totalIncomes + totalRecurringIncome)}
                    </p>
                    {totalPrevIncomes !== 0 && (
                      <span className={`text-xs font-medium whitespace-nowrap ${incomeMonthlyChangePercent === 0 ? 'text-gray-400 dark:text-gray-500' : incomeMonthlyChangePercent > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {incomeMonthlyChangePercent === 0 ? '→' : incomeMonthlyChangePercent > 0 ? '↑' : '↓'} {formatCurrency(Math.abs(incomeMonthlyChange))} ({Math.abs(incomeMonthlyChangePercent).toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-2 pb-3 md:pb-4">
                <CardGridSection
                  transactions={allMonthIncomes}
                  categories={categories}
                  paymentMethods={paymentMethods}
                  members={members}
                  accounts={allAccounts}
                  viewMode={viewMode}
                  onCategoryClick={handleCategoryClick}
                  recurringPayments={allUpcomingIncome}
                  recurringLabel="定期収入"
                  onRecurringClick={() => setIsRecurringIncomeListOpen(true)}
                  emptyMessage="収入なし"
                  month={viewMonth}
                  displayAbsoluteAmount={true}
                  prevTransactions={prevMonthIncomes}
                  prevRecurringPayments={prevUpcomingIncome}
                  transactionType="income"
                />
              </div>
            </div>

            {/* 貯金セクション */}
            {savingsGoals.length > 0 && (
              <div data-section-name="貯金" className="relative">
                <div className="bg-white dark:bg-slate-900 p-2 border-b dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <PiggyBank size={14} />
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">貯金</h3>
                    </div>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      -{formatCurrency(totalSavings)}
                    </p>
                  </div>
                </div>
                <div className="pt-2 pb-3 md:pb-4">
                  <div className="bg-white dark:bg-slate-900 rounded-lg p-1.5 md:p-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {savingsGoals.map((goal) => {
                        const targetMonth = goal.targetDate.substring(0, 7);
                        const isOutOfRange = viewMonth < goal.startMonth || viewMonth > targetMonth;
                        const excluded = isMonthExcluded(goal, viewMonth);
                        const effective = getEffectiveMonthlyAmount(goal, viewMonth);
                        const standard = calculateMonthlyAmount(goal);
                        const hasOverride = !excluded && !isOutOfRange && (goal.monthlyOverrides ?? {})[viewMonth] !== undefined;
                        return (
                          <button
                            key={goal.id}
                            onClick={() => { if (!isOutOfRange) setSelectedGoalForSheet(goal); }}
                            disabled={isOutOfRange}
                            className={`p-2.5 md:p-3 text-left transition-all flex flex-col gap-2 relative overflow-hidden ${
                              isOutOfRange
                                ? 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 opacity-40 cursor-default'
                                : excluded
                                ? 'bg-white dark:bg-slate-800 border border-dashed border-gray-300 dark:border-gray-600'
                                : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            {/* Background Icon */}
                            <div className="absolute -left-2 -bottom-2 opacity-10 dark:opacity-20 pointer-events-none" style={{ color: goal.color || '#10b981' }}>
                              {getCategoryIcon(goal.icon || 'PiggyBank', 80)}
                            </div>

                            {/* Content */}
                            <div className="relative z-10 flex items-center gap-1.5 px-1 py-0.5">
                              <span className="text-xs md:text-sm font-medium truncate text-gray-900 dark:text-gray-100 bg-white/50 dark:bg-slate-800/50 px-1 rounded">
                                {goal.name}
                              </span>
                            </div>
                            {excluded && !isOutOfRange ? (
                              <p className="relative z-10 text-right text-xs text-gray-400 dark:text-gray-500">除外中</p>
                            ) : isOutOfRange ? (
                              <p className="relative z-10 text-right text-xs text-gray-400 dark:text-gray-500">対象外</p>
                            ) : (
                              <div className="relative z-10 text-right">
                                <p className="text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">
                                  ¥{effective.toLocaleString()}
                                </p>
                                {hasOverride && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500 line-through">
                                    ¥{standard.toLocaleString()}
                                  </p>
                                )}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">タップで金額調整・除外設定</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ボトム固定フッター（セーフエリア対応） */}
      <div className="fixed left-0 right-0 z-20 bg-white dark:bg-slate-900 border-t dark:border-gray-700 p-1.5 fixed-above-bottom-nav">
        <div className="max-w-7xl mx-auto px-1 md:px-2 lg:px-3 flex items-center justify-between gap-2">
          {/* 左側：グルーピングボタン */}
          <button
            onClick={handleCycleGroupBy}
            className="px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400 flex-shrink-0 flex items-center gap-1 text-xs font-medium"
            aria-label="グループ化を変更"
          >
            {getGroupByLabel(viewMode).icon}
            <span>{getGroupByLabel(viewMode).label}</span>
          </button>
          {/* 右側：合計と前月比（一段） */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-1.5 text-right flex-shrink-0 flex items-baseline gap-3">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-0.5">合計</p>
              <p className="text-lg md:text-xl font-bold tabular-nums" style={{ color: 'var(--theme-primary)' }}>
                {totalNet >= 0 ? '+' : ''}{formatCurrency(totalNet)}
              </p>
            </div>
            <div className={`text-xs font-medium tabular-nums ${monthlyChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              <p>{monthlyChange >= 0 ? '↑' : '↓'} {formatCurrency(Math.abs(monthlyChange))}</p>
              <p>({Math.abs(monthlyChangePercent).toFixed(1)}%)</p>
            </div>
          </div>
        </div>
      </div>

      {/* モーダル群 */}
      {activeModal?.type === 'recurring' && activeModal.data && (
        <RecurringPaymentModal
          recurringPayment={activeModal.data.editing}
          onSave={(input) => { handleSaveRecurring(input, activeModal.data.editing); closeModal(); }}
          onClose={() => closeModal()}
          onDelete={handleDeleteRecurring}
        />
      )}

      <CategoryTransactionsModal
        category={selectedCategoryForModal}
        transactions={categoryModalTransactions}
        recurringPayments={categoryModalRecurringItems}
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setSelectedCategoryForModal(undefined);
          setCategoryModalTransactions([]);
          setCategoryModalRecurringItems([]);
          setSelectedDisplayName(undefined);
          setSelectedDisplayColor(undefined);
          setSelectedDisplayIconType(undefined);
        }}
        onTransactionClick={handleTransactionClick}
        onRecurringClick={(rp) => {
          setIsCategoryModalOpen(false);
          setRecurringMonthSheetSource('categoryModal');
          handleRecurringItemClick(rp);
        }}
        paymentMethodName={viewMode === 'payment' ? selectedDisplayName : undefined}
        memberName={viewMode === 'member' ? selectedDisplayName : undefined}
        displayColor={selectedDisplayColor}
        displayIconType={selectedDisplayIconType}
        month={viewMonth}
      />

      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          accounts={allAccounts}
          paymentMethods={paymentMethods}
          categories={categories}
          onSave={(input) => {
            transactionService.update(editingTransaction.id, input);
            handleCloseEditingTransaction();
          }}
          onClose={handleCloseEditingTransaction}
          onDelete={(id) => {
            transactionService.delete(id);
            handleCloseEditingTransaction();
          }}
        />
      )}

      <RecurringListModal
        title="定期支出"
        items={allUpcomingExpense}
        total={totalRecurringExpense}
        month={viewMonth}
        isOpen={isRecurringExpenseListOpen}
        onClose={() => setIsRecurringExpenseListOpen(false)}
        onItemClick={(item) => {
          setIsRecurringExpenseListOpen(false);
          setRecurringMonthSheetSource('expenseList');
          handleRecurringItemClick(item);
        }}
      />

      <RecurringListModal
        title="定期収入"
        items={allUpcomingIncome}
        total={totalRecurringIncome}
        month={viewMonth}
        isOpen={isRecurringIncomeListOpen}
        onClose={() => setIsRecurringIncomeListOpen(false)}
        onItemClick={(item) => {
          setIsRecurringIncomeListOpen(false);
          setRecurringMonthSheetSource('incomeList');
          handleRecurringItemClick(item);
        }}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="削除"
        confirmVariant="danger"
      />

      {selectedRecurringForMonthSheet && (
        <RecurringPaymentMonthSheet
          payment={selectedRecurringForMonthSheet}
          month={viewMonth}
          onSave={(overrideAmount) => handleSaveRecurringMonth(selectedRecurringForMonthSheet.id, overrideAmount)}
          onClose={handleCloseRecurringMonthSheet}
        />
      )}

      {selectedGoalForSheet && (
        <SavingsMonthSheet
          goal={selectedGoalForSheet}
          month={viewMonth}
          onSave={(excluded, overrideAmount) => handleSaveSavingsMonth(selectedGoalForSheet.id, excluded, overrideAmount)}
          onClose={handleCloseSavingsMonthSheet}
        />
      )}
    </div>
  );
};
