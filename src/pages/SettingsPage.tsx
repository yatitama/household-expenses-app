import { useState, useCallback, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Database, Download, Upload, Trash2, Users, Tag, ChevronDown, ChevronUp, Plus, CreditCard, RefreshCw, PiggyBank, X, Check, GripVertical } from 'lucide-react';
import { accountService, transactionService, categoryService, memberService, paymentMethodService, recurringPaymentService, cardBillingService, linkedPaymentMethodService, savingsGoalService } from '../services/storage';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { ICON_COMPONENTS, ICON_NAMES, getCategoryIcon } from '../utils/categoryIcons';
import { SAVINGS_GOAL_ICONS, SAVINGS_GOAL_ICON_NAMES } from '../utils/savingsGoalIcons';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog';
import { COLORS } from '../components/accounts/constants';
import { PaymentMethodModal } from '../components/accounts/modals/PaymentMethodModal';
import { RecurringPaymentModal } from '../components/accounts/modals/RecurringPaymentModal';
import { calculateMonthlyAmount, toYearMonth, getMonthsInRange, getTargetMonth } from '../utils/savingsUtils';
import type { Member, MemberInput, Category, CategoryInput, TransactionType, PaymentMethod, PaymentMethodInput, RecurringPayment, RecurringPaymentInput, Account, SavingsGoal, SavingsGoalInput } from '../types';

export const SettingsPage = () => {
  // デフォルトで全セクション折りたたみ（モバイルファースト）
  const [membersOpen, setMembersOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [cardsOpen, setCardsOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [dataManagementOpen, setDataManagementOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>(() => memberService.getAll());
  const [categories, setCategories] = useState<Category[]>(() => categoryService.getAll());
  const [categoryFilterType, setCategoryFilterType] = useState<TransactionType>('expense');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => paymentMethodService.getAll());
  const [accounts, setAccounts] = useState<Account[]>(() => accountService.getAll());
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>(() => recurringPaymentService.getAll());
  const [recurringFilterType, setRecurringFilterType] = useState<TransactionType>('expense');
  const [savingsOpen, setSavingsOpen] = useState(false);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => savingsGoalService.getAll());

  // Savings modal state
  const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);
  const [editingSavingsGoal, setEditingSavingsGoal] = useState<SavingsGoal | null>(null);

  // Member modal state
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Category modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Card modal state
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<PaymentMethod | null>(null);

  // Recurring modal state
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringPayment | null>(null);

  // Confirm dialog state
  const [confirmDialogState, setConfirmDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Drag and drop state for categories
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null);
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const categoryListRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<number | null>(null);

  useBodyScrollLock(isMemberModalOpen || isCategoryModalOpen || isCardModalOpen || isRecurringModalOpen || isSavingsModalOpen);

  const refreshMembers = useCallback(() => setMembers(memberService.getAll()), []);
  const refreshCategories = useCallback(() => setCategories(categoryService.getAll()), []);
  const refreshPaymentMethods = useCallback(() => setPaymentMethods(paymentMethodService.getAll()), []);
  const refreshRecurringPayments = useCallback(() => setRecurringPayments(recurringPaymentService.getAll()), []);
  const refreshSavingsGoals = useCallback(() => setSavingsGoals(savingsGoalService.getAll()), []);

  // 必須フィールドが欠けている古い形式の定期取引を自動削除
  useEffect(() => {
    const all = recurringPaymentService.getAll();
    const invalid = all.filter(
      (rp) => rp.amount == null || rp.periodValue == null || !['months', 'days'].includes(rp.periodType)
    );
    if (invalid.length > 0) {
      invalid.forEach((rp) => recurringPaymentService.delete(rp.id));
      refreshRecurringPayments();
      toast.success(`古い形式の定期取引 ${invalid.length}件を削除しました`);
    }
  }, [refreshRecurringPayments]);

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

  // Category reorder handlers (touch and mouse compatible)
  const handleCategoryTouchStart = (categoryId: string, e: React.TouchEvent) => {
    e.preventDefault();
    setDraggedCategoryId(categoryId);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleCategoryTouchMove = (_categoryId: string, e: React.TouchEvent) => {
    if (!draggedCategoryId || !touchStartY) return;

    e.preventDefault();
    const currentY = e.touches[0].clientY;
    const filtered = filteredCategories;
    const draggedIndex = filtered.findIndex((c) => c.id === draggedCategoryId);

    // Auto-scroll logic
    const scrollThreshold = 80;
    const maxScrollSpeed = 8;
    const viewport = window.innerHeight;

    if (currentY < scrollThreshold) {
      // Scroll up
      const distance = scrollThreshold - currentY;
      const scrollSpeed = Math.min(maxScrollSpeed, (distance / scrollThreshold) * maxScrollSpeed);
      if (autoScrollIntervalRef.current) clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = setInterval(() => {
        window.scrollBy(0, -scrollSpeed);
      }, 16);
    } else if (currentY > viewport - scrollThreshold) {
      // Scroll down
      const distance = currentY - (viewport - scrollThreshold);
      const scrollSpeed = Math.min(maxScrollSpeed, (distance / scrollThreshold) * maxScrollSpeed);
      if (autoScrollIntervalRef.current) clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = setInterval(() => {
        window.scrollBy(0, scrollSpeed);
      }, 16);
    } else {
      // Stop auto-scroll
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    }

    // Find target category based on touch position
    const elements = Array.from(document.querySelectorAll('[data-category-id]')) as HTMLElement[];
    let targetIndex = draggedIndex;

    for (let i = 0; i < elements.length; i++) {
      const rect = elements[i].getBoundingClientRect();
      if (currentY >= rect.top && currentY <= rect.bottom) {
        const targetId = elements[i].getAttribute('data-category-id');
        targetIndex = filtered.findIndex((c) => c.id === targetId);
        break;
      }
    }

    if (targetIndex !== -1) {
      setDragOverCategoryId(filtered[targetIndex].id);
    }
  };

  const handleCategoryTouchEnd = () => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }

    if (!draggedCategoryId || !dragOverCategoryId || draggedCategoryId === dragOverCategoryId) {
      setDraggedCategoryId(null);
      setDragOverCategoryId(null);
      setTouchStartY(null);
      return;
    }

    const filtered = filteredCategories;
    const draggedIndex = filtered.findIndex((c) => c.id === draggedCategoryId);
    const targetIndex = filtered.findIndex((c) => c.id === dragOverCategoryId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedCategoryId(null);
      setDragOverCategoryId(null);
      setTouchStartY(null);
      return;
    }

    // Create new array with reordered items
    const reordered = [...filtered];
    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedItem);

    // Update orders: assign new order based on position in reordered array
    const orders = reordered.map((cat, index) => ({
      id: cat.id,
      order: index,
    }));

    categoryService.updateOrders(orders);
    refreshCategories();

    setDraggedCategoryId(null);
    setDragOverCategoryId(null);
    setTouchStartY(null);
    toast.success('カテゴリの順序を変更しました');
  };

  // Desktop drag and drop handlers (fallback)
  const handleCategoryDragStart = (categoryId: string) => {
    setDraggedCategoryId(categoryId);
  };

  const handleCategoryDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleCategoryDragEnter = (categoryId: string) => {
    setDragOverCategoryId(categoryId);
  };

  const handleCategoryDragLeave = () => {
    setDragOverCategoryId(null);
  };

  const handleCategoryDrop = (targetCategoryId: string) => {
    if (!draggedCategoryId || draggedCategoryId === targetCategoryId) {
      setDraggedCategoryId(null);
      setDragOverCategoryId(null);
      return;
    }

    const filtered = filteredCategories;
    const draggedIndex = filtered.findIndex((c) => c.id === draggedCategoryId);
    const targetIndex = filtered.findIndex((c) => c.id === targetCategoryId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedCategoryId(null);
      setDragOverCategoryId(null);
      return;
    }

    // Create new array with reordered items
    const reordered = [...filtered];
    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedItem);

    // Update orders: assign new order based on position in reordered array
    const orders = reordered.map((cat, index) => ({
      id: cat.id,
      order: index,
    }));

    categoryService.updateOrders(orders);
    refreshCategories();

    setDraggedCategoryId(null);
    setDragOverCategoryId(null);
    toast.success('カテゴリの順序を変更しました');
  };

  // Card handlers
  const handleAddCard = () => { setEditingCard(null); setIsCardModalOpen(true); };
  const handleEditCard = (pm: PaymentMethod) => { setEditingCard(pm); setIsCardModalOpen(true); };
  const handleDeleteCard = (id: string) => {
    setConfirmDialogState({
      isOpen: true,
      title: 'カードを削除',
      message: 'このカードを削除してもよろしいですか？',
      onConfirm: () => {
        paymentMethodService.delete(id);
        refreshPaymentMethods();
        toast.success('カードを削除しました');
      },
    });
  };
  const handleSaveCard = (input: PaymentMethodInput) => {
    if (editingCard) {
      paymentMethodService.update(editingCard.id, input);
      toast.success('カードを更新しました');
    } else {
      paymentMethodService.create(input);
      toast.success('カードを追加しました');
    }
    refreshPaymentMethods();
    setAccounts(accountService.getAll());
    setIsCardModalOpen(false);
  };

  // Recurring handlers
  const handleAddRecurring = () => { setEditingRecurring(null); setIsRecurringModalOpen(true); };
  const handleEditRecurring = (rp: RecurringPayment) => { setEditingRecurring(rp); setIsRecurringModalOpen(true); };
  const handleDeleteRecurring = (id: string) => {
    setConfirmDialogState({
      isOpen: true,
      title: '定期取引を削除',
      message: 'この定期取引を削除してもよろしいですか？',
      onConfirm: () => {
        recurringPaymentService.delete(id);
        refreshRecurringPayments();
        toast.success('定期取引を削除しました');
      },
    });
  };
  const handleSaveRecurring = (input: RecurringPaymentInput) => {
    if (editingRecurring) {
      recurringPaymentService.update(editingRecurring.id, input);
      toast.success('定期取引を更新しました');
    } else {
      recurringPaymentService.create(input);
      toast.success('定期取引を追加しました');
    }
    refreshRecurringPayments();
    setIsRecurringModalOpen(false);
  };

  // Savings handlers
  const handleAddSavingsGoal = () => { setEditingSavingsGoal(null); setIsSavingsModalOpen(true); };
  const handleEditSavingsGoal = (goal: SavingsGoal) => { setEditingSavingsGoal(goal); setIsSavingsModalOpen(true); };
  const handleDeleteSavingsGoal = (id: string) => {
    setConfirmDialogState({
      isOpen: true,
      title: '貯金を削除',
      message: 'この貯金目標を削除してもよろしいですか？',
      onConfirm: () => {
        savingsGoalService.delete(id);
        refreshSavingsGoals();
        toast.success('貯金目標を削除しました');
      },
    });
  };
  const handleSaveSavingsGoal = (input: SavingsGoalInput) => {
    if (editingSavingsGoal) {
      savingsGoalService.update(editingSavingsGoal.id, input);
      toast.success('貯金目標を更新しました');
    } else {
      savingsGoalService.create(input);
      toast.success('貯金目標を追加しました');
    }
    refreshSavingsGoals();
    setIsSavingsModalOpen(false);
  };

  // Data management
  const handleExport = () => {
    const data = {
      members: memberService.getAll(),
      accounts: accountService.getAll(),
      transactions: transactionService.getAll(),
      categories: categoryService.getAll(),
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
      <div className="bg-white rounded-lg sm:rounded-xl overflow-hidden">
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
      <div className="bg-white rounded-lg sm:rounded-xl overflow-hidden">
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
                  categoryFilterType === 'expense' ? 'text-white' : 'bg-white text-gray-900 dark:text-gray-200'
                }`}
                style={categoryFilterType === 'expense' ? { backgroundColor: 'var(--theme-primary)' } : {}}
              >
                支出
              </button>
              <button
                onClick={() => setCategoryFilterType('income')}
                className={`flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
                  categoryFilterType === 'income' ? 'text-white' : 'bg-white text-gray-900 dark:text-gray-200'
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
              <div ref={categoryListRef} className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredCategories.map((category) => {
                  const isDragged = draggedCategoryId === category.id;
                  const isDragOver = dragOverCategoryId === category.id;
                  return (
                    <div
                      key={category.id}
                      data-category-id={category.id}
                      draggable
                      onDragStart={() => handleCategoryDragStart(category.id)}
                      onDragOver={handleCategoryDragOver}
                      onDragEnter={() => handleCategoryDragEnter(category.id)}
                      onDragLeave={handleCategoryDragLeave}
                      onDrop={() => handleCategoryDrop(category.id)}
                      className={`w-full flex items-center gap-2.5 sm:gap-3 py-2.5 sm:py-3 transition-colors select-none ${
                        isDragged ? 'opacity-50' : ''
                      } ${isDragOver ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                    >
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="flex-1 flex items-center gap-2.5 sm:gap-3 text-left"
                      >
                        <div
                          className="w-8 sm:w-9 h-8 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${category.color}20`, color: category.color }}
                        >
                          {getCategoryIcon(category.icon, 16)}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">{category.name}</p>
                        </div>
                      </button>
                      <div
                        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 flex-shrink-0 touch-none"
                        onTouchStart={(e) => handleCategoryTouchStart(category.id, e)}
                        onTouchMove={(e) => handleCategoryTouchMove(category.id, e)}
                        onTouchEnd={handleCategoryTouchEnd}
                      >
                        <GripVertical size={16} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* カード管理 */}
      <div className="bg-white rounded-lg sm:rounded-xl overflow-hidden">
        <button
          aria-label={cardsOpen ? 'カード管理を折りたたむ' : 'カード管理を展開'}
          onClick={() => setCardsOpen(!cardsOpen)}
          className="w-full flex items-center justify-between p-3 sm:p-3.5 md:p-4 hover:bg-gray-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:focus-visible:outline-primary-400 rounded-lg"
          aria-expanded={cardsOpen}
        >
          <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
            <CreditCard size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-gray-700 dark:text-gray-600" />
            <div className="text-left">
              <p className="text-xs sm:text-sm md:text-base font-medium text-gray-900 dark:text-gray-100">カード管理</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">カードを追加・編集</p>
            </div>
          </div>
          {cardsOpen ? <ChevronUp size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-gray-400" /> : <ChevronDown size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-gray-400" />}
        </button>

        {cardsOpen && (
          <div className="border-t dark:border-gray-700 p-3 sm:p-3.5 md:p-4 space-y-2.5 sm:space-y-3">
            <button
              onClick={handleAddCard}
              className="w-full flex items-center justify-center gap-2 text-white py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              <Plus size={16} />
              カードを追加
            </button>

            {paymentMethods.length === 0 ? (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center py-4">カードがありません</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {paymentMethods.map((pm) => {
                  const owner = getMember(pm.memberId);
                  return (
                    <button
                      key={pm.id}
                      onClick={() => handleEditCard(pm)}
                      className="w-full flex items-center gap-2.5 sm:gap-3 py-2.5 sm:py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div
                        className="w-8 sm:w-9 h-8 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${pm.color}20`, color: pm.color }}
                      >
                        <CreditCard size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">{pm.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{owner?.name || '共通'}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 定期取引管理 */}
      <div className="bg-white rounded-lg sm:rounded-xl overflow-hidden">
        <button
          aria-label={recurringOpen ? '定期取引管理を折りたたむ' : '定期取引管理を展開'}
          onClick={() => setRecurringOpen(!recurringOpen)}
          className="w-full flex items-center justify-between p-3 sm:p-3.5 md:p-4 hover:bg-gray-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:focus-visible:outline-primary-400 rounded-lg"
          aria-expanded={recurringOpen}
        >
          <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
            <RefreshCw size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-gray-700 dark:text-gray-600" />
            <div className="text-left">
              <p className="text-xs sm:text-sm md:text-base font-medium text-gray-900 dark:text-gray-100">定期取引管理</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">定期支出・収入を追加・編集</p>
            </div>
          </div>
          {recurringOpen ? <ChevronUp size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-gray-400" /> : <ChevronDown size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-gray-400" />}
        </button>

        {recurringOpen && (
          <div className="border-t dark:border-gray-700 p-3 sm:p-3.5 md:p-4 space-y-2.5 sm:space-y-3">
            {/* Type toggle */}
            <div className="flex rounded-lg overflow-hidden dark:border-gray-600">
              <button
                onClick={() => setRecurringFilterType('expense')}
                className={`flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
                  recurringFilterType === 'expense' ? 'text-white' : 'bg-white text-gray-900 dark:text-gray-200'
                }`}
                style={recurringFilterType === 'expense' ? { backgroundColor: 'var(--theme-primary)' } : {}}
              >
                支出
              </button>
              <button
                onClick={() => setRecurringFilterType('income')}
                className={`flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
                  recurringFilterType === 'income' ? 'text-white' : 'bg-white text-gray-900 dark:text-gray-200'
                }`}
                style={recurringFilterType === 'income' ? { backgroundColor: 'var(--theme-primary)' } : {}}
              >
                収入
              </button>
            </div>

            <button
              onClick={handleAddRecurring}
              className="w-full flex items-center justify-center gap-2 text-white py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              <Plus size={16} />
              定期取引を追加
            </button>

            {recurringPayments.filter((rp) => rp.type === recurringFilterType).length === 0 ? (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center py-4">定期取引がありません</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {recurringPayments.filter((rp) => rp.type === recurringFilterType).map((rp) => {
                  const cat = categories.find((c) => c.id === rp.categoryId);
                  return (
                  <button
                    key={rp.id}
                    onClick={() => handleEditRecurring(rp)}
                    className="w-full flex items-center gap-2.5 sm:gap-3 py-2.5 sm:py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div
                      className="w-8 sm:w-9 h-8 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${cat?.color || '#6b7280'}20`,
                        color: cat?.color || '#6b7280',
                      }}
                    >
                      {cat ? getCategoryIcon(cat.icon, 16) : <RefreshCw size={16} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">{rp.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">¥{rp.amount.toLocaleString()}</p>
                    </div>
                  </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 貯金管理 */}
      <div className="bg-white rounded-lg sm:rounded-xl overflow-hidden">
        <button
          aria-label={savingsOpen ? '貯金管理を折りたたむ' : '貯金管理を展開'}
          onClick={() => setSavingsOpen(!savingsOpen)}
          className="w-full flex items-center justify-between p-3 sm:p-3.5 md:p-4 hover:bg-gray-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:focus-visible:outline-primary-400 rounded-lg"
          aria-expanded={savingsOpen}
        >
          <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
            <PiggyBank size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-gray-700 dark:text-gray-600" />
            <div className="text-left">
              <p className="text-xs sm:text-sm md:text-base font-medium text-gray-900 dark:text-gray-100">貯金管理</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">貯金目標を追加・編集</p>
            </div>
          </div>
          {savingsOpen ? <ChevronUp size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-gray-400" /> : <ChevronDown size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-gray-400" />}
        </button>

        {savingsOpen && (
          <div className="border-t dark:border-gray-700 p-3 sm:p-3.5 md:p-4 space-y-2.5 sm:space-y-3">
            <button
              onClick={handleAddSavingsGoal}
              className="w-full flex items-center justify-center gap-2 text-white py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              <Plus size={16} />
              貯金目標を追加
            </button>

            {savingsGoals.length === 0 ? (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center py-4">貯金目標がありません</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {savingsGoals.map((goal) => {
                  const monthly = calculateMonthlyAmount(goal);
                  const targetMonth = getTargetMonth(goal.targetDate);
                  const allMonths = getMonthsInRange(goal.startMonth, targetMonth);
                  const activeCount = allMonths.filter((m) => !goal.excludedMonths.includes(m)).length;
                  return (
                    <button
                      key={goal.id}
                      onClick={() => handleEditSavingsGoal(goal)}
                      className="w-full flex items-center gap-2.5 sm:gap-3 py-2.5 sm:py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div
                        className="w-8 sm:w-9 h-8 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${goal.color || '#059669'}20`, color: goal.color || '#059669' }}
                      >
                        {(() => {
                          const IconComponent = SAVINGS_GOAL_ICONS[goal.icon as keyof typeof SAVINGS_GOAL_ICONS] || SAVINGS_GOAL_ICONS.PiggyBank;
                          return <IconComponent size={16} />;
                        })()}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">{goal.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          目標: ¥{goal.targetAmount.toLocaleString()} / {goal.startMonth}〜{goal.targetDate.substring(0, 7)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          月¥{monthly.toLocaleString()} ({activeCount}ヶ月)
                        </p>
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
      <div className="bg-white rounded-lg sm:rounded-xl overflow-hidden">
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
      <div className="bg-white rounded-xl p-4">
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
          onSave={handleSaveCategory}
          onClose={() => setIsCategoryModalOpen(false)}
          onDelete={handleDeleteCategory}
        />
      )}

      {/* Card Modal */}
      {isCardModalOpen && (
        <PaymentMethodModal
          paymentMethod={editingCard}
          members={members}
          accounts={accounts}
          onSave={handleSaveCard}
          onClose={() => { setIsCardModalOpen(false); setEditingCard(null); }}
          onDelete={editingCard ? handleDeleteCard : undefined}
        />
      )}

      {/* Recurring Modal */}
      {isRecurringModalOpen && (
        <RecurringPaymentModal
          recurringPayment={editingRecurring}
          onSave={handleSaveRecurring}
          onClose={() => { setIsRecurringModalOpen(false); setEditingRecurring(null); }}
          onDelete={editingRecurring ? handleDeleteRecurring : undefined}
        />
      )}

      {/* Savings Goal Modal */}
      {isSavingsModalOpen && (
        <SavingsGoalModal
          goal={editingSavingsGoal}
          onSave={handleSaveSavingsGoal}
          onClose={() => { setIsSavingsModalOpen(false); setEditingSavingsGoal(null); }}
          onDelete={editingSavingsGoal ? handleDeleteSavingsGoal : undefined}
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
  const [icon, setIcon] = useState(member?.icon || '');
  const [budget, setBudget] = useState(member?.budget?.toString() || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const budgetValue = budget ? Number(budget) : undefined;
    onSave({ name, color, icon: icon || undefined, isDefault: member?.isDefault, ...(budgetValue !== undefined && { budget: budgetValue }) });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-60" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 w-full sm:max-w-md sm:rounded-xl rounded-t-xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 sm:p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">{member ? 'メンバーを編集' : 'メンバーを追加'}</h3>
            {member && !member.isDefault && onDelete && (
              <button
                type="button"
                onClick={() => { onDelete(member); onClose(); }}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="削除"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-3 sm:p-4">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">名前</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 太郎"
                className="w-full bg-gray-50 dark:bg-slate-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">アイコン</label>
              <div className="grid grid-cols-8 gap-2">
                {ICON_NAMES.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(icon === iconName ? '' : iconName)}
                    className={`relative w-8 sm:w-10 h-8 sm:h-10 rounded-lg flex items-center justify-center transition-all ${
                      icon === iconName
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {getCategoryIcon(iconName, 16)}
                    {icon === iconName && (
                      <div className="absolute -top-1 -right-1">
                        <Check size={12} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">未選択の場合は名前の頭文字が表示されます。</p>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">色</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      color === c ? 'ring-2 ring-offset-2 ring-primary-600 scale-110 dark:ring-offset-slate-800' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">月予算額</label>
              <input
                type="number"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="予算を設定（オプション）"
                className="w-full bg-gray-50 dark:bg-slate-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">このメンバーの月予算を設定できます。空欄の場合は予算なしになります。</p>
            </div>
          </div>
        </div>
        <div className="border-t dark:border-gray-700 p-3 sm:p-4">
          <button type="submit" className="w-full py-2 px-3 sm:px-4 rounded-lg text-white font-medium text-sm transition-colors hover:opacity-90" style={{ backgroundColor: 'var(--theme-primary)' }}>
            保存
          </button>
        </div>
      </form>
    </div>
  );
};

// Category Modal
interface CategoryModalProps {
  category: Category | null;
  type: TransactionType;
  onSave: (input: CategoryInput) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

const CategoryModal = ({ category, type, onSave, onClose, onDelete }: CategoryModalProps) => {
  const [name, setName] = useState(category?.name || '');
  const [color, setColor] = useState(category?.color || COLORS[0]);
  const [icon, setIcon] = useState(category?.icon || ICON_NAMES[0]);
  const [budget, setBudget] = useState(category?.budget?.toString() || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const budgetValue = budget ? Number(budget) : undefined;
    onSave({ name, type, color, icon, ...(budgetValue !== undefined && { budget: budgetValue }) });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-60" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 w-full sm:max-w-md sm:rounded-xl rounded-t-xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 sm:p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">{category ? 'カテゴリを編集' : 'カテゴリを追加'}</h3>
            {category && onDelete && (
              <button
                type="button"
                onClick={() => { onDelete(category.id); onClose(); }}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="削除"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-3 sm:p-4">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">名前</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 食費"
                className="w-full bg-gray-50 dark:bg-slate-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">色</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      color === c ? 'ring-2 ring-offset-2 ring-primary-600 scale-110 dark:ring-offset-slate-800' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">アイコン</label>
              <div className="grid grid-cols-6 gap-2">
                {ICON_NAMES.map((i) => {
                  const IconComponent = ICON_COMPONENTS[i];
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIcon(i)}
                      className={`relative w-8 sm:w-10 h-8 sm:h-10 rounded-lg flex items-center justify-center transition-colors ${
                        icon === i
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <IconComponent size={16} className="sm:w-5 sm:h-5" />
                      {icon === i && (
                        <div className="absolute -top-1 -right-1">
                          <Check size={12} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            {type === 'expense' && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">月予算額（支出カテゴリのみ）</label>
                <input
                  type="number"
                  min="0"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="予算を設定（オプション）"
                  className="w-full bg-gray-50 dark:bg-slate-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">このカテゴリの月予算を設定できます。空欄の場合は予算なしになります。</p>
              </div>
            )}
          </div>
        </div>
        <div className="border-t dark:border-gray-700 p-3 sm:p-4">
          <button type="submit" className="w-full py-2 px-3 sm:px-4 rounded-lg text-white font-medium text-sm transition-colors hover:opacity-90" style={{ backgroundColor: 'var(--theme-primary)' }}>
            保存
          </button>
        </div>
      </form>
    </div>
  );
};

// Savings Goal Modal
interface SavingsGoalModalProps {
  goal: SavingsGoal | null;
  onSave: (input: SavingsGoalInput) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

const SavingsGoalModal = ({ goal, onSave, onClose, onDelete }: SavingsGoalModalProps) => {
  const todayYM = toYearMonth(new Date());
  const [name, setName] = useState(goal?.name || '');
  const [targetAmount, setTargetAmount] = useState(goal ? String(goal.targetAmount) : '');
  const [targetDate, setTargetDate] = useState(goal?.targetDate?.substring(0, 7) || '');
  const [startMonth, setStartMonth] = useState(goal?.startMonth ?? todayYM);
  const [icon, setIcon] = useState(goal?.icon || 'PiggyBank');
  const [color, setColor] = useState(goal?.color || '#059669');

  // プレビュー: 毎月の貯金額を計算
  const previewMonthly = (() => {
    const amount = parseInt(targetAmount, 10);
    if (!amount || !targetDate) return null;
    if (targetDate < startMonth) return null;
    const allMonths = getMonthsInRange(startMonth, targetDate);
    const excludedMonths = goal?.excludedMonths ?? [];
    const activeMonths = allMonths.filter((m) => !excludedMonths.includes(m));
    if (activeMonths.length === 0) return amount;
    return Math.ceil(amount / activeMonths.length);
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(targetAmount, 10);
    if (!amount || !targetDate) return;
    onSave({
      name,
      targetAmount: amount,
      targetDate,
      startMonth,
      excludedMonths: goal?.excludedMonths ?? [],
      icon,
      color,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-60" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 w-full sm:max-w-md sm:rounded-xl rounded-t-xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 sm:p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">{goal ? '貯金目標を編集' : '貯金目標を追加'}</h3>
            {goal && onDelete && (
              <button
                type="button"
                onClick={() => { onDelete(goal.id); onClose(); }}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="削除"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-3 sm:p-4">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">貯金名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 夏休み旅行貯金"
                className="w-full bg-gray-50 dark:bg-slate-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">目標金額 (円)</label>
              <input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="例: 100000"
                min="1"
                className="w-full bg-gray-50 dark:bg-slate-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">いつから</label>
              <input
                type="month"
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">いつまで</label>
              <input
                type="month"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">色</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      color === c ? 'ring-2 ring-offset-2 ring-primary-600 scale-110 dark:ring-offset-slate-800' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">アイコン</label>
              <div className="grid grid-cols-6 gap-2">
                {SAVINGS_GOAL_ICON_NAMES.map((iconName) => {
                  const IconComponent = SAVINGS_GOAL_ICONS[iconName];
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setIcon(iconName)}
                      className={`relative w-8 sm:w-10 h-8 sm:h-10 rounded-lg flex items-center justify-center transition-colors ${
                        icon === iconName
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <IconComponent size={16} className="sm:w-5 sm:h-5" />
                      {icon === iconName && (
                        <div className="absolute -top-1 -right-1">
                          <Check size={12} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="border-t dark:border-gray-700 p-3 sm:p-4 space-y-2">
          {previewMonthly !== null && (
            <div className="flex justify-end mb-2">
              <div className="text-right">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-0.5">毎月の貯金額</p>
                <p className="text-lg font-bold" style={{ color: 'var(--theme-primary)' }}>¥{previewMonthly.toLocaleString()}</p>
              </div>
            </div>
          )}
          <button type="submit" className="w-full py-2 px-3 sm:px-4 rounded-lg text-white font-medium text-sm transition-colors hover:opacity-90" style={{ backgroundColor: 'var(--theme-primary)' }}>
            保存
          </button>
        </div>
      </form>
    </div>
  );
};
