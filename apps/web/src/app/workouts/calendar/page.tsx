'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { workoutsApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { Skeleton } from '@/components/Skeleton';
import { TIPO_DOT_COLORS } from '@/lib/utils';
import type { WorkoutType } from '@/types';

interface CalendarDay {
  id: string;
  fecha: string;
  tipo: WorkoutType;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function CalendarPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    setLoading(true);
    workoutsApi
      .calendar(year, month)
      .then((res) => setDays(res.days))
      .catch(() => setDays([]))
      .finally(() => setLoading(false));
  }, [user, authLoading, router, year, month]);

  const prev = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const next = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const dayMap = new Map<number, CalendarDay[]>();
  for (const d of days) {
    const dt = new Date(d.fecha);
    const day = dt.getDate();
    if (!dayMap.has(day)) dayMap.set(day, []);
    dayMap.get(day)!.push(d);
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <>
      <Navbar />
      <main className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/workouts" className="text-sm text-primary hover:underline">
            ← Lista
          </Link>
          <h1 className="text-xl font-bold dark:text-white">Calendario</h1>
          <div className="w-12" />
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prev} className="px-3 py-1 border rounded text-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 dark:text-gray-300">
            ←
          </button>
          <span className="font-semibold dark:text-white">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button onClick={next} className="px-3 py-1 border rounded text-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 dark:text-gray-300">
            →
          </button>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Torso</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Piernas</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Full</span>
        </div>

        {loading ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <div className="border rounded-lg overflow-hidden dark:border-gray-700">
            {/* Header */}
            <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800">
              {DAY_NAMES.map((d) => (
                <div key={d} className="text-center text-xs font-medium py-2 text-gray-500 dark:text-gray-400">
                  {d}
                </div>
              ))}
            </div>
            {/* Days */}
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                const workouts = day ? dayMap.get(day) : undefined;
                const isToday = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();
                return (
                  <div
                    key={i}
                    className={`min-h-[3rem] p-1 border-t dark:border-gray-700 text-center ${
                      day ? 'cursor-default' : ''
                    } ${isToday ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
                  >
                    {day && (
                      <>
                        <span className={`text-sm ${isToday ? 'font-bold text-primary' : 'text-gray-700 dark:text-gray-300'}`}>
                          {day}
                        </span>
                        {workouts && (
                          <div className="flex justify-center gap-0.5 mt-1">
                            {workouts.map((w) => (
                              <Link
                                key={w.id}
                                href={`/workouts/${w.id}`}
                                className={`w-2.5 h-2.5 rounded-full ${TIPO_DOT_COLORS[w.tipo] || 'bg-gray-400'} hover:ring-2 ring-offset-1`}
                                title={w.tipo}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Month summary */}
        {!loading && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center">
            {days.length} entrenamiento{days.length !== 1 ? 's' : ''} en {MONTH_NAMES[month - 1].toLowerCase()}
          </p>
        )}
      </main>
    </>
  );
}
