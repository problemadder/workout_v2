export interface DraftWorkout {
  sets: Array<{ exerciseId: string; reps: number; id?: string }>;
  notes: string;
  savedAt: number;
}

const DRAFT_WORKOUT_KEY = 'abs-draft-workout';

export function saveDraftWorkout(sets: Array<{ exerciseId: string; reps: number }>, notes: string): void {
  try {
    const draft: DraftWorkout = {
      sets,
      notes,
      savedAt: Date.now()
    };
    localStorage.setItem(DRAFT_WORKOUT_KEY, JSON.stringify(draft));
  } catch (error) {
    console.error('Error saving draft workout:', error);
  }
}

export function loadDraftWorkout(): DraftWorkout | null {
  try {
    const item = localStorage.getItem(DRAFT_WORKOUT_KEY);
    if (!item) {
      return null;
    }
    const draft = JSON.parse(item) as DraftWorkout;
    return draft;
  } catch (error) {
    console.error('Error loading draft workout:', error);
    return null;
  }
}

export function clearDraftWorkout(): void {
  try {
    localStorage.removeItem(DRAFT_WORKOUT_KEY);
  } catch (error) {
    console.error('Error clearing draft workout:', error);
  }
}

export function hasDraftWorkout(): boolean {
  return localStorage.getItem(DRAFT_WORKOUT_KEY) !== null;
}
