const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }

  return res.json();
}

// Auth
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request<{ user: import('@/types').User }>('/api/auth/me'),
};

// Workouts
export const workoutsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{
      workouts: import('@/types').Workout[];
      page: number;
      totalPages: number;
      total: number;
    }>(`/api/workouts${qs}`);
  },
  stats: () =>
    request<{
      total: number;
      porTipo: Record<string, number>;
      ultimoEntrenamiento: string | null;
      semanaActual: number;
      mesActual: number;
      racha: number;
    }>('/api/workouts/stats'),
  get: (id: string) =>
    request<{ workout: import('@/types').Workout }>(`/api/workouts/${id}`),
  create: (data: Record<string, unknown>) =>
    request('/api/workouts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    request(`/api/workouts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request(`/api/workouts/${id}`, { method: 'DELETE' }),
  exercises: () =>
    request<{
      exercises: {
        nombre: string;
        count: number;
        lastDate: string;
        lastPeso: string | null;
      }[];
    }>('/api/workouts/exercises'),
  exerciseMaxes: () =>
    request<{
      maxes: Record<
        string,
        {
          pesoValor: number;
          pesoEtiqueta: string;
          repeticiones: number;
          fecha: string;
        }
      >;
    }>('/api/workouts/exercises/maxes'),
  exerciseHistory: (name: string) =>
    request<{
      history: {
        _id: string;
        fecha: string;
        tipo: string;
        series: import('@/types').WorkoutSet[];
      }[];
    }>(`/api/workouts/exercises/${encodeURIComponent(name)}/history`),
  calendar: (year: number, month: number) =>
    request<{
      days: { id: string; fecha: string; tipo: import('@/types').WorkoutType }[];
    }>(`/api/workouts/calendar?year=${year}&month=${month}`),
};
