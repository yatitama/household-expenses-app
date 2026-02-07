import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AccountsPage } from './pages/AccountsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { StatsPage } from './pages/StatsPage';
import { SettingsPage } from './pages/SettingsPage';
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
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
};
