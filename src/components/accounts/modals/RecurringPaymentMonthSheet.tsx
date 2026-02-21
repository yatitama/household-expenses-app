import { useState, useEffect } from 'react';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';
import { X, RotateCcw, TrendingUp, TrendingDown } from 'lucide-react';
import type { RecurringPayment } from '../../../types';

interface RecurringPaymentMonthSheetProps {
  payment: RecurringPayment;
  month: string; // yyyy-MM
  onSave: (overrideAmount: number | null) => void;
  onClose: () => void;
}

const formatMonthLabel = (month: string): string => {
  const [y, m] = month.split('-').map(Number);
  return `${y}年${m}月`;
};

export const RecurringPaymentMonthSheet = ({
  payment,
  month,
  onSave,
  onClose,
}: RecurringPaymentMonthSheetProps) => {
  const standardAmount = payment.amount;
  const overrides = payment.monthlyOverrides ?? {};
  const effectiveAmount = overrides[month] ?? standardAmount;
  const hasOverride = month in overrides;

  const [amountStr, setAmountStr] = useState(String(effectiveAmount));
  useBodyScrollLock(true);

  useEffect(() => {
    setAmountStr(String(effectiveAmount));
  }, [effectiveAmount, month]);

  const handleSave = () => {
    const parsed = parseInt(amountStr.replace(/,/g, ''), 10);
    const amount = isNaN(parsed) || parsed < 0 ? standardAmount : parsed;
    // 標準金額と同じなら上書きなし (null)
    const overrideAmount = amount === standardAmount ? null : amount;
    onSave(overrideAmount);
  };

  const Icon = payment.type === 'income' ? TrendingUp : TrendingDown;
  const iconColor = payment.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';

  return (
    <div
      className="fixed inset-0 bg-black/50 z-60 flex items-end"
      onClick={onClose}
    >
      <div
        className="w-full bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Icon size={16} className={iconColor} />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{payment.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{formatMonthLabel(month)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-4 space-y-5 overflow-y-auto flex-1">
          {/* 金額 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              この月の金額
              <span className="ml-2 text-gray-400 dark:text-gray-500 font-normal">
                (通常: ¥{standardAmount.toLocaleString()})
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">¥</span>
              <input
                type="number"
                min="0"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-right text-base font-bold text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>
            {hasOverride && (
              <button
                type="button"
                onClick={() => onSave(null)}
                className="mt-1.5 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <RotateCcw size={11} />
                標準金額に戻す
              </button>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="p-4 border-t dark:border-gray-700 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 bg-black dark:bg-white rounded-lg text-sm font-medium text-white dark:text-black"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
