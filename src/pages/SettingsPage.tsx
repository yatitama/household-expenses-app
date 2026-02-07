import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Database, Download, Upload, Trash2, Users, Tag, ChevronDown, ChevronUp, Plus, Edit2, Moon, Sun } from 'lucide-react';
import { accountService, transactionService, categoryService, budgetService, memberService } from '../services/storage';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useDarkMode } from '../hooks/useDarkMode';
import { ICON_COMPONENTS, ICON_NAMES, getCategoryIcon } from '../utils/categoryIcons';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog';
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

  // Confirm dialog state
  const [confirmDialogState, setConfirmDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  useBodyScrollLock(isMemberModalOpen || isCategoryModalOpen);

  const refreshMembers = useCallback(() => setMembers(memberService.getAll()), []);
  const refreshCategories = useCallback(() => setCategories(categoryService.getAll()), []);

  const filteredCategories = categories.filter((c) => c.type === categoryFilterType);

  // Member handlers
  const handleAddMember = () => { setEditingMember(null); setIsMemberModalOpen(true); };
  const handleEditMember = (member: Member) => { setEditingMember(member); setIsMemberModalOpen(true); };
  const handleDeleteMember = (member: Member) => {
    if (member.isDefault) { toast.error('デフォルトメンバーは削除できません'); return; }
    setConfirmDialogState({
      isOpen: true,
      title: 'メンバーを削除',
      message: 'このメンバーを削除してもよろしいですか？',
      onConfirm: () => {
        memberService.delete(member.id);
        refreshMembers();
        toast.success('メンバーを削除しました');
      },
    });
  };
  const handleSaveMember = (input: MemberInput) => {
    if (editingMember) {
      memberService.update(editingMember.id, input);
      toast.success('メンバーを更新しました');
    } else {
      memberService.create(input);
      toast.success('メンバーを追加しました');
    }
    refreshMembers(); setIsMemberModalOpen(false);
  };

  // Category handlers
  const handleAddCategory = () => { setEditingCategory(null); setIsCategoryModalOpen(true); };
  const handleEditCategory = (category: Category) => { setEditingCategory(category); setIsCategoryModalOpen(true); };
  const handleDeleteCategory = (id: string) => {
    setConfirmDialogState({
      isOpen: true,
      title: 'カテゴリを削除',
      message: 'このカテゴリを削除してもよろしいですか？',
      onConfirm: () => {
        categoryService.delete(id);
        refreshCategories();
        toast.success('カテゴリを削除しました');
      },
    });
  };
  const handleSaveCategory = (input: CategoryInput) => {
    if (editingCategory) {
      categoryService.update(editingCategory.id, input);
      toast.success('カテゴリを更新しました');
    } else {
      categoryService.create(input);
      toast.success('カテゴリを追加しました');
    }
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
    toast.success('データをエクスポートしました');
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
        toast.success('データをインポートしました。再読み込みします。');
        setTimeout(() => window.location.reload(), 1000);
      } catch {
        toast.error('インポートに失敗しました。ファイル形式を確認してください。');
      }
    };
    input.click();
  };

  const handleReset = () => {
    setConfirmDialogState({
      isOpen: true,
      title: 'データを初期化',
      message: 'すべてのデータを削除しますか？この操作は取り消せません。',
      onConfirm: () => {
        localStorage.removeItem('household_members');
        localStorage.removeItem('household_accounts');
        localStorage.removeItem('household_transactions');
        localStorage.removeItem('household_categories');
        localStorage.removeItem('household_budgets');
        localStorage.removeItem('household_card_billings');
        toast.success('データを削除しました。再読み込みします。');
        setTimeout(() => window.location.reload(), 1000);
      },
    });
  };

  const getMember = (memberId: string) => members.find((m) => m.id === memberId);

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-brand-700 to-accent-700 bg-clip-text text-transparent dark:from-brand-400 dark:to-accent-400">
        設定
      </h2>

      {/* ダークモード切り替え */}
      <div className="premium-card p-4 md:p-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDark ? <Moon size={20} className="text-accent-400" /> : <Sun size={20} className="text-yellow-500" />}
            <div>
              <p className="font-semibold text-brand-900 dark:text-brand-100">ダークモード</p>
              <p className="text-xs text-brand-600 dark:text-brand-400">{isDark ? 'ダークモード有効' : 'ライトモード有効'}</p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              isDark ? 'bg-gradient-to-r from-brand-600 to-accent-600' : 'bg-brand-200 dark:bg-brand-700'
            }`}
            role="switch"
            aria-checked={isDark}
            aria-label="ダークモード切り替え"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-card transition-transform ${
                isDark ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* メンバー管理 */}
      <div className="premium-card overflow-hidden animate-fade-in">
        <button
          onClick={() => setMembersOpen(!membersOpen)}
          className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-brand-50/50 dark:hover:bg-brand-900/20 transition-colors"
          aria-expanded={membersOpen}
        >
          <div className="flex items-center gap-3">
            <Users size={20} className="text-brand-600 dark:text-brand-400" />
            <div className="text-left">
              <p className="font-semibold text-brand-900 dark:text-brand-100">メンバー管理</p>
              <p className="text-xs text-brand-600 dark:text-brand-400">家族のメンバーを追加・編集</p>
            </div>
          </div>
          {membersOpen ? <ChevronUp size={20} className="text-brand-500 dark:text-brand-400" /> : <ChevronDown size={20} className="text-brand-500 dark:text-brand-400" />}
        </button>

        {membersOpen && (
          <div className="border-t border-brand-100 dark:border-brand-800 p-4 md:p-5 space-y-3">
            <button
              onClick={handleAddMember}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
            >
              <Plus size={16} />
              メンバーを追加
            </button>

            {members.length === 0 ? (
              <p className="text-sm text-brand-500 dark:text-brand-400 text-center py-4">メンバーがいません</p>
            ) : (
              <div className="divide-y divide-brand-100 dark:divide-brand-800">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-card"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-brand-900 dark:text-brand-100">{member.name}</p>
                        {member.isDefault && <p className="text-xs text-brand-600 dark:text-brand-400">デフォルト</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEditMember(member)} className="p-2 text-brand-500 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      {!member.isDefault && (
                        <button onClick={() => handleDeleteMember(member)} className="p-2 text-brand-500 hover:text-red-600 dark:text-brand-400 dark:hover:text-red-400 transition-colors">
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
      <div className="premium-card overflow-hidden animate-fade-in">
        <button
          onClick={() => setCategoriesOpen(!categoriesOpen)}
          className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-brand-50/50 dark:hover:bg-brand-900/20 transition-colors"
          aria-expanded={categoriesOpen}
        >
          <div className="flex items-center gap-3">
            <Tag size={20} className="text-accent-600 dark:text-accent-400" />
            <div className="text-left">
              <p className="font-semibold text-brand-900 dark:text-brand-100">カテゴリ管理</p>
              <p className="text-xs text-brand-600 dark:text-brand-400">収支カテゴリを追加・編集</p>
            </div>
          </div>
          {categoriesOpen ? <ChevronUp size={20} className="text-brand-500 dark:text-brand-400" /> : <ChevronDown size={20} className="text-brand-500 dark:text-brand-400" />}
        </button>

        {categoriesOpen && (
          <div className="border-t border-brand-100 dark:border-brand-800 p-4 md:p-5 space-y-3">
            {/* Type toggle */}
            <div className="flex rounded-lg overflow-hidden border border-brand-300 dark:border-brand-700">
              <button
                onClick={() => setCategoryFilterType('expense')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  categoryFilterType === 'expense' ? 'bg-red-500 text-white' : 'bg-brand-50 dark:bg-brand-900 text-brand-700 dark:text-brand-300'
                }`}
              >
                支出
              </button>
              <button
                onClick={() => setCategoryFilterType('income')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  categoryFilterType === 'income' ? 'bg-green-500 text-white' : 'bg-brand-50 dark:bg-brand-900 text-brand-700 dark:text-brand-300'
                }`}
              >
                収入
              </button>
            </div>

            <button
              onClick={handleAddCategory}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
            >
              <Plus size={16} />
              カテゴリを追加
            </button>

            {filteredCategories.length === 0 ? (
              <p className="text-sm text-brand-500 dark:text-brand-400 text-center py-4">カテゴリがありません</p>
            ) : (
              <div className="divide-y divide-brand-100 dark:divide-brand-800">
                {filteredCategories.map((category) => {
                  const member = getMember(category.memberId);
                  return (
                    <div key={category.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm"
                          style={{ backgroundColor: `${category.color}20`, color: category.color }}
                        >
                          {getCategoryIcon(category.icon, 18)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-brand-900 dark:text-brand-100">{category.name}</p>
                          <p className="text-xs text-brand-600 dark:text-brand-400">{member?.name || '共通'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEditCategory(category)} className="p-2 text-brand-500 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDeleteCategory(category.id)} className="p-2 text-brand-500 hover:text-red-600 dark:text-brand-400 dark:hover:text-red-400 transition-colors">
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
      <div className="premium-card p-4 md:p-5 animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
          <Database size={20} className="text-brand-600 dark:text-brand-400" />
          <h3 className="font-bold text-brand-900 dark:text-brand-100">データ管理</h3>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-brand-200 dark:border-brand-700 hover:border-brand-300 dark:hover:border-brand-600 hover:bg-brand-50/50 dark:hover:bg-brand-900/20 transition-all"
          >
            <Download size={20} className="text-brand-600 dark:text-brand-400" />
            <div className="text-left">
              <p className="font-semibold text-brand-900 dark:text-brand-100 text-sm">データをエクスポート</p>
              <p className="text-xs text-brand-600 dark:text-brand-400">JSONファイルとしてダウンロード</p>
            </div>
          </button>

          <button
            onClick={handleImport}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-brand-200 dark:border-brand-700 hover:border-brand-300 dark:hover:border-brand-600 hover:bg-brand-50/50 dark:hover:bg-brand-900/20 transition-all"
          >
            <Upload size={20} className="text-accent-600 dark:text-accent-400" />
            <div className="text-left">
              <p className="font-semibold text-brand-900 dark:text-brand-100 text-sm">データをインポート</p>
              <p className="text-xs text-brand-600 dark:text-brand-400">JSONファイルから復元</p>
            </div>
          </button>

          <button
            onClick={handleReset}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-all"
          >
            <Trash2 size={20} className="text-red-600 dark:text-red-400" />
            <div className="text-left">
              <p className="font-semibold text-red-600 dark:text-red-400 text-sm">データを初期化</p>
              <p className="text-xs text-brand-600 dark:text-brand-400">すべてのデータを削除</p>
            </div>
          </button>
        </div>
      </div>

      {/* バージョン情報 */}
      <div className="premium-card p-4 animate-fade-in">
        <p className="text-center text-sm text-brand-600 dark:text-brand-400">家計簿アプリ v1.0.0</p>
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

      <ConfirmDialog
        isOpen={confirmDialogState.isOpen}
        onClose={() => setConfirmDialogState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialogState.onConfirm}
        title={confirmDialogState.title}
        message={confirmDialogState.message}
        confirmText="削除"
        confirmVariant="danger"
      />
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="premium-card w-full sm:max-w-md sm:rounded-xl rounded-t-xl p-5 max-h-[90vh] overflow-y-auto animate-scale-in">
        <h3 className="text-lg font-bold bg-gradient-to-r from-brand-700 to-accent-700 bg-clip-text text-transparent dark:from-brand-300 dark:to-accent-300 mb-4">
          {member ? 'メンバーを編集' : 'メンバーを追加'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-700 dark:text-brand-300 mb-1">名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 太郎"
              className="w-full border border-brand-300 dark:border-brand-600 bg-white dark:bg-brand-900 text-brand-900 dark:text-brand-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-accent-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-700 dark:text-brand-300 mb-1">色</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-brand-500 dark:ring-accent-500 scale-110 shadow-brand dark:ring-offset-brand-900' : 'shadow-card'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2 px-4">
              キャンセル
            </button>
            <button type="submit" className="btn-primary flex-1 py-2 px-4">
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="premium-card w-full sm:max-w-md sm:rounded-xl rounded-t-xl p-5 max-h-[90vh] overflow-y-auto animate-scale-in">
        <h3 className="text-lg font-bold bg-gradient-to-r from-brand-700 to-accent-700 bg-clip-text text-transparent dark:from-brand-300 dark:to-accent-300 mb-4">
          {category ? 'カテゴリを編集' : 'カテゴリを追加'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-700 dark:text-brand-300 mb-1">名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 食費"
              className="w-full border border-brand-300 dark:border-brand-600 bg-white dark:bg-brand-900 text-brand-900 dark:text-brand-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-accent-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-700 dark:text-brand-300 mb-1">対象メンバー</label>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMemberId(m.id)}
                  className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                    memberId === m.id
                      ? 'bg-gradient-to-r from-brand-600 to-accent-600 text-white border-brand-600 shadow-brand'
                      : 'bg-white dark:bg-brand-900 text-brand-700 dark:text-brand-300 border-brand-300 dark:border-brand-600 hover:border-brand-400 dark:hover:border-brand-500'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                  {m.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-700 dark:text-brand-300 mb-1">色</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-brand-500 dark:ring-accent-500 scale-110 shadow-brand dark:ring-offset-brand-900' : 'shadow-card'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-700 dark:text-brand-300 mb-1">アイコン</label>
            <div className="grid grid-cols-6 gap-2">
              {ICON_NAMES.map((i) => {
                const IconComponent = ICON_COMPONENTS[i];
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(i)}
                    className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${
                      icon === i
                        ? 'border-brand-500 dark:border-accent-500 bg-brand-50 dark:bg-accent-900/30 text-brand-600 dark:text-accent-400 shadow-brand'
                        : 'border-brand-200 dark:border-brand-700 text-brand-600 dark:text-brand-400 hover:border-brand-300 dark:hover:border-brand-600'
                    }`}
                  >
                    <IconComponent size={20} />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2 px-4">
              キャンセル
            </button>
            <button type="submit" className="btn-primary flex-1 py-2 px-4">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
