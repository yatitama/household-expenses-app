import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useModalManager } from '../hooks/useModalManager';
import { useAccountOperations } from '../hooks/accounts/useAccountOperations';
import { getUnsettledTransactions, getUpcomingRecurringPayments } from '../utils/billingUtils';
import { CardGridSection } from '../components/accounts/CardGridSection';
import { RecurringItemGridSection } from '../components/accounts/RecurringItemGridSection';
import { RecurringPaymentModal } from '../components/accounts/modals/RecurringPaymentModal';
import { RecurringPaymentDetailModal } from '../components/accounts/modals/RecurringPaymentDetailModal';
import { CardUnsettledListModal } from '../components/accounts/modals/CardUnsettledListModal';
import { CardUnsettledDetailModal } from '../components/accounts/modals/CardUnsettledDetailModal';
import { PaymentMethodModal } from '../components/accounts/modals/PaymentMethodModal';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog';
import { EmptyState } from '../components/feedback/EmptyState';
import { paymentMethodService, memberService } from '../services/storage';
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
  const [selectedRecurring, setSelectedRecurring] = useState<RecurringPayment | null>(null);
  const [isRecurringDetailModalOpen, setIsRecurringDetailModalOpen] = useState(false);
  const [selectedCardUnsettledPM, setSelectedCardUnsettledPM] = useState<PaymentMethod | null>(null);
  const [cardUnsettledTransactions, setCardUnsettledTransactions] = useState<Transaction[]>([]);
  const [isCardUnsettledSheetOpen, setIsCardUnsettledSheetOpen] = useState(false);
  const [selectedCardUnsettledTransaction, setSelectedCardUnsettledTransaction] = useState<Transaction | null>(null);
  const [isCardUnsettledDetailOpen, setIsCardUnsettledDetailOpen] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
  const [isRecurringExpenseModalOpen, setIsRecurringExpenseModalOpen] = useState(false);
  const [isRecurringIncomeModalOpen, setIsRecurringIncomeModalOpen] = useState(false);

  useBodyScrollLock(
    !!activeModal ||
    isRecurringDetailModalOpen ||
    isCardUnsettledSheetOpen ||
    isCardUnsettledDetailOpen ||
    isPaymentMethodModalOpen ||
    isRecurringExpenseModalOpen ||
    isRecurringIncomeModalOpen
  );

  const allUnsettledTransactions = getUnsettledTransactions();
  const allUpcomingRecurring = getUpcomingRecurringPayments(31);
  const allUpcomingExpense = allUpcomingRecurring.filter((rp) => rp.type === 'expense');
  const allUpcomingIncome = allUpcomingRecurring.filter((rp) => rp.type === 'income');

  const linkedPaymentMethods = paymentMethods.filter((pm) => pm.linkedAccountId);
  const cardUnsettledList = linkedPaymentMethods.map((pm) => {
    const pmUnsettled = allUnsettledTransactions.filter((t) => t.paymentMethodId === pm.id);
    const amount = pmUnsettled.reduce((sum: number, t: Transaction) => {
      return sum + (t.type === 'expense' ? t.amount : -t.amount);
    }, 0);
    return { paymentMethod: pm, unsettledAmount: amount, unsettledTransactions: pmUnsettled };
  });

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
      <div className="flex-1 overflow-clip">
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
              <div data-section-name="カード">
                <div
                  className="sticky bg-white dark:bg-slate-900 z-10 p-2 border-b dark:border-gray-700"
                  style={{ top: 'max(0px, env(safe-area-inset-top))' }}
                >
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">カード</h3>
                </div>
                <div className="pt-2 pb-3 md:pb-4">
                  <CardGridSection
                    paymentMethods={linkedPaymentMethods}
                    cardUnsettledList={cardUnsettledList}
                    onCardClick={handleCardUnsettledSheetOpen}
                    onAddClick={() => navigate('/money')}
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
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">定期支出</h3>
              </div>
              <div className="pt-2 pb-3 md:pb-4">
                <RecurringItemGridSection
                  title=""
                  items={allUpcomingExpense}
                  onItemClick={handleRecurringDetailClick}
                  onAddClick={() => setIsRecurringExpenseModalOpen(true)}
                />
              </div>
            </div>

            {/* 定期収入セクション */}
            <div data-section-name="定期収入">
              <div
                className="sticky bg-white dark:bg-slate-900 z-10 p-2 border-b dark:border-gray-700"
                style={{ top: 'max(0px, env(safe-area-inset-top))' }}
              >
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">定期収入</h3>
              </div>
              <div className="pt-2 pb-3 md:pb-4">
                <RecurringItemGridSection
                  title=""
                  items={allUpcomingIncome}
                  onItemClick={handleRecurringDetailClick}
                  onAddClick={() => setIsRecurringIncomeModalOpen(true)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* モーダル群 */}
      {activeModal?.type === 'recurring' && activeModal.data && (
        <RecurringPaymentModal
          recurringPayment={activeModal.data.editing}
          defaultAccountId={activeModal.data.target?.accountId}
          defaultPaymentMethodId={activeModal.data.target?.paymentMethodId}
          accounts={accounts}
          paymentMethods={paymentMethods}
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

      {isRecurringExpenseModalOpen && (
        <RecurringPaymentModal
          recurringPayment={null}
          defaultAccountId={accounts[0]?.id}
          accounts={accounts}
          paymentMethods={paymentMethods}
          onSave={(input) => {
            handleSaveRecurring({ ...input, type: 'expense' }, null);
            setIsRecurringExpenseModalOpen(false);
          }}
          onClose={() => setIsRecurringExpenseModalOpen(false)}
          onDelete={() => {}}
        />
      )}

      {isRecurringIncomeModalOpen && (
        <RecurringPaymentModal
          recurringPayment={null}
          defaultAccountId={accounts[0]?.id}
          accounts={accounts}
          paymentMethods={paymentMethods}
          onSave={(input) => {
            handleSaveRecurring({ ...input, type: 'income' }, null);
            setIsRecurringIncomeModalOpen(false);
          }}
          onClose={() => setIsRecurringIncomeModalOpen(false)}
          onDelete={() => {}}
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
