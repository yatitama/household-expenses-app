interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconColor?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  iconColor = 'text-gray-400',
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
        <div className={iconColor}>
          {icon}
        </div>
      </div>

      <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-center mb-6">{description}</p>

      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 bg-primary-600 dark:bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 dark:hover:bg-primary-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:focus-visible:outline-primary-400"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
