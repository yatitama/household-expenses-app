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
      className={`${sizeClasses[size]} border-gray-200 border-t-blue-600 rounded-full animate-spin ${className}`}
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
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" role="status" aria-label={message || '読み込み中'}>
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 flex flex-col items-center">
        <LoadingSpinner size="lg" />
        {message && <p className="mt-4 text-gray-700 dark:text-gray-300 font-medium">{message}</p>}
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
      className={`px-4 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2 ${className}`}
      aria-busy={isLoading}
    >
      {isLoading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
};
