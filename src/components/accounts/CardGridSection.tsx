import { RefreshCw, CreditCard, User } from 'lucide-react';
import { ACCOUNT_TYPE_ICONS_LG } from './AccountIcons';
import { CircularGauge } from './CircularGauge';
import { formatCurrency } from '../../utils/formatters';
import { getCategoryIcon } from '../../utils/categoryIcons';
import { getEffectiveRecurringAmount } from '../../utils/savingsUtils';
import type { Transaction, Category, PaymentMethod, Member, Account, RecurringPayment } from '../../types';

export type CardGridViewMode = 'category' | 'payment' | 'member';

interface CardGridSectionProps {
  transactions: Transaction[];
  categories: Category[];
  paymentMethods?: PaymentMethod[];
  members?: Member[];
  accounts?: Account[];
  viewMode?: CardGridViewMode;
  onCategoryClick?: (category: Category | undefined, transactions: Transaction[], recurringPayments: RecurringPayment[], displayName?: string, displayColor?: string, displayIconType?: 'account' | 'user') => void;
  recurringPayments?: RecurringPayment[];
  recurringLabel?: string;
  onRecurringClick?: () => void;
  emptyMessage?: string;
  month?: string; // yyyy-MM
}

export const CardGridSection = ({
  transactions,
  categories,
  paymentMethods = [],
  members = [],
  accounts = [],
  viewMode = 'category',
  onCategoryClick,
  recurringPayments = [],
  recurringLabel = '定期',
  onRecurringClick,
  emptyMessage = '利用なし',
  month = '',
}: CardGridSectionProps) => {
  // カテゴリ別グルーピング（取引 + 定期）
  const categoryGrouped = transactions.reduce(
    (acc, t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      const key = t.categoryId || '__none__';
      if (!acc[key]) {
        acc[key] = { category: cat, amount: 0, transactions: [] };
      }
      acc[key].amount += t.type === 'expense' ? t.amount : -t.amount;
      acc[key].transactions.push(t);
      return acc;
    },
    {} as Record<string, { category: Category | undefined; amount: number; transactions: Transaction[] }>
  );
  // カテゴリが設定された定期支払いを既存バケットにマージ
  for (const rp of recurringPayments) {
    if (!rp.categoryId) continue;
    const cat = categories.find((c) => c.id === rp.categoryId);
    if (!categoryGrouped[rp.categoryId]) {
      categoryGrouped[rp.categoryId] = { category: cat, amount: 0, transactions: [] };
    }
    const effectiveAmount = month ? getEffectiveRecurringAmount(rp, month) : rp.amount;
    categoryGrouped[rp.categoryId].amount += rp.type === 'expense' ? effectiveAmount : -effectiveAmount;
  }

  // 支払い元別グルーピング（取引 + 定期）
  const paymentGrouped = transactions.reduce(
    (acc, t) => {
      const key = t.paymentMethodId ?? `__account__${t.accountId}`;
      const pm = paymentMethods.find((p) => p.id === t.paymentMethodId);
      const linkedAccount = pm
        ? accounts.find((a) => a.id === pm.linkedAccountId)
        : accounts.find((a) => a.id === t.accountId);
      if (!acc[key]) {
        acc[key] = { paymentMethod: pm, account: linkedAccount, name: pm?.name ?? linkedAccount?.name ?? '現金', amount: 0, transactions: [] };
      }
      acc[key].amount += t.type === 'expense' ? t.amount : -t.amount;
      acc[key].transactions.push(t);
      return acc;
    },
    {} as Record<string, { paymentMethod: PaymentMethod | undefined; account: Account | undefined; name: string; amount: number; transactions: Transaction[] }>
  );
  // 支払い元が設定された定期支払いをマージ（カードまたは口座で振り分け）
  for (const rp of recurringPayments) {
    const effectiveAmount = month ? getEffectiveRecurringAmount(rp, month) : rp.amount;
    const signedAmount = rp.type === 'expense' ? effectiveAmount : -effectiveAmount;
    if (rp.paymentMethodId) {
      const pm = paymentMethods.find((p) => p.id === rp.paymentMethodId);
      const linkedAccount = pm ? accounts.find((a) => a.id === pm.linkedAccountId) : undefined;
      if (!paymentGrouped[rp.paymentMethodId]) {
        paymentGrouped[rp.paymentMethodId] = { paymentMethod: pm, account: linkedAccount, name: pm?.name ?? '現金', amount: 0, transactions: [] };
      }
      paymentGrouped[rp.paymentMethodId].amount += signedAmount;
    } else if (rp.accountId) {
      const acc = accounts.find((a) => a.id === rp.accountId);
      const key = `__account__${rp.accountId}`;
      if (!paymentGrouped[key]) {
        paymentGrouped[key] = { paymentMethod: undefined, account: acc, name: acc?.name ?? '口座', amount: 0, transactions: [] };
      }
      paymentGrouped[key].amount += signedAmount;
    }
  }

  // メンバー別グルーピング（accountId → account.memberId → member）（取引 + 定期）
  const memberGrouped = transactions.reduce(
    (acc, t) => {
      const account = accounts.find((a) => a.id === t.accountId);
      const memberId = account?.memberId || '__unknown__';
      const member = members.find((m) => m.id === memberId);
      if (!acc[memberId]) {
        acc[memberId] = { member, name: member?.name ?? '不明', amount: 0, transactions: [] };
      }
      acc[memberId].amount += t.type === 'expense' ? t.amount : -t.amount;
      acc[memberId].transactions.push(t);
      return acc;
    },
    {} as Record<string, { member: Member | undefined; name: string; amount: number; transactions: Transaction[] }>
  );
  // 口座が設定された定期支払いをメンバーバケットにマージ
  for (const rp of recurringPayments) {
    if (!rp.accountId) continue;
    const account = accounts.find((a) => a.id === rp.accountId);
    const memberId = account?.memberId || '__unknown__';
    const member = members.find((m) => m.id === memberId);
    if (!memberGrouped[memberId]) {
      memberGrouped[memberId] = { member, name: member?.name ?? '不明', amount: 0, transactions: [] };
    }
    const effectiveAmount = month ? getEffectiveRecurringAmount(rp, month) : rp.amount;
    memberGrouped[memberId].amount += rp.type === 'expense' ? effectiveAmount : -effectiveAmount;
  }

  const sortedCategoryEntries = Object.entries(categoryGrouped).sort((a, b) => {
    const aIdx = categories.findIndex((c) => c.id === a[1].category?.id);
    const bIdx = categories.findIndex((c) => c.id === b[1].category?.id);
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
  const sortedPaymentEntries = Object.entries(paymentGrouped).sort((a, b) => {
    const aIdx = paymentMethods.findIndex((p) => p.id === a[1].paymentMethod?.id);
    const bIdx = paymentMethods.findIndex((p) => p.id === b[1].paymentMethod?.id);
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
  const sortedMemberEntries = Object.entries(memberGrouped).sort((a, b) => {
    const aIdx = members.findIndex((m) => m.id === a[1].member?.id);
    const bIdx = members.findIndex((m) => m.id === b[1].member?.id);
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  // 各モードで「未分類」の定期支払い
  const uncategorizedRecurring = recurringPayments.filter((rp) => !rp.categoryId);
  const unassignedPaymentRecurring = recurringPayments.filter((rp) => !rp.paymentMethodId && !rp.accountId);
  const unassignedMemberRecurring = recurringPayments.filter((rp) => !rp.accountId);

  const uncategorizedTotal = uncategorizedRecurring.reduce((sum, rp) => {
    const effectiveAmount = month ? getEffectiveRecurringAmount(rp, month) : rp.amount;
    return sum + effectiveAmount;
  }, 0);
  const unassignedPaymentTotal = unassignedPaymentRecurring.reduce((sum, rp) => {
    const effectiveAmount = month ? getEffectiveRecurringAmount(rp, month) : rp.amount;
    return sum + effectiveAmount;
  }, 0);
  const unassignedMemberTotal = unassignedMemberRecurring.reduce((sum, rp) => {
    const effectiveAmount = month ? getEffectiveRecurringAmount(rp, month) : rp.amount;
    return sum + effectiveAmount;
  }, 0);

  const showRecurringTileCategory = uncategorizedRecurring.length > 0;
  const showRecurringTilePayment = unassignedPaymentRecurring.length > 0;
  const showRecurringTileMember = unassignedMemberRecurring.length > 0;

  const hasContent =
    viewMode === 'category'
      ? sortedCategoryEntries.length > 0 || showRecurringTileCategory
      : viewMode === 'payment'
      ? sortedPaymentEntries.length > 0 || showRecurringTilePayment
      : sortedMemberEntries.length > 0 || showRecurringTileMember;

  if (!hasContent) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg p-1.5 md:p-2">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-1.5 md:p-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {viewMode === 'category'
          ? sortedCategoryEntries.map(([, { category, amount, transactions: catTransactions }]) => {
              const catRecurring = recurringPayments.filter((rp) => rp.categoryId === category?.id);
              const progress = category?.budget ? Math.min(100, (amount / category.budget) * 100) : 0;
              const gaugeColor = category?.color || '#6b7280';
              return (
              <button
                key={category?.id ?? '__none__'}
                onClick={() => onCategoryClick?.(category, catTransactions, catRecurring)}
                className="border border-gray-200 dark:border-gray-700 px-0 py-1.5 md:py-2 flex flex-col gap-2 hover:opacity-80 transition-all text-left relative overflow-hidden"
              >
                {/* Background Icon */}
                <div
                  className="absolute -left-2 -bottom-2 opacity-10 dark:opacity-20 pointer-events-none"
                  style={{ color: gaugeColor }}
                >
                  {getCategoryIcon(category?.icon || '', 80)}
                </div>

                {/* Content */}
                <div className="relative z-10 flex items-center gap-2 justify-between px-1 py-0.5">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate bg-white/80 dark:bg-slate-900/80 px-1 rounded">
                      {category?.name || 'その他'}
                    </p>
                  </div>
                  {category?.budget ? (
                    <CircularGauge progress={progress} color={gaugeColor} size={24} />
                  ) : null}
                </div>
                <p className="relative z-10 text-right text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(amount)}{category?.budget ? ` / ${formatCurrency(category.budget)}` : ''}
                </p>
              </button>
            );})
          : viewMode === 'payment'
          ? sortedPaymentEntries.map(([key, { paymentMethod, account: entryAccount, name, amount, transactions: pmTransactions }]) => {
              const cardColor = entryAccount?.color || '#6b7280';
              const pmRecurring = key.startsWith('__account__')
                ? recurringPayments.filter((rp) => !rp.paymentMethodId && rp.accountId === key.slice('__account__'.length))
                : recurringPayments.filter((rp) => rp.paymentMethodId === key);
              const budget = paymentMethod?.budget;
              const progress = budget ? Math.min(100, (amount / budget) * 100) : 0;
              return (
                <button
                  key={key}
                  onClick={() => onCategoryClick?.(undefined, pmTransactions, pmRecurring, name, cardColor, 'account')}
                  className="border border-gray-200 dark:border-gray-700 px-0 py-1.5 md:py-2 flex flex-col gap-2 hover:opacity-80 transition-all text-left relative overflow-hidden"
                >
                  {/* Background Icon */}
                  <div
                    className="absolute -left-2 -bottom-2 opacity-10 dark:opacity-20 pointer-events-none"
                    style={{ color: cardColor }}
                  >
                    {entryAccount ? ACCOUNT_TYPE_ICONS_LG[entryAccount.type] : <CreditCard size={80} />}
                  </div>

                  {/* Content */}
                  <div className="relative z-10 flex items-center gap-1.5 justify-between px-1 py-0.5">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate bg-white/80 dark:bg-slate-900/80 px-1 rounded">
                        {name}
                      </p>
                    </div>
                    {budget ? (
                      <CircularGauge progress={progress} color={cardColor} size={24} />
                    ) : null}
                  </div>
                  <p className="relative z-10 text-right text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(amount)}{budget ? ` / ${formatCurrency(budget)}` : ''}
                  </p>
                </button>
              );
            })
          : sortedMemberEntries.map(([key, { member, name, amount, transactions: memberTransactions }]) => {
              const memberRecurring = recurringPayments.filter((rp) => {
                const acct = accounts.find((a) => a.id === rp.accountId);
                return (acct?.memberId || '__unknown__') === key;
              });
              const memberColor = member?.color || '#6b7280';
              const budget = member?.budget;
              const progress = budget ? Math.min(100, (amount / budget) * 100) : 0;
              return (
              <button
                key={key}
                onClick={() => onCategoryClick?.(undefined, memberTransactions, memberRecurring, name, memberColor, 'user')}
                className="border border-gray-200 dark:border-gray-700 px-0 py-1.5 md:py-2 flex flex-col gap-2 hover:opacity-80 transition-all text-left relative overflow-hidden"
              >
                {/* Background Icon */}
                <div
                  className="absolute -left-2 -bottom-2 opacity-10 dark:opacity-20 pointer-events-none"
                  style={{ color: memberColor }}
                >
                  <User size={80} />
                </div>

                {/* Content */}
                <div className="relative z-10 flex items-center gap-1.5 justify-between px-1 py-0.5">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate bg-white/80 dark:bg-slate-900/80 px-1 rounded">
                      {name}
                    </p>
                  </div>
                  {budget ? (
                    <CircularGauge progress={progress} color={memberColor} size={24} />
                  ) : null}
                </div>
                <p className="relative z-10 text-right text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(amount)}{budget ? ` / ${formatCurrency(budget)}` : ''}
                </p>
              </button>
            );})}

        {/* 未分類の定期アイテムは末尾に表示 */}
        {viewMode === 'category' && showRecurringTileCategory && (
          <button
            onClick={onRecurringClick}
            className="border border-gray-200 dark:border-gray-700 px-0 py-1.5 md:py-2 flex flex-col gap-2 hover:opacity-80 transition-all text-left relative overflow-hidden"
          >
            {/* Background Icon */}
            <div className="absolute -left-2 -bottom-2 opacity-10 dark:opacity-20 pointer-events-none blur-sm text-gray-400">
              <RefreshCw size={80} />
            </div>

            {/* Content */}
            <div className="relative z-10 flex items-center gap-1.5 px-1 py-0.5">
              <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate bg-white/80 dark:bg-slate-900/80 px-1 rounded">
                {recurringLabel}
              </p>
            </div>
            <p className="relative z-10 text-right text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(uncategorizedTotal)}
            </p>
          </button>
        )}
        {viewMode === 'payment' && showRecurringTilePayment && (
          <button
            onClick={onRecurringClick}
            className="border border-gray-200 dark:border-gray-700 px-0 py-1.5 md:py-2 flex flex-col gap-2 hover:opacity-80 transition-all text-left relative overflow-hidden"
          >
            {/* Background Icon */}
            <div className="absolute -left-2 -bottom-2 opacity-10 dark:opacity-20 pointer-events-none text-gray-400">
              <RefreshCw size={80} />
            </div>

            {/* Content */}
            <div className="relative z-10 flex items-center gap-1.5">
              <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate bg-white/80 dark:bg-slate-900/80 px-1 rounded">
                {recurringLabel}
              </p>
            </div>
            <p className="relative z-10 text-right text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(unassignedPaymentTotal)}
            </p>
          </button>
        )}
        {viewMode === 'member' && showRecurringTileMember && (
          <button
            onClick={onRecurringClick}
            className="border border-gray-200 dark:border-gray-700 px-0 py-1.5 md:py-2 flex flex-col gap-2 hover:opacity-80 transition-all text-left relative overflow-hidden"
          >
            {/* Background Icon */}
            <div className="absolute -left-2 -bottom-2 opacity-10 dark:opacity-20 pointer-events-none text-gray-400">
              <RefreshCw size={80} />
            </div>

            {/* Content */}
            <div className="relative z-10 flex items-center gap-1.5">
              <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate bg-white/80 dark:bg-slate-900/80 px-1 rounded">
                {recurringLabel}
              </p>
            </div>
            <p className="relative z-10 text-right text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(unassignedMemberTotal)}
            </p>
          </button>
        )}
      </div>
    </div>
  );
};
