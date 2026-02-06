import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AccountsPage } from './pages/AccountsPage';
import { SettingsPage } from './pages/SettingsPage';
import { MembersPage } from './pages/MembersPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { initializeDefaultData } from './services/initialData';
import { runMigrations } from './services/storage';
import { settleOverdueTransactions } from './utils/billingUtils';

export const App = () => {
  useEffect(() => {
    runMigrations();
    initializeDefaultData();
    settleOverdueTransactions();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<AccountsPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/members" element={<MembersPage />} />
        <Route path="settings/categories" element={<CategoriesPage />} />
      </Route>
    </Routes>
  );
};
