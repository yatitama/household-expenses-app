# サービス・Hooks・ユーティリティ仕様

## サービス層 (`src/services/`)

### storage.ts — データCRUDサービス

全エンティティに対してCRUD操作を提供する統一的なサービス層。`localStorage` をバックエンドとして使用。

#### 共通CRUD API

各サービスは以下の標準メソッドを持つ:

| メソッド | 戻り値 | 説明 |
|---|---|---|
| `getAll()` | `T[]` | 全件取得 |
| `getById(id)` | `T \| undefined` | ID指定で1件取得 |
| `create(input)` | `T` | 新規作成（id, timestamps自動付与） |
| `update(id, input)` | `T \| undefined` | 部分更新 |
| `delete(id)` | `boolean` | 削除 |

#### サービス一覧と追加メソッド

| サービス | 対象エンティティ | 追加メソッド |
|---|---|---|
| `memberService` | Member | `setAll(members)` |
| `accountService` | Account | `updateOrders(orders)` — 表示順更新 |
| `paymentMethodService` | PaymentMethod | — |
| `transactionService` | Transaction | `getByMonth(month)` — 月別取得 |
| `categoryService` | Category | `getByType(type)`, `setAll(categories)` |
| `budgetService` | Budget | `getByMonth(month)` |
| `cardBillingService` | CardBilling | `getByMonth(month)` |
| `recurringPaymentService` | RecurringPayment | — |
| `linkedPaymentMethodService` | LinkedPaymentMethod | `getByAccountId(id)`, `getByPaymentMethodId(id)` |
| `quickAddTemplateService` | QuickAddTemplate | — |
| `savingsGoalService` | SavingsGoal | `toggleExcludeMonth(id, month)`, `setMonthlyOverride(id, month, amount)` |
| `appSettingsService` | AppSettings | `get()`, `update(input)` ※標準CRUDとは異なる |

#### accountService 特記

- `getAll()` は `order` フィールドでソートして返す
- `create()` は既存の最大orderに+1した値を自動設定
- `updateOrders(orders: {id, order}[])` でドラッグ&ドロップ後の並び替えを保存

#### savingsGoalService 特記

- `toggleExcludeMonth(id, month)` — 指定月の除外/除外解除を切り替え
- `setMonthlyOverride(id, month, amount)` — 月別金額を上書き（`amount=null` で上書き削除）

### initialData.ts — デフォルトデータ

`initializeDefaultData()`: localStorageが空の場合にデフォルトデータを投入。

- デフォルトメンバー3名（共通, 夫, 妻）
- デフォルトカテゴリ15種（支出11 + 収入4）

### runMigrations()

localStorageのデータバージョンを確認し、必要なマイグレーションを実行。

- 現在バージョン: 2
- v1→v2: 口座と支払い手段の分離（詳細は `docs/account-payment-method-separation.md`）

---

## カスタムHooks (`src/hooks/`)

### useAccountOperations

**ファイル**: `src/hooks/accounts/useAccountOperations.ts`

口座・支払い手段・定期取引・紐付けのCRUD操作をまとめたHook。
確認ダイアログの状態管理と `refreshData()` によるデータ再読込を提供。

**返すもの**: 各エンティティのCRUD関数, 確認ダイアログ状態, refreshData

### useAccountDragAndDrop

**ファイル**: `src/hooks/accounts/useAccountDragAndDrop.ts`

口座カードの並び替え機能。マウスドラッグとタッチ（ロングプレス）の両方に対応。
ドラッグ中のオートスクロール機能付き。

### useTransactionFilter

**ファイル**: `src/hooks/useTransactionFilter.ts`

取引一覧のフィルタリングを管理するHook。

**フィルタ条件**:
- `searchQuery` — テキスト検索（メモ・カテゴリ名に対して部分一致）
- `startDate` / `endDate` — 日付範囲
- `selectedCategories` — カテゴリID配列
- `selectedType` — `'all' | 'income' | 'expense'`
- `selectedAccounts` — 口座ID配列
- `selectedPaymentMethods` — 支払い手段ID配列
- `unsettledOnly` — 未精算のみ
- `sortBy` — `'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'`

### useModalManager

**ファイル**: `src/hooks/useModalManager.ts`

モーダルの開閉状態を型安全に管理するHook。
モーダル種類: `'viewing-pm' | 'add-transaction' | 'recurring' | 'linked-pm'`

### useSwipeMonth

**ファイル**: `src/hooks/useSwipeMonth.ts`

タッチスワイプで月を前後に切り替えるジェスチャーHook。スライドアニメーション付き。

### useKeyboardShortcuts

**ファイル**: `src/hooks/useKeyboardShortcuts.ts`

グローバルキーボードショートカット:

| キー | 動作 |
|---|---|
| `N` | 新規取引追加（入力欄フォーカス時は無効） |
| `Escape` | モーダルを閉じる |
| `1` - `4` | ページ切替（収支/お金/履歴/設定） |
| `Ctrl+K` | 検索 |

### useBodyScrollLock

**ファイル**: `src/hooks/useBodyScrollLock.ts`

モーダル表示中にbodyスクロールをロックする。

### useFocusTrap

**ファイル**: `src/hooks/useFocusTrap.ts`

モーダル内にキーボードフォーカスを閉じ込める（Tab/Shift+Tabの循環）。

### useStickySectionHeader

**ファイル**: `src/hooks/useStickySectionHeader.ts`

IntersectionObserverでセクションヘッダーの固定表示状態を検知する。

### useDarkMode

**ファイル**: `src/hooks/useDarkMode.ts`

ダークモードの状態管理。localStorage永続化、`<html>`の`dark`クラス付与。

### useTheme

**ファイル**: `src/hooks/useTheme.ts`

`ThemeContext` へのアクセサ。

### useToast

**ファイル**: `src/hooks/useToast.ts`

`react-hot-toast` のラッパー。成功/エラー/情報のトースト通知。

---

## ユーティリティ関数 (`src/utils/`)

### billingUtils.ts — 請求・精算ロジック

| 関数 | 引数 | 戻り値 | 説明 |
|---|---|---|---|
| `calculatePaymentDate` | `(transactionDate, pm)` | `Date \| null` | 取引日とカード設定から引き落とし日を計算 |
| `getUnsettledTransactions` | `(paymentMethodId?)` | `Transaction[]` | 未精算のカード取引を取得 |
| `getPendingAmountByAccount` | `()` | `Record<string, number>` | 口座ごとの未精算額 |
| `getPendingAmountByPaymentMethod` | `()` | `Record<string, number>` | カードごとの未精算額 |
| `settleOverdueTransactions` | `()` | `void` | 引き落とし日を過ぎた取引を自動精算 |
| `calculateNextRecurringDate` | `(recurring, fromDate?)` | `Date \| null` | 定期取引の次回発生日を計算 |
| `calculateRecurringNextDate` | `(recurring, fromDate?)` | `Date \| null` | 上記のエイリアス |
| `getRecurringPaymentsForMonth` | `(year, month)` | `RecurringPayment[]` | 指定月に発生する定期取引を取得 |
| `getUpcomingRecurringPayments` | `(days?)` | `RecurringPayment[]` | N日以内に発生する定期取引 |
| `getPendingRecurringSummary` | `(days?)` | `{expense, income}` | 定期取引の支出/収入合計 |

### recurringOccurrences.ts — 定期取引の発生日計算

| 関数 | 引数 | 戻り値 | 説明 |
|---|---|---|---|
| `getRecurringOccurrencesInRange` | `(payments, rangeStart, rangeEnd)` | `RecurringOccurrence[]` | 期間内の全発生日を列挙 |

`RecurringOccurrence`: `{ payment: RecurringPayment, date: string }`

### savingsUtils.ts — 貯金目標計算

| 関数 | 引数 | 戻り値 | 説明 |
|---|---|---|---|
| `toYearMonth` | `(date)` | `string` | Date → `yyyy-MM` |
| `getCurrentMonth` | `()` | `string` | 現在月 `yyyy-MM` |
| `getNextMonth` | `(month)` | `string` | 翌月 |
| `getPrevMonth` | `(month)` | `string` | 前月 |
| `compareMonths` | `(a, b)` | `number` | 月の比較 |
| `getMonthsInRange` | `(start, end)` | `string[]` | 月リスト（両端含む） |
| `getTargetMonth` | `(targetDate)` | `string` | 目標日 → 対象月 |
| `calculateMonthlyAmount` | `(goal)` | `number` | 毎月の貯金額を計算 |
| `getEffectiveMonthlyAmount` | `(goal, month)` | `number` | 指定月の実効金額 |
| `calculateAccumulatedAmount` | `(goal, currentMonth)` | `number` | 累計貯金額 |
| `isMonthExcluded` | `(goal, month)` | `boolean` | 除外月チェック |
| `getRemainingMonthsCount` | `(goal, currentMonth)` | `number` | 残り月数 |

### formatters.ts — 表示フォーマット

| 関数 | 入力例 | 出力例 | 説明 |
|---|---|---|---|
| `formatCurrency` | `10000` | `¥10,000` | 通貨フォーマット（日本円） |
| `formatDate` | `"2026-02-04"` | `2月4日` | 日付（短縮形） |
| `formatDateFull` | `"2026-02-04"` | `2026年2月4日` | 日付（フル） |
| `getCurrentMonth` | — | `"2026-02"` | 現在月（`yyyy-MM`） |
| `formatMonth` | `"2026-02"` | `2026年2月` | 月フォーマット |

### colorUtils.ts — ダークモード対応カラー

| 関数 | 説明 |
|---|---|
| `hexToRgba(hex, alpha)` | hex → rgba変換 |
| `getDarkModeAwareColor(light, dark?, opacity?)` | ライト/ダーク対応色オブジェクト |
| `getCustomColorBgStyle(color, isDark)` | 背景色スタイルオブジェクト |
| `getIconBgStyle(color, isDark)` | アイコン背景色スタイル |

### categoryIcons.ts — カテゴリアイコン

| エクスポート | 型 | 説明 |
|---|---|---|
| `ICON_COMPONENTS` | `Record<string, Component>` | 36種のLucideアイコンのマップ |
| `ICON_NAMES` | `string[]` | アイコン名一覧 |
| `getCategoryIcon(name, size)` | `ReactElement` | アイコン名からReact要素を生成 |

### balanceHelpers.ts — 残高計算ヘルパー

**ファイル**: `src/components/accounts/balanceHelpers.ts`

| 関数 | 説明 |
|---|---|
| `revertTransactionBalance(transaction)` | 取引の残高影響を巻き戻す（編集/削除時） |
| `applyTransactionBalance(input)` | 取引の残高影響を適用する（新規/更新時） |

### constants.ts — 定数定義

**ファイル**: `src/components/accounts/constants.ts`

| エクスポート | 説明 |
|---|---|
| `ACCOUNT_TYPE_LABELS` | 口座タイプの表示ラベル |
| `PM_TYPE_LABELS` | 支払い手段タイプの表示ラベル |
| `BILLING_TYPE_LABELS` | 請求タイミングの表示ラベル |
| `COLORS` | 40色以上のカラーパレット |
