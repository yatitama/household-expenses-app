import { useState, useMemo } from 'react';
import { Wallet } from 'lucide-react';
import { memberService } from '../services/storage';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useAccountOperations } from '../hooks/accounts/useAccountOperations';
import { useAccountDragAndDrop } from '../hooks/accounts/useAccountDragAndDrop';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { getPendingAmountByAccount, getPendingAmountByPaymentMethod, getTotalPendingByAccount } from '../utils/billingUtils';
import { AssetCard } from '../components/accounts/AssetCard';
import { AccountCard } from '../components/accounts/AccountCard';
import { PaymentMethodCard } from '../components/accounts/PaymentMethodCard';
import { AccountTransactionsModal } from '../components/accounts/modals/AccountTransactionsModal';
import { PMTransactionsModal } from '../components/accounts/modals/PMTransactionsModal';
import { AddTransactionModal } from '../components/accounts/modals/AddTransactionModal';
import { RecurringPaymentModal } from '../components/accounts/modals/RecurringPaymentModal';
import { LinkedPaymentMethodModal } from '../components/accounts/modals/LinkedPaymentMethodModal';
import { GradientPickerModal } from '../components/accounts/modals/GradientPickerModal';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog';
import { EmptyState } from '../components/feedback/EmptyState';
import type { Account, PaymentMethod, RecurringPayment, LinkedPaymentMethod } from '../types';

export const AccountsPage = () => {
  const {
    accounts, paymentMethods, recurringPayments, linkedPaymentMethods, appSettings,
    refreshData,
    handleSaveRecurring, handleToggleRecurring,
    handleSaveLinkedPM, handleToggleLinkedPM,
    handleSaveGradient,
    confirmDialog, closeConfirmDialog,
  } = useAccountOperations();

  const dragAndDrop = useAccountDragAndDrop(accounts, refreshData);
  const members = memberService.getAll();

  // Modal state
  const [viewingAccount, setViewingAccount] = useState<Account | null>(null);
  const [viewingPM, setViewingPM] = useState<PaymentMethod | null>(null);
  const [addTransactionTarget, setAddTransactionTarget] = useState<{ accountId?: string; paymentMethodId?: string } | null>(null);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringPayment | null>(null);
  const [recurringTarget, setRecurringTarget] = useState<{ accountId?: string; paymentMethodId?: string } | null>(null);
  const [isLinkedPMModalOpen, setIsLinkedPMModalOpen] = useState(false);
  const [editingLinkedPM, setEditingLinkedPM] = useState<LinkedPaymentMethod | null>(null);
  const [linkedPMTarget, setLinkedPMTarget] = useState<{ accountId: string } | null>(null);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [isGradientPickerOpen, setIsGradientPickerOpen] = useState(false);

  const pendingByAccount = getPendingAmountByAccount();
  const pendingByPM = getPendingAmountByPaymentMethod();
  const totalPendingByAccount = getTotalPendingByAccount();

  const isAnyModalOpen = !!viewingAccount || !!viewingPM || !!addTransactionTarget || isRecurringModalOpen || isLinkedPMModalOpen || isGradientPickerOpen;
  useBodyScrollLock(isAnyModalOpen);

  // Handlers
  const handleAddRecurring = (target: { accountId?: string; paymentMethodId?: string }) => {
    setEditingRecurring(null); setRecurringTarget(target); setIsRecurringModalOpen(true);
  };
  const handleEditRecurring = (rp: RecurringPayment) => {
    setEditingRecurring(rp); setRecurringTarget(null); setIsRecurringModalOpen(true);
  };
  const handleAddLinkedPM = (target: { accountId: string }) => {
    setEditingLinkedPM(null); setLinkedPMTarget(target); setIsLinkedPMModalOpen(true);
  };

  const closeAllModals = () => {
    setViewingAccount(null); setViewingPM(null);
    setAddTransactionTarget(null); setIsRecurringModalOpen(false);
    setIsLinkedPMModalOpen(false); setIsGradientPickerOpen(false);
  };

  const keyboardOptions = useMemo(() => ({
    onNewTransaction: () => {
      if (accounts.length > 0) setAddTransactionTarget({ accountId: accounts[0].id });
    },
    onCloseModal: closeAllModals,
  }), [accounts]);

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
    <div className="p-4 md:p-6 lg:p-8 space-y-4">
      {/* 総資産カード */}
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
        onChangeGradient={() => setIsGradientPickerOpen(true)}
      />

      {/* 口座セクション */}
      <div>
        <div className="flex justify-center items-center mb-2 relative">
          <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">口座</h3>
        </div>

        {accounts.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm">
            <EmptyState
              icon={<Wallet size={32} className="text-gray-400 dark:text-gray-500" />}
              title="口座がありません"
              description="設定から口座を追加してください"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {accounts.map((account) => {
              const member = getMember(account.memberId);
              const accountLinkedPMs = linkedPaymentMethods.filter((lpm) => lpm.accountId === account.id);
              const accountRecurrings = recurringPayments.filter(
                (rp) => rp.accountId === account.id && !rp.paymentMethodId
              );
              return (
                <AccountCard
                  key={account.id}
                  account={account}
                  member={member}
                  pendingAmount={pendingByAccount[account.id] || 0}
                  totalPendingData={totalPendingByAccount[account.id]}
                  linkedPaymentMethodsData={accountLinkedPMs}
                  allPaymentMethods={paymentMethods}
                  pendingByPM={pendingByPM}
                  recurringPayments={accountRecurrings}
                  onView={() => setViewingAccount(account)}
                  onAddTransaction={() => setAddTransactionTarget({ accountId: account.id })}
                  onAddRecurring={() => handleAddRecurring({ accountId: account.id })}
                  onEditRecurring={handleEditRecurring}
                  onToggleRecurring={handleToggleRecurring}
                  onAddLinkedPM={() => handleAddLinkedPM({ accountId: account.id })}
                  onToggleLinkedPM={handleToggleLinkedPM}
                  onViewPM={(pm) => setViewingPM(pm)}
                  isDragging={dragAndDrop.draggedAccountId === account.id}
                  isDragOver={dragAndDrop.dragOverAccountId === account.id}
                  onDragStart={() => dragAndDrop.handleDragStart(account.id)}
                  onDragOver={(e) => dragAndDrop.handleDragOver(e, account.id)}
                  onDrop={(e) => dragAndDrop.handleDrop(e, account.id)}
                  onDragEnd={dragAndDrop.handleDragEnd}
                  onTouchStart={(e) => dragAndDrop.handleTouchStart(e, account.id)}
                  onTouchMove={dragAndDrop.handleTouchMove}
                  onTouchEnd={dragAndDrop.handleTouchEnd}
                  onTouchCancel={dragAndDrop.handleTouchCancel}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* 紐づきなし支払い手段 */}
      {unlinkedPMs.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">引き落とし先未設定</h3>
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
                  onView={() => setViewingPM(pm)}
                  onAddTransaction={() => setAddTransactionTarget({ paymentMethodId: pm.id, accountId: pm.linkedAccountId })}
                  onAddRecurring={() => handleAddRecurring({ paymentMethodId: pm.id, accountId: pm.linkedAccountId })}
                  onEditRecurring={handleEditRecurring}
                  onToggleRecurring={handleToggleRecurring}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* モーダル群 */}
      {viewingAccount && (
        <AccountTransactionsModal
          account={viewingAccount}
          onClose={() => { setViewingAccount(null); refreshData(); }}
        />
      )}

      {viewingPM && (
        <PMTransactionsModal
          paymentMethod={viewingPM}
          onClose={() => { setViewingPM(null); refreshData(); }}
        />
      )}

      {addTransactionTarget && (
        <AddTransactionModal
          defaultAccountId={addTransactionTarget.accountId}
          defaultPaymentMethodId={addTransactionTarget.paymentMethodId}
          onSaved={refreshData}
          onClose={() => { setAddTransactionTarget(null); refreshData(); }}
        />
      )}

      {isRecurringModalOpen && (
        <RecurringPaymentModal
          recurringPayment={editingRecurring}
          defaultAccountId={recurringTarget?.accountId}
          defaultPaymentMethodId={recurringTarget?.paymentMethodId}
          accounts={accounts}
          paymentMethods={paymentMethods}
          onSave={(input) => { handleSaveRecurring(input, editingRecurring); setIsRecurringModalOpen(false); }}
          onClose={() => setIsRecurringModalOpen(false)}
        />
      )}

      {isLinkedPMModalOpen && (
        <LinkedPaymentMethodModal
          linkedPaymentMethod={editingLinkedPM}
          defaultAccountId={linkedPMTarget?.accountId}
          accounts={accounts}
          paymentMethods={paymentMethods}
          onSave={(input) => { handleSaveLinkedPM(input, editingLinkedPM); setIsLinkedPMModalOpen(false); }}
          onClose={() => setIsLinkedPMModalOpen(false)}
        />
      )}

      {isGradientPickerOpen && (
        <GradientPickerModal
          currentFrom={appSettings.totalAssetGradientFrom}
          currentTo={appSettings.totalAssetGradientTo}
          onSave={(from, to) => { handleSaveGradient(from, to); setIsGradientPickerOpen(false); }}
          onClose={() => setIsGradientPickerOpen(false)}
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
