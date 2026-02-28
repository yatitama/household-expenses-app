import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Trash2, User, Check } from 'lucide-react-native';
import { ModalWrapper } from './ModalWrapper';
import { ACCOUNT_TYPE_LABELS, COLORS } from '../constants';
import { ACCOUNT_TYPE_ICONS } from '../AccountIcons';
import { COMMON_MEMBER_ID } from '../../../types';
import type { Account, AccountType, AccountInput, Member } from '../../../types';

interface AccountModalProps {
  account: Account | null;
  members: Member[];
  onSave: (input: AccountInput) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export const AccountModal = ({ account, members, onSave, onClose, onDelete }: AccountModalProps) => {
  const [name, setName] = useState(account?.name ?? '');
  const [memberId, setMemberId] = useState(account?.memberId ?? COMMON_MEMBER_ID);
  const [accountType, setAccountType] = useState<AccountType>(account?.type ?? 'bank');
  const [balance, setBalance] = useState(account?.balance.toString() ?? '0');
  const [color, setColor] = useState(account?.color ?? COLORS[0]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      memberId,
      type: accountType,
      balance: parseInt(balance, 10) || 0,
      color,
    });
  };

  return (
    <ModalWrapper
      title={account ? '口座を編集' : '口座を追加'}
      onClose={onClose}
      isForm
      headerAction={
        account && onDelete ? (
          <TouchableOpacity onPress={() => { onDelete(account.id); onClose(); }} className="p-1">
            <Trash2 size={15} color="#9ca3af" />
          </TouchableOpacity>
        ) : undefined
      }
      footer={
        <TouchableOpacity
          onPress={handleSubmit}
          className="w-full py-3 bg-gray-800 rounded-lg items-center"
        >
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
            placeholder="例: メイン銀行"
            placeholderTextColor="#9ca3af"
          />
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

        {/* 種類 */}
        <View>
          <Text className="text-xs font-semibold text-gray-900 dark:text-gray-200 mb-2">種類</Text>
          <View className="flex-row gap-2">
            {(Object.entries(ACCOUNT_TYPE_LABELS) as [AccountType, string][]).map(([value, label]) => (
              <TouchableOpacity
                key={value}
                onPress={() => setAccountType(value)}
                className={`relative flex-col items-center p-2 rounded-lg flex-1 ${accountType === value ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              >
                <View className="mb-1">{ACCOUNT_TYPE_ICONS[value]}</View>
                <Text className="text-xs text-gray-900 dark:text-gray-200 text-center">{label}</Text>
                {accountType === value && (
                  <View className="absolute top-0 right-0">
                    <Check size={12} color="#374151" strokeWidth={2.5} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 残高 */}
        <View>
          <Text className="text-xs font-semibold text-gray-900 dark:text-gray-200 mb-2">残高</Text>
          <View className="flex-row items-center bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3">
            <Text className="text-gray-500 mr-1">¥</Text>
            <TextInput
              className="flex-1 py-2.5 text-gray-900 dark:text-gray-100"
              value={balance}
              onChangeText={setBalance}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

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
