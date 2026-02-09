import { useState } from 'react';
import toast from 'react-hot-toast';
import { X, ToggleLeft, ToggleRight } from 'lucide-react';
import { memberService, linkedPaymentMethodService } from '../../../services/storage';
import { ACCOUNT_TYPE_LABELS } from '../constants';
import type { Account, PaymentMethod, LinkedPaymentMethod, LinkedPaymentMethodInput } from '../../../types';

interface LinkedPaymentMethodModalProps {
  linkedPaymentMethod: LinkedPaymentMethod | null;
  defaultAccountId?: string;
  accounts: Account[];
  paymentMethods: PaymentMethod[];
  onSave: (input: LinkedPaymentMethodInput) => void;
  onClose: () => void;
}

export const LinkedPaymentMethodModal = ({
  linkedPaymentMethod,
  defaultAccountId,
  accounts,
  paymentMethods,
  onSave,
  onClose,
}: LinkedPaymentMethodModalProps) => {
  const members = memberService.getAll();

  const [paymentMethodId, setPaymentMethodId] = useState(linkedPaymentMethod?.paymentMethodId || '');
  const [accountId, setAccountId] = useState(linkedPaymentMethod?.accountId || defaultAccountId || '');
  const [isActive, setIsActive] = useState(linkedPaymentMethod?.isActive ?? true);

  const getMember = (memberId: string) => members.find((m) => m.id === memberId);

  const linkedPMs = linkedPaymentMethodService.getAll();
  const linkedPMIds = linkedPaymentMethod
    ? linkedPMs.filter((lpm) => lpm.id !== linkedPaymentMethod.id).map((lpm) => lpm.paymentMethodId)
    : linkedPMs.map((lpm) => lpm.paymentMethodId);
  const availablePaymentMethods = paymentMethods.filter((pm) => !linkedPMIds.includes(pm.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethodId || !accountId) {
      toast.error('支払い手段と支払い口座を選択してください');
      return;
    }
    onSave({
      paymentMethodId,
      accountId,
      isActive,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 w-full max-w-md sm:rounded-xl rounded-t-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{linkedPaymentMethod ? '支払い手段を編集' : '支払い手段を追加'}</h3>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 rounded-lg" aria-label="閉じる">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">支払い手段</label>
            <select
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-3 py-2.5 text-base transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary-600 focus:border-primary-600"
              required
            >
              <option value="">選択してください</option>
              {availablePaymentMethods.map((pm) => {
                const member = getMember(pm.memberId);
                return (
                  <option key={pm.id} value={pm.id}>
                    {pm.name} {member ? `(${member.name})` : ''}
                  </option>
                );
              })}
            </select>
            {availablePaymentMethods.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">利用可能な支払い手段がありません</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">支払い口座</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-3 py-2.5 text-base transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary-600 focus:border-primary-600"
              required
            >
              <option value="">選択してください</option>
              {accounts.map((acc) => {
                const member = getMember(acc.memberId);
                return (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} {member ? `(${member.name})` : ''} - {ACCOUNT_TYPE_LABELS[acc.type]}
                  </option>
                );
              })}
            </select>
          </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-200">有効</span>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className="flex items-center gap-2"
              >
                {isActive ? (
                  <ToggleRight size={32} className="text-blue-600" />
                ) : (
                  <ToggleLeft size={32} className="text-gray-400 dark:text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 font-medium"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </form>
    </div>
  );
};
