import { useState } from 'react';
import { ACCOUNT_TYPE_LABELS, COLORS } from '../constants';
import { ACCOUNT_TYPE_ICONS } from '../AccountIcons';
import { COMMON_MEMBER_ID } from '../../../types';
import type { Account, AccountType, AccountInput, Member } from '../../../types';

interface AccountModalProps {
  account: Account | null;
  members: Member[];
  onSave: (input: AccountInput) => void;
  onClose: () => void;
}

export const AccountModal = ({ account, members, onSave, onClose }: AccountModalProps) => {
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="premium-card w-full sm:max-w-md md:max-w-lg sm:rounded-xl rounded-t-xl p-5 max-h-[90vh] overflow-y-auto animate-scale-in">
        <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-brand-700 to-accent-700 bg-clip-text text-transparent dark:from-brand-300 dark:to-accent-300">
          {account ? '口座を編集' : '口座を追加'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-700 dark:text-brand-300 mb-1">名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 夫メイン銀行"
              className="w-full border border-brand-300 dark:border-brand-600 dark:bg-brand-900 dark:text-brand-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-accent-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-700 dark:text-brand-300 mb-1">所有者</label>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setMemberId(member.id)}
                  className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                    memberId === member.id
                      ? 'bg-gradient-to-r from-brand-600 to-accent-600 text-white border-brand-600 shadow-brand'
                      : 'bg-white dark:bg-brand-900 text-brand-700 dark:text-brand-300 border-brand-300 dark:border-brand-600 hover:border-brand-400 dark:hover:border-brand-500'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: member.color }} />
                  {member.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-700 dark:text-brand-300 mb-1">種類</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(ACCOUNT_TYPE_LABELS) as [AccountType, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAccountType(value)}
                  className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                    accountType === value
                      ? 'bg-gradient-to-r from-brand-600 to-accent-600 text-white border-brand-600 shadow-brand'
                      : 'bg-white dark:bg-brand-900 text-brand-700 dark:text-brand-300 border-brand-300 dark:border-brand-600 hover:border-brand-400 dark:hover:border-brand-500'
                  }`}
                >
                  {ACCOUNT_TYPE_ICONS[value]}
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-700 dark:text-brand-300 mb-1">残高</label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full border border-brand-300 dark:border-brand-600 dark:bg-brand-900 dark:text-brand-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-accent-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-700 dark:text-brand-300 mb-1">色</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-brand-500 dark:ring-accent-500 scale-110 shadow-brand dark:ring-offset-brand-900' : 'shadow-card'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2 px-4">
              キャンセル
            </button>
            <button type="submit" className="btn-primary flex-1 py-2 px-4">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
