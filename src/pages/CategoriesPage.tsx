import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Edit2, Trash2, Tag,
  Utensils, ShoppingBag, Zap, Wifi, Home,
  GraduationCap, Heart, Car, Gamepad2, Shirt,
  Gift, PiggyBank, Briefcase, Coffee, Film,
  Music, Book, Plane, MoreHorizontal, Banknote,
  Train, Bus, Bike, Baby, Dog, Cat, Pill,
  Stethoscope, Scissors, Sparkles, Dumbbell,
} from 'lucide-react';
import { categoryService, memberService } from '../services/storage';
import { COMMON_MEMBER_ID } from '../types';
import type { Category, CategoryInput, TransactionType } from '../types';

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
];

const ICON_COMPONENTS: Record<string, React.ComponentType<{ size?: number }>> = {
  Utensils, ShoppingBag, Zap, Wifi, Home,
  GraduationCap, Heart, Car, Gamepad2, Shirt,
  Gift, PiggyBank, Briefcase, Coffee, Film,
  Music, Book, Plane, MoreHorizontal, Banknote,
  Train, Bus, Bike, Baby, Dog, Cat, Pill,
  Stethoscope, Scissors, Sparkles, Dumbbell,
};

const ICONS = Object.keys(ICON_COMPONENTS);

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

  const filteredCategories = categories.filter((c) => c.type === filterType);

  const handleAdd = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('このカテゴリを削除しますか？')) {
      categoryService.delete(id);
      refreshCategories();
    }
  };

  const handleSave = (input: CategoryInput) => {
    if (editingCategory) {
      categoryService.update(editingCategory.id, input);
    } else {
      categoryService.create(input);
    }
    refreshCategories();
    setIsModalOpen(false);
  };

  const getMember = (memberId: string) => members.find((m) => m.id === memberId);

  return (
    <div className="p-4 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/settings')} className="p-2 -ml-2 text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-gray-800">カテゴリ管理</h2>
      </div>

      {/* タイプ切り替え */}
      <div className="flex rounded-lg overflow-hidden border border-gray-300">
        <button
          onClick={() => setFilterType('expense')}
          className={`flex-1 py-2 font-medium transition-colors ${
            filterType === 'expense' ? 'bg-red-500 text-white' : 'bg-white text-gray-700'
          }`}
        >
          支出
        </button>
        <button
          onClick={() => setFilterType('income')}
          className={`flex-1 py-2 font-medium transition-colors ${
            filterType === 'income' ? 'bg-green-500 text-white' : 'bg-white text-gray-700'
          }`}
        >
          収入
        </button>
      </div>

      {/* 追加ボタン */}
      <button
        onClick={handleAdd}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-medium"
      >
        <Plus size={20} />
        カテゴリを追加
      </button>

      {/* カテゴリ一覧 */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Tag size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">カテゴリがありません</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
          {filteredCategories.map((category) => {
            const member = getMember(category.memberId);
            return (
              <div key={category.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{category.name}</p>
                    <p className="text-xs text-gray-500">{member?.name || '共通'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(category)} className="p-2 text-gray-400 hover:text-gray-600">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(category.id)} className="p-2 text-gray-400 hover:text-red-600">
                    <Trash2 size={16} />
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
  const [icon, setIcon] = useState(category?.icon || ICONS[0]);

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
      <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-xl p-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">{category ? 'カテゴリを編集' : 'カテゴリを追加'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 名前 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 食費"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* メンバー */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">対象メンバー</label>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setMemberId(member.id)}
                  className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    memberId === member.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
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
            <label className="block text-sm font-medium text-gray-700 mb-1">色</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">アイコン</label>
            <div className="grid grid-cols-6 gap-2">
              {ICONS.map((i) => {
                const IconComponent = ICON_COMPONENTS[i];
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(i)}
                    className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors ${
                      icon === i
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent size={20} />
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
              className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 rounded-lg bg-blue-600 text-white font-medium"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
