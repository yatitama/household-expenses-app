import type {
  Account,
  AccountInput,
  Transaction,
  TransactionInput,
  Category,
  Budget,
  BudgetInput,
  CardBilling,
  CardBillingInput,
} from '../types';

const STORAGE_KEYS = {
  ACCOUNTS: 'household_accounts',
  TRANSACTIONS: 'household_transactions',
  CATEGORIES: 'household_categories',
  BUDGETS: 'household_budgets',
  CARD_BILLINGS: 'household_card_billings',
} as const;

// ユーティリティ関数
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const getTimestamp = (): string => {
  return new Date().toISOString();
};

// 汎用的なストレージ操作
const getItems = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  if (!data) return [];
  try {
    return JSON.parse(data) as T[];
  } catch {
    return [];
  }
};

const setItems = <T>(key: string, items: T[]): void => {
  localStorage.setItem(key, JSON.stringify(items));
};

// Account 操作
export const accountService = {
  getAll: (): Account[] => {
    return getItems<Account>(STORAGE_KEYS.ACCOUNTS);
  },

  getById: (id: string): Account | undefined => {
    return accountService.getAll().find((a) => a.id === id);
  },

  create: (input: AccountInput): Account => {
    const accounts = accountService.getAll();
    const now = getTimestamp();
    const newAccount: Account = {
      ...input,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    accounts.push(newAccount);
    setItems(STORAGE_KEYS.ACCOUNTS, accounts);
    return newAccount;
  },

  update: (id: string, input: Partial<AccountInput>): Account | undefined => {
    const accounts = accountService.getAll();
    const index = accounts.findIndex((a) => a.id === id);
    if (index === -1) return undefined;

    const updated: Account = {
      ...accounts[index],
      ...input,
      updatedAt: getTimestamp(),
    };
    accounts[index] = updated;
    setItems(STORAGE_KEYS.ACCOUNTS, accounts);
    return updated;
  },

  delete: (id: string): boolean => {
    const accounts = accountService.getAll();
    const filtered = accounts.filter((a) => a.id !== id);
    if (filtered.length === accounts.length) return false;
    setItems(STORAGE_KEYS.ACCOUNTS, filtered);
    return true;
  },
};

// Transaction 操作
export const transactionService = {
  getAll: (): Transaction[] => {
    return getItems<Transaction>(STORAGE_KEYS.TRANSACTIONS);
  },

  getById: (id: string): Transaction | undefined => {
    return transactionService.getAll().find((t) => t.id === id);
  },

  getByMonth: (month: string): Transaction[] => {
    return transactionService.getAll().filter((t) => t.date.startsWith(month));
  },

  create: (input: TransactionInput): Transaction => {
    const transactions = transactionService.getAll();
    const now = getTimestamp();
    const newTransaction: Transaction = {
      ...input,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    transactions.push(newTransaction);
    setItems(STORAGE_KEYS.TRANSACTIONS, transactions);
    return newTransaction;
  },

  update: (id: string, input: Partial<TransactionInput>): Transaction | undefined => {
    const transactions = transactionService.getAll();
    const index = transactions.findIndex((t) => t.id === id);
    if (index === -1) return undefined;

    const updated: Transaction = {
      ...transactions[index],
      ...input,
      updatedAt: getTimestamp(),
    };
    transactions[index] = updated;
    setItems(STORAGE_KEYS.TRANSACTIONS, transactions);
    return updated;
  },

  delete: (id: string): boolean => {
    const transactions = transactionService.getAll();
    const filtered = transactions.filter((t) => t.id !== id);
    if (filtered.length === transactions.length) return false;
    setItems(STORAGE_KEYS.TRANSACTIONS, filtered);
    return true;
  },
};

// Category 操作
export const categoryService = {
  getAll: (): Category[] => {
    return getItems<Category>(STORAGE_KEYS.CATEGORIES);
  },

  getById: (id: string): Category | undefined => {
    return categoryService.getAll().find((c) => c.id === id);
  },

  getByType: (type: 'income' | 'expense'): Category[] => {
    return categoryService.getAll().filter((c) => c.type === type);
  },

  setAll: (categories: Category[]): void => {
    setItems(STORAGE_KEYS.CATEGORIES, categories);
  },

  create: (category: Category): Category => {
    const categories = categoryService.getAll();
    categories.push(category);
    setItems(STORAGE_KEYS.CATEGORIES, categories);
    return category;
  },

  delete: (id: string): boolean => {
    const categories = categoryService.getAll();
    const filtered = categories.filter((c) => c.id !== id);
    if (filtered.length === categories.length) return false;
    setItems(STORAGE_KEYS.CATEGORIES, filtered);
    return true;
  },
};

// Budget 操作
export const budgetService = {
  getAll: (): Budget[] => {
    return getItems<Budget>(STORAGE_KEYS.BUDGETS);
  },

  getByMonth: (month: string): Budget[] => {
    return budgetService.getAll().filter((b) => b.month === month);
  },

  create: (input: BudgetInput): Budget => {
    const budgets = budgetService.getAll();
    const newBudget: Budget = {
      ...input,
      id: generateId(),
    };
    budgets.push(newBudget);
    setItems(STORAGE_KEYS.BUDGETS, budgets);
    return newBudget;
  },

  update: (id: string, input: Partial<BudgetInput>): Budget | undefined => {
    const budgets = budgetService.getAll();
    const index = budgets.findIndex((b) => b.id === id);
    if (index === -1) return undefined;

    const updated: Budget = {
      ...budgets[index],
      ...input,
    };
    budgets[index] = updated;
    setItems(STORAGE_KEYS.BUDGETS, budgets);
    return updated;
  },

  delete: (id: string): boolean => {
    const budgets = budgetService.getAll();
    const filtered = budgets.filter((b) => b.id !== id);
    if (filtered.length === budgets.length) return false;
    setItems(STORAGE_KEYS.BUDGETS, filtered);
    return true;
  },
};

// CardBilling 操作
export const cardBillingService = {
  getAll: (): CardBilling[] => {
    return getItems<CardBilling>(STORAGE_KEYS.CARD_BILLINGS);
  },

  getByMonth: (month: string): CardBilling[] => {
    return cardBillingService.getAll().filter((cb) => cb.month === month);
  },

  create: (input: CardBillingInput): CardBilling => {
    const billings = cardBillingService.getAll();
    const newBilling: CardBilling = {
      ...input,
      id: generateId(),
    };
    billings.push(newBilling);
    setItems(STORAGE_KEYS.CARD_BILLINGS, billings);
    return newBilling;
  },

  update: (id: string, input: Partial<CardBillingInput>): CardBilling | undefined => {
    const billings = cardBillingService.getAll();
    const index = billings.findIndex((cb) => cb.id === id);
    if (index === -1) return undefined;

    const updated: CardBilling = {
      ...billings[index],
      ...input,
    };
    billings[index] = updated;
    setItems(STORAGE_KEYS.CARD_BILLINGS, billings);
    return updated;
  },

  delete: (id: string): boolean => {
    const billings = cardBillingService.getAll();
    const filtered = billings.filter((cb) => cb.id !== id);
    if (filtered.length === billings.length) return false;
    setItems(STORAGE_KEYS.CARD_BILLINGS, filtered);
    return true;
  },
};
