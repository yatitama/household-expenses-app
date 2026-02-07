import { useState, useCallback } from 'react';
import { Database, Download, Upload, Trash2, Users, Tag, ChevronDown, ChevronUp, Plus, Edit2, Moon, Sun } from 'lucide-react';
import { accountService, transactionService, categoryService, budgetService, memberService } from '../services/storage';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useDarkMode } from '../hooks/useDarkMode';
import { ICON_COMPONENTS, ICON_NAMES, getCategoryIcon } from '../utils/categoryIcons';
import { COMMON_MEMBER_ID } from '../types';
import type { Member, MemberInput, Category, CategoryInput, TransactionType } from '../types';

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
];

export const SettingsPage = () => {
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const [membersOpen, setMembersOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>(() => memberService.getAll());
  const [categories, setCategories] = useState<Category[]>(() => categoryService.getAll());
  const [categoryFilterType, setCategoryFilterType] = useState<TransactionType>('expense');

  // Member modal state
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Category modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useBodyScrollLock(isMemberModalOpen || isCategoryModalOpen);

  const refreshMembers = useCallback(() => setMembers(memberService.getAll()), []);
  const refreshCategories = useCallback(() => setCategories(categoryService.getAll()), []);

  const filteredCategories = categories.filter((c) => c.type === categoryFilterType);

  // Member handlers
  const handleAddMember = () => { setEditingMember(null); setIsMemberModalOpen(true); };
  const handleEditMember = (member: Member) => { setEditingMember(member); setIsMemberModalOpen(true); };
  const handleDeleteMember = (member: Member) => {
    if (member.isDefault) { alert('デフォルトメンバーは削除できません'); return; }
    if (confirm('このメンバーを削除しますか？')) { memberService.delete(member.id); refreshMembers(); }
  };
  const handleSaveMember = (input: MemberInput) => {
    if (editingMember) { memberService.update(editingMember.id, input); }
    else { memberService.create(input); }
    refreshMembers(); setIsMemberModalOpen(false);
  };

  // Category handlers
  const handleAddCategory = () => { setEditingCategory(null); setIsCategoryModalOpen(true); };
  const handleEditCategory = (category: Category) => { setEditingCategory(category); setIsCategoryModalOpen(true); };
  const handleDeleteCategory = (id: string) => {
    if (confirm('このカテゴリを削除しますか？')) { categoryService.delete(id); refreshCategories(); }
  };
  const handleSaveCategory = (input: CategoryInput) => {
    if (editingCategory) { categoryService.update(editingCategory.id, input); }
    else { categoryService.create(input); }
    refreshCategories(); setIsCategoryModalOpen(false);
  };

  // Data management
  const handleExport = () => {
    const data = {
      members: memberService.getAll(),
      accounts: accountService.getAll(),
      transactions: transactionService.getAll(),
      categories: categoryService.getAll(),
      budgets: budgetService.getAll(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `household-expenses-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text) as {
          members?: unknown[];
          accounts?: unknown[];
          transactions?: unknown[];
          categories?: unknown[];
          budgets?: unknown[];
        };
        if (data.members) localStorage.setItem('household_members', JSON.stringify(data.members));
        if (data.categories) localStorage.setItem('household_categories', JSON.stringify(data.categories));
        if (data.accounts) localStorage.setItem('household_accounts', JSON.stringify(data.accounts));
        if (data.transactions) localStorage.setItem('household_transactions', JSON.stringify(data.transactions));
        if (data.budgets) localStorage.setItem('household_budgets', JSON.stringify(data.budgets));
        alert('データをインポートしました。ページを再読み込みします。');
        window.location.reload();
      } catch {
        alert('インポートに失敗しました。ファイル形式を確認してください。');
      }
    };
    input.click();
  };

  const handleReset = () => {
    if (confirm('すべてのデータを削除しますか？この操作は取り消せません。')) {
      localStorage.removeItem('household_members');
      localStorage.removeItem('household_accounts');
      localStorage.removeItem('household_transactions');
      localStorage.removeItem('household_categories');
      localStorage.removeItem('household_budgets');
      localStorage.removeItem('household_card_billings');
      alert('データを削除しました。ページを再読み込みします。');
      window.location.reload();
    }
  };

  const getMember = (memberId: string) => members.find((m) => m.id === memberId);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">設定</h2>

      {/* ダークモード切り替え */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDark ? <Moon size={20} className="text-indigo-400" /> : <Sun size={20} className="text-yellow-500" />}
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">ダークモード</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{isDark ? 'ダークモード有効' : 'ライトモード有効'}</p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              isDark ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
            role="switch"
            aria-checked={isDark}
            aria-label="ダークモード切り替え"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                isDark ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* メンバー管理 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
        <button
          onClick={() => setMembersOpen(!membersOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          aria-expanded={membersOpen}
        >
          <div className="flex items-center gap-3">
            <Users size={20} className="text-blue-600 dark:text-blue-400" />
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-gray-100">メンバー管理</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">家族のメンバーを追加・編集</p>
            </div>
          </div>
          {membersOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </button>

        {membersOpen && (
          <div className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-3">
            <button
              onClick={handleAddMember}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm"
            >
              <Plus size={16} />
              メンバーを追加
            </button>

            {members.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">メンバーがいません</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.name}</p>
                        {member.isDefault && <p className="text-xs text-gray-400 dark:text-gray-500">デフォルト</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEditMember(member)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <Edit2 size={14} />
                      </button>
                      {!member.isDefault && (
                        <button onClick={() => handleDeleteMember(member)} className="p-2 text-gray-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* カテゴリ管理 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
        <button
          onClick={() => setCategoriesOpen(!categoriesOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          aria-expanded={categoriesOpen}
        >
          <div className="flex items-center gap-3">
            <Tag size={20} className="text-green-600 dark:text-green-400" />
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-gray-100">カテゴリ管理</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">収支カテゴリを追加・編集</p>
            </div>
          </div>
          {categoriesOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </button>

        {categoriesOpen && (
          <div className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-3">
            {/* Type toggle */}
            <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
              <button
                onClick={() => setCategoryFilterType('expense')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  categoryFilterType === 'expense' ? 'bg-red-500 text-white' : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                支出
              </button>
              <button
                onClick={() => setCategoryFilterType('income')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  categoryFilterType === 'income' ? 'bg-green-500 text-white' : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                収入
              </button>
            </div>

            <button
              onClick={handleAddCategory}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm"
            >
              <Plus size={16} />
              カテゴリを追加
            </button>

            {filteredCategories.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">カテゴリがありません</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredCategories.map((category) => {
                  const member = getMember(category.memberId);
                  return (
                    <div key={category.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${category.color}20`, color: category.color }}
                        >
                          {getCategoryIcon(category.icon, 18)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{category.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{member?.name || '共通'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEditCategory(category)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDeleteCategory(category.id)} className="p-2 text-gray-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* データ管理 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <Database size={20} className="text-gray-600 dark:text-gray-400" />
          <h3 className="font-bold text-gray-800 dark:text-gray-100">データ管理</h3>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
          >
            <Download size={20} className="text-blue-600 dark:text-blue-400" />
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">データをエクスポート</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">JSONファイルとしてダウンロード</p>
            </div>
          </button>

          <button
            onClick={handleImport}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
          >
            <Upload size={20} className="text-green-600 dark:text-green-400" />
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">データをインポート</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">JSONファイルから復元</p>
            </div>
          </button>

          <button
            onClick={handleReset}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 transition-colors"
          >
            <Trash2 size={20} className="text-red-600" />
            <div className="text-left">
              <p className="font-medium text-red-600 text-sm">データを初期化</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">すべてのデータを削除</p>
            </div>
          </button>
        </div>
      </div>

      {/* バージョン情報 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4">
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">家計簿アプリ v1.0.0</p>
      </div>

      {/* Member Modal */}
      {isMemberModalOpen && (
        <MemberModal
          member={editingMember}
          onSave={handleSaveMember}
          onClose={() => setIsMemberModalOpen(false)}
        />
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <CategoryModal
          category={editingCategory}
          type={categoryFilterType}
          members={members}
          onSave={handleSaveCategory}
          onClose={() => setIsCategoryModalOpen(false)}
        />
      )}
    </div>
  );
};

// Member Modal
interface MemberModalProps {
  member: Member | null;
  onSave: (input: MemberInput) => void;
  onClose: () => void;
}

const MemberModal = ({ member, onSave, onClose }: MemberModalProps) => {
  const [name, setName] = useState(member?.name || '');
  const [color, setColor] = useState(member?.color || COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, color, isDefault: member?.isDefault });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md sm:rounded-xl rounded-t-xl p-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">{member ? 'メンバーを編集' : 'メンバーを追加'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 太郎"
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">色</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110 dark:ring-offset-slate-800' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium">
              キャンセル
            </button>
            <button type="submit" className="flex-1 py-2 px-4 rounded-lg bg-blue-600 text-white font-medium">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Category Modal
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
    onSave({ name, type, memberId, color, icon });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md sm:rounded-xl rounded-t-xl p-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">{category ? 'カテゴリを編集' : 'カテゴリを追加'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 食費"
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">対象メンバー</label>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMemberId(m.id)}
                  className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    memberId === m.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                  {m.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">色</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110 dark:ring-offset-slate-800' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">アイコン</label>
            <div className="grid grid-cols-6 gap-2">
              {ICON_NAMES.map((i) => {
                const IconComponent = ICON_COMPONENTS[i];
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(i)}
                    className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors ${
                      icon === i
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent size={20} />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium">
              キャンセル
            </button>
            <button type="submit" className="flex-1 py-2 px-4 rounded-lg bg-blue-600 text-white font-medium">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
