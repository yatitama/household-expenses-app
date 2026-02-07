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
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center`}
      style={{ zIndex }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`premium-card w-full ${sizeClass} sm:rounded-xl rounded-t-xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 md:p-5 border-b border-brand-100 dark:border-brand-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
          <h2 id="modal-title" className="text-lg font-bold bg-gradient-to-r from-brand-700 to-accent-700 bg-clip-text text-transparent dark:from-brand-300 dark:to-accent-300">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-brand-500 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
            aria-label="閉じる"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 md:p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
