import { NavLink, Outlet } from 'react-router-dom';
import { Home, List, TrendingUp, Settings } from 'lucide-react';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem = ({ to, icon, label }: NavItemProps) => {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors ${
          isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
};

export const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* メインコンテンツ */}
      <main className="flex-1 overflow-auto pb-20">
        <Outlet />
      </main>

      {/* ボトムナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16" aria-label="メインナビゲーション">
        <div className="flex justify-around items-center max-w-lg mx-auto h-full">
          <NavItem to="/" icon={<Home size={24} />} label="ホーム" />
          <NavItem to="/transactions" icon={<List size={24} />} label="取引" />
          <NavItem to="/stats" icon={<TrendingUp size={24} />} label="統計" />
          <NavItem to="/settings" icon={<Settings size={24} />} label="設定" />
        </div>
      </nav>
    </div>
  );
};
