import { useState } from 'react';
import toast from 'react-hot-toast';
import { X, Trash2, Check, Wallet, CreditCard } from 'lucide-react';
import { getCategoryIcon } from '../../../utils/categoryIcons';
import { categoryService, paymentMethodService, accountService } from '../../../services/storage';
import type {
  RecurringPayment,
  RecurringPaymentInput,
  RecurringPeriodType,
  TransactionType,
} from '../../../types';

interface RecurringPaymentModalProps {
  recurringPayment: RecurringPayment | null;
  onSave: (input: RecurringPaymentInput) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export const RecurringPaymentModal = ({
  recurringPayment, onSave, onClose, onDelete,
}: RecurringPaymentModalProps) => {
  const today = new Date().toISOString().split('T')[0];

  const allCategories = categoryService.getAll();
  const allAccounts = accountService.getAll();
  const allPaymentMethods = paymentMethodService.getAll();

  const [name, setName] = useState(recurringPayment?.name || '');
  const [amount, setAmount] = useState(recurringPayment?.amount.toString() || '');
  const [type, setType] = useState<TransactionType>(recurringPayment?.type || 'expense');
  const [periodType, setPeriodType] = useState<RecurringPeriodType>(recurringPayment?.periodType || 'months');
  const [periodValue, setPeriodValue] = useState(recurringPayment?.periodValue.toString() || '1');
  const [startDate, setStartDate] = useState(recurringPayment?.startDate || '');
  const [endDate, setEndDate] = useState(recurringPayment?.endDate || '');
  const [categoryId, setCategoryId] = useState(recurringPayment?.categoryId || '');
  const [selectedSourceId, setSelectedSourceId] = useState<string>(() => {
    if (recurringPayment?.paymentMethodId) return recurringPayment.paymentMethodId;
    if (recurringPayment?.accountId) return recurringPayment.accountId;
    return '';
  });

  const filteredCategories = allCategories.filter((c) => c.type === type);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const validCategory = allCategories.find((c) => c.id === categoryId && c.type === newType);
    if (!validCategory) setCategoryId('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !periodValue) {
      toast.error('名前、金額、周期を入力してください');
      return;
    }
    if (!categoryId) {
      toast.error('カテゴリを選択してください');
      return;
    }
    if (!selectedSourceId) {
      toast.error(type === 'expense' ? '支払い元を選択してください' : '入金先を選択してください');
      return;
    }
    const parsedPeriodValue = parseInt(periodValue, 10);
    if (!parsedPeriodValue || parsedPeriodValue < 1) {
      toast.error('周期は1以上の整数を入力してください');
      return;
    }

    const selectedAccount = allAccounts.find((a) => a.id === selectedSourceId);
    const selectedPaymentMethod = allPaymentMethods.find((pm) => pm.id === selectedSourceId);
    const resolvedAccountId = selectedAccount?.id
      ?? (selectedPaymentMethod?.linkedAccountId || undefined);

    onSave({
      name,
      amount: parseInt(amount, 10),
      type,
      periodType,
      periodValue: parsedPeriodValue,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      isActive: recurringPayment?.isActive ?? true,
      categoryId: categoryId || undefined,
      accountId: resolvedAccountId,
      paymentMethodId: selectedPaymentMethod?.id,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-60" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 w-full max-w-md sm:rounded-xl rounded-t-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 sm:p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
              {recurringPayment ? '定期取引を編集' : '定期取引を追加'}
            </h3>
            {recurringPayment && onDelete && (
              <button
                type="button"
                onClick={() => { onDelete(recurringPayment.id); onClose(); }}
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

        <div className="overflow-y-auto flex-1 min-h-0 p-3 sm:p-4">
          <div className="space-y-4 sm:space-y-5">
            {/* 収入/支出切り替え */}
            <div className="flex rounded-lg overflow-hidden dark:border-gray-600">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex-1 py-2 sm:py-2.5 font-medium text-sm transition-colors ${
                  type === 'expense' ? 'btn-primary text-white' : 'bg-gray-100 text-gray-900 dark:text-gray-200'
                }`}
              >
                支出
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex-1 py-2 sm:py-2.5 font-medium text-sm transition-colors ${
                  type === 'income' ? 'btn-primary text-white' : 'bg-gray-100 text-gray-900 dark:text-gray-200'
                }`}
              >
                収入
              </button>
            </div>

            {/* 名前 */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">名前</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 家賃、携帯料金、Netflix"
                className="w-full bg-gray-50 dark:bg-slate-700 dark:border-gray-600 dark:text-gray-100 rounded-lg px-3 py-2 text-sm sm:text-base transition-all focus:outline-none focus:ring-2 focus:ring-primary-600"
                required
              />
            </div>

            {/* 金額 */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">金額</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">¥</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full text-lg sm:text-xl font-bold pl-8 pr-3 py-2 bg-gray-50 dark:bg-slate-700 dark:border-gray-600 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  required
                />
              </div>
            </div>

            {/* カテゴリ（4列グリッド） */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
                カテゴリ
              </label>
              <div className="grid grid-cols-4 gap-2">
                {filteredCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setCategoryId(categoryId === category.id ? '' : category.id)}
                    className={`relative flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-lg transition-colors ${
                      categoryId === category.id
                        ? 'bg-gray-100 dark:bg-gray-700'
                        : ''
                    }`}
                  >
                    <div
                      className="w-6 sm:w-7 h-6 sm:h-7 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20`, color: category.color }}
                    >
                      {getCategoryIcon(category.icon, 14)}
                    </div>
                    <span className="text-[10px] sm:text-xs text-gray-900 dark:text-gray-200 break-words w-full text-center leading-tight">
                      {category.name}
                    </span>
                    {categoryId === category.id && (
                      <div className="absolute -top-1 -right-1">
                        <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 支払い元（口座＋カード、4列グリッド） */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
                {type === 'expense' ? '支払い元' : '入金先'}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {allAccounts.map((acct) => (
                  <button
                    key={acct.id}
                    type="button"
                    onClick={() => setSelectedSourceId(selectedSourceId === acct.id ? '' : acct.id)}
                    className={`relative flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-lg transition-colors ${
                      selectedSourceId === acct.id
                        ? 'bg-gray-100 dark:bg-gray-700'
                        : ''
                    }`}
                  >
                    <div
                      className="w-6 sm:w-7 h-6 sm:h-7 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${acct.color || '#9ca3af'}20`, color: acct.color || '#9ca3af' }}
                    >
                      <Wallet size={14} />
                    </div>
                    <span className="text-[10px] sm:text-xs text-gray-900 dark:text-gray-200 break-words w-full text-center leading-tight">
                      {acct.name}
                    </span>
                    {selectedSourceId === acct.id && (
                      <div className="absolute -top-1 -right-1">
                        <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                      </div>
                    )}
                  </button>
                ))}
                {allPaymentMethods.map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setSelectedSourceId(selectedSourceId === pm.id ? '' : pm.id)}
                    className={`relative flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-lg transition-colors ${
                      selectedSourceId === pm.id
                        ? 'bg-gray-100 dark:bg-gray-700'
                        : ''
                    }`}
                  >
                    <div
                      className="w-6 sm:w-7 h-6 sm:h-7 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${pm.color || '#9ca3af'}20`, color: pm.color || '#9ca3af' }}
                    >
                      <CreditCard size={14} />
                    </div>
                    <span className="text-[10px] sm:text-xs text-gray-900 dark:text-gray-200 break-words w-full text-center leading-tight">
                      {pm.name}
                    </span>
                    {selectedSourceId === pm.id && (
                      <div className="absolute -top-1 -right-1">
                        <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 周期 */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">周期</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  value={periodValue}
                  onChange={(e) => setPeriodValue(e.target.value)}
                  className="w-20 bg-gray-50 dark:bg-slate-700 dark:border-gray-600 dark:text-gray-100 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-600"
                  required
                />
                <div className="flex rounded-lg overflow-hidden flex-1">
                  <button
                    type="button"
                    onClick={() => setPeriodType('months')}
                    className={`flex-1 py-2 sm:py-2.5 font-medium text-sm transition-colors ${
                      periodType === 'months' ? 'text-white' : 'bg-gray-100 text-gray-900 dark:text-gray-200'
                    }`}
                    style={periodType === 'months' ? { backgroundColor: 'var(--theme-primary)' } : {}}
                  >
                    ヶ月に一回
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriodType('days')}
                    className={`flex-1 py-2 sm:py-2.5 font-medium text-sm transition-colors ${
                      periodType === 'days' ? 'text-white' : 'bg-gray-100 text-gray-900 dark:text-gray-200'
                    }`}
                    style={periodType === 'days' ? { backgroundColor: 'var(--theme-primary)' } : {}}
                  >
                    日に一回
                  </button>
                </div>
              </div>
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                {periodType === 'months'
                  ? `${periodValue || '?'}ヶ月ごとに発生`
                  : `${periodValue || '?'}日ごとに発生`
                }
              </p>
            </div>

            {/* 開始日・終了日 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
                  開始日
                  <span className="text-gray-400 font-normal ml-1">(未指定=今日)</span>
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 min-w-0 bg-gray-50 dark:bg-slate-700 dark:border-gray-600 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                  {startDate && (
                    <button
                      type="button"
                      onClick={() => setStartDate('')}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                      aria-label="開始日をクリア"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
                  終了日
                  <span className="text-gray-400 font-normal ml-1">(未指定=無期限)</span>
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || today}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 min-w-0 bg-gray-50 dark:bg-slate-700 dark:border-gray-600 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                  {endDate && (
                    <button
                      type="button"
                      onClick={() => setEndDate('')}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                      aria-label="終了日をクリア"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t dark:border-gray-700 p-3 sm:p-4">
          <button
            type="submit"
            disabled={!name || !amount || !periodValue || !categoryId || !selectedSourceId}
            className="w-full py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg btn-primary text-white font-medium text-sm disabled:opacity-50 transition-colors"
          >
            保存
          </button>
        </div>
      </form>
    </div>
  );
};
