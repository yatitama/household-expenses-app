import { X } from 'lucide-react';
import { useFocusTrap } from '../../../hooks/useFocusTrap';

interface ModalWrapperProps {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  zIndex?: number;
}

export const ModalWrapper = ({ onClose, title, children, size = 'md', zIndex = 50 }: ModalWrapperProps) => {
  const sizeClass = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md md:max-w-lg',
    lg: 'sm:max-w-2xl md:max-w-4xl',
  }[size];

  const modalRef = useFocusTrap(true);

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center animate-fade-in`}
      style={{ zIndex }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`w-full ${sizeClass} sm:rounded-xl rounded-t-xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up sm:animate-none`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 sm:p-4 dark:border-gray-700 flex items-center justify-between sticky top-0">
          <h2 id="modal-title" className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 rounded-lg"
            aria-label="閉じる"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
        <div className="p-3 sm:p-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
