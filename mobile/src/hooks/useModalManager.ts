import { useState, useCallback } from 'react';
import type { PaymentMethod, RecurringPayment, LinkedPaymentMethod, QuickAddTemplate } from '../types';

export type ModalType =
  | { type: 'viewing-pm'; data: PaymentMethod | { paymentMethod: PaymentMethod; showOnlyUnsettled?: boolean } }
  | { type: 'add-transaction'; data?: { accountId?: string; paymentMethodId?: string; template?: QuickAddTemplate } }
  | { type: 'recurring'; data: { editing: RecurringPayment | null; target: { accountId?: string; paymentMethodId?: string } | null } }
  | { type: 'linked-pm'; data: { editing: LinkedPaymentMethod | null; accountId: string } }
  | null;

export const useModalManager = () => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const openModal = useCallback((modal: ModalType) => {
    setActiveModal(modal);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const isModalOpen = useCallback((type: string) => {
    return activeModal?.type === type;
  }, [activeModal]);

  return {
    activeModal,
    openModal,
    closeModal,
    isModalOpen,
  };
};
