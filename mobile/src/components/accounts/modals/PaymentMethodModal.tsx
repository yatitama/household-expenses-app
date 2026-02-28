import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Trash2, User, Check } from 'lucide-react-native';
import { ModalWrapper } from './ModalWrapper';
import { PM_TYPE_LABELS, BILLING_TYPE_LABELS, COLORS } from '../constants';
import { COMMON_MEMBER_ID } from '../../../types';
import type {
  Account, PaymentMethod, PaymentMethodType,
  PaymentMethodInput, BillingType, Member,
} from '../../../types';

interface PaymentMethodModalProps {
  paymentMethod: PaymentMethod | null;
  members: Member[];
  accounts: Account[];
  onSave: (input: PaymentMethodInput) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export const PaymentMethodModal = ({
  paymentMethod, members, accounts, onSave, onClose, onDelete,
}: PaymentMethodModalProps) => {
  const [name, setName] = useState(paymentMethod?.name ?? '');
  const [memberId, setMemberId] = useState(paymentMethod?.memberId ?? COMMON_MEMBER_ID);
  const [pmType, setPmType] = useState<PaymentMethodType>(paymentMethod?.type ?? 'credit_card');
  const [linkedAccountId, setLinkedAccountId] = useState(paymentMethod?.linkedAccountId ?? '');
  const [billingType, setBillingType] = useState<BillingType>(paymentMethod?.billingType ?? 'monthly');
  const [closingDay, setClosingDay] = useState(paymentMethod?.closingDay?.toString() ?? '15');
  const [paymentDay, setPaymentDay] = useState(paymentMethod?.paymentDay?.toString() ?? '10');
  const [paymentMonthOffset, setPaymentMonthOffset] = useState(paymentMethod?.paymentMonthOffset?.toString() ?? '1');
  const [color, setColor] = useState(paymentMethod?.color ?? COLORS[5]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
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
    <ModalWrapper
      title={paymentMethod ? '支払い手段を編集' : '支払い手段を追加'}
      onClose={onClose}
      isForm
      headerAction={
        paymentMethod && onDelete ? (
          <TouchableOpacity onPress={() => { onDelete(paymentMethod.id); onClose(); }} className="p-1">
            <Trash2 size={15} color="#9ca3af" />
          </TouchableOpacity>
        ) : undefined
      }
      footer={
        <TouchableOpacity onPress={handleSubmit} className="w-full py-3 bg-gray-800 rounded-lg items-center">
          <Text className="text-white font-semibold text-sm">保存</Text>
        </TouchableOpacity>
      }
    >
      <View className="gap-5">
        {/* 名前 */}
        <View>
          <Text className="text-xs font-semibold text-gray-900 dark:text-gray-200 mb-2">名前</Text>
          <TextInput
            className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-gray-900 dark:text-gray-100"
            value={name}
            onChangeText={setName}
            placeholder="例: クレジットカード"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* 種類 */}
        <View>
          <Text className="text-xs font-semibold text-gray-900 dark:text-gray-200 mb-2">種類</Text>
          <View className="flex-row gap-2">
            {(Object.entries(PM_TYPE_LABELS) as [PaymentMethodType, string][]).map(([value, label]) => (
              <TouchableOpacity
                key={value}
                onPress={() => setPmType(value)}
                className={`flex-1 py-2 rounded-lg items-center ${pmType === value ? 'bg-gray-800' : 'bg-gray-100 dark:bg-slate-700'}`}
              >
                <Text className={`text-xs font-medium ${pmType === value ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 所有者 */}
        <View>
          <Text className="text-xs font-semibold text-gray-900 dark:text-gray-200 mb-2">所有者</Text>
          <View className="flex-row flex-wrap gap-2">
            {members.map((member) => (
              <TouchableOpacity
                key={member.id}
                onPress={() => setMemberId(member.id)}
                className={`relative flex-col items-center p-2 rounded-lg min-w-[60px] ${memberId === member.id ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              >
                <View className="w-7 h-7 rounded-full items-center justify-center mb-1" style={{ backgroundColor: `${member.color}30` }}>
                  <User size={14} color={member.color} />
                </View>
                <Text className="text-xs text-gray-900 dark:text-gray-200 text-center">{member.name}</Text>
                {memberId === member.id && (
                  <View className="absolute top-0 right-0">
                    <Check size={12} color="#374151" strokeWidth={2.5} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 引き落とし口座 */}
        <View>
          <Text className="text-xs font-semibold text-gray-900 dark:text-gray-200 mb-2">引き落とし口座</Text>
          <View className="gap-2">
            <TouchableOpacity
              onPress={() => setLinkedAccountId('')}
              className={`py-2 px-3 rounded-lg border ${!linkedAccountId ? 'border-gray-800 bg-gray-50 dark:bg-slate-700' : 'border-gray-200 dark:border-gray-600'}`}
            >
              <Text className="text-sm text-gray-700 dark:text-gray-300">未設定</Text>
            </TouchableOpacity>
            {accounts.map((acc) => (
              <TouchableOpacity
                key={acc.id}
                onPress={() => setLinkedAccountId(acc.id)}
                className={`py-2 px-3 rounded-lg border ${linkedAccountId === acc.id ? 'border-gray-800 bg-gray-50 dark:bg-slate-700' : 'border-gray-200 dark:border-gray-600'}`}
              >
                <Text className="text-sm text-gray-700 dark:text-gray-300">{acc.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 精算タイプ */}
        <View>
          <Text className="text-xs font-semibold text-gray-900 dark:text-gray-200 mb-2">精算タイプ</Text>
          <View className="flex-row gap-2">
            {(Object.entries(BILLING_TYPE_LABELS) as [BillingType, string][]).map(([value, label]) => (
              <TouchableOpacity
                key={value}
                onPress={() => setBillingType(value)}
                className={`flex-1 py-2 rounded-lg items-center ${billingType === value ? 'bg-gray-800' : 'bg-gray-100 dark:bg-slate-700'}`}
              >
                <Text className={`text-xs font-medium ${billingType === value ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {billingType === 'monthly' && (
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-gray-900 dark:text-gray-200 mb-2">締め日</Text>
              <TextInput
                className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-gray-900 dark:text-gray-100"
                value={closingDay}
                onChangeText={setClosingDay}
                keyboardType="numeric"
                placeholder="15"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-gray-900 dark:text-gray-200 mb-2">支払い日</Text>
              <TextInput
                className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-gray-900 dark:text-gray-100"
                value={paymentDay}
                onChangeText={setPaymentDay}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>
        )}

        {/* 色 */}
        <View>
          <Text className="text-xs font-semibold text-gray-900 dark:text-gray-200 mb-2">色</Text>
          <View className="flex-row flex-wrap gap-2">
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                className="w-8 h-8 rounded-full"
                style={{
                  backgroundColor: c,
                  borderWidth: color === c ? 3 : 0,
                  borderColor: '#374151',
                }}
              />
            ))}
          </View>
        </View>
      </View>
    </ModalWrapper>
  );
};
