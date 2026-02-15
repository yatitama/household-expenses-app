import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Database, Download, Upload, Trash2, Users, Tag, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { accountService, transactionService, categoryService, budgetService, memberService, paymentMethodService, recurringPaymentService, cardBillingService, linkedPaymentMethodService } from '../services/storage';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { ICON_COMPONENTS, ICON_NAMES, getCategoryIcon } from '../utils/categoryIcons';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog';
import { COLORS } from '../components/accounts/constants';
import { COMMON_MEMBER_ID } from '../types';
import type { Member, MemberInput, Category, CategoryInput, TransactionType } from '../types';

export const SettingsPage = () => {
  // デフォルトで全セクション折りたたみ（モバイルファースト）
  const [membersOpen, setMembersOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [dataManagementOpen, setDataManagementOpen] = useState(false);
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
      paymentMethods: paymentMethodService.getAll(),
      cardBillings: cardBillingService.getAll(),
      recurringPayments: recurringPaymentService.getAll(),
      linkedPaymentMethods: linkedPaymentMethodService.getAll(),
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
          paymentMethods?: unknown[];
          cardBillings?: unknown[];
          recurringPayments?: unknown[];
          linkedPaymentMethods?: unknown[];
        };
        setConfirmDialogState({
          isOpen: true,
          title: 'データをインポート',
          message: '既存のすべてのデータが置き換わります。よろしいですか？',
          onConfirm: () => {
            if (data.members) localStorage.setItem('household_members', JSON.stringify(data.members));
            if (data.categories) localStorage.setItem('household_categories', JSON.stringify(data.categories));
            if (data.accounts) localStorage.setItem('household_accounts', JSON.stringify(data.accounts));
            if (data.transactions) localStorage.setItem('household_transactions', JSON.stringify(data.transactions));
            if (data.budgets) localStorage.setItem('household_budgets', JSON.stringify(data.budgets));
            if (data.paymentMethods) localStorage.setItem('household_payment_methods', JSON.stringify(data.paymentMethods));
            if (data.cardBillings) localStorage.setItem('household_card_billings', JSON.stringify(data.cardBillings));
            if (data.recurringPayments) localStorage.setItem('household_recurring_payments', JSON.stringify(data.recurringPayments));
            if (data.linkedPaymentMethods) localStorage.setItem('household_linked_payment_methods', JSON.stringify(data.linkedPaymentMethods));
            toast.success('データをインポートしました。再読み込みします。');
            setTimeout(() => window.location.reload(), 1000);
          },
        });
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
        localStorage.removeItem('household_payment_methods');
        localStorage.removeItem('household_recurring_payments');
        localStorage.removeItem('household_linked_payment_methods');
        localStorage.removeItem('household_app_settings');
        localStorage.removeItem('household_migration_version');
        toast.success('データを削除しました。再読み込みします。');
        setTimeout(() => window.location.reload(), 1000);
      },
    });
  };

  const getMember = (memberId: string) => members.find((m) => m.id === memberId);

  return (
    <div className="p-2 sm:p-3 md:p-4 lg:p-6 space-y-2.5 sm:space-y-3 md:space-y-4">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-50">設定</h2>

      {/* メンバー管理 */}
      <div className="rounded-lg sm:rounded-xl overflow-hidden">
        <button
          onClick={() => setMembersOpen(!membersOpen)}
          className="w-full flex items-center justify-between p-3 sm:p-3.5 md:p-4 hover:bg-gray-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:focus-visible:outline-primary-400 rounded-lg"
          aria-expanded={membersOpen}
          aria-label={membersOpen ? 'メンバー管理を折りたたむ' : 'メンバー管理を展開'}
        >
          <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
            <Users size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-gray-800 dark:text-gray-600" />
            <div className="text-left">
              <p className="text-xs sm:text-sm md:text-base font-medium text-gray-900 dark:text-gray-100">メンバー管理</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">家族のメンバーを追加・編集</p>
            </div>
          </div>
          {membersOpen ? <ChevronUp size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-gray-400" /> : <ChevronDown size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-gray-400" />}
        </button>

        {membersOpen && (
          <div className="border-t dark:border-gray-700 p-3 sm:p-3.5 md:p-4 space-y-2.5 sm:space-y-3">
            <button
              onClick={handleAddMember}
              className="w-full flex items-center justify-center gap-2 text-white py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              <Plus size={16} />
              メンバーを追加
            </button>

            {members.length === 0 ? (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center py-4">メンバーがいません</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {members.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleEditMember(member)}
                    className="w-full flex items-center gap-2.5 sm:gap-3 py-2.5 sm:py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div
                      className="w-8 sm:w-9 h-8 sm:h-9 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">{member.name}</p>
                      {member.isDefault && <p className="text-xs text-gray-500 dark:text-gray-400">デフォルト</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* カテゴリ管理 */}
      <div className="rounded-lg sm:rounded-xl overflow-hidden">
        <button
          aria-label={categoriesOpen ? "カテゴリ管理を折りたたむ" : "カテゴリ管理を展開"}
          onClick={() => setCategoriesOpen(!categoriesOpen)}
          className="w-full flex items-center justify-between p-3 sm:p-3.5 md:p-4 hover:bg-gray-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:focus-visible:outline-primary-400 rounded-lg"
          aria-expanded={categoriesOpen}
        >
          <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
            <Tag size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-gray-700 dark:text-gray-600" />
            <div className="text-left">
              <p className="text-xs sm:text-sm md:text-base font-medium text-gray-900 dark:text-gray-100">カテゴリ管理</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">収支カテゴリを追加・編集</p>
            </div>
          </div>
          {categoriesOpen ? <ChevronUp size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-gray-400" /> : <ChevronDown size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-gray-400" />}
        </button>

        {categoriesOpen && (
          <div className="border-t dark:border-gray-700 p-3 sm:p-3.5 md:p-4 space-y-2.5 sm:space-y-3">
            {/* Type toggle */}
            <div className="flex rounded-lg overflow-hidden dark:border-gray-600">
              <button
                onClick={() => setCategoryFilterType('expense')}
                className={`flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
                  categoryFilterType === 'expense' ? 'text-white' : 'text-gray-900 dark:text-gray-200'
                }`}
                style={categoryFilterType === 'expense' ? { backgroundColor: 'var(--theme-primary)' } : {}}
              >
                支出
              </button>
              <button
                onClick={() => setCategoryFilterType('income')}
                className={`flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
                  categoryFilterType === 'income' ? 'text-white' : 'text-gray-900 dark:text-gray-200'
                }`}
                style={categoryFilterType === 'income' ? { backgroundColor: 'var(--theme-primary)' } : {}}
              >
                収入
              </button>
            </div>

            <button
              onClick={handleAddCategory}
              className="w-full flex items-center justify-center gap-2 text-white py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              <Plus size={16} />
              カテゴリを追加
            </button>

            {filteredCategories.length === 0 ? (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center py-4">カテゴリがありません</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredCategories.map((category) => {
                  const member = getMember(category.memberId);
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleEditCategory(category)}
                      className="w-full flex items-center gap-2.5 sm:gap-3 py-2.5 sm:py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div
                        className="w-8 sm:w-9 h-8 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${category.color}20`, color: category.color }}
                      >
                        {getCategoryIcon(category.icon, 16)}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">{category.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{member?.name || '共通'}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>


      {/* データ管理 */}
      <div className="rounded-lg sm:rounded-xl overflow-hidden">
        <button
          onClick={() => setDataManagementOpen(!dataManagementOpen)}
          className="w-full flex items-center justify-between p-3 sm:p-3.5 md:p-4 hover:bg-gray-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:focus-visible:outline-primary-400 rounded-lg"
          aria-expanded={dataManagementOpen}
          aria-label={dataManagementOpen ? "データ管理を折りたたむ" : "データ管理を展開"}
        >
          <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
            <Database size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-gray-600 dark:text-gray-400" />
            <div className="text-left">
              <p className="text-xs sm:text-sm md:text-base font-medium text-gray-900 dark:text-gray-100">データ管理</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">データのエクスポート・インポート</p>
            </div>
          </div>
          {dataManagementOpen ? <ChevronUp size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-gray-400" /> : <ChevronDown size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-gray-400" />}
        </button>

        {dataManagementOpen && (
          <div className="border-t dark:border-gray-700 p-3 sm:p-3.5 md:p-4 space-y-2.5 sm:space-y-3">
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 p-3 rounded-lg dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
          >
            <Download size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-gray-800 dark:text-gray-600 flex-shrink-0" />
            <div className="text-left min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">データをエクスポート</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">JSONファイルとしてダウンロード</p>
            </div>
          </button>

          <button
            onClick={handleImport}
            className="w-full flex items-center gap-3 p-3 rounded-lg dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
          >
            <Upload size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-gray-700 dark:text-gray-600 flex-shrink-0" />
            <div className="text-left min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">データをインポート</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">JSONファイルから復元</p>
            </div>
          </button>

          <button
            onClick={handleReset}
            className="w-full flex items-center gap-3 p-3 rounded-lg dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-800 transition-colors"
          >
            <Trash2 size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-gray-900 flex-shrink-0" />
            <div className="text-left min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-900">データを初期化</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">すべてのデータを削除</p>
            </div>
          </button>
          </div>
        )}
      </div>

      {/* バージョン情報 */}
      <div className="rounded-xl p-4">
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">家計簿アプリ v1.0.0</p>
      </div>

      {/* Member Modal */}
      {isMemberModalOpen && (
        <MemberModal
          member={editingMember}
          onSave={handleSaveMember}
          onClose={() => setIsMemberModalOpen(false)}
          onDelete={handleDeleteMember}
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
          onDelete={handleDeleteCategory}
        />
      )}


      <ConfirmDialog
        isOpen={confirmDialogState.isOpen}
        onClose={() => setConfirmDialogState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialogState.onConfirm}
        title={confirmDialogState.title}
        message={confirmDialogState.message}
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
  onDelete?: (member: Member) => void;
}

const MemberModal = ({ member, onSave, onClose, onDelete }: MemberModalProps) => {
  const [name, setName] = useState(member?.name || '');
  const [color, setColor] = useState(member?.color || COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, color, isDefault: member?.isDefault });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="w-full sm:max-w-md sm:rounded-xl rounded-t-xl flex flex-col max-h-[90vh]">
        <div className="overflow-y-auto flex-1 p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">{member ? 'メンバーを編集' : 'メンバーを追加'}</h3>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-200 mb-1">名前</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 太郎"
                className="w-full dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus-visible:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-200 mb-1">色</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      color === c ? 'ring-2 ring-offset-2 ring-primary-500 scale-110 dark:ring-offset-slate-800' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="border-t dark:border-gray-700 p-3 sm:p-4 space-y-2">
          {member && !member.isDefault && onDelete && (
            <button
              type="button"
              onClick={() => { onDelete(member); onClose(); }}
              className="w-full py-2 px-3 sm:px-4 rounded-lg bg-gray-900 text-white font-medium text-sm hover:transition-colors"
            >
              削除
            </button>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 px-3 sm:px-4 rounded-lg dark:border-gray-600 text-gray-900 dark:text-gray-200 font-medium text-sm hover:bg-gray-100">
              キャンセル
            </button>
            <button type="submit" className="flex-1 py-2 px-3 sm:px-4 rounded-lg text-white font-medium text-sm transition-colors" style={{ backgroundColor: 'var(--theme-primary)' }}>
              保存
            </button>
          </div>
        </div>
      </form>
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
  onDelete?: (id: string) => void;
}

const CategoryModal = ({ category, type, members, onSave, onClose, onDelete }: CategoryModalProps) => {
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
      <form onSubmit={handleSubmit} className="w-full sm:max-w-md sm:rounded-xl rounded-t-xl flex flex-col max-h-[90vh]">
        <div className="overflow-y-auto flex-1 p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">{category ? 'カテゴリを編集' : 'カテゴリを追加'}</h3>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-200 mb-1">名前</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 食費"
                className="w-full dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus-visible:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-200 mb-1">対象メンバー</label>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMemberId(m.id)}
                    className={`flex items-center gap-2 py-1.5 px-2 sm:py-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      memberId === m.id
                        ? 'text-white border-transparent'
                        : 'text-gray-900 dark:text-gray-200 dark:border-gray-600 hover:border-gray-400'
                    }`}
                    style={memberId === m.id ? { backgroundColor: 'var(--theme-primary)' } : {}}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-200 mb-1">色</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      color === c ? 'ring-2 ring-offset-2 ring-primary-500 scale-110 dark:ring-offset-slate-800' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-200 mb-1">アイコン</label>
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
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      <IconComponent size={16} className="sm:w-5 sm:h-5" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="border-t dark:border-gray-700 p-3 sm:p-4 space-y-2">
          {category && onDelete && (
            <button
              type="button"
              onClick={() => { onDelete(category.id); onClose(); }}
              className="w-full py-2 px-3 sm:px-4 rounded-lg bg-gray-900 text-white font-medium text-sm hover:transition-colors"
            >
              削除
            </button>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 px-3 sm:px-4 rounded-lg dark:border-gray-600 text-gray-900 dark:text-gray-200 font-medium text-sm hover:bg-gray-100">
              キャンセル
            </button>
            <button type="submit" className="flex-1 py-2 px-3 sm:px-4 rounded-lg text-white font-medium text-sm transition-colors" style={{ backgroundColor: 'var(--theme-primary)' }}>
              保存
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
