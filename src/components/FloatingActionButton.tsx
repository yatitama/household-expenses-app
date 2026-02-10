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
    <>
      {/* 背景を暗くするオーバーレイ */}
      {isOpen && (
        <button
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 z-50 animate-in fade-in duration-200"
          aria-label="メニューを閉じる"
        />
      )}

      <div
        ref={menuRef}
        className="fixed z-50 flex flex-col items-end gap-3"
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
              className="px-4 py-2 sm:py-2.5 rounded-lg font-medium text-sm bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors shadow-sm whitespace-nowrap"
              title="取引を追加"
            >
              取引追加
            </button>
            <button
              onClick={handleAddRecurring}
              className="px-4 py-2 sm:py-2.5 rounded-lg font-medium text-sm bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors shadow-sm whitespace-nowrap"
              title="定期取引を追加"
            >
              定期取引追加
            </button>
          </div>
        )}

        {/* FABボタン */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center w-14 h-14 rounded-full text-white shadow-lg hover:shadow-xl transition-all duration-200"
          style={{
            backgroundColor: 'rgb(37, 99, 235)',
          }}
          title={isOpen ? "メニューを閉じる" : "メニューを開く"}
          aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>
    </>
  );
};
