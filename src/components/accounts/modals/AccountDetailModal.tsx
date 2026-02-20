import { Pencil, X } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { memberService } from '../../../services/storage';
import { ACCOUNT_TYPE_LABELS } from '../constants';
import { ACCOUNT_TYPE_ICONS } from '../AccountIcons';
import type { Account } from '../../../types';

interface AccountDetailModalProps {
  account: Account | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (account: Account) => void;
}

export const AccountDetailModal = ({
  account,
  isOpen,
  onClose,
  onEdit,
}: AccountDetailModalProps) => {
  if (!isOpen || !account) return null;

  const members = memberService.getAll();
  const member = members.find((m) => m.id === account.memberId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[1000]" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md sm:rounded-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">口座詳細</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400"
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-3 sm:p-4">
          <div className="space-y-4 sm:space-y-5">
            {/* 口座名 */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
                口座名
              </label>
              <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                {account.name}
              </div>
            </div>

            {/* 口座タイプ */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
                口座タイプ
              </label>
              <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                {ACCOUNT_TYPE_ICONS[account.type]}
                {ACCOUNT_TYPE_LABELS[account.type]}
              </div>
            </div>

            {/* メンバー */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
                メンバー
              </label>
              <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                {member?.name || 'その他'}
              </div>
            </div>

            {/* 残高 */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
                残高
              </label>
              <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(account.balance)}
              </div>
            </div>

            {/* 色 */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
                色
              </label>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: account.color }}
                />
                <span className="text-sm text-gray-900 dark:text-gray-100">{account.color}</span>
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        {onEdit && account && (
          <div className="flex gap-2 p-3 sm:p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
            <button
              onClick={() => {
                onEdit(account);
                onClose();
              }}
              className="flex-1 bg-gray-900 hover:bg-gray-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors text-sm sm:text-base flex items-center justify-center gap-2"
            >
              <Pencil size={16} />
              編集
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
