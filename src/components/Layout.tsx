import { NavLink, Outlet } from 'react-router-dom';
import { Home, List, Settings as SettingsIcon, Plus } from 'lucide-react';

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
        `flex flex-col items-center gap-0.5 px-2 py-1.5 text-xs md:text-sm font-medium transition-colors min-w-[48px] min-h-[48px] md:min-w-[56px] md:min-h-[56px] ${
          isActive ? 'text-primary-700 dark:text-primary-400' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
        }`
      }
      title={label}
    >
      <span className="[&>svg]:w-4 [&>svg]:h-4 md:[&>svg]:w-5 md:[&>svg]:h-5">{icon}</span>
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
  { to: '/', icon: <Home size={24} />, label: 'ホーム' },
  { to: '/add-transaction', icon: <Plus size={24} />, label: '追加' },
  { to: '/transactions', icon: <List size={24} />, label: '履歴' },
  { to: '/settings', icon: <SettingsIcon size={24} />, label: '設定' },
];


export const Layout = () => {
  return (
    <div className="min-h-screen flex grid-background">
      {/* デスクトップ: サイドバーナビゲーション */}
      <nav aria-label="メインナビゲーション" className="hidden md:flex md:flex-col md:w-64 bg-white dark:bg-slate-900 dark:border-gray-700 fixed inset-y-0 left-0">
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
      <main className="flex-1 pb-20 md:pb-0 md:ml-64 overflow-clip">
        <Outlet />
      </main>

      {/* モバイル: ボトムナビゲーション */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 dark:border-gray-700 h-16 z-50" aria-label="メインナビゲーション">
        <div className="flex justify-around items-center h-full">
          {navItems.map((item) => (
            <BottomNavItem key={item.to} {...item} />
          ))}
        </div>
      </nav>
    </div>
  );
};
