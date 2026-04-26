'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { workoutsApi } from '@/lib/api';
import { useToast } from '@/lib/toast';
import Navbar from '@/components/Navbar';
import { CardSkeleton } from '@/components/Skeleton';
import { formatDateLong, TIPO_COLORS } from '@/lib/utils';
import type { Workout } from '@/types';

export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    workoutsApi
      .get(id)
      .then((res) => setWorkout(res.workout))
      .catch(() => router.push('/workouts'))
      .finally(() => setLoading(false));
  }, [id, user, authLoading, router]);

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta rutina?')) return;
    setDeleting(true);
    try {
      await workoutsApi.delete(id);
      toast('Rutina eliminada');
      router.push('/workouts');
    } catch {
      toast('Error al eliminar', 'error');
      setDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    if (!workout) return;
    const today = new Date().toISOString().split('T')[0];
    const ejercicios = workout.ejercicios.map((ej) => ({
      nombre: ej.nombre,
      grupoMuscular: ej.grupoMuscular,
      series: ej.series.map((s) => ({
        pesoEtiqueta: s.pesoEtiqueta,
        pesoValor: s.pesoValor,
        repeticiones: 0,
        nota: '',
      })),
    }));
    try {
      const res = await workoutsApi.create({
        fecha: today,
        tipo: workout.tipo,
        ejercicios,
      }) as { workout: Workout };
      toast('Rutina duplicada — completa las repeticiones');
      router.push(`/workouts/${res.workout.id}/edit`);
    } catch {
      toast('Error al duplicar', 'error');
    }
  };

  if (loading || authLoading) {
    return (
      <>
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </main>
      </>
    );
  }

  if (!workout) return null;

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push('/workouts')}
          className="text-sm text-primary hover:underline mb-4 inline-block"
        >
          ← Volver
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <span className={`inline-block text-sm font-semibold px-3 py-1 rounded mr-2 ${TIPO_COLORS[workout.tipo] || 'bg-gray-100 text-gray-700'}`}>
              {workout.tipo}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              {formatDateLong(workout.fecha)}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDuplicate}
              className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
              title="Duplicar con fecha de hoy"
            >
              Duplicar
            </button>
            <button
              onClick={() => router.push(`/workouts/${id}/edit`)}
              className="text-sm text-primary hover:underline"
            >
              Editar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-sm text-red-600 hover:underline disabled:opacity-50"
            >
              Eliminar
            </button>
          </div>
        </div>

        {workout.notasGenerales && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded">
            {workout.notasGenerales}
          </p>
        )}

        <div className="space-y-6">
          {workout.ejercicios.map((ej, i) => (
            <div key={i} className="border rounded-lg p-4 dark:border-gray-700">
              <h3 className="font-semibold text-lg mb-3 dark:text-white">{ej.nombre}</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                    <th className="pb-1">Serie</th>
                    <th className="pb-1">Peso</th>
                    <th className="pb-1">Reps</th>
                    <th className="pb-1">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {ej.series.map((s, j) => (
                    <tr key={j} className="border-b last:border-0 dark:border-gray-700">
                      <td className="py-1.5 text-gray-400">{j + 1}</td>
                      <td className="py-1.5 font-mono dark:text-gray-200">{s.pesoEtiqueta}</td>
                      <td className="py-1.5 dark:text-gray-200">{s.repeticiones}</td>
                      <td className="py-1.5 text-gray-500 dark:text-gray-400 italic">
                        {s.nota || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
