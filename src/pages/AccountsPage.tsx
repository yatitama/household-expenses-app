import { TrendingUp } from 'lucide-react';

export const AccountsPage = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
          <TrendingUp size={32} className="text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">収支</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">収支の概要や予算機能をここに追加予定です</p>
        </div>
      </div>
    </div>
  );
};
