'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { workoutsApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { StatCardSkeleton } from '@/components/Skeleton';
import { relativeDate } from '@/lib/utils';
import Link from 'next/link';

interface Stats {
  total: number;
  porTipo: Record<string, number>;
  ultimoEntrenamiento: string | null;
  semanaActual: number;
  mesActual: number;
  racha: number;
}

export default function Home() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!user) return;
    workoutsApi.stats().then(setStats).catch(() => {});
  }, [user]);

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-12">
        {loading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : user ? (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold dark:text-white">Hola, {user.name}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Registra tu entrenamiento o revisa tu historial.
              </p>
            </div>

            {/* Activity row */}
            {stats && (
              <div className="grid grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 text-center dark:border-gray-700">
                  <p className="text-2xl font-bold text-orange-500">
                    {stats.racha}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    🔥 Racha (días)
                  </p>
                </div>
                <div className="border rounded-lg p-4 text-center dark:border-gray-700">
                  <p className="text-2xl font-bold text-cyan-600">
                    {stats.semanaActual}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Esta semana
                  </p>
                </div>
                <div className="border rounded-lg p-4 text-center dark:border-gray-700">
                  <p className="text-2xl font-bold text-teal-600">
                    {stats.mesActual}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Este mes
                  </p>
                </div>
              </div>
            )}

            {/* Stats cards */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="border rounded-lg p-4 text-center dark:border-gray-700">
                  <p className="text-2xl font-bold text-primary">{stats.total}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total rutinas</p>
                </div>
                <div className="border rounded-lg p-4 text-center dark:border-gray-700">
                  <p className="text-2xl font-bold text-blue-600">{stats.porTipo.Torso || 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Torso</p>
                </div>
                <div className="border rounded-lg p-4 text-center dark:border-gray-700">
                  <p className="text-2xl font-bold text-green-600">{stats.porTipo.Piernas || 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Piernas</p>
                </div>
                <div className="border rounded-lg p-4 text-center dark:border-gray-700">
                  <p className="text-2xl font-bold text-purple-600">{stats.porTipo.Full || 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Full</p>
                </div>
              </div>
            )}

            {stats?.ultimoEntrenamiento && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Último entrenamiento:{' '}
                <strong>{relativeDate(stats.ultimoEntrenamiento)}</strong>
              </p>
            )}

            <div className="flex flex-wrap gap-4">
              <Link
                href="/workouts/new"
                className="bg-primary text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700"
              >
                Nueva rutina
              </Link>
              <Link
                href="/workouts"
                className="border border-primary text-primary px-5 py-2.5 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-blue-950"
              >
                Ver historial
              </Link>
              <Link
                href="/exercises"
                className="border border-purple-500 text-purple-600 dark:text-purple-400 px-5 py-2.5 rounded-lg font-medium hover:bg-purple-50 dark:hover:bg-purple-950"
              >
                Mis ejercicios
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold dark:text-white">Gym Tracker</h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Lleva el registro de tus rutinas, pesos y repeticiones.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/login"
                className="bg-primary text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700"
              >
                Ingresar
              </Link>
              <Link
                href="/register"
                className="border border-primary text-primary px-5 py-2.5 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-blue-950"
              >
                Crear cuenta
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
