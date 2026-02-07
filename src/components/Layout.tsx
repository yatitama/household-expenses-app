import { NavLink, Outlet } from 'react-router-dom';
import { Home, List, TrendingUp, Settings, Wallet } from 'lucide-react';

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
        `flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-all duration-300 ${
          isActive
            ? 'text-brand-600 dark:text-accent-400 scale-110'
            : 'text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-accent-300'
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
        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
          isActive
            ? 'bg-gradient-to-r from-brand-600 to-accent-600 text-white shadow-brand scale-105'
            : 'text-gray-700 hover:bg-white/60 hover:shadow-md dark:text-gray-300 dark:hover:bg-slate-700/60'
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
    <div className="min-h-screen flex">
      {/* デスクトップ: サイドバーナビゲーション */}
      <nav
        aria-label="メインナビゲーション"
        className="hidden md:flex md:flex-col md:w-72 glass-card fixed inset-y-0 left-0 m-4 rounded-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-white/20 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-600 to-accent-600 rounded-xl flex items-center justify-center shadow-brand">
              <Wallet className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-brand-700 to-accent-700 bg-clip-text text-transparent dark:from-brand-400 dark:to-accent-400">
                家計簿
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">Premium Edition</p>
            </div>
          </div>
        </div>
        <div className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <SideNavItem key={item.to} {...item} icon={<span className="[&>svg]:size-5">{item.icon}</span>} />
          ))}
        </div>
        <div className="p-4 border-t border-white/20 dark:border-slate-700/50">
          <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
            v1.0.0 Premium
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0 md:ml-80 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* モバイル: ボトムナビゲーション */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 glass-card border-t border-white/20 dark:border-slate-700/50 h-16 m-2 mb-4 rounded-2xl"
        aria-label="メインナビゲーション"
      >
        <div className="flex justify-around items-center h-full">
          {navItems.map((item) => (
            <BottomNavItem key={item.to} {...item} />
          ))}
        </div>
      </nav>
    </div>
  );
};
