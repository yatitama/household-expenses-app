import type {
  Member,
  MemberInput,
  Account,
  AccountInput,
  AccountType,
  PaymentMethod,
  PaymentMethodInput,
  Transaction,
  TransactionInput,
  Category,
  CategoryInput,
  Budget,
  BudgetInput,
  CardBilling,
  CardBillingInput,
} from '../types';

const STORAGE_KEYS = {
  MEMBERS: 'household_members',
  ACCOUNTS: 'household_accounts',
  PAYMENT_METHODS: 'household_payment_methods',
  TRANSACTIONS: 'household_transactions',
  CATEGORIES: 'household_categories',
  BUDGETS: 'household_budgets',
  CARD_BILLINGS: 'household_card_billings',
  MIGRATION_VERSION: 'household_migration_version',
} as const;

const CURRENT_MIGRATION_VERSION = 2;

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

// マイグレーション: v1 → v2（口座と支払い手段の分離）
const migrateV1ToV2 = (): void => {
  interface OldAccount {
    id: string;
    name: string;
    memberId: string;
    paymentMethod: string;
    balance: number;
    color: string;
    icon?: string;
    createdAt: string;
    updatedAt: string;
  }

  const rawData = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
  if (!rawData) return;

  let oldAccounts: OldAccount[];
  try {
    oldAccounts = JSON.parse(rawData) as OldAccount[];
  } catch {
    return;
  }

  // 旧フォーマットかチェック（paymentMethodフィールドがあるか）
  if (oldAccounts.length === 0) return;
  const firstAccount = oldAccounts[0] as unknown as Record<string, unknown>;
  if (!('paymentMethod' in firstAccount)) return;

  const now = getTimestamp();
  const newAccounts: Account[] = [];
  const newPaymentMethods: PaymentMethod[] = [];
  const accountIdMapping: Record<string, string> = {}; // old account ID → new PM ID

  for (const old of oldAccounts) {
    if (old.paymentMethod === 'credit_card' || old.paymentMethod === 'debit_card') {
      // クレジットカード/デビットカード → PaymentMethodに変換
      const pmId = generateId();
      accountIdMapping[old.id] = pmId;
      newPaymentMethods.push({
        id: pmId,
        name: old.name,
        memberId: old.memberId,
        type: old.paymentMethod as 'credit_card' | 'debit_card',
        linkedAccountId: '',
        billingType: old.paymentMethod === 'credit_card' ? 'monthly' : 'immediate',
        closingDay: old.paymentMethod === 'credit_card' ? 15 : undefined,
        paymentDay: old.paymentMethod === 'credit_card' ? 10 : undefined,
        paymentMonthOffset: old.paymentMethod === 'credit_card' ? 1 : undefined,
        color: old.color,
        icon: old.icon,
        createdAt: old.createdAt,
        updatedAt: now,
      });
    } else {
      // 現金/銀行/電子マネー → Accountに変換
      const accountType = old.paymentMethod as AccountType;
      newAccounts.push({
        id: old.id,
        name: old.name,
        memberId: old.memberId,
        type: accountType,
        balance: old.balance,
        color: old.color,
        icon: old.icon,
        createdAt: old.createdAt,
        updatedAt: now,
      });
    }
  }

  // トランザクションの更新
  const transactions = getItems<Transaction & { accountId: string }>(STORAGE_KEYS.TRANSACTIONS);
  const updatedTransactions = transactions.map((t) => {
    if (accountIdMapping[t.accountId]) {
      return {
        ...t,
        paymentMethodId: accountIdMapping[t.accountId],
        accountId: '', // 紐づき先口座未設定
        updatedAt: now,
      };
    }
    return t;
  });

  // 保存
  setItems(STORAGE_KEYS.ACCOUNTS, newAccounts);
  setItems(STORAGE_KEYS.PAYMENT_METHODS, newPaymentMethods);
  setItems(STORAGE_KEYS.TRANSACTIONS, updatedTransactions);
};

export const runMigrations = (): void => {
  const versionStr = localStorage.getItem(STORAGE_KEYS.MIGRATION_VERSION);
  const currentVersion = versionStr ? parseInt(versionStr, 10) : 1;

  if (currentVersion < 2) {
    migrateV1ToV2();
  }

  localStorage.setItem(STORAGE_KEYS.MIGRATION_VERSION, CURRENT_MIGRATION_VERSION.toString());
};

// Member 操作
export const memberService = {
  getAll: (): Member[] => {
    return getItems<Member>(STORAGE_KEYS.MEMBERS);
  },

  getById: (id: string): Member | undefined => {
    return memberService.getAll().find((m) => m.id === id);
  },

  setAll: (members: Member[]): void => {
    setItems(STORAGE_KEYS.MEMBERS, members);
  },

  create: (input: MemberInput): Member => {
    const members = memberService.getAll();
    const newMember: Member = {
      ...input,
      id: generateId(),
    };
    members.push(newMember);
    setItems(STORAGE_KEYS.MEMBERS, members);
    return newMember;
  },

  update: (id: string, input: Partial<MemberInput>): Member | undefined => {
    const members = memberService.getAll();
    const index = members.findIndex((m) => m.id === id);
    if (index === -1) return undefined;

    const updated: Member = {
      ...members[index],
      ...input,
    };
    members[index] = updated;
    setItems(STORAGE_KEYS.MEMBERS, members);
    return updated;
  },

  delete: (id: string): boolean => {
    const members = memberService.getAll();
    const member = members.find((m) => m.id === id);
    // デフォルトメンバーは削除不可
    if (!member || member.isDefault) return false;
    const filtered = members.filter((m) => m.id !== id);
    setItems(STORAGE_KEYS.MEMBERS, filtered);
    return true;
  },
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

// PaymentMethod 操作
export const paymentMethodService = {
  getAll: (): PaymentMethod[] => {
    return getItems<PaymentMethod>(STORAGE_KEYS.PAYMENT_METHODS);
  },

  getById: (id: string): PaymentMethod | undefined => {
    return paymentMethodService.getAll().find((pm) => pm.id === id);
  },

  create: (input: PaymentMethodInput): PaymentMethod => {
    const methods = paymentMethodService.getAll();
    const now = getTimestamp();
    const newMethod: PaymentMethod = {
      ...input,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    methods.push(newMethod);
    setItems(STORAGE_KEYS.PAYMENT_METHODS, methods);
    return newMethod;
  },

  update: (id: string, input: Partial<PaymentMethodInput>): PaymentMethod | undefined => {
    const methods = paymentMethodService.getAll();
    const index = methods.findIndex((pm) => pm.id === id);
    if (index === -1) return undefined;

    const updated: PaymentMethod = {
      ...methods[index],
      ...input,
      updatedAt: getTimestamp(),
    };
    methods[index] = updated;
    setItems(STORAGE_KEYS.PAYMENT_METHODS, methods);
    return updated;
  },

  delete: (id: string): boolean => {
    const methods = paymentMethodService.getAll();
    const filtered = methods.filter((pm) => pm.id !== id);
    if (filtered.length === methods.length) return false;
    setItems(STORAGE_KEYS.PAYMENT_METHODS, filtered);
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

  update: (id: string, input: Partial<TransactionInput & { settledAt?: string }>): Transaction | undefined => {
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

  create: (input: CategoryInput): Category => {
    const categories = categoryService.getAll();
    const newCategory: Category = {
      ...input,
      id: generateId(),
    };
    categories.push(newCategory);
    setItems(STORAGE_KEYS.CATEGORIES, categories);
    return newCategory;
  },

  update: (id: string, input: Partial<CategoryInput>): Category | undefined => {
    const categories = categoryService.getAll();
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) return undefined;

    const updated: Category = {
      ...categories[index],
      ...input,
    };
    categories[index] = updated;
    setItems(STORAGE_KEYS.CATEGORIES, categories);
    return updated;
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
