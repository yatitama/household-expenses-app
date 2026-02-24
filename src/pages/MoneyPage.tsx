import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Landmark } from 'lucide-react';
import toast from 'react-hot-toast';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useModalManager } from '../hooks/useModalManager';
import { useAccountOperations } from '../hooks/accounts/useAccountOperations';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { getPendingAmountByPaymentMethod } from '../utils/billingUtils';
import { getCategoryIcon } from '../utils/categoryIcons';
import { SAVINGS_GOAL_ICONS } from '../utils/savingsGoalIcons';
import { getAccountScheduleGroups } from '../utils/scheduledPaymentsUtils';
import { AccountGridSection } from '../components/accounts/AccountGridSection';
import { PaymentMethodCard } from '../components/accounts/PaymentMethodCard';
import { AddTransactionModal } from '../components/accounts/modals/AddTransactionModal';
import { RecurringPaymentModal } from '../components/accounts/modals/RecurringPaymentModal';
import { AccountModal } from '../components/accounts/modals/AccountModal';
import { AccountDetailModal } from '../components/accounts/modals/AccountDetailModal';
import { PaymentMethodModal } from '../components/accounts/modals/PaymentMethodModal';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog';
import { EmptyState } from '../components/feedback/EmptyState';
import { accountService, paymentMethodService, memberService, savingsGoalService } from '../services/storage';
import { formatCurrency } from '../utils/formatters';
import { calculateAccumulatedAmount, toYearMonth } from '../utils/savingsUtils';
import type { Account, AccountInput, RecurringPayment, PaymentMethod, PaymentMethodInput } from '../types';

export const MoneyPage = () => {
  const navigate = useNavigate();
  const {
    accounts, paymentMethods,
    refreshData,
    handleSaveRecurring, handleToggleRecurring, handleDeleteRecurring,
    confirmDialog, closeConfirmDialog,
  } = useAccountOperations();

  const { activeModal, openModal, closeModal } = useModalManager();
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isAccountDetailModalOpen, setIsAccountDetailModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);

  const pendingByPM = getPendingAmountByPaymentMethod();
  const unlinkedPMs = paymentMethods.filter((pm) => !pm.linkedAccountId);
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const currentRealMonth = toYearMonth(new Date());
  const savingsGoals = savingsGoalService.getAll();
  const totalAccumulatedSavings = savingsGoals.reduce((sum, goal) => {
    return sum + calculateAccumulatedAmount(goal, currentRealMonth);
  }, 0);

  const accountScheduleGroups = useMemo(
    () => getAccountScheduleGroups(accounts, paymentMethods),
    [accounts, paymentMethods]
  );

  const scheduledAmounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const g of accountScheduleGroups) {
      map[g.accountId] = g.total;
    }
    return map;
  }, [accountScheduleGroups]);

  const totalScheduledAmount = useMemo(
    () => accountScheduleGroups.reduce((sum, g) => sum + g.total, 0),
    [accountScheduleGroups]
  );

  useBodyScrollLock(!!activeModal || isAccountDetailModalOpen || isAccountModalOpen || isPaymentMethodModalOpen);

  const handleAddRecurring = (_target?: { accountId?: string; paymentMethodId?: string }) => {
    openModal({ type: 'recurring', data: { editing: null, target: null } });
  };

  const handleEditRecurring = (rp: RecurringPayment) => {
    openModal({ type: 'recurring', data: { editing: rp, target: null } });
  };

  const handleAccountClick = (account: Account) => {
    setSelectedAccount(account);
    setIsAccountDetailModalOpen(true);
  };

  const handleEditAccountFromDetail = (account: Account) => {
    setEditingAccount(account);
    setIsAccountModalOpen(true);
  };

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
    onNewTransaction: () => openModal({ type: 'add-transaction' }),
    onCloseModal: closeModal,
  }), [openModal, closeModal]);

  useKeyboardShortcuts(keyboardOptions);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col">
      <div className="flex-1 overflow-clip pb-20">
        <div className="px-1 md:px-2 lg:px-3 pt-2 md:pt-4 lg:pt-6">
          {/* 口座セクション */}
          <div data-section-name="口座" className="relative">
            <div
              className="sticky bg-white dark:bg-slate-900 z-20 p-2 border-b dark:border-gray-700"
              style={{ top: 'max(0px, env(safe-area-inset-top))' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Landmark size={14} className="text-gray-900 dark:text-gray-100" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">口座</h3>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(totalBalance)}
                  </p>
                  {totalScheduledAmount > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      引き落とし予定 -{formatCurrency(totalScheduledAmount)}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="pt-2 pb-3 md:pb-4">
              {accounts.length === 0 ? (
                <EmptyState
                  icon={<Wallet size={32} className="text-gray-500 dark:text-gray-400" />}
                  title="口座がありません"
                  description="設定から口座を追加してください"
                  action={{
                    label: "設定を開く",
                    onClick: () => navigate('/settings')
                  }}
                />
              ) : (
                <AccountGridSection
                  accounts={accounts}
                  scheduledAmounts={scheduledAmounts}
                  onAccountClick={handleAccountClick}
                  onAddClick={() => { setEditingAccount(null); setIsAccountModalOpen(true); }}
                />
              )}
            </div>
          </div>

          {/* 貯金セクション */}
          {savingsGoals.length > 0 && (
            <div data-section-name="貯金" className="relative">
              <div
                className="sticky bg-white dark:bg-slate-900 z-20 p-2 border-b dark:border-gray-700"
                style={{ top: 'max(0px, env(safe-area-inset-top))' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {getCategoryIcon('PiggyBank', 14)}
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">貯金</h3>
                  </div>
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                    -{formatCurrency(totalAccumulatedSavings)}
                  </p>
                </div>
              </div>
              <div className="pt-2 pb-3 md:pb-4">
                <div className="bg-white dark:bg-slate-900 rounded-lg p-1.5 md:p-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {savingsGoals.map((goal) => {
                      const accumulated = calculateAccumulatedAmount(goal, currentRealMonth);
                      const progress = Math.min(100, goal.targetAmount > 0 ? (accumulated / goal.targetAmount) * 100 : 0);
                      const goalColor = goal.color || '#059669';
                      const IconComponent = SAVINGS_GOAL_ICONS[goal.icon as keyof typeof SAVINGS_GOAL_ICONS] || SAVINGS_GOAL_ICONS.PiggyBank;
                      return (
                        <div key={goal.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 p-2.5 md:p-3 flex flex-col gap-2 relative overflow-hidden">
                          {/* Background Icon */}
                          <div className="absolute -left-2 -bottom-2 opacity-10 dark:opacity-20 pointer-events-none" style={{ color: goalColor }}>
                            <IconComponent size={80} />
                          </div>

                          {/* Content */}
                          <div className="relative z-10 flex items-center gap-1.5 px-1 py-0.5">
                            <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate bg-white/50 dark:bg-slate-800/50 px-1 rounded">{goal.name}</p>
                          </div>
                          <p className="relative z-10 text-right text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">
                            ¥{accumulated.toLocaleString()} / ¥{goal.targetAmount.toLocaleString()}
                          </p>
                          <div className="relative z-10 w-full bg-gray-200 dark:bg-gray-700 h-1.5">
                            <div
                              className="h-1.5"
                              style={{ width: `${progress}%`, backgroundColor: goalColor }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 紐付未設定のカード */}
          {unlinkedPMs.length > 0 && (
            <div data-section-name="紐付未設定のカード" className="relative">
              <div
                className="sticky bg-white dark:bg-slate-900 z-20 p-2 border-b dark:border-gray-700"
                style={{ top: 'max(0px, env(safe-area-inset-top))' }}
              >
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">紐付未設定のカード ({unlinkedPMs.length}件)</h3>
              </div>
              <div className="pt-2 pb-3 md:pb-4">
                <div className="bg-white dark:bg-slate-900 rounded-lg p-1.5 md:p-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {unlinkedPMs.map((pm) => {
                      return (
                        <PaymentMethodCard
                          key={pm.id}
                          paymentMethod={pm}
                          linkedAccountName={undefined}
                          pendingAmount={pendingByPM[pm.id] || 0}
                          recurringPayments={[]}
                          onView={() => navigate('/transactions', { state: { filterType: 'payment', paymentMethodIds: [pm.id] } })}
                          onAddRecurring={() => handleAddRecurring({ })}
                          onEditRecurring={handleEditRecurring}
                          onToggleRecurring={handleToggleRecurring}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ボトム固定フッター */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-20 bg-white dark:bg-slate-900 border-t dark:border-gray-700 p-1.5">
        <div className="max-w-7xl mx-auto px-1 md:px-2 lg:px-3 flex items-center justify-end">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-1.5 text-right flex-shrink-0">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-0.5">手元残高</p>
            <p className="text-lg md:text-xl font-bold" style={{ color: 'var(--theme-primary)' }}>
              {(() => {
                const net = totalBalance - totalScheduledAmount - totalAccumulatedSavings;
                return `${net >= 0 ? '+' : ''}${formatCurrency(net)}`;
              })()}
            </p>
          </div>
        </div>
      </div>

      {/* モーダル群 */}
      {activeModal?.type === 'add-transaction' && (
        <AddTransactionModal
          template={activeModal.data?.template}
          onSaved={refreshData}
          onClose={() => { closeModal(); refreshData(); }}
        />
      )}

      {activeModal?.type === 'recurring' && activeModal.data && (
        <RecurringPaymentModal
          recurringPayment={activeModal.data.editing}
          onSave={(input) => { handleSaveRecurring(input, activeModal.data.editing); closeModal(); }}
          onClose={() => closeModal()}
          onDelete={handleDeleteRecurring}
        />
      )}

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
