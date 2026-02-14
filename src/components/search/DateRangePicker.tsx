interface DateRangePickerProps {
  start: string;
  end: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}

export const DateRangePicker = ({ start, end, onStartChange, onEndChange }: DateRangePickerProps) => {
  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={start}
          onChange={(e) => onStartChange(e.target.value)}
          className="flex-1 rounded-lg px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600"
          aria-label="開始日"
        />
        <span className="text-gray-400 text-sm">~</span>
        <input
          type="date"
          value={end}
          onChange={(e) => onEndChange(e.target.value)}
          className="flex-1 rounded-lg px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600"
          aria-label="終了日"
        />
      </div>
    </div>
  );
};
