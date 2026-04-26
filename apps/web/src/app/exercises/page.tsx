'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { workoutsApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { CardSkeleton } from '@/components/Skeleton';
import { relativeDate } from '@/lib/utils';

interface ExerciseInfo {
  nombre: string;
  count: number;
  lastDate: string;
  lastPeso: string | null;
}

export default function ExercisesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [exercises, setExercises] = useState<ExerciseInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    workoutsApi
      .exercises()
      .then((res) => setExercises(res.exercises))
      .catch(() => setExercises([]))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const filtered = exercises.filter((e) =>
    e.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Mis ejercicios</h1>

        <input
          type="text"
          placeholder="Buscar ejercicio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded-lg px-4 py-2 mb-6 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 mt-3">
              {search ? 'No se encontraron ejercicios.' : 'No hay ejercicios registrados aún.'}
            </p>
            {!search && (
              <Link
                href="/workouts/new"
                className="inline-block mt-4 text-sm text-primary hover:underline"
              >
                Registra tu primera rutina →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((e) => (
              <Link
                key={e.nombre}
                href={`/exercises/${encodeURIComponent(e.nombre)}`}
                className="block border rounded-lg p-4 hover:shadow transition dark:border-gray-700 dark:hover:border-gray-600"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{e.nombre}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {e.count} {e.count === 1 ? 'vez' : 'veces'} · Último: {relativeDate(e.lastDate)}
                    </p>
                  </div>
                  {e.lastPeso && (
                    <span className="text-sm font-mono text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {e.lastPeso}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-6 text-center">
          {exercises.length} ejercicios únicos
        </p>
      </main>
    </>
  );
}
