import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ChevronLeft, ChevronRight, Tag, CreditCard, Users, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useModalManager } from '../hooks/useModalManager';
import { useAccountOperations } from '../hooks/accounts/useAccountOperations';
import { getRecurringPaymentsForMonth } from '../utils/billingUtils';
import { CardGridSection, type CardGridViewMode } from '../components/accounts/CardGridSection';
import { RecurringPaymentModal } from '../components/accounts/modals/RecurringPaymentModal';
import { RecurringPaymentDetailModal } from '../components/accounts/modals/RecurringPaymentDetailModal';
import { CardUnsettledDetailModal } from '../components/accounts/modals/CardUnsettledDetailModal';
import { CategoryTransactionsModal } from '../components/accounts/modals/CategoryTransactionsModal';
import { RecurringListModal } from '../components/accounts/modals/RecurringListModal';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog';
import { EmptyState } from '../components/feedback/EmptyState';
import { categoryService, transactionService, paymentMethodService, memberService, accountService, savingsGoalService } from '../services/storage';
import { formatCurrency } from '../utils/formatters';
import { calculateMonthlyAmount, getEffectiveMonthlyAmount, isMonthExcluded } from '../utils/savingsUtils';
import { SavingsMonthSheet } from '../components/savings/SavingsMonthSheet';
import type { RecurringPayment, Transaction, Category, SavingsGoal } from '../types';

export const AccountsPage = () => {
  const navigate = useNavigate();
  const {
    accounts,
    handleSaveRecurring, handleDeleteRecurring,
    confirmDialog, closeConfirmDialog,
  } = useAccountOperations();

  const { activeModal, openModal, closeModal } = useModalManager();

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

  const [selectedRecurring, setSelectedRecurring] = useState<RecurringPayment | null>(null);
  const [isRecurringDetailModalOpen, setIsRecurringDetailModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isTransactionDetailOpen, setIsTransactionDetailOpen] = useState(false);
  const [selectedCategoryForModal, setSelectedCategoryForModal] = useState<Category | undefined>(undefined);
  const [categoryModalTransactions, setCategoryModalTransactions] = useState<Transaction[]>([]);
  const [categoryModalRecurringItems, setCategoryModalRecurringItems] = useState<RecurringPayment[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isRecurringExpenseListOpen, setIsRecurringExpenseListOpen] = useState(false);
  const [isRecurringIncomeListOpen, setIsRecurringIncomeListOpen] = useState(false);
  const [expenseViewMode, setExpenseViewMode] = useState<CardGridViewMode>('category');
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => savingsGoalService.getAll());
  const [selectedGoalForSheet, setSelectedGoalForSheet] = useState<SavingsGoal | null>(null);

  useBodyScrollLock(
    !!activeModal ||
    isRecurringDetailModalOpen ||
    isTransactionDetailOpen ||
    isCategoryModalOpen ||
    isRecurringExpenseListOpen ||
    isRecurringIncomeListOpen ||
    !!selectedGoalForSheet
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
  const totalRecurringExpense = allUpcomingExpense.reduce((sum, rp) => sum + rp.amount, 0);
  const totalRecurringIncome = allUpcomingIncome.reduce((sum, rp) => sum + rp.amount, 0);

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

  const handleEditRecurring = (rp: RecurringPayment) => {
    openModal({ type: 'recurring', data: { editing: rp, target: null } });
  };

  const handleRecurringItemClick = (rp: RecurringPayment) => {
    setSelectedRecurring(rp);
    setIsRecurringDetailModalOpen(true);
  };

  const handleCategoryClick = (category: Category | undefined, transactions: Transaction[], recurring: RecurringPayment[]) => {
    setSelectedCategoryForModal(category);
    setCategoryModalTransactions(transactions);
    setCategoryModalRecurringItems(recurring);
    setIsCategoryModalOpen(true);
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setIsCategoryModalOpen(false);
    setSelectedTransaction(transaction);
    setIsTransactionDetailOpen(true);
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
              <div className="pt-2 pb-3 md:pb-4">
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
              <div className="pt-2 pb-3 md:pb-4">
                <CardGridSection
                  transactions={allMonthIncomes}
                  categories={categories}
                  onCategoryClick={handleCategoryClick}
                  recurringPayments={allUpcomingIncome}
                  recurringLabel="定期収入"
                  onRecurringClick={() => setIsRecurringIncomeListOpen(true)}
                  emptyMessage="収入なし"
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
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

      <RecurringPaymentDetailModal
        recurringPayment={selectedRecurring}
        isOpen={isRecurringDetailModalOpen}
        onClose={() => {
          setIsRecurringDetailModalOpen(false);
          setSelectedRecurring(null);
        }}
        onEdit={handleEditRecurring}
      />

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
        }}
        onTransactionClick={handleTransactionClick}
        onRecurringClick={(rp) => {
          setIsCategoryModalOpen(false);
          handleRecurringItemClick(rp);
        }}
      />

      <CardUnsettledDetailModal
        transaction={selectedTransaction}
        isOpen={isTransactionDetailOpen}
        onClose={() => {
          setIsTransactionDetailOpen(false);
          setSelectedTransaction(null);
        }}
      />

      <RecurringListModal
        title="定期支出"
        items={allUpcomingExpense}
        total={totalRecurringExpense}
        isOpen={isRecurringExpenseListOpen}
        onClose={() => setIsRecurringExpenseListOpen(false)}
        onItemClick={(item) => {
          setIsRecurringExpenseListOpen(false);
          handleRecurringItemClick(item);
        }}
      />

      <RecurringListModal
        title="定期収入"
        items={allUpcomingIncome}
        total={totalRecurringIncome}
        isOpen={isRecurringIncomeListOpen}
        onClose={() => setIsRecurringIncomeListOpen(false)}
        onItemClick={(item) => {
          setIsRecurringIncomeListOpen(false);
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

      {selectedGoalForSheet && (
        <SavingsMonthSheet
          goal={selectedGoalForSheet}
          month={viewMonth}
          onSave={(excluded, overrideAmount) => handleSaveSavingsMonth(selectedGoalForSheet.id, excluded, overrideAmount)}
          onClose={() => setSelectedGoalForSheet(null)}
        />
      )}
    </div>
  );
};
