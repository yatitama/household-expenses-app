# ページ・機能仕様

## ページ一覧

| ページ | ファイル | パス | 概要 |
|---|---|---|---|
| 収支ページ | `AccountsPage.tsx` | `/` | 月別の収支サマリーと内訳表示 |
| お金ページ | `MoneyPage.tsx` | `/money` | 口座一覧、総資産、貯金目標 |
| 取引追加ページ | `AddTransactionPage.tsx` | `/add-transaction` | 収入/支出の入力フォーム |
| 履歴ページ | `TransactionsPage.tsx` | `/transactions` | 取引一覧、検索・フィルタ |
| 設定ページ | `SettingsPage.tsx` | `/settings` | 各種マスタ管理、データ管理 |

---

## 収支ページ（AccountsPage）

**ファイル**: `src/pages/AccountsPage.tsx`

月別の収支を可視化するホーム画面。

### 機能
- **月セレクタ**: 前月/次月のナビゲーション（スワイプ対応）
- **収入セクション**: 月内の収入取引をカテゴリ別にグリッド表示
- **支出セクション**: カテゴリ別、支払い手段別、メンバー別の3つのグループ切替で表示
- **定期取引セクション**: 当月に発生する定期取引の一覧
- **貯金目標セクション**: 当月の貯金目標と進捗
- **フッター**: 月の収入合計 - 支出合計 の差額を常時表示

### 使用モーダル
- `RecurringPaymentModal` — 定期取引の新規追加/編集
- `RecurringPaymentDetailModal` — 定期取引の詳細表示
- `CategoryTransactionsModal` — カテゴリ内の取引一覧
- `CardUnsettledDetailModal` — カード未精算取引の詳細
- `RecurringListModal` — 定期取引の一覧表示
- `SavingsMonthSheet` — 貯金目標の月別詳細
- `ConfirmDialog` — 削除確認

---

## お金ページ（MoneyPage）

**ファイル**: `src/pages/MoneyPage.tsx`

資産の全体像を管理する画面。

### 機能
- **口座グリッド**: メンバー別にグループ化された口座カード一覧
  - 各カードに残高と未精算額（引落後残高）を表示
  - ドラッグ&ドロップで並び替え可能
- **総資産カード**: 全口座残高の合計（グラデーション背景、カスタマイズ可能）
- **貯金目標セクション**: 各貯金目標のプログレスバーと達成率
- **支払い手段セクション**: 口座に未紐付けのカード一覧

### 使用モーダル
- `AccountModal` — 口座の新規追加/編集
- `AccountDetailModal` — 口座の詳細表示
- `PaymentMethodModal` — 支払い手段の新規追加/編集
- `AddTransactionModal` — 口座を指定した取引追加
- `RecurringPaymentModal` — 定期取引追加
- `ConfirmDialog` — 削除確認

---

## 取引追加ページ（AddTransactionPage）

**ファイル**: `src/pages/AddTransactionPage.tsx`

取引をすばやく登録するためのフォーム画面。

### 機能
- **収入/支出タブ切替**: タブで入力モードを切り替え
- **クイック追加テンプレート**: 事前に定義したテンプレートボタンで高速入力
- **入力フォーム**:
  - 金額入力
  - カテゴリ選択（アイコン付きグリッド）
  - 口座/支払い手段選択
  - 日付選択（デフォルト: 今日）
  - メモ入力
- **残高自動更新**:
  - 口座直接支払い → 即時残高更新
  - デビットカード（immediate） → 即時残高更新＋settledAt設定
  - クレジットカード（monthly） → 残高変更なし（ペンディング）

### 使用モーダル
- `QuickAddTemplateModal` — テンプレートの新規追加/編集

---

## 履歴ページ（TransactionsPage）

**ファイル**: `src/pages/TransactionsPage.tsx`

全取引を閲覧・検索・フィルタリングする画面。

### 機能
- **グループ切替**: 日付別 → カテゴリ別 → 口座別 → 支払い手段別 を順次トグル
- **定期取引の統合表示**: 実取引と定期取引の発生予定を同一リストに表示
- **フィルタ機能**（TransactionFilterSheet）:
  - 日付範囲
  - 取引種別（収入/支出）
  - カテゴリ（複数選択）
  - 口座（複数選択）
  - 支払い手段（複数選択）
  - 未精算のみ
  - テキスト検索（メモ・カテゴリ名）
  - ソート（日付順、金額順、カテゴリ順 × 昇順/降順）

### 使用モーダル
- `EditTransactionModal` — 取引の編集
- `CardUnsettledDetailModal` — 未精算取引詳細
- `RecurringPaymentDetailModal` — 定期取引詳細
- `RecurringPaymentModal` — 定期取引編集
- `TransactionFilterSheet` — フィルタパネル

---

## 設定ページ（SettingsPage）

**ファイル**: `src/pages/SettingsPage.tsx`

マスタデータと各種設定を管理する画面。

### セクション構成
1. **メンバー管理**: メンバーの一覧・追加・編集・削除（デフォルトメンバーは削除不可）
2. **カテゴリ管理**: 支出/収入カテゴリの一覧・追加・編集・削除
3. **カード管理**: 支払い手段の一覧・追加・編集・削除
4. **定期取引管理**: 定期支出/収入の一覧・追加・編集・削除・有効/無効切替
5. **貯金目標管理**: 貯金目標の一覧・追加・編集・削除（月別プレビュー付き）
6. **データ管理**:
   - JSON形式でデータエクスポート
   - JSONファイルからデータインポート
   - 全データの初期化（確認ダイアログ付き）

---

## 共通UIコンポーネント

### フィードバック系 (`src/components/feedback/`)

| コンポーネント | ファイル | 概要 |
|---|---|---|
| `ConfirmDialog` | `ConfirmDialog.tsx` | 確認ダイアログ（削除時等に使用） |
| `EmptyState` | `EmptyState.tsx` | データが空の時の表示 |
| `ErrorBoundary` | `ErrorBoundary.tsx` | Reactエラーバウンダリ |
| `LoadingSpinner` | `LoadingSpinner.tsx` | ローディングスピナー |
| `SkeletonLoader` | `SkeletonLoader.tsx` | スケルトンローダー |
| `Tooltip` | `Tooltip.tsx` | ツールチップ |

### 検索・フィルタ系 (`src/components/search/`)

| コンポーネント | ファイル | 概要 |
|---|---|---|
| `TransactionFilterSheet` | `TransactionFilterSheet.tsx` | 取引フィルタのボトムシート |
| `SearchBar` | `SearchBar.tsx` | テキスト検索バー |
| `FilterPanel` | `FilterPanel.tsx` | フィルタパネル |
| `FilterSidePanel` | `FilterSidePanel.tsx` | サイドパネル型フィルタ |
| `FloatingFilterMenu` | `FloatingFilterMenu.tsx` | フローティングフィルタメニュー |
| `SimpleFilterBar` | `SimpleFilterBar.tsx` | シンプルフィルタバー |
| `DateRangePicker` | `DateRangePicker.tsx` | 日付範囲選択 |
| `MultiSelect` | `MultiSelect.tsx` | 複数選択コンポーネント |
| `SortSelector` | `SortSelector.tsx` | ソート選択 |

### モーダル系 (`src/components/accounts/modals/`)

| コンポーネント | 概要 |
|---|---|
| `ModalWrapper` | モーダル共通ラッパー（背景オーバーレイ、閉じるボタン） |
| `AccountModal` | 口座の追加/編集フォーム |
| `AccountDetailModal` | 口座詳細（紐付きカード、直近取引） |
| `AccountTransactionsModal` | 口座の取引一覧 |
| `PaymentMethodModal` | 支払い手段の追加/編集フォーム |
| `PMTransactionsModal` | 支払い手段の取引一覧 |
| `AddTransactionModal` | 取引追加（口座指定済み） |
| `EditTransactionModal` | 取引編集 |
| `CategoryTransactionsModal` | カテゴリ内取引一覧 |
| `CardUnsettledListModal` | カード未精算取引一覧 |
| `CardUnsettledDetailModal` | 未精算取引詳細 |
| `RecurringPaymentModal` | 定期取引の追加/編集 |
| `RecurringPaymentDetailModal` | 定期取引の詳細 |
| `RecurringListModal` | 定期取引一覧 |
| `LinkedPaymentMethodModal` | カードと口座の紐付け管理 |
| `GradientPickerModal` | グラデーション色選択 |

---

## 情報表示シートの標準仕様

編集・追加以外の「情報を見るだけ」のシート（ボトムシート/モーダル）に適用するUIルール。

### 対象コンポーネント

| コンポーネント | 概要 |
|---|---|
| `AccountDetailModal` | 口座詳細 |
| `CardUnsettledDetailModal` | カード未精算取引の詳細 |
| `RecurringPaymentDetailModal` | 定期取引の詳細 |
| `CategoryTransactionsModal` | カテゴリ内取引一覧 |
| `CardUnsettledListModal` | カード未精算取引一覧 |
| `AccountTransactionsModal` | 口座の取引一覧 |
| `PMTransactionsModal` | 支払い手段の取引一覧 |

### UIルール

#### シートの形状
- **上辺の角丸なし**: モバイルでも `rounded-t-*` を付けない。上辺はフラット。
- **デスクトップでは角丸あり**: `sm:rounded-xl` のみ（デスクトップ中央表示時）。

#### 閉じ方
- **シート外タッチ（バックドロップクリック）** のみ、または **右上のバツ（✕）ボタン** のみで閉じる。
- ボトムに「閉じる」ボタンは配置しない。

#### ヘッダー
- シート右上に **✕ ボタン**（`X` アイコン、`size={18}`）を必ず配置する。
- ヘッダー下辺に **`border-b`** を付ける（コンテンツとの境界線）。
- **編集・削除アクション**がある場合は、フッターにボタンを置かず、シート名のすぐ右にアイコンのみ（Pencil など）を配置する。

  ```
  [シート名] [✏ アイコン（任意）] [🗑 アイコン（任意）] ......... [✕]
  ```

  アイコン押下で即座に対応するアクション（編集シートを開くなど）が実行される。

#### フッター（合計表示など）
- 情報表示のみのフッター（合計金額など）は **`border-t`** を上辺に付ける。
- フッター下辺にはボーダーを付けない（`border-b` 不可）。
- フッター内にボタンは置かない（「閉じる」「編集」いずれも不可）。

#### 実装パターン

```tsx
{/* バックドロップ（クリックで閉じる） */}
<div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[1000]" onClick={onClose}>
  {/* シート本体（上辺フラット、デスクトップのみ角丸） */}
  <div className="bg-white dark:bg-gray-800 w-full max-w-md sm:rounded-xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>

    {/* ヘッダー */}
    <div className="flex items-center justify-between p-3 sm:p-4 border-b dark:border-gray-700">
      <div className="flex items-center gap-2">
        <h3>シート名</h3>
        {onEdit && <button onClick={onEdit}><Pencil size={16} /></button>}
      </div>
      <button onClick={onClose}><X size={18} /></button>
    </div>

    {/* コンテンツ（スクロール可能） */}
    <div className="overflow-y-auto flex-1 p-3 sm:p-4">
      ...
    </div>

    {/* フッター（合計など、必要な場合のみ） */}
    <div className="border-t dark:border-gray-700 p-3 sm:p-4">
      ...
    </div>

  </div>
</div>
```
