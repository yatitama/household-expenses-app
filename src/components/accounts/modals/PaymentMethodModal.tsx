import { useState } from 'react';
import { Check, Info } from 'lucide-react';
import { PM_TYPE_LABELS, BILLING_TYPE_LABELS, COLORS } from '../constants';
import { PM_TYPE_ICONS } from '../AccountIcons';
import { COMMON_MEMBER_ID } from '../../../types';
import type { Account, PaymentMethod, PaymentMethodType, PaymentMethodInput, BillingType, Member } from '../../../types';

interface PaymentMethodModalProps {
  paymentMethod: PaymentMethod | null;
  members: Member[];
  accounts: Account[];
  onSave: (input: PaymentMethodInput) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export const PaymentMethodModal = ({ paymentMethod, members, accounts, onSave, onClose, onDelete }: PaymentMethodModalProps) => {
  const [name, setName] = useState(paymentMethod?.name || '');
  const [memberId, setMemberId] = useState(paymentMethod?.memberId || COMMON_MEMBER_ID);
  const [pmType, setPmType] = useState<PaymentMethodType>(paymentMethod?.type || 'credit_card');
  const [linkedAccountId, setLinkedAccountId] = useState(paymentMethod?.linkedAccountId || '');
  const [billingType, setBillingType] = useState<BillingType>(paymentMethod?.billingType || 'monthly');
  const [closingDay, setClosingDay] = useState(paymentMethod?.closingDay?.toString() || '15');
  const [paymentDay, setPaymentDay] = useState(paymentMethod?.paymentDay?.toString() || '10');
  const [paymentMonthOffset, setPaymentMonthOffset] = useState(paymentMethod?.paymentMonthOffset?.toString() || '1');
  const [color, setColor] = useState(paymentMethod?.color || COLORS[5]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      memberId,
      type: pmType,
      linkedAccountId,
      billingType,
      closingDay: billingType === 'monthly' ? parseInt(closingDay, 10) || 15 : undefined,
      paymentDay: billingType === 'monthly' ? parseInt(paymentDay, 10) || 10 : undefined,
      paymentMonthOffset: billingType === 'monthly' ? parseInt(paymentMonthOffset, 10) || 1 : undefined,
      color,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 w-full sm:max-w-md md:max-w-lg sm:rounded-xl rounded-t-xl flex flex-col max-h-[90vh]">
        <div className="overflow-y-auto flex-1 p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">{paymentMethod ? '支払い手段を編集' : '支払い手段を追加'}</h3>
          <div className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 夫クレジットカード"
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm sm:text-base transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary-600 focus:border-primary-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">所有者</label>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setMemberId(member.id)}
                  className={`flex items-center gap-2 py-1.5 px-2 sm:py-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${
                    memberId === member.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: member.color }} />
                  {member.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">種類</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(PM_TYPE_LABELS) as [PaymentMethodType, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setPmType(value);
                    if (value === 'credit_card') setBillingType('monthly');
                    if (value === 'debit_card') setBillingType('immediate');
                  }}
                  className={`flex items-center gap-1 sm:gap-2 py-1.5 px-2 sm:py-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${
                    pmType === value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  {PM_TYPE_ICONS[value]}
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">引き落とし先口座</label>
            {accounts.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">先に口座を登録してください</p>
            ) : (
              <div className="space-y-1">
                {accounts.map((acct) => (
                  <button
                    key={acct.id}
                    type="button"
                    onClick={() => setLinkedAccountId(acct.id)}
                    className={`w-full flex items-center justify-between p-2 sm:p-2.5 rounded-lg border transition-colors ${
                      linkedAccountId === acct.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full" style={{ backgroundColor: acct.color }} />
                      <span className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm">{acct.name}</span>
                    </div>
                    {linkedAccountId === acct.id && <Check size={14} className="sm:w-4 sm:h-4 text-blue-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">請求タイミング</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(BILLING_TYPE_LABELS) as [BillingType, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBillingType(value)}
                  className={`py-1.5 px-2 sm:py-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${
                    billingType === value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {billingType === 'monthly' && (() => {
            const cd = parseInt(closingDay, 10) || 15;
            const pd = parseInt(paymentDay, 10) || 10;
            const offset = parseInt(paymentMonthOffset, 10) || 1;
            const offsetLabel = offset === 0 ? '当月' : offset === 1 ? '翌月' : '翌々月';
            const payMonth1 = 1 + offset;
            const payMonth2 = 2 + offset;
            const nextDay = new Date(2025, 0, cd + 1);
            const nextDayMonth = nextDay.getMonth() + 1;
            const nextDayDate = nextDay.getDate();
            return (
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 space-y-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">締め日</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">毎月</span>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={closingDay}
                      onChange={(e) => setClosingDay(e.target.value)}
                      className="w-16 border border-gray-300 dark:border-gray-600 dark:bg-slate-600 dark:text-gray-100 rounded-lg px-2 py-1 text-xs sm:text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-600"
                    />
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">日</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">引き落とし日</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={paymentMonthOffset}
                      onChange={(e) => setPaymentMonthOffset(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 dark:bg-slate-600 dark:text-gray-100 rounded-lg px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                    >
                      <option value="0">当月</option>
                      <option value="1">翌月</option>
                      <option value="2">翌々月</option>
                    </select>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={paymentDay}
                      onChange={(e) => setPaymentDay(e.target.value)}
                      className="w-16 border border-gray-300 dark:border-gray-600 dark:bg-slate-600 dark:text-gray-100 rounded-lg px-2 py-1 text-xs sm:text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-600"
                    />
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">日</span>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2 sm:p-2.5 mt-2">
                  <div className="flex items-start gap-1.5">
                    <Info size={12} className="sm:w-3.5 sm:h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <p className="font-medium">引き落としの例（{cd}日締め・{offsetLabel}{pd}日払い）</p>
                      <p>1月{cd}日の取引 → <span className="font-medium">{payMonth1}月{pd}日</span>に引き落とし</p>
                      <p>{nextDayMonth}月{nextDayDate}日の取引 → <span className="font-medium">{payMonth2}月{pd}日</span>に引き落とし</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">色</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 space-y-2">
          {paymentMethod && onDelete && (
            <button
              type="button"
              onClick={() => { onDelete(paymentMethod.id); onClose(); }}
              className="w-full py-2 px-3 sm:px-4 rounded-lg bg-red-600 text-white font-medium text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-colors"
            >
              削除
            </button>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 px-3 sm:px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-100 font-medium text-sm hover:bg-gray-200 dark:hover:bg-slate-600">
              キャンセル
            </button>
            <button type="submit" className="flex-1 py-2 px-3 sm:px-4 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700">
              保存
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
