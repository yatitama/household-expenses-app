import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ChevronLeft, ChevronRight, Tag, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useModalManager } from '../hooks/useModalManager';
import { useAccountOperations } from '../hooks/accounts/useAccountOperations';
import { getUnsettledTransactions, getRecurringPaymentsForMonth } from '../utils/billingUtils';
import { CardGridSection } from '../components/accounts/CardGridSection';
import { RecurringItemGridSection } from '../components/accounts/RecurringItemGridSection';
import { RecurringPaymentModal } from '../components/accounts/modals/RecurringPaymentModal';
import { RecurringPaymentDetailModal } from '../components/accounts/modals/RecurringPaymentDetailModal';
import { CardUnsettledListModal } from '../components/accounts/modals/CardUnsettledListModal';
import { CardUnsettledDetailModal } from '../components/accounts/modals/CardUnsettledDetailModal';
import { PaymentMethodModal } from '../components/accounts/modals/PaymentMethodModal';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog';
import { EmptyState } from '../components/feedback/EmptyState';
import { paymentMethodService, memberService, categoryService } from '../services/storage';
import { formatCurrency } from '../utils/formatters';
import type { RecurringPayment, PaymentMethod, PaymentMethodInput, Transaction } from '../types';

export const AccountsPage = () => {
  const navigate = useNavigate();
  const {
    accounts, paymentMethods,
    refreshData,
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
  const [selectedCardUnsettledPM, setSelectedCardUnsettledPM] = useState<PaymentMethod | null>(null);
  const [cardUnsettledTransactions, setCardUnsettledTransactions] = useState<Transaction[]>([]);
  const [isCardUnsettledSheetOpen, setIsCardUnsettledSheetOpen] = useState(false);
  const [selectedCardUnsettledTransaction, setSelectedCardUnsettledTransaction] = useState<Transaction | null>(null);
  const [isCardUnsettledDetailOpen, setIsCardUnsettledDetailOpen] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
  const [cardViewMode, setCardViewMode] = useState<'category' | 'card'>('category');
  useBodyScrollLock(
    !!activeModal ||
    isRecurringDetailModalOpen ||
    isCardUnsettledSheetOpen ||
    isCardUnsettledDetailOpen ||
    isPaymentMethodModalOpen
  );

  const allUnsettledTransactions = getUnsettledTransactions().filter((t) => {
    const [y, m] = t.date.split('-').map(Number);
    return y === selectedYear && m === selectedMonth;
  });
  const allMonthRecurring = getRecurringPaymentsForMonth(selectedYear, selectedMonth);
  const allUpcomingExpense = allMonthRecurring.filter((rp) => rp.type === 'expense');
  const allUpcomingIncome = allMonthRecurring.filter((rp) => rp.type === 'income');

  const linkedPaymentMethods = paymentMethods.filter((pm) => pm.linkedAccountId);
  const cardUnsettledList = linkedPaymentMethods.map((pm) => {
    const pmUnsettled = allUnsettledTransactions.filter((t) => t.paymentMethodId === pm.id);
    const amount = pmUnsettled.reduce((sum: number, t: Transaction) => {
      return sum + (t.type === 'expense' ? t.amount : -t.amount);
    }, 0);
    return { paymentMethod: pm, unsettledAmount: amount, unsettledTransactions: pmUnsettled };
  });

  const categories = categoryService.getAll();

  // セクション合計
  const totalCardUnsettled = cardUnsettledList.reduce((sum, c) => sum + c.unsettledAmount, 0);
  const totalRecurringExpense = allUpcomingExpense.reduce((sum, rp) => sum + rp.amount, 0);
  const totalRecurringIncome = allUpcomingIncome.reduce((sum, rp) => sum + rp.amount, 0);
  const totalNet = totalRecurringIncome - totalRecurringExpense - totalCardUnsettled;

  const handleEditRecurring = (rp: RecurringPayment) => {
    openModal({ type: 'recurring', data: { editing: rp, target: null } });
  };

  const handleRecurringDetailClick = (rp: RecurringPayment) => {
    setSelectedRecurring(rp);
    setIsRecurringDetailModalOpen(true);
  };

  const handleEditCardFromDetail = (pm: PaymentMethod) => {
    setEditingPaymentMethod(pm);
    setIsPaymentMethodModalOpen(true);
  };

  const handleCardUnsettledSheetOpen = (pm: PaymentMethod, transactions: Transaction[]) => {
    setSelectedCardUnsettledPM(pm);
    setCardUnsettledTransactions(transactions);
    setIsCardUnsettledSheetOpen(true);
  };

  const handleCardUnsettledTransactionClick = (transaction: Transaction) => {
    setSelectedCardUnsettledTransaction(transaction);
    setIsCardUnsettledDetailOpen(true);
  };

  const handleEditPaymentMethod = (input: PaymentMethodInput) => {
    try {
      if (editingPaymentMethod) {
        paymentMethodService.update(editingPaymentMethod.id, input);
        toast.success('カードを更新しました');
      }
      refreshData();
      setIsPaymentMethodModalOpen(false);
      setEditingPaymentMethod(null);
    } catch (error) {
      toast.error('カードの更新に失敗しました');
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
            {/* カードセクション */}
            {linkedPaymentMethods.length > 0 && (
              <div data-section-name="カード利用">
                <div
                  className="sticky bg-white dark:bg-slate-900 z-10 p-2 border-b dark:border-gray-700"
                  style={{ top: 'max(0px, env(safe-area-inset-top))' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">カード利用</h3>
                      <button
                        onClick={() => setCardViewMode((m) => m === 'category' ? 'card' : 'category')}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 transition-colors"
                        title={cardViewMode === 'category' ? 'カードごとに表示' : 'カテゴリごとに表示'}
                      >
                        {cardViewMode === 'category' ? <CreditCard size={14} /> : <Tag size={14} />}
                      </button>
                    </div>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">-{formatCurrency(totalCardUnsettled)}</p>
                  </div>
                </div>
                <div className="pt-2 pb-3 md:pb-4">
                  <CardGridSection
                    paymentMethods={linkedPaymentMethods}
                    cardUnsettledList={cardUnsettledList}
                    onCardClick={handleCardUnsettledSheetOpen}
                    viewMode={cardViewMode}
                    categories={categories}
                  />
                </div>
              </div>
            )}

            {/* 定期支出セクション */}
            <div data-section-name="定期支出">
              <div
                className="sticky bg-white dark:bg-slate-900 z-10 p-2 border-b dark:border-gray-700"
                style={{ top: 'max(0px, env(safe-area-inset-top))' }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">定期支出</h3>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">-{formatCurrency(totalRecurringExpense)}</p>
                </div>
              </div>
              <div className="pt-2 pb-3 md:pb-4">
                <RecurringItemGridSection
                  title=""
                  items={allUpcomingExpense}
                  onItemClick={handleRecurringDetailClick}
                />
              </div>
            </div>

            {/* 定期収入セクション */}
            <div data-section-name="定期収入">
              <div
                className="sticky bg-white dark:bg-slate-900 z-10 p-2 border-b dark:border-gray-700"
                style={{ top: 'max(0px, env(safe-area-inset-top))' }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">定期収入</h3>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">+{formatCurrency(totalRecurringIncome)}</p>
                </div>
              </div>
              <div className="pt-2 pb-3 md:pb-4">
                <RecurringItemGridSection
                  title=""
                  items={allUpcomingIncome}
                  onItemClick={handleRecurringDetailClick}
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

      <CardUnsettledListModal
        paymentMethod={selectedCardUnsettledPM}
        transactions={cardUnsettledTransactions}
        isOpen={isCardUnsettledSheetOpen}
        onClose={() => {
          setIsCardUnsettledSheetOpen(false);
          setSelectedCardUnsettledPM(null);
          setCardUnsettledTransactions([]);
        }}
        onTransactionClick={handleCardUnsettledTransactionClick}
        onEdit={handleEditCardFromDetail}
      />

      <CardUnsettledDetailModal
        transaction={selectedCardUnsettledTransaction}
        isOpen={isCardUnsettledDetailOpen}
        onClose={() => {
          setIsCardUnsettledDetailOpen(false);
          setSelectedCardUnsettledTransaction(null);
        }}
      />

      {isPaymentMethodModalOpen && (
        <PaymentMethodModal
          paymentMethod={editingPaymentMethod}
          members={memberService.getAll()}
          accounts={accounts}
          onSave={handleEditPaymentMethod}
          onClose={() => {
            setIsPaymentMethodModalOpen(false);
            setEditingPaymentMethod(null);
          }}
          onDelete={editingPaymentMethod ? () => {
            if (editingPaymentMethod) {
              paymentMethodService.delete(editingPaymentMethod.id);
              toast.success('カードを削除しました');
              refreshData();
              setIsPaymentMethodModalOpen(false);
              setEditingPaymentMethod(null);
            }
          } : undefined}
        />
      )}

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
