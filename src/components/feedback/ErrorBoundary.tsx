import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isDevelopment = import.meta.env.DEV;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div
            className="rounded-xl p-8 max-w-md w-full text-center dark:border-gray-700"
            role="alert"
            aria-live="assertive"
          >
            <div className="w-16 h-16 bg-danger-50 dark:bg-danger-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-danger-600 dark:text-danger-400" />
            </div>

            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-50">予期しないエラーです</h2>
            <p className="text-base text-gray-600 dark:text-gray-400 mb-4">
              申し訳ございません。アプリケーション実行中にエラーが発生しました。
            </p>

            {isDevelopment && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg text-left max-h-32 overflow-auto">
                <p className="text-sm font-mono text-gray-900 dark:text-gray-200 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2.5 bg-primary-700 text-white rounded-lg font-medium hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 transition-colors"
              >
                ページを再読み込み
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-4 py-2.5 dark:border-gray-600 text-gray-900 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                ホームに戻る
              </button>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              問題が解決しない場合は、ブラウザのキャッシュをクリアしてお試しください。
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
