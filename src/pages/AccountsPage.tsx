import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Plus, Edit2, Trash2, Wallet, CreditCard, Building2, Smartphone, Banknote,
  X, Link2, Info, PlusCircle, Calendar, Check, CheckCircle,
  RefreshCw, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Palette, GripVertical,
} from 'lucide-react';
import {
  accountService, memberService, transactionService, categoryService,
  paymentMethodService, recurringPaymentService, linkedPaymentMethodService, appSettingsService,
} from '../services/storage';
import type { AppSettings } from '../services/storage';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getCategoryIcon } from '../utils/categoryIcons';
import { getPendingAmountByAccount, getPendingAmountByPaymentMethod, calculatePaymentDate, getTotalPendingByAccount } from '../utils/billingUtils';
import { COMMON_MEMBER_ID } from '../types';
import type {
  Account, AccountType, AccountInput,
  PaymentMethod, PaymentMethodType, PaymentMethodInput, BillingType,
  Member, Transaction, TransactionType, TransactionInput,
  RecurringPayment, RecurringPaymentInput, RecurringFrequency,
  LinkedPaymentMethod, LinkedPaymentMethodInput,
} from '../types';

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: '現金',
  bank: '銀行口座',
  emoney: '電子マネー',
};

const ACCOUNT_TYPE_ICONS: Record<AccountType, React.ReactNode> = {
  cash: <Banknote size={20} />,
  bank: <Building2 size={20} />,
  emoney: <Smartphone size={20} />,
};

const ACCOUNT_TYPE_ICONS_SM: Record<AccountType, React.ReactNode> = {
  cash: <Banknote size={14} />,
  bank: <Building2 size={14} />,
  emoney: <Smartphone size={14} />,
};

const PM_TYPE_LABELS: Record<PaymentMethodType, string> = {
  credit_card: 'クレジットカード',
  debit_card: 'デビットカード',
};

const PM_TYPE_ICONS: Record<PaymentMethodType, React.ReactNode> = {
  credit_card: <CreditCard size={20} />,
  debit_card: <CreditCard size={20} />,
};

const BILLING_TYPE_LABELS: Record<BillingType, string> = {
  immediate: '即時',
  monthly: '月次請求',
};

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
];

// ===== メインページ =====
export const AccountsPage = () => {
  const [accounts, setAccounts] = useState<Account[]>(() => accountService.getAll());
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => paymentMethodService.getAll());
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>(() => recurringPaymentService.getAll());
  const [linkedPaymentMethods, setLinkedPaymentMethods] = useState<LinkedPaymentMethod[]>(() => linkedPaymentMethodService.getAll());
  const members = memberService.getAll();

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [viewingAccount, setViewingAccount] = useState<Account | null>(null);
  const [viewingPM, setViewingPM] = useState<PaymentMethod | null>(null);

  const [isPMModalOpen, setIsPMModalOpen] = useState(false);
  const [editingPM, setEditingPM] = useState<PaymentMethod | null>(null);

  const [addTransactionTarget, setAddTransactionTarget] = useState<{ accountId?: string; paymentMethodId?: string } | null>(null);

  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringPayment | null>(null);
  const [recurringTarget, setRecurringTarget] = useState<{ accountId?: string; paymentMethodId?: string } | null>(null);

  const [isLinkedPMModalOpen, setIsLinkedPMModalOpen] = useState(false);
  const [editingLinkedPM, setEditingLinkedPM] = useState<LinkedPaymentMethod | null>(null);
  const [linkedPMTarget, setLinkedPMTarget] = useState<{ accountId: string } | null>(null);

  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(() => appSettingsService.get());
  const [isGradientPickerOpen, setIsGradientPickerOpen] = useState(false);
  const [draggedAccountId, setDraggedAccountId] = useState<string | null>(null);
  const [dragOverAccountId, setDragOverAccountId] = useState<string | null>(null);

  const pendingByAccount = getPendingAmountByAccount();
  const pendingByPM = getPendingAmountByPaymentMethod();
  const totalPendingByAccount = getTotalPendingByAccount();

  const refreshData = useCallback(() => {
    setAccounts(accountService.getAll());
    setPaymentMethods(paymentMethodService.getAll());
    setRecurringPayments(recurringPaymentService.getAll());
    setLinkedPaymentMethods(linkedPaymentMethodService.getAll());
  }, []);

  // 口座の操作
  const handleAddAccount = () => {
    setEditingAccount(null);
    setIsAccountModalOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setIsAccountModalOpen(true);
  };

  const handleDeleteAccount = (id: string) => {
    if (confirm('この口座を削除しますか？')) {
      accountService.delete(id);
      refreshData();
    }
  };

  const handleSaveAccount = (input: AccountInput) => {
    if (editingAccount) {
      accountService.update(editingAccount.id, input);
    } else {
      accountService.create(input);
    }
    refreshData();
    setIsAccountModalOpen(false);
  };

  // 支払い手段の操作
  const handleAddPM = () => {
    setEditingPM(null);
    setIsPMModalOpen(true);
  };

  const handleEditPM = (pm: PaymentMethod) => {
    setEditingPM(pm);
    setIsPMModalOpen(true);
  };

  const handleDeletePM = (id: string) => {
    if (confirm('この支払い手段を削除しますか？')) {
      paymentMethodService.delete(id);
      refreshData();
    }
  };

  const handleSavePM = (input: PaymentMethodInput) => {
    if (editingPM) {
      paymentMethodService.update(editingPM.id, input);
    } else {
      paymentMethodService.create(input);
    }
    refreshData();
    setIsPMModalOpen(false);
  };

  // 定期支払いの操作
  const handleAddRecurring = (target: { accountId?: string; paymentMethodId?: string }) => {
    setEditingRecurring(null);
    setRecurringTarget(target);
    setIsRecurringModalOpen(true);
  };

  const handleEditRecurring = (rp: RecurringPayment) => {
    setEditingRecurring(rp);
    setRecurringTarget(null);
    setIsRecurringModalOpen(true);
  };

  const handleDeleteRecurring = (id: string) => {
    if (confirm('この定期取引を削除しますか？')) {
      recurringPaymentService.delete(id);
      refreshData();
    }
  };

  const handleSaveRecurring = (input: RecurringPaymentInput) => {
    if (editingRecurring) {
      recurringPaymentService.update(editingRecurring.id, input);
    } else {
      recurringPaymentService.create(input);
    }
    refreshData();
    setIsRecurringModalOpen(false);
  };

  const handleToggleRecurring = (rp: RecurringPayment) => {
    recurringPaymentService.update(rp.id, { isActive: !rp.isActive });
    refreshData();
  };

  // 紐付き手段の操作
  const handleToggleLinkedPM = (lpm: LinkedPaymentMethod) => {
    linkedPaymentMethodService.update(lpm.id, { isActive: !lpm.isActive });
    refreshData();
  };

  const handleAddLinkedPM = (target: { accountId: string }) => {
    setEditingLinkedPM(null);
    setLinkedPMTarget(target);
    setIsLinkedPMModalOpen(true);
  };

  const handleSaveLinkedPM = (input: LinkedPaymentMethodInput) => {
    if (editingLinkedPM) {
      linkedPaymentMethodService.update(editingLinkedPM.id, input);
    } else {
      linkedPaymentMethodService.create(input);
    }
    refreshData();
    setIsLinkedPMModalOpen(false);
  };

  // ドラッグ&ドロップの操作
  const handleDragStart = (accountId: string) => {
    setDraggedAccountId(accountId);
  };

  const handleDragOver = (e: React.DragEvent, accountId: string) => {
    e.preventDefault();
    if (draggedAccountId && draggedAccountId !== accountId) {
      setDragOverAccountId(accountId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetAccountId: string) => {
    e.preventDefault();
    if (!draggedAccountId || draggedAccountId === targetAccountId) {
      setDraggedAccountId(null);
      setDragOverAccountId(null);
      return;
    }

    const allAccounts = [...accounts];
    const draggedIndex = allAccounts.findIndex((a) => a.id === draggedAccountId);
    const targetIndex = allAccounts.findIndex((a) => a.id === targetAccountId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedAccountId(null);
      setDragOverAccountId(null);
      return;
    }

    const [removed] = allAccounts.splice(draggedIndex, 1);
    allAccounts.splice(targetIndex, 0, removed);

    const orders = allAccounts.map((account, index) => ({ id: account.id, order: index }));
    accountService.updateOrders(orders);
    refreshData();

    setDraggedAccountId(null);
    setDragOverAccountId(null);
  };

  const handleDragEnd = () => {
    setDraggedAccountId(null);
    setDragOverAccountId(null);
  };

  const isAnyModalOpen = isAccountModalOpen || isPMModalOpen || !!viewingAccount || !!viewingPM || !!addTransactionTarget || isRecurringModalOpen || isLinkedPMModalOpen || isGradientPickerOpen;
  useBodyScrollLock(isAnyModalOpen);

  const handleSaveGradient = (from: string, to: string) => {
    const updated = appSettingsService.update({ totalAssetGradientFrom: from, totalAssetGradientTo: to });
    setAppSettings(updated);
    setIsGradientPickerOpen(false);
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  // 総合的な未精算額を計算（カード + 定期支払い・収入）
  const totalExpense = Object.values(totalPendingByAccount).reduce(
    (sum, v) => sum + v.cardPending + v.recurringExpense,
    0
  );
  const totalIncome = Object.values(totalPendingByAccount).reduce((sum, v) => sum + v.recurringIncome, 0);
  const netPending = totalExpense - totalIncome;

  // メンバー別にグループ化
  const groupedAccounts = accounts.reduce<Record<string, Account[]>>((acc, account) => {
    const memberId = account.memberId;
    if (!acc[memberId]) acc[memberId] = [];
    acc[memberId].push(account);
    return acc;
  }, {});

  const getMember = (memberId: string) => members.find((m) => m.id === memberId);

  const unlinkedPMs = paymentMethods.filter((pm) => !pm.linkedAccountId);

  return (
    <div className="p-4 space-y-4">
      {/* 総資産 & 所有者別残高（統合カード） */}
      <div
        className="rounded-xl p-4 text-white"
        style={{ background: `linear-gradient(to right, ${appSettings.totalAssetGradientFrom}, ${appSettings.totalAssetGradientTo})` }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Wallet size={20} />
          <span className="text-sm opacity-90">総資産</span>
          <button
            onClick={() => setIsGradientPickerOpen(true)}
            className="ml-auto p-1 rounded-full hover:bg-white/20 transition-colors opacity-60 hover:opacity-100"
            title="背景色を変更"
          >
            <Palette size={16} />
          </button>
        </div>
        <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
        {(totalExpense > 0 || totalIncome > 0) && (
          <div className="text-sm opacity-90 mt-2 space-y-0.5">
            {totalExpense > 0 && (
              <p className="flex justify-between">
                <span className="opacity-80">使う予定:</span>
                <span className="font-medium">-{formatCurrency(totalExpense)}</span>
              </p>
            )}
            {totalIncome > 0 && (
              <p className="flex justify-between">
                <span className="opacity-80">入る予定:</span>
                <span className="font-medium">+{formatCurrency(totalIncome)}</span>
              </p>
            )}
            <p className="flex justify-between pt-1 border-t border-white/20">
              <span className="opacity-80">実質残高:</span>
              <span className="font-bold">{formatCurrency(totalBalance - netPending)}</span>
            </p>
          </div>
        )}

        {/* 内訳（トグル表示） */}
        {accounts.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <button
              onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
              className="flex items-center gap-1 text-[10px] font-medium opacity-70 mb-2"
            >
              {isBreakdownOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              内訳
            </button>
            {isBreakdownOpen && (
              <div className="space-y-2.5">
                {Object.entries(groupedAccounts).map(([memberId, memberAccounts]) => {
                  const member = getMember(memberId);
                  const memberTotal = memberAccounts.reduce((sum, a) => sum + a.balance, 0);
                  const memberExpense = memberAccounts.reduce(
                    (sum, a) => sum + (totalPendingByAccount[a.id]?.cardPending || 0) + (totalPendingByAccount[a.id]?.recurringExpense || 0),
                    0
                  );
                  const memberIncome = memberAccounts.reduce((sum, a) => sum + (totalPendingByAccount[a.id]?.recurringIncome || 0), 0);
                  const memberNetPending = memberExpense - memberIncome;
                  return (
                    <div key={memberId}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: member?.color || '#d1d5db' }} />
                          <span className="text-xs font-medium opacity-90">{member?.name || '不明'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold">{formatCurrency(memberTotal)}</span>
                          {(memberExpense > 0 || memberIncome > 0) && (
                            <span className="text-[10px] opacity-70 ml-1">（実質: {formatCurrency(memberTotal - memberNetPending)}）</span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1 pl-3.5">
                        {memberAccounts.map((account) => {
                          const pendingData = totalPendingByAccount[account.id];
                          const hasExpense = pendingData && (pendingData.cardPending > 0 || pendingData.recurringExpense > 0);
                          const hasIncome = pendingData && pendingData.recurringIncome > 0;
                          return (
                            <div key={account.id} className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center"
                                >
                                  {ACCOUNT_TYPE_ICONS_SM[account.type]}
                                </div>
                                <span className="text-xs opacity-90">{account.name}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-medium text-xs">{formatCurrency(account.balance)}</span>
                                {(hasExpense || hasIncome) && pendingData && (
                                  <p className="text-[10px] opacity-60">実質: {formatCurrency(account.balance - pendingData.totalPending)}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== 口座セクション（支払い手段をネスト表示） ===== */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-base font-bold text-gray-700">口座</h3>
          <div className="flex gap-2">
            <button
              onClick={handleAddPM}
              className="flex items-center gap-1 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
            >
              <Plus size={16} />
              支払い手段
            </button>
            <button
              onClick={handleAddAccount}
              className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
            >
              <Plus size={16} />
              口座
            </button>
          </div>
        </div>

        {accounts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <Wallet size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">口座がありません</p>
            <button onClick={handleAddAccount} className="mt-2 text-blue-600 font-medium text-sm">
              口座を追加する
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedAccounts).map(([memberId, memberAccounts]) => {
              const member = getMember(memberId);
              return (
                <div key={memberId}>
                  <h4 className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: member?.color || '#6b7280' }} />
                    {member?.name || '不明'}
                  </h4>
                  <div className="space-y-2">
                    {memberAccounts.map((account) => {
                      const accountLinkedPMs = linkedPaymentMethods.filter((lpm) => lpm.accountId === account.id);
                      const accountRecurrings = recurringPayments.filter(
                        (rp) => rp.accountId === account.id && !rp.paymentMethodId
                      );
                      return (
                        <AccountCard
                          key={account.id}
                          account={account}
                          pendingAmount={pendingByAccount[account.id] || 0}
                          totalPendingData={totalPendingByAccount[account.id]}
                          linkedPaymentMethodsData={accountLinkedPMs}
                          allPaymentMethods={paymentMethods}
                          pendingByPM={pendingByPM}
                          recurringPayments={accountRecurrings}
                          onView={() => setViewingAccount(account)}
                          onEdit={() => handleEditAccount(account)}
                          onDelete={() => handleDeleteAccount(account.id)}
                          onAddTransaction={() => setAddTransactionTarget({ accountId: account.id })}
                          onAddRecurring={() => handleAddRecurring({ accountId: account.id })}
                          onEditRecurring={handleEditRecurring}
                          onDeleteRecurring={handleDeleteRecurring}
                          onToggleRecurring={handleToggleRecurring}
                          onAddLinkedPM={() => handleAddLinkedPM({ accountId: account.id })}
                          onToggleLinkedPM={handleToggleLinkedPM}
                          onViewPM={(pm) => setViewingPM(pm)}
                          onEditPM={handleEditPM}
                          onDeletePM={handleDeletePM}
                          isDragging={draggedAccountId === account.id}
                          isDragOver={dragOverAccountId === account.id}
                          onDragStart={() => handleDragStart(account.id)}
                          onDragOver={(e) => handleDragOver(e, account.id)}
                          onDrop={(e) => handleDrop(e, account.id)}
                          onDragEnd={handleDragEnd}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== 紐づきなし支払い手段 ===== */}
      {unlinkedPMs.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-bold text-gray-700">引き落とし先未設定</h3>
          </div>
          <div className="space-y-2">
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
                  onEdit={() => handleEditPM(pm)}
                  onDelete={() => handleDeletePM(pm.id)}
                  onAddTransaction={() => setAddTransactionTarget({ paymentMethodId: pm.id, accountId: pm.linkedAccountId })}
                  onAddRecurring={() => handleAddRecurring({ paymentMethodId: pm.id, accountId: pm.linkedAccountId })}
                  onEditRecurring={handleEditRecurring}
                  onDeleteRecurring={handleDeleteRecurring}
                  onToggleRecurring={handleToggleRecurring}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* モーダル */}
      {isAccountModalOpen && (
        <AccountModal
          account={editingAccount}
          members={members}
          onSave={handleSaveAccount}
          onClose={() => setIsAccountModalOpen(false)}
        />
      )}

      {isPMModalOpen && (
        <PaymentMethodModal
          paymentMethod={editingPM}
          members={members}
          accounts={accounts}
          onSave={handleSavePM}
          onClose={() => setIsPMModalOpen(false)}
        />
      )}

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
          onEdit={(pm) => {
            setViewingPM(null);
            handleEditPM(pm);
          }}
          onAddTransaction={(pm) => {
            setViewingPM(null);
            setAddTransactionTarget({ paymentMethodId: pm.id, accountId: pm.linkedAccountId });
          }}
          onDelete={(pmId) => {
            handleDeletePM(pmId);
          }}
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
          onSave={handleSaveRecurring}
          onClose={() => setIsRecurringModalOpen(false)}
        />
      )}

      {isLinkedPMModalOpen && (
        <LinkedPaymentMethodModal
          linkedPaymentMethod={editingLinkedPM}
          defaultAccountId={linkedPMTarget?.accountId}
          accounts={accounts}
          paymentMethods={paymentMethods}
          onSave={handleSaveLinkedPM}
          onClose={() => setIsLinkedPMModalOpen(false)}
        />
      )}

      {isGradientPickerOpen && (
        <GradientPickerModal
          currentFrom={appSettings.totalAssetGradientFrom}
          currentTo={appSettings.totalAssetGradientTo}
          onSave={handleSaveGradient}
          onClose={() => setIsGradientPickerOpen(false)}
        />
      )}
    </div>
  );
};

// ===== 口座カード =====
interface AccountCardProps {
  account: Account;
  pendingAmount: number;
  totalPendingData?: {
    cardPending: number;
    recurringExpense: number;
    recurringIncome: number;
    totalPending: number;
  };
  linkedPaymentMethodsData: LinkedPaymentMethod[];
  allPaymentMethods: PaymentMethod[];
  pendingByPM: Record<string, number>;
  recurringPayments: RecurringPayment[];
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddTransaction: () => void;
  onAddRecurring: () => void;
  onEditRecurring: (rp: RecurringPayment) => void;
  onDeleteRecurring: (id: string) => void;
  onToggleRecurring: (rp: RecurringPayment) => void;
  onAddLinkedPM: () => void;
  onToggleLinkedPM: (lpm: LinkedPaymentMethod) => void;
  onViewPM: (pm: PaymentMethod) => void;
  onEditPM: (pm: PaymentMethod) => void;
  onDeletePM: (pmId: string) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

const AccountCard = ({
  account, pendingAmount, totalPendingData, linkedPaymentMethodsData, allPaymentMethods, pendingByPM, recurringPayments,
  onView, onEdit, onDelete, onAddTransaction, onAddRecurring,
  onEditRecurring, onDeleteRecurring, onToggleRecurring,
  onAddLinkedPM, onToggleLinkedPM,
  onViewPM, onEditPM, onDeletePM,
  isDragging, isDragOver,
  onDragStart, onDragOver, onDrop, onDragEnd,
}: AccountCardProps) => {
  const categories = categoryService.getAll();
  const getPaymentMethod = (id: string) => allPaymentMethods.find((pm) => pm.id === id);
  const getUnsettledAmount = (paymentMethodId: string) => pendingByPM[paymentMethodId] || 0;
  const getCategory = (id: string) => categories.find((c) => c.id === id);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`bg-white rounded-xl shadow-sm p-4 transition-all ${
        isDragging ? 'opacity-50' : ''
      } ${isDragOver ? 'border-2 border-blue-500' : ''}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2 flex-1">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
            title="ドラッグして並び替え"
          >
            <GripVertical size={18} />
          </button>
          <button onClick={onView} className="flex items-center gap-3 flex-1 text-left">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: account.color }}
            >
              {ACCOUNT_TYPE_ICONS[account.type]}
            </div>
            <div>
              <p className="font-medium text-gray-900">{account.name}</p>
              <p className="text-xs text-gray-500">{ACCOUNT_TYPE_LABELS[account.type]}</p>
            </div>
          </button>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onAddTransaction} className="p-2 text-blue-500 hover:text-blue-700" title="取引追加">
            <PlusCircle size={18} />
          </button>
          <button onClick={onEdit} className="p-2 text-gray-400 hover:text-gray-600">
            <Edit2 size={16} />
          </button>
          <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <button onClick={onView} className="mt-3 text-right w-full">
        <p className="text-xl font-bold text-gray-900">{formatCurrency(account.balance)}</p>
        {totalPendingData && (totalPendingData.cardPending > 0 || totalPendingData.recurringExpense > 0 || totalPendingData.recurringIncome > 0) ? (
          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
            {(totalPendingData.cardPending > 0 || totalPendingData.recurringExpense > 0) && (
              <p>使う予定: -{formatCurrency(totalPendingData.cardPending + totalPendingData.recurringExpense)}</p>
            )}
            {totalPendingData.recurringIncome > 0 && (
              <p>入る予定: +{formatCurrency(totalPendingData.recurringIncome)}</p>
            )}
            <p className="font-medium text-gray-700">実質: {formatCurrency(account.balance - totalPendingData.totalPending)}</p>
          </div>
        ) : pendingAmount > 0 ? (
          <p className="text-xs text-gray-500 mt-0.5">
            引落後: {formatCurrency(account.balance - pendingAmount)}
          </p>
        ) : null}
      </button>
      {/* 定期支払いと支払い手段 */}
      <RecurringAndLinkedList
        recurringItems={recurringPayments}
        linkedItems={linkedPaymentMethodsData}
        onAddRecurring={onAddRecurring}
        onEditRecurring={onEditRecurring}
        onDeleteRecurring={onDeleteRecurring}
        onToggleRecurring={onToggleRecurring}
        onAddLinked={onAddLinkedPM}
        onToggleLinked={onToggleLinkedPM}
        onViewPM={onViewPM}
        onEditPM={onEditPM}
        onDeletePM={onDeletePM}
        getCategory={getCategory}
        getPaymentMethod={getPaymentMethod}
        getUnsettledAmount={getUnsettledAmount}
      />
    </div>
  );
};

// ===== 支払い手段カード =====
interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  linkedAccountName?: string;
  pendingAmount: number;
  recurringPayments: RecurringPayment[];
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddTransaction: () => void;
  onAddRecurring: () => void;
  onEditRecurring: (rp: RecurringPayment) => void;
  onDeleteRecurring: (id: string) => void;
  onToggleRecurring: (rp: RecurringPayment) => void;
}

const PaymentMethodCard = ({
  paymentMethod, linkedAccountName, pendingAmount, recurringPayments,
  onView, onEdit, onDelete, onAddTransaction, onAddRecurring,
  onEditRecurring, onDeleteRecurring, onToggleRecurring,
}: PaymentMethodCardProps) => {
  const categories = categoryService.getAll();
  const getCategory = (id: string) => categories.find((c) => c.id === id);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex justify-between items-start">
        <button onClick={onView} className="flex items-center gap-3 flex-1 text-left">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: paymentMethod.color }}
          >
            {PM_TYPE_ICONS[paymentMethod.type]}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900">{paymentMethod.name}</p>
            <p className="text-xs text-gray-500">{PM_TYPE_LABELS[paymentMethod.type]} ・ {BILLING_TYPE_LABELS[paymentMethod.billingType]}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Link2 size={12} className={linkedAccountName ? 'text-gray-400' : 'text-amber-500'} />
              <span className={`text-xs ${linkedAccountName ? 'text-gray-400' : 'text-amber-500 font-medium'}`}>
                {linkedAccountName || '引き落とし先未設定'}
              </span>
            </div>
          </div>
        </button>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onAddTransaction} className="p-2 text-purple-500 hover:text-purple-700" title="取引追加">
            <PlusCircle size={18} />
          </button>
          <button onClick={onEdit} className="p-2 text-gray-400 hover:text-gray-600">
            <Edit2 size={16} />
          </button>
          <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      {pendingAmount > 0 && (
        <div className="mt-2 text-right">
          <p className="text-sm text-orange-600 font-medium">未精算: {formatCurrency(pendingAmount)}</p>
        </div>
      )}
      {/* 定期支払い */}
      <RecurringPaymentsList
        items={recurringPayments}
        onAdd={onAddRecurring}
        onEdit={onEditRecurring}
        onDelete={onDeleteRecurring}
        onToggle={onToggleRecurring}
        getCategory={getCategory}
      />
    </div>
  );
};

// ===== 定期支払いリスト（カード内表示） =====
interface RecurringPaymentsListProps {
  items: RecurringPayment[];
  onAdd: () => void;
  onEdit: (rp: RecurringPayment) => void;
  onDelete: (id: string) => void;
  onToggle: (rp: RecurringPayment) => void;
  getCategory: (id: string) => { name: string; color: string; icon: string } | undefined;
}

const RecurringPaymentsList = ({ items, onAdd, onEdit, onDelete, onToggle, getCategory }: RecurringPaymentsListProps) => {
  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex justify-between items-center mb-1.5">
        <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
          <RefreshCw size={10} />
          定期取引
        </p>
        <button onClick={onAdd} className="text-blue-500 hover:text-blue-700">
          <Plus size={14} />
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-[11px] text-gray-300">定期取引なし</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((rp) => {
            const category = getCategory(rp.categoryId);
            const freqLabel = rp.frequency === 'monthly'
              ? `毎月${rp.dayOfMonth}日`
              : `毎年${rp.monthOfYear}月${rp.dayOfMonth}日`;
            return (
              <div key={rp.id} className={`flex items-center justify-between text-xs ${rp.isActive ? '' : 'opacity-40'}`}>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <button onClick={() => onToggle(rp)} className="flex-shrink-0">
                    {rp.isActive
                      ? <ToggleRight size={16} className="text-green-500" />
                      : <ToggleLeft size={16} className="text-gray-300" />
                    }
                  </button>
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${category?.color || '#6b7280'}20`, color: category?.color || '#6b7280' }}
                  >
                    {getCategoryIcon(category?.icon || '', 12)}
                  </div>
                  <span className="truncate text-gray-700">{rp.name}</span>
                  <span className="text-gray-400 flex-shrink-0">{freqLabel}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <span className={`font-medium ${rp.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(rp.amount)}
                  </span>
                  <button onClick={() => onEdit(rp)} className="p-1 text-gray-300 hover:text-gray-500">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => onDelete(rp.id)} className="p-1 text-gray-300 hover:text-red-500">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ===== 定期支払いと支払い手段のリスト（カード内表示） =====
interface RecurringAndLinkedListProps {
  recurringItems: RecurringPayment[];
  linkedItems: LinkedPaymentMethod[];
  onAddRecurring: () => void;
  onEditRecurring: (rp: RecurringPayment) => void;
  onDeleteRecurring: (id: string) => void;
  onToggleRecurring: (rp: RecurringPayment) => void;
  onAddLinked: () => void;
  onToggleLinked: (lpm: LinkedPaymentMethod) => void;
  onViewPM: (pm: PaymentMethod) => void;
  onEditPM: (pm: PaymentMethod) => void;
  onDeletePM: (pmId: string) => void;
  getCategory: (id: string) => { name: string; color: string; icon: string } | undefined;
  getPaymentMethod: (id: string) => PaymentMethod | undefined;
  getUnsettledAmount: (paymentMethodId: string) => number;
}

const RecurringAndLinkedList = ({
  recurringItems, linkedItems,
  onAddRecurring, onEditRecurring, onDeleteRecurring, onToggleRecurring,
  onAddLinked, onToggleLinked,
  onViewPM, onEditPM, onDeletePM,
  getCategory, getPaymentMethod, getUnsettledAmount,
}: RecurringAndLinkedListProps) => {
  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
      {/* 定期取引セクション */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
            <RefreshCw size={10} />
            定期取引
          </p>
          <button onClick={onAddRecurring} className="text-blue-500 hover:text-blue-700">
            <Plus size={14} />
          </button>
        </div>
        {recurringItems.length === 0 ? (
          <p className="text-[11px] text-gray-300">定期取引なし</p>
        ) : (
          <div className="space-y-1.5">
            {recurringItems.map((rp) => {
              const category = getCategory(rp.categoryId);
              const freqLabel = rp.frequency === 'monthly'
                ? `毎月${rp.dayOfMonth}日`
                : `毎年${rp.monthOfYear}月${rp.dayOfMonth}日`;
              return (
                <div key={rp.id} className={`flex items-center justify-between text-xs ${rp.isActive ? '' : 'opacity-40'}`}>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button onClick={() => onToggleRecurring(rp)} className="flex-shrink-0">
                      {rp.isActive
                        ? <ToggleRight size={16} className="text-green-500" />
                        : <ToggleLeft size={16} className="text-gray-300" />
                      }
                    </button>
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${category?.color || '#6b7280'}20`, color: category?.color || '#6b7280' }}
                    >
                      {getCategoryIcon(category?.icon || '', 12)}
                    </div>
                    <span className="truncate text-gray-700">{rp.name}</span>
                    <span className="text-gray-400 flex-shrink-0">{freqLabel}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <span className={`font-medium ${rp.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(rp.amount)}
                    </span>
                    <button onClick={() => onEditRecurring(rp)} className="p-1 text-gray-300 hover:text-gray-500">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => onDeleteRecurring(rp.id)} className="p-1 text-gray-300 hover:text-red-500">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 支払い手段セクション */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
            <CreditCard size={10} />
            支払い手段
          </p>
          <button onClick={onAddLinked} className="text-blue-500 hover:text-blue-700">
            <Plus size={14} />
          </button>
        </div>
        {linkedItems.length === 0 ? (
          <p className="text-[11px] text-gray-300">支払い手段なし</p>
        ) : (
          <div className="space-y-1.5">
            {linkedItems.map((lpm) => {
              const pm = getPaymentMethod(lpm.paymentMethodId);
              if (!pm) return null;
              const unsettledAmount = getUnsettledAmount(pm.id);
              const paymentLabel = pm.paymentDay ? `毎月${pm.paymentDay}日` : '支払日なし';
              return (
                <div key={lpm.id} className={`flex items-center justify-between text-xs ${lpm.isActive ? '' : 'opacity-40'}`}>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button onClick={() => onToggleLinked(lpm)} className="flex-shrink-0">
                      {lpm.isActive
                        ? <ToggleRight size={16} className="text-green-500" />
                        : <ToggleLeft size={16} className="text-gray-300" />
                      }
                    </button>
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${pm.color}20`, color: pm.color }}
                    >
                      <CreditCard size={12} />
                    </div>
                    <button onClick={() => onViewPM(pm)} className="truncate text-gray-700 hover:text-gray-900">
                      {pm.name}
                    </button>
                    <span className="text-gray-400 flex-shrink-0">{paymentLabel}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <span className="font-medium text-red-600">
                      {formatCurrency(unsettledAmount)}
                    </span>
                    <button onClick={() => onEditPM(pm)} className="p-1 text-gray-300 hover:text-gray-500" title="支払い手段編集">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => onDeletePM(pm.id)} className="p-1 text-gray-300 hover:text-red-500" title="支払い手段削除">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ===== 口座追加/編集モーダル =====
interface AccountModalProps {
  account: Account | null;
  members: Member[];
  onSave: (input: AccountInput) => void;
  onClose: () => void;
}

const AccountModal = ({ account, members, onSave, onClose }: AccountModalProps) => {
  const [name, setName] = useState(account?.name || '');
  const [memberId, setMemberId] = useState(account?.memberId || COMMON_MEMBER_ID);
  const [accountType, setAccountType] = useState<AccountType>(account?.type || 'bank');
  const [balance, setBalance] = useState(account?.balance.toString() || '0');
  const [color, setColor] = useState(account?.color || COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      memberId,
      type: accountType,
      balance: parseInt(balance, 10) || 0,
      color,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-xl p-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">{account ? '口座を編集' : '口座を追加'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 夫メイン銀行"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">所有者</label>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setMemberId(member.id)}
                  className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    memberId === member.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: member.color }} />
                  {member.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">種類</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(ACCOUNT_TYPE_LABELS) as [AccountType, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAccountType(value)}
                  className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    accountType === value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {ACCOUNT_TYPE_ICONS[value]}
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">残高</label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">色</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium">
              キャンセル
            </button>
            <button type="submit" className="flex-1 py-2 px-4 rounded-lg bg-blue-600 text-white font-medium">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ===== 支払い手段追加/編集モーダル =====
interface PaymentMethodModalProps {
  paymentMethod: PaymentMethod | null;
  members: Member[];
  accounts: Account[];
  onSave: (input: PaymentMethodInput) => void;
  onClose: () => void;
}

const PaymentMethodModal = ({ paymentMethod, members, accounts, onSave, onClose }: PaymentMethodModalProps) => {
  const [name, setName] = useState(paymentMethod?.name || '');
  const [memberId, setMemberId] = useState(paymentMethod?.memberId || COMMON_MEMBER_ID);
  const [pmType, setPmType] = useState<PaymentMethodType>(paymentMethod?.type || 'credit_card');
  const [linkedAccountId, setLinkedAccountId] = useState(paymentMethod?.linkedAccountId || '');
  const [billingType, setBillingType] = useState<BillingType>(paymentMethod?.billingType || 'monthly');
  const [closingDay, setClosingDay] = useState(paymentMethod?.closingDay?.toString() || '15');
  const [paymentDay, setPaymentDay] = useState(paymentMethod?.paymentDay?.toString() || '10');
  const [paymentMonthOffset, setPaymentMonthOffset] = useState(paymentMethod?.paymentMonthOffset?.toString() || '1');
  const [color, setColor] = useState(paymentMethod?.color || COLORS[5]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      memberId,
      type: pmType,
      linkedAccountId,
      billingType,
      closingDay: billingType === 'monthly' ? parseInt(closingDay, 10) || 15 : undefined,
      paymentDay: billingType === 'monthly' ? parseInt(paymentDay, 10) || 10 : undefined,
      paymentMonthOffset: billingType === 'monthly' ? parseInt(paymentMonthOffset, 10) || 1 : undefined,
      color,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-xl p-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">{paymentMethod ? '支払い手段を編集' : '支払い手段を追加'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 夫クレジットカード"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">所有者</label>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setMemberId(member.id)}
                  className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    memberId === member.id
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: member.color }} />
                  {member.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">種類</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(PM_TYPE_LABELS) as [PaymentMethodType, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setPmType(value);
                    if (value === 'credit_card') setBillingType('monthly');
                    if (value === 'debit_card') setBillingType('immediate');
                  }}
                  className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    pmType === value
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {PM_TYPE_ICONS[value]}
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">引き落とし先口座</label>
            {accounts.length === 0 ? (
              <p className="text-sm text-gray-500">先に口座を登録してください</p>
            ) : (
              <div className="space-y-1">
                {accounts.map((acct) => (
                  <button
                    key={acct.id}
                    type="button"
                    onClick={() => setLinkedAccountId(acct.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                      linkedAccountId === acct.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: acct.color }} />
                      <span className="font-medium text-gray-900 text-sm">{acct.name}</span>
                    </div>
                    {linkedAccountId === acct.id && <Check size={16} className="text-purple-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">請求タイミング</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(BILLING_TYPE_LABELS) as [BillingType, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBillingType(value)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    billingType === value
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {billingType === 'monthly' && (() => {
            const cd = parseInt(closingDay, 10) || 15;
            const pd = parseInt(paymentDay, 10) || 10;
            const offset = parseInt(paymentMonthOffset, 10) || 1;
            const offsetLabel = offset === 0 ? '当月' : offset === 1 ? '翌月' : '翌々月';
            const payMonth1 = 1 + offset;
            const payMonth2 = 2 + offset;
            // 締め日の翌日を正しく計算（月末を考慮）
            const nextDay = new Date(2025, 0, cd + 1); // 1月cd日の翌日
            const nextDayMonth = nextDay.getMonth() + 1;
            const nextDayDate = nextDay.getDate();
            return (
              <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">締め日</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">毎月</span>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={closingDay}
                      onChange={(e) => setClosingDay(e.target.value)}
                      className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-500">日</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">引き落とし日</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={paymentMonthOffset}
                      onChange={(e) => setPaymentMonthOffset(e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="0">当月</option>
                      <option value="1">翌月</option>
                      <option value="2">翌々月</option>
                    </select>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={paymentDay}
                      onChange={(e) => setPaymentDay(e.target.value)}
                      className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-500">日</span>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-2.5 mt-2">
                  <div className="flex items-start gap-1.5">
                    <Info size={14} className="text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-purple-700 space-y-1">
                      <p className="font-medium">引き落としの例（{cd}日締め・{offsetLabel}{pd}日払い）</p>
                      <p>1月{cd}日の取引 → <span className="font-medium">{payMonth1}月{pd}日</span>に引き落とし</p>
                      <p>{nextDayMonth}月{nextDayDate}日の取引 → <span className="font-medium">{payMonth2}月{pd}日</span>に引き落とし</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">色</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-purple-500 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium">
              キャンセル
            </button>
            <button type="submit" className="flex-1 py-2 px-4 rounded-lg bg-purple-600 text-white font-medium">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ===== 取引履歴モーダル（口座用）=====
interface AccountTransactionsModalProps {
  account: Account;
  onClose: () => void;
}

const AccountTransactionsModal = ({ account, onClose }: AccountTransactionsModalProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const allTransactions = transactionService.getAll();
    const allPMs = paymentMethodService.getAll();
    const linkedPMIds = allPMs
      .filter((pm) => pm.linkedAccountId === account.id)
      .map((pm) => pm.id);
    return allTransactions
      .filter((t) => t.accountId === account.id || (t.paymentMethodId && linkedPMIds.includes(t.paymentMethodId)))
      .sort((a, b) => b.date.localeCompare(a.date));
  });
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const allPMs = paymentMethodService.getAll();
  const allAccounts = accountService.getAll();
  const categories = categoryService.getAll();
  const members = memberService.getAll();
  const getCategory = (categoryId: string) => categories.find((c) => c.id === categoryId);
  const getPM = (pmId?: string) => pmId ? allPMs.find((p) => p.id === pmId) : undefined;

  const refreshTransactions = () => {
    const allTransactions = transactionService.getAll();
    const linkedPMIds = allPMs
      .filter((pm) => pm.linkedAccountId === account.id)
      .map((pm) => pm.id);
    setTransactions(
      allTransactions
        .filter((t) => t.accountId === account.id || (t.paymentMethodId && linkedPMIds.includes(t.paymentMethodId)))
        .sort((a, b) => b.date.localeCompare(a.date))
    );
  };

  const handleDelete = (transaction: Transaction) => {
    if (!confirm('この取引を削除しますか？')) return;
    revertTransactionBalance(transaction);
    transactionService.delete(transaction.id);
    refreshTransactions();
  };

  const handleSaveEdit = (input: TransactionInput) => {
    if (!editingTransaction) return;
    revertTransactionBalance(editingTransaction);
    applyTransactionBalance(input);
    transactionService.update(editingTransaction.id, {
      ...input,
      settledAt: undefined,
    });
    refreshTransactions();
    setEditingTransaction(null);
  };

  const groupedByDate: Record<string, Transaction[]> = {};
  transactions.forEach((t) => {
    if (!groupedByDate[t.date]) groupedByDate[t.date] = [];
    groupedByDate[t.date].push(t);
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-2xl sm:rounded-xl rounded-t-xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: account.color }}>
              {ACCOUNT_TYPE_ICONS[account.type]}
            </div>
            <div>
              <h3 className="text-lg font-bold">{account.name}</h3>
              <p className="text-sm text-gray-500">取引履歴</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">取引がありません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedByDate).map(([date, dayTransactions]) => (
                <div key={date}>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">{formatDate(date)}</h4>
                  <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                    {dayTransactions.map((transaction) => {
                      const category = getCategory(transaction.categoryId);
                      const pm = getPM(transaction.paymentMethodId);
                      const isExpense = transaction.type === 'expense';
                      const settlementDate = pm ? calculatePaymentDate(transaction.date, pm) : null;
                      const settlementLabel = settlementDate ? format(settlementDate, 'M/d') + '引落' : null;
                      const isSettled = !!transaction.settledAt;
                      return (
                        <div key={transaction.id} className="p-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${category?.color || '#6b7280'}20`, color: category?.color || '#6b7280' }}
                              >
                                {getCategoryIcon(category?.icon || '', 20)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900">{category?.name || '不明'}</p>
                                {pm && (
                                  <div className="flex items-center gap-1">
                                    <CreditCard size={10} className="text-purple-400 flex-shrink-0" />
                                    <p className="text-xs text-purple-500 truncate">{pm.name}</p>
                                  </div>
                                )}
                                {settlementDate && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Calendar size={10} className={isSettled ? 'text-green-400' : 'text-orange-400'} />
                                    <p className={`text-[11px] ${isSettled ? 'text-green-500' : 'text-orange-500'}`}>
                                      {settlementLabel}{isSettled ? '（精算済）' : ''}
                                    </p>
                                  </div>
                                )}
                                {transaction.memo && <p className="text-xs text-gray-400 mt-0.5 truncate">{transaction.memo}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                              <p className={`font-bold text-sm ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
                                {isExpense ? '-' : '+'}{formatCurrency(transaction.amount)}
                              </p>
                              <button onClick={() => setEditingTransaction(transaction)} className="p-1.5 text-gray-400 hover:text-blue-600">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => handleDelete(transaction)} className="p-1.5 text-gray-400 hover:text-red-600">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editingTransaction && (
        <div onClick={(e) => e.stopPropagation()}>
          <EditTransactionModal
            transaction={editingTransaction}
            accounts={allAccounts}
            paymentMethods={allPMs}
            categories={categories}
            members={members}
            onSave={handleSaveEdit}
            onClose={() => setEditingTransaction(null)}
          />
        </div>
      )}
    </div>
  );
};

// ===== 取引履歴モーダル（支払い手段用）=====
interface PMTransactionsModalProps {
  paymentMethod: PaymentMethod;
  onClose: () => void;
  onEdit: (pm: PaymentMethod) => void;
  onAddTransaction: (pm: PaymentMethod) => void;
  onDelete: (pmId: string) => void;
}

const PMTransactionsModal = ({ paymentMethod, onClose, onEdit, onAddTransaction, onDelete }: PMTransactionsModalProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    return transactionService.getAll()
      .filter((t) => t.paymentMethodId === paymentMethod.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  });
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const allPMs = paymentMethodService.getAll();
  const allAccounts = accountService.getAll();
  const categories = categoryService.getAll();
  const members = memberService.getAll();
  const getCategory = (categoryId: string) => categories.find((c) => c.id === categoryId);

  const refreshTransactions = () => {
    setTransactions(
      transactionService.getAll()
        .filter((t) => t.paymentMethodId === paymentMethod.id)
        .sort((a, b) => b.date.localeCompare(a.date))
    );
  };

  const handleDelete = (transaction: Transaction) => {
    if (!confirm('この取引を削除しますか？')) return;
    revertTransactionBalance(transaction);
    transactionService.delete(transaction.id);
    refreshTransactions();
  };

  const handleSaveEdit = (input: TransactionInput) => {
    if (!editingTransaction) return;
    revertTransactionBalance(editingTransaction);
    applyTransactionBalance(input);
    transactionService.update(editingTransaction.id, {
      ...input,
      settledAt: undefined,
    });
    refreshTransactions();
    setEditingTransaction(null);
  };

  const groupedByDate: Record<string, Transaction[]> = {};
  transactions.forEach((t) => {
    if (!groupedByDate[t.date]) groupedByDate[t.date] = [];
    groupedByDate[t.date].push(t);
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-2xl sm:rounded-xl rounded-t-xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: paymentMethod.color }}>
                {PM_TYPE_ICONS[paymentMethod.type]}
              </div>
              <div>
                <h3 className="text-lg font-bold">{paymentMethod.name}</h3>
                <p className="text-sm text-gray-500">
                  {paymentMethod.closingDay && paymentMethod.paymentDay
                    ? `${paymentMethod.closingDay}日締 翌${paymentMethod.paymentDay}日払`
                    : '取引履歴'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          {/* 操作ボタン */}
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(paymentMethod)}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Edit2 size={16} />
              <span className="text-sm font-medium">編集</span>
            </button>
            <button
              onClick={() => onAddTransaction(paymentMethod)}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-purple-500 text-purple-600 hover:bg-purple-50 transition-colors"
            >
              <PlusCircle size={16} />
              <span className="text-sm font-medium">取引追加</span>
            </button>
            <button
              onClick={() => {
                if (confirm('この支払い手段を削除しますか？')) {
                  onDelete(paymentMethod.id);
                  onClose();
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-red-500 text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={16} />
              <span className="text-sm font-medium">削除</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">取引がありません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedByDate).map(([date, dayTransactions]) => (
                <div key={date}>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">{formatDate(date)}</h4>
                  <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                    {dayTransactions.map((transaction) => {
                      const category = getCategory(transaction.categoryId);
                      const isExpense = transaction.type === 'expense';
                      const settlementDate = calculatePaymentDate(transaction.date, paymentMethod);
                      const settlementLabel = settlementDate ? format(settlementDate, 'M/d') + '引落' : null;
                      const isSettled = !!transaction.settledAt;
                      return (
                        <div key={transaction.id} className="p-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${category?.color || '#6b7280'}20`, color: category?.color || '#6b7280' }}
                              >
                                {getCategoryIcon(category?.icon || '', 20)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900">{category?.name || '不明'}</p>
                                {settlementDate && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Calendar size={10} className={isSettled ? 'text-green-400' : 'text-orange-400'} />
                                    <p className={`text-[11px] ${isSettled ? 'text-green-500' : 'text-orange-500'}`}>
                                      {settlementLabel}{isSettled ? '（精算済）' : ''}
                                    </p>
                                  </div>
                                )}
                                {transaction.memo && <p className="text-xs text-gray-400 mt-0.5 truncate">{transaction.memo}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                              <p className={`font-bold text-sm ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
                                {isExpense ? '-' : '+'}{formatCurrency(transaction.amount)}
                              </p>
                              <button onClick={() => setEditingTransaction(transaction)} className="p-1.5 text-gray-400 hover:text-blue-600">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => handleDelete(transaction)} className="p-1.5 text-gray-400 hover:text-red-600">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editingTransaction && (
        <div onClick={(e) => e.stopPropagation()}>
          <EditTransactionModal
            transaction={editingTransaction}
            accounts={allAccounts}
            paymentMethods={allPMs}
            categories={categories}
            members={members}
            onSave={handleSaveEdit}
            onClose={() => setEditingTransaction(null)}
          />
        </div>
      )}
    </div>
  );
};

// ===== 残高操作ヘルパー =====
const revertTransactionBalance = (transaction: Transaction) => {
  if (transaction.paymentMethodId) {
    const pm = paymentMethodService.getById(transaction.paymentMethodId);
    if (pm && pm.billingType === 'immediate' && transaction.accountId) {
      const acct = accountService.getById(transaction.accountId);
      if (acct) {
        const revert = transaction.type === 'expense' ? acct.balance + transaction.amount : acct.balance - transaction.amount;
        accountService.update(acct.id, { balance: revert });
      }
    }
    if (pm && pm.billingType === 'monthly' && transaction.settledAt && transaction.accountId) {
      const acct = accountService.getById(transaction.accountId);
      if (acct) {
        const revert = transaction.type === 'expense' ? acct.balance + transaction.amount : acct.balance - transaction.amount;
        accountService.update(acct.id, { balance: revert });
      }
    }
  } else if (transaction.accountId) {
    const acct = accountService.getById(transaction.accountId);
    if (acct) {
      const revert = transaction.type === 'expense' ? acct.balance + transaction.amount : acct.balance - transaction.amount;
      accountService.update(acct.id, { balance: revert });
    }
  }
};

const applyTransactionBalance = (input: TransactionInput) => {
  if (input.paymentMethodId) {
    const pm = paymentMethodService.getById(input.paymentMethodId);
    if (pm && pm.billingType === 'immediate' && input.accountId) {
      const acct = accountService.getById(input.accountId);
      if (acct) {
        const newBal = input.type === 'expense' ? acct.balance - input.amount : acct.balance + input.amount;
        accountService.update(acct.id, { balance: newBal });
      }
    }
  } else if (input.accountId) {
    const acct = accountService.getById(input.accountId);
    if (acct) {
      const newBal = input.type === 'expense' ? acct.balance - input.amount : acct.balance + input.amount;
      accountService.update(acct.id, { balance: newBal });
    }
  }
};

// ===== 取引追加モーダル =====
interface AddTransactionModalProps {
  defaultAccountId?: string;
  defaultPaymentMethodId?: string;
  onSaved: () => void;
  onClose: () => void;
}

const AddTransactionModal = ({ defaultAccountId, defaultPaymentMethodId, onSaved, onClose }: AddTransactionModalProps) => {
  const allAccounts = accountService.getAll();
  const allPaymentMethods = paymentMethodService.getAll();
  const categories = categoryService.getAll();
  const members = memberService.getAll();

  // 支払い元のフィルタリング：+ボタンを押した対象のみ表示
  const isFromPM = !!defaultPaymentMethodId;
  const isFromAccount = !!defaultAccountId && !defaultPaymentMethodId;

  // 支払い手段から開いた場合：その支払い手段のみ
  // 口座から開いた場合：その口座のみ（支払い手段は表示しない）
  const accounts = isFromAccount
    ? allAccounts.filter((a) => a.id === defaultAccountId)
    : isFromPM
      ? []
      : allAccounts;
  const paymentMethods = isFromPM
    ? allPaymentMethods.filter((pm) => pm.id === defaultPaymentMethodId)
    : isFromAccount
      ? []
      : allPaymentMethods;

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState(defaultAccountId || '');
  const [pmId, setPmId] = useState<string | undefined>(defaultPaymentMethodId);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [memo, setMemo] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);
  const getMember = (memberId: string) => members.find((m) => m.id === memberId);

  const handleSelectAccount = (id: string) => {
    setAccountId(id);
    setPmId(undefined);
  };

  const handleSelectPM = (id: string) => {
    const pm = allPaymentMethods.find((p) => p.id === id);
    if (pm) {
      setPmId(id);
      setAccountId(pm.linkedAccountId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || (!accountId && !pmId)) {
      alert('金額、カテゴリ、支払い元を入力してください');
      return;
    }

    const parsedAmount = parseInt(amount, 10);
    const input: TransactionInput = {
      type,
      amount: parsedAmount,
      categoryId,
      accountId,
      paymentMethodId: pmId,
      date,
      memo: memo || undefined,
    };

    transactionService.create(input);

    // 口座残高の更新
    if (pmId) {
      const pm = allPaymentMethods.find((p) => p.id === pmId);
      if (pm && pm.billingType === 'immediate' && pm.linkedAccountId) {
        const acct = accountService.getById(pm.linkedAccountId);
        if (acct) {
          const newBalance = type === 'expense' ? acct.balance - parsedAmount : acct.balance + parsedAmount;
          accountService.update(pm.linkedAccountId, { balance: newBalance });
        }
        const allTx = transactionService.getAll();
        const lastTx = allTx[allTx.length - 1];
        if (lastTx) {
          transactionService.update(lastTx.id, { settledAt: new Date().toISOString() });
        }
      }
    } else if (accountId) {
      const acct = accountService.getById(accountId);
      if (acct) {
        const newBalance = type === 'expense' ? acct.balance - parsedAmount : acct.balance + parsedAmount;
        accountService.update(accountId, { balance: newBalance });
      }
    }

    setShowSuccess(true);
    onSaved();
    setTimeout(() => {
      setShowSuccess(false);
      setAmount('');
      setCategoryId('');
      setMemo('');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md sm:rounded-xl rounded-t-xl p-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {showSuccess ? (
          <div className="py-8 text-center">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
            <p className="text-lg font-bold text-green-700">登録しました！</p>
            <p className="text-sm text-gray-500 mt-1">続けて入力できます</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">取引を追加</h3>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 収入/支出切り替え */}
              <div className="flex rounded-lg overflow-hidden border border-gray-300">
                <button
                  type="button"
                  onClick={() => { setType('expense'); setCategoryId(''); }}
                  className={`flex-1 py-2.5 font-medium transition-colors ${
                    type === 'expense' ? 'bg-red-500 text-white' : 'bg-white text-gray-700'
                  }`}
                >
                  支出
                </button>
                <button
                  type="button"
                  onClick={() => { setType('income'); setCategoryId(''); setPmId(undefined); }}
                  className={`flex-1 py-2.5 font-medium transition-colors ${
                    type === 'income' ? 'bg-green-500 text-white' : 'bg-white text-gray-700'
                  }`}
                >
                  収入
                </button>
              </div>

              {/* 金額 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">金額</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full text-xl font-bold pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* カテゴリ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                  {filteredCategories.map((category) => {
                    const member = getMember(category.memberId);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setCategoryId(category.id)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                          categoryId === category.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${category.color}20`, color: category.color }}
                        >
                          {getCategoryIcon(category.icon, 16)}
                        </div>
                        <span className="text-[11px] text-gray-700 truncate w-full text-center leading-tight">
                          {category.name}
                        </span>
                        {member && member.id !== 'common' && (
                          <span className="text-[9px] text-gray-400 leading-none">{member.name}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 支払い元 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {type === 'expense' ? '支払い元' : '入金先'}
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {accounts.length > 0 && (
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium mb-1">口座</p>
                      <div className="space-y-1">
                        {accounts.map((acct) => (
                          <button
                            key={acct.id}
                            type="button"
                            onClick={() => handleSelectAccount(acct.id)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                              accountId === acct.id && !pmId
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: acct.color }} />
                              <span className="font-medium text-gray-900 text-sm">{acct.name}</span>
                            </div>
                            {accountId === acct.id && !pmId && <Check size={16} className="text-blue-500" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {type === 'expense' && paymentMethods.length > 0 && (
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium mb-1">支払い手段</p>
                      <div className="space-y-1">
                        {paymentMethods.map((pm) => {
                          const linked = allAccounts.find((a) => a.id === pm.linkedAccountId);
                          return (
                            <button
                              key={pm.id}
                              type="button"
                              onClick={() => handleSelectPM(pm.id)}
                              className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                                pmId === pm.id
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: pm.color }} />
                                <div className="text-left">
                                  <span className="font-medium text-gray-900 text-sm">{pm.name}</span>
                                  {linked && <p className="text-[9px] text-gray-400">→ {linked.name}</p>}
                                </div>
                              </div>
                              {pmId === pm.id && <Check size={16} className="text-purple-500" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 日付 */}
              <div className="overflow-x-hidden">
                <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ minWidth: 0, maxWidth: '100%' }}
                />
              </div>

              {/* メモ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="任意"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium">
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={!amount || !categoryId || (!accountId && !pmId)}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-white font-medium disabled:opacity-50 ${
                    type === 'expense' ? 'bg-red-500' : 'bg-green-500'
                  }`}
                >
                  {type === 'expense' ? '支出を登録' : '収入を登録'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

// ===== 取引編集モーダル =====
interface EditTransactionModalProps {
  transaction: Transaction;
  accounts: Account[];
  paymentMethods: PaymentMethod[];
  categories: { id: string; name: string; type: TransactionType; color: string; icon: string; memberId: string }[];
  members: Member[];
  onSave: (input: TransactionInput) => void;
  onClose: () => void;
}

const EditTransactionModal = ({
  transaction, accounts, paymentMethods, categories, members, onSave, onClose,
}: EditTransactionModalProps) => {
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [categoryId, setCategoryId] = useState(transaction.categoryId);
  const [accountId, setAccountId] = useState(transaction.accountId);
  const [pmId, setPmId] = useState<string | undefined>(transaction.paymentMethodId);
  const [date, setDate] = useState(transaction.date);
  const [memo, setMemo] = useState(transaction.memo || '');

  const filteredCategories = categories.filter((c) => c.type === type);
  const getMember = (memberId: string) => members.find((m) => m.id === memberId);

  const handleSelectAccount = (id: string) => {
    setAccountId(id);
    setPmId(undefined);
  };

  const handleSelectPM = (id: string) => {
    const pm = paymentMethods.find((p) => p.id === id);
    if (pm) {
      setPmId(id);
      setAccountId(pm.linkedAccountId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || (!accountId && !pmId)) {
      alert('金額、カテゴリ、支払い元を入力してください');
      return;
    }
    onSave({
      type,
      amount: parseInt(amount, 10),
      categoryId,
      accountId,
      paymentMethodId: pmId,
      date,
      memo: memo || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[60]" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md sm:rounded-xl rounded-t-xl p-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-4">取引を編集</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            <button
              type="button"
              onClick={() => { setType('expense'); setCategoryId(''); }}
              className={`flex-1 py-2.5 font-medium transition-colors ${
                type === 'expense' ? 'bg-red-500 text-white' : 'bg-white text-gray-700'
              }`}
            >
              支出
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); setCategoryId(''); setPmId(undefined); }}
              className={`flex-1 py-2.5 font-medium transition-colors ${
                type === 'income' ? 'bg-green-500 text-white' : 'bg-white text-gray-700'
              }`}
            >
              収入
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">金額</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-xl font-bold pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {filteredCategories.map((category) => {
                const member = getMember(category.memberId);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setCategoryId(category.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                      categoryId === category.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20`, color: category.color }}
                    >
                      {getCategoryIcon(category.icon, 16)}
                    </div>
                    <span className="text-[11px] text-gray-700 truncate w-full text-center leading-tight">
                      {category.name}
                    </span>
                    {member && member.id !== 'common' && (
                      <span className="text-[9px] text-gray-400 leading-none">{member.name}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'expense' ? '支払い元' : '入金先'}
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {accounts.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 font-medium mb-1">口座</p>
                  <div className="space-y-1">
                    {accounts.map((acct) => (
                      <button
                        key={acct.id}
                        type="button"
                        onClick={() => handleSelectAccount(acct.id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                          accountId === acct.id && !pmId
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: acct.color }} />
                          <span className="font-medium text-gray-900 text-sm">{acct.name}</span>
                        </div>
                        {accountId === acct.id && !pmId && <Check size={16} className="text-blue-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {type === 'expense' && paymentMethods.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 font-medium mb-1">支払い手段</p>
                  <div className="space-y-1">
                    {paymentMethods.map((pm) => {
                      const linked = accounts.find((a) => a.id === pm.linkedAccountId);
                      return (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => handleSelectPM(pm.id)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                            pmId === pm.id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: pm.color }} />
                            <div className="text-left">
                              <span className="font-medium text-gray-900 text-sm">{pm.name}</span>
                              {linked && <p className="text-[9px] text-gray-400">→ {linked.name}</p>}
                            </div>
                          </div>
                          {pmId === pm.id && <Check size={16} className="text-purple-500" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-hidden">
            <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ minWidth: 0, maxWidth: '100%' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="任意"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium">
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!amount || !categoryId || (!accountId && !pmId)}
              className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-50"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ===== 定期支払い追加/編集モーダル =====
interface RecurringPaymentModalProps {
  recurringPayment: RecurringPayment | null;
  defaultAccountId?: string;
  defaultPaymentMethodId?: string;
  accounts: Account[];
  paymentMethods: PaymentMethod[];
  onSave: (input: RecurringPaymentInput) => void;
  onClose: () => void;
}

const RecurringPaymentModal = ({
  recurringPayment, defaultAccountId, defaultPaymentMethodId,
  accounts: allAccounts, paymentMethods: allPaymentMethods, onSave, onClose,
}: RecurringPaymentModalProps) => {
  const categories = categoryService.getAll();
  const members = memberService.getAll();

  // 支払い元のフィルタリング：+ボタンを押した対象のみ表示
  const isFromPM = !!defaultPaymentMethodId;
  const isFromAccount = !!defaultAccountId && !defaultPaymentMethodId;

  // 支払い手段から開いた場合：その支払い手段のみ
  // 口座から開いた場合：その口座のみ（支払い手段は表示しない）
  const accounts = isFromAccount
    ? allAccounts.filter((a) => a.id === defaultAccountId)
    : isFromPM
      ? []
      : allAccounts;
  const paymentMethods = isFromPM
    ? allPaymentMethods.filter((pm) => pm.id === defaultPaymentMethodId)
    : isFromAccount
      ? []
      : allPaymentMethods;

  const [name, setName] = useState(recurringPayment?.name || '');
  const [amount, setAmount] = useState(recurringPayment?.amount.toString() || '');
  const [type, setType] = useState<TransactionType>(recurringPayment?.type || 'expense');
  const [categoryId, setCategoryId] = useState(recurringPayment?.categoryId || '');
  const [accountId, setAccountId] = useState(recurringPayment?.accountId || defaultAccountId || '');
  const [pmId, setPmId] = useState<string | undefined>(recurringPayment?.paymentMethodId || defaultPaymentMethodId);
  const [frequency, setFrequency] = useState<RecurringFrequency>(recurringPayment?.frequency || 'monthly');
  const [dayOfMonth, setDayOfMonth] = useState(recurringPayment?.dayOfMonth.toString() || '1');
  const [monthOfYear, setMonthOfYear] = useState(recurringPayment?.monthOfYear?.toString() || '1');
  const [memo, setMemo] = useState(recurringPayment?.memo || '');
  const [isActive, setIsActive] = useState(recurringPayment?.isActive ?? true);

  const filteredCategories = categories.filter((c) => c.type === type);
  const getMember = (memberId: string) => members.find((m) => m.id === memberId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !categoryId || (!accountId && !pmId)) {
      alert('名前、金額、カテゴリ、支払い元を入力してください');
      return;
    }
    onSave({
      name,
      amount: parseInt(amount, 10),
      type,
      categoryId,
      accountId,
      paymentMethodId: pmId,
      frequency,
      dayOfMonth: parseInt(dayOfMonth, 10) || 1,
      monthOfYear: frequency === 'yearly' ? parseInt(monthOfYear, 10) || 1 : undefined,
      memo: memo || undefined,
      isActive,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md sm:rounded-xl rounded-t-xl p-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{recurringPayment ? '定期取引を編集' : '定期取引を追加'}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 名前 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 家賃、携帯料金、Netflix"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* 収入/支出 */}
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            <button
              type="button"
              onClick={() => { setType('expense'); setCategoryId(''); }}
              className={`flex-1 py-2 font-medium transition-colors ${
                type === 'expense' ? 'bg-red-500 text-white' : 'bg-white text-gray-700'
              }`}
            >
              支出
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); setCategoryId(''); setPmId(undefined); }}
              className={`flex-1 py-2 font-medium transition-colors ${
                type === 'income' ? 'bg-green-500 text-white' : 'bg-white text-gray-700'
              }`}
            >
              収入
            </button>
          </div>

          {/* 金額 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">金額</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full text-lg font-bold pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* 頻度 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">頻度</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFrequency('monthly')}
                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  frequency === 'monthly'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                毎月
              </button>
              <button
                type="button"
                onClick={() => setFrequency('yearly')}
                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  frequency === 'yearly'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                毎年
              </button>
            </div>
          </div>

          {/* 支払い日 */}
          <div className="bg-gray-50 rounded-lg p-3">
            {frequency === 'yearly' && (
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">月</label>
                <div className="flex items-center gap-2">
                  <select
                    value={monthOfYear}
                    onChange={(e) => setMonthOfYear(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>{m}月</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">日</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(e.target.value)}
                  className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">日</span>
              </div>
            </div>
          </div>

          {/* カテゴリ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
            <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
              {filteredCategories.map((category) => {
                const member = getMember(category.memberId);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setCategoryId(category.id)}
                    className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-colors ${
                      categoryId === category.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20`, color: category.color }}
                    >
                      {getCategoryIcon(category.icon, 14)}
                    </div>
                    <span className="text-[10px] text-gray-700 truncate w-full text-center">{category.name}</span>
                    {member && member.id !== 'common' && (
                      <span className="text-[8px] text-gray-400 leading-none">{member.name}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 支払い元（変更可能にする） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'expense' ? '支払い元' : '入金先'}
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {accounts.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 font-medium mb-1">口座</p>
                  <div className="space-y-1">
                    {accounts.map((acct) => (
                      <button
                        key={acct.id}
                        type="button"
                        onClick={() => { setAccountId(acct.id); setPmId(undefined); }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors ${
                          accountId === acct.id && !pmId
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: acct.color }} />
                          <span className="text-sm text-gray-900">{acct.name}</span>
                        </div>
                        {accountId === acct.id && !pmId && <Check size={14} className="text-blue-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {type === 'expense' && paymentMethods.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 font-medium mb-1">支払い手段</p>
                  <div className="space-y-1">
                    {paymentMethods.map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => { setPmId(pm.id); setAccountId(pm.linkedAccountId); }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors ${
                          pmId === pm.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pm.color }} />
                          <span className="text-sm text-gray-900">{pm.name}</span>
                        </div>
                        {pmId === pm.id && <Check size={14} className="text-purple-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* メモ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="任意"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 有効/無効 */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">有効</span>
            <button type="button" onClick={() => setIsActive(!isActive)}>
              {isActive
                ? <ToggleRight size={28} className="text-green-500" />
                : <ToggleLeft size={28} className="text-gray-300" />
              }
            </button>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium">
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!name || !amount || !categoryId || (!accountId && !pmId)}
              className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-50"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ===== 支払い手段紐付けモーダル =====
interface LinkedPaymentMethodModalProps {
  linkedPaymentMethod: LinkedPaymentMethod | null;
  defaultAccountId?: string;
  accounts: Account[];
  paymentMethods: PaymentMethod[];
  onSave: (input: LinkedPaymentMethodInput) => void;
  onClose: () => void;
}

const LinkedPaymentMethodModal = ({
  linkedPaymentMethod,
  defaultAccountId,
  accounts,
  paymentMethods,
  onSave,
  onClose,
}: LinkedPaymentMethodModalProps) => {
  const members = memberService.getAll();

  const [paymentMethodId, setPaymentMethodId] = useState(linkedPaymentMethod?.paymentMethodId || '');
  const [accountId, setAccountId] = useState(linkedPaymentMethod?.accountId || defaultAccountId || '');
  const [isActive, setIsActive] = useState(linkedPaymentMethod?.isActive ?? true);

  const getMember = (memberId: string) => members.find((m) => m.id === memberId);

  // 既に紐付けられている支払い手段を除外
  const linkedPMs = linkedPaymentMethodService.getAll();
  const linkedPMIds = linkedPaymentMethod
    ? linkedPMs.filter((lpm) => lpm.id !== linkedPaymentMethod.id).map((lpm) => lpm.paymentMethodId)
    : linkedPMs.map((lpm) => lpm.paymentMethodId);
  const availablePaymentMethods = paymentMethods.filter((pm) => !linkedPMIds.includes(pm.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethodId || !accountId) {
      alert('支払い手段と支払い口座を選択してください');
      return;
    }
    onSave({
      paymentMethodId,
      accountId,
      isActive,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md sm:rounded-xl rounded-t-xl p-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{linkedPaymentMethod ? '支払い手段を編集' : '支払い手段を追加'}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 支払い手段選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">支払い手段</label>
            <select
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">選択してください</option>
              {availablePaymentMethods.map((pm) => {
                const member = getMember(pm.memberId);
                return (
                  <option key={pm.id} value={pm.id}>
                    {pm.name} {member ? `(${member.name})` : ''}
                  </option>
                );
              })}
            </select>
            {availablePaymentMethods.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">利用可能な支払い手段がありません</p>
            )}
          </div>

          {/* 支払い口座選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">支払い口座</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">選択してください</option>
              {accounts.map((acc) => {
                const member = getMember(acc.memberId);
                return (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} {member ? `(${member.name})` : ''} - {ACCOUNT_TYPE_LABELS[acc.type]}
                  </option>
                );
              })}
            </select>
          </div>

          {/* 有効/無効 */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">有効</span>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className="flex items-center gap-2"
            >
              {isActive ? (
                <ToggleRight size={32} className="text-blue-600" />
              ) : (
                <ToggleLeft size={32} className="text-gray-400" />
              )}
            </button>
          </div>

          {/* ボタン */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ===== 総資産グラデーション選択モーダル =====
const GRADIENT_PRESETS: { from: string; to: string; label: string }[] = [
  { from: '#3b82f6', to: '#2563eb', label: 'ブルー' },
  { from: '#6366f1', to: '#4f46e5', label: 'インディゴ' },
  { from: '#8b5cf6', to: '#7c3aed', label: 'パープル' },
  { from: '#ec4899', to: '#db2777', label: 'ピンク' },
  { from: '#14b8a6', to: '#0d9488', label: 'ティール' },
  { from: '#22c55e', to: '#16a34a', label: 'グリーン' },
  { from: '#f97316', to: '#ea580c', label: 'オレンジ' },
  { from: '#ef4444', to: '#dc2626', label: 'レッド' },
  { from: '#64748b', to: '#475569', label: 'スレート' },
  { from: '#1e293b', to: '#0f172a', label: 'ダーク' },
];

interface GradientPickerModalProps {
  currentFrom: string;
  currentTo: string;
  onSave: (from: string, to: string) => void;
  onClose: () => void;
}

const GradientPickerModal = ({ currentFrom, currentTo, onSave, onClose }: GradientPickerModalProps) => {
  const [selectedFrom, setSelectedFrom] = useState(currentFrom);
  const [selectedTo, setSelectedTo] = useState(currentTo);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-xl p-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">総資産の背景色</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* プレビュー */}
        <div
          className="rounded-xl p-4 text-white mb-4"
          style={{ background: `linear-gradient(to right, ${selectedFrom}, ${selectedTo})` }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={20} />
            <span className="text-sm opacity-90">総資産</span>
          </div>
          <p className="text-2xl font-bold">プレビュー</p>
        </div>

        {/* プリセット選択 */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {GRADIENT_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => { setSelectedFrom(preset.from); setSelectedTo(preset.to); }}
              className={`flex items-center gap-2 p-2.5 rounded-lg border-2 transition-colors ${
                selectedFrom === preset.from && selectedTo === preset.to
                  ? 'border-blue-500'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div
                className="w-8 h-8 rounded-full flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${preset.from}, ${preset.to})` }}
              />
              <span className="text-sm font-medium text-gray-700">{preset.label}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium">
            キャンセル
          </button>
          <button
            onClick={() => onSave(selectedFrom, selectedTo)}
            className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 text-white font-medium"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
