import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useStock, type ToastType } from '../../context/StockContext';

const STYLES: Record<ToastType, { classe: string; Icone: typeof Info }> = {
  succes: { classe: 'border-succes bg-succes-pale', Icone: CheckCircle2 },
  erreur: { classe: 'border-alerte bg-alerte-pale', Icone: XCircle },
  info: { classe: 'border-acier bg-acier-pale', Icone: Info },
};

export function ToastViewport() {
  const { toasts, dismissToast } = useStock();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((t) => {
        const { classe, Icone } = STYLES[t.type];
        return (
          <div
            key={t.id}
            role={t.type === 'erreur' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3 rounded border-l-4 px-4 py-3 text-sm shadow-md ${classe}`}
          >
            <Icone size={18} className="mt-0.5 shrink-0" aria-hidden />
            <p className="flex-1">{t.message}</p>
            <button onClick={() => dismissToast(t.id)} className="text-encre-douce hover:text-encre" aria-label="Fermer">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
