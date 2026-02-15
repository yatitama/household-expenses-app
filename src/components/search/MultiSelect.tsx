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
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleToggle(option.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isSelected
                  ? 'text-white'
                  : 'bg-white text-gray-700 hover:border-gray-300'
              }`}
              style={isSelected ? {
                backgroundColor: 'var(--theme-primary)',
                borderColor: 'var(--theme-primary-dark)',
              } : undefined}
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
