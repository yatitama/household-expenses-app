import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  accountService, paymentMethodService, recurringPaymentService,
  linkedPaymentMethodService, appSettingsService,
} from '../../services/storage';
import type { AppSettings } from '../../services/storage';
import type {
  Account, AccountInput, PaymentMethod, PaymentMethodInput,
  RecurringPayment, RecurringPaymentInput,
  LinkedPaymentMethod, LinkedPaymentMethodInput,
} from '../../types';

export const useAccountOperations = () => {
  const [accounts, setAccounts] = useState<Account[]>(() => accountService.getAll());
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => paymentMethodService.getAll());
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>(() => recurringPaymentService.getAll());
  const [linkedPaymentMethods, setLinkedPaymentMethods] = useState<LinkedPaymentMethod[]>(() => linkedPaymentMethodService.getAll());
  const [appSettings, setAppSettings] = useState<AppSettings>(() => appSettingsService.get());

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const refreshData = useCallback(() => {
    setAccounts(accountService.getAll());
    setPaymentMethods(paymentMethodService.getAll());
    setRecurringPayments(recurringPaymentService.getAll());
    setLinkedPaymentMethods(linkedPaymentMethodService.getAll());
  }, []);

  // Account CRUD
  const handleSaveAccount = useCallback((input: AccountInput, editingAccount: Account | null) => {
    if (editingAccount) {
      accountService.update(editingAccount.id, input);
      toast.success('口座を更新しました');
    } else {
      accountService.create(input);
      toast.success('口座を追加しました');
    }
    refreshData();
  }, [refreshData]);

  const handleDeleteAccount = useCallback((id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '口座を削除',
      message: 'この口座を削除してもよろしいですか？この操作は取り消せません。',
      onConfirm: () => {
        accountService.delete(id);
        refreshData();
        toast.success('口座を削除しました');
      },
    });
  }, [refreshData]);

  // Payment Method CRUD
  const handleSavePM = useCallback((input: PaymentMethodInput, editingPM: PaymentMethod | null) => {
    if (editingPM) {
      paymentMethodService.update(editingPM.id, input);
      toast.success('支払い手段を更新しました');
    } else {
      paymentMethodService.create(input);
      toast.success('支払い手段を追加しました');
    }
    refreshData();
  }, [refreshData]);

  const handleDeletePM = useCallback((id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '支払い手段を削除',
      message: 'この支払い手段を削除してもよろしいですか？この操作は取り消せません。',
      onConfirm: () => {
        paymentMethodService.delete(id);
        refreshData();
        toast.success('支払い手段を削除しました');
      },
    });
  }, [refreshData]);

  // Recurring Payments
  const handleSaveRecurring = useCallback((input: RecurringPaymentInput, editingRecurring: RecurringPayment | null) => {
    if (editingRecurring) {
      recurringPaymentService.update(editingRecurring.id, input);
      toast.success('定期取引を更新しました');
    } else {
      recurringPaymentService.create(input);
      toast.success('定期取引を追加しました');
    }
    refreshData();
  }, [refreshData]);

  const handleDeleteRecurring = useCallback((id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '定期取引を削除',
      message: 'この定期取引を削除してもよろしいですか？',
      onConfirm: () => {
        recurringPaymentService.delete(id);
        refreshData();
        toast.success('定期取引を削除しました');
      },
    });
  }, [refreshData]);

  const handleToggleRecurring = useCallback((rp: RecurringPayment) => {
    recurringPaymentService.update(rp.id, { isActive: !rp.isActive });
    refreshData();
  }, [refreshData]);

  // Linked Payment Methods
  const handleSaveLinkedPM = useCallback((input: LinkedPaymentMethodInput, editingLinkedPM: LinkedPaymentMethod | null) => {
    if (editingLinkedPM) {
      linkedPaymentMethodService.update(editingLinkedPM.id, input);
      toast.success('支払い手段の紐づけを更新しました');
    } else {
      linkedPaymentMethodService.create(input);
      toast.success('支払い手段を紐づけました');
    }
    refreshData();
  }, [refreshData]);

  const handleToggleLinkedPM = useCallback((lpm: LinkedPaymentMethod) => {
    linkedPaymentMethodService.update(lpm.id, { isActive: !lpm.isActive });
    refreshData();
  }, [refreshData]);

  // Gradient
  const handleSaveGradient = useCallback((from: string, to: string) => {
    const updated = appSettingsService.update({ totalAssetGradientFrom: from, totalAssetGradientTo: to });
    setAppSettings(updated);
    toast.success('背景色を変更しました');
  }, []);

  return {
    accounts,
    paymentMethods,
    recurringPayments,
    linkedPaymentMethods,
    appSettings,
    refreshData,
    handleSaveAccount,
    handleDeleteAccount,
    handleSavePM,
    handleDeletePM,
    handleSaveRecurring,
    handleDeleteRecurring,
    handleToggleRecurring,
    handleSaveLinkedPM,
    handleToggleLinkedPM,
    handleSaveGradient,
    confirmDialog,
    closeConfirmDialog,
  };
};
