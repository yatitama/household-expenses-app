import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { X, Calendar, ArrowRight } from 'lucide-react';
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
 showOnlyUnsettled?: boolean;
}

export const PMTransactionsModal = ({ paymentMethod, onClose, showOnlyUnsettled: initialShowOnlyUnsettled }: PMTransactionsModalProps) => {
 const navigate = useNavigate();
 const [showOnlyUnsettled, setShowOnlyUnsettled] = useState(!!initialShowOnlyUnsettled);
 const [transactions, setTransactions] = useState<Transaction[]>(() => {
 let txns = transactionService.getAll()
 .filter((t) => t.paymentMethodId === paymentMethod.id);

 if (showOnlyUnsettled) {
 txns = txns.filter((t) => !t.settledAt);
 }

 return txns.sort((a, b) => b.date.localeCompare(a.date));
 });
 const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

 const allPMs = paymentMethodService.getAll();
 const allAccounts = accountService.getAll();
 const categories = categoryService.getAll();
 const members = memberService.getAll();
 const getCategory = (categoryId: string) => categories.find((c) => c.id === categoryId);

 const refreshTransactions = () => {
 let txns = transactionService.getAll()
 .filter((t) => t.paymentMethodId === paymentMethod.id);

 if (showOnlyUnsettled) {
 txns = txns.filter((t) => !t.settledAt);
 }

 setTransactions(txns.sort((a, b) => b.date.localeCompare(a.date)));
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
 toast.success('取引を更新しました');
 };

 const handleToggleUnsettledFilter = () => {
 setShowOnlyUnsettled(!showOnlyUnsettled);
 let txns = transactionService.getAll()
 .filter((t) => t.paymentMethodId === paymentMethod.id);

 if (!showOnlyUnsettled) {
 txns = txns.filter((t) => !t.settledAt);
 }

 setTransactions(txns.sort((a, b) => b.date.localeCompare(a.date)));
 };

 const groupedByDate: Record<string, Transaction[]> = {};
 transactions.forEach((t) => {
 if (!groupedByDate[t.date]) groupedByDate[t.date] = [];
 groupedByDate[t.date].push(t);
 });

 return (
 <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-60" onClick={onClose}>
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
 <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 rounded-lg" aria-label="閉じる">
 <X size={24} />
 </button>
 </div>
 </div>

 {/* フィルタボタン */}
 <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-700/50 flex gap-2 items-center">
 <button
 onClick={handleToggleUnsettledFilter}
 className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition-colors ${
 showOnlyUnsettled
 ? 'bg-gray-200 dark:bg-gray-900/30 text-gray-800 dark:text-gray-700'
 : 'bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-500'
 }`}
 >
 {showOnlyUnsettled ? '未精算のみ ✓' : '未精算のみ'}
 </button>
 {showOnlyUnsettled && (
 <button
 onClick={() => {
 navigate('/transactions', {
 state: {
 filterType: 'unsettled',
 paymentMethodIds: [paymentMethod.id],
 },
 });
 onClose();
 }}
 className="px-3 py-1.5 text-xs md:text-sm font-medium rounded-md bg-gray-200 dark:bg-gray-900/30 text-gray-800 dark:text-gray-600 hover:bg-gray-300 dark:hover:bg-gray-900/50 transition-colors flex items-center gap-1"
 >
 履歴を見る <ArrowRight size={14} />
 </button>
 )}
 </div>

 <div className="flex-1 overflow-y-auto p-4 pb-24">
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
 <button
 key={transaction.id}
 onClick={() => setEditingTransaction(transaction)}
 className="w-full p-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
 >
 <div className="flex justify-between items-center">
 <div className="flex items-center gap-3 min-w-0 flex-1">
 <div
 className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
 style={{ backgroundColor: `${category?.color || '#8b7355'}20`, color: category?.color || '#8b7355' }}
 >
 {getCategoryIcon(category?.icon || '', 20)}
 </div>
 <div className="min-w-0 flex-1">
 <p className="font-medium text-gray-900 dark:text-gray-100">{category?.name || '不明'}</p>
 {settlementDate && (
 <div className="flex items-center gap-1 mt-0.5">
 <Calendar size={10} className={isSettled ? 'text-gray-600' : 'text-gray-500'} />
 <p className={`text-sm ${isSettled ? 'text-gray-600 dark:text-gray-600' : 'text-gray-600 dark:text-gray-500'}`}>
 {settlementLabel}{isSettled ? '（精算済）' : ''}
 </p>
 </div>
 )}
 {transaction.memo && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{transaction.memo}</p>}
 </div>
 </div>
 <p className={`font-bold text-sm flex-shrink-0 ml-2 ${isExpense ? 'text-gray-900 dark:text-gray-700' : 'text-gray-700 dark:text-gray-600'}`}>
 {isExpense ? '-' : '+'}{formatCurrency(transaction.amount)}
 </p>
 </div>
 </button>
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
 onDelete={(id) => {
 const transaction = transactionService.getAll().find((t) => t.id === id);
 if (transaction) {
 revertTransactionBalance(transaction);
 transactionService.delete(id);
 refreshTransactions();
 toast.success('取引を削除しました');
 setEditingTransaction(null);
 }
 }}
 />
 </div>
 )}
 </div>
 );
};
