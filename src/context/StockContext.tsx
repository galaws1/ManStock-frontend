import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

export type ToastType = 'succes' | 'erreur' | 'info';
export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface StockContextValue {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: (id: number) => void;
  /** Incrémenté par triggerRefresh() : les écrans l'ajoutent à leurs dépendances de chargement. */
  refreshKey: number;
  triggerRefresh: () => void;
}

const StockContext = createContext<StockContextValue | null>(null);

const DUREE_TOAST_MS = 4500;

export function StockProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const nextId = useRef(1);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'succes') => {
      const id = nextId.current++;
      setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
      window.setTimeout(() => dismissToast(id), type === 'erreur' ? DUREE_TOAST_MS * 2 : DUREE_TOAST_MS);
    },
    [dismissToast],
  );

  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const value = useMemo(
    () => ({ toasts, showToast, dismissToast, refreshKey, triggerRefresh }),
    [toasts, showToast, dismissToast, refreshKey, triggerRefresh],
  );
  return <StockContext.Provider value={value}>{children}</StockContext.Provider>;
}

export function useStock(): StockContextValue {
  const ctx = useContext(StockContext);
  if (!ctx) throw new Error('useStock doit être utilisé dans <StockProvider>');
  return ctx;
}
