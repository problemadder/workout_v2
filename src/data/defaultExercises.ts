import { Exercise } from '../types';

// No default exercises - users must create their own or import them
export const defaultExercises: Omit<Exercise, 'id' | 'createdAt'>[] = [];