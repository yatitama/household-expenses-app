import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { AccountsPage } from './pages/AccountsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { StatsPage } from './pages/StatsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ErrorBoundary } from './components/feedback/ErrorBoundary';
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
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<AccountsPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#1f2937',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </ErrorBoundary>
  );
};
