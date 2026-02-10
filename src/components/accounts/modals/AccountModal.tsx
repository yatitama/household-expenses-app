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
  onDelete?: (id: string) => void;
}

export const AccountModal = ({ account, members, onSave, onClose, onDelete }: AccountModalProps) => {
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
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-60">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 w-full sm:max-w-md md:max-w-lg sm:rounded-xl rounded-t-xl flex flex-col max-h-[90vh]">
        <div className="overflow-y-auto flex-1 p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100">{account ? '口座を編集' : '口座を追加'}</h3>
          <div className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
              名前
              <span className="text-danger-600 ml-1">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 夫メイン銀行"
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-3 py-2.5 text-base transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary-600 focus:border-primary-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">所有者</label>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setMemberId(member.id)}
                  className={`flex items-center gap-2 py-1.5 px-2 sm:py-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${
                    memberId === member.id
                      ? 'text-white border-transparent'
                      : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                  style={memberId === member.id ? { backgroundColor: 'var(--theme-primary)' } : {}}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: member.color }} />
                  {member.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">種類</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(ACCOUNT_TYPE_LABELS) as [AccountType, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAccountType(value)}
                  className={`flex items-center gap-1 sm:gap-2 py-1.5 px-2 sm:py-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${
                    accountType === value
                      ? 'text-white border-transparent'
                      : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                  style={accountType === value ? { backgroundColor: 'var(--theme-primary)' } : {}}
                >
                  {ACCOUNT_TYPE_ICONS[value]}
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">残高</label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-3 py-2.5 text-base transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary-600 focus:border-primary-600"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">色</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-blue-600 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 space-y-2">
          {account && onDelete && (
            <button
              type="button"
              onClick={() => { onDelete(account.id); onClose(); }}
              className="w-full py-2 px-3 sm:px-4 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-colors text-sm"
            >
              削除
            </button>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 px-3 sm:px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-100 font-medium hover:bg-gray-200 dark:hover:bg-slate-600 text-sm">
              キャンセル
            </button>
            <button type="submit" className="flex-1 py-2 px-3 sm:px-4 rounded-lg text-white font-medium text-sm transition-colors hover:opacity-90" style={{ backgroundColor: 'var(--theme-primary)' }}>
              保存
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
