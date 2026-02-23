# データモデル仕様

型定義ファイル: `src/types/index.ts`（※ `AppSettings` のみ `src/services/storage.ts` で定義）

## エンティティ一覧

| エンティティ | 説明 | localStorageキー |
|---|---|---|
| Member | 家族メンバー | `household_members` |
| Account | 口座・資産 | `household_accounts` |
| PaymentMethod | 支払い手段（カード） | `household_payment_methods` |
| Transaction | 取引記録 | `household_transactions` |
| Category | カテゴリ | `household_categories` |
| Budget | 月別予算 | `household_budgets` |
| RecurringPayment | 定期取引 | `household_recurring_payments` |
| CardBilling | カード請求 | `household_card_billings` |
| LinkedPaymentMethod | カードと口座の紐付け | `household_linked_payment_methods` |
| QuickAddTemplate | クイック追加テンプレート | `household_quick_add_templates` |
| SavingsGoal | 貯金目標 | `household_savings_goals` |
| AppSettings | アプリ設定 | `household_app_settings` |

## ER関係図（テキスト表現）

```
Member (1) ──── (N) Account
Member (1) ──── (N) PaymentMethod
Account (1) ──── (N) Transaction
Account (1) ──── (1) PaymentMethod.linkedAccountId
PaymentMethod (1) ──── (N) Transaction.paymentMethodId
Category (1) ──── (N) Transaction.categoryId
Category (1) ──── (N) Budget.categoryId
Category (1) ──── (N) RecurringPayment.categoryId
PaymentMethod (1) ──── (N) CardBilling.paymentMethodId
PaymentMethod (1) ──── (N) LinkedPaymentMethod.paymentMethodId
Account (1) ──── (N) LinkedPaymentMethod.accountId
```

---

## Member（メンバー）

家族構成員。デフォルトで「共通」「夫」「妻」の3名が初期登録される。

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 一意ID。共通メンバーは `'common'` 固定 |
| name | string | 表示名 |
| color | string | 表示色（hex） |
| icon? | string | アイコン名 |
| isDefault? | boolean | デフォルトメンバーフラグ（`true`の場合削除不可） |
| budget? | number | 月予算額（オプション）。メンバー別予算表示に使用 |

定数: `COMMON_MEMBER_ID = 'common'`

デフォルトメンバー:
- `common` / 共通 / `#6b7280`
- `member-husband` / 夫 / `#374151`
- `member-wife` / 妻 / `#9ca3af`

---

## Account（口座・資産）

実際の残高を持つ資産。現金・銀行口座・電子マネーの3種類。

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 一意ID |
| name | string | 口座名 |
| memberId | string | 所有者メンバーID |
| type | `'cash' \| 'bank' \| 'emoney'` | 口座タイプ |
| balance | number | 現在残高 |
| color | string | 表示色 |
| icon? | string | アイコン名 |
| order? | number | 表示順序（ドラッグ&ドロップ対応） |
| createdAt | string | 作成日時（ISO 8601） |
| updatedAt | string | 更新日時（ISO 8601） |

AccountType:
- `cash` — 現金（財布）
- `bank` — 銀行口座
- `emoney` — 電子マネー（Suica, PayPay等）

---

## PaymentMethod（支払い手段）

クレジットカード・デビットカードなどの支払い手段。口座に紐づく。

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 一意ID |
| name | string | カード名 |
| memberId | string | 所有者メンバーID |
| type | `'credit_card' \| 'debit_card'` | 支払い手段タイプ |
| linkedAccountId | string | 引き落とし先口座ID |
| billingType | `'immediate' \| 'monthly'` | 請求タイミング |
| closingDay? | number | 締め日（1-31、monthly時のみ） |
| paymentDay? | number | 引き落とし日（1-31、monthly時のみ） |
| paymentMonthOffset? | number | 引き落とし月オフセット（0=当月, 1=翌月, 2=翌々月） |
| color | string | 表示色 |
| icon? | string | アイコン名 |
| budget? | number | 月予算額（オプション）。カード別予算表示に使用 |
| createdAt | string | 作成日時 |
| updatedAt | string | 更新日時 |

### 請求サイクル計算ロジック

```
取引日の日 <= 締め日 → 当月の締め
取引日の日 > 締め日 → 翌月の締め
引き落とし月 = 締め月 + paymentMonthOffset
引き落とし日 = paymentDay（月末を超えない範囲で調整）
```

例: 締め日15日、引き落とし日翌月10日（offset=1）
- 1/5の取引 → 1/15締め → 2/10引き落とし
- 1/20の取引 → 2/15締め → 3/10引き落とし

---

## Transaction（取引記録）

収入または支出の1件の取引。

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 一意ID |
| date | string | 取引日 (`yyyy-MM-dd`) |
| type | `'income' \| 'expense'` | 取引種別 |
| amount | number | 金額 |
| categoryId | string | カテゴリID |
| accountId | string | 口座ID |
| paymentMethodId? | string | 支払い手段ID（カード使用時） |
| settledAt? | string | 精算日 (`yyyy-MM-dd`)。未精算はundefined |
| memo? | string | メモ |
| createdAt | string | 作成日時 |
| updatedAt | string | 更新日時 |

### 取引フロー

**口座から直接支払い（現金・銀行振込等）:**
1. `accountId` に口座を指定
2. 口座残高を即時更新（支出なら減算、収入なら加算）

**カードで支払い:**
1. `paymentMethodId` にカードを指定
2. `accountId` にカードの `linkedAccountId` を自動設定
3. `billingType = 'immediate'` → 口座残高を即時更新、`settledAt` を設定
4. `billingType = 'monthly'` → 口座残高は変更しない、`settledAt` は未設定（ペンディング）
5. 引き落とし日が到来すると自動精算される（`settleOverdueTransactions()`）

---

## Category（カテゴリ）

取引の分類。収入用と支出用がある。

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 一意ID |
| name | string | カテゴリ名 |
| type | `'income' \| 'expense'` | 種別 |
| color | string | 表示色 |
| icon | string | Lucideアイコン名 |

デフォルト支出カテゴリ（11種）: 食費, 日用品, 光熱費, 通信費, 住居費, 教育費, 医療費, 交通費, 娯楽費, 衣服, その他
デフォルト収入カテゴリ（4種）: 給与（夫）, 給与（妻）, 賞与, その他収入

---

## Budget（月別予算）

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 一意ID |
| categoryId | string | カテゴリID |
| month | string | 対象月 (`yyyy-MM`) |
| amount | number | 予算額 |

---

## RecurringPayment（定期取引）

定期的に発生する支出または収入。実データは保存されず、発生日をオンデマンドで計算する。

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 一意ID |
| name | string | 名前 |
| amount | number | 金額 |
| type | `'income' \| 'expense'` | 種別 |
| periodType | `'months' \| 'days'` | 周期タイプ |
| periodValue | number | 周期値（何ヶ月/何日ごと） |
| startDate? | string | 開始日 (`yyyy-MM-dd`) |
| endDate? | string | 終了日 (`yyyy-MM-dd`) |
| isActive | boolean | 有効/無効 |
| categoryId? | string | カテゴリID |
| accountId? | string | 口座ID |
| paymentMethodId? | string | 支払い手段ID |
| createdAt | string | 作成日時 |
| updatedAt | string | 更新日時 |

---

## CardBilling（カード請求）

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 一意ID |
| paymentMethodId | string | 支払い手段ID |
| month | string | 対象月 (`yyyy-MM`) |
| billingAmount | number | 請求額 |
| dueDate | string | 引き落とし予定日 |
| isPaid | boolean | 支払い済みフラグ |
| memo? | string | メモ |

---

## LinkedPaymentMethod（カード紐付け）

PaymentMethodと口座の追加紐付け。`PaymentMethod.linkedAccountId` とは別に、複数口座への紐付けを管理する。

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 一意ID |
| paymentMethodId | string | 支払い手段ID |
| accountId | string | 紐付け先口座ID |
| isActive | boolean | 有効/無効 |
| createdAt | string | 作成日時 |
| updatedAt | string | 更新日時 |

---

## QuickAddTemplate（クイック追加テンプレート）

取引入力を高速化するテンプレート。

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 一意ID |
| name | string | テンプレート名 |
| type | `'income' \| 'expense'` | 種別 |
| categoryId? | string | デフォルトカテゴリID |
| amount? | number | デフォルト金額 |
| accountId? | string | デフォルト口座ID |
| paymentMethodId? | string | デフォルト支払い手段ID |
| date? | string | デフォルト日付 |
| memo? | string | デフォルトメモ |
| createdAt | string | 作成日時 |
| updatedAt | string | 更新日時 |

---

## SavingsGoal（貯金目標）

目標金額・期限を設定し、毎月の積立額を自動計算する。

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 一意ID |
| name | string | 貯金名（例: 旅行貯金） |
| targetAmount | number | 目標金額 |
| targetDate | string | 目標期限 (`yyyy-MM`) |
| startMonth | string | 開始月 (`yyyy-MM`) |
| excludedMonths | string[] | 除外月リスト (`yyyy-MM` 形式) |
| monthlyOverrides? | Record<string, number> | 月別金額上書き（`yyyy-MM` → 金額） |
| createdAt | string | 作成日時 |
| updatedAt | string | 更新日時 |

### 月額計算ロジック

1. 開始月〜目標月の全月リストを取得
2. 除外月を除いた有効月リストを作成
3. 月別上書きの確定金額を合計
4. `(目標金額 - 上書き合計) / 非上書き有効月数` = 通常月額（切り上げ）

---

## AppSettings（アプリ設定）

| フィールド | 型 | 説明 | デフォルト |
|---|---|---|---|
| totalAssetGradientFrom | string | 総資産カードのグラデーション開始色 | `#3b82f6` |
| totalAssetGradientTo | string | 総資産カードのグラデーション終了色 | `#2563eb` |

---

## マイグレーション

バージョンは `household_migration_version` で管理。

### v1 → v2: 口座と支払い手段の分離
- 旧 `Account` の `paymentMethod: 'credit_card' | 'debit_card'` を持つレコードを `PaymentMethod` に分離
- 旧 `Account` の `paymentMethod: 'cash' | 'bank' | 'emoney'` を持つレコードは新 `Account` として維持
- 該当する `Transaction.accountId` を `Transaction.paymentMethodId` に移行
- 詳細: `docs/account-payment-method-separation.md`
