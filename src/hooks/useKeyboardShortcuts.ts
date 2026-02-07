import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const isInputFocused = () => {
  const activeElement = document.activeElement;
  return (
    activeElement?.tagName === 'INPUT' ||
    activeElement?.tagName === 'TEXTAREA' ||
    activeElement?.tagName === 'SELECT'
  );
};

interface KeyboardShortcutsOptions {
  onNewTransaction?: () => void;
  onCloseModal?: () => void;
}

export const useKeyboardShortcuts = (options?: KeyboardShortcutsOptions) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }

      // Esc: close modal
      if (e.key === 'Escape') {
        options?.onCloseModal?.();
      }

      // Shortcuts below only apply when not focused on input
      if (isInputFocused()) return;

      // N: new transaction
      if (e.key === 'n') {
        e.preventDefault();
        options?.onNewTransaction?.();
      }

      // Number keys for navigation
      if (e.key === '1') {
        e.preventDefault();
        navigate('/');
      }
      if (e.key === '2') {
        e.preventDefault();
        navigate('/transactions');
      }
      if (e.key === '3') {
        e.preventDefault();
        navigate('/stats');
      }
      if (e.key === '4') {
        e.preventDefault();
        navigate('/settings');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, options]);
};
