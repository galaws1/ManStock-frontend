import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { MotDePasseModal } from '../Auth/MotDePasseModal';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [mdpOuvert, setMdpOuvert] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Bureau */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 lg:block">
        <Sidebar onChangerMotDePasse={() => setMdpOuvert(true)} />
      </aside>

      {/* Mobile / tablette */}
      {menuOuvert && (
        <div className="fixed inset-0 z-30 flex lg:hidden">
          <div className="w-64">
            <Sidebar
              onNavigate={() => setMenuOuvert(false)}
              onChangerMotDePasse={() => {
                setMenuOuvert(false);
                setMdpOuvert(true);
              }}
            />
          </div>
          <button className="flex-1 bg-encre/40" aria-label="Fermer le menu" onClick={() => setMenuOuvert(false)} />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-ligne bg-white px-4 py-2.5 lg:hidden">
          <button className="btn-discret" onClick={() => setMenuOuvert(true)} aria-label="Ouvrir le menu">
            <Menu size={20} />
          </button>
          <span className="font-extrabold" style={{ fontStretch: '75%' }}>
            man<span className="text-ambre-fonce">Stock</span>
          </span>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </main>
      </div>

      {mdpOuvert && <MotDePasseModal onClose={() => setMdpOuvert(false)} />}
    </div>
  );
}
