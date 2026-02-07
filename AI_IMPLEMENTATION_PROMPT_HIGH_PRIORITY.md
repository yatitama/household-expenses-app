# 🟡 高優先タスク実装プロンプト

## 📋 タスク4: AccountsPageの分割とリファクタリング

### 現状の問題
- AccountsPage.tsxが3,113行で巨大すぎる
- メンテナンス性が低い
- 複数のモーダルとカードコンポーネントがインライン定義されている
- テストが困難

### 要件

#### 4.1 コンポーネント分割計画
**メインファイル:** `src/pages/AccountsPage.tsx`（200行程度に削減）

**新規作成ファイル構成:**
```
src/components/accounts/
├─ AssetCard.tsx                    # 総資産カード
├─ AccountBreakdown.tsx             # 内訳ツリー表示
├─ AccountCard.tsx                  # 口座カード
├─ PaymentMethodCard.tsx            # 支払い手段カード
├─ RecurringPaymentItem.tsx         # 定期支払い項目
├─ LinkedPaymentMethodItem.tsx      # 紐づき支払い手段項目
└─ modals/
   ├─ AccountModal.tsx              # 口座作成・編集
   ├─ PaymentMethodModal.tsx        # 支払い手段作成・編集
   ├─ AddTransactionModal.tsx       # 取引追加
   ├─ RecurringPaymentModal.tsx     # 定期支払い設定
   ├─ LinkedPaymentMethodModal.tsx  # 支払い手段紐づけ
   ├─ AccountTransactionsModal.tsx  # 口座取引履歴
   ├─ PMTransactionsModal.tsx       # 支払い手段取引履歴
   ├─ EditTransactionModal.tsx      # 取引編集
   └─ GradientPickerModal.tsx       # グラデーション選択
```

#### 4.2 各コンポーネントの実装仕様

##### AssetCard.tsx
```typescript
interface AssetCardProps {
  totalAssets: number;
  scheduledBalance: number;
  showBreakdown: boolean;
  onToggleBreakdown: () => void;
  gradientFrom: string;
  gradientTo: string;
  onChangeGradient: () => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ ... }) => {
  // 総資産カードの実装
  // グラデーション背景
  // 内訳トグルボタン
};
```

##### AccountCard.tsx
```typescript
interface AccountCardProps {
  account: Account;
  member: Member | undefined;
  recurringPayments: RecurringPayment[];
  linkedPaymentMethods: PaymentMethod[];
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewTransactions: () => void;
  onAddRecurringPayment: () => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({ ... }) => {
  // 口座カードの実装
  // ドラッグ&ドロップ機能
  // 残高表示
  // 定期支払いリスト
  // 紐づき支払い手段リスト
};
```

##### PaymentMethodCard.tsx
```typescript
interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  linkedAccount: Account | undefined;
  unsettledAmount: number;
  recurringPayments: RecurringPayment[];
  onEdit: () => void;
  onDelete: () => void;
  onViewTransactions: () => void;
  onAddRecurringPayment: () => void;
  onLinkToAccount: () => void;
}

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({ ... }) => {
  // 支払い手段カードの実装
  // 未精算金額表示
  // 定期取引リスト
  // リンク状態表示
};
```

##### モーダルコンポーネント
各モーダルは独立したファイルとして実装し、以下の共通構造を持つ:

```typescript
interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 共通モーダルラッパーコンポーネント
export const ModalWrapper: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};
```

#### 4.3 カスタムフックの抽出

**新規作成ファイル:**
```
src/hooks/accounts/
├─ useAccountDragAndDrop.ts    # ドラッグ&ドロップロジック
├─ useAccountOperations.ts     # 口座CRUD操作
├─ usePaymentMethodOperations.ts  # 支払い手段CRUD操作
├─ useRecurringPayments.ts     # 定期支払い管理
└─ useTransactionOperations.ts # 取引操作
```

##### useAccountDragAndDrop.ts
```typescript
export const useAccountDragAndDrop = (
  accounts: Account[],
  onReorder: (newOrder: Account[]) => void
) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [touchState, setTouchState] = useState<TouchState | null>(null);

  const handleDragStart = (accountId: string) => { ... };
  const handleDragEnd = () => { ... };
  const handleDragOver = (accountId: string) => { ... };
  const handleDrop = (targetId: string) => { ... };

  const handleTouchStart = (accountId: string, e: React.TouchEvent) => { ... };
  const handleTouchMove = (e: React.TouchEvent) => { ... };
  const handleTouchEnd = () => { ... };

  return {
    draggedId,
    dragOverId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};
```

##### useAccountOperations.ts
```typescript
export const useAccountOperations = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);

  const createAccount = (account: Omit<Account, 'id'>) => { ... };
  const updateAccount = (id: string, updates: Partial<Account>) => { ... };
  const deleteAccount = (id: string) => { ... };
  const reorderAccounts = (newOrder: Account[]) => { ... };

  return {
    accounts,
    createAccount,
    updateAccount,
    deleteAccount,
    reorderAccounts,
  };
};
```

#### 4.4 リファクタリング後のAccountsPage.tsx

```typescript
// src/pages/AccountsPage.tsx（200行程度）

export const AccountsPage: React.FC = () => {
  // カスタムフック
  const { accounts, createAccount, updateAccount, deleteAccount, reorderAccounts } = useAccountOperations();
  const { paymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod } = usePaymentMethodOperations();
  const dragAndDrop = useAccountDragAndDrop(accounts, reorderAccounts);

  // モーダル状態管理
  const [openModal, setOpenModal] = useState<ModalType | null>(null);
  const [selectedItem, setSelectedItem] = useState<unknown>(null);

  // 総資産計算
  const totalAssets = useMemo(() => calculateTotalAssets(accounts), [accounts]);

  return (
    <div className="p-4 space-y-4">
      {/* 総資産カード */}
      <AssetCard
        totalAssets={totalAssets}
        scheduledBalance={scheduledBalance}
        showBreakdown={showBreakdown}
        onToggleBreakdown={() => setShowBreakdown(!showBreakdown)}
        gradientFrom={gradientFrom}
        gradientTo={gradientTo}
        onChangeGradient={() => setOpenModal('gradient-picker')}
      />

      {/* 内訳表示 */}
      {showBreakdown && (
        <AccountBreakdown
          accounts={accounts}
          members={members}
        />
      )}

      {/* 口座セクション */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">口座</h2>
          <button onClick={() => setOpenModal('account')}>
            <Plus size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {accounts.map(account => (
            <AccountCard
              key={account.id}
              account={account}
              member={members.find(m => m.id === account.memberId)}
              recurringPayments={recurringPayments.filter(rp => rp.accountId === account.id)}
              linkedPaymentMethods={getLinkedPaymentMethods(account.id)}
              isDragging={dragAndDrop.draggedId === account.id}
              isDragOver={dragAndDrop.dragOverId === account.id}
              onDragStart={(e) => dragAndDrop.handleDragStart(account.id)}
              onEdit={() => handleEditAccount(account)}
              onDelete={() => handleDeleteAccount(account.id)}
              {...dragAndDrop}
            />
          ))}
        </div>
      </section>

      {/* 未紐づき支払い手段セクション */}
      <section>
        {/* ... */}
      </section>

      {/* モーダル群 */}
      <AccountModal
        isOpen={openModal === 'account'}
        onClose={() => setOpenModal(null)}
        account={selectedItem as Account}
        onSave={createAccount}
      />

      {/* 他のモーダル... */}
    </div>
  );
};
```

---

## 📋 タスク5: レスポンシブ対応の強化

### 現状の問題
- タブレット（md:）サイズのブレークポイントが未使用
- デスクトップで横幅を活用できていない
- 1カラムレイアウトのみ

### 要件

#### 5.1 レスポンシブブレークポイント戦略

```typescript
// Tailwindブレークポイント
sm: 640px   // 小型タブレット（縦持ち）
md: 768px   // タブレット（横持ち）
lg: 1024px  // 小型デスクトップ
xl: 1280px  // デスクトップ
2xl: 1536px // 大型デスクトップ
```

#### 5.2 各ページのレスポンシブレイアウト

##### AccountsPage（ホーム）
```tsx
<div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
  {/* 総資産カード: 常にフル幅 */}
  <AssetCard className="mb-4" />

  {/* 内訳: デスクトップで2カラム */}
  {showBreakdown && (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <MemberBreakdown />
      <AccountTypeBreakdown />
    </div>
  )}

  {/* 口座カード: レスポンシブグリッド */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {accounts.map(account => (
      <AccountCard key={account.id} account={account} />
    ))}
  </div>
</div>
```

##### StatsPage（統計）
```tsx
<div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
  {/* グラフグリッド */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    {/* 月別推移: 大画面で横2つ分 */}
    <div className="lg:col-span-2">
      <MonthlyTrendChart />
    </div>

    {/* カテゴリ別円グラフ */}
    <CategoryPieChart />

    {/* メンバー別棒グラフ */}
    <MemberBarChart />

    {/* 予算進捗: 大画面で横2つ分 */}
    <div className="lg:col-span-2">
      <BudgetProgressBars />
    </div>
  </div>
</div>
```

##### TransactionsPage（取引履歴）
```tsx
<div className="flex flex-col md:flex-row max-w-7xl mx-auto">
  {/* サイドバー: デスクトップのみ表示 */}
  <aside className="hidden md:block md:w-64 lg:w-80 border-r border-gray-200 p-4">
    <FilterPanel />
  </aside>

  {/* メインコンテンツ */}
  <main className="flex-1 p-4">
    {/* 検索バー */}
    <SearchBar className="mb-4" />

    {/* モバイル: フィルタボタン */}
    <button className="md:hidden mb-4" onClick={() => setShowMobileFilter(true)}>
      <Filter size={20} /> フィルタ
    </button>

    {/* 取引リスト */}
    <TransactionList />
  </main>
</div>
```

#### 5.3 モーダルのレスポンシブ対応

```tsx
// 小型モーダル（確認ダイアログ等）
<div className="w-full sm:max-w-sm sm:rounded-xl rounded-t-xl">

// 中型モーダル（フォーム等）
<div className="w-full sm:max-w-md md:max-w-lg sm:rounded-xl rounded-t-xl">

// 大型モーダル（取引履歴等）
<div className="w-full sm:max-w-2xl md:max-w-4xl sm:rounded-xl rounded-t-xl">

// フルスクリーンモーダル（詳細表示）
<div className="w-full h-full md:max-w-3xl md:max-h-[90vh] md:rounded-xl">
```

#### 5.4 テーブルのレスポンシブ対応

```tsx
// モバイル: カード型表示
// デスクトップ: テーブル表示

export const TransactionList: React.FC = ({ transactions }) => {
  return (
    <>
      {/* デスクトップ: テーブル */}
      <table className="hidden md:table w-full">
        <thead>
          <tr>
            <th>日付</th>
            <th>カテゴリ</th>
            <th>金額</th>
            <th>メモ</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(t => (
            <tr key={t.id}>
              <td>{formatDate(t.date)}</td>
              <td>{t.category.name}</td>
              <td>{formatCurrency(t.amount)}</td>
              <td>{t.memo}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* モバイル: カード */}
      <div className="md:hidden space-y-2">
        {transactions.map(t => (
          <TransactionCard key={t.id} transaction={t} />
        ))}
      </div>
    </>
  );
};
```

#### 5.5 ナビゲーションのレスポンシブ対応

```tsx
// モバイル: ボトムナビゲーション
// デスクトップ: サイドバーナビゲーション

export const Layout: React.FC = () => {
  return (
    <div className="flex h-screen">
      {/* デスクトップ: サイドバー */}
      <nav className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-200">
        <div className="p-4">
          <h1 className="text-xl font-bold">家計簿</h1>
        </div>

        <div className="flex-1 px-2">
          <NavLink to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <Home size={20} />
            <span>ホーム</span>
          </NavLink>
          {/* 他のナビ項目 */}
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* モバイル: ボトムナビ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        {/* ボトムナビ項目 */}
      </nav>
    </div>
  );
};
```

#### 5.6 タッチジェスチャーとマウス操作の両立

```tsx
// スワイプジェスチャー（モバイル）
export const useSwipeGesture = (onSwipeLeft?: () => void, onSwipeRight?: () => void) => {
  const [touchStart, setTouchStart] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (diff < 0 && onSwipeRight) {
        onSwipeRight();
      }
    }
  };

  return { handleTouchStart, handleTouchEnd };
};

// 使用例: 取引カードのスワイプ削除
<TransactionCard
  onTouchStart={swipe.handleTouchStart}
  onTouchEnd={swipe.handleTouchEnd}
/>
```

---

## 📋 タスク6: カラーシステムの整理

### 現状の問題
- グレースケールに偏りすぎ
- セマンティックカラーが不明確
- ダークモード未対応
- カラーコントラストが不統一

### 要件

#### 6.1 セマンティックカラーシステムの定義

**ファイル:** `tailwind.config.js`（編集）

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // ブランドカラー
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',  // メインブランドカラー
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },

        // 成功・収入
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },

        // 危険・支出
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },

        // 警告・注意
        warning: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },

        // 情報
        info: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
      },
    },
  },
};
```

#### 6.2 カラー使用ルール

```typescript
// src/utils/colorSystem.ts（新規作成）

export const ColorUsage = {
  // ブランド・アクション
  primaryButton: 'bg-primary-600 hover:bg-primary-700 text-white',
  primaryButtonOutline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50',
  primaryText: 'text-primary-600',
  primaryBg: 'bg-primary-50',

  // 成功・収入
  successButton: 'bg-success-600 hover:bg-success-700 text-white',
  successText: 'text-success-600',
  successBg: 'bg-success-50',
  incomeAmount: 'text-success-600 font-semibold',

  // 危険・支出
  dangerButton: 'bg-danger-600 hover:bg-danger-700 text-white',
  dangerText: 'text-danger-600',
  dangerBg: 'bg-danger-50',
  expenseAmount: 'text-danger-600 font-semibold',

  // 警告・未精算
  warningButton: 'bg-warning-600 hover:bg-warning-700 text-white',
  warningText: 'text-warning-600',
  warningBg: 'bg-warning-50',
  unsettledAmount: 'text-warning-600 font-medium',

  // 情報
  infoButton: 'bg-info-600 hover:bg-info-700 text-white',
  infoText: 'text-info-600',
  infoBg: 'bg-info-50',

  // ニュートラル
  card: 'bg-white rounded-xl shadow-sm border border-gray-100',
  cardHeader: 'border-b border-gray-100 pb-3',
  divider: 'border-gray-200',
  textPrimary: 'text-gray-900',
  textSecondary: 'text-gray-600',
  textTertiary: 'text-gray-400',
} as const;

// 使用例
<button className={ColorUsage.primaryButton}>保存</button>
<p className={ColorUsage.expenseAmount}>¥10,000</p>
```

#### 6.3 ダークモードの実装

**ステップ1: Tailwind設定**
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // クラスベースのダークモード
  theme: {
    extend: {
      colors: {
        // ダークモード用カラー
        dark: {
          bg: {
            primary: '#0f172a',    // 背景
            secondary: '#1e293b',  // カード背景
            tertiary: '#334155',   // ホバー背景
          },
          text: {
            primary: '#f1f5f9',    // メインテキスト
            secondary: '#cbd5e1',  // サブテキスト
            tertiary: '#94a3b8',   // 補助テキスト
          },
          border: '#334155',       // ボーダー
        },
      },
    },
  },
};
```

**ステップ2: ダークモード切り替え**
```typescript
// src/hooks/useDarkMode.ts（新規作成）

export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDark));
  }, [isDark]);

  const toggle = () => setIsDark(!isDark);

  return { isDark, toggle };
};
```

**ステップ3: コンポーネントへの適用**
```tsx
// ダークモード対応のクラス例
<div className="bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary">
  <h2 className="text-gray-900 dark:text-dark-text-primary">見出し</h2>
  <p className="text-gray-600 dark:text-dark-text-secondary">本文</p>
</div>

// カード
<div className="bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-xl">
  {/* カード内容 */}
</div>

// ボタン
<button className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white">
  保存
</button>
```

**ステップ4: 設定ページにトグル追加**
```tsx
// src/pages/SettingsPage.tsx
import { useDarkMode } from '@/hooks/useDarkMode';

export const SettingsPage: React.FC = () => {
  const { isDark, toggle } = useDarkMode();

  return (
    <div className="p-4">
      <section className="bg-white dark:bg-dark-bg-secondary rounded-xl p-4">
        <h2 className="text-lg font-bold mb-3">表示設定</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">ダークモード</p>
            <p className="text-xs text-gray-500 dark:text-dark-text-tertiary">
              暗い背景色に切り替え
            </p>
          </div>

          <button
            onClick={toggle}
            className={`relative w-14 h-8 rounded-full transition-colors ${
              isDark ? 'bg-primary-600' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                isDark ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>
    </div>
  );
};
```

#### 6.4 アクセシブルなカラーコントラスト

```typescript
// src/utils/colorContrast.ts（新規作成）

// WCAG AA準拠（コントラスト比4.5:1以上）
export const AccessibleColors = {
  // 白背景での使用
  onWhite: {
    textPrimary: 'text-gray-900',      // 21:1
    textSecondary: 'text-gray-700',    // 12:1
    textTertiary: 'text-gray-600',     // 7:1
    danger: 'text-red-700',            // 5.5:1
    success: 'text-green-700',         // 5.8:1
    warning: 'text-orange-700',        // 5.2:1
    primary: 'text-blue-700',          // 6.5:1
  },

  // 暗い背景での使用
  onDark: {
    textPrimary: 'text-gray-50',       // 19:1
    textSecondary: 'text-gray-200',    // 14:1
    textTertiary: 'text-gray-400',     // 7:1
    danger: 'text-red-400',            // 5.1:1
    success: 'text-green-400',         // 5.5:1
    warning: 'text-orange-400',        // 5.3:1
    primary: 'text-blue-400',          // 6.2:1
  },
};
```

---

## ✅ 完了条件

### 高優先タスク:
- [ ] AccountsPageが200行程度に削減されている
- [ ] 9つの独立したコンポーネントファイルが作成されている
- [ ] 5つのカスタムフックが作成されている
- [ ] タブレット・デスクトップで2〜3カラムレイアウトが動作
- [ ] デスクトップでサイドバーナビゲーションが表示される
- [ ] セマンティックカラーシステムが定義されている
- [ ] ダークモードが実装され、切り替え可能

---

## 🎨 デザイン規約（CLAUDE.mdに準拠）

### TypeScript規約:
```typescript
// ❌ 禁止
const foo: any = ...;
enum Status { ... }

// ✅ 推奨
const foo: unknown = ...;
type Status = 'active' | 'inactive';

// コンポーネント定義
export const MyComponent: React.FC<MyComponentProps> = ({ ... }) => {
  return <div>...</div>;
};

// Props型定義（interfaceを使用）
interface MyComponentProps {
  title: string;
  onClose: () => void;
}
```

### ファイル命名規則:
- コンポーネント: PascalCase（`AccountCard.tsx`）
- Hooks: camelCase（`useAccountDragAndDrop.ts`）
- Services: camelCase（`accountService.ts`）
- 1ファイル1エクスポート原則

### Tailwind CSS使用規則:
- カスタムCSSは最小限に
- レスポンシブ: モバイルファースト（`sm:`、`md:`、`lg:`）
- スペーシング: `space-y-4`（16px）が標準
- 角丸: カードは`rounded-xl`、ボタンは`rounded-lg`

---

## 🚀 実装手順

### ステップ1: コンポーネント分割
1. `src/components/accounts/`ディレクトリを作成
2. AccountsPageから各カードコンポーネントを抽出
3. モーダルコンポーネントを独立ファイル化

### ステップ2: フック抽出
1. `src/hooks/accounts/`ディレクトリを作成
2. ドラッグ&ドロップロジックを抽出
3. CRUD操作ロジックを抽出

### ステップ3: レスポンシブ対応
1. Layoutコンポーネントにサイドバー追加
2. 各ページにグリッドレイアウト適用
3. モーダルサイズをレスポンシブ化

### ステップ4: カラーシステム
1. tailwind.config.jsにセマンティックカラー追加
2. useDarkMode.tsを作成
3. 主要コンポーネントにダークモード適用

### ステップ5: テスト
1. `npm run dev`で動作確認
2. レスポンシブ対応確認（モバイル/タブレット/デスクトップ）
3. ダークモード切り替え確認
