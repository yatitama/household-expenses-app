import { NavLink, Outlet } from 'react-router-dom';
import { Wallet, Settings } from 'lucide-react';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem = ({ to, icon, label }: NavItemProps) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors ${
          isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
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
    <div className="min-h-screen flex flex-col">
      {/* メインコンテンツ */}
      <main className="flex-1 overflow-auto pb-20">
        <Outlet />
      </main>

      {/* ボトムナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          <NavItem to="/" icon={<Wallet size={20} />} label="口座" />
          <NavItem to="/settings" icon={<Settings size={20} />} label="設定" />
        </div>
      </nav>
    </div>
  );
};
