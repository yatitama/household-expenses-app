# 家計簿アプリ

## 概要
夫婦と子供の家族構成で、個人と共通の口座・カードを一元管理できる家計簿アプリです。

## 主な機能
- 口座管理（夫個人/妻個人/共通口座）
- 収支記録（収入・支出の登録）
- 予算管理（カテゴリ別月予算設定）
- カード請求管理
- 統計とグラフ表示（月別収支、カテゴリ別支出）

## 技術スタック
- React 19 / TypeScript 5 / Vite / Tailwind CSS 4
- データ保存: localStorage
- グラフ: Recharts

## 開発コマンド
- `npm run dev` - 開発サーバー起動
- `npm run build` - プロダクションビルド
- `npm run preview` - ビルド結果のプレビュー
- `npm run lint` - ESLintによるコードチェック

## デプロイ
mainブランチへのpushで自動デプロイ（AWS S3 + CloudFront）

## 設計書
設計の詳細は `/docs/design.md` を参照してください。
