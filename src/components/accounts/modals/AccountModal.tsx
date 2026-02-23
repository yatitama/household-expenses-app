import { useState } from 'react';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';
import { X, Trash2, Check, User } from 'lucide-react';
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
  useBodyScrollLock(true);

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
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-60" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 w-full sm:max-w-md md:max-w-lg sm:rounded-xl rounded-t-xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 sm:p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">{account ? '口座を編集' : '口座を追加'}</h3>
            {account && onDelete && (
              <button
                type="button"
                onClick={() => { onDelete(account.id); onClose(); }}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="削除"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-3 sm:p-4">
          <div className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 夫メイン銀行"
              className="w-full bg-gray-50 dark:bg-slate-700 dark:border-gray-600 dark:text-gray-100 rounded-lg px-3 py-2.5 text-base transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary-600 focus:border-primary-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">所有者</label>
            <div className="grid grid-cols-3 gap-2">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setMemberId(member.id)}
                  className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                    memberId === member.id
                      ? 'bg-gray-100 dark:bg-gray-700'
                      : ''
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${member.color}30` }}
                  >
                    <User size={16} style={{ color: member.color }} />
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-900 dark:text-gray-200 break-words w-full text-center leading-tight">
                    {member.name}
                  </span>
                  {memberId === member.id && (
                    <div className="absolute -top-1 -right-1">
                      <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                    </div>
                  )}
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
                  className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                    accountType === value
                      ? 'bg-gray-100 dark:bg-gray-700'
                      : ''
                  }`}
                >
                  <div className="text-gray-600 dark:text-gray-400">
                    {ACCOUNT_TYPE_ICONS[value]}
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-900 dark:text-gray-200 break-words w-full text-center leading-tight">
                    {label}
                  </span>
                  {accountType === value && (
                    <div className="absolute -top-1 -right-1">
                      <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                    </div>
                  )}
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
              placeholder="0"
              className="w-full bg-gray-50 dark:bg-slate-700 dark:border-gray-600 dark:text-gray-100 rounded-lg px-3 py-2.5 text-base transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary-600 focus:border-primary-600"
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
                    color === c ? 'ring-2 ring-offset-2 ring-primary-600 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          </div>
        </div>
        <div className="border-t dark:border-gray-700 p-3 sm:p-4">
          <button type="submit" className="w-full py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-white font-medium text-sm transition-colors hover:opacity-90" style={{ backgroundColor: 'var(--theme-primary)' }}>
            保存
          </button>
        </div>
      </form>
    </div>
  );
};
