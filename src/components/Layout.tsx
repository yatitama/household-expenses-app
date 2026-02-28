import { NavLink, Outlet } from 'react-router-dom';
import { TrendingUp, List, Settings as SettingsIcon, Plus, Wallet, PiggyBank } from 'lucide-react';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const BottomNavItem = ({ to, icon, label }: NavItemProps) => {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 px-2 py-1.5 text-xs md:text-sm font-medium transition-colors min-w-[52px] min-h-[52px] md:min-w-[56px] md:min-h-[56px] ${
          isActive ? 'text-primary-700 dark:text-primary-400' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
        }`
      }
      title={label}
    >
      <span className={`[&>svg]:w-5 [&>svg]:h-5 md:[&>svg]:w-5 md:[&>svg]:h-5 transition-transform ${''}`}>{icon}</span>
      <span className="text-center text-xs md:text-sm">{label}</span>
    </NavLink>
  );
};

const SideNavItem = ({ to, icon, label }: NavItemProps) => {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:focus-visible:outline-primary-400 ${
          isActive
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
};

const navItems: NavItemProps[] = [
  { to: '/', icon: <TrendingUp size={24} />, label: '収支' },
  { to: '/money', icon: <Wallet size={24} />, label: 'お金' },
  { to: '/add-transaction', icon: <Plus size={24} />, label: '追加' },
  { to: '/piggy-bank', icon: <PiggyBank size={24} />, label: '貯金箱' },
  { to: '/transactions', icon: <List size={24} />, label: '履歴' },
  { to: '/settings', icon: <SettingsIcon size={24} />, label: '設定' },
];

// ボトムナビ用：「追加」を除いた4項目
const bottomNavItems = navItems.filter((item) => item.to !== '/add-transaction');

export const Layout = () => {
  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-900">
      {/* デスクトップ: サイドバーナビゲーション */}
      <nav aria-label="メインナビゲーション" className="hidden md:flex md:flex-col md:w-64 bg-white dark:border-gray-700 fixed inset-y-0 left-0">
        <div className="p-4 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">家計簿</h1>
        </div>
        <div className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <SideNavItem key={item.to} {...item} icon={<span className="[&>svg]:size-5">{item.icon}</span>} />
          ))}
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="flex-1 md:ml-64 overflow-clip">
        <Outlet />
      </main>

      {/* モバイル: ボトムナビゲーション（FAB付き） */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t dark:border-gray-700 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="メインナビゲーション"
      >
        <div className="relative flex items-center h-16 overflow-visible">
          {/* 左2項目 */}
          <div className="flex-1 flex justify-around items-center h-full">
            {bottomNavItems.slice(0, 2).map((item) => (
              <BottomNavItem key={item.to} {...item} />
            ))}
          </div>

          {/* 中央FABのスペース確保 */}
          <div className="w-16 flex-shrink-0" />

          {/* 右2項目 */}
          <div className="flex-1 flex justify-around items-center h-full">
            {bottomNavItems.slice(2).map((item) => (
              <BottomNavItem key={item.to} {...item} />
            ))}
          </div>

          {/* 中央FABボタン（ナビバー内中央） */}
          <NavLink
            to="/add-transaction"
            end
            className={({ isActive }) =>
              `absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                isActive
                  ? 'bg-gray-700 dark:bg-gray-500'
                  : 'btn-primary'
              }`
            }
            aria-label="取引を追加"
          >
            <Plus size={20} className="text-white" />
          </NavLink>
        </div>
      </nav>
    </div>
  );
};
