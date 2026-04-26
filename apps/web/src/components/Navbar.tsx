'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import ThemeToggle from '@/components/ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const linkClass = (href: string) =>
    `hover:underline ${pathname === href || pathname.startsWith(href + '/') ? 'font-bold underline' : ''}`;

  return (
    <nav className="bg-primary text-white px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-lg font-bold">
          Gym Tracker
        </Link>

        {/* Desktop menu */}
        {user ? (
          <div className="hidden sm:flex items-center gap-4">
            <Link href="/workouts" className={linkClass('/workouts')}>
              Rutinas
            </Link>
            <Link href="/exercises" className={linkClass('/exercises')}>
              Ejercicios
            </Link>
            <Link href="/workouts/new" className={linkClass('/workouts/new')}>
              + Nueva
            </Link>
            <ThemeToggle />
            <span className="text-sm opacity-80">{user.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm bg-white/20 px-3 py-1 rounded hover:bg-white/30"
            >
              Salir
            </button>
          </div>
        ) : (
          <div className="hidden sm:flex gap-3 items-center">
            <ThemeToggle />
            <Link href="/login" className={linkClass('/login')}>
              Ingresar
            </Link>
            <Link href="/register" className={linkClass('/register')}>
              Registrarse
            </Link>
          </div>
        )}

        {/* Hamburger button (mobile) */}
        <button
          onClick={() => setOpen(!open)}
          className="sm:hidden flex flex-col gap-1 p-1"
          aria-label="Menú"
        >
          <span className={`block w-5 h-0.5 bg-white transition-transform ${open ? 'rotate-45 translate-y-1.5' : ''}`} />
          <span className={`block w-5 h-0.5 bg-white transition-opacity ${open ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-white transition-transform ${open ? '-rotate-45 -translate-y-1.5' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden mt-3 flex flex-col gap-2 border-t border-white/20 pt-3">
          {user ? (
            <>
              <Link href="/workouts" className={linkClass('/workouts')} onClick={() => setOpen(false)}>
                Rutinas
              </Link>
              <Link href="/exercises" className={linkClass('/exercises')} onClick={() => setOpen(false)}>
                Ejercicios
              </Link>
              <Link href="/workouts/new" className={linkClass('/workouts/new')} onClick={() => setOpen(false)}>
                + Nueva rutina
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-sm opacity-80">{user.name}</span>
                <ThemeToggle />
              </div>
              <button
                onClick={() => { handleLogout(); setOpen(false); }}
                className="text-left text-sm opacity-80 hover:underline"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={linkClass('/login')} onClick={() => setOpen(false)}>
                Ingresar
              </Link>
              <Link href="/register" className={linkClass('/register')} onClick={() => setOpen(false)}>
                Registrarse
              </Link>
              <ThemeToggle />
            </>
          )}
        </div>
      )}
    </nav>
  );
}
