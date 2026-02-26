import { useState } from 'react';
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
  const [month, setMonth] = useState(startDate || new Date());

  const handleClear = () => {
    onStartChange('');
    onEndChange('');
  };

  return (
    <div className="space-y-2">
      {/* Calendar Picker */}
      <div className="flex justify-center">
        <div
          className="border border-gray-200 dark:border-gray-700 rounded-lg p-1 bg-gray-50 dark:bg-slate-800"
          style={{
            '--rdp-cell-size': '28px',
            '--rdp-caption-font-size': '12px',
            '--rdp-months-spacing': '0',
          } as React.CSSProperties}
        >
          <DayPicker
            mode="range"
            selected={{ from: startDate, to: endDate }}
            onSelect={(range) => {
              onStartChange(range?.from ? format(range.from, 'yyyy-MM-dd') : '');
              onEndChange(range?.to ? format(range.to, 'yyyy-MM-dd') : '');
            }}
            month={month}
            onMonthChange={setMonth}
            showOutsideDays={false}
            className="text-xs [&_.rdp]:!p-0 [&_.rdp_caption]:!justify-center [&_.rdp_caption_label]:!font-medium [&_.rdp_head_cell]:!h-6 [&_.rdp_cell]:!p-0 [&_.rdp_day]:!p-0 [&_.rdp_day]:!h-7 [&_.rdp_day]:!w-7 [&_.rdp_day_selected]:!bg-primary-600 [&_.rdp_day_selected]:!text-white [&_.rdp_day_range_middle]:!bg-primary-100 dark:[&_.rdp_day_range_middle]:!bg-primary-900/30 [&_.rdp_button_reset]:!font-normal"
          />
        </div>
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
