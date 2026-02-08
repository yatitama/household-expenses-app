import { useState } from 'react';
import { X, Wallet } from 'lucide-react';

const GRADIENT_PRESETS: { from: string; to: string; label: string }[] = [
  // 暖色系
  { from: '#fee2e2', to: '#fca5a5', label: 'ライトレッド' },
  { from: '#f87171', to: '#ef4444', label: 'レッド' },
  { from: '#ef4444', to: '#dc2626', label: 'ディープレッド' },
  { from: '#fed7aa', to: '#fb923c', label: 'ライトオレンジ' },
  { from: '#fb923c', to: '#f97316', label: 'オレンジ' },
  { from: '#f97316', to: '#ea580c', label: 'ディープオレンジ' },
  { from: '#fef3c7', to: '#fde047', label: 'ライトイエロー' },
  { from: '#facc15', to: '#eab308', label: 'イエロー' },
  { from: '#eab308', to: '#ca8a04', label: 'ゴールド' },
  // グリーン系
  { from: '#d9f99d', to: '#bef264', label: 'ライトライム' },
  { from: '#a3e635', to: '#84cc16', label: 'ライム' },
  { from: '#bbf7d0', to: '#4ade80', label: 'ライトグリーン' },
  { from: '#4ade80', to: '#22c55e', label: 'グリーン' },
  { from: '#22c55e', to: '#16a34a', label: 'ディープグリーン' },
  { from: '#a7f3d0', to: '#34d399', label: 'エメラルド' },
  { from: '#10b981', to: '#059669', label: 'ダークエメラルド' },
  // 青・水色系
  { from: '#99f6e4', to: '#2dd4bf', label: 'ティール' },
  { from: '#14b8a6', to: '#0d9488', label: 'ダークティール' },
  { from: '#a5f3fc', to: '#22d3ee', label: 'シアン' },
  { from: '#06b6d4', to: '#0891b2', label: 'ダークシアン' },
  { from: '#bfdbfe', to: '#60a5fa', label: 'スカイブルー' },
  { from: '#3b82f6', to: '#2563eb', label: 'ブルー' },
  { from: '#c7d2fe', to: '#818cf8', label: 'ライトインディゴ' },
  { from: '#6366f1', to: '#4f46e5', label: 'インディゴ' },
  // 紫・ピンク系
  { from: '#e9d5ff', to: '#c084fc', label: 'ライトパープル' },
  { from: '#a855f7', to: '#9333ea', label: 'パープル' },
  { from: '#8b5cf6', to: '#7c3aed', label: 'ディープパープル' },
  { from: '#fbcfe8', to: '#f472b6', label: 'ライトピンク' },
  { from: '#ec4899', to: '#db2777', label: 'ピンク' },
  { from: '#fecdd3', to: '#fb7185', label: 'ローズ' },
  { from: '#f43f5e', to: '#e11d48', label: 'ディープローズ' },
  // グレー・ダーク系
  { from: '#e5e7eb', to: '#9ca3af', label: 'ライトグレー' },
  { from: '#9ca3af', to: '#6b7280', label: 'グレー' },
  { from: '#6b7280', to: '#4b5563', label: 'ダークグレー' },
  { from: '#64748b', to: '#475569', label: 'スレート' },
  { from: '#334155', to: '#1e293b', label: 'ダークスレート' },
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
            className="flex-1 py-2.5 px-4 rounded-lg bg-primary-700 text-white hover:bg-primary-800 font-medium"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
