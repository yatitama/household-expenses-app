# アーキテクチャ概要

## 技術構成

| 項目 | 技術 | バージョン |
|---|---|---|
| UIフレームワーク | React | 19 |
| 言語 | TypeScript | ~5.9 |
| ビルドツール | Vite | 7 |
| CSSフレームワーク | Tailwind CSS | 4 |
| ルーティング | react-router-dom (HashRouter) | 7 |
| グラフ | Recharts | 3 |
| アイコン | Lucide React | 0.563 |
| 日付操作 | date-fns | 4 |
| トースト通知 | react-hot-toast | 2 |
| データ保存 | localStorage | - |

## ルーティング構成

`HashRouter` を使用（静的ホスティング対応）。全ルートは `Layout` コンポーネント内にネストされる。

| パス | ページコンポーネント | ナビラベル | 概要 |
|---|---|---|---|
| `/` | `AccountsPage` | 収支 | 月別収支サマリー、カテゴリ別・支払手段別の内訳 |
| `/money` | `MoneyPage` | お金 | 口座一覧、総資産、貯金目標の進捗 |
| `/add-transaction` | `AddTransactionPage` | 追加 | 取引登録フォーム、クイック追加テンプレート |
| `/transactions` | `TransactionsPage` | 履歴 | 取引一覧、フィルタ・検索・ソート |
| `/settings` | `SettingsPage` | 設定 | メンバー・カテゴリ・カード・定期取引・貯金目標・データ管理 |

## レイアウト構成

`src/components/Layout.tsx` が全ページの共通レイアウトを担当。

- **デスクトップ (md以上)**: 左サイドバー固定ナビゲーション（幅 `w-64`）
- **モバイル**: 画面下部に固定ボトムナビゲーション（高さ `h-16`）

ナビゲーション項目は5つ: 収支 / お金 / 追加 / 履歴 / 設定

## アプリ初期化フロー

`App.tsx` の `useEffect` で起動時に以下を順次実行:

1. **`runMigrations()`** — localStorageのデータスキーマをマイグレーション（現在v2）
2. **`initializeDefaultData()`** — メンバーとカテゴリが空の場合にデフォルトデータを投入
3. **`settleOverdueTransactions()`** — 引き落とし日を過ぎた未精算のカード取引を自動精算

## コンポーネントツリー

```
<StrictMode>
  <HashRouter>
    <ErrorBoundary>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<AccountsPage />} />
            <Route path="money" element={<MoneyPage />} />
            <Route path="add-transaction" element={<AddTransactionPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
        <Toaster />
      </ThemeProvider>
    </ErrorBoundary>
  </HashRouter>
</StrictMode>
```

## テーマシステム

- グレースケール固定（`ThemeColor = 'grayscale'`）
- `ThemeProvider` がマウント時にCSS変数をルートに設定
- CSS変数: `--theme-50` ～ `--theme-900`, `--theme-primary`, `--theme-primary-dark`, `--theme-primary-light`
- ダークモード: Tailwindの `dark:` クラスで対応。`<html>` に `dark` クラスを付与

## データ永続化

- 全データは `localStorage` にJSON形式で保存
- 各エンティティは `household_` プレフィックスのキーで格納
- サービス層 (`src/services/storage.ts`) が全CRUDを提供
- IDは `{timestamp}-{random7chars}` 形式で自動生成
- マイグレーションバージョン管理あり（現在v2）

## ディレクトリ構成

```
src/
├── App.tsx                    # ルートコンポーネント（ルーティング・初期化）
├── main.tsx                   # エントリポイント
├── index.css                  # グローバルCSS・CSS変数
├── components/
│   ├── Layout.tsx             # 共通レイアウト（サイドバー/ボトムナビ）
│   ├── FloatingActionButton.tsx # フローティングアクションボタン
│   ├── accounts/              # 口座・取引関連コンポーネント群
│   │   ├── modals/            # モーダルダイアログ群
│   │   ├── balanceHelpers.ts  # 残高計算ヘルパー
│   │   └── constants.ts       # 口座・カード関連の定数
│   ├── feedback/              # フィードバックUI（確認ダイアログ、ローディング等）
│   ├── quickAdd/              # クイック追加テンプレート関連
│   ├── savings/               # 貯金目標関連
│   └── search/                # 検索・フィルタ関連
├── contexts/
│   ├── ThemeContext.tsx        # テーマプロバイダー
│   └── theme.ts               # ThemeContext定義
├── hooks/                     # カスタムHooks
│   └── accounts/              # 口座操作系Hooks
├── pages/                     # ページコンポーネント
├── services/
│   ├── storage.ts             # データCRUD・マイグレーション
│   └── initialData.ts         # デフォルトデータ定義
├── types/
│   └── index.ts               # 全型定義
└── utils/                     # ユーティリティ関数
```
