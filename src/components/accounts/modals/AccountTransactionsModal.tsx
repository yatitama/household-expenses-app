import { useState } from 'react';
import { format } from 'date-fns';
import { X, Edit2, Trash2, CreditCard, Calendar } from 'lucide-react';
import {
  accountService, transactionService, categoryService,
  memberService, paymentMethodService,
} from '../../../services/storage';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { getCategoryIcon } from '../../../utils/categoryIcons';
import { calculatePaymentDate } from '../../../utils/billingUtils';
import { ACCOUNT_TYPE_ICONS } from '../AccountIcons';
import { EditTransactionModal } from './EditTransactionModal';
import { revertTransactionBalance, applyTransactionBalance } from '../balanceHelpers';
import type { Account, Transaction, TransactionInput } from '../../../types';

interface AccountTransactionsModalProps {
  account: Account;
  onClose: () => void;
}

export const AccountTransactionsModal = ({ account, onClose }: AccountTransactionsModalProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const allTransactions = transactionService.getAll();
    const allPMs = paymentMethodService.getAll();
    const linkedPMIds = allPMs
      .filter((pm) => pm.linkedAccountId === account.id)
      .map((pm) => pm.id);
    return allTransactions
      .filter((t) => t.accountId === account.id || (t.paymentMethodId && linkedPMIds.includes(t.paymentMethodId)))
      .sort((a, b) => b.date.localeCompare(a.date));
  });
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const allPMs = paymentMethodService.getAll();
  const allAccounts = accountService.getAll();
  const categories = categoryService.getAll();
  const members = memberService.getAll();
  const getCategory = (categoryId: string) => categories.find((c) => c.id === categoryId);
  const getPM = (pmId?: string) => pmId ? allPMs.find((p) => p.id === pmId) : undefined;

  const refreshTransactions = () => {
    const allTransactions = transactionService.getAll();
    const linkedPMIds = allPMs
      .filter((pm) => pm.linkedAccountId === account.id)
      .map((pm) => pm.id);
    setTransactions(
      allTransactions
        .filter((t) => t.accountId === account.id || (t.paymentMethodId && linkedPMIds.includes(t.paymentMethodId)))
        .sort((a, b) => b.date.localeCompare(a.date))
    );
  };

  const handleDelete = (transaction: Transaction) => {
    if (!confirm('この取引を削除しますか？')) return;
    revertTransactionBalance(transaction);
    transactionService.delete(transaction.id);
    refreshTransactions();
  };

  const handleSaveEdit = (input: TransactionInput) => {
    if (!editingTransaction) return;
    revertTransactionBalance(editingTransaction);
    applyTransactionBalance(input);
    transactionService.update(editingTransaction.id, {
      ...input,
      settledAt: undefined,
    });
    refreshTransactions();
    setEditingTransaction(null);
  };

  const groupedByDate: Record<string, Transaction[]> = {};
  transactions.forEach((t) => {
    if (!groupedByDate[t.date]) groupedByDate[t.date] = [];
    groupedByDate[t.date].push(t);
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 w-full sm:max-w-2xl md:max-w-4xl sm:rounded-xl rounded-t-xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: account.color }}>
              {ACCOUNT_TYPE_ICONS[account.type]}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{account.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">取引履歴</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">取引がありません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedByDate).map(([date, dayTransactions]) => (
                <div key={date}>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{formatDate(date)}</h4>
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                    {dayTransactions.map((transaction) => {
                      const category = getCategory(transaction.categoryId);
                      const pm = getPM(transaction.paymentMethodId);
                      const isExpense = transaction.type === 'expense';
                      const settlementDate = pm ? calculatePaymentDate(transaction.date, pm) : null;
                      const settlementLabel = settlementDate ? format(settlementDate, 'M/d') + '引落' : null;
                      const isSettled = !!transaction.settledAt;
                      return (
                        <div key={transaction.id} className="p-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${category?.color || '#6b7280'}20`, color: category?.color || '#6b7280' }}
                              >
                                {getCategoryIcon(category?.icon || '', 20)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 dark:text-gray-100">{category?.name || '不明'}</p>
                                {pm && (
                                  <div className="flex items-center gap-1">
                                    <CreditCard size={10} className="text-purple-400 flex-shrink-0" />
                                    <p className="text-xs text-purple-500 dark:text-purple-400 truncate">{pm.name}</p>
                                  </div>
                                )}
                                {settlementDate && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Calendar size={10} className={isSettled ? 'text-green-400' : 'text-orange-400'} />
                                    <p className={`text-[11px] ${isSettled ? 'text-green-500 dark:text-green-400' : 'text-orange-500 dark:text-orange-400'}`}>
                                      {settlementLabel}{isSettled ? '（精算済）' : ''}
                                    </p>
                                  </div>
                                )}
                                {transaction.memo && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{transaction.memo}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                              <p className={`font-bold text-sm ${isExpense ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                {isExpense ? '-' : '+'}{formatCurrency(transaction.amount)}
                              </p>
                              <button onClick={() => setEditingTransaction(transaction)} className="p-1.5 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => handleDelete(transaction)} className="p-1.5 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editingTransaction && (
        <div onClick={(e) => e.stopPropagation()}>
          <EditTransactionModal
            transaction={editingTransaction}
            accounts={allAccounts}
            paymentMethods={allPMs}
            categories={categories}
            members={members}
            onSave={handleSaveEdit}
            onClose={() => setEditingTransaction(null)}
          />
        </div>
      )}
    </div>
  );
};
