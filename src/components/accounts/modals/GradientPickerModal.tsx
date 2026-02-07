import { useState } from 'react';
import { X, Wallet } from 'lucide-react';

const GRADIENT_PRESETS: { from: string; to: string; label: string }[] = [
  { from: '#3b82f6', to: '#2563eb', label: 'ブルー' },
  { from: '#6366f1', to: '#4f46e5', label: 'インディゴ' },
  { from: '#8b5cf6', to: '#7c3aed', label: 'パープル' },
  { from: '#ec4899', to: '#db2777', label: 'ピンク' },
  { from: '#14b8a6', to: '#0d9488', label: 'ティール' },
  { from: '#22c55e', to: '#16a34a', label: 'グリーン' },
  { from: '#f97316', to: '#ea580c', label: 'オレンジ' },
  { from: '#ef4444', to: '#dc2626', label: 'レッド' },
  { from: '#64748b', to: '#475569', label: 'スレート' },
  { from: '#1e293b', to: '#0f172a', label: 'ダーク' },
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 w-full sm:max-w-md sm:rounded-xl rounded-t-xl p-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">総資産の背景色</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
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
                  ? 'border-blue-500'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
              }`}
            >
              <div
                className="w-8 h-8 rounded-full flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${preset.from}, ${preset.to})` }}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{preset.label}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium">
            キャンセル
          </button>
          <button
            onClick={() => onSave(selectedFrom, selectedTo)}
            className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 text-white font-medium"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
