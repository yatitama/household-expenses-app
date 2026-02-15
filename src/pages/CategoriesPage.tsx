import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { categoryService, memberService } from '../services/storage';
import { COMMON_MEMBER_ID } from '../types';
import { ICON_COMPONENTS, ICON_NAMES, getCategoryIcon } from '../utils/categoryIcons';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog';
import type { Category, CategoryInput, TransactionType } from '../types';

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
];

export const CategoriesPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>(() => categoryService.getAll());
  const members = memberService.getAll();
  const [filterType, setFilterType] = useState<TransactionType>('expense');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const refreshCategories = useCallback(() => {
    setCategories(categoryService.getAll());
  }, []);

  useBodyScrollLock(isModalOpen);

  const filteredCategories = categories.filter((c) => c.type === filterType);

  const handleAdd = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = () => {
    if (!deleteConfirm.id) return;
    categoryService.delete(deleteConfirm.id);
    refreshCategories();
    toast.success('カテゴリを削除しました');
  };

  const handleSave = (input: CategoryInput) => {
    if (editingCategory) {
      categoryService.update(editingCategory.id, input);
      toast.success('カテゴリを更新しました');
    } else {
      categoryService.create(input);
      toast.success('カテゴリを追加しました');
    }
    refreshCategories();
    setIsModalOpen(false);
  };

  const getMember = (memberId: string) => members.find((m) => m.id === memberId);

  return (
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button onClick={() => navigate('/settings')} className="p-2 -ml-2 text-gray-600 text-xs sm:text-base">
          <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
        </button>
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">カテゴリ管理</h2>
      </div>

      {/* タイプ切り替え */}
      <div className="flex rounded-lg overflow-hidden">
        <button
          onClick={() => setFilterType('expense')}
          className={`flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
            filterType === 'expense' ? 'text-white' : 'text-gray-900'
          }`}
        >
          支出
        </button>
        <button
          onClick={() => setFilterType('income')}
          className={`flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
            filterType === 'income' ? 'bg-gray-600 text-white' : 'text-gray-900'
          }`}
        >
          収入
        </button>
      </div>

      {/* 追加ボタン */}
      <button
        onClick={handleAdd}
        className="w-full flex items-center justify-center gap-2 text-white py-2 sm:py-2.5 rounded-lg font-medium text-sm sm:text-base"
      >
        <Plus size={16} className="sm:w-5 sm:h-5" />
        カテゴリを追加
      </button>

      {/* カテゴリ一覧 */}
      {filteredCategories.length === 0 ? (
        <div className="rounded-lg sm:rounded-xl p-6 sm:p-8 text-center">
          <Tag size={40} className="sm:w-12 sm:h-12 mx-auto text-gray-300 mb-2 sm:mb-3" />
          <p className="text-xs sm:text-sm text-gray-500">カテゴリがありません</p>
        </div>
      ) : (
        <div className="rounded-lg sm:rounded-xl divide-y divide-gray-100">
          {filteredCategories.map((category) => {
            const member = getMember(category.memberId);
            return (
              <div key={category.id} className="flex items-center justify-between p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div
                    className="w-8 sm:w-10 h-8 sm:h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${category.color}20`, color: category.color }}
                  >
                    {getCategoryIcon(category.icon, 14)}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">{category.name}</p>
                    <p className="text-xs text-gray-500">{member?.name || '共通'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button onClick={() => handleEdit(category)} className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600">
                    <Edit2 size={14} className="sm:w-4 sm:h-4" />
                  </button>
                  <button onClick={() => handleDelete(category.id)} className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-900">
                    <Trash2 size={14} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* モーダル */}
      {isModalOpen && (
        <CategoryModal
          category={editingCategory}
          type={filterType}
          members={members}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="カテゴリを削除"
        message="このカテゴリを削除してもよろしいですか？"
        confirmText="削除"
        confirmVariant="danger"
      />
    </div>
  );
};

interface CategoryModalProps {
  category: Category | null;
  type: TransactionType;
  members: { id: string; name: string; color: string }[];
  onSave: (input: CategoryInput) => void;
  onClose: () => void;
}

const CategoryModal = ({ category, type, members, onSave, onClose }: CategoryModalProps) => {
  const [name, setName] = useState(category?.name || '');
  const [memberId, setMemberId] = useState(category?.memberId || COMMON_MEMBER_ID);
  const [color, setColor] = useState(category?.color || COLORS[0]);
  const [icon, setIcon] = useState(category?.icon || ICON_NAMES[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      type,
      memberId,
      color,
      icon,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="w-full sm:max-w-md sm:rounded-xl rounded-t-xl p-3 sm:p-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-base sm:text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">{category ? 'カテゴリを編集' : 'カテゴリを追加'}</h3>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* 名前 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 食費"
              className="w-full dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* メンバー */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">対象メンバー</label>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setMemberId(member.id)}
                  className={`flex items-center gap-2 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    memberId === member.id
                      ? 'text-white'
                      : 'text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: member.color }} />
                  {member.name}
                </button>
              ))}
            </div>
          </div>

          {/* 色 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">色</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* アイコン */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">アイコン</label>
            <div className="grid grid-cols-6 gap-2">
              {ICON_NAMES.map((i) => {
                const IconComponent = ICON_COMPONENTS[i];
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(i)}
                    className={`w-8 sm:w-10 h-8 sm:h-10 rounded-lg flex items-center justify-center transition-colors ${
                      icon === i
                        ? 'border-gray-700 bg-gray-100 text-gray-800 dark:text-gray-600'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent size={16} className="sm:w-5 sm:h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ボタン */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 sm:px-4 rounded-lg dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-3 sm:px-4 rounded-lg text-white font-medium text-sm hover:"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
