import { useState } from 'react';
import toast from 'react-hot-toast';
import { X, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import { categoryService, memberService } from '../../../services/storage';
import { getCategoryIcon } from '../../../utils/categoryIcons';
import type {
  Account, PaymentMethod, RecurringPayment,
  RecurringPaymentInput, RecurringFrequency, TransactionType,
} from '../../../types';

interface RecurringPaymentModalProps {
  recurringPayment: RecurringPayment | null;
  defaultAccountId?: string;
  defaultPaymentMethodId?: string;
  accounts: Account[];
  paymentMethods: PaymentMethod[];
  onSave: (input: RecurringPaymentInput) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export const RecurringPaymentModal = ({
  recurringPayment, defaultAccountId, defaultPaymentMethodId,
  accounts: allAccounts, paymentMethods: allPaymentMethods, onSave, onClose, onDelete,
}: RecurringPaymentModalProps) => {
  const categories = categoryService.getAll();
  const members = memberService.getAll();

  const isFromPM = !!defaultPaymentMethodId;
  const isFromAccount = !!defaultAccountId && !defaultPaymentMethodId;

  const accounts = isFromAccount
    ? allAccounts.filter((a) => a.id === defaultAccountId)
    : isFromPM ? [] : allAccounts;

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
      toast.error('名前、金額、カテゴリ、支払い元を入力してください');
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
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-60" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-md sm:rounded-xl rounded-t-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 p-3 sm:p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">{recurringPayment ? '定期取引を編集' : '定期取引を追加'}</h3>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 rounded-lg" aria-label="閉じる">
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>

          <div className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 家賃、携帯料金、Netflix"
              className="w-full dark:border-gray-600 dark:text-gray-100 rounded-lg px-3 py-2 text-sm sm:text-base transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary-600 focus:border-primary-600"
              required
            />
          </div>

          <div className="flex rounded-lg overflow-hidden dark:border-gray-600">
            <button
              type="button"
              onClick={() => { setType('expense'); setCategoryId(''); }}
              className={`flex-1 py-2 sm:py-2.5 font-medium text-sm transition-colors ${
                type === 'expense' ? 'text-white' : 'bg-gray-100 text-gray-900 dark:text-gray-200'
              }`}
              style={type === 'expense' ? { backgroundColor: 'var(--theme-primary)' } : {}}
            >
              支出
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); setCategoryId(''); setPmId(undefined); }}
              className={`flex-1 py-2 sm:py-2.5 font-medium text-sm transition-colors ${
                type === 'income' ? 'text-white' : 'bg-gray-100 text-gray-900 dark:text-gray-200'
              }`}
              style={type === 'income' ? { backgroundColor: 'var(--theme-primary)' } : {}}
            >
              収入
            </button>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">金額</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">¥</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full text-base sm:text-lg font-bold pl-8 pr-3 py-2 dark:border-gray-600 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">頻度</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFrequency('monthly')}
                className={`py-1.5 px-2 sm:py-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  frequency === 'monthly'
                    ? 'text-white border-transparent'
                    : 'bg-white text-gray-900 dark:text-gray-200 dark:border-gray-600 hover:border-gray-400'
                }`}
                style={frequency === 'monthly' ? { backgroundColor: 'var(--theme-primary)' } : {}}
              >
                毎月
              </button>
              <button
                type="button"
                onClick={() => setFrequency('yearly')}
                className={`py-1.5 px-2 sm:py-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  frequency === 'yearly'
                    ? 'text-white border-transparent'
                    : 'bg-white text-gray-900 dark:text-gray-200 dark:border-gray-600 hover:border-gray-400'
                }`}
                style={frequency === 'yearly' ? { backgroundColor: 'var(--theme-primary)' } : {}}
              >
                毎年
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            {frequency === 'yearly' && (
              <div className="mb-3">
                <label className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">月</label>
                <select
                  value={monthOfYear}
                  onChange={(e) => setMonthOfYear(e.target.value)}
                  className="border dark:border-gray-600 dark:bg-slate-600 dark:text-gray-100 rounded-lg px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{m}月</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">日</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(e.target.value)}
                  className="w-16 dark:border-gray-600 dark:bg-slate-600 dark:text-gray-100 rounded-lg px-2 py-1 text-xs sm:text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">日</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">カテゴリ</label>
            <div className="grid grid-cols-4 gap-2">
              {filteredCategories.map((category) => {
                const member = getMember(category.memberId);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setCategoryId(category.id)}
                    className={`flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-lg transition-colors ${
                      categoryId === category.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="w-6 sm:w-7 h-6 sm:h-7 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20`, color: category.color }}
                    >
                      {getCategoryIcon(category.icon, 14)}
                    </div>
                    <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-200 truncate w-full text-center leading-tight">{category.name}</span>
                    {member && member.id !== 'common' && (
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-none">{member.name}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
              {type === 'expense' ? '支払い元' : '入金先'}
            </label>
            <div className="space-y-3">
              {accounts.length > 0 && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">口座</p>
                  <div className="space-y-1">
                    {accounts.map((acct) => (
                      <button
                        key={acct.id}
                        type="button"
                        onClick={() => { setAccountId(acct.id); setPmId(undefined); }}
                        className={`w-full flex items-center justify-between p-2 sm:p-2.5 rounded-lg transition-colors ${
                          accountId === acct.id && pmId === undefined
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full" style={{ backgroundColor: acct.color }} />
                          <span className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm">{acct.name}</span>
                        </div>
                        {accountId === acct.id && pmId === undefined && <Check size={14} className="sm:w-4 sm:h-4 text-primary-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {type === 'expense' && accountId && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">支払い手段</p>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setPmId(undefined)}
                      className={`w-full flex items-center justify-between p-2 sm:p-2.5 rounded-lg transition-colors ${
                        pmId === undefined
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm">口座から引き落とし</span>
                      </div>
                      {pmId === undefined && <Check size={14} className="sm:w-4 sm:h-4 text-primary-600" />}
                    </button>
                    {allPaymentMethods.filter((pm) => pm.linkedAccountId === accountId).map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPmId(pm.id)}
                        className={`w-full flex items-center justify-between p-2 sm:p-2.5 rounded-lg transition-colors ${
                          pmId === pm.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full" style={{ backgroundColor: pm.color }} />
                          <span className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm">{pm.name}</span>
                        </div>
                        {pmId === pm.id && <Check size={14} className="sm:w-4 sm:h-4 text-primary-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">メモ</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="任意"
              className="w-full dark:border-gray-600 dark:text-gray-100 rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-200">有効</span>
            <button type="button" onClick={() => setIsActive(!isActive)}>
              {isActive
                ? <ToggleRight size={24} className="sm:w-7 sm:h-7 text-gray-600" />
                : <ToggleLeft size={24} className="sm:w-7 sm:h-7 text-gray-300 dark:text-gray-600" />
              }
            </button>
          </div>
          </div>
        </div>
        <div className="border-t dark:border-gray-700 p-3 sm:p-4 space-y-2">
          {recurringPayment && onDelete && (
            <button
              type="button"
              onClick={() => { onDelete(recurringPayment.id); onClose(); }}
              className="w-full py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors"
            >
              削除
            </button>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg dark:border-gray-600 bg-gray-100 text-gray-900 dark:text-gray-100 font-medium text-sm hover:bg-gray-200 dark:hover:bg-slate-600">
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!name || !amount || !categoryId || (!accountId && !pmId)}
              className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-white font-medium text-sm transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              保存
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
