import { useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Wallet, CreditCard, Building2, Smartphone, Banknote } from 'lucide-react';
import { accountService, memberService } from '../services/storage';
import { formatCurrency } from '../utils/formatters';
import { COMMON_MEMBER_ID } from '../types';
import type { Account, PaymentMethod, AccountInput, Member } from '../types';

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: '現金',
  bank: '銀行口座',
  credit_card: 'クレジットカード',
  debit_card: 'デビットカード',
  emoney: '電子マネー',
};

const PAYMENT_METHOD_ICONS: Record<PaymentMethod, React.ReactNode> = {
  cash: <Banknote size={20} />,
  bank: <Building2 size={20} />,
  credit_card: <CreditCard size={20} />,
  debit_card: <CreditCard size={20} />,
  emoney: <Smartphone size={20} />,
};

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
];

export const AccountsPage = () => {
  const [accounts, setAccounts] = useState<Account[]>(() => accountService.getAll());
  const members = memberService.getAll();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const refreshAccounts = useCallback(() => {
    setAccounts(accountService.getAll());
  }, []);

  const handleAdd = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('この口座を削除しますか？')) {
      accountService.delete(id);
      refreshAccounts();
    }
  };

  const handleSave = (input: AccountInput) => {
    if (editingAccount) {
      accountService.update(editingAccount.id, input);
    } else {
      accountService.create(input);
    }
    refreshAccounts();
    setIsModalOpen(false);
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  // メンバー別にグループ化
  const groupedAccounts = accounts.reduce<Record<string, Account[]>>((acc, account) => {
    const memberId = account.memberId;
    if (!acc[memberId]) {
      acc[memberId] = [];
    }
    acc[memberId].push(account);
    return acc;
  }, {});

  const getMember = (memberId: string) => members.find((m) => m.id === memberId);

  return (
    <div className="p-4 space-y-4">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">口座管理</h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
        >
          <Plus size={18} />
          追加
        </button>
      </div>

      {/* 合計残高 */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Wallet size={20} />
          <span className="text-sm opacity-90">総資産</span>
        </div>
        <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
      </div>

      {/* 口座一覧 */}
      {accounts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Wallet size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">口座がありません</p>
          <button
            onClick={handleAdd}
            className="mt-4 text-blue-600 font-medium"
          >
            口座を追加する
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedAccounts).map(([memberId, memberAccounts]) => {
            const member = getMember(memberId);
            return (
              <div key={memberId}>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: member?.color || '#6b7280' }} />
                  {member?.name || '不明'}
                </h3>
                <div className="space-y-2">
                  {memberAccounts.map((account) => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      onEdit={() => handleEdit(account)}
                      onDelete={() => handleDelete(account.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* モーダル */}
      {isModalOpen && (
        <AccountModal
          account={editingAccount}
          members={members}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

interface AccountCardProps {
  account: Account;
  onEdit: () => void;
  onDelete: () => void;
}

const AccountCard = ({ account, onEdit, onDelete }: AccountCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: account.color }}
          >
            {PAYMENT_METHOD_ICONS[account.paymentMethod]}
          </div>
          <div>
            <p className="font-medium text-gray-900">{account.name}</p>
            <p className="text-xs text-gray-500">{PAYMENT_METHOD_LABELS[account.paymentMethod]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="p-2 text-gray-400 hover:text-gray-600">
            <Edit2 size={16} />
          </button>
          <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="mt-3 text-right">
        <p className="text-xl font-bold text-gray-900">{formatCurrency(account.balance)}</p>
      </div>
    </div>
  );
};

interface AccountModalProps {
  account: Account | null;
  members: Member[];
  onSave: (input: AccountInput) => void;
  onClose: () => void;
}

const AccountModal = ({ account, members, onSave, onClose }: AccountModalProps) => {
  const [name, setName] = useState(account?.name || '');
  const [memberId, setMemberId] = useState(account?.memberId || COMMON_MEMBER_ID);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(account?.paymentMethod || 'bank');
  const [balance, setBalance] = useState(account?.balance.toString() || '0');
  const [color, setColor] = useState(account?.color || COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      memberId,
      paymentMethod,
      balance: parseInt(balance, 10) || 0,
      color,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-xl p-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">{account ? '口座を編集' : '口座を追加'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 名前 */}
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

          {/* メンバー */}
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

          {/* 支払い方法 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">種類</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPaymentMethod(value)}
                  className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    paymentMethod === value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {PAYMENT_METHOD_ICONS[value]}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 残高 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">残高</label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 色 */}
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

          {/* ボタン */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 rounded-lg bg-blue-600 text-white font-medium"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
