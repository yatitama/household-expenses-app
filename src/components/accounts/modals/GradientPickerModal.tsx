import { useState } from 'react';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';
import { X, Wallet } from 'lucide-react';

const GRADIENT_PRESETS: { from: string; to: string; label: string }[] = [
  // ライトグレー系
  { from: '#f9fafb', to: '#e5e7eb', label: 'ホワイト' },
  { from: '#f3f4f6', to: '#d1d5db', label: 'ライトグレー' },
  { from: '#e5e7eb', to: '#9ca3af', label: 'グレー' },
  { from: '#d1d5db', to: '#6b7280', label: 'ミディアムグレー' },
  { from: '#9ca3af', to: '#4b5563', label: 'ダークグレー' },
  { from: '#6b7280', to: '#374151', label: 'チャコール' },
  { from: '#4b5563', to: '#1f2937', label: 'ディープチャコール' },
  { from: '#374151', to: '#111827', label: 'ブラック' },
];

interface GradientPickerModalProps {
  currentFrom: string;
  currentTo: string;
  onSave: (from: string, to: string) => void;
  onClose: () => void;
}

export const GradientPickerModal = ({ currentFrom, currentTo, onSave, onClose }: GradientPickerModalProps) => {
  const [selectedFrom, setSelectedFrom] = useState(currentFrom);
  const [selectedTo, setSelectedTo] = useState(currentTo);
  useBodyScrollLock(true);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-60" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-xl p-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">総資産の背景色</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 rounded-lg" aria-label="閉じる">
            <X size={20} />
          </button>
        </div>

        <div
          className="rounded-xl p-4 text-white mb-4"
          style={{ background: `linear-gradient(to right, ${selectedFrom}, ${selectedTo})` }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={20} />
            <span className="text-sm opacity-90">総資産</span>
          </div>
          <p className="text-2xl font-bold">プレビュー</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {GRADIENT_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => { setSelectedFrom(preset.from); setSelectedTo(preset.to); }}
              className={`flex items-center gap-2 p-2.5 rounded-lg border-2 transition-colors ${
                selectedFrom === preset.from && selectedTo === preset.to
                  ? 'border-gray-900 dark:border-gray-100'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
              }`}
            >
              <div
                className="w-8 h-8 rounded-full flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${preset.from}, ${preset.to})` }}
              />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{preset.label}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 px-4 rounded-lg dark:border-gray-600 text-gray-900 dark:text-gray-200 font-medium">
            キャンセル
          </button>
          <button
            onClick={() => onSave(selectedFrom, selectedTo)}
            className="flex-1 py-2.5 px-4 rounded-lg bg-primary-700 text-white hover:bg-primary-800 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
