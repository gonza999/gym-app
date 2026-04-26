'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { workoutsApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { ChartSkeleton, CardSkeleton } from '@/components/Skeleton';
import { formatDateShort } from '@/lib/utils';
import type { WorkoutSet } from '@/types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface HistoryEntry {
  _id: string;
  fecha: string;
  tipo: string;
  series: WorkoutSet[];
}

export default function ExerciseDetailPage() {
  const params = useParams<{ name: string }>();
  const name = decodeURIComponent(params.name);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    workoutsApi
      .exerciseHistory(name)
      .then((res) => setHistory(res.history))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [name, user, authLoading, router]);

  // Chart data: max weight per session
  const chartData = useMemo(() => {
    return history.map((h) => {
      const maxWeight = Math.max(
        0,
        ...h.series.map((s) => s.pesoValor ?? 0)
      );
      const maxReps = Math.max(0, ...h.series.map((s) => s.repeticiones));
      const volume = h.series.reduce(
        (sum, s) => sum + (s.pesoValor ?? 0) * s.repeticiones,
        0
      );
      return {
        fecha: formatDateShort(h.fecha),
        pesoMax: maxWeight,
        repsMax: maxReps,
        volumen: Math.round(volume),
      };
    });
  }, [history]);

  // Personal records
  const pr = useMemo(() => {
    let bestWeight = 0;
    let bestWeightDate = '';
    let bestVolume = 0;
    let bestVolumeDate = '';

    for (const h of history) {
      for (const s of h.series) {
        if ((s.pesoValor ?? 0) > bestWeight) {
          bestWeight = s.pesoValor ?? 0;
          bestWeightDate = h.fecha;
        }
      }
      const vol = h.series.reduce(
        (sum, s) => sum + (s.pesoValor ?? 0) * s.repeticiones,
        0
      );
      if (vol > bestVolume) {
        bestVolume = vol;
        bestVolumeDate = h.fecha;
      }
    }

    return { bestWeight, bestWeightDate, bestVolume, bestVolumeDate };
  }, [history]);

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push('/exercises')}
          className="text-sm text-primary hover:underline mb-4 inline-block"
        >
          ← Ejercicios
        </button>

        <h1 className="text-2xl font-bold mb-6">{name}</h1>

        {loading ? (
          <div className="space-y-4">
            <ChartSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : history.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No hay historial para este ejercicio.
          </p>
        ) : (
          <div className="space-y-8">
            {/* PR Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 text-center dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  🏆 Mejor peso
                </p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {pr.bestWeight > 0 ? `${pr.bestWeight}` : '—'}
                </p>
                {pr.bestWeightDate && (
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDateShort(pr.bestWeightDate)}
                  </p>
                )}
              </div>
              <div className="border rounded-lg p-4 text-center dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  🏆 Mejor volumen
                </p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {pr.bestVolume > 0 ? pr.bestVolume.toLocaleString() : '—'}
                </p>
                {pr.bestVolumeDate && (
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDateShort(pr.bestVolumeDate)}
                  </p>
                )}
              </div>
            </div>

            {/* Weight Chart */}
            <div className="border rounded-lg p-4 dark:border-gray-700">
              <h2 className="font-semibold mb-4">Peso máximo por sesión</h2>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="pesoMax"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Peso (kg)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Volume Chart */}
            <div className="border rounded-lg p-4 dark:border-gray-700">
              <h2 className="font-semibold mb-4">Volumen por sesión</h2>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="volumen"
                    stroke="#9333ea"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Volumen (kg×reps)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* History Table */}
            <div className="border rounded-lg p-4 dark:border-gray-700">
              <h2 className="font-semibold mb-4">
                Historial ({history.length} sesiones)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                      <th className="pb-2">Fecha</th>
                      <th className="pb-2">Series</th>
                      <th className="pb-2">Resumen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...history].reverse().map((h) => (
                      <tr
                        key={h._id}
                        className="border-b last:border-0 dark:border-gray-700"
                      >
                        <td className="py-2 whitespace-nowrap">
                          {formatDateShort(h.fecha)}
                        </td>
                        <td className="py-2">{h.series.length}</td>
                        <td className="py-2 font-mono text-xs">
                          {h.series
                            .map(
                              (s) =>
                                `${s.pesoEtiqueta}×${s.repeticiones}${s.nota ? ` (${s.nota})` : ''}`
                            )
                            .join(' / ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
