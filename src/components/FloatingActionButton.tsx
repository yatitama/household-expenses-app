import { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';

interface FloatingActionButtonProps {
  onAddTransaction: () => void;
  onAddRecurring: () => void;
}

export const FloatingActionButton = ({
  onAddTransaction,
  onAddRecurring,
}: FloatingActionButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleAddTransaction = () => {
    onAddTransaction();
    setIsOpen(false);
  };

  const handleAddRecurring = () => {
    onAddRecurring();
    setIsOpen(false);
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-40 flex flex-col items-end gap-3"
      style={{
        bottom: 'calc(1.5rem + 64px)',
        right: '1.5rem',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* メニュー項目 */}
      {isOpen && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 flex flex-col gap-2">
          <button
            onClick={handleAddTransaction}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-gray-50"
            title="取引を追加"
          >
            <span>取引追加</span>
          </button>
          <button
            onClick={handleAddRecurring}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-gray-50"
            title="定期取引を追加"
          >
            <span>定期取引追加</span>
          </button>
        </div>
      )}

      {/* FABボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-14 h-14 rounded-full bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:focus-visible:outline-primary-500"
        title={isOpen ? "メニューを閉じる" : "メニューを開く"}
        aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  );
};
