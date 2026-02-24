import { useState, useRef } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Wallet, CreditCard, Check, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  accountService, transactionService, categoryService,
  paymentMethodService, quickAddTemplateService,
} from '../services/storage';
import { getCategoryIcon } from '../utils/categoryIcons';
import { QuickAddTemplateGridSection } from '../components/quickAdd/QuickAddTemplateGridSection';
import { QuickAddTemplateModal } from '../components/quickAdd/QuickAddTemplateModal';
import type { TransactionType, TransactionInput, QuickAddTemplate, QuickAddTemplateInput } from '../types';

type TabType = TransactionType | 'transfer';

export const AddTransactionPage = () => {
  const location = useLocation();
  const template = (location.state as { template?: QuickAddTemplate })?.template;
  const amountInputRef = useRef<HTMLInputElement>(null);

  const allAccounts = accountService.getAll();
  const allPaymentMethods = paymentMethodService.getAll();
  const categories = categoryService.getAll();

  const [tab, setTab] = useState<TabType>(() => template?.type || 'expense');
  const [amount, setAmount] = useState(() => template?.amount ? String(template.amount) : '');
  const [categoryId, setCategoryId] = useState(() => template?.categoryId || '');
  const [selectedSourceId, setSelectedSourceId] = useState(() => template?.accountId || template?.paymentMethodId || '');
  const [date, setDate] = useState(() => template?.date || format(new Date(), 'yyyy-MM-dd'));
  const [memo, setMemo] = useState(() => template?.memo || '');

  // 振替用
  const [transferFromAccountId, setTransferFromAccountId] = useState(() => template?.fromAccountId || '');
  const [transferFee, setTransferFee] = useState(() => template?.fee ? String(template.fee) : '');

  const [quickAddTemplates, setQuickAddTemplates] = useState<QuickAddTemplate[]>(() =>
    quickAddTemplateService.getAll()
  );
  const [editingQuickAddTemplate, setEditingQuickAddTemplate] = useState<QuickAddTemplate | null>(null);
  const [isQuickAddTemplateModalOpen, setIsQuickAddTemplateModalOpen] = useState(false);

  // 収支タブ用
  const type: TransactionType = tab === 'transfer' ? 'income' : tab;
  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (tab === 'transfer') {
      if (!amount || !transferFromAccountId || !selectedSourceId) {
        toast.error('金額、入金元、入金先を入力してください');
        return;
      }
      if (transferFromAccountId === selectedSourceId) {
        toast.error('入金元と入金先は別の口座を選択してください');
        return;
      }

      const parsedAmount = parseInt(amount, 10);
      const parsedFee = transferFee ? parseInt(transferFee, 10) : 0;

      const fromAccount = accountService.getById(transferFromAccountId);
      const toAccount = accountService.getById(selectedSourceId);

      if (!fromAccount || !toAccount) {
        toast.error('口座が見つかりません');
        return;
      }

      // 振替: 入金元から振替額＋手数料を引き、入金先に振替額を加える
      accountService.update(transferFromAccountId, { balance: fromAccount.balance - parsedAmount - parsedFee });
      accountService.update(selectedSourceId, { balance: toAccount.balance + parsedAmount });

      // 手数料を支出Transactionとして記録
      if (parsedFee > 0) {
        const expenseCategories = categories.filter((c) => c.type === 'expense');
        const feeCategory = expenseCategories.find((c) => c.name === 'その他') ?? expenseCategories[0];
        if (feeCategory) {
          transactionService.create({
            type: 'expense',
            amount: parsedFee,
            categoryId: feeCategory.id,
            accountId: transferFromAccountId,
            date: format(new Date(), 'yyyy-MM-dd'),
            memo: '振替手数料',
          });
        }
      }

      toast.success('振替を登録しました');
      resetForm('transfer');
      window.scrollTo(0, 0);
      return;
    }

    if (!amount || !categoryId || !selectedSourceId) {
      toast.error('金額、カテゴリ、支払い元を入力してください');
      return;
    }

    const parsedAmount = parseInt(amount, 10);

    // Find if selected source is account or payment method
    const account = allAccounts.find((a) => a.id === selectedSourceId);
    const paymentMethod = allPaymentMethods.find((p) => p.id === selectedSourceId);

    const input: TransactionInput = {
      type,
      amount: parsedAmount,
      categoryId,
      accountId: account?.id || '',
      paymentMethodId: paymentMethod?.id,
      date,
      memo: memo || undefined,
    };

    transactionService.create(input);

    if (paymentMethod) {
      if (paymentMethod.billingType === 'immediate' && paymentMethod.linkedAccountId) {
        const linkedAccount = accountService.getById(paymentMethod.linkedAccountId);
        if (linkedAccount) {
          const newBalance = type === 'expense' ? linkedAccount.balance - parsedAmount : linkedAccount.balance + parsedAmount;
          accountService.update(paymentMethod.linkedAccountId, { balance: newBalance });
        }
        const allTx = transactionService.getAll();
        const lastTx = allTx[allTx.length - 1];
        if (lastTx) {
          transactionService.update(lastTx.id, { settledAt: new Date().toISOString() });
        }
      }
    } else if (account) {
      const newBalance = type === 'expense' ? account.balance - parsedAmount : account.balance + parsedAmount;
      accountService.update(account.id, { balance: newBalance });
    }

    toast.success('取引を追加しました');
    resetForm();
    window.scrollTo(0, 0);
  };

  const handleQuickAddTemplateClick = (tpl: QuickAddTemplate) => {
    setTab(tpl.type);
    setAmount(tpl.amount ? String(tpl.amount) : '');
    if (tpl.type === 'transfer') {
      setTransferFromAccountId(tpl.fromAccountId || '');
      setSelectedSourceId(tpl.accountId || '');
      setTransferFee(tpl.fee ? String(tpl.fee) : '');
    } else {
      setCategoryId(tpl.categoryId || '');
      setSelectedSourceId(tpl.accountId || tpl.paymentMethodId || '');
      setDate(tpl.date || format(new Date(), 'yyyy-MM-dd'));
    }
    setMemo(tpl.memo || '');
    toast.success(`「${tpl.name}」を反映しました`);

    if (!tpl.amount) {
      // iOS Safari では setTimeout 内の focus() はキーボードを表示しない。
      // ユーザー操作の同期コールスタック内で直接 focus() を呼ぶことが必須。
      // window.scrollTo(0, 0) も呼ばない（scrollIntoView と競合するため）。
      amountInputRef.current?.focus();
      amountInputRef.current?.select();
      // React 再レンダリング後にスクロール位置を調整（キーボード表示には影響しない）
      requestAnimationFrame(() => {
        amountInputRef.current?.scrollIntoView({ block: 'center' });
      });
    } else {
      window.scrollTo(0, 0);
    }
  };

  const handleSaveQuickAddTemplate = (input: QuickAddTemplateInput) => {
    try {
      if (editingQuickAddTemplate) {
        quickAddTemplateService.update(editingQuickAddTemplate.id, input);
        toast.success('クイック入力を更新しました');
      } else {
        quickAddTemplateService.create(input);
        toast.success('クイック入力を作成しました');
      }
      setQuickAddTemplates(quickAddTemplateService.getAll());
      setIsQuickAddTemplateModalOpen(false);
      setEditingQuickAddTemplate(null);
    } catch {
      toast.error('クイック入力の保存に失敗しました');
    }
  };

  const handleDeleteQuickAddTemplate = () => {
    if (editingQuickAddTemplate) {
      quickAddTemplateService.delete(editingQuickAddTemplate.id);
      toast.success('クイック入力を削除しました');
      setQuickAddTemplates(quickAddTemplateService.getAll());
      setIsQuickAddTemplateModalOpen(false);
      setEditingQuickAddTemplate(null);
    }
  };

  const resetForm = (currentTab: TabType = 'expense') => {
    setTab(currentTab);
    setAmount('');
    if (currentTab === 'transfer') {
      setSelectedSourceId('');  // 入金先をリセット、入金元は維持
      setTransferFee('');
    } else {
      setTransferFromAccountId('');
      setTransferFee('');
    }
    setMemo('');
  };

  const isTransferSubmitDisabled = !amount || !transferFromAccountId || !selectedSourceId || transferFromAccountId === selectedSourceId;
  const isTransactionSubmitDisabled = !amount || !categoryId || !selectedSourceId;

  return (
    <div className="bg-white dark:bg-slate-900 pb-32 md:pb-20">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 w-full max-w-md mx-auto"
      >
        <div className="flex items-center justify-between p-3 sm:p-4 border-b dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">取引を追加</h2>
          <Link to="/" className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" aria-label="閉じる">
            <X size={18} />
          </Link>
        </div>
        <div className="p-3 sm:p-4">
            <div className="space-y-4 sm:space-y-5">
              <div className="flex rounded-lg overflow-hidden dark:border-gray-600">
                <button
                  type="button"
                  onClick={() => { setTab('expense'); setCategoryId(''); }}
                  className={`flex-1 py-2 sm:py-2.5 font-medium text-sm transition-colors ${
                    tab === 'expense' ? 'btn-primary text-white' : 'bg-gray-100 text-gray-900 dark:text-gray-200'
                  }`}
                >
                  支出
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('income'); setCategoryId(''); }}
                  className={`flex-1 py-2 sm:py-2.5 font-medium text-sm transition-colors ${
                    tab === 'income' ? 'btn-primary text-white' : 'bg-gray-100 text-gray-900 dark:text-gray-200'
                  }`}
                >
                  収入
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('transfer'); setCategoryId(''); }}
                  className={`flex-1 py-2 sm:py-2.5 font-medium text-sm transition-colors ${
                    tab === 'transfer' ? 'btn-primary text-white' : 'bg-gray-100 text-gray-900 dark:text-gray-200'
                  }`}
                >
                  振替
                </button>
              </div>

              {allAccounts.length > 0 && (
                <QuickAddTemplateGridSection
                  templates={quickAddTemplates.filter((t) => t.type === tab)}
                  onTemplateClick={handleQuickAddTemplateClick}
                  onEditClick={(tpl) => {
                    setEditingQuickAddTemplate(tpl);
                    setIsQuickAddTemplateModalOpen(true);
                  }}
                  onAddClick={() => {
                    setEditingQuickAddTemplate(null);
                    setIsQuickAddTemplateModalOpen(true);
                  }}
                />
              )}

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">金額</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">¥</span>
                  <input
                    ref={amountInputRef}
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full text-lg sm:text-xl font-bold pl-8 pr-3 py-2 bg-gray-50 dark:bg-slate-700 dark:border-gray-600 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    required
                  />
                </div>
              </div>

              {tab !== 'transfer' && (
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">カテゴリ</label>
                  <div className="grid grid-cols-4 gap-2">
                    {filteredCategories.map((category) => {
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setCategoryId(category.id)}
                          className={`relative flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-lg transition-colors ${
                            categoryId === category.id
                              ? 'bg-gray-100 dark:bg-gray-700'
                              : ''
                          }`}
                        >
                          <div
                            className="w-6 sm:w-7 h-6 sm:h-7 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${category.color}20`, color: category.color }}
                          >
                            {getCategoryIcon(category.icon, 14)}
                          </div>
                          <span className="text-[10px] sm:text-xs text-gray-900 dark:text-gray-200 break-words w-full text-center leading-tight">
                            {category.name}
                          </span>
                          {categoryId === category.id && (
                            <div className="absolute -top-1 -right-1">
                              <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {tab === 'transfer' && (
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">入金元</label>
                  <div className="grid grid-cols-4 gap-2">
                    {allAccounts.map((acct) => {
                      const isDisabled = acct.id === selectedSourceId;
                      return (
                        <button
                          key={acct.id}
                          type="button"
                          onClick={() => setTransferFromAccountId(acct.id)}
                          disabled={isDisabled}
                          className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                            isDisabled
                              ? 'opacity-30 cursor-not-allowed'
                              : transferFromAccountId === acct.id
                              ? 'bg-gray-100 dark:bg-gray-700'
                              : ''
                          }`}
                        >
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${acct.color || '#9ca3af'}20`, color: acct.color || '#9ca3af' }}
                          >
                            <Wallet size={16} />
                          </div>
                          <span className="text-[10px] sm:text-xs text-gray-900 dark:text-gray-200 break-words w-full text-center leading-tight">
                            {acct.name}
                          </span>
                          {transferFromAccountId === acct.id && (
                            <div className="absolute -top-1 -right-1">
                              <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
                  {tab === 'expense' ? '支払い元' : '入金先'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {allAccounts.map((acct) => {
                    const isDisabled = tab === 'transfer' && acct.id === transferFromAccountId;
                    return (
                      <button
                        key={acct.id}
                        type="button"
                        onClick={() => setSelectedSourceId(acct.id)}
                        disabled={isDisabled}
                        className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                          isDisabled
                            ? 'opacity-30 cursor-not-allowed'
                            : selectedSourceId === acct.id
                            ? 'bg-gray-100 dark:bg-gray-700'
                            : ''
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${acct.color || '#9ca3af'}20`, color: acct.color || '#9ca3af' }}
                        >
                          <Wallet size={16} />
                        </div>
                        <span className="text-[10px] sm:text-xs text-gray-900 dark:text-gray-200 break-words w-full text-center leading-tight">
                          {acct.name}
                        </span>
                        {selectedSourceId === acct.id && (
                          <div className="absolute -top-1 -right-1">
                            <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                          </div>
                        )}
                      </button>
                    );
                  })}

                  {tab === 'expense' && allPaymentMethods.map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setSelectedSourceId(pm.id)}
                      className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                        selectedSourceId === pm.id
                          ? 'bg-gray-100 dark:bg-gray-700'
                          : ''
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${pm.color || '#9ca3af'}20`, color: pm.color || '#9ca3af' }}
                      >
                        <CreditCard size={16} />
                      </div>
                      <span className="text-[10px] sm:text-xs text-gray-900 dark:text-gray-200 break-words w-full text-center leading-tight">
                        {pm.name}
                      </span>
                      {selectedSourceId === pm.id && (
                        <div className="absolute -top-1 -right-1">
                          <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {tab === 'transfer' && (
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">振替手数料</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">¥</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={transferFee}
                      onChange={(e) => setTransferFee(e.target.value)}
                      placeholder="0（任意）"
                      className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-slate-700 dark:border-gray-600 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    />
                  </div>
                </div>
              )}

              {tab !== 'transfer' && (
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">日付</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-700 rounded-lg px-2 py-2 text-xs border border-gray-200 dark:border-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-600 appearance-none"
                  />
                </div>
              )}

              {tab !== 'transfer' && (
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">メモ</label>
                  <input
                    type="text"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="任意"
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:border-gray-600 dark:text-gray-100 rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
              )}
            </div>
          </div>
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-20 bg-white dark:bg-slate-900 border-t dark:border-gray-700">
          <div className="max-w-md mx-auto p-3 sm:p-4">
            <button
              type="submit"
              disabled={tab === 'transfer' ? isTransferSubmitDisabled : isTransactionSubmitDisabled}
              className="w-full py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg btn-primary text-white font-medium text-sm disabled:opacity-50 transition-colors"
            >
              登録
            </button>
          </div>
        </div>
        </form>
      {isQuickAddTemplateModalOpen && (
        <QuickAddTemplateModal
          template={editingQuickAddTemplate}
          defaultType={tab}
          categories={categories}
          accounts={allAccounts}
          paymentMethods={allPaymentMethods}
          isOpen={isQuickAddTemplateModalOpen}
          onSave={handleSaveQuickAddTemplate}
          onClose={() => {
            setIsQuickAddTemplateModalOpen(false);
            setEditingQuickAddTemplate(null);
          }}
          onDelete={editingQuickAddTemplate ? handleDeleteQuickAddTemplate : undefined}
        />
      )}
    </div>
  );
};
