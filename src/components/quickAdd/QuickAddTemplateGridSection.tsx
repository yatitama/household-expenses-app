import { Plus } from 'lucide-react';
import type { QuickAddTemplate, Category, Account, PaymentMethod } from '../../types';

interface QuickAddTemplateGridSectionProps {
  templates: QuickAddTemplate[];
  categories: Category[];
  accounts: Account[];
  paymentMethods: PaymentMethod[];
  onTemplateClick: (template: QuickAddTemplate) => void;
  onAddClick: () => void;
}

export const QuickAddTemplateGridSection = ({
  templates,
  accounts,
  paymentMethods,
  onTemplateClick,
  onAddClick,
}: QuickAddTemplateGridSectionProps) => {
  const getAccountName = (accountId?: string): string => {
    if (!accountId) return '';
    return accounts.find((a) => a.id === accountId)?.name || '';
  };

  const getPaymentMethodName = (paymentMethodId?: string): string => {
    if (!paymentMethodId) return '';
    return paymentMethods.find((pm) => pm.id === paymentMethodId)?.name || '';
  };

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
        <div className="grid grid-cols-4 gap-2 md:gap-3 p-2">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => onTemplateClick(template)}
              className="aspect-square border border-gray-200 dark:border-gray-700 p-2 hover:opacity-80 transition-opacity flex flex-col justify-between text-left rounded"
            >
              <div className="min-w-0">
                <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {template.name}
                </p>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                {template.accountId && (
                  <p className="truncate">{getAccountName(template.accountId)}</p>
                )}
                {template.paymentMethodId && (
                  <p className="truncate">{getPaymentMethodName(template.paymentMethodId)}</p>
                )}
              </div>
            </button>
          ))}
          {/* Add button */}
          {templates.length < 16 && (
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
