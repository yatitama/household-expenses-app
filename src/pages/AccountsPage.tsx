import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ChevronLeft, ChevronRight, Tag, CreditCard, Users } from 'lucide-react';
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
import { categoryService, transactionService, paymentMethodService, memberService, accountService } from '../services/storage';
import { formatCurrency } from '../utils/formatters';
import type { RecurringPayment, Transaction, Category } from '../types';

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
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isRecurringExpenseListOpen, setIsRecurringExpenseListOpen] = useState(false);
  const [isRecurringIncomeListOpen, setIsRecurringIncomeListOpen] = useState(false);
  const [expenseViewMode, setExpenseViewMode] = useState<CardGridViewMode>('category');

  useBodyScrollLock(
    !!activeModal ||
    isRecurringDetailModalOpen ||
    isTransactionDetailOpen ||
    isCategoryModalOpen ||
    isRecurringExpenseListOpen ||
    isRecurringIncomeListOpen
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
  const totalRecurringExpense = allUpcomingExpense.reduce((sum, rp) => sum + rp.amount, 0);
  const totalRecurringIncome = allUpcomingIncome.reduce((sum, rp) => sum + rp.amount, 0);
  const totalNet = (totalIncomes + totalRecurringIncome) - (totalExpenses + totalRecurringExpense);

  const handleEditRecurring = (rp: RecurringPayment) => {
    openModal({ type: 'recurring', data: { editing: rp, target: null } });
  };

  const handleRecurringItemClick = (rp: RecurringPayment) => {
    setSelectedRecurring(rp);
    setIsRecurringDetailModalOpen(true);
  };

  const handleCategoryClick = (category: Category | undefined, transactions: Transaction[]) => {
    setSelectedCategoryForModal(category);
    setCategoryModalTransactions(transactions);
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
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">支出</h3>
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
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">収入</h3>
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
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setSelectedCategoryForModal(undefined);
          setCategoryModalTransactions([]);
        }}
        onTransactionClick={handleTransactionClick}
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
    </div>
  );
};
