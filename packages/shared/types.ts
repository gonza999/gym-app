export interface WorkoutSet {
  pesoEtiqueta: string;
  pesoValor?: number;
  repeticiones: number;
  nota?: string;
}

export interface Exercise {
  nombre: string;
  grupoMuscular?: string;
  series: WorkoutSet[];
}

export type WorkoutType = 'Torso' | 'Piernas' | 'Full';

export interface Workout {
  id: string;
  userId: string;
  fecha: string;
  fechaTextoOriginal?: string;
  tipo: WorkoutType;
  ejercicios: Exercise[];
  notasGenerales?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}
