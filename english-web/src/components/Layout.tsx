import { NavLink, Outlet } from 'react-router-dom';

const link = ({ isActive }: { isActive: boolean }) =>
  `flex-1 py-3 text-center text-sm ${isActive ? 'font-bold text-emerald-400' : 'text-neutral-400'}`;

export default function Layout() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <main className="flex-1 p-4 pb-24">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-1/2 flex w-full max-w-md -translate-x-1/2 border-t border-neutral-800 bg-neutral-950">
        <NavLink to="/home" className={link}>Hoje</NavLink>
        <NavLink to="/tutor" className={link}>Professor</NavLink>
        <NavLink to="/progress" className={link}>Progresso</NavLink>
        <NavLink to="/missions" className={link}>Missões</NavLink>
        <NavLink to="/review" className={link}>Revisão</NavLink>
      </nav>
    </div>
  );
}
