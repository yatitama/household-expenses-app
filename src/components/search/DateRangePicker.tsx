import { DayPicker } from 'react-day-picker';
import { X } from 'lucide-react';
import { parse, format } from 'date-fns';
import 'react-day-picker/dist/style.css';

interface DateRangePickerProps {
  start: string;
  end: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}

export const DateRangePicker = ({ start, end, onStartChange, onEndChange }: DateRangePickerProps) => {
  const startDate = start ? parse(start, 'yyyy-MM-dd', new Date()) : undefined;
  const endDate = end ? parse(end, 'yyyy-MM-dd', new Date()) : undefined;

  const handleClear = () => {
    onStartChange('');
    onEndChange('');
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            開始日
          </label>
          <div className="relative">
            <input
              type="date"
              value={start}
              onChange={(e) => onStartChange(e.target.value)}
              className="w-full rounded-lg px-2 py-2 text-xs border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600 appearance-none"
              aria-label="開始日"
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            終了日
          </label>
          <div className="relative">
            <input
              type="date"
              value={end}
              onChange={(e) => onEndChange(e.target.value)}
              className="w-full rounded-lg px-2 py-2 text-xs border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600 appearance-none"
              aria-label="終了日"
            />
          </div>
        </div>
      </div>

      {/* Calendar Picker */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-slate-800 overflow-x-auto">
        <DayPicker
          mode="range"
          selected={{ from: startDate, to: endDate }}
          onSelect={(range) => {
            onStartChange(range?.from ? format(range.from, 'yyyy-MM-dd') : '');
            onEndChange(range?.to ? format(range.to, 'yyyy-MM-dd') : '');
          }}
          month={startDate || new Date()}
          showOutsideDays={false}
          className="[&_.rdp]:!p-0 [&_.rdp-caption]:!font-semibold [&_.rdp-cell]:!w-8 [&_.rdp-day]:!w-8 [&_.rdp-day]:!h-8 [&_.rdp-day_selected]:!bg-primary-600 [&_.rdp-day_selected]:!text-white [&_.rdp-day_range_middle]:!bg-primary-100 dark:[&_.rdp-day_range_middle]:!bg-primary-900/30"
        />
      </div>

      {/* Clear Button */}
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
