'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { workoutsApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { CardSkeleton } from '@/components/Skeleton';
import { relativeDate, formatDateShort, TIPO_COLORS } from '@/lib/utils';
import type { Workout, WorkoutType } from '@/types';

const TIPOS: (WorkoutType | '')[] = ['', 'Torso', 'Piernas', 'Full'];

export default function WorkoutsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: '10' };
    if (filtroTipo) params.tipo = filtroTipo;
    workoutsApi
      .list(params)
      .then((res) => {
        setWorkouts(res.workouts);
        setTotalPages(res.totalPages);
        setTotal(res.total);
      })
      .catch(() => setWorkouts([]))
      .finally(() => setLoading(false));
  }, [user, authLoading, router, filtroTipo, page]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [filtroTipo]);

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold dark:text-white">Mis rutinas</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/workouts/calendar"
              className="text-sm border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300"
              title="Vista calendario"
            >
              📅
            </Link>
            <Link
              href="/workouts/new"
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              + Nueva
            </Link>
          </div>
        </div>

        {/* Filtro por tipo */}
        <div className="flex gap-2 mb-6">
          {TIPOS.map((t) => (
            <button
              key={t}
              onClick={() => setFiltroTipo(t)}
              className={`px-3 py-1 rounded-full text-sm border transition ${
                filtroTipo === t
                  ? 'bg-primary text-white border-primary'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {t || 'Todas'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : workouts.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 mt-3">No hay rutinas registradas.</p>
            <Link href="/workouts/new" className="inline-block mt-4 text-sm text-primary hover:underline">
              Registra tu primera rutina →
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {workouts.map((w) => (
              <li key={w.id}>
                <Link
                  href={`/workouts/${w.id}`}
                  className="block border rounded-lg p-4 hover:shadow transition dark:border-gray-700 dark:hover:border-gray-600"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${TIPO_COLORS[w.tipo] || 'bg-gray-100 text-gray-700'}`}>
                        {w.tipo}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDateShort(w.fecha)}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        ({relativeDate(w.fecha)})
                      </span>
                    </div>
                    <span className="text-sm text-gray-400 dark:text-gray-500">
                      {w.ejercicios.length} ej.
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {w.ejercicios.map((e) => e.nombre).join(' · ')}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded text-sm disabled:opacity-30 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 dark:text-gray-300"
            >
              ← Anterior
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Página {page} de {totalPages} ({total} rutinas)
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded text-sm disabled:opacity-30 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 dark:text-gray-300"
            >
              Siguiente →
            </button>
          </div>
        )}
      </main>
    </>
  );
}
