import { Link } from 'react-router-dom';
import { Database, Download, Upload, Trash2, Users, Tag, ChevronRight } from 'lucide-react';
import { accountService, transactionService, categoryService, budgetService, memberService } from '../services/storage';

export const SettingsPage = () => {
  const handleExport = () => {
    const data = {
      members: memberService.getAll(),
      accounts: accountService.getAll(),
      transactions: transactionService.getAll(),
      categories: categoryService.getAll(),
      budgets: budgetService.getAll(),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `household-expenses-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text) as {
          members?: unknown[];
          accounts?: unknown[];
          transactions?: unknown[];
          categories?: unknown[];
          budgets?: unknown[];
        };

        if (data.members) {
          localStorage.setItem('household_members', JSON.stringify(data.members));
        }
        if (data.categories) {
          localStorage.setItem('household_categories', JSON.stringify(data.categories));
        }
        if (data.accounts) {
          localStorage.setItem('household_accounts', JSON.stringify(data.accounts));
        }
        if (data.transactions) {
          localStorage.setItem('household_transactions', JSON.stringify(data.transactions));
        }
        if (data.budgets) {
          localStorage.setItem('household_budgets', JSON.stringify(data.budgets));
        }

        alert('データをインポートしました。ページを再読み込みします。');
        window.location.reload();
      } catch {
        alert('インポートに失敗しました。ファイル形式を確認してください。');
      }
    };
    input.click();
  };

  const handleReset = () => {
    if (confirm('すべてのデータを削除しますか？この操作は取り消せません。')) {
      localStorage.removeItem('household_members');
      localStorage.removeItem('household_accounts');
      localStorage.removeItem('household_transactions');
      localStorage.removeItem('household_categories');
      localStorage.removeItem('household_budgets');
      localStorage.removeItem('household_card_billings');
      alert('データを削除しました。ページを再読み込みします。');
      window.location.reload();
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold text-gray-800">設定</h2>

      {/* マスター管理 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Link
          to="/settings/members"
          className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Users size={20} className="text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">メンバー管理</p>
              <p className="text-xs text-gray-500">家族のメンバーを追加・編集</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </Link>

        <Link
          to="/settings/categories"
          className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Tag size={20} className="text-green-600" />
            <div>
              <p className="font-medium text-gray-900">カテゴリ管理</p>
              <p className="text-xs text-gray-500">収支カテゴリを追加・編集</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </Link>
      </div>

      {/* データ管理 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <Database size={20} className="text-gray-600" />
          <h3 className="font-bold text-gray-800">データ管理</h3>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <Download size={20} className="text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">データをエクスポート</p>
              <p className="text-xs text-gray-500">JSONファイルとしてダウンロード</p>
            </div>
          </button>

          <button
            onClick={handleImport}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <Upload size={20} className="text-green-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">データをインポート</p>
              <p className="text-xs text-gray-500">JSONファイルから復元</p>
            </div>
          </button>

          <button
            onClick={handleReset}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-red-200 hover:border-red-300 transition-colors"
          >
            <Trash2 size={20} className="text-red-600" />
            <div className="text-left">
              <p className="font-medium text-red-600">データを初期化</p>
              <p className="text-xs text-gray-500">すべてのデータを削除</p>
            </div>
          </button>
        </div>
      </div>

      {/* バージョン情報 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <p className="text-center text-sm text-gray-500">
          家計簿アプリ v1.0.0
        </p>
      </div>
    </div>
  );
};
