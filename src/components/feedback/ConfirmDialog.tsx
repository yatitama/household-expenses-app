interface ConfirmDialogProps {
 isOpen: boolean;
 onClose: () => void;
 onConfirm: () => void;
 title: string;
 message: string;
 confirmText?: string;
 confirmVariant?: 'danger' | 'primary';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
 isOpen,
 onClose,
 onConfirm,
 title,
 message,
 confirmText = '実行',
 confirmVariant = 'primary',
}) => {
 if (!isOpen) return null;

 return (
 <div
 className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
 role="dialog"
 aria-modal="true"
 aria-labelledby="confirm-dialog-title"
 aria-describedby="confirm-dialog-message"
 >
 <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 max-w-sm w-full mx-4">
 <h3 id="confirm-dialog-title" className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
 {title}
 </h3>
 <p id="confirm-dialog-message" className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
 {message}
 </p>

 <div className="flex gap-3">
 <button
 onClick={onClose}
 className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-slate-700 rounded-lg font-medium text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
 >
 キャンセル
 </button>
 <button
 onClick={() => {
 onConfirm();
 onClose();
 }}
 className={`flex-1 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm text-white ${
 confirmVariant === 'danger'
 ? 'bg-gray-900 hover:bg-gray-800'
 : 'bg-gray-700 hover:bg-gray-800'
 }`}
 >
 {confirmText}
 </button>
 </div>
 </div>
 </div>
 );
};
