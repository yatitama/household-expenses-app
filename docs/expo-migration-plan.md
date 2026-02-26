# Expo React Native 移行計画

## 概要

現在の React (Vite) Webアプリを Expo React Native に移行し、iOS/Android ネイティブアプリとして動作させる。
既存のアプリ仕様（機能・UI・データモデル・ビジネスロジック）は全て踏襲する。

## 移行の前提条件

### スマホ完結ワークフローの維持
現状のワークフロー（スマホだけで開発・動作確認）を維持するため、以下の構成とする:
- **コーディング**: Claude Code on the Web（スマホブラウザ）
- **動作確認**: Expo Go アプリ（同じスマホ）
- **開発サーバー接続**: `npx expo start --tunnel`（ngrok トンネル経由でリモートサーバーにスマホから接続）
- **ビルド**: EAS Build（クラウドビルド、ローカルPC不要）

### 技術スタック対応表

| 現在（Web） | 移行先（React Native） | 備考 |
|---|---|---|
| React 19 | React Native (Expo SDK 53) | Expo の最新安定版 |
| TypeScript 5.9 | TypeScript 5.9 | そのまま利用 |
| Vite 7 | Expo（Metro bundler） | ビルドツール変更 |
| Tailwind CSS 4 | NativeWind v4 | Tailwind の RN 版、`dark:` 構文そのまま使用可 |
| react-router-dom 7 | Expo Router v4 | ファイルベースルーティング |
| localStorage | AsyncStorage | `@react-native-async-storage/async-storage` |
| Recharts 3 | react-native-svg + victory-native | SVG ベースのチャートライブラリ |
| Lucide React | lucide-react-native | API ほぼ同一 |
| react-hot-toast | burnt (Expo 対応) | ネイティブトースト |
| date-fns 4 | date-fns 4 | 変更なし |
| `<div>`, `<span>` etc. | `<View>`, `<Text>` etc. | JSX 要素の全面置換 |

---

## フェーズ構成

### フェーズ 0: プロジェクト初期化（基盤構築）

#### 0-1. Expo プロジェクトの作成
```bash
npx create-expo-app@latest household-expenses-native --template blank-typescript
```
- 既存の `src/types/` はそのままコピー可能（React Native 非依存）
- `src/utils/formatters.ts`, `src/utils/savingsUtils.ts` もほぼそのまま利用可能

#### 0-2. 主要依存パッケージのインストール
```bash
# ナビゲーション（Expo Router）
npx expo install expo-router expo-linking expo-constants

# ストレージ
npx expo install @react-native-async-storage/async-storage

# スタイリング（NativeWind = Tailwind for RN）
npx expo install nativewind tailwindcss

# アイコン
npx expo install lucide-react-native react-native-svg

# チャート
npx expo install victory-native react-native-svg

# トースト通知
npx expo install burnt

# 日付
npm install date-fns

# ボトムシート
npx expo install @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler

# セーフエリア
npx expo install react-native-safe-area-context
```

#### 0-3. NativeWind (Tailwind) の設定
- `tailwind.config.ts` を作成し、既存のカスタムカラー（primary, grayscale テーマ）を移植
- `global.css` でCSS変数ベースのテーマを定義
- `dark:` プレフィックスによるダークモードは NativeWind が対応

#### 0-4. Expo Router のディレクトリ構造
```
app/
├── _layout.tsx          # ルートレイアウト（タブナビゲーション定義）
├── (tabs)/
│   ├── _layout.tsx      # タブレイアウト（5タブ）
│   ├── index.tsx        # AccountsPage（収支）
│   ├── money.tsx        # MoneyPage（お金）
│   ├── add-transaction.tsx  # AddTransactionPage（追加）
│   ├── transactions.tsx     # TransactionsPage（履歴）
│   └── settings.tsx         # SettingsPage（設定）
```

#### 0-5. 開発コマンドの設定
```json
{
  "scripts": {
    "start": "expo start --tunnel",
    "start:local": "expo start",
    "build:ios": "eas build --platform ios",
    "build:android": "eas build --platform android",
    "lint": "eslint ."
  }
}
```
- `--tunnel` がスマホ完結開発の鍵。リモートサーバーの Metro bundler にスマホの Expo Go から QR コードスキャンで接続可能

---

### フェーズ 1: コア層の移行（型・ストレージ・ユーティリティ）

#### 1-1. 型定義の移行
- `src/types/index.ts` → **そのままコピー**（React Native 依存なし）
- 変更不要

#### 1-2. ストレージサービスの移行（最重要）

**変更点**: `localStorage`（同期）→ `AsyncStorage`（非同期）

全ての CRUD 操作を `async/await` 化する必要がある。

```typescript
// 現在（同期）
const getItems = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

// 移行後（非同期）
const getItems = async <T>(key: string): Promise<T[]> => {
  const data = await AsyncStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};
```

**影響範囲**: ストレージの非同期化により、以下の全サービスの API が `async` になる:
- `memberService`, `accountService`, `paymentMethodService`
- `transactionService`, `categoryService`, `budgetService`
- `cardBillingService`, `recurringPaymentService`
- `linkedPaymentMethodService`, `quickAddTemplateService`
- `savingsGoalService`, `appSettingsService`

**対応方針**:
- 全サービスメソッドを `async` 化
- 呼び出し側（hooks, components）も `await` 対応
- React の `useEffect` 内でのデータ取得パターンに統一
- 初回ロード時にデータをメモリキャッシュし、読み取り性能を確保

**キャッシュ戦略**（パフォーマンス最適化）:
```typescript
// メモリキャッシュ付きストレージ
class CachedStorage<T> {
  private cache: T[] | null = null;

  async getAll(): Promise<T[]> {
    if (this.cache) return this.cache;
    this.cache = await getItems<T>(this.key);
    return this.cache;
  }

  async save(items: T[]): Promise<void> {
    this.cache = items;
    await AsyncStorage.setItem(this.key, JSON.stringify(items));
  }
}
```

#### 1-3. マイグレーションの移行
- `runMigrations()` を `async` 化
- `migrateV1ToV2()` のロジックはそのまま（AsyncStorage 対応のみ）
- 将来的に Web → Native のデータ移行ツールも検討（JSON エクスポート/インポートで対応可能、既存機能あり）

#### 1-4. ユーティリティ関数の移行

| ファイル | 移行難易度 | 備考 |
|---|---|---|
| `formatters.ts` | ◎ そのまま | `date-fns` 依存のみ、変更不要 |
| `savingsUtils.ts` | ◎ そのまま | 純粋関数、変更不要 |
| `billingUtils.ts` | △ 一部修正 | ストレージ呼び出しを `async` 化 |
| `recurringOccurrences.ts` | ◎ そのまま | 純粋関数、変更不要 |
| `colorUtils.ts` | △ 修正必要 | `getDarkModeAwareColor` を RN の `useColorScheme` に対応 |
| `categoryIcons.ts` | ○ 軽微 | `lucide-react` → `lucide-react-native` に import 変更 |
| `balanceHelpers.ts` | △ 一部修正 | ストレージ呼び出しを `async` 化 |

#### 1-5. 初期データの移行
- `initializeDefaultData()` を `async` 化
- デフォルトメンバー・カテゴリのデータはそのまま

---

### フェーズ 2: ナビゲーション・レイアウトの移行

#### 2-1. タブナビゲーション

**現在の Web 構成**:
- デスクトップ: 左サイドバー
- モバイル: ボトムナビゲーション

**移行後**:
- ネイティブアプリなのでボトムタブナビゲーションのみ（サイドバー不要）
- Expo Router の Tabs レイアウトを使用

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { TrendingUp, Wallet, Plus, List, Settings } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#374151',
      headerShown: false
    }}>
      <Tabs.Screen name="index" options={{
        title: '収支',
        tabBarIcon: ({ color }) => <TrendingUp color={color} size={24} />
      }} />
      <Tabs.Screen name="money" options={{
        title: 'お金',
        tabBarIcon: ({ color }) => <Wallet color={color} size={24} />
      }} />
      {/* ... */}
    </Tabs>
  );
}
```

#### 2-2. テーマ・ダークモード

**現在**: CSS 変数 + Tailwind `dark:` + `ThemeContext`
**移行後**: `useColorScheme()` + NativeWind `dark:` + `ThemeContext`

- NativeWind は `dark:` クラス名をそのまま使える
- `useDarkMode` hook は `useColorScheme()` (React Native API) をベースに書き換え
- CSS変数テーマは NativeWind の `tailwind.config.ts` のカラー定義に移植

---

### フェーズ 3: UI コンポーネントの移行

#### 3-1. 基本的な JSX 変換ルール

| Web | React Native | 備考 |
|---|---|---|
| `<div>` | `<View>` | |
| `<span>`, `<p>` | `<Text>` | テキストは必ず `<Text>` で囲む |
| `<button>` | `<Pressable>` or `<TouchableOpacity>` | |
| `<input>` | `<TextInput>` | |
| `<img>` | `<Image>` | |
| `<select>` | カスタム or BottomSheet ピッカー | RN に `<select>` はない |
| `<a>`, `<NavLink>` | `<Link>` (expo-router) | |
| `onClick` | `onPress` | |
| `className="..."` | `className="..."` | NativeWind により同じ構文で OK |
| `style={{ ... }}` | `style={{ ... }}` | 一部 CSS プロパティ未対応に注意 |

#### 3-2. ボトムシート・モーダルの移行

**現在**: カスタム CSS ボトムシート（`fixed inset-0` + `flex items-end`）
**移行後**: `@gorhom/bottom-sheet` ライブラリ

- 情報表示シート → `BottomSheet` + `BottomSheetScrollView`
- フォームシート → `BottomSheet` + `BottomSheetScrollView` + キーボード回避
- `useBodyScrollLock` → 不要（BottomSheet がネイティブで処理）
- 閉じる動作: BottomSheet のスワイプダウン + 背景タップ + ✕ ボタン

**BottomSheet 共通ラッパー**:
```typescript
// components/ui/AppBottomSheet.tsx
interface AppBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  snapPoints?: string[];
  children: React.ReactNode;
}
```

#### 3-3. コンポーネント移行の優先順位

**共有コンポーネント（先に移行）**:
1. `ConfirmDialog` → RN の `Alert.alert()` or カスタムモーダル
2. `EmptyState` → `View` + `Text` + アイコン
3. `LoadingSpinner` → `ActivityIndicator`
4. `ErrorBoundary` → React の ErrorBoundary（変更なし）
5. `ModalWrapper` → `AppBottomSheet` ラッパー

**フィードバック系**:
- `react-hot-toast` → `burnt`（ネイティブトースト）
- `Tooltip` → 長押しツールチップ or 削除（モバイルで不要な場合）

**検索・フィルタ系**:
- `TransactionFilterSheet` → BottomSheet 版に変換
- `SearchBar` → `TextInput` ベースに変換
- `DateRangePicker` → `@react-native-community/datetimepicker` or カスタム
- `MultiSelect` → BottomSheet 内チェックリスト
- `SortSelector` → BottomSheet 内ラジオリスト

#### 3-4. ページ別移行詳細

##### AccountsPage（収支）
- 月セレクター: スワイプジェスチャー → `react-native-gesture-handler` の Swipeable or PanGestureHandler
- カテゴリグリッド: `FlatList` + `numColumns`
- 支出セクション（カテゴリ/支払い手段/メンバー切替）: SegmentedControl or タブ
- 定期取引セクション: `FlatList`
- フッター: 固定 `View`

##### MoneyPage（お金）
- 口座グリッド: `FlatList` + `numColumns={2}`
- ドラッグ&ドロップ並び替え: `react-native-draggable-flatlist`
- 総資産カード: グラデーション → `expo-linear-gradient`
- 貯金目標プログレスバー: カスタム `View` or ライブラリ
- 支払い手段セクション: `FlatList`

##### AddTransactionPage（追加）
- 収入/支出タブ: SegmentedControl
- クイックテンプレート: `ScrollView` 横スクロール or グリッド
- 金額入力: `TextInput` with `keyboardType="numeric"`
- カテゴリ選択: グリッド（`FlatList` + `numColumns={4}`）
- 日付選択: `@react-native-community/datetimepicker`

##### TransactionsPage（履歴）
- トランザクションリスト: `SectionList`（グループ表示に最適）
- グループ切替: SegmentedControl
- フィルター: BottomSheet
- 定期取引統合: `SectionList` のデータに混合

##### SettingsPage（設定）
- セクション分けリスト: `SectionList`
- マスタ管理: 各種 BottomSheet フォーム
- データ管理: JSON エクスポート → `expo-file-system` + `expo-sharing`
- データインポート: `expo-document-picker` でファイル選択
- リセット: `Alert.alert()` 確認ダイアログ

#### 3-5. チャートの移行

**現在**: Recharts（SVG ベース Web チャート）
**移行後**: victory-native（React Native 対応 SVG チャート）

```typescript
// Web（Recharts）
<PieChart><Pie data={data} /></PieChart>

// RN（victory-native）
<VictoryPie data={data} />
```

- カテゴリ別円グラフ → `VictoryPie`
- 月別推移棒グラフ → `VictoryBar`
- 予算進捗バー → カスタム `View`（ライブラリ不要）

#### 3-6. スクロール・リスト最適化

| Web | React Native | 理由 |
|---|---|---|
| `<div className="overflow-y-auto">` | `<ScrollView>` | 基本スクロール |
| `.map()` でリスト描画 | `<FlatList>` | 仮想化による性能最適化 |
| グループ化リスト | `<SectionList>` | セクションヘッダー付きリスト |
| IntersectionObserver | `onViewableItemsChanged` | 可視判定 |

---

### フェーズ 4: プラットフォーム固有機能の対応

#### 4-1. セーフエリア対応
- `react-native-safe-area-context` の `SafeAreaView` でノッチ・ホームバーに対応
- 全ページのルートに `SafeAreaView` を配置

#### 4-2. キーボード回避
- フォーム画面で `KeyboardAvoidingView` を使用
- `Platform.OS` でiOS/Android の behavior を分岐

#### 4-3. ジェスチャー
- 月切替のスワイプ: `react-native-gesture-handler`
- ドラッグ&ドロップ: `react-native-draggable-flatlist`
- BottomSheet のスワイプ: `@gorhom/bottom-sheet` が内蔵

#### 4-4. ストレージ容量
- AsyncStorage のデフォルト上限: Android 6MB, iOS 無制限
- 大量のトランザクションデータ対策として、必要に応じて `expo-sqlite` への移行も検討

---

### フェーズ 5: ビルド・配信

#### 5-1. EAS Build 設定
```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

#### 5-2. アプリ設定
```json
// app.json
{
  "expo": {
    "name": "家計簿",
    "slug": "household-expenses",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "household-expenses",
    "userInterfaceStyle": "automatic",
    "ios": {
      "bundleIdentifier": "com.yourname.householdexpenses"
    },
    "android": {
      "package": "com.yourname.householdexpenses",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png"
      }
    }
  }
}
```

#### 5-3. 配信
- **開発中**: Expo Go で動作確認（`--tunnel` 経由）
- **テスト配布**: EAS Build → Internal Distribution（TestFlight / Android 内部テスト）
- **ストア公開**: EAS Submit（Apple App Store / Google Play Store）

---

## 移行手順書（実装順序）

### ステップ 1: プロジェクト初期化
1. Expo プロジェクトを新規作成
2. 依存パッケージをインストール
3. NativeWind を設定（`tailwind.config.ts`, `global.css`, `babel.config.js`）
4. Expo Router のファイル構造を作成
5. `npx expo start --tunnel` で Expo Go 接続を確認

### ステップ 2: コア層移行
1. `src/types/index.ts` をコピー
2. `src/services/storage.ts` を AsyncStorage 版に書き換え（全メソッド async 化）
3. `src/services/initialData.ts` を async 化
4. `src/utils/` の純粋関数をコピー（formatters, savingsUtils, recurringOccurrences）
5. `src/utils/billingUtils.ts` を async 化
6. `src/utils/colorUtils.ts` を RN 対応に修正
7. `src/utils/categoryIcons.ts` を lucide-react-native に変更

### ステップ 3: テーマ・ナビゲーション
1. `ThemeContext` を `useColorScheme` ベースに書き換え
2. `app/(tabs)/_layout.tsx` でタブナビゲーション定義
3. `app/_layout.tsx` でルートレイアウト + 初期化処理（migrations, defaultData, settle）

### ステップ 4: 共通コンポーネント
1. `AppBottomSheet`（BottomSheet ラッパー）を作成
2. `ConfirmDialog` を移行
3. `EmptyState` を移行
4. `LoadingSpinner` → `ActivityIndicator` に置換
5. トースト通知を `burnt` に切替

### ステップ 5: カスタム Hooks 移行
1. `useModalManager` → そのまま（React 依存のみ）
2. `useDarkMode` → `useColorScheme` ベースに書き換え
3. `useSwipeMonth` → `react-native-gesture-handler` ベースに書き換え
4. `useTransactionFilter` → async ストレージ対応
5. `useAccountOperations` → async ストレージ対応
6. `useAccountDragAndDrop` → `react-native-draggable-flatlist` ベースに書き換え
7. `useBodyScrollLock` → 削除（RN では不要）
8. `useFocusTrap` → 削除（RN では不要）
9. `useStickySectionHeader` → `SectionList` のスティッキーヘッダーに置換
10. `useKeyboardShortcuts` → 削除（モバイルアプリでは不要）

### ステップ 6: ページ移行（1ページずつ）
以下の順序で各ページを移行。1ページ移行するたびに Expo Go で動作確認:

1. **AddTransactionPage**（最もシンプルなフォーム画面から着手）
2. **SettingsPage**（マスタ管理、リスト表示中心）
3. **AccountsPage**（メイン画面、チャート含む）
4. **MoneyPage**（口座一覧、ドラッグ&ドロップ）
5. **TransactionsPage**（検索・フィルタ、最も複雑）

### ステップ 7: モーダル・シート移行
各ページで使用するモーダルを BottomSheet ベースに移行:
1. フォームシート群（AccountModal, PaymentMethodModal, EditTransactionModal 等）
2. 情報表示シート群（AccountDetailModal, CardUnsettledDetailModal 等）
3. 専用シート（TransactionFilterSheet, SavingsMonthSheet 等）

### ステップ 8: チャート移行
1. カテゴリ別円グラフ → victory-native
2. 予算進捗バー → カスタム View

### ステップ 9: テスト・調整
1. 全画面の動作確認（Expo Go）
2. ダークモード確認
3. パフォーマンス確認（大量データ時の FlatList 動作）
4. キーボード回避の確認（全フォーム画面）
5. セーフエリアの確認（ノッチ端末）

### ステップ 10: ビルド・配信準備
1. アプリアイコン・スプラッシュスクリーン作成
2. `eas.json` 設定
3. EAS Build でプレビュービルド作成
4. 実機で最終確認
5. ストア公開（必要に応じて）

---

## 移行時の注意点

### そのまま使えるもの（変更不要）
- `src/types/index.ts` — 全型定義
- `src/utils/formatters.ts` — 通貨・日付フォーマット
- `src/utils/savingsUtils.ts` — 貯金計算ロジック
- `src/utils/recurringOccurrences.ts` — 定期取引計算
- ビジネスロジック全般（計算処理、バリデーション）

### 大きく書き換えが必要なもの
- `src/services/storage.ts` — 全面 async 化（最も影響範囲が大きい）
- `src/components/Layout.tsx` — Expo Router タブに完全置換
- 全コンポーネントの JSX — `div` → `View`, `span` → `Text` 等
- ボトムシート/モーダル全般 — `@gorhom/bottom-sheet` に置換
- ドラッグ&ドロップ — `react-native-draggable-flatlist` に置換

### 削除するもの（RN では不要）
- `useBodyScrollLock` — BottomSheet がネイティブで処理
- `useFocusTrap` — RN のアクセシビリティシステムが処理
- `useKeyboardShortcuts` — 物理キーボードのショートカットは不要
- `useStickySectionHeader` — `SectionList` の `stickySectionHeadersEnabled` で代替
- Vite 関連設定ファイル — `vite.config.ts`, `postcss.config.js`

### Web 版との並行運用
移行は新規 Expo プロジェクトとして作成するため、Web 版のコードは残る。
データ移行は既存の JSON エクスポート/インポート機能を利用すれば可能。

---

## ディレクトリ構成（移行後）

```
household-expenses-native/
├── app/                          # Expo Router ページ
│   ├── _layout.tsx               #   ルートレイアウト
│   └── (tabs)/
│       ├── _layout.tsx           #   タブレイアウト
│       ├── index.tsx             #   AccountsPage
│       ├── money.tsx             #   MoneyPage
│       ├── add-transaction.tsx   #   AddTransactionPage
│       ├── transactions.tsx      #   TransactionsPage
│       └── settings.tsx          #   SettingsPage
├── src/
│   ├── components/               # UIコンポーネント
│   │   ├── ui/                   #   共通UIパーツ
│   │   │   ├── AppBottomSheet.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── EmptyState.tsx
│   │   ├── accounts/             #   口座・取引関連
│   │   │   └── sheets/           #     BottomSheet群
│   │   ├── quickAdd/             #   クイック追加テンプレート
│   │   ├── savings/              #   貯金目標
│   │   └── search/               #   検索・フィルタUI
│   ├── contexts/                 # React Context
│   ├── hooks/                    # カスタムHooks
│   │   └── accounts/
│   ├── services/                 # AsyncStorage CRUD
│   ├── types/                    # 型定義（Web版と同一）
│   └── utils/                    # ユーティリティ
├── assets/                       # アイコン・スプラッシュ
├── app.json                      # Expo 設定
├── eas.json                      # EAS Build 設定
├── tailwind.config.ts            # NativeWind 設定
├── babel.config.js               # Babel 設定（NativeWind プラグイン）
├── metro.config.js               # Metro bundler 設定
├── tsconfig.json
└── package.json
```

---

## 開発ワークフロー（スマホ完結）

### 日常の開発フロー
1. **Claude Code on the Web** をスマホブラウザで開く
2. Claude にコード変更を依頼
3. `npx expo start --tunnel` が実行中であれば、変更は自動的にホットリロードされる
4. **Expo Go** アプリに切り替えて動作確認
5. 問題があれば Claude Code に戻って修正

### 初回セットアップ
1. スマホに **Expo Go** アプリをインストール（App Store / Google Play）
2. Claude Code でプロジェクト初期化・依存パッケージインストール
3. `npx expo start --tunnel` を実行
4. Expo Go でQRコードをスキャン（ターミナル出力から）
5. 開発開始

### ビルド・配信
1. `eas build --platform ios` / `eas build --platform android` で EAS クラウドビルド
2. ビルド完了後、ダウンロードリンクがスマホで開ける
3. TestFlight / 内部テスト配布でインストール

---

## リスクと対策

| リスク | 影響 | 対策 |
|---|---|---|
| AsyncStorage の非同期化で全サービスのAPI変更 | 大 | キャッシュ付きストレージクラスで統一的に対応 |
| NativeWind が一部 Tailwind クラスに未対応 | 中 | 未対応クラスは StyleSheet.create で個別対応 |
| Recharts のチャートが RN で使えない | 中 | victory-native で同等の表現が可能 |
| BottomSheet のUI/UXが Web 版と異なる | 小 | ネイティブ感のある操作感になるためむしろ改善 |
| Expo Go の機能制限 | 小 | Development Build で完全なネイティブ機能を利用可能 |
| tunnel 接続の不安定さ | 中 | ネットワーク環境依存。代替として Development Build + EAS Update も検討 |

---

## 見積もり規模

| 項目 | ファイル数 | 備考 |
|---|---|---|
| 型定義 | 1 | コピーのみ |
| サービス層 | 3 | 全面 async 書き換え |
| ユーティリティ | 6 | 3つはコピー、3つは修正 |
| カスタム Hooks | 12 | 5つ削除、4つ修正、3つコピー |
| ページ | 5 | 全面書き換え |
| モーダル/シート | 20+ | 全面書き換え |
| 共通コンポーネント | 15+ | 全面書き換え |
| 設定ファイル | 6 | 新規作成 |
| **合計** | **70+ ファイル** | |
