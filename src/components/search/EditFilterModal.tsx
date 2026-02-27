import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { SavedFilter } from '../../types';

interface EditFilterModalProps {
  filter?: SavedFilter | null;
  isOpen: boolean;
  onSave: (filterId: string, name: string) => void;
  onDelete: (filterId: string) => void;
  onClose: () => void;
}

export const EditFilterModal = ({
  filter,
  isOpen,
  onSave,
  onDelete,
  onClose,
}: EditFilterModalProps) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen && filter) {
      setName(filter.name);
    }
  }, [isOpen, filter]);

  if (!isOpen || !filter) return null;

  const handleSave = () => {
    if (name.trim()) {
      onSave(filter.id, name.trim());
      setName('');
    }
  };

  const handleDelete = () => {
    if (confirm('このフィルターを削除してもよろしいですか？')) {
      onDelete(filter.id);
      onClose();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[1001]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[1002] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              フィルターを編集
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              フィルター名
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-600"
              autoFocus
            />
          </div>

          {/* Footer */}
          <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleDelete}
              className="flex-1 py-2 rounded-lg bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 font-medium transition-all text-sm"
            >
              削除
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-100 font-medium transition-all text-sm"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex-1 py-2 rounded-lg text-white font-medium transition-all text-sm disabled:opacity-50"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
