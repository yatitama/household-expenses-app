import { NavLink, Outlet } from 'react-router-dom';
import { Home, List, TrendingUp, Settings as SettingsIcon, Menu, X, Plus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

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
  { to: '/stats', icon: <TrendingUp size={24} />, label: '統計' },
  { to: '/settings', icon: <SettingsIcon size={24} />, label: '設定' },
];

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SideDrawer = ({ isOpen, onClose }: SideDrawerProps) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* ドロワー */}
      <div
        ref={drawerRef}
        className="fixed bottom-16 left-0 right-0 bg-white dark:bg-slate-800 rounded-t-lg shadow-lg z-50 max-h-[60vh] overflow-y-auto"
      >
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          <h2 className="font-semibold text-gray-900 dark:text-gray-50">メニュー</h2>
        </div>
        <nav className="flex flex-col">
          <NavLink
            to="/help"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-700'
              }`
            }
          >
            <span>ℹ️</span>
            <span>ヘルプ</span>
          </NavLink>
        </nav>
      </div>
    </>
  );
};

export const Layout = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-slate-900">
      {/* デスクトップ: サイドバーナビゲーション */}
      <nav aria-label="メインナビゲーション" className="hidden md:flex md:flex-col md:w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-gray-700 fixed inset-y-0 left-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">家計簿</h1>
        </div>
        <div className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <SideNavItem key={item.to} {...item} icon={<span className="[&>svg]:size-5">{item.icon}</span>} />
          ))}
          <SideNavItem
            to="/help"
            icon={<span className="[&>svg]:size-5">ℹ️</span>}
            label="ヘルプ"
          />
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0 md:ml-64">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* モバイル: ボトムナビゲーション（4項目 + ドロワー） */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700 h-16" aria-label="メインナビゲーション">
        <div className="flex justify-around items-center h-full">
          {navItems.map((item) => (
            <BottomNavItem key={item.to} {...item} />
          ))}
          {/* メニューボタン */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 text-xs md:text-sm font-medium transition-colors min-w-[48px] min-h-[48px] md:min-w-[56px] md:min-h-[56px] ${
              isDrawerOpen
                ? 'text-primary-700 dark:text-primary-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            aria-label="メニュー"
            title="メニュー"
          >
            <span className="[&>svg]:w-4 [&>svg]:h-4 md:[&>svg]:w-5 md:[&>svg]:h-5">
              {isDrawerOpen ? <X size={20} /> : <Menu size={20} />}
            </span>
            <span className="text-center text-xs md:text-sm">その他</span>
          </button>
        </div>
      </nav>

      {/* モバイル: サイドドロワー */}
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </div>
  );
};
