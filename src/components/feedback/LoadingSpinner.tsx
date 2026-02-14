interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div
      className={`${sizeClasses[size]} dark:border-gray-700 border-t-primary-600 dark:border-t-primary-500 rounded-full animate-spin ${className}`}
      role="status"
      aria-label="読み込み中"
    >
      <span className="sr-only">読み込み中</span>
    </div>
  );
};

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      role="status"
      aria-live="polite"
      aria-label={message || '読み込み中'}
    >
      <div className="bg-white rounded-xl p-8 flex flex-col items-center dark:border-gray-700">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="mt-4 text-gray-900 dark:text-gray-200 font-semibold text-center">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({ isLoading, children, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`px-4 py-2.5 bg-primary-700 text-white rounded-lg font-medium hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2 ${className}`}
      aria-busy={isLoading}
    >
      {isLoading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
};
