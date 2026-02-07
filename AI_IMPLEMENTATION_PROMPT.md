# 家計簿アプリUI/UX改善実装プロンプト

## 🎯 目的
家計簿アプリのUI/UXを改善し、以下の最優先機能を実装する:
1. データ可視化（グラフ・チャート）
2. 検索・フィルタリング機能
3. ナビゲーション構造の改善

---

## 📋 タスク1: データ可視化の実装

### 要件
Rechartsを使用して、以下のグラフを実装してください:

#### 1.1 統計ページの新規作成
**ファイル:** `src/pages/StatsPage.tsx`

**実装内容:**
- 月別支出推移の折れ線グラフ（過去6ヶ月）
  - X軸: 月（2024年9月〜2025年2月）
  - Y軸: 支出金額
  - 収入と支出を2本の線で表示（収入: 緑、支出: 赤）

- カテゴリ別支出の円グラフ（当月）
  - 各カテゴリを色分け表示
  - パーセンテージとカテゴリ名を表示
  - クリックで詳細表示

- メンバー別支出の棒グラフ（当月）
  - メンバーごとの支出額を比較
  - 各メンバーの設定色を使用

- 予算vs実績の進捗バー（当月）
  - カテゴリごとの予算進捗
  - 予算超過時は赤色で警告表示

#### 1.2 データ取得ロジック
**ファイル:** `src/services/statsService.ts`（新規作成）

**実装内容:**
```typescript
export interface MonthlyStats {
  month: string;
  income: number;
  expense: number;
}

export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface MemberStats {
  memberId: string;
  memberName: string;
  amount: number;
  color: string;
}

export interface BudgetProgress {
  categoryId: string;
  categoryName: string;
  budget: number;
  actual: number;
  percentage: number;
}

// 各統計データを取得する関数を実装
export const getMonthlyStats = (months: number): MonthlyStats[] => { ... }
export const getCategoryStats = (year: number, month: number): CategoryStats[] => { ... }
export const getMemberStats = (year: number, month: number): MemberStats[] => { ... }
export const getBudgetProgress = (year: number, month: number): BudgetProgress[] => { ... }
```

#### 1.3 グラフコンポーネント
**ファイル:** `src/components/charts/`（新規ディレクトリ）

以下のコンポーネントを作成:
- `MonthlyTrendChart.tsx` - 月別推移折れ線グラフ
- `CategoryPieChart.tsx` - カテゴリ別円グラフ
- `MemberBarChart.tsx` - メンバー別棒グラフ
- `BudgetProgressBars.tsx` - 予算進捗バー

**デザイン要件:**
- カード型レイアウト（`bg-white rounded-xl shadow-sm p-4`）
- レスポンシブ対応（モバイル: フルスクリーン、デスクトップ: `md:grid-cols-2`）
- グラフの高さ: 250px（モバイル）、300px（デスクトップ）
- Tailwind CSS 4の色を使用
- アニメーション付き（Rechartsのデフォルトアニメーション）

---

## 📋 タスク2: 検索・フィルタリング機能の実装

### 要件

#### 2.1 取引履歴ページの新規作成
**ファイル:** `src/pages/TransactionsPage.tsx`

**実装内容:**
- 全取引の一覧表示（日付降順）
- 検索バー（上部固定）
  - 金額での検索（範囲指定可能）
  - メモでの検索（部分一致）
  - カテゴリでの検索

- フィルタパネル（トグル式）
  - 日付範囲フィルタ（開始日〜終了日）
  - メンバーフィルタ（複数選択可能）
  - カテゴリフィルタ（複数選択可能）
  - 取引タイプフィルタ（収入/支出）
  - 口座フィルタ
  - 支払い手段フィルタ

- ソート機能
  - 日付（昇順/降順）
  - 金額（昇順/降順）
  - カテゴリ（名前順）

#### 2.2 検索・フィルタリングロジック
**ファイル:** `src/hooks/useTransactionFilter.ts`（新規作成）

**実装内容:**
```typescript
export interface FilterOptions {
  searchQuery: string;
  dateRange: { start: Date | null; end: Date | null };
  memberIds: string[];
  categoryIds: string[];
  transactionType: 'all' | 'income' | 'expense';
  accountIds: string[];
  paymentMethodIds: string[];
  sortBy: 'date' | 'amount' | 'category';
  sortOrder: 'asc' | 'desc';
}

export const useTransactionFilter = () => {
  const [filters, setFilters] = useState<FilterOptions>({ ... });
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);

  // フィルタリングロジックを実装
  const applyFilters = () => { ... };

  return { filters, setFilters, filteredTransactions, applyFilters };
};
```

#### 2.3 検索UIコンポーネント
**ファイル:** `src/components/search/`（新規ディレクトリ）

以下のコンポーネントを作成:
- `SearchBar.tsx` - 検索バー（Searchアイコン付き）
- `FilterPanel.tsx` - フィルタパネル（折りたたみ可能）
- `DateRangePicker.tsx` - 日付範囲選択
- `MultiSelect.tsx` - 複数選択チェックボックス
- `SortSelector.tsx` - ソート選択ドロップダウン

**デザイン要件:**
- 検索バー: 上部固定（`sticky top-0`）、白背景
- フィルタパネル: アコーディオン式、アクティブフィルタ数を表示
- クリアボタン: フィルタをリセット
- 適用ボタン: フィルタを適用（青ボタン）

---

## 📋 タスク3: ナビゲーション構造の改善

### 要件

#### 3.1 ボトムナビゲーションの拡張
**ファイル:** `src/components/Layout.tsx`（既存ファイルを編集）

**変更内容:**
現在の2項目から4項目に拡張:

```typescript
ナビゲーション項目:
1. ホーム（Home） - 総資産・口座一覧（現在のAccountsPage）
   - アイコン: Home
   - パス: /

2. 取引（Transactions） - 取引履歴・検索（新規）
   - アイコン: List
   - パス: /transactions

3. 統計（Stats） - グラフ・分析（新規）
   - アイコン: TrendingUp
   - パス: /stats

4. 設定（Settings） - 設定・メンバー・カテゴリ
   - アイコン: Settings
   - パス: /settings
```

**デザイン要件:**
- アイコンサイズ: 24px
- アクティブ色: `text-blue-600`
- 非アクティブ色: `text-gray-400`
- ラベル: `text-xs`（アイコン下に表示）
- 背景: `bg-white border-t border-gray-200`
- 高さ: `h-16`
- 安全エリア対応: `pb-safe`

#### 3.2 ルーティングの追加
**ファイル:** `src/App.tsx`（既存ファイルを編集）

**追加ルート:**
```typescript
<Routes>
  <Route path="/" element={<Layout />}>
    <Route index element={<AccountsPage />} />
    <Route path="transactions" element={<TransactionsPage />} />
    <Route path="stats" element={<StatsPage />} />
    <Route path="settings" element={<SettingsPage />} />
  </Route>
</Routes>
```

#### 3.3 設定ページの整理
**ファイル:** `src/pages/SettingsPage.tsx`（既存ファイルを編集）

**変更内容:**
メンバー管理とカテゴリ管理を設定ページに統合:

```typescript
設定ページの構成:
├─ アプリ設定
│  ├─ データエクスポート
│  └─ データインポート
├─ メンバー管理（MembersPageから移動）
│  └─ メンバー一覧・追加・編集
└─ カテゴリ管理（CategoriesPageから移動）
   └─ カテゴリ一覧・追加・編集
```

**デザイン要件:**
- セクションごとにカード分け
- アコーディオン式（展開/折りたたみ）
- 各セクションにアイコン表示

---

## 🎨 デザイン規約

### 必ず従うべきルール:
1. **Tailwind CSS 4を使用**
   - カスタムCSSは最小限に
   - ユーティリティクラスを活用

2. **レスポンシブデザイン**
   - モバイルファースト
   - `sm:`（640px）、`md:`（768px）、`lg:`（1024px）ブレークポイントを使用

3. **色の使用**
   - プライマリ: `blue-600`
   - 成功/収入: `green-600`
   - 警告/支出: `red-600`
   - 注意: `orange-600`
   - グレー: `gray-50`〜`gray-900`

4. **スペーシング**
   - セクション間: `space-y-4`（16px）
   - カード間: `space-y-3`（12px）
   - カード内: `p-4`（16px）

5. **フォントサイズ**
   - 見出し: `text-xl`（20px）
   - 本文: `text-sm`（14px）
   - キャプション: `text-xs`（12px）
   - 最小サイズ: 12px（text-[9px]は使用禁止）

6. **角丸**
   - カード: `rounded-xl`
   - ボタン: `rounded-lg`
   - 入力欄: `rounded-lg`

---

## 💻 コーディング規約（CLAUDE.mdに準拠）

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
- コンポーネント: PascalCase（`TransactionsPage.tsx`）
- Hooks: camelCase（`useTransactionFilter.ts`）
- Services: camelCase（`statsService.ts`）
- 1ファイル1エクスポート原則

### インポート順序:
```typescript
// 1. React関連
import { useState, useEffect } from 'react';

// 2. 外部ライブラリ
import { LineChart, Line } from 'recharts';

// 3. 内部モジュール
import { Transaction } from '@/types';
import { getTransactions } from '@/services/transactionService';

// 4. コンポーネント
import { SearchBar } from '@/components/search/SearchBar';
```

---

## 📁 期待されるファイル構成

```
src/
├─ pages/
│  ├─ AccountsPage.tsx（既存）
│  ├─ TransactionsPage.tsx（新規）
│  ├─ StatsPage.tsx（新規）
│  ├─ SettingsPage.tsx（編集）
│  ├─ MembersPage.tsx（削除または統合）
│  └─ CategoriesPage.tsx（削除または統合）
├─ components/
│  ├─ Layout.tsx（編集）
│  ├─ charts/（新規ディレクトリ）
│  │  ├─ MonthlyTrendChart.tsx
│  │  ├─ CategoryPieChart.tsx
│  │  ├─ MemberBarChart.tsx
│  │  └─ BudgetProgressBars.tsx
│  └─ search/（新規ディレクトリ）
│     ├─ SearchBar.tsx
│     ├─ FilterPanel.tsx
│     ├─ DateRangePicker.tsx
│     ├─ MultiSelect.tsx
│     └─ SortSelector.tsx
├─ hooks/
│  └─ useTransactionFilter.ts（新規）
├─ services/
│  └─ statsService.ts（新規）
└─ App.tsx（編集）
```

---

## ✅ 完了条件

### タスク1（データ可視化）:
- [ ] StatsPage.tsxが作成され、4種類のグラフが表示される
- [ ] statsService.tsが作成され、統計データが正しく計算される
- [ ] グラフコンポーネントが4つ作成され、レスポンシブ対応している
- [ ] グラフがアニメーション付きで表示される

### タスク2（検索・フィルタリング）:
- [ ] TransactionsPage.tsxが作成され、全取引が表示される
- [ ] 検索バーで取引を検索できる
- [ ] フィルタパネルで条件を設定し、フィルタリングできる
- [ ] ソート機能が動作する
- [ ] useTransactionFilter.tsが作成され、フィルタリングロジックが実装されている

### タスク3（ナビゲーション）:
- [ ] ボトムナビゲーションが4項目に拡張されている
- [ ] 各ページへのルーティングが正しく設定されている
- [ ] 設定ページにメンバー管理とカテゴリ管理が統合されている
- [ ] アクティブ状態が視覚的に分かりやすい

---

## 🚀 実装手順

### ステップ1: データ可視化
1. `src/services/statsService.ts`を作成
2. `src/components/charts/`ディレクトリを作成
3. 各グラフコンポーネントを実装
4. `src/pages/StatsPage.tsx`を作成し、グラフを配置

### ステップ2: 検索・フィルタリング
1. `src/hooks/useTransactionFilter.ts`を作成
2. `src/components/search/`ディレクトリを作成
3. 検索UIコンポーネントを実装
4. `src/pages/TransactionsPage.tsx`を作成

### ステップ3: ナビゲーション
1. `src/components/Layout.tsx`を編集（ボトムナビ拡張）
2. `src/App.tsx`を編集（ルート追加）
3. `src/pages/SettingsPage.tsx`を編集（統合）

### ステップ4: テスト
1. `npm run dev`で動作確認
2. 各ページへの遷移確認
3. レスポンシブ対応確認
4. データの正確性確認

---

## 📝 注意事項

1. **既存のコードを壊さない**
   - 既存のAccountsPage、SettingsPageの機能は維持
   - localStorageのデータ構造は変更しない

2. **パフォーマンス**
   - 大量のデータでも快適に動作すること
   - 不要な再レンダリングを避ける（useMemo、useCallback活用）

3. **エラーハンドリング**
   - データが存在しない場合の空状態を表示
   - エラーが発生した場合の適切なメッセージ表示

4. **アクセシビリティ**
   - aria-label、aria-describedbyを適切に設定
   - キーボードナビゲーション対応

5. **Git運用**
   - ブランチ: `claude/improve-site-design-FFl1D`で作業
   - コミットメッセージ: 明確で簡潔に
   - 完了後にプッシュ

---

## 🎯 最終目標

ユーザーが家計簿データを**直感的に理解**し、**素早く検索**でき、**効率的に操作**できるアプリにすること。

---

以上のプロンプトに従って、実装を開始してください。
