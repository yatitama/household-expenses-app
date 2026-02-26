import { X } from 'lucide-react';

interface DateRangePickerProps {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
}

export const DateRangePicker = ({ start, end, onChange }: DateRangePickerProps) => {
  const handleStartChange = (value: string) => {
    // 開始日が終了日より後ならば終了日をクリア
    if (value && end && value > end) {
      onChange(value, '');
    } else {
      onChange(value, end);
    }
  };

  const handleEndChange = (value: string) => {
    // 終了日が開始日より前ならば開始日をクリア
    if (value && start && value < start) {
      onChange('', value);
    } else {
      onChange(start, value);
    }
  };

  const handleClear = () => {
    onChange('', '');
  };

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">いつから</label>
          <input
            type="date"
            value={start}
            max={end || undefined}
            onChange={(e) => handleStartChange(e.target.value)}
            className="w-full px-2 py-2.5 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-600 focus:outline-none appearance-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">いつまで</label>
          <input
            type="date"
            value={end}
            min={start || undefined}
            onChange={(e) => handleEndChange(e.target.value)}
            className="w-full px-2 py-2.5 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-600 focus:outline-none appearance-none"
          />
        </div>
      </div>
      {(start || end) && (
        <button
          type="button"
          onClick={handleClear}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <X size={14} />
          クリア
        </button>
      )}
    </div>
  );
};
