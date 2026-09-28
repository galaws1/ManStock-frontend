import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStock } from '../../context/StockContext';
import { MotDePasseForm } from './MotDePasseForm';

/**
 * Page imposée tant que doitChangerMotDePasse = true (compte créé ou réinitialisé par un admin).
 * Une fois le changement enregistré, le backend repasse le champ à false et l'accès est rétabli.
 */
export function ChangerMotDePassePage() {
  const { status, user, logout } = useAuth();
  const { showToast } = useStock();
  const navigate = useNavigate();

  if (status === 'chargement') {
    return <div className="flex min-h-screen items-center justify-center text-encre-douce">Chargement de la session…</div>;
  }
  if (status === 'anonyme' || !user) return <Navigate to="/connexion" replace />;
  if (!user.doitChangerMotDePasse) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="ruban h-2 shrink-0" aria-hidden />
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <p className="mb-8 text-3xl font-extrabold" style={{ fontStretch: '70%' }}>
            man<span className="text-ambre-fonce">Stock</span>
          </p>
          <h1 className="mb-1">Choisissez votre mot de passe</h1>
          <p className="mb-6 text-sm text-encre-douce">
            Bonjour {user.prenom ?? user.nom}. Votre mot de passe actuel est provisoire : remplacez-le avant d'accéder à l'application.
          </p>
          <div className="rounded border border-ligne bg-white p-5">
            <MotDePasseForm
              libelleValider="Enregistrer et continuer"
              onSucces={() => {
                showToast('Mot de passe enregistré');
                navigate('/', { replace: true });
              }}
              actionsSecondaires={
                <button type="button" className="btn-discret" onClick={logout}>
                  Se déconnecter
                </button>
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
}
