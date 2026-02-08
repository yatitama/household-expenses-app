import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { AccountsPage } from './pages/AccountsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { StatsPage } from './pages/StatsPage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpPage } from './pages/HelpPage';
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
          <Route path="help" element={<HelpPage />} />
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
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
          },
          success: {
            iconTheme: {
              primary: '#16a34a',
              secondary: '#fff',
            },
            style: {
              background: '#f0fdf4',
              color: '#166534',
              border: '1px solid #dcfce7',
            },
          },
          error: {
            iconTheme: {
              primary: '#dc2626',
              secondary: '#fff',
            },
            style: {
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fee2e2',
            },
          },
        }}
      />
    </ErrorBoundary>
  );
};
