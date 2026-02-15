import { Plus, Edit2 } from 'lucide-react';
import type { QuickAddTemplate } from '../../types';

interface QuickAddTemplateGridSectionProps {
  templates: QuickAddTemplate[];
  onTemplateClick: (template: QuickAddTemplate) => void;
  onEditClick: (template: QuickAddTemplate) => void;
  onAddClick: () => void;
}

export const QuickAddTemplateGridSection = ({
  templates,
  onTemplateClick,
  onEditClick,
  onAddClick,
}: QuickAddTemplateGridSectionProps) => {
  if (templates.length === 0) {
    return null;
  }

  return (
    <div data-section-name="クイック追加">
      <div
        className="sticky bg-white dark:bg-slate-900 z-10 p-2 border-b dark:border-gray-700"
        style={{ top: 'max(0px, env(safe-area-inset-top))' }}
      >
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">クイック追加 ({templates.length}件)</h3>
      </div>
      <div className="pt-2 pb-3 md:pb-4">
        <div className="grid grid-cols-3 gap-2 md:gap-3 p-2">
          {templates.map((template) => (
            <div
              key={template.id}
              className="relative aspect-square"
            >
              <button
                onClick={() => onTemplateClick(template)}
                className="w-full h-full border border-gray-200 dark:border-gray-700 p-2 hover:opacity-80 transition-opacity flex items-center justify-center text-center rounded"
              >
                <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 break-words leading-tight">
                  {template.name}
                </p>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditClick(template);
                }}
                className="absolute bottom-1 right-1 p-1.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                aria-label="編集"
              >
                <Edit2 size={14} className="text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          ))}
          {/* Add button */}
          {templates.length < 9 && (
            <button
              onClick={onAddClick}
              className="aspect-square border border-gray-200 dark:border-gray-700 p-2 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded"
            >
              <Plus size={20} className="text-gray-400 dark:text-gray-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
