import { getEffectiveRecurringAmount } from './savingsUtils';
import type { RecurringPayment, Category, PaymentMethod, Account, Member } from '../types';

// Interfaces for grouped recurring payment data
export interface CategoryGroupedRecurring {
  category: Category | undefined;
  items: RecurringPayment[];
  totalAmount: number;
}

export interface PaymentGroupedRecurring {
  paymentMethod: PaymentMethod | undefined;
  account: Account | undefined;
  name: string;
  items: RecurringPayment[];
  totalAmount: number;
}

export interface MemberGroupedRecurring {
  member: Member | undefined;
  name: string;
  items: RecurringPayment[];
  totalAmount: number;
}

/**
 * Group recurring payments by category
 */
export function groupRecurringByCategory(
  recurringPayments: RecurringPayment[],
  categories: Category[],
  month?: string
): Record<string, CategoryGroupedRecurring> {
  const grouped: Record<string, CategoryGroupedRecurring> = {};

  for (const rp of recurringPayments) {
    if (!rp.categoryId) continue;
    const cat = categories.find((c) => c.id === rp.categoryId);
    const key = rp.categoryId;

    if (!grouped[key]) {
      grouped[key] = { category: cat, items: [], totalAmount: 0 };
    }

    const effectiveAmount = month ? getEffectiveRecurringAmount(rp, month) : rp.amount;
    const signedAmount = rp.type === 'expense' ? effectiveAmount : -effectiveAmount;
    grouped[key].totalAmount += signedAmount;
    grouped[key].items.push(rp);
  }

  return grouped;
}

/**
 * Group recurring payments by payment method or account (if no payment method)
 */
export function groupRecurringByPayment(
  recurringPayments: RecurringPayment[],
  paymentMethods: PaymentMethod[],
  accounts: Account[],
  month?: string
): Record<string, PaymentGroupedRecurring> {
  const grouped: Record<string, PaymentGroupedRecurring> = {};

  for (const rp of recurringPayments) {
    let key: string;
    let paymentMethod: PaymentMethod | undefined;
    let account: Account | undefined;
    let name: string;

    if (rp.paymentMethodId) {
      key = rp.paymentMethodId;
      paymentMethod = paymentMethods.find((p) => p.id === rp.paymentMethodId);
      account = paymentMethod ? accounts.find((a) => a.id === paymentMethod?.linkedAccountId) : undefined;
      name = paymentMethod?.name ?? '現金';
    } else if (rp.accountId) {
      key = `__account__${rp.accountId}`;
      account = accounts.find((a) => a.id === rp.accountId);
      name = account?.name ?? '口座';
    } else {
      continue;
    }

    if (!grouped[key]) {
      grouped[key] = { paymentMethod, account, name, items: [], totalAmount: 0 };
    }

    const effectiveAmount = month ? getEffectiveRecurringAmount(rp, month) : rp.amount;
    const signedAmount = rp.type === 'expense' ? effectiveAmount : -effectiveAmount;
    grouped[key].totalAmount += signedAmount;
    grouped[key].items.push(rp);
  }

  return grouped;
}

/**
 * Group recurring payments by member (derived from account)
 */
export function groupRecurringByMember(
  recurringPayments: RecurringPayment[],
  members: Member[],
  accounts: Account[],
  month?: string
): Record<string, MemberGroupedRecurring> {
  const grouped: Record<string, MemberGroupedRecurring> = {};

  for (const rp of recurringPayments) {
    if (!rp.accountId) continue;
    const account = accounts.find((a) => a.id === rp.accountId);
    const memberId = account?.memberId || '__unknown__';
    const member = members.find((m) => m.id === memberId);
    const name = member?.name ?? '不明';

    if (!grouped[memberId]) {
      grouped[memberId] = { member, name, items: [], totalAmount: 0 };
    }

    const effectiveAmount = month ? getEffectiveRecurringAmount(rp, month) : rp.amount;
    const signedAmount = rp.type === 'expense' ? effectiveAmount : -effectiveAmount;
    grouped[memberId].totalAmount += signedAmount;
    grouped[memberId].items.push(rp);
  }

  return grouped;
}

/**
 * Get sorted category entries maintaining order of categories list
 */
export function getSortedCategoryEntries(
  grouped: Record<string, CategoryGroupedRecurring>,
  categories: Category[]
): Array<[string, CategoryGroupedRecurring]> {
  return Object.entries(grouped).sort((a, b) => {
    const aIdx = categories.findIndex((c) => c.id === a[1].category?.id);
    const bIdx = categories.findIndex((c) => c.id === b[1].category?.id);
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
}

/**
 * Get sorted payment method entries maintaining order of paymentMethods list
 */
export function getSortedPaymentEntries(
  grouped: Record<string, PaymentGroupedRecurring>,
  paymentMethods: PaymentMethod[]
): Array<[string, PaymentGroupedRecurring]> {
  return Object.entries(grouped).sort((a, b) => {
    const aIdx = paymentMethods.findIndex((p) => p.id === a[1].paymentMethod?.id);
    const bIdx = paymentMethods.findIndex((p) => p.id === b[1].paymentMethod?.id);
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
}

/**
 * Get sorted member entries maintaining order of members list
 */
export function getSortedMemberEntries(
  grouped: Record<string, MemberGroupedRecurring>,
  members: Member[]
): Array<[string, MemberGroupedRecurring]> {
  return Object.entries(grouped).sort((a, b) => {
    const aIdx = members.findIndex((m) => m.id === a[1].member?.id);
    const bIdx = members.findIndex((m) => m.id === b[1].member?.id);
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
}

/**
 * Get uncategorized recurring payments
 */
export function getUncategorizedRecurring(recurringPayments: RecurringPayment[]): RecurringPayment[] {
  return recurringPayments.filter((rp) => !rp.categoryId);
}

/**
 * Get unassigned payment recurring payments
 */
export function getUnassignedPaymentRecurring(recurringPayments: RecurringPayment[]): RecurringPayment[] {
  return recurringPayments.filter((rp) => !rp.paymentMethodId && !rp.accountId);
}

/**
 * Get unassigned member recurring payments
 */
export function getUnassignedMemberRecurring(recurringPayments: RecurringPayment[]): RecurringPayment[] {
  return recurringPayments.filter((rp) => !rp.accountId);
}

/**
 * Calculate total amount for a set of recurring payments
 */
export function calculateRecurringTotal(
  recurringPayments: RecurringPayment[],
  month?: string
): number {
  return recurringPayments.reduce((sum, rp) => {
    const effectiveAmount = month ? getEffectiveRecurringAmount(rp, month) : rp.amount;
    const signedAmount = rp.type === 'expense' ? effectiveAmount : -effectiveAmount;
    return sum + signedAmount;
  }, 0);
}
