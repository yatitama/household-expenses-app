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
}

export const PaymentMethodModal = ({ paymentMethod, members, accounts, onSave, onClose }: PaymentMethodModalProps) => {
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="premium-card w-full sm:max-w-md md:max-w-lg sm:rounded-xl rounded-t-xl p-5 max-h-[90vh] overflow-y-auto animate-scale-in">
        <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-brand-700 to-accent-700 bg-clip-text text-transparent dark:from-brand-300 dark:to-accent-300">
          {paymentMethod ? '支払い手段を編集' : '支払い手段を追加'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-700 dark:text-brand-300 mb-1">名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 夫クレジットカード"
              className="w-full border border-brand-300 dark:border-brand-600 dark:bg-brand-900 dark:text-brand-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-700 dark:text-brand-300 mb-1">所有者</label>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setMemberId(member.id)}
                  className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                    memberId === member.id
                      ? 'bg-gradient-to-r from-brand-600 to-accent-600 text-white border-accent-600 shadow-accent'
                      : 'bg-white dark:bg-brand-900 text-brand-700 dark:text-brand-300 border-brand-300 dark:border-brand-600 hover:border-brand-400 dark:hover:border-brand-500'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: member.color }} />
                  {member.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-700 dark:text-brand-300 mb-1">種類</label>
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
                  className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                    pmType === value
                      ? 'bg-gradient-to-r from-brand-600 to-accent-600 text-white border-accent-600 shadow-accent'
                      : 'bg-white dark:bg-brand-900 text-brand-700 dark:text-brand-300 border-brand-300 dark:border-brand-600 hover:border-brand-400 dark:hover:border-brand-500'
                  }`}
                >
                  {PM_TYPE_ICONS[value]}
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-700 dark:text-brand-300 mb-1">引き落とし先口座</label>
            {accounts.length === 0 ? (
              <p className="text-sm text-brand-600 dark:text-brand-400">先に口座を登録してください</p>
            ) : (
              <div className="space-y-1">
                {accounts.map((acct) => (
                  <button
                    key={acct.id}
                    type="button"
                    onClick={() => setLinkedAccountId(acct.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                      linkedAccountId === acct.id
                        ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/30 shadow-accent'
                        : 'border-brand-200 dark:border-brand-700 hover:border-brand-300 dark:hover:border-brand-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: acct.color }} />
                      <span className="font-semibold text-brand-900 dark:text-brand-100 text-sm">{acct.name}</span>
                    </div>
                    {linkedAccountId === acct.id && <Check size={16} className="text-accent-600 dark:text-accent-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-700 dark:text-brand-300 mb-1">請求タイミング</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(BILLING_TYPE_LABELS) as [BillingType, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBillingType(value)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                    billingType === value
                      ? 'bg-gradient-to-r from-brand-600 to-accent-600 text-white border-accent-600 shadow-accent'
                      : 'bg-white dark:bg-brand-900 text-brand-700 dark:text-brand-300 border-brand-300 dark:border-brand-600 hover:border-brand-400 dark:hover:border-brand-500'
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
              <div className="bg-brand-50 dark:bg-brand-900 rounded-lg p-3 space-y-3 border border-brand-200 dark:border-brand-800">
                <div>
                  <label className="block text-xs font-medium text-brand-700 dark:text-brand-300 mb-1">締め日</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-brand-600 dark:text-brand-400">毎月</span>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={closingDay}
                      onChange={(e) => setClosingDay(e.target.value)}
                      className="w-16 border border-brand-300 dark:border-brand-600 dark:bg-brand-800 dark:text-brand-100 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-accent-500"
                    />
                    <span className="text-sm text-brand-600 dark:text-brand-400">日</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-700 dark:text-brand-300 mb-1">引き落とし日</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={paymentMonthOffset}
                      onChange={(e) => setPaymentMonthOffset(e.target.value)}
                      className="border border-brand-300 dark:border-brand-600 dark:bg-brand-800 dark:text-brand-100 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
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
                      className="w-16 border border-brand-300 dark:border-brand-600 dark:bg-brand-800 dark:text-brand-100 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-accent-500"
                    />
                    <span className="text-sm text-brand-600 dark:text-brand-400">日</span>
                  </div>
                </div>
                <div className="bg-accent-50 dark:bg-accent-900/30 rounded-lg p-2.5 mt-2 border border-accent-200 dark:border-accent-800">
                  <div className="flex items-start gap-1.5">
                    <Info size={14} className="text-accent-600 dark:text-accent-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-accent-800 dark:text-accent-200 space-y-1">
                      <p className="font-semibold">引き落としの例（{cd}日締め・{offsetLabel}{pd}日払い）</p>
                      <p>1月{cd}日の取引 → <span className="font-semibold">{payMonth1}月{pd}日</span>に引き落とし</p>
                      <p>{nextDayMonth}月{nextDayDate}日の取引 → <span className="font-semibold">{payMonth2}月{pd}日</span>に引き落とし</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <div>
            <label className="block text-sm font-medium text-brand-700 dark:text-brand-300 mb-1">色</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-accent-500 scale-110 shadow-accent dark:ring-offset-brand-900' : 'shadow-card'
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
