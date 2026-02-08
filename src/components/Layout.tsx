import { NavLink, Outlet } from 'react-router-dom';
import { Home, List, TrendingUp, Menu, X } from 'lucide-react';
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
        `flex flex-col items-center gap-0.5 px-3 py-2 text-sm font-medium transition-colors min-w-[56px] min-h-[56px] ${
          isActive ? 'text-primary-700 dark:text-primary-400' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
        }`
      }
    >
      <span className="[&>svg]:w-5 [&>svg]:h-5">{icon}</span>
      <span className="text-center">{label}</span>
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
  { to: '/transactions', icon: <List size={24} />, label: '履歴' },
  { to: '/stats', icon: <TrendingUp size={24} />, label: '統計' },
];

interface MenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const MenuDropdown = ({ isOpen, onClose }: MenuDropdownProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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
    <div
      ref={menuRef}
      className="absolute bottom-16 right-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 min-w-[180px]"
    >
      <nav className="flex flex-col">
        <NavLink
          to="/settings"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
            }`
          }
        >
          <span>⚙️ 設定</span>
        </NavLink>
        <button
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors w-full text-left"
        >
          <span>ℹ️ ヘルプ</span>
        </button>
      </nav>
    </div>
  );
};

export const Layout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
            to="/settings"
            icon={<span className="[&>svg]:size-5">⚙️</span>}
            label="設定"
          />
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0 md:ml-64">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* モバイル: ボトムナビゲーション */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700 h-16" aria-label="メインナビゲーション">
        <div className="flex justify-around items-center h-full">
          {navItems.map((item) => (
            <BottomNavItem key={item.to} {...item} />
          ))}
          {/* メニューボタン */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 text-sm font-medium transition-colors min-w-[56px] min-h-[56px] ${
                isMenuOpen
                  ? 'text-primary-700 dark:text-primary-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
              aria-label="メニュー"
            >
              <span className="[&>svg]:w-5 [&>svg]:h-5">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </span>
              <span className="text-center">メニュー</span>
            </button>
            <MenuDropdown isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
          </div>
        </div>
      </nav>
    </div>
  );
};
