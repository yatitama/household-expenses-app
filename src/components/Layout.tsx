import { NavLink, Outlet } from 'react-router-dom';
import { Home, List, TrendingUp, Settings } from 'lucide-react';

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
        `flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors ${
          isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
};

const SideNavItem = ({ to, icon, label }: NavItemProps) => {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
};

const navItems: NavItemProps[] = [
  { to: '/', icon: <Home size={24} />, label: 'ホーム' },
  { to: '/transactions', icon: <List size={24} />, label: '取引' },
  { to: '/stats', icon: <TrendingUp size={24} />, label: '統計' },
  { to: '/settings', icon: <Settings size={24} />, label: '設定' },
];

export const Layout = () => {
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-slate-900">
      {/* デスクトップ: サイドバーナビゲーション */}
      <nav className="hidden md:flex md:flex-col md:w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-gray-700 fixed inset-y-0 left-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">家計簿</h1>
        </div>
        <div className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <SideNavItem key={item.to} {...item} icon={<span className="[&>svg]:size-5">{item.icon}</span>} />
          ))}
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0 md:ml-64">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* モバイル: ボトムナビゲーション */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700 h-16" aria-label="メインナビゲーション">
        <div className="flex justify-around items-center h-full">
          {navItems.map((item) => (
            <BottomNavItem key={item.to} {...item} />
          ))}
        </div>
      </nav>
    </div>
  );
};
