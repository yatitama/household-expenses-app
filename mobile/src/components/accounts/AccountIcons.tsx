import { Banknote, Building2, Smartphone, CreditCard } from 'lucide-react-native';
import type { AccountType, PaymentMethodType } from '../../types';

const ICON_COLOR = '#ffffff';

export const ACCOUNT_TYPE_ICONS: Record<AccountType, React.ReactNode> = {
  cash: <Banknote size={20} color={ICON_COLOR} />,
  bank: <Building2 size={20} color={ICON_COLOR} />,
  emoney: <Smartphone size={20} color={ICON_COLOR} />,
};

export const ACCOUNT_TYPE_ICONS_SM: Record<AccountType, React.ReactNode> = {
  cash: <Banknote size={14} color={ICON_COLOR} />,
  bank: <Building2 size={14} color={ICON_COLOR} />,
  emoney: <Smartphone size={14} color={ICON_COLOR} />,
};

export const ACCOUNT_TYPE_ICONS_XS: Record<AccountType, React.ReactNode> = {
  cash: <Banknote size={12} color={ICON_COLOR} />,
  bank: <Building2 size={12} color={ICON_COLOR} />,
  emoney: <Smartphone size={12} color={ICON_COLOR} />,
};

export const ACCOUNT_TYPE_ICONS_LG: Record<AccountType, React.ReactNode> = {
  cash: <Banknote size={60} color="#374151" />,
  bank: <Building2 size={60} color="#374151" />,
  emoney: <Smartphone size={60} color="#374151" />,
};

export const PM_TYPE_ICONS: Record<PaymentMethodType, React.ReactNode> = {
  credit_card: <CreditCard size={20} color={ICON_COLOR} />,
  debit_card: <CreditCard size={20} color={ICON_COLOR} />,
};
