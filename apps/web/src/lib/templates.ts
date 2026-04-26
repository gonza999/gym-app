import type { WorkoutType } from '@/types';

export const EXERCISE_TEMPLATES: Record<WorkoutType, string[]> = {
  Piernas: [
    'Sentadilla',
    'Prensa',
    'Cuádriceps',
    'Isquiotibiales',
    'Gemelos',
  ],
  Torso: [
    'Press inclinado',
    'Polea pecho',
    'Press militar',
    'Apertura',
    'Remo',
    'Elevaciones laterales',
    'Extensiones codo',
  ],
  Full: [
    'Press pecho barra',
    'Polea pecho',
    'Press militar',
    'Elevaciones laterales',
    'Prensa',
    'Cuádriceps',
  ],
};

/** Todos los ejercicios únicos (para selects adicionales) */
export const ALL_EXERCISES = [...new Set(Object.values(EXERCISE_TEMPLATES).flat())].sort();
