import { Workout, MaxRepRecord, AverageRepRecord } from '../types';

export function calculateMaxReps(workouts: Workout[], exerciseId: string, setPosition: number, timeframe?: 'all' | '3months'): MaxRepRecord | null {
  const cutoffDate = timeframe === '3months' 
    ? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) 
    : new Date(0);

  let maxRecord: MaxRepRecord | null = null;

  workouts.forEach(workout => {
    if (new Date(workout.date) < cutoffDate) return;

    // Group sets by exercise
    const exerciseSets = workout.sets
      .filter(set => set.exerciseId === exerciseId)
      .map((set, index) => ({ ...set, position: index + 1 }));

    // Find the set at the specific position
    const setAtPosition = exerciseSets.find(set => set.position === setPosition);
    
    if (setAtPosition && (!maxRecord || setAtPosition.reps > maxRecord.maxReps)) {
      maxRecord = {
        exerciseId,
        setPosition,
        maxReps: setAtPosition.reps,
        date: new Date(workout.date)
      };
    }
  });

  return maxRecord;
}

export function calculateAverageReps(workouts: Workout[], exerciseId: string, setPosition: number, timeframe?: 'all' | '3months'): AverageRepRecord | null {
  const cutoffDate = timeframe === '3months' 
    ? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) 
    : new Date(0);

  let totalReps = 0;
  let totalSets = 0;

  workouts.forEach(workout => {
    if (new Date(workout.date) < cutoffDate) return;

    // Group sets by exercise
    const exerciseSets = workout.sets
      .filter(set => set.exerciseId === exerciseId)
      .map((set, index) => ({ ...set, position: index + 1 }));

    // Find the set at the specific position
    const setAtPosition = exerciseSets.find(set => set.position === setPosition);
    
    if (setAtPosition) {
      totalReps += setAtPosition.reps;
      totalSets++;
    }
  });

  if (totalSets === 0) return null;

  return {
    exerciseId,
    setPosition,
    averageReps: Math.round((totalReps / totalSets) * 10) / 10, // Round to 1 decimal
    totalSets
  };
}

export function getExerciseMaxReps(workouts: Workout[], exerciseId: string, timeframe: 'all' | '3months' = 'all'): MaxRepRecord[] {
  const maxReps: MaxRepRecord[] = [];
  
  // Find the maximum number of sets for this exercise in any workout
  let maxSets = 0;
  workouts.forEach(workout => {
    const exerciseSets = workout.sets.filter(set => set.exerciseId === exerciseId);
    maxSets = Math.max(maxSets, exerciseSets.length);
  });

  // Calculate max reps for each set position
  for (let position = 1; position <= maxSets; position++) {
    const maxRecord = calculateMaxReps(workouts, exerciseId, position, timeframe);
    if (maxRecord) {
      maxReps.push(maxRecord);
    }
  }

  return maxReps;
}

export function getExerciseAverageReps(workouts: Workout[], exerciseId: string, timeframe: 'all' | '3months' = 'all'): AverageRepRecord[] {
  const averageReps: AverageRepRecord[] = [];
  
  // Find the maximum number of sets for this exercise in any workout
  let maxSets = 0;
  workouts.forEach(workout => {
    const exerciseSets = workout.sets.filter(set => set.exerciseId === exerciseId);
    maxSets = Math.max(maxSets, exerciseSets.length);
  });

  // Calculate average reps for each set position
  for (let position = 1; position <= maxSets; position++) {
    const avgRecord = calculateAverageReps(workouts, exerciseId, position, timeframe);
    if (avgRecord) {
      averageReps.push(avgRecord);
    }
  }

  return averageReps;
}