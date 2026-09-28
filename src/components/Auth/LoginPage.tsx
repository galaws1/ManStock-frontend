import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ApiClientError } from '../../services/axiosConfig';
import { Champ } from '../common/Champ';

export function LoginPage() {
  const { login, status, sessionExpiree, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const destination = (location.state as { from?: string } | null)?.from ?? '/';

  if (status === 'connecte') return <Navigate to={user?.doitChangerMotDePasse ? '/changer-mot-de-passe' : destination} replace />;

  const soumettre = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !motDePasse) {
      setErreur('Saisissez votre identifiant et votre mot de passe.');
      return;
    }
    setEnCours(true);
    setErreur(null);
    try {
      const u = await login(username, motDePasse);
      navigate(u.doitChangerMotDePasse ? '/changer-mot-de-passe' : destination, { replace: true });
    } catch (err) {
      setErreur(err instanceof ApiClientError ? err.message : 'Connexion impossible.');
      setMotDePasse('');
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-acier p-12 text-white lg:flex">
        <p className="text-sm text-white/60">Gestion de stock, caisse et facturation</p>
        <div>
          <p className="text-[7.5rem] font-extrabold leading-[0.85] tracking-tight" style={{ fontStretch: '62%' }}>
            man
            <br />
            <span className="text-ambre">Stock</span>
          </p>
        </div>
        <p className="max-w-sm text-sm text-white/60">Fonctionne sur le réseau du magasin, même sans connexion internet.</p>
        <div className="ruban absolute bottom-0 left-0 h-3 w-full" aria-hidden />
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <form onSubmit={soumettre} className="w-full max-w-sm" noValidate>
          <p className="mb-8 text-3xl font-extrabold lg:hidden" style={{ fontStretch: '70%' }}>
            man<span className="text-ambre-fonce">Stock</span>
          </p>
          <h1 className="mb-1">Connexion</h1>
          <p className="mb-6 text-sm text-encre-douce">Utilisez l'identifiant fourni par votre administrateur.</p>

          {sessionExpiree && !erreur && (
            <p role="status" className="mb-4 rounded border-l-4 border-ambre bg-ambre-pale px-3 py-2 text-sm">
              Votre session a expiré. Reconnectez-vous pour continuer.
            </p>
          )}
          {erreur && (
            <p role="alert" className="mb-4 rounded border-l-4 border-alerte bg-alerte-pale px-3 py-2 text-sm">
              {erreur}
            </p>
          )}

          <div className="space-y-4">
            <Champ label="Identifiant">
              {(p) => (
                <input {...p} autoComplete="username" autoCapitalize="none" value={username} onChange={(e) => setUsername(e.target.value)} />
              )}
            </Champ>
            <Champ label="Mot de passe">
              {(p) => (
                <input {...p} type="password" autoComplete="current-password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
              )}
            </Champ>
          </div>

          <button type="submit" className="btn-primaire mt-6 w-full py-2.5" disabled={enCours}>
            {enCours ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </section>
    </div>
  );
}
