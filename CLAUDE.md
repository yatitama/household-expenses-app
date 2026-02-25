# CLAUDE.md

## プロジェクト概要
夫婦と子供の家族構成で、個人と共通の口座・カードを一元管理できる家計簿アプリ。
1人が全体を管理し、収支・予算・カード請求を可視化する。SPAとしてlocalStorageにデータを保存。

## 技術スタック
- React 19 / TypeScript 5.9 / Vite 7 / Tailwind CSS 4
- ルーティング: react-router-dom 7（HashRouter）
- データ保存: localStorage
- グラフ: Recharts 3
- アイコン: Lucide React
- 日付操作: date-fns 4
- 通知: react-hot-toast

## 開発コマンド
- `npm run dev` — 開発サーバー起動（http://localhost:5173）
- `npm run build` — プロダクションビルド（`tsc -b && vite build`）
- `npm run preview` — ビルド結果のプレビュー
- `npm run lint` — ESLintによるコードチェック

## コミット前の必須手順
**コミット前に必ず以下を実行し、エラーがないことを確認すること:**
1. `npm install` — 依存パッケージのインストール/更新
2. `npm run build` — TypeScript型チェック＋Viteビルド

ビルドエラーがある状態でコミットしてはならない。

## コーディング規約
- `any`禁止、`unknown`を使用
- Enum禁止、Union型で代替
- 関数コンポーネントのみ、`export const`で名前付きエクスポート
- Props型は`interface`で定義（`type`ではなく）
- ファイル名: PascalCase（コンポーネント）、camelCase（その他）
- 1ファイル1エクスポートを原則とする

## UIコンポーネント規約

### 情報表示シート（閲覧専用ボトムシート/モーダル）
**編集・追加フォーム以外の「情報を見るだけ」のシートを新規作成・修正する際は、必ず以下の仕様に従うこと。**
詳細仕様: `docs/pages-and-features.md` の「情報表示シートの標準仕様」セクション

- 上辺の角丸なし（`rounded-t-*` 禁止）。デスクトップのみ `sm:rounded-xl`
- **閉じ方は右上の ✕ ボタンとシート外タッチのみ**。ボトムに「閉じる」ボタンを置かない
- ヘッダー右端に ✕ ボタン必須（`X` アイコン `size={18}`）、ヘッダー下辺に `border-b` 必須
- 編集・削除アクションはフッターではなく、**シート名の右隣にアイコンのみ**配置
- フッター（合計表示など）は上辺に `border-t`、下辺にボーダーなし、ボタン禁止

### 編集・追加フォームシート（フォーム入力ボトムシート/モーダル）
**編集・追加フォームシートを新規作成・修正する際は、必ず以下の仕様に従うこと。**
詳細仕様: `docs/pages-and-features.md` の「編集・追加フォームシートの標準仕様」セクション

- 上辺の角丸あり（`rounded-t-xl`）。デスクトップでは `sm:rounded-xl`
- **`useBodyScrollLock(true)` をコンポーネント内で必ず呼ぶ**（親ページへの依存禁止）
- **シート外タッチで閉じる**: バックドロップ `div` に `onClick={onClose}`、シート本体に `onClick={(e) => e.stopPropagation()}`
- ヘッダー: `border-b` 必須、右端に ✕ ボタン（`X` `size={18}`）、削除アイコンはタイトル右横のみ
- **フッターは保存ボタン（`w-full`）のみ**。キャンセルボタン・削除ボタン禁止
- 入力欄: `bg-gray-50 dark:bg-slate-700` 背景、`focus:ring-2 focus:ring-primary-600`
- タッチ選択グリッド: `grid-cols-4`、選択時は `bg-gray-100 dark:bg-gray-700` + チェックバッジ（`border` 禁止）
- **`document.body.style.overflow` の直接操作禁止**（`useBodyScrollLock` を使うこと）

## ディレクトリ構成
```
src/
├── components/           # UIコンポーネント
│   ├── accounts/         #   口座・取引関連
│   │   ├── GrowthHeader.tsx
│   │   ├── TrendChart.tsx              # 成長指標
│   │   ├── MonthComparisonCards.tsx
│   │   ├── AchievementBadges.tsx
│   │   ├── SavingsProgressTimeline.tsx
│   │   ├── CardGridSection.tsx
│   │   └── modals/                     # モーダルダイアログ群（16種）
│   ├── feedback/         #   フィードバックUI（ConfirmDialog, ErrorBoundary等）
│   ├── quickAdd/         #   クイック追加テンプレート
│   ├── savings/          #   貯金目標
│   └── search/           #   検索・フィルタUI
├── contexts/             # React Context（テーマ）
├── hooks/                # カスタムHooks
│   ├── accounts/         #   口座操作系
│   └── useGrowthMetrics.ts              # 成長指標計算
├── pages/                # ページコンポーネント（5画面）
├── services/             # データ永続化・ビジネスロジック
├── types/                # TypeScript型定義
└── utils/                # ユーティリティ関数
```

## ページ構成（ルーティング）
| パス | コンポーネント | 概要 |
|---|---|---|
| `/` | `AccountsPage` | 月別収支サマリー・カテゴリ別内訳 |
| `/money` | `MoneyPage` | 口座一覧・総資産・貯金目標 |
| `/add-transaction` | `AddTransactionPage` | 取引登録フォーム |
| `/transactions` | `TransactionsPage` | 取引一覧・検索・フィルタ |
| `/settings` | `SettingsPage` | マスタ管理・データ管理 |

## データモデル概要
型定義: `src/types/index.ts` / 詳細仕様: `docs/data-models.md`

| エンティティ | 説明 |
|---|---|
| Member | 家族メンバー（共通・夫・妻） |
| Account | 口座（cash/bank/emoney）— 残高を持つ資産 |
| PaymentMethod | 支払い手段（credit_card/debit_card）— 口座に紐づく |
| Transaction | 取引記録（収入/支出） |
| Transfer | 振込記録（口座間送金） |
| Category | カテゴリ（支出11種+収入4種がデフォルト） |
| Budget | 月別予算 |
| RecurringPayment | 定期取引（発生日はオンデマンド計算） |
| CardBilling | カード請求情報 |
| LinkedPaymentMethod | カードと口座の追加紐付け |
| QuickAddTemplate | クイック追加テンプレート |
| SavingsGoal | 貯金目標（月額自動計算） |

## 重要なビジネスロジック
- **口座と支払い手段は分離**: 口座が資産（残高）を持ち、カードは口座に紐づく支払い手段
- **精算ロジック**: 即時精算（debit/cash）と月次精算（credit）の2種。詳細は `docs/account-payment-method-separation.md`
- **自動精算**: アプリ起動時に引き落とし日を過ぎた未精算取引を自動処理
- **定期取引**: データは定義のみ保存、発生日は `calculateNextRecurringDate()` でオンデマンド計算
- **貯金目標**: 月別上書き・除外月に対応した月額自動計算

## 主要サービス・ユーティリティ
- `src/services/storage.ts` — 全エンティティのCRUD、マイグレーション
- `src/utils/billingUtils.ts` — 請求日計算、精算処理、定期取引計算
- `src/utils/savingsUtils.ts` — 貯金目標の月額・累計計算
- `src/utils/formatters.ts` — 通貨・日付フォーマット（日本語）

詳細仕様: `docs/services-hooks-utils.md`

## 仕様ドキュメント一覧
| ドキュメント | 内容 |
|---|---|
| `docs/architecture.md` | アーキテクチャ概要、ルーティング、初期化フロー、ディレクトリ構成 |
| `docs/data-models.md` | 全データモデルの詳細仕様、フィールド定義、ER関係 |
| `docs/pages-and-features.md` | 各ページの機能仕様、使用コンポーネント・モーダル一覧 |
| `docs/services-hooks-utils.md` | サービス層API、カスタムHooks、ユーティリティ関数の詳細 |
| `docs/account-payment-method-separation.md` | 口座と支払い手段の分離設計（ADR） |
| `docs/design.md` | 初期設計書（一部は実装と乖離あり） |

## ドキュメント同期ルール
ソースコードを修正した際は、以下を必ず確認し、関連するドキュメントを最新の状態に更新すること:

- **型定義・データモデル変更時** → `docs/data-models.md`, `docs/account-payment-method-separation.md`
- **ページ追加・ルーティング変更時** → `docs/architecture.md`, `docs/pages-and-features.md`, CLAUDE.md のページ構成テーブル
- **コンポーネント追加・モーダル追加時** → `docs/pages-and-features.md`（情報表示シートの場合は標準仕様セクションの対象一覧も更新）
- **サービス・Hook・ユーティリティ変更時** → `docs/services-hooks-utils.md`
- **技術スタック・依存関係変更時** → `docs/architecture.md`, CLAUDE.md の技術スタック
- **ディレクトリ構成変更時** → `docs/architecture.md`, CLAUDE.md のディレクトリ構成

ドキュメントが実装と乖離した状態を放置しないこと。

## 重要なルール
- データは全てlocalStorageに保存
- 将来的にクラウドDBへの移行を考慮した設計
- ビジュアル重視・シンプルな操作性を重視
- レスポンシブデザイン（モバイルはボトムナビ、デスクトップはサイドバー）
- グレースケールベースのテーマ、ダークモード対応

## gh コマンド
- `gh`コマンドには必ず`-R yatitama/household-expenses-app`オプションを付けること
