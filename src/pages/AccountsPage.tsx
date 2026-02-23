import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ChevronLeft, ChevronRight, Tag, CreditCard, Users, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useModalManager } from '../hooks/useModalManager';
import { useAccountOperations } from '../hooks/accounts/useAccountOperations';
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

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear((y) => y - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear((y) => y + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth((m) => m + 1);
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
  const [expenseViewMode, setExpenseViewMode] = useState<CardGridViewMode>('category');
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

  const viewMonth = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

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
      <div className="flex-1 overflow-clip pb-20">
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
          <div className="px-1 md:px-2 lg:px-3 pt-2 md:pt-4 lg:pt-6">
            {/* 支出セクション */}
            <div data-section-name="支出">
              <div
                className="sticky bg-white dark:bg-slate-900 z-10 p-2 border-b dark:border-gray-700"
                style={{ top: 'max(0px, env(safe-area-inset-top))' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1"><TrendingDown size={14} />支出</h3>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => setExpenseViewMode('category')}
                        className={`p-1 rounded transition-colors ${expenseViewMode === 'category' ? 'text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-slate-700' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'}`}
                        title="カテゴリ別"
                      >
                        <Tag size={13} />
                      </button>
                      <button
                        onClick={() => setExpenseViewMode('payment')}
                        className={`p-1 rounded transition-colors ${expenseViewMode === 'payment' ? 'text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-slate-700' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'}`}
                        title="支払い元別"
                      >
                        <CreditCard size={13} />
                      </button>
                      <button
                        onClick={() => setExpenseViewMode('member')}
                        className={`p-1 rounded transition-colors ${expenseViewMode === 'member' ? 'text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-slate-700' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'}`}
                        title="メンバー別"
                      >
                        <Users size={13} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    -{formatCurrency(totalExpenses + totalRecurringExpense)}
                  </p>
                </div>
              </div>
              <div className="pt-2 pb-3 md:pb-4 px-1">
                <CardGridSection
                  transactions={allMonthExpenses}
                  categories={categories}
                  paymentMethods={paymentMethods}
                  members={members}
                  accounts={allAccounts}
                  viewMode={expenseViewMode}
                  onCategoryClick={handleCategoryClick}
                  recurringPayments={allUpcomingExpense}
                  recurringLabel="定期支出"
                  onRecurringClick={() => setIsRecurringExpenseListOpen(true)}
                  emptyMessage="支出なし"
                  month={viewMonth}
                />
              </div>
            </div>

            {/* 収入セクション */}
            <div data-section-name="収入">
              <div
                className="sticky bg-white dark:bg-slate-900 z-10 p-2 border-b dark:border-gray-700"
                style={{ top: 'max(0px, env(safe-area-inset-top))' }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1"><TrendingUp size={14} />収入</h3>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    +{formatCurrency(totalIncomes + totalRecurringIncome)}
                  </p>
                </div>
              </div>
              <div className="pt-2 pb-3 md:pb-4 px-1">
                <CardGridSection
                  transactions={allMonthIncomes}
                  categories={categories}
                  onCategoryClick={handleCategoryClick}
                  recurringPayments={allUpcomingIncome}
                  recurringLabel="定期収入"
                  onRecurringClick={() => setIsRecurringIncomeListOpen(true)}
                  emptyMessage="収入なし"
                  month={viewMonth}
                />
              </div>
            </div>

            {/* 貯金セクション */}
            {savingsGoals.length > 0 && (
              <div data-section-name="貯金">
                <div
                  className="sticky bg-white dark:bg-slate-900 z-10 p-2 border-b dark:border-gray-700"
                  style={{ top: 'max(0px, env(safe-area-inset-top))' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <PiggyBank size={14} className="text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">貯金</h3>
                    </div>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      -{formatCurrency(totalSavings)}
                    </p>
                  </div>
                </div>
                <div className="pt-2 pb-3 md:pb-4 px-1">
                  <div className="grid grid-cols-1 gap-2">
                    {savingsGoals.map((goal) => {
                      const targetMonth = goal.targetDate.substring(0, 7);
                      const isOutOfRange = viewMonth < goal.startMonth || viewMonth > targetMonth;
                      const excluded = isMonthExcluded(goal, viewMonth);
                      const effective = getEffectiveMonthlyAmount(goal, viewMonth);
                      const standard = calculateMonthlyAmount(goal);
                      const hasOverride = !excluded && !isOutOfRange && (goal.monthlyOverrides ?? {})[viewMonth] !== undefined;
                      const isActive = !isOutOfRange && !excluded;
                      return (
                        <button
                          key={goal.id}
                          onClick={() => { if (!isOutOfRange) setSelectedGoalForSheet(goal); }}
                          disabled={isOutOfRange}
                          className={`p-3 text-left transition-all h-24 md:h-28 flex flex-col justify-between ${
                            isOutOfRange
                              ? 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 opacity-40 cursor-default'
                              : excluded
                              ? 'bg-white dark:bg-slate-800 border border-dashed border-gray-300 dark:border-gray-600'
                              : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <PiggyBank size={12} className={isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'} />
                            <span className="text-xs font-medium truncate text-gray-900 dark:text-gray-100">
                              {goal.name}
                            </span>
                          </div>
                          {excluded && !isOutOfRange ? (
                            <p className="text-right text-xs text-gray-400 dark:text-gray-500">除外中</p>
                          ) : isOutOfRange ? (
                            <p className="text-right text-xs text-gray-400 dark:text-gray-500">対象外</p>
                          ) : (
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
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
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 px-1">タップで金額調整・除外設定</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ボトム固定フッター */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-20 bg-white dark:bg-slate-900 border-t dark:border-gray-700 p-1.5">
        <div className="max-w-7xl mx-auto px-1 md:px-2 lg:px-3 flex items-center justify-between">
          {/* 月セレクタ */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[4rem] text-center">
              {selectedYear !== now.getFullYear() ? `${selectedYear}年` : ''}{selectedMonth}月
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          {/* 合計 */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-1.5 text-right flex-shrink-0">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-0.5">合計</p>
            <p className="text-lg md:text-xl font-bold" style={{ color: 'var(--theme-primary)' }}>
              {totalNet >= 0 ? '+' : ''}{formatCurrency(totalNet)}
            </p>
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
        paymentMethodName={expenseViewMode === 'payment' ? selectedDisplayName : undefined}
        memberName={expenseViewMode === 'member' ? selectedDisplayName : undefined}
        displayColor={selectedDisplayColor}
        displayIconType={selectedDisplayIconType}
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
