import { Banknote, Building2, Smartphone, CreditCard } from 'lucide-react';
import type { AccountType, PaymentMethodType } from '../../types';

export const ACCOUNT_TYPE_ICONS: Record<AccountType, React.ReactNode> = {
  cash: <Banknote size={20} />,
  bank: <Building2 size={20} />,
  emoney: <Smartphone size={20} />,
};

export const ACCOUNT_TYPE_ICONS_SM: Record<AccountType, React.ReactNode> = {
  cash: <Banknote size={14} />,
  bank: <Building2 size={14} />,
  emoney: <Smartphone size={14} />,
};

export const ACCOUNT_TYPE_ICONS_XS: Record<AccountType, React.ReactNode> = {
  cash: <Banknote size={12} />,
  bank: <Building2 size={12} />,
  emoney: <Smartphone size={12} />,
};

export const ACCOUNT_TYPE_ICONS_LG: Record<AccountType, React.ReactNode> = {
  cash: <Banknote size={80} />,
  bank: <Building2 size={80} />,
  emoney: <Smartphone size={80} />,
};

export const PM_TYPE_ICONS: Record<PaymentMethodType, React.ReactNode> = {
  credit_card: <CreditCard size={20} />,
  debit_card: <CreditCard size={20} />,
};
