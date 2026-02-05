import { useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Wallet, CreditCard, Building2, Smartphone, Banknote, X, AlertCircle, Link2, Info } from 'lucide-react';
import { accountService, memberService, transactionService, categoryService, paymentMethodService } from '../services/storage';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getCategoryIcon } from '../utils/categoryIcons';
import { getPendingAmountByAccount, getPendingAmountByPaymentMethod } from '../utils/billingUtils';
import { COMMON_MEMBER_ID } from '../types';
import type { Account, AccountType, AccountInput, PaymentMethod, PaymentMethodType, PaymentMethodInput, BillingType, Member } from '../types';

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

export const AccountsPage = () => {
  const [accounts, setAccounts] = useState<Account[]>(() => accountService.getAll());
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => paymentMethodService.getAll());
  const members = memberService.getAll();

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [viewingAccount, setViewingAccount] = useState<Account | null>(null);

  const [isPMModalOpen, setIsPMModalOpen] = useState(false);
  const [editingPM, setEditingPM] = useState<PaymentMethod | null>(null);

  const pendingByAccount = getPendingAmountByAccount();
  const pendingByPM = getPendingAmountByPaymentMethod();

  const refreshData = useCallback(() => {
    setAccounts(accountService.getAll());
    setPaymentMethods(paymentMethodService.getAll());
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

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalPending = Object.values(pendingByAccount).reduce((sum, v) => sum + v, 0);

  // メンバー別にグループ化
  const groupedAccounts = accounts.reduce<Record<string, Account[]>>((acc, account) => {
    const memberId = account.memberId;
    if (!acc[memberId]) acc[memberId] = [];
    acc[memberId].push(account);
    return acc;
  }, {});

  const groupedPMs = paymentMethods.reduce<Record<string, PaymentMethod[]>>((acc, pm) => {
    const memberId = pm.memberId;
    if (!acc[memberId]) acc[memberId] = [];
    acc[memberId].push(pm);
    return acc;
  }, {});

  const getMember = (memberId: string) => members.find((m) => m.id === memberId);
  const getAccount = (accountId: string) => accounts.find((a) => a.id === accountId);

  // 紐づき先未設定の支払い手段があるか
  const hasUnlinkedPMs = paymentMethods.some((pm) => !pm.linkedAccountId);

  return (
    <div className="p-4 space-y-4">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">口座・支払い手段</h2>
      </div>

      {/* 紐づき未設定の警告 */}
      {hasUnlinkedPMs && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">引き落とし先が未設定の支払い手段があります</p>
            <p className="text-amber-600 mt-1">支払い手段の編集から引き落とし先口座を設定してください。</p>
          </div>
        </div>
      )}

      {/* 合計残高 */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Wallet size={20} />
          <span className="text-sm opacity-90">総資産</span>
        </div>
        <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
        {totalPending > 0 && (
          <p className="text-sm opacity-80 mt-1">
            引落後: {formatCurrency(totalBalance - totalPending)}
          </p>
        )}
      </div>

      {/* ===== 口座セクション ===== */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-base font-bold text-gray-700">口座</h3>
          <button
            onClick={handleAddAccount}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
          >
            <Plus size={16} />
            追加
          </button>
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
                      const linkedPMs = paymentMethods.filter((pm) => pm.linkedAccountId === account.id);
                      return (
                        <AccountCard
                          key={account.id}
                          account={account}
                          pendingAmount={pendingByAccount[account.id] || 0}
                          linkedPaymentMethods={linkedPMs}
                          onView={() => setViewingAccount(account)}
                          onEdit={() => handleEditAccount(account)}
                          onDelete={() => handleDeleteAccount(account.id)}
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

      {/* ===== 支払い手段セクション ===== */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-base font-bold text-gray-700">支払い手段</h3>
          <button
            onClick={handleAddPM}
            className="flex items-center gap-1 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
          >
            <Plus size={16} />
            追加
          </button>
        </div>

        {paymentMethods.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <CreditCard size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">支払い手段がありません</p>
            <button onClick={handleAddPM} className="mt-2 text-purple-600 font-medium text-sm">
              支払い手段を追加する
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedPMs).map(([memberId, memberPMs]) => {
              const member = getMember(memberId);
              return (
                <div key={memberId}>
                  <h4 className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: member?.color || '#6b7280' }} />
                    {member?.name || '不明'}
                  </h4>
                  <div className="space-y-2">
                    {memberPMs.map((pm) => {
                      const linkedAccount = getAccount(pm.linkedAccountId);
                      return (
                        <PaymentMethodCard
                          key={pm.id}
                          paymentMethod={pm}
                          linkedAccountName={linkedAccount?.name}
                          pendingAmount={pendingByPM[pm.id] || 0}
                          onEdit={() => handleEditPM(pm)}
                          onDelete={() => handleDeletePM(pm.id)}
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
          onClose={() => setViewingAccount(null)}
        />
      )}
    </div>
  );
};

// ===== 口座カード =====
interface AccountCardProps {
  account: Account;
  pendingAmount: number;
  linkedPaymentMethods: PaymentMethod[];
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const AccountCard = ({ account, pendingAmount, linkedPaymentMethods, onView, onEdit, onDelete }: AccountCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex justify-between items-start">
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
        <div className="flex items-center gap-2 flex-shrink-0">
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
        {pendingAmount > 0 && (
          <p className="text-xs text-gray-500 mt-0.5">
            引落後: {formatCurrency(account.balance - pendingAmount)}
          </p>
        )}
      </button>
      {linkedPaymentMethods.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 font-medium mb-1.5">紐づき支払い手段</p>
          <div className="flex flex-wrap gap-1.5">
            {linkedPaymentMethods.map((pm) => (
              <div key={pm.id} className="flex items-center gap-1 bg-gray-50 rounded-full px-2 py-0.5">
                <div className="w-3 h-3 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: pm.color }}>
                  <CreditCard size={7} />
                </div>
                <span className="text-[11px] text-gray-600">{pm.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ===== 支払い手段カード =====
interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  linkedAccountName?: string;
  pendingAmount: number;
  onEdit: () => void;
  onDelete: () => void;
}

const PaymentMethodCard = ({ paymentMethod, linkedAccountName, pendingAmount, onEdit, onDelete }: PaymentMethodCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3 flex-1">
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
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
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
              <select
                value={linkedAccountId}
                onChange={(e) => setLinkedAccountId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">選択してください</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
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
            // 締め日以前の取引例: 1月{cd}日 → 引き落とし月 = 1月 + offset
            const payMonth1 = 1 + offset;
            // 締め日翌日の取引例: 1月{cd+1}日 → 引き落とし月 = 2月 + offset
            const payMonth2 = 2 + offset;
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
                      <p>1月{cd + 1}日の取引 → <span className="font-medium">{payMonth2}月{pd}日</span>に引き落とし</p>
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

// ===== 取引履歴モーダル =====
interface AccountTransactionsModalProps {
  account: Account;
  onClose: () => void;
}

const AccountTransactionsModal = ({ account, onClose }: AccountTransactionsModalProps) => {
  const allTransactions = transactionService.getAll();
  const allPMs = paymentMethodService.getAll();

  // この口座に直接紐づく取引 + この口座にリンクされた支払い手段の取引
  const linkedPMIds = allPMs
    .filter((pm) => pm.linkedAccountId === account.id)
    .map((pm) => pm.id);

  const transactions = allTransactions
    .filter((t) => t.accountId === account.id || (t.paymentMethodId && linkedPMIds.includes(t.paymentMethodId)))
    .sort((a, b) => b.date.localeCompare(a.date));

  const categories = categoryService.getAll();
  const getCategory = (categoryId: string) => categories.find((c) => c.id === categoryId);
  const getPM = (pmId?: string) => pmId ? allPMs.find((p) => p.id === pmId) : undefined;

  const groupedByDate: Record<string, typeof transactions> = {};
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
                      return (
                        <div key={transaction.id} className="flex justify-between items-center p-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: `${category?.color || '#6b7280'}20`, color: category?.color || '#6b7280' }}
                            >
                              {getCategoryIcon(category?.icon || '', 20)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{category?.name || '不明'}</p>
                              {pm && <p className="text-xs text-purple-500">{pm.name}</p>}
                              {transaction.memo && <p className="text-xs text-gray-400 mt-0.5">{transaction.memo}</p>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
                              {isExpense ? '-' : '+'}{formatCurrency(transaction.amount)}
                            </p>
                            {pm && !transaction.settledAt && (
                              <p className="text-[10px] text-orange-500">未精算</p>
                            )}
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
    </div>
  );
};
