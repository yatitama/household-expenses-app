# CLAUDE.md

## プロジェクト概要
夫婦と子供の家族構成で、個人と共通の口座・カードを一元管理できる家計簿アプリ。
1人が全体を管理し、収支・予算・カード請求を可視化する。

## 技術スタック
- React 19 / TypeScript 5 / Vite / Tailwind CSS 4
- データ保存: localStorage
- グラフ: Recharts
- アイコン: Lucide React
- 日付操作: date-fns

## ディレクトリ構成
- `src/components/` - 再利用可能なUIコンポーネント
- `src/pages/` - ページコンポーネント
- `src/hooks/` - カスタムHooks
- `src/services/` - ビジネスロジック・localStorage操作
- `src/types/` - TypeScript型定義
- `src/utils/` - ユーティリティ関数
- `docs/` - 設計書・仕様書

## 開発コマンド
- `npm run dev` - 開発サーバー起動（http://localhost:5173）
- `npm run build` - プロダクションビルド
- `npm run preview` - ビルド結果のプレビュー
- `npm run lint` - ESLintによるコードチェック

## コーディング規約
- `any`禁止、`unknown`を使用
- Enum禁止、Union型で代替
- 関数コンポーネントのみ、`export const`で名前付きエクスポート
- Props型は`interface`で定義（`type`ではなく）
- ファイル名: PascalCase（コンポーネント）、camelCase（その他）
- 1ファイル1エクスポートを原則とする

## データモデル
主要な型定義は`src/types/`を参照。

- **Account**: 口座・カード情報（夫個人/妻個人/共通）
- **Transaction**: 収支記録
- **Category**: カテゴリ情報
- **Budget**: 月別予算
- **CardBilling**: カード請求情報

## 重要なルール
- データは全てlocalStorageに保存
- 将来的にクラウドDBへの移行を考慮した設計
- ビジュアル重視・シンプルな操作性を重視
- レスポンシブデザイン（モバイル対応）
- 色分けとアイコンで視認性を向上

## gh コマンド
- `gh`コマンドには必ず`-R yatitama/household-expenses-app`オプションを付けること
