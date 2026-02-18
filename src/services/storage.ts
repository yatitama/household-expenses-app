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
  RecurringPayment,
  RecurringPaymentInput,
  LinkedPaymentMethod,
  LinkedPaymentMethodInput,
  QuickAddTemplate,
  QuickAddTemplateInput,
  SavingsGoal,
  SavingsGoalInput,
} from '../types';

const STORAGE_KEYS = {
  MEMBERS: 'household_members',
  ACCOUNTS: 'household_accounts',
  PAYMENT_METHODS: 'household_payment_methods',
  TRANSACTIONS: 'household_transactions',
  CATEGORIES: 'household_categories',
  BUDGETS: 'household_budgets',
  CARD_BILLINGS: 'household_card_billings',
  RECURRING_PAYMENTS: 'household_recurring_payments',
  LINKED_PAYMENT_METHODS: 'household_linked_payment_methods',
  QUICK_ADD_TEMPLATES: 'household_quick_add_templates',
  SAVINGS_GOALS: 'household_savings_goals',
  MIGRATION_VERSION: 'household_migration_version',
  APP_SETTINGS: 'household_app_settings',
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
    const accounts = getItems<Account>(STORAGE_KEYS.ACCOUNTS);
    return accounts.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return a.createdAt.localeCompare(b.createdAt);
    });
  },

  getById: (id: string): Account | undefined => {
    return accountService.getAll().find((a) => a.id === id);
  },

  create: (input: AccountInput): Account => {
    const accounts = getItems<Account>(STORAGE_KEYS.ACCOUNTS);
    const now = getTimestamp();
    const maxOrder = accounts.reduce((max, a) => Math.max(max, a.order ?? -1), -1);
    const newAccount: Account = {
      ...input,
      id: generateId(),
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    };
    accounts.push(newAccount);
    setItems(STORAGE_KEYS.ACCOUNTS, accounts);
    return newAccount;
  },

  update: (id: string, input: Partial<AccountInput>): Account | undefined => {
    const accounts = getItems<Account>(STORAGE_KEYS.ACCOUNTS);
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

  updateOrders: (orders: { id: string; order: number }[]): void => {
    const accounts = getItems<Account>(STORAGE_KEYS.ACCOUNTS);
    const orderMap = new Map(orders.map((o) => [o.id, o.order]));

    const updated = accounts.map((account) => {
      const newOrder = orderMap.get(account.id);
      if (newOrder !== undefined) {
        return { ...account, order: newOrder, updatedAt: getTimestamp() };
      }
      return account;
    });

    setItems(STORAGE_KEYS.ACCOUNTS, updated);
  },

  delete: (id: string): boolean => {
    const accounts = getItems<Account>(STORAGE_KEYS.ACCOUNTS);
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

// RecurringPayment 操作
export const recurringPaymentService = {
  getAll: (): RecurringPayment[] => {
    return getItems<RecurringPayment>(STORAGE_KEYS.RECURRING_PAYMENTS);
  },

  getById: (id: string): RecurringPayment | undefined => {
    return recurringPaymentService.getAll().find((rp) => rp.id === id);
  },

  create: (input: RecurringPaymentInput): RecurringPayment => {
    const items = recurringPaymentService.getAll();
    const now = getTimestamp();
    const newItem: RecurringPayment = {
      ...input,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    items.push(newItem);
    setItems(STORAGE_KEYS.RECURRING_PAYMENTS, items);
    return newItem;
  },

  update: (id: string, input: Partial<RecurringPaymentInput>): RecurringPayment | undefined => {
    const items = recurringPaymentService.getAll();
    const index = items.findIndex((rp) => rp.id === id);
    if (index === -1) return undefined;

    const updated: RecurringPayment = {
      ...items[index],
      ...input,
      updatedAt: getTimestamp(),
    };
    items[index] = updated;
    setItems(STORAGE_KEYS.RECURRING_PAYMENTS, items);
    return updated;
  },

  delete: (id: string): boolean => {
    const items = recurringPaymentService.getAll();
    const filtered = items.filter((rp) => rp.id !== id);
    if (filtered.length === items.length) return false;
    setItems(STORAGE_KEYS.RECURRING_PAYMENTS, filtered);
    return true;
  },
};

// LinkedPaymentMethod 操作
export const linkedPaymentMethodService = {
  getAll: (): LinkedPaymentMethod[] => {
    return getItems<LinkedPaymentMethod>(STORAGE_KEYS.LINKED_PAYMENT_METHODS);
  },

  getById: (id: string): LinkedPaymentMethod | undefined => {
    return linkedPaymentMethodService.getAll().find((lpm) => lpm.id === id);
  },

  getByAccountId: (accountId: string): LinkedPaymentMethod[] => {
    return linkedPaymentMethodService.getAll().filter((lpm) => lpm.accountId === accountId);
  },

  getByPaymentMethodId: (paymentMethodId: string): LinkedPaymentMethod[] => {
    return linkedPaymentMethodService.getAll().filter((lpm) => lpm.paymentMethodId === paymentMethodId);
  },

  create: (input: LinkedPaymentMethodInput): LinkedPaymentMethod => {
    const items = linkedPaymentMethodService.getAll();
    const now = getTimestamp();
    const newItem: LinkedPaymentMethod = {
      ...input,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    items.push(newItem);
    setItems(STORAGE_KEYS.LINKED_PAYMENT_METHODS, items);
    return newItem;
  },

  update: (id: string, input: Partial<LinkedPaymentMethodInput>): LinkedPaymentMethod | undefined => {
    const items = linkedPaymentMethodService.getAll();
    const index = items.findIndex((lpm) => lpm.id === id);
    if (index === -1) return undefined;

    const updated: LinkedPaymentMethod = {
      ...items[index],
      ...input,
      updatedAt: getTimestamp(),
    };
    items[index] = updated;
    setItems(STORAGE_KEYS.LINKED_PAYMENT_METHODS, items);
    return updated;
  },

  delete: (id: string): boolean => {
    const items = linkedPaymentMethodService.getAll();
    const filtered = items.filter((lpm) => lpm.id !== id);
    if (filtered.length === items.length) return false;
    setItems(STORAGE_KEYS.LINKED_PAYMENT_METHODS, filtered);
    return true;
  },
};

// AppSettings 操作
export interface AppSettings {
  totalAssetGradientFrom: string;
  totalAssetGradientTo: string;
}

const DEFAULT_APP_SETTINGS: AppSettings = {
  totalAssetGradientFrom: '#3b82f6',
  totalAssetGradientTo: '#2563eb',
};

export const appSettingsService = {
  get: (): AppSettings => {
    const data = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
    if (!data) return DEFAULT_APP_SETTINGS;
    try {
      return { ...DEFAULT_APP_SETTINGS, ...(JSON.parse(data) as Partial<AppSettings>) };
    } catch {
      return DEFAULT_APP_SETTINGS;
    }
  },

  update: (input: Partial<AppSettings>): AppSettings => {
    const current = appSettingsService.get();
    const updated = { ...current, ...input };
    localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(updated));
    return updated;
  },
};

// QuickAddTemplate 操作
export const quickAddTemplateService = {
  getAll: (): QuickAddTemplate[] => {
    return getItems<QuickAddTemplate>(STORAGE_KEYS.QUICK_ADD_TEMPLATES);
  },

  getById: (id: string): QuickAddTemplate | undefined => {
    return quickAddTemplateService.getAll().find((t) => t.id === id);
  },

  create: (input: QuickAddTemplateInput): QuickAddTemplate => {
    const templates = quickAddTemplateService.getAll();
    const now = getTimestamp();
    const newTemplate: QuickAddTemplate = {
      ...input,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    templates.push(newTemplate);
    setItems(STORAGE_KEYS.QUICK_ADD_TEMPLATES, templates);
    return newTemplate;
  },

  update: (id: string, input: Partial<QuickAddTemplateInput>): QuickAddTemplate | undefined => {
    const templates = quickAddTemplateService.getAll();
    const index = templates.findIndex((t) => t.id === id);
    if (index === -1) return undefined;

    const updated: QuickAddTemplate = {
      ...templates[index],
      ...input,
      updatedAt: getTimestamp(),
    };
    templates[index] = updated;
    setItems(STORAGE_KEYS.QUICK_ADD_TEMPLATES, templates);
    return updated;
  },

  delete: (id: string): boolean => {
    const templates = quickAddTemplateService.getAll();
    const filtered = templates.filter((t) => t.id !== id);
    if (filtered.length === templates.length) return false;
    setItems(STORAGE_KEYS.QUICK_ADD_TEMPLATES, filtered);
    return true;
  },
};

// SavingsGoal 操作
export const savingsGoalService = {
  getAll: (): SavingsGoal[] => {
    return getItems<SavingsGoal>(STORAGE_KEYS.SAVINGS_GOALS);
  },

  getById: (id: string): SavingsGoal | undefined => {
    return savingsGoalService.getAll().find((g) => g.id === id);
  },

  create: (input: SavingsGoalInput): SavingsGoal => {
    const goals = savingsGoalService.getAll();
    const now = getTimestamp();
    const newGoal: SavingsGoal = {
      ...input,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    goals.push(newGoal);
    setItems(STORAGE_KEYS.SAVINGS_GOALS, goals);
    return newGoal;
  },

  update: (id: string, input: Partial<SavingsGoalInput>): SavingsGoal | undefined => {
    const goals = savingsGoalService.getAll();
    const index = goals.findIndex((g) => g.id === id);
    if (index === -1) return undefined;

    const updated: SavingsGoal = {
      ...goals[index],
      ...input,
      updatedAt: getTimestamp(),
    };
    goals[index] = updated;
    setItems(STORAGE_KEYS.SAVINGS_GOALS, goals);
    return updated;
  },

  delete: (id: string): boolean => {
    const goals = savingsGoalService.getAll();
    const filtered = goals.filter((g) => g.id !== id);
    if (filtered.length === goals.length) return false;
    setItems(STORAGE_KEYS.SAVINGS_GOALS, filtered);
    return true;
  },

  toggleExcludeMonth: (id: string, month: string): SavingsGoal | undefined => {
    const goals = savingsGoalService.getAll();
    const index = goals.findIndex((g) => g.id === id);
    if (index === -1) return undefined;

    const goal = goals[index];
    const excludedMonths = goal.excludedMonths.includes(month)
      ? goal.excludedMonths.filter((m) => m !== month)
      : [...goal.excludedMonths, month];

    const updated: SavingsGoal = {
      ...goal,
      excludedMonths,
      updatedAt: getTimestamp(),
    };
    goals[index] = updated;
    setItems(STORAGE_KEYS.SAVINGS_GOALS, goals);
    return updated;
  },
};
