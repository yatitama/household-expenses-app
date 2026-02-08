import { ChevronRight } from 'lucide-react';

export const HelpPage = () => {
  const glossary = [
    {
      title: '実質残高',
      description: 'カード請求や定期支払などの待機中の取引を考慮した、実際に使用可能な残高のこと。',
    },
    {
      title: '紐付',
      description: 'クレジットカードや支払い方法を特定の銀行口座に関連付けること。',
    },
    {
      title: '定期支払',
      description: '毎月または毎年自動的に発生する支出または収入。',
    },
    {
      title: 'カード請求',
      description: 'クレジットカードで購入した商品の代金。カード会社から口座に請求される。',
    },
    {
      title: 'グループ化',
      description: '取引を日付、カテゴリ、メンバーなどでまとめて表示する機能。',
    },
  ];

  const features = [
    {
      title: '口座管理',
      description: '銀行口座、現金、電子マネーなど複数の口座を一元管理できます。',
    },
    {
      title: '支払い方法リンク',
      description: 'クレジットカードを特定の口座に関連付けて、請求を自動追跡。',
    },
    {
      title: '定期支払管理',
      description: 'サブスクリプションや固定費などの定期的な支出を管理。',
    },
    {
      title: 'カルーセル表示',
      description: '複数の口座をスワイプして表示。モバイルで効率的に確認。',
    },
    {
      title: 'フィルター検索',
      description: 'チップベースのフィルターで素早く取引を検索。',
    },
    {
      title: 'ダークモード',
      description: '夜間の使用に最適なダークモード対応。',
    },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">ヘルプ</h1>
        <p className="text-gray-600 dark:text-gray-400">家計簿アプリの使い方と用語定義</p>
      </div>

      {/* 機能紹介 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">主な機能</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start gap-2">
                <ChevronRight size={20} className="text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{feature.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 用語定義 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">用語定義</h2>
        <div className="space-y-3">
          {glossary.map((term) => (
            <div
              key={term.title}
              className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
            >
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{term.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{term.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* よくある質問 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">よくある質問</h2>
        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Q: 家族で同じデバイスを使う場合、メンバーを分ける必要がありますか？
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              A: はい。メンバーを追加して、夫・妻・子供などで支出を分けて管理できます。設定から新しいメンバーを追加してください。
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Q: データはどこに保存されますか？
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              A: すべてのデータはお使いのデバイスのローカルストレージに保存されます。クラウドには保存されません。
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Q: 取引履歴を編集・削除することはできますか？
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              A: はい。取引履歴タブから任意の取引をタップして、編集または削除できます。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
