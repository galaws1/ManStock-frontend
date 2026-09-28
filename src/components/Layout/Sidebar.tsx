import { LockKeyhole, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { initiales, nomComplet } from '../../utils/formatters';
import { menuPourRole } from './menuConfig';

interface Props {
  onNavigate?: () => void;
  onChangerMotDePasse: () => void;
}

export function Sidebar({ onNavigate, onChangerMotDePasse }: Props) {
  const { user, logout } = useAuth();
  const sections = menuPourRole(user?.roleCode ?? null);

  return (
    <div className="flex h-full flex-col bg-acier text-white">
      <div className="ruban h-1.5 shrink-0" aria-hidden />
      <div className="px-5 pb-4 pt-5">
        <p className="text-2xl font-extrabold tracking-tight" style={{ fontStretch: '75%' }}>
          man<span className="text-ambre">Stock</span>
        </p>
        {user?.magasinNom && <p className="mt-0.5 truncate text-xs text-white/60">{user.magasinNom}</p>}
      </div>

      <nav className="flex-1 overflow-y-auto px-3" aria-label="Navigation principale">
        {sections.map((section) => (
          <div key={section.titre} className="mb-5">
            <p className="px-2 pb-1.5 text-xs font-medium text-white/50">{section.titre}</p>
            <ul className="space-y-0.5">
              {section.entrees.map(({ chemin, libelle, icone: Icone }) => (
                <li key={chemin}>
                  <NavLink
                    to={chemin}
                    end={chemin === '/'}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded border-l-[3px] px-2.5 py-2 text-sm transition-colors ${
                        isActive
                          ? 'border-ambre bg-white/10 font-semibold text-white'
                          : 'border-transparent text-white/75 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    <Icone size={17} aria-hidden />
                    {libelle}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {user && (
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-ambre text-sm font-bold text-acier">
              {initiales(user)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{nomComplet(user)}</p>
              <p className="truncate text-xs text-white/60">{user.roleLibelle}</p>
            </div>
          </div>
          <button onClick={onChangerMotDePasse} className="mt-1 flex w-full items-center gap-3 rounded px-2.5 py-2 text-sm text-white/75 hover:bg-white/5 hover:text-white">
            <LockKeyhole size={16} aria-hidden /> Mon mot de passe
          </button>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded px-2.5 py-2 text-sm text-white/75 hover:bg-white/5 hover:text-white">
            <LogOut size={16} aria-hidden /> Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}
