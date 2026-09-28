export function StatutBadge({ actif, libelles = ['Actif', 'Désactivé'] }: { actif: boolean; libelles?: [string, string] }) {
  return actif ? (
    <span className="rounded-sm bg-succes-pale px-2 py-0.5 text-xs font-medium text-succes">{libelles[0]}</span>
  ) : (
    <span className="rounded-sm bg-ligne px-2 py-0.5 text-xs font-medium text-encre-douce">{libelles[1]}</span>
  );
}
