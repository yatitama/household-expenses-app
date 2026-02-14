import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useModalManager } from '../hooks/useModalManager';
import { useAccountOperations } from '../hooks/accounts/useAccountOperations';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { getPendingAmountByPaymentMethod } from '../utils/billingUtils';
import { AssetCard } from '../components/accounts/AssetCard';
import { PaymentMethodCard } from '../components/accounts/PaymentMethodCard';
import { AddTransactionModal } from '../components/accounts/modals/AddTransactionModal';
import { RecurringPaymentModal } from '../components/accounts/modals/RecurringPaymentModal';
import { RecurringPaymentDetailModal } from '../components/accounts/modals/RecurringPaymentDetailModal';
import { CardUnsettledListModal } from '../components/accounts/modals/CardUnsettledListModal';
import { CardUnsettledDetailModal } from '../components/accounts/modals/CardUnsettledDetailModal';
import { AccountModal } from '../components/accounts/modals/AccountModal';
import { AccountDetailModal } from '../components/accounts/modals/AccountDetailModal';
import { PaymentMethodModal } from '../components/accounts/modals/PaymentMethodModal';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog';
import { EmptyState } from '../components/feedback/EmptyState';
import { accountService, paymentMethodService, memberService } from '../services/storage';
import type { Account, AccountInput, RecurringPayment, PaymentMethod, PaymentMethodInput, Transaction } from '../types';

export const AccountsPage = () => {
  const navigate = useNavigate();
  const {
    accounts, paymentMethods, recurringPayments,
    refreshData,
    handleSaveRecurring, handleToggleRecurring, handleDeleteRecurring,
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

  // Add account/payment method modal states
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isAccountDetailModalOpen, setIsAccountDetailModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
  const [isRecurringExpenseModalOpen, setIsRecurringExpenseModalOpen] = useState(false);
  const [isRecurringIncomeModalOpen, setIsRecurringIncomeModalOpen] = useState(false);

  const pendingByPM = getPendingAmountByPaymentMethod();

  useBodyScrollLock(!!activeModal || isRecurringDetailModalOpen || isCardUnsettledSheetOpen || isCardUnsettledDetailOpen || isAccountDetailModalOpen || isAccountModalOpen || isPaymentMethodModalOpen || isRecurringExpenseModalOpen || isRecurringIncomeModalOpen);

  // Handlers
  const handleAddRecurring = (target: { accountId?: string; paymentMethodId?: string }) => {
    openModal({ type: 'recurring', data: { editing: null, target } });
  };
  const handleEditRecurring = (rp: RecurringPayment) => {
    openModal({ type: 'recurring', data: { editing: rp, target: null } });
  };

  const handleRecurringDetailClick = (rp: RecurringPayment) => {
    setSelectedRecurring(rp);
    setIsRecurringDetailModalOpen(true);
  };

  const handleEditRecurringFromDetail = (rp: RecurringPayment) => {
    handleEditRecurring(rp);
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

  // Handle add account
  const handleAddAccount = (input: AccountInput) => {
    try {
      accountService.create(input);
      toast.success('口座を追加しました');
      refreshData();
      setIsAccountModalOpen(false);
    } catch (error) {
      toast.error('口座の追加に失敗しました');
    }
  };

  // Handle account click
  const handleAccountClick = (account: Account) => {
    setSelectedAccount(account);
    setIsAccountDetailModalOpen(true);
  };

  // Handle edit account from detail modal
  const handleEditAccountFromDetail = (account: Account) => {
    setEditingAccount(account);
    setIsAccountModalOpen(true);
  };

  // Handle add payment method
  const handleAddPaymentMethod = (input: PaymentMethodInput) => {
    try {
      paymentMethodService.create(input);
      toast.success('カードを追加しました');
      refreshData();
      setIsPaymentMethodModalOpen(false);
    } catch (error) {
      toast.error('カードの追加に失敗しました');
    }
  };

  // Handle edit account
  const handleEditAccount = (input: AccountInput) => {
    try {
      if (editingAccount) {
        accountService.update(editingAccount.id, input);
        toast.success('口座を更新しました');
      }
      refreshData();
      setIsAccountModalOpen(false);
      setEditingAccount(null);
    } catch (error) {
      toast.error('口座の更新に失敗しました');
    }
  };

  // Handle edit payment method
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

  const keyboardOptions = useMemo(() => ({
    onNewTransaction: () => {
      if (accounts.length > 0) openModal({ type: 'add-transaction', data: { accountId: accounts[0].id } });
    },
    onCloseModal: closeModal,
  }), [accounts, openModal, closeModal]);

  useKeyboardShortcuts(keyboardOptions);

  // Computed values
  const groupedAccounts = accounts.reduce<Record<string, Account[]>>((acc, account) => {
    const memberId = account.memberId;
    if (!acc[memberId]) acc[memberId] = [];
    acc[memberId].push(account);
    return acc;
  }, {});
  const unlinkedPMs = paymentMethods.filter((pm) => !pm.linkedAccountId);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col">
      {/* アセットカード + メインコンテンツ */}
      <div className="overflow-y-auto flex-1">
        <div className="bg-white dark:bg-slate-900 pt-2 md:pt-4 lg:pt-6">
          {accounts.length > 0 && (
            <AssetCard
              groupedAccounts={groupedAccounts}
              paymentMethods={paymentMethods}
              onAccountClick={handleAccountClick}
              onRecurringDetailClick={handleRecurringDetailClick}
              onCardUnsettledSheetOpen={handleCardUnsettledSheetOpen}
              onAddAccountClick={() => { setEditingAccount(null); setIsAccountModalOpen(true); }}
              onAddCardClick={() => setIsPaymentMethodModalOpen(true)}
              onAddRecurringExpenseClick={() => setIsRecurringExpenseModalOpen(true)}
              onAddRecurringIncomeClick={() => setIsRecurringIncomeModalOpen(true)}
            />
          )}
        </div>

        {/* メインコンテンツエリア */}
        <div className="p-1 md:p-2 lg:p-3 space-y-3 md:space-y-4">
          {accounts.length === 0 ? (
            <div className="bg-white rounded-xl">
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
                          onView={() => navigate('/transactions', { state: { filterType: 'payment', paymentMethodIds: [pm.id] } })}
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
      </div>

      {/* モーダル群 */}
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
        onEdit={handleEditRecurringFromDetail}
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

      <AccountDetailModal
        account={selectedAccount}
        isOpen={isAccountDetailModalOpen}
        onClose={() => {
          setIsAccountDetailModalOpen(false);
          setSelectedAccount(null);
        }}
        onEdit={handleEditAccountFromDetail}
      />

      {isAccountModalOpen && (
        <AccountModal
          account={editingAccount}
          members={memberService.getAll()}
          onSave={editingAccount ? handleEditAccount : handleAddAccount}
          onClose={() => {
            setIsAccountModalOpen(false);
            setEditingAccount(null);
          }}
          onDelete={editingAccount ? () => {
            if (editingAccount) {
              accountService.delete(editingAccount.id);
              toast.success('口座を削除しました');
              refreshData();
              setIsAccountModalOpen(false);
              setEditingAccount(null);
            }
          } : undefined}
        />
      )}

      {isPaymentMethodModalOpen && (
        <PaymentMethodModal
          paymentMethod={editingPaymentMethod}
          members={memberService.getAll()}
          accounts={accounts}
          onSave={editingPaymentMethod ? handleEditPaymentMethod : handleAddPaymentMethod}
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
