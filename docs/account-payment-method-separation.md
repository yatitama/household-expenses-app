# 口座と支払い手段の分離 - 設計仕様書

## 概要
口座（資産）と支払い手段（クレジットカード等）を分離し、資産として表示するのは口座のみとする。
クレジットカード等の支払い手段は口座に紐づけ、請求時に引き落としを反映する。

## データモデル

### AccountType（口座タイプ）
```
'cash' | 'bank' | 'emoney'
```
- cash: 現金（財布）
- bank: 銀行口座
- emoney: 電子マネー（Suica, PayPay等、チャージ残高を持つもの）

### Account（口座・資産）
| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 一意ID |
| name | string | 口座名 |
| memberId | string | 所有者メンバーID |
| type | AccountType | 口座タイプ |
| balance | number | 残高 |
| color | string | 表示色 |
| icon? | string | アイコン名 |
| order? | number | 表示順序（ドラッグ&ドロップ対応） |
| createdAt/updatedAt | string | タイムスタンプ |

### PaymentMethodType（支払い手段タイプ）
```
'credit_card' | 'debit_card'
```

### BillingType（請求タイミング）
```
'immediate' | 'monthly'
```
- immediate: 即時引き落とし（デビットカードのデフォルト）
- monthly: 月次請求（クレジットカードのデフォルト）

### PaymentMethod（支払い手段）
| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 一意ID |
| name | string | カード名 |
| memberId | string | 所有者メンバーID |
| type | PaymentMethodType | 種類 |
| linkedAccountId | string | 引き落とし先口座ID |
| billingType | BillingType | 請求タイミング |
| closingDay | number? | 締め日（1-31、monthly時） |
| paymentDay | number? | 引き落とし日（1-31、monthly時） |
| paymentMonthOffset | number? | 引き落とし月オフセット（0=当月,1=翌月,2=翌々月） |
| color | string | 表示色 |
| icon? | string | アイコン名 |
| createdAt/updatedAt | string | タイムスタンプ |

### Transaction（取引記録）変更点
| フィールド | 型 | 説明 |
|---|---|---|
| accountId | string | 口座ID |
| paymentMethodId | string? | **新規** 支払い手段ID（カード使用時） |
| settledAt | string? | **新規** 精算日時（カード請求が口座に反映された日時） |

## 取引フロー

### 口座から直接支払い（現金・銀行振込・電子マネー）
1. accountId に口座を指定
2. 口座残高を即時更新

### 支払い手段で支払い（クレジットカード・デビットカード）
1. paymentMethodId にカードを指定
2. accountId には紐づき先口座IDを自動設定

#### billingType = 'immediate'（即時）
- 口座残高を即時更新
- settledAt に作成日時を設定

#### billingType = 'monthly'（月次請求）
- 口座残高は変更しない
- settledAt は未設定（ペンディング）
- 引き落とし日が過ぎたら自動精算:
  - settledAt を設定
  - 口座残高を減額

## 請求サイクル計算

取引日から引き落とし日を算出するロジック:

```
取引日の日 <= 締め日 → 当月の締め
取引日の日 > 締め日 → 翌月の締め
引き落とし日 = 締め月 + paymentMonthOffset の paymentDay日
```

例: 締め日15日、引き落とし日翌月10日の場合
- 1/5の取引 → 1/15締め → 2/10引き落とし
- 1/20の取引 → 2/15締め → 3/10引き落とし

## 表示仕様

### 口座ページ
- **口座セクション**: 口座一覧と残高（資産）
- **支払い手段セクション**: カード一覧と紐づき口座名
- 総資産 = 口座残高の合計のみ

### ダッシュボード
- 総資産に口座残高のみ表示
- 未精算のカード利用額を表示
- `¥500,000 (引落後: ¥470,000)` 形式で引き落とし後の金額も表示

### 取引追加ページ
- 支出時: 口座と支払い手段の両方から選択可能
- 収入時: 口座のみ選択可能

### 取引一覧
- 支払い手段を使った取引はカード名を表示

## マイグレーション
既存の credit_card / debit_card タイプの Account を PaymentMethod に変換。
linkedAccountId は空文字列 `''` に設定される（ユーザーが後から口座を紐付ける必要がある）。
