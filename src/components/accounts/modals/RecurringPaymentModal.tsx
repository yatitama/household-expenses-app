import { useState } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
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

  const [name, setName] = useState(recurringPayment?.name || '');
  const [amount, setAmount] = useState(recurringPayment?.amount.toString() || '');
  const [type, setType] = useState<TransactionType>(recurringPayment?.type || 'expense');
  const [periodType, setPeriodType] = useState<RecurringPeriodType>(recurringPayment?.periodType || 'months');
  const [periodValue, setPeriodValue] = useState(recurringPayment?.periodValue.toString() || '1');
  const [startDate, setStartDate] = useState(recurringPayment?.startDate || '');
  const [endDate, setEndDate] = useState(recurringPayment?.endDate || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !periodValue) {
      toast.error('名前、金額、周期を入力してください');
      return;
    }
    const parsedPeriodValue = parseInt(periodValue, 10);
    if (!parsedPeriodValue || parsedPeriodValue < 1) {
      toast.error('周期は1以上の整数を入力してください');
      return;
    }
    onSave({
      name,
      amount: parseInt(amount, 10),
      type,
      periodType,
      periodValue: parsedPeriodValue,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      isActive: recurringPayment?.isActive ?? true,
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
                onClick={() => setType('expense')}
                className={`flex-1 py-2 sm:py-2.5 font-medium text-sm transition-colors ${
                  type === 'expense' ? 'text-white' : 'bg-gray-100 text-gray-900 dark:text-gray-200'
                }`}
                style={type === 'expense' ? { backgroundColor: 'var(--theme-primary)' } : {}}
              >
                支出
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
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
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">周期</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  value={periodValue}
                  onChange={(e) => setPeriodValue(e.target.value)}
                  className="w-20 dark:border-gray-600 dark:bg-slate-600 dark:text-gray-100 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-600"
                  required
                />
                <div className="flex rounded-lg overflow-hidden dark:border-gray-600 flex-1">
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
                    className="flex-1 min-w-0 dark:border-gray-600 dark:bg-slate-600 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
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
                    className="flex-1 min-w-0 dark:border-gray-600 dark:bg-slate-600 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
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
              disabled={!name || !amount || !periodValue}
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
