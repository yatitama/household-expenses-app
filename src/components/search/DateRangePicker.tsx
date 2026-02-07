interface DateRangePickerProps {
  start: string;
  end: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}

export const DateRangePicker = ({ start, end, onStartChange, onEndChange }: DateRangePickerProps) => {
  return (
    <div>
      <label className="block text-xs font-medium text-brand-600 dark:text-brand-400 mb-1">期間</label>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={start}
          onChange={(e) => onStartChange(e.target.value)}
          className="flex-1 border border-brand-200 dark:border-brand-700 rounded-lg px-3 py-2 text-sm text-brand-900 dark:text-brand-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all duration-300"
          aria-label="開始日"
        />
        <span className="text-brand-400 dark:text-brand-500 text-sm">~</span>
        <input
          type="date"
          value={end}
          onChange={(e) => onEndChange(e.target.value)}
          className="flex-1 border border-brand-200 dark:border-brand-700 rounded-lg px-3 py-2 text-sm text-brand-900 dark:text-brand-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all duration-300"
          aria-label="終了日"
        />
      </div>
    </div>
  );
};
