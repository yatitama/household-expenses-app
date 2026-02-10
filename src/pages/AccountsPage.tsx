import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { memberService } from '../services/storage';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useModalManager } from '../hooks/useModalManager';
import { useAccountOperations } from '../hooks/accounts/useAccountOperations';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { getPendingAmountByPaymentMethod, getTotalPendingByAccount } from '../utils/billingUtils';
import { AssetCard } from '../components/accounts/AssetCard';
import { AccountsCarousel } from '../components/accounts/AccountsCarousel';
import { PendingExpenseSection } from '../components/accounts/PendingExpenseSection';
import { PaymentMethodCard } from '../components/accounts/PaymentMethodCard';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { PMTransactionsModal } from '../components/accounts/modals/PMTransactionsModal';
import { AddTransactionModal } from '../components/accounts/modals/AddTransactionModal';
import { RecurringPaymentModal } from '../components/accounts/modals/RecurringPaymentModal';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog';
import { EmptyState } from '../components/feedback/EmptyState';
import type { Account, RecurringPayment } from '../types';

export const AccountsPage = () => {
  const navigate = useNavigate();
  const {
    accounts, paymentMethods, recurringPayments, appSettings,
    refreshData,
    handleSaveRecurring, handleToggleRecurring,
    handleSaveGradient,
    confirmDialog, closeConfirmDialog,
  } = useAccountOperations();

  const members = memberService.getAll();
  const { activeModal, openModal, closeModal } = useModalManager();
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

  const pendingByPM = getPendingAmountByPaymentMethod();
  const totalPendingByAccount = getTotalPendingByAccount();

  useBodyScrollLock(!!activeModal);

  // Handlers
  const handleAddRecurring = (target: { accountId?: string; paymentMethodId?: string }) => {
    openModal({ type: 'recurring', data: { editing: null, target } });
  };
  const handleEditRecurring = (rp: RecurringPayment) => {
    openModal({ type: 'recurring', data: { editing: rp, target: null } });
  };

  const keyboardOptions = useMemo(() => ({
    onNewTransaction: () => {
      if (accounts.length > 0) openModal({ type: 'add-transaction', data: { accountId: accounts[0].id } });
    },
    onCloseModal: closeModal,
  }), [accounts, openModal, closeModal]);

  useKeyboardShortcuts(keyboardOptions);

  // Computed values
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalExpense = Object.values(totalPendingByAccount).reduce(
    (sum, v) => sum + v.cardPending + v.recurringExpense, 0
  );
  const totalIncome = Object.values(totalPendingByAccount).reduce((sum, v) => sum + v.recurringIncome, 0);
  const netPending = totalExpense - totalIncome;

  const groupedAccounts = accounts.reduce<Record<string, Account[]>>((acc, account) => {
    const memberId = account.memberId;
    if (!acc[memberId]) acc[memberId] = [];
    acc[memberId].push(account);
    return acc;
  }, {});

  const getMember = (memberId: string) => members.find((m) => m.id === memberId);
  const unlinkedPMs = paymentMethods.filter((pm) => !pm.linkedAccountId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* 総資産カード（固定ヘッダー） */}
      <div className="sticky top-0 z-40 bg-gray-50 dark:bg-slate-900 pt-2 md:pt-4 lg:pt-6 px-3 md:px-6 lg:px-8">
        {accounts.length > 0 && (
          <AssetCard
            totalBalance={totalBalance}
            totalExpense={totalExpense}
            totalIncome={totalIncome}
            netPending={netPending}
            accounts={accounts}
            groupedAccounts={groupedAccounts}
            totalPendingByAccount={totalPendingByAccount}
            getMember={getMember}
            isBreakdownOpen={isBreakdownOpen}
            onToggleBreakdown={() => setIsBreakdownOpen(!isBreakdownOpen)}
            gradientFrom={appSettings.totalAssetGradientFrom}
            gradientTo={appSettings.totalAssetGradientTo}
            onSaveGradient={handleSaveGradient}
          />
        )}
      </div>

      {/* メインコンテンツエリア */}
      <div className="p-3 md:p-6 lg:p-8 space-y-3 md:space-y-4">
        {accounts.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm">
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
          <>
            {/* 支出予測セクション */}
            {(totalExpense > 0 || totalIncome > 0) && (
              <PendingExpenseSection
                totalCardPending={Object.values(totalPendingByAccount).reduce(
                  (sum, v) => sum + v.cardPending, 0
                )}
                totalRecurringExpense={Object.values(totalPendingByAccount).reduce(
                  (sum, v) => sum + v.recurringExpense, 0
                )}
                totalRecurringIncome={Object.values(totalPendingByAccount).reduce(
                  (sum, v) => sum + v.recurringIncome, 0
                )}
              />
            )}

            {/* 口座カルーセル */}
            <AccountsCarousel
              accounts={accounts}
              members={members}
              paymentMethods={paymentMethods}
              onEditRecurring={handleEditRecurring}
              onToggleRecurring={handleToggleRecurring}
            />

            {/* 紐づきなし支払い手段 */}
            {unlinkedPMs.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                    紐付未設定のカード ({unlinkedPMs.length}件)
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {unlinkedPMs.map((pm) => {
                    const pmRecurrings = recurringPayments.filter((rp) => rp.paymentMethodId === pm.id);
                    return (
                      <PaymentMethodCard
                        key={pm.id}
                        paymentMethod={pm}
                        linkedAccountName={undefined}
                        pendingAmount={pendingByPM[pm.id] || 0}
                        recurringPayments={pmRecurrings}
                        onView={() => openModal({ type: 'viewing-pm', data: pm })}
                        onAddRecurring={() => handleAddRecurring({ paymentMethodId: pm.id, accountId: pm.linkedAccountId })}
                        onEditRecurring={handleEditRecurring}
                        onToggleRecurring={handleToggleRecurring}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* モーダル群 */}
      {activeModal?.type === 'viewing-pm' && activeModal.data && (
        <PMTransactionsModal
          paymentMethod={activeModal.data}
          onClose={() => { closeModal(); refreshData(); }}
        />
      )}

      {activeModal?.type === 'add-transaction' && activeModal.data && (
        <AddTransactionModal
          defaultAccountId={activeModal.data.accountId}
          defaultPaymentMethodId={activeModal.data.paymentMethodId}
          onSaved={refreshData}
          onClose={() => { closeModal(); refreshData(); }}
        />
      )}

      {activeModal?.type === 'recurring' && activeModal.data && (
        <RecurringPaymentModal
          recurringPayment={activeModal.data.editing}
          defaultAccountId={activeModal.data.target?.accountId}
          defaultPaymentMethodId={activeModal.data.target?.paymentMethodId}
          accounts={accounts}
          paymentMethods={paymentMethods}
          onSave={(input) => { handleSaveRecurring(input, activeModal.data.editing); closeModal(); }}
          onClose={() => closeModal()}
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

      {/* フローティングアクションボタン */}
      {accounts.length > 0 && (
        <FloatingActionButton
          onAddTransaction={() => openModal({ type: 'add-transaction', data: {} })}
          onAddRecurring={() => handleAddRecurring({})}
        />
      )}
    </div>
  );
};
