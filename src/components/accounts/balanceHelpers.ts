import { accountService, paymentMethodService } from '../../services/storage';
import type { Transaction, TransactionInput } from '../../types';

export const revertTransactionBalance = (transaction: Transaction) => {
  if (transaction.paymentMethodId) {
    const pm = paymentMethodService.getById(transaction.paymentMethodId);
    if (pm && pm.billingType === 'immediate' && transaction.accountId) {
      const acct = accountService.getById(transaction.accountId);
      if (acct) {
        const revert = transaction.type === 'expense' ? acct.balance + transaction.amount : acct.balance - transaction.amount;
        accountService.update(acct.id, { balance: revert });
      }
    }
    if (pm && pm.billingType === 'monthly' && transaction.settledAt && transaction.accountId) {
      const acct = accountService.getById(transaction.accountId);
      if (acct) {
        const revert = transaction.type === 'expense' ? acct.balance + transaction.amount : acct.balance - transaction.amount;
        accountService.update(acct.id, { balance: revert });
      }
    }
  } else if (transaction.accountId) {
    const acct = accountService.getById(transaction.accountId);
    if (acct) {
      const revert = transaction.type === 'expense' ? acct.balance + transaction.amount : acct.balance - transaction.amount;
      accountService.update(acct.id, { balance: revert });
    }
  }
};

export const applyTransactionBalance = (input: TransactionInput) => {
  if (input.paymentMethodId) {
    const pm = paymentMethodService.getById(input.paymentMethodId);
    if (pm && pm.billingType === 'immediate' && input.accountId) {
      const acct = accountService.getById(input.accountId);
      if (acct) {
        const newBal = input.type === 'expense' ? acct.balance - input.amount : acct.balance + input.amount;
        accountService.update(acct.id, { balance: newBal });
      }
    }
  } else if (input.accountId) {
    const acct = accountService.getById(input.accountId);
    if (acct) {
      const newBal = input.type === 'expense' ? acct.balance - input.amount : acct.balance + input.amount;
      accountService.update(acct.id, { balance: newBal });
    }
  }
};
