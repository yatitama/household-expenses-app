# ページ・機能仕様

## ページ一覧

| ページ | ファイル | パス | 概要 |
|---|---|---|---|
| 収支ページ | `AccountsPage.tsx` | `/` | 月別の収支サマリーと内訳表示 |
| お金ページ | `MoneyPage.tsx` | `/money` | 口座一覧、総資産、貯金目標 |
| 取引追加ページ | `AddTransactionPage.tsx` | `/add-transaction` | 収入/支出の入力フォーム |
| 貯金箱ページ | `PiggyBankPage.tsx` | `/piggy-bank` | 貯金箱ビジュアル、総資産表示 |
| 履歴ページ | `TransactionsPage.tsx` | `/transactions` | 取引一覧、検索・フィルタ |
| 設定ページ | `SettingsPage.tsx` | `/settings` | 各種マスタ管理、データ管理 |

---

## 収支ページ（AccountsPage）

**ファイル**: `src/pages/AccountsPage.tsx`

収支の推移と支出内訳を可視化するホーム画面。Recharts を使用したグラフ表示。

### 機能
- **収支推移グラフ**（棒グラフ）
  - 期間切り替え: 3ヶ月 / 半年 / 1年
  - グラフ種別切り替え: 収支（net）/ 支出 / 収入
  - 収支グラフは正負で色を変化（正: 青、負: 赤）
  - 支出: 赤、収入: 緑で表示
- **支出内訳（ドーナツ円グラフ）**
  - 月セレクタ: 前月/次月のナビゲーション
  - グループ切り替え: カテゴリごと / 支払元ごと / 引落口座ごと
  - 引落口座: カード払いは `linkedAccountId`、直接は `accountId` を使用
  - ドーナツ中央に月合計金額を表示
  - 凡例リスト: 各項目の名称・割合・金額・プログレスバーを表示

### 使用モーダル
なし（グラフのみの表示専用画面）

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
   - 月別予算設定対応（各メンバーに予算額を設定可能）
2. **カテゴリ管理**: 支出/収入カテゴリの一覧・追加・編集・削除
3. **予算管理**: 支出カテゴリの月別予算設定・編集・削除（年月ピッカー付き）
4. **カード管理**: 支払い手段の一覧・追加・編集・削除
   - 月別予算設定対応（各カードに予算額を設定可能）
5. **定期取引管理**: 定期支出/収入の一覧・追加・編集・削除・有効/無効切替
6. **貯金目標管理**: 貯金目標の一覧・追加・編集・削除（月別プレビュー付き）
7. **データ管理**:
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

> **⚠ 必須仕様: 新たに情報表示シートを追加・修正する際は、このセクションのルールを必ず遵守すること。**
> 対象一覧に新しいコンポーネントが増えた場合は、下記の対象コンポーネント表にも追記すること。

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

---

## 編集・追加フォームシートの標準仕様

> **⚠ 必須仕様: 新たに編集・追加フォームシートを実装・修正する際は、このセクションのルールを必ず遵守すること。**
> 対象一覧に新しいコンポーネントが増えた場合は、下記の対象コンポーネント表にも追記すること。

データを入力・送信する「編集」「追加」フォームシート（ボトムシート/モーダル）に適用するUIルール。

### 対象コンポーネント

| コンポーネント | 概要 |
|---|---|
| `AccountModal` | 口座の追加/編集 |
| `PaymentMethodModal` | 支払い手段の追加/編集 |
| `AddTransactionModal` | 取引の追加（モーダル版） |
| `EditTransactionModal` | 取引の編集 |
| `RecurringPaymentModal` | 定期取引の追加/編集 |
| `LinkedPaymentMethodModal` | 連携支払い手段の追加/編集 |
| `GradientPickerModal` | グラデーション選択 |
| `QuickAddTemplateModal` | クイック追加テンプレートの追加/編集 |
| `SavingsMonthSheet` | 貯金目標の月別金額設定 |
| `MemberModal`（SettingsPage内） | メンバーの追加/編集 |
| `CategoryModal`（SettingsPage内） | カテゴリの追加/編集 |
| `SavingsGoalModal`（SettingsPage内） | 貯金目標の追加/編集 |

### UIルール

#### シートの形状
- **上辺の角丸あり**: モバイルでは `rounded-t-xl`。デスクトップでは `sm:rounded-xl`。
- **最大高さ**: `max-h-[90vh]` でオーバーフロー時にスクロール可能にする。
- **コンテンツ領域**: `overflow-y-auto flex-1` でスクロール可能にする。

#### バックグラウンドスクロールの防止
- モーダルコンポーネント自身が `useBodyScrollLock(true)` を呼び出す。
- 親ページ側での `useBodyScrollLock` 呼び出しと併用しても問題ない（冪等）。
- **`document.body.style.overflow` を直接操作してはならない**。必ず `useBodyScrollLock` フックを使うこと。
- インポートパス: `modals/` 配下では `'../../../hooks/useBodyScrollLock'`、その他では相対パスで適宜調整。

#### 閉じ方
- **シート外タッチ（バックドロップクリック）** と **右上の ✕ ボタン** の両方で閉じられるようにする。
- バックドロップ `div` に `onClick={onClose}` を付け、シート本体（`form`）に `onClick={(e) => e.stopPropagation()}` を付ける。

#### ヘッダー
- `flex items-center justify-between p-3 sm:p-4 border-b dark:border-gray-700` を必ず付ける。
- 左側: タイトル（`text-base sm:text-lg font-bold`）の右横に削除アイコンを配置（`<Trash2 size={16} />`）。
- 右端: **✕ ボタン**（`<X size={18} />`）を必ず配置する。

  ```
  [シート名] [🗑 アイコン（削除対象あり時のみ）] ............. [✕]
  ```

#### フッター
- `border-t dark:border-gray-700 p-3 sm:p-4` を必ず付ける。
- **保存ボタン1つのみ**（全幅、`w-full`）。キャンセルボタンは置かない。
- 削除ボタンはフッターに置かず、ヘッダーのタイトル右横にアイコンのみで配置する。
- プレビュー情報（例: 毎月の貯金額）を表示する場合は保存ボタンの上に配置してよい。

#### 入力フィールド
- テキスト/数値/日付入力: `bg-gray-50 dark:bg-slate-700` を背景色として付ける。
- フォーカスリング: `focus:ring-2 focus:ring-primary-600`（`focus-visible:` ではなく `focus:` を使う）。

#### タッチ選択グリッド（カテゴリ・口座・支払い手段の選択）
- グリッド: 原則 `grid grid-cols-4 gap-2`。
- 各ボタン: `relative flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-lg transition-colors`。
- 選択時の背景: `bg-gray-100 dark:bg-gray-700`（`border` は付けない）。
- 選択インジケーター: ボタン右上に絶対配置のチェックマーク（`<Check size={14} strokeWidth={2.5} />`、`absolute -top-1 -right-1`）。
- **`border-primary-*` による選択表現は使用禁止**。

#### 実装パターン

```tsx
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock'; // パスは適宜調整

export const XxxModal = ({ item, onSave, onClose, onDelete }: XxxModalProps) => {
  const [field, setField] = useState(item?.field || '');
  useBodyScrollLock(true); // ← 必ずstateの後に呼ぶ

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ field });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-60" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 w-full sm:max-w-md sm:rounded-xl rounded-t-xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>

        {/* ヘッダー */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
              {item ? 'XXXを編集' : 'XXXを追加'}
            </h3>
            {item && onDelete && (
              <button type="button" onClick={() => { onDelete(item.id); onClose(); }}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" aria-label="削除">
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <button type="button" onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" aria-label="閉じる">
            <X size={18} />
          </button>
        </div>

        {/* コンテンツ（スクロール可能） */}
        <div className="overflow-y-auto flex-1 p-3 sm:p-4">
          <div className="space-y-4 sm:space-y-5">

            {/* テキスト入力例 */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">名前</label>
              <input type="text" value={field} onChange={(e) => setField(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                required />
            </div>

            {/* タッチ選択グリッド例 */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">選択</label>
              <div className="grid grid-cols-4 gap-2">
                {items.map((item) => (
                  <button key={item.id} type="button" onClick={() => setSelected(item.id)}
                    className={`relative flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-lg transition-colors ${
                      selected === item.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                    }`}>
                    {/* アイコン/アバター */}
                    <span className="text-[10px] sm:text-xs text-gray-900 dark:text-gray-200 text-center leading-tight">{item.name}</span>
                    {selected === item.id && (
                      <div className="absolute -top-1 -right-1">
                        <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* フッター（保存ボタンのみ） */}
        <div className="border-t dark:border-gray-700 p-3 sm:p-4">
          <button type="submit" className="w-full py-2 px-4 rounded-lg text-white font-medium text-sm transition-colors hover:opacity-90"
            style={{ backgroundColor: 'var(--theme-primary)' }}>
            保存
          </button>
        </div>

      </form>
    </div>
  );
};
```

---

## 貯金箱ページ（PiggyBankPage）

**ファイル**: `src/pages/PiggyBankPage.tsx`

貯金の進捗状況を視覚的に確認するページ。貯金箱のイラストで残高と貯金目標の達成度を表示。

### 機能
- **貯金箱ビジュアル**（`PiggyBankVisualization`）
  - SVGで描画された豚の貯金箱
  - 金額に応じて色が段階的に変化
    - 0円: グレー
    - 0～100万円: 青
    - 100～500万円: 紫
    - 500～1000万円: ピンク
    - 1000万円以上: 黄
  - 金額に応じた液体レベル表示（胴体内の楕円で表現）
  - 目標達成度をパーセンテージで表示（最大1000万円を基準）
  - ボブアニメーション（優しく上下動）
- **金額情報カード**
  - 全口座残高（合計、平均）
  - 貯金目標累計
  - 合計資産（グランドトータル）
- **口座別残高一覧**
  - プログレスバーで各口座の割合を可視化
  - 色付けは各口座の設定色に準拠

### 使用モーダル
なし（情報表示専用）

### コンポーネント
- `PiggyBankPage` — メインページコンポーネント
- `PiggyBankVisualization` — 貯金箱ビジュアルコンポーネント
