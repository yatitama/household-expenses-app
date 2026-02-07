interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900 dark:to-brand-800 rounded-full flex items-center justify-center mb-4 shadow-md">
        {icon}
      </div>

      <h3 className="text-lg font-bold mb-2 bg-gradient-to-r from-brand-700 to-brand-900 bg-clip-text text-transparent dark:from-brand-100 dark:to-brand-300">{title}</h3>
      <p className="text-brand-600 dark:text-brand-400 text-center mb-6">{description}</p>

      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-lg font-medium shadow-brand hover:shadow-lg transition-all duration-300 hover:scale-105"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
