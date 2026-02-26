import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { X } from 'lucide-react';
import { parse, format, isAfter, isBefore } from 'date-fns';
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
  const [month, setMonth] = useState(startDate || endDate || new Date());

  const handleClear = () => {
    onStartChange('');
    onEndChange('');
  };

  const handleSelectRange = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) return;

    const { from, to } = range;

    if (!from) {
      // 無効な選択
      return;
    }

    if (!to) {
      // 開始日のみが選択された場合
      onStartChange(format(from, 'yyyy-MM-dd'));
      onEndChange('');
      return;
    }

    // 両日が選択された場合（順序を正規化）
    if (isAfter(from, to)) {
      // fromのほうが後ろなので、入れ替える
      onStartChange(format(to, 'yyyy-MM-dd'));
      onEndChange(format(from, 'yyyy-MM-dd'));
    } else {
      // 正常な順序
      onStartChange(format(from, 'yyyy-MM-dd'));
      onEndChange(format(to, 'yyyy-MM-dd'));
    }
  };

  return (
    <div className="space-y-2">
      {/* Selection Status Text */}
      {(start || end) && (
        <div className="text-xs text-gray-600 dark:text-gray-400 px-3 text-center">
          {start && !end ? (
            <span>終了日を選択してください</span>
          ) : start && end ? (
            <span>
              {format(parse(start, 'yyyy-MM-dd', new Date()), 'yyyy年M月d日')}
              {' ～ '}
              {format(parse(end, 'yyyy-MM-dd', new Date()), 'yyyy年M月d日')}
            </span>
          ) : null}
        </div>
      )}

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
            selected={
              startDate && endDate
                ? { from: startDate, to: endDate }
                : startDate
                  ? { from: startDate, to: startDate }
                  : undefined
            }
            onSelect={handleSelectRange}
            month={month}
            onMonthChange={setMonth}
            showOutsideDays={false}
            disabled={(date) => {
              // 開始日が設定されており、終了日がまだ選択されていない場合、
              // 開始日より前の日付を無効化
              if (startDate && !endDate && isBefore(date, startDate)) {
                return true;
              }
              return false;
            }}
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
