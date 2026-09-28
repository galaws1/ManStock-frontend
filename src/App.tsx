import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RolesPage } from './components/Admin/RolesPage';
import { UtilisateursPage } from './components/Admin/UtilisateursPage';
import { ChangerMotDePassePage } from './components/Auth/ChangerMotDePassePage';
import { LoginPage } from './components/Auth/LoginPage';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { CommandeDetailPage } from './components/Achats/CommandeDetailPage';
import { CommandeEditionPage } from './components/Achats/CommandeEditionPage';
import { CommandesPage } from './components/Achats/CommandesPage';
import { PartenairesPage } from './components/Partenaires/PartenairesPage';
import { EtatStockPage } from './components/Stock/EtatStockPage';
import { MouvementsPage } from './components/Stock/MouvementsPage';
import { TransfertsPage } from './components/Stock/TransfertsPage';
import { CaissePage } from './components/Ventes/CaissePage';
import { FactureDetailPage } from './components/Ventes/FactureDetailPage';
import { FactureEditionPage } from './components/Ventes/FactureEditionPage';
import { FacturesPage } from './components/Ventes/FacturesPage';
import { CaissesPage } from './components/Organisation/CaissesPage';
import { EntrepotDetailPage } from './components/Organisation/EntrepotDetailPage';
import { EntrepotsPage } from './components/Organisation/EntrepotsPage';
import { MagasinsPage } from './components/Organisation/MagasinsPage';
import { ProduitDetailPage } from './components/Products/ProduitDetailPage';
import { ProduitsPage } from './components/Products/ProduitsPage';
import { UnitesPage } from './components/Products/UnitesPage';
import { CategoriesPage } from './components/Products/CategoriesPage';
import { FamillesPage } from './components/Products/FamillesPage';
import { ToastViewport } from './components/common/Toast';
import { DashboardPage } from './components/Dashboard/DashboardPage';
import { AppLayout } from './components/Layout/AppLayout';
import { AuthProvider } from './context/AuthContext';
import { StockProvider } from './context/StockContext';
import {
  LECTURE_ACHATS, LECTURE_CLIENTS, LECTURE_FACTURES, LECTURE_FOURNISSEURS, LECTURE_MOUVEMENTS,
  ROLES, ROLES_APPROVISIONNEMENT, ROLES_CATALOGUE, ROLES_FACTURATION, ROLES_ORGANISATION, ROLES_RECEPTION, ROLES_STOCK, ROLES_VENTE,
} from './types/role';

export default function App() {
  return (
    <StockProvider>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/connexion" element={<LoginPage />} />
            <Route path="/changer-mot-de-passe" element={<ChangerMotDePassePage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="catalogue/familles" element={<ProtectedRoute roles={ROLES_CATALOGUE}><FamillesPage /></ProtectedRoute>} />
              <Route path="catalogue/categories" element={<ProtectedRoute roles={ROLES_CATALOGUE}><CategoriesPage /></ProtectedRoute>} />
              <Route path="ventes/caisse" element={<ProtectedRoute roles={ROLES_VENTE}><CaissePage /></ProtectedRoute>} />
              <Route path="ventes/factures" element={<ProtectedRoute roles={LECTURE_FACTURES}><FacturesPage /></ProtectedRoute>} />
              <Route path="ventes/factures/nouvelle" element={<ProtectedRoute roles={ROLES_FACTURATION}><FactureEditionPage /></ProtectedRoute>} />
              <Route path="ventes/factures/:id" element={<ProtectedRoute roles={LECTURE_FACTURES}><FactureDetailPage /></ProtectedRoute>} />
              <Route path="ventes/factures/:id/modifier" element={<ProtectedRoute roles={ROLES_FACTURATION}><FactureEditionPage /></ProtectedRoute>} />
              <Route path="ventes/clients" element={<ProtectedRoute roles={LECTURE_CLIENTS}><PartenairesPage key="clients" genre="clients" /></ProtectedRoute>} />
              <Route path="stock/etat" element={<ProtectedRoute><EtatStockPage /></ProtectedRoute>} />
              <Route path="stock/mouvements" element={<ProtectedRoute roles={LECTURE_MOUVEMENTS}><MouvementsPage /></ProtectedRoute>} />
              <Route path="stock/transferts" element={<ProtectedRoute roles={ROLES_RECEPTION}><TransfertsPage /></ProtectedRoute>} />
              <Route path="achats/commandes" element={<ProtectedRoute roles={LECTURE_ACHATS}><CommandesPage /></ProtectedRoute>} />
              <Route path="achats/commandes/nouvelle" element={<ProtectedRoute roles={ROLES_APPROVISIONNEMENT}><CommandeEditionPage /></ProtectedRoute>} />
              <Route path="achats/commandes/:id" element={<ProtectedRoute roles={LECTURE_ACHATS}><CommandeDetailPage /></ProtectedRoute>} />
              <Route path="achats/commandes/:id/modifier" element={<ProtectedRoute roles={ROLES_APPROVISIONNEMENT}><CommandeEditionPage /></ProtectedRoute>} />
              <Route path="achats/fournisseurs" element={<ProtectedRoute roles={LECTURE_FOURNISSEURS}><PartenairesPage key="fournisseurs" genre="fournisseurs" /></ProtectedRoute>} />
              <Route path="catalogue/produits" element={<ProtectedRoute roles={ROLES_CATALOGUE}><ProduitsPage /></ProtectedRoute>} />
              <Route path="catalogue/produits/:id" element={<ProtectedRoute roles={ROLES_CATALOGUE}><ProduitDetailPage /></ProtectedRoute>} />
              <Route path="catalogue/unites" element={<ProtectedRoute roles={ROLES_CATALOGUE}><UnitesPage /></ProtectedRoute>} />
              <Route path="organisation/entrepots" element={<ProtectedRoute roles={ROLES_STOCK}><EntrepotsPage /></ProtectedRoute>} />
              <Route path="organisation/entrepots/:id" element={<ProtectedRoute roles={ROLES_STOCK}><EntrepotDetailPage /></ProtectedRoute>} />
              <Route path="organisation/caisses" element={<ProtectedRoute roles={ROLES_ORGANISATION}><CaissesPage /></ProtectedRoute>} />
              <Route path="organisation/magasins" element={<ProtectedRoute roles={ROLES_ORGANISATION}><MagasinsPage /></ProtectedRoute>} />
              <Route path="admin/utilisateurs" element={<ProtectedRoute roles={[ROLES.ADMIN]}><UtilisateursPage /></ProtectedRoute>} />
              <Route path="admin/roles" element={<ProtectedRoute roles={[ROLES.ADMIN]}><RolesPage /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <ToastViewport />
      </AuthProvider>
    </StockProvider>
  );
}
