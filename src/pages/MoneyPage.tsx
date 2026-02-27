import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Wallet, CreditCard, RefreshCw, ChevronDown, ChevronsUp, ChevronsDown, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useModalManager } from '../hooks/useModalManager';
import { useAccountOperations } from '../hooks/accounts/useAccountOperations';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { getPendingAmountByPaymentMethod } from '../utils/billingUtils';
import { getCategoryIcon } from '../utils/categoryIcons';
import { SAVINGS_GOAL_ICONS } from '../utils/savingsGoalIcons';
import { getAccountScheduleGroups } from '../utils/scheduledPaymentsUtils';
import { PaymentMethodCard } from '../components/accounts/PaymentMethodCard';
import { ACCOUNT_TYPE_LABELS, PM_TYPE_LABELS } from '../components/accounts/constants';
import { AddTransactionModal } from '../components/accounts/modals/AddTransactionModal';
import { RecurringPaymentModal } from '../components/accounts/modals/RecurringPaymentModal';
import { AccountModal } from '../components/accounts/modals/AccountModal';
import { AccountDetailModal } from '../components/accounts/modals/AccountDetailModal';
import { PaymentMethodModal } from '../components/accounts/modals/PaymentMethodModal';
import { UnsettledCardDetailModal } from '../components/accounts/modals/UnsettledCardDetailModal';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog';
import { EmptyState } from '../components/feedback/EmptyState';
import { accountService, paymentMethodService, memberService, savingsGoalService } from '../services/storage';
import { formatCurrency } from '../utils/formatters';
import { calculateAccumulatedAmount, toYearMonth } from '../utils/savingsUtils';
import type { Account, AccountInput, RecurringPayment, PaymentMethod, PaymentMethodInput, Transaction } from '../types';
import type { RecurringItem } from '../utils/scheduledPaymentsUtils';

interface UnsettledCardModalData {
  pm: PaymentMethod;
  paymentMonth: string;
  transactions: Transaction[];
  recurringItems: RecurringItem[];
  total: number;
}

const getPeriodLabel = (payment: RecurringPayment): string => {
  if (payment.periodType === 'months') {
    return payment.periodValue === 1 ? '毎月' : `${payment.periodValue}ヶ月ごと`;
  }
  return payment.periodValue === 1 ? '毎日' : `${payment.periodValue}日ごと`;
};

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
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [isSavingsExpanded, setIsSavingsExpanded] = useState(false);
  const [unsettledCardModal, setUnsettledCardModal] = useState<UnsettledCardModalData | null>(null);

  const pendingByPM = getPendingAmountByPaymentMethod();
  const unlinkedPMs = paymentMethods.filter((pm) => !pm.linkedAccountId);

  const members = useMemo(() => memberService.getAll(), []);
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

  const sortedAccounts = useMemo(
    () => [...accounts].sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity)),
    [accounts]
  );

  const totalNet = useMemo(
    () => sortedAccounts.reduce((sum, account) => {
      const scheduled = scheduledAmounts[account.id] ?? 0;
      return sum + account.balance - scheduled;
    }, 0),
    [sortedAccounts, scheduledAmounts]
  );

  const selectedAccountSchedule = useMemo(
    () => accountScheduleGroups.find((g) => g.accountId === selectedAccount?.id) ?? null,
    [accountScheduleGroups, selectedAccount]
  );

  const toggleAccountExpanded = (accountId: string) => {
    setExpandedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  const isAllExpanded = expandedAccounts.size === sortedAccounts.length &&
    (savingsGoals.length === 0 || isSavingsExpanded);

  const handleToggleAllAccounts = () => {
    if (isAllExpanded) {
      setExpandedAccounts(new Set());
      setIsSavingsExpanded(false);
    } else {
      setExpandedAccounts(new Set(sortedAccounts.map((a) => a.id)));
      if (savingsGoals.length > 0) setIsSavingsExpanded(true);
    }
  };

  useBodyScrollLock(!!activeModal || isAccountDetailModalOpen || isAccountModalOpen || isPaymentMethodModalOpen || !!unsettledCardModal);

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
      <div className="flex-1 overflow-clip pb-32">
        <div className="p-2 md:p-4 lg:p-6">

          {/* 口座セクション群 */}
          {sortedAccounts.length === 0 ? (
            <EmptyState
              icon={<Wallet size={32} className="text-gray-500 dark:text-gray-400" />}
              title="口座がありません"
              description="設定から口座を追加してください"
              action={{
                label: '設定を開く',
                onClick: () => navigate('/settings'),
              }}
            />
          ) : (
            <div className="space-y-2 md:space-y-3">
              {sortedAccounts.map((account) => {
                const scheduleGroup = accountScheduleGroups.find((g) => g.accountId === account.id) ?? null;
                const scheduled = scheduledAmounts[account.id] ?? 0;
                const sectionTotal = account.balance - scheduled;
                const isExpanded = expandedAccounts.has(account.id);
                const member = members.find((m) => m.id === account.memberId);

                return (
                  <div key={account.id} className="mb-3">
                    <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg">
                      {/* セクションヘッダー */}
                      <button
                        onClick={() => toggleAccountExpanded(account.id)}
                        className="sticky w-full px-3 py-3 bg-white dark:bg-gray-800 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-[background-color] text-left z-10 rounded-t-lg"
                        style={{ top: 'max(0px, env(safe-area-inset-top))' }}
                      >
                        <div className="flex items-center gap-1 flex-1">
                          <ChevronDown
                            size={16}
                            className={`text-gray-600 dark:text-gray-400 transition-transform flex-shrink-0 -ml-1 ${isExpanded ? 'rotate-180' : ''}`}
                          />
                          <div className="flex-shrink-0" style={{ color: account.color }}>
                            {account.icon ? getCategoryIcon(account.icon, 16) : <Wallet size={16} />}
                          </div>
                          <p className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 text-left">
                            {account.name}
                          </p>
                        </div>
                        <p className={`text-xs md:text-sm font-bold flex-shrink-0 -mr-1 ${
                          sectionTotal >= 0 ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {sectionTotal >= 0 ? '+' : ''}{formatCurrency(sectionTotal)}
                        </p>
                      </button>

                      {/* セクション本体 */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 dark:border-gray-700 px-0 pb-0 pt-0">
                          {/* 残高 明細 */}
                          <button
                            onClick={() => handleAccountClick(account)}
                            className="w-full flex flex-col gap-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <div className="flex-shrink-0" style={{ color: account.color }}>
                                  <Wallet size={14} />
                                </div>
                                <p className="truncate text-xs md:text-sm text-gray-900 dark:text-gray-100 font-medium">
                                  残高
                                </p>
                              </div>
                              <span
                                className="text-xs md:text-sm font-semibold flex-shrink-0"
                                style={{ color: 'var(--theme-primary)' }}
                              >
                                +{formatCurrency(account.balance)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 text-xs md:text-xs text-gray-600 dark:text-gray-400">
                              <span>{ACCOUNT_TYPE_LABELS[account.type]}</span>
                              <span className="truncate">{member?.name || '—'}</span>
                            </div>
                          </button>

                          {/* 引き落とし明細 */}
                          {scheduleGroup && scheduleGroup.entries.flatMap((entry) => {
                            if (entry.kind === 'card') {
                              return entry.monthGroup.cards.map((cardEntry) => (
                                <button
                                  key={`card-${entry.monthGroup.month}-${cardEntry.pm.id}`}
                                  onClick={() => setUnsettledCardModal({
                                    pm: cardEntry.pm,
                                    paymentMonth: entry.monthGroup.month,
                                    transactions: cardEntry.transactions,
                                    recurringItems: cardEntry.recurringItems,
                                    total: cardEntry.total,
                                  })}
                                  className="w-full flex flex-col gap-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                      <div className="flex-shrink-0" style={{ color: cardEntry.pm.color }}>
                                        <CreditCard size={14} />
                                      </div>
                                      <p className="truncate text-xs md:text-sm text-gray-900 dark:text-gray-100 font-medium">
                                        {cardEntry.pm.name}
                                      </p>
                                    </div>
                                    <span className="text-xs md:text-sm font-semibold flex-shrink-0 text-red-600">
                                      -{formatCurrency(cardEntry.total)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2 text-xs md:text-xs text-gray-600 dark:text-gray-400">
                                    <span>
                                      {entry.monthGroup.paymentDate
                                        ? format(entry.monthGroup.paymentDate, 'M月d日')
                                        : '—'}
                                    </span>
                                    <span className="truncate">{PM_TYPE_LABELS[cardEntry.pm.type]}</span>
                                  </div>
                                </button>
                              ));
                            }
                            return entry.dateGroup.items.map(({ rp, amount }) => (
                              <div
                                key={`recurring-${entry.dateGroup.key}-${rp.id}`}
                                className="w-full flex flex-col gap-2 p-3"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <div className="flex-shrink-0 text-gray-400 dark:text-gray-500">
                                      <RefreshCw size={14} />
                                    </div>
                                    <p className="truncate text-xs md:text-sm text-gray-900 dark:text-gray-100 font-medium">
                                      {rp.name}
                                    </p>
                                  </div>
                                  <span className="text-xs md:text-sm font-semibold flex-shrink-0 text-red-600">
                                    -{formatCurrency(amount)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-2 text-xs md:text-xs text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <span>{entry.dateGroup.date ? format(entry.dateGroup.date, 'M月d日') : '—'}</span>
                                    <RefreshCw size={10} className="flex-shrink-0" />
                                    <span>{getPeriodLabel(rp)}</span>
                                  </div>
                                  <span>—</span>
                                </div>
                              </div>
                            ));
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 貯金セクション */}
          {savingsGoals.length > 0 && (
            <div className="mb-3 mt-2 md:mt-3">
              <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg">
                {/* セクションヘッダー */}
                <button
                  onClick={() => setIsSavingsExpanded(!isSavingsExpanded)}
                  className="sticky w-full px-3 py-3 bg-white dark:bg-gray-800 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-[background-color] text-left z-10 rounded-t-lg"
                  style={{ top: 'max(0px, env(safe-area-inset-top))' }}
                >
                  <div className="flex items-center gap-1 flex-1">
                    <ChevronDown
                      size={16}
                      className={`text-gray-600 dark:text-gray-400 transition-transform flex-shrink-0 -ml-1 ${isSavingsExpanded ? 'rotate-180' : ''}`}
                    />
                    <div className="flex-shrink-0 text-green-600 dark:text-green-500">
                      {getCategoryIcon('PiggyBank', 16)}
                    </div>
                    <p className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 text-left">
                      貯金
                    </p>
                  </div>
                  <p className="text-xs md:text-sm font-bold flex-shrink-0 -mr-1 text-gray-900 dark:text-gray-100">
                    -{formatCurrency(totalAccumulatedSavings)}
                  </p>
                </button>

                {/* セクション本体 */}
                {isSavingsExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 px-0 pb-0 pt-0">
                    {savingsGoals.map((goal) => {
                      const accumulated = calculateAccumulatedAmount(goal, currentRealMonth);
                      const progress = Math.min(100, goal.targetAmount > 0 ? (accumulated / goal.targetAmount) * 100 : 0);
                      const goalColor = goal.color || '#059669';
                      const IconComponent = SAVINGS_GOAL_ICONS[goal.icon as keyof typeof SAVINGS_GOAL_ICONS] || SAVINGS_GOAL_ICONS.PiggyBank;
                      return (
                        <div key={goal.id} className="w-full flex flex-col gap-2 p-3">
                          {/* 上段: アイコン + 目標名 | 積立済み金額 */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <div className="flex-shrink-0" style={{ color: goalColor }}>
                                <IconComponent size={14} />
                              </div>
                              <p className="truncate text-xs md:text-sm text-gray-900 dark:text-gray-100 font-medium">
                                {goal.name}
                              </p>
                            </div>
                            <span className="text-xs md:text-sm font-semibold flex-shrink-0 text-red-600">
                              -{formatCurrency(accumulated)}
                            </span>
                          </div>
                          {/* 下段: プログレスバー + % | 目標金額 */}
                          <div className="flex items-center justify-between gap-2 text-xs md:text-xs text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="flex-1 bg-gray-200 dark:bg-gray-700 h-1">
                                <div
                                  className="h-1"
                                  style={{ width: `${progress}%`, backgroundColor: goalColor }}
                                />
                              </div>
                              <span className="flex-shrink-0">{Math.round(progress)}%</span>
                            </div>
                            <span className="flex-shrink-0 truncate">¥{goal.targetAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 紐付未設定のカード */}
          {unlinkedPMs.length > 0 && (
            <div data-section-name="紐付未設定のカード" className="relative mt-2 md:mt-3">
              <div
                className="bg-white dark:bg-slate-900 p-2 border-b dark:border-gray-700"
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
                          onAddRecurring={() => handleAddRecurring({})}
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
      <div className="fixed left-0 right-0 z-20 bg-white dark:bg-slate-900 border-t dark:border-gray-700 p-1.5 fixed-above-bottom-nav">
        <div className="max-w-7xl mx-auto px-1 md:px-2 lg:px-3 flex items-center justify-between gap-2">
          {/* Left: expand/collapse + add account */}
          <div className="flex items-center gap-0 min-w-0 flex-1">
            <button
              onClick={handleToggleAllAccounts}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400 flex-shrink-0"
              aria-label={isAllExpanded ? '全セクションを閉じる' : '全セクションを開く'}
            >
              {isAllExpanded ? (
                <ChevronsUp size={24} />
              ) : (
                <ChevronsDown size={24} />
              )}
            </button>
            <button
              onClick={() => { setEditingAccount(null); setIsAccountModalOpen(true); }}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400 flex-shrink-0"
              aria-label="口座を追加"
            >
              <Plus size={24} />
            </button>
          </div>

          {/* Right: total */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-1.5 text-right flex-shrink-0">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-0.5">合計</p>
            <p className="text-lg md:text-xl font-bold" style={{ color: 'var(--theme-primary)' }}>
              {totalNet >= 0 ? '+' : ''}{formatCurrency(totalNet)}
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
        scheduleGroup={selectedAccountSchedule}
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

      {unsettledCardModal && (
        <UnsettledCardDetailModal
          paymentMethod={unsettledCardModal.pm}
          paymentMonth={unsettledCardModal.paymentMonth}
          transactions={unsettledCardModal.transactions}
          recurringItems={unsettledCardModal.recurringItems}
          total={unsettledCardModal.total}
          isOpen
          onClose={() => setUnsettledCardModal(null)}
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
