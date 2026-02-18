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
  return (
    <div data-section-name="クイック追加">
      <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">クイック入力</label>
      <div className="grid grid-cols-2 gap-2">
          {templates.slice(0, 4).map((template) => (
            <div
              key={template.id}
              className="relative h-9"
            >
              <button
                type="button"
                onClick={() => onTemplateClick(template)}
                className="w-full h-full border border-gray-200 dark:border-gray-700 px-2 hover:opacity-80 transition-opacity flex items-center justify-center text-center rounded"
              >
                <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 break-words leading-tight">
                  {template.name}
                </p>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditClick(template);
                }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors z-10"
                aria-label="編集"
              >
                <Edit2 size={10} className="text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          ))}
          {/* Add button */}
          {templates.length < 4 && (
            <button
              type="button"
              onClick={onAddClick}
              className="h-9 w-full border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded"
            >
              <Plus size={20} className="text-gray-400 dark:text-gray-500" />
            </button>
          )}
        </div>
    </div>
  );
};
