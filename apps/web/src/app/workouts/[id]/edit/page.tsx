'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { workoutsApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { EXERCISE_TEMPLATES, ALL_EXERCISES } from '@/lib/templates';
import type { Exercise, WorkoutSet, WorkoutType, Workout } from '@/types';

function emptySet(): WorkoutSet {
  return { pesoEtiqueta: '', repeticiones: 0 };
}

export default function EditWorkoutPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [original, setOriginal] = useState<Workout | null>(null);
  const [fecha, setFecha] = useState('');
  const [tipo, setTipo] = useState<WorkoutType>('Torso');
  const [ejercicios, setEjercicios] = useState<Exercise[]>([]);
  const [notasGenerales, setNotasGenerales] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    workoutsApi
      .get(id)
      .then((res) => {
        const w = res.workout;
        setOriginal(w);
        setFecha(w.fecha.slice(0, 10));
        setTipo(w.tipo);
        setEjercicios(w.ejercicios);
        setNotasGenerales(w.notasGenerales || '');
      })
      .catch(() => router.push('/workouts'))
      .finally(() => setLoading(false));
  }, [id, user, authLoading, router]);

  const updateSet = (exIdx: number, setIdx: number, patch: Partial<WorkoutSet>) => {
    setEjercicios((prev) =>
      prev.map((e, i) =>
        i === exIdx
          ? { ...e, series: e.series.map((s, j) => (j === setIdx ? { ...s, ...patch } : s)) }
          : e
      )
    );
  };

  const addSet = (exIdx: number) => {
    setEjercicios((prev) =>
      prev.map((e, i) =>
        i === exIdx ? { ...e, series: [...e.series, emptySet()] } : e
      )
    );
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    setEjercicios((prev) =>
      prev.map((e, i) =>
        i === exIdx ? { ...e, series: e.series.filter((_, j) => j !== setIdx) } : e
      )
    );
  };

  const addExercise = (nombre: string) => {
    setEjercicios((prev) => [...prev, { nombre, series: [emptySet(), emptySet(), emptySet()] }]);
  };

  const removeExercise = (idx: number) => {
    setEjercicios((prev) => prev.filter((_, i) => i !== idx));
  };

  const parsePesoValor = (etiqueta: string): number | undefined => {
    const match = etiqueta.match(/^(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : undefined;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await workoutsApi.update(id, {
        fecha,
        tipo,
        notasGenerales: notasGenerales || undefined,
        ejercicios: ejercicios.map((ex) => ({
          nombre: ex.nombre.trim(),
          series: ex.series.map((s) => ({
            pesoEtiqueta: s.pesoEtiqueta,
            pesoValor: parsePesoValor(s.pesoEtiqueta),
            repeticiones: s.repeticiones,
            nota: s.nota || undefined,
          })),
        })),
      });
      router.push(`/workouts/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const availableToAdd = ALL_EXERCISES.filter(
    (name) => !ejercicios.some((e) => e.nombre === name)
  );

  if (loading || authLoading) {
    return (
      <>
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <p className="text-gray-500">Cargando...</p>
        </main>
      </>
    );
  }

  if (!original) return null;

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push(`/workouts/${id}`)}
          className="text-sm text-primary hover:underline mb-4 inline-block"
        >
          ← Volver
        </button>
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Editar rutina</h1>

        {error && (
          <p className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded mb-4 text-sm">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as WorkoutType)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              >
                <option value="Torso">Torso</option>
                <option value="Piernas">Piernas</option>
                <option value="Full">Full</option>
              </select>
            </div>
          </div>

          {/* Notas generales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notas generales (opcional)
            </label>
            <input
              type="text"
              value={notasGenerales}
              onChange={(e) => setNotasGenerales(e.target.value)}
              placeholder="Ej: Día liviano, mucho cansancio..."
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Ejercicios */}
          <div className="space-y-4">
            {ejercicios.map((ej, exIdx) => (
              <div key={exIdx} className="border rounded-lg p-4 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium dark:text-white">{ej.nombre}</h3>
                  {ejercicios.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExercise(exIdx)}
                      className="text-red-500 text-sm hover:underline"
                    >
                      Quitar
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {ej.series.map((s, setIdx) => (
                    <div key={setIdx} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-6">{setIdx + 1}</span>
                      <input
                        type="text"
                        placeholder="Peso"
                        required
                        value={s.pesoEtiqueta}
                        onChange={(e) => updateSet(exIdx, setIdx, { pesoEtiqueta: e.target.value })}
                        className="border rounded px-2 py-1 w-24 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                      />
                      <input
                        type="number"
                        placeholder="Reps"
                        required
                        min={1}
                        value={s.repeticiones || ''}
                        onChange={(e) => updateSet(exIdx, setIdx, { repeticiones: parseInt(e.target.value) || 0 })}
                        className="border rounded px-2 py-1 w-20 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                      />
                      <input
                        type="text"
                        placeholder="Nota"
                        value={s.nota || ''}
                        onChange={(e) => updateSet(exIdx, setIdx, { nota: e.target.value })}
                        className="border rounded px-2 py-1 flex-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                      />
                      {ej.series.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSet(exIdx, setIdx)}
                          className="text-red-400 text-xs hover:text-red-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addSet(exIdx)}
                  className="text-sm text-primary mt-2 hover:underline"
                >
                  + Agregar serie
                </button>
              </div>
            ))}
          </div>

          {availableToAdd.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    addExercise(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 py-3 rounded-lg px-3 hover:border-primary hover:text-primary transition dark:bg-gray-800"
              >
                <option value="" disabled>+ Agregar ejercicio...</option>
                {availableToAdd.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </main>
    </>
  );
}
