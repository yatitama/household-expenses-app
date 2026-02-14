import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { AccountsPage } from './pages/AccountsPage';
import { AddTransactionPage } from './pages/AddTransactionPage';
import { TransactionsPage } from './pages/TransactionsPage';
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
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<AccountsPage />} />
            <Route path="add-transaction" element={<AddTransactionPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>

        <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#f5f1e8',
            color: '#2d1f12',
            borderRadius: '0.75rem',
            border: '1px solid #dccfb2',
          },
          success: {
            iconTheme: {
              primary: '#8b7355',
              secondary: '#f5f1e8',
            },
            style: {
              background: '#ede6da',
              color: '#2d1f12',
              border: '1px solid #dccfb2',
            },
          },
          error: {
            iconTheme: {
              primary: '#906038',
              secondary: '#f5f1e8',
            },
            style: {
              background: '#e9e1d4',
              color: '#2d1f12',
              border: '1px solid #c9b89a',
            },
          },
        }}
      />
      </ThemeProvider>
    </ErrorBoundary>
  );
};
