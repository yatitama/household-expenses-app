import { useState } from 'react';
import { format } from 'date-fns';
import { X, Edit2, Trash2, PlusCircle, Calendar } from 'lucide-react';
import {
  accountService, transactionService, categoryService,
  memberService, paymentMethodService,
} from '../../../services/storage';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { getCategoryIcon } from '../../../utils/categoryIcons';
import { calculatePaymentDate } from '../../../utils/billingUtils';
import { PM_TYPE_ICONS } from '../AccountIcons';
import { EditTransactionModal } from './EditTransactionModal';
import { revertTransactionBalance, applyTransactionBalance } from '../balanceHelpers';
import type { PaymentMethod, Transaction, TransactionInput } from '../../../types';

interface PMTransactionsModalProps {
  paymentMethod: PaymentMethod;
  onClose: () => void;
  onEdit: (pm: PaymentMethod) => void;
  onAddTransaction: (pm: PaymentMethod) => void;
  onDelete: (pmId: string) => void;
}

export const PMTransactionsModal = ({ paymentMethod, onClose, onEdit, onAddTransaction, onDelete }: PMTransactionsModalProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    return transactionService.getAll()
      .filter((t) => t.paymentMethodId === paymentMethod.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  });
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const allPMs = paymentMethodService.getAll();
  const allAccounts = accountService.getAll();
  const categories = categoryService.getAll();
  const members = memberService.getAll();
  const getCategory = (categoryId: string) => categories.find((c) => c.id === categoryId);

  const refreshTransactions = () => {
    setTransactions(
      transactionService.getAll()
        .filter((t) => t.paymentMethodId === paymentMethod.id)
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
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: paymentMethod.color }}>
                {PM_TYPE_ICONS[paymentMethod.type]}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{paymentMethod.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {paymentMethod.closingDay && paymentMethod.paymentDay
                    ? `${paymentMethod.closingDay}日締 翌${paymentMethod.paymentDay}日払`
                    : '取引履歴'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
              <X size={24} />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onEdit(paymentMethod)}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Edit2 size={16} />
              <span className="text-sm font-medium">編集</span>
            </button>
            <button
              onClick={() => onAddTransaction(paymentMethod)}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
            >
              <PlusCircle size={16} />
              <span className="text-sm font-medium">取引追加</span>
            </button>
            <button
              onClick={() => {
                if (confirm('この支払い手段を削除しますか？')) {
                  onDelete(paymentMethod.id);
                  onClose();
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              <Trash2 size={16} />
              <span className="text-sm font-medium">削除</span>
            </button>
          </div>
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
                      const isExpense = transaction.type === 'expense';
                      const settlementDate = calculatePaymentDate(transaction.date, paymentMethod);
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
