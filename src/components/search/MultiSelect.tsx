interface MultiSelectOption {
  id: string;
  name: string;
  color?: string;
}

interface MultiSelectProps {
  label: string;
  options: MultiSelectOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export const MultiSelect = ({ label, options, selectedIds, onChange }: MultiSelectProps) => {
  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-brand-600 dark:text-brand-400 mb-1">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleToggle(option.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-300 ${
                isSelected
                  ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white border-brand-600 shadow-brand'
                  : 'bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-700 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20'
              }`}
              aria-pressed={isSelected}
            >
              {option.color && (
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: isSelected ? '#fff' : option.color }}
                />
              )}
              {option.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};
