# 🟢 中優先タスク実装プロンプト

## 📋 タスク7: ユーザーフィードバックの改善

### 現状の問題
- 成功メッセージが一部のモーダルのみ
- エラー表示が不明確
- ローディング状態なし
- 削除確認なし

### 要件

#### 7.1 トースト通知システムの導入

**インストール:**
```bash
npm install react-hot-toast
```

**セットアップ:**
```tsx
// src/App.tsx
import { Toaster } from 'react-hot-toast';

export const App: React.FC = () => {
  return (
    <>
      <Routes>
        {/* ルート定義 */}
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
    </>
  );
};
```

**使用例:**
```typescript
// src/hooks/useToast.ts（新規作成）
import toast from 'react-hot-toast';

export const useToast = () => {
  const showSuccess = (message: string) => {
    toast.success(message);
  };

  const showError = (message: string) => {
    toast.error(message);
  };

  const showLoading = (message: string) => {
    return toast.loading(message);
  };

  const dismiss = (toastId: string) => {
    toast.dismiss(toastId);
  };

  return { showSuccess, showError, showLoading, dismiss };
};

// 使用例
const { showSuccess, showError } = useToast();

const handleSave = async () => {
  try {
    await saveAccount(account);
    showSuccess('口座を保存しました');
  } catch (error) {
    showError('保存に失敗しました');
  }
};
```

#### 7.2 確認ダイアログコンポーネント

```tsx
// src/components/feedback/ConfirmDialog.tsx（新規作成）

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'danger' | 'primary';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '実行',
  confirmVariant = 'primary',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium text-white ${
              confirmVariant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// 使用例
const [showConfirm, setShowConfirm] = useState(false);

<ConfirmDialog
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="口座を削除"
  message="この口座を削除してもよろしいですか？この操作は取り消せません。"
  confirmText="削除"
  confirmVariant="danger"
/>
```

#### 7.3 ローディング状態の表示

```tsx
// src/components/feedback/LoadingSpinner.tsx（新規作成）

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div
      className={`${sizeClasses[size]} border-gray-200 border-t-blue-600 rounded-full animate-spin ${className}`}
    />
  );
};

// フルスクリーンローディング
export const LoadingOverlay: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 flex flex-col items-center">
        <LoadingSpinner size="lg" />
        {message && <p className="mt-4 text-gray-700 font-medium">{message}</p>}
      </div>
    </div>
  );
};

// インラインローディング
export const LoadingButton: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  onClick: () => void;
}> = ({ isLoading, children, onClick }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
    >
      {isLoading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
};
```

#### 7.4 エラーバウンダリの実装

```tsx
// src/components/feedback/ErrorBoundary.tsx（新規作成）

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
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-600" />
            </div>

            <h2 className="text-xl font-bold mb-2">エラーが発生しました</h2>
            <p className="text-gray-600 mb-6">
              アプリケーションでエラーが発生しました。ページを再読み込みしてください。
            </p>

            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              再読み込み
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// App.tsxでラップ
<ErrorBoundary>
  <Routes>
    {/* ルート定義 */}
  </Routes>
</ErrorBoundary>
```

#### 7.5 空状態（Empty State）の表示

```tsx
// src/components/feedback/EmptyState.tsx（新規作成）

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        {icon}
      </div>

      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-gray-600 text-center mb-6">{description}</p>

      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

// 使用例
{accounts.length === 0 && (
  <EmptyState
    icon={<Wallet size={32} className="text-gray-400" />}
    title="口座がありません"
    description="まずは口座を追加してみましょう"
    action={{
      label: '口座を追加',
      onClick: () => setShowAccountModal(true),
    }}
  />
)}
```

---

## 📋 タスク8: アクセシビリティ対応

### 現状の問題
- ARIA属性の不足
- キーボードナビゲーション未対応
- フォーカス管理が不十分
- スクリーンリーダー対応なし

### 要件

#### 8.1 ARIA属性の追加

```tsx
// ボタン
<button
  aria-label="口座を追加"
  aria-describedby="add-account-help"
>
  <Plus size={20} />
</button>
<p id="add-account-help" className="sr-only">
  新しい口座を追加します
</p>

// モーダル
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">口座を追加</h2>
  <p id="modal-description">新しい口座の情報を入力してください</p>
</div>

// ナビゲーション
<nav aria-label="メインナビゲーション">
  <NavLink to="/" aria-current="page">
    ホーム
  </NavLink>
</nav>

// フォーム
<form aria-labelledby="form-title">
  <h2 id="form-title">口座情報</h2>

  <label htmlFor="account-name">口座名</label>
  <input
    id="account-name"
    type="text"
    aria-required="true"
    aria-invalid={errors.name ? 'true' : 'false'}
    aria-describedby={errors.name ? 'name-error' : undefined}
  />
  {errors.name && (
    <p id="name-error" className="text-red-600 text-sm" role="alert">
      {errors.name}
    </p>
  )}
</form>

// ライブリージョン（動的コンテンツ）
<div aria-live="polite" aria-atomic="true">
  {message}
</div>
```

#### 8.2 キーボードナビゲーション

```tsx
// src/hooks/useKeyboardShortcuts.ts（新規作成）

export const useKeyboardShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: 検索
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // 検索バーにフォーカス
        document.getElementById('search-input')?.focus();
      }

      // N: 新規取引
      if (e.key === 'n' && !isInputFocused()) {
        e.preventDefault();
        // 取引追加モーダルを開く
      }

      // Esc: モーダルを閉じる
      if (e.key === 'Escape') {
        // 最前面のモーダルを閉じる
      }

      // ?: ヘルプを表示
      if (e.key === '?' && !isInputFocused()) {
        e.preventDefault();
        // ヘルプモーダルを開く
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};

const isInputFocused = () => {
  const activeElement = document.activeElement;
  return (
    activeElement?.tagName === 'INPUT' ||
    activeElement?.tagName === 'TEXTAREA'
  );
};
```

**キーボードショートカット一覧:**
```
グローバル:
- Ctrl/Cmd + K: 検索
- N: 新規取引
- Esc: モーダルを閉じる
- ?: ヘルプ

ナビゲーション:
- 1: ホーム
- 2: 取引履歴
- 3: 統計
- 4: 設定

リスト操作:
- ↑/↓: 項目移動
- Enter: 選択/編集
- Space: チェック切り替え
- Delete: 削除
```

#### 8.3 フォーカス管理

```tsx
// src/hooks/useFocusTrap.ts（新規作成）

export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTab);
    };
  }, [isActive]);

  return containerRef;
};

// 使用例（モーダル）
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  const modalRef = useFocusTrap(isOpen);

  return isOpen ? (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {children}
    </div>
  ) : null;
};
```

#### 8.4 スクリーンリーダー対応

```tsx
// スクリーンリーダー専用テキスト
<span className="sr-only">スクリーンリーダーにのみ表示される説明</span>

// sr-onlyクラスの定義（globals.css）
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

// 使用例
<button>
  <Trash2 size={20} />
  <span className="sr-only">削除</span>
</button>

// 金額の読み上げ
<span aria-label="1万円">¥10,000</span>

// 進捗状態の読み上げ
<div
  role="progressbar"
  aria-valuenow={75}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="予算進捗"
>
  <div className="w-3/4 h-2 bg-blue-600 rounded-full" />
</div>
```

---

## 📋 タスク9: スペーシング・視覚階層の調整

### 現状の問題
- テキストサイズが小さすぎる（9px, 10px）
- スペーシングが狭い
- 視覚的階層が弱い

### 要件

#### 9.1 タイポグラフィスケールの見直し

```typescript
// 現在の問題点
text-[9px]  → 9px（小さすぎ）
text-[10px] → 10px（小さすぎ）
text-xs     → 12px（最小推奨サイズ）

// 改善後のタイポグラフィスケール
text-xs    → 12px（キャプション・補助情報）
text-sm    → 14px（本文・ラベル）
text-base  → 16px（強調本文）
text-lg    → 18px（小見出し）
text-xl    → 20px（見出し）
text-2xl   → 24px（大見出し）
text-3xl   → 30px（特大見出し）
text-4xl   → 36px（総資産等）
```

**実装:**
```tsx
// タイトル・見出し
<h1 className="text-3xl font-bold">総資産</h1>
<h2 className="text-xl font-bold">口座</h2>
<h3 className="text-lg font-semibold">三菱UFJ銀行</h3>

// 本文
<p className="text-base">メインの説明文</p>
<p className="text-sm text-gray-600">補助的な説明</p>

// キャプション
<span className="text-xs text-gray-500">最終更新: 2026年2月7日</span>

// 金額（大きく表示）
<p className="text-2xl font-bold">¥1,234,567</p>
<p className="text-4xl font-bold">¥5,678,901</p>
```

#### 9.2 スペーシングシステムの統一

```typescript
// Tailwindスペーシングスケール
space-y-1   → 4px   // 非常に狭い（関連性が極めて高い要素）
space-y-1.5 → 6px   // 狭い（ラベルと入力欄など）
space-y-2   → 8px   // やや狭い（リスト項目内）
space-y-3   → 12px  // 標準（カード内の要素）
space-y-4   → 16px  // やや広い（セクション内）
space-y-6   → 24px  // 広い（セクション間）
space-y-8   → 32px  // 非常に広い（ページセクション）
```

**実装:**
```tsx
// ページレイアウト
<div className="p-4 md:p-6 lg:p-8 space-y-6">
  {/* セクション1 */}
  <section className="space-y-4">
    <h2 className="text-xl font-bold">口座</h2>
    <div className="space-y-3">
      {/* カード */}
    </div>
  </section>

  {/* セクション2 */}
  <section className="space-y-4">
    <h2 className="text-xl font-bold">支払い手段</h2>
    <div className="space-y-3">
      {/* カード */}
    </div>
  </section>
</div>

// カード内部
<div className="p-4 space-y-3">
  {/* ヘッダー */}
  <div className="flex items-center justify-between">
    <h3 className="text-lg font-semibold">三菱UFJ銀行</h3>
    <button>...</button>
  </div>

  {/* 残高 */}
  <div className="space-y-1">
    <p className="text-xs text-gray-500">残高</p>
    <p className="text-2xl font-bold">¥100,000</p>
  </div>

  {/* リスト */}
  <div className="space-y-2 pt-3 border-t">
    {items.map(item => (
      <div key={item.id} className="flex items-center justify-between">
        {/* アイテム */}
      </div>
    ))}
  </div>
</div>
```

#### 9.3 視覚的階層の強化

```tsx
// レベル1: ページタイトル
<h1 className="text-3xl font-bold text-gray-900 mb-6">
  統計
</h1>

// レベル2: セクションタイトル
<h2 className="text-xl font-bold text-gray-900 mb-4">
  月別推移
</h2>

// レベル3: カードタイトル
<h3 className="text-lg font-semibold text-gray-900 mb-3">
  三菱UFJ銀行
</h3>

// レベル4: サブセクション
<h4 className="text-base font-semibold text-gray-700 mb-2">
  定期支払い
</h4>

// 本文
<p className="text-sm text-gray-600 leading-relaxed">
  説明文やキャプション
</p>

// 補助情報
<span className="text-xs text-gray-500">
  補助的な情報
</span>
```

#### 9.4 カードデザインの改善

```tsx
// 現在: シンプルすぎる
<div className="bg-white rounded-xl shadow-sm p-4">

// 改善後: 視覚的階層を強化
<div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
  {/* ヘッダー: より目立たせる */}
  <div className="px-4 pt-4 pb-3 border-b border-gray-100">
    <h3 className="text-lg font-semibold text-gray-900">タイトル</h3>
  </div>

  {/* ボディ: 適切なパディング */}
  <div className="p-4 space-y-3">
    {/* 内容 */}
  </div>

  {/* フッター: 区切りを明確に */}
  <div className="px-4 pb-4 pt-3 border-t border-gray-100 bg-gray-50">
    {/* アクション */}
  </div>
</div>
```

#### 9.5 フォーム要素のスペーシング

```tsx
// フォームレイアウト
<form className="space-y-4">
  {/* フィールドグループ */}
  <div className="space-y-1.5">
    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
      口座名
    </label>
    <input
      id="name"
      type="text"
      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
    <p className="text-xs text-gray-500">
      例: 三菱UFJ銀行 普通預金
    </p>
  </div>

  {/* フィールドグループ */}
  <div className="space-y-1.5">
    <label htmlFor="balance" className="block text-sm font-medium text-gray-700">
      残高
    </label>
    <input
      id="balance"
      type="number"
      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>

  {/* ボタングループ */}
  <div className="flex gap-3 pt-2">
    <button type="button" className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg">
      キャンセル
    </button>
    <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg">
      保存
    </button>
  </div>
</form>
```

---

## ✅ 完了条件

### 中優先タスク:
- [ ] トースト通知が全CRUD操作で表示される
- [ ] 削除時に確認ダイアログが表示される
- [ ] ローディング状態が適切に表示される
- [ ] エラーバウンダリが実装されている
- [ ] 空状態が適切に表示される
- [ ] ARIA属性が主要な要素に追加されている
- [ ] キーボードショートカットが動作する
- [ ] モーダルでフォーカストラップが動作する
- [ ] 最小フォントサイズが12pxになっている
- [ ] スペーシングが統一されている
- [ ] 視覚的階層が明確になっている

---

## 🎨 デザイン規約（CLAUDE.mdに準拠）

### TypeScript規約:
```typescript
// ❌ 禁止
const foo: any = ...;
enum Status { ... }

// ✅ 推奨
const foo: unknown = ...;
type Status = 'active' | 'inactive';

// コンポーネント定義
export const MyComponent: React.FC<MyComponentProps> = ({ ... }) => {
  return <div>...</div>;
};

// Props型定義（interfaceを使用）
interface MyComponentProps {
  title: string;
  onClose: () => void;
}
```

### ファイル命名規則:
- コンポーネント: PascalCase（`ConfirmDialog.tsx`）
- Hooks: camelCase（`useToast.ts`、`useKeyboardShortcuts.ts`）
- 1ファイル1エクスポート原則

### Tailwind CSS使用規則:
- カスタムCSSは最小限に（sr-onlyなど必要最小限のみ）
- スペーシング: `space-y-4`（16px）が標準
- 角丸: モーダル・カードは`rounded-xl`、ボタンは`rounded-lg`

---

## 🚀 実装手順

### ステップ1: ユーザーフィードバック
1. `npm install react-hot-toast`でトースト通知をインストール
2. `src/components/feedback/`ディレクトリを作成
3. ConfirmDialog、LoadingSpinner、ErrorBoundary、EmptyStateを実装
4. useToast.tsを作成

### ステップ2: アクセシビリティ
1. `src/hooks/`にuseKeyboardShortcuts.ts、useFocusTrap.tsを作成
2. globals.cssにsr-onlyクラスを追加
3. 主要コンポーネントにARIA属性を追加

### ステップ3: スペーシング・視覚階層
1. コードベース全体でtext-[9px]、text-[10px]を検索
2. 最小サイズをtext-xs（12px）に変更
3. スペーシングを統一（space-y-3、space-y-4など）
4. 見出しのフォントサイズを調整

### ステップ4: テスト
1. `npm run dev`で動作確認
2. トースト通知の表示確認
3. 確認ダイアログの動作確認
4. キーボードショートカット確認（Ctrl+K、N、Escなど）
5. スクリーンリーダーでのアクセシビリティ確認（可能であれば）

---

## 📝 注意事項

1. **react-hot-toast**
   - 既存の成功メッセージ表示を置き換える
   - トーストは3秒で自動的に消える
   - 同時に複数表示可能

2. **確認ダイアログ**
   - 削除操作には必ず確認を表示
   - confirmVariant='danger'で赤色の危険ボタン

3. **キーボードショートカット**
   - 入力欄にフォーカスがある時は無効化
   - Escキーは最前面のモーダルのみを閉じる

4. **スペーシング変更**
   - 既存のレイアウトが崩れないよう注意
   - モバイルとデスクトップ両方で確認

5. **Git運用**
   - ブランチ: `claude/improve-site-design-FFl1D`で作業
   - コミットメッセージ: 明確で簡潔に
   - 完了後にプッシュ
