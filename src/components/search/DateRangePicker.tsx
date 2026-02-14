import { X } from 'lucide-react';

interface DateRangePickerProps {
  start: string;
  end: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}

export const DateRangePicker = ({ start, end, onStartChange, onEndChange }: DateRangePickerProps) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">開始日</label>
        <div className="relative">
          <input
            type="date"
            value={start}
            onChange={(e) => onStartChange(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600"
            aria-label="開始日"
          />
          {start && (
            <button
              type="button"
              onClick={() => onStartChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors text-gray-500 dark:text-gray-400"
              aria-label="開始日をクリア"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">終了日</label>
        <div className="relative">
          <input
            type="date"
            value={end}
            onChange={(e) => onEndChange(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600"
            aria-label="終了日"
          />
          {end && (
            <button
              type="button"
              onClick={() => onEndChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors text-gray-500 dark:text-gray-400"
              aria-label="終了日をクリア"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
