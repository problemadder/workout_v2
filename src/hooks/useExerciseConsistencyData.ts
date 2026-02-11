import { useMemo } from 'react';
import { Workout, Exercise } from '../types';

export type PeriodType = '4months' | 'currentYear' | 'lastYear';
export type ConsistencyPattern = 'Stable' | 'Variable' | 'Irregular';
export type TrendDirection = 'improving' | 'declining' | 'stable' | 'insufficient';

export interface RestDaysData {
  date: Date;
  days: number;
}

export interface ConsistencyData {
  medianRestDays: number;
  minRestDays: number;
  maxRestDays: number;
  workoutCount: number;
  pattern: ConsistencyPattern;
  restDaysDistribution: Map<number, number>;
  restDaysData: RestDaysData[];
  trend: {
    direction: TrendDirection;
    percentageChange: number;
    recentMedian: number;
    pastMedian: number;
  } | null;
}

export interface YearComparisonData {
  currentYear: {
    year: number;
    workoutCount: number;
    medianRestDays: number;
    pattern: ConsistencyPattern;
  };
  lastYear: {
    year: number;
    workoutCount: number;
    medianRestDays: number;
    pattern: ConsistencyPattern;
  };
  workoutChange: number;
  restDaysChange: number;
  isImproved: boolean;
}

// Helper function to safely parse dates
const safeParseDate = (dateInput: Date | string): Date => {
  if (dateInput instanceof Date) {
    return new Date(dateInput.getTime());
  }
  if (typeof dateInput === 'string') {
    return new Date(dateInput);
  }
  return new Date();
};

// Calculate median from array of numbers
const calculateMedian = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

// Determine consistency pattern based on IQR
const getConsistencyPattern = (restDays: number[]): ConsistencyPattern => {
  if (restDays.length < 2) return 'Stable';

  const sorted = [...restDays].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;

  if (iqr <= 2) return 'Stable';
  if (iqr <= 7) return 'Variable';
  return 'Irregular';
};

// Calculate rest days between workout sessions
const calculateRestDays = (workouts: Workout[], exerciseId: string): RestDaysData[] => {
  const sessions = workouts
    .filter(workout => workout.sets.some(set => set.exerciseId === exerciseId))
    .map(workout => ({
      date: safeParseDate(workout.date),
      workout
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (sessions.length < 2) return [];

  const restDaysData: RestDaysData[] = [];
  for (let i = 1; i < sessions.length; i++) {
    const current = sessions[i].date;
    const previous = sessions[i - 1].date;

    // Reset hours to compare only days
    const d1 = new Date(current.getFullYear(), current.getMonth(), current.getDate());
    const d2 = new Date(previous.getFullYear(), previous.getMonth(), previous.getDate());
    const diffTime = Math.abs(d1.getTime() - d2.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    restDaysData.push({
      date: current,
      days: diffDays
    });
  }

  return restDaysData;
};

// Filter workouts by time period
const filterWorkoutsByPeriod = (workouts: Workout[], period: PeriodType): Workout[] => {
  const now = new Date();
  const currentYear = now.getFullYear();

  switch (period) {
    case '4months': {
      const fourMonthsAgo = new Date();
      fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
      fourMonthsAgo.setHours(0, 0, 0, 0);
      return workouts.filter(workout => safeParseDate(workout.date) >= fourMonthsAgo);
    }
    case 'currentYear': {
      const startOfYear = new Date(currentYear, 0, 1);
      return workouts.filter(workout => safeParseDate(workout.date) >= startOfYear);
    }
    case 'lastYear': {
      const startOfLastYear = new Date(currentYear - 1, 0, 1);
      const endOfLastYear = new Date(currentYear - 1, 11, 31, 23, 59, 59);
      return workouts.filter(workout => {
        const date = safeParseDate(workout.date);
        return date >= startOfLastYear && date <= endOfLastYear;
      });
    }
    default:
      return workouts;
  }
};

// Calculate trend by comparing recent vs past periods
const calculateTrend = (
  restDaysData: RestDaysData[],
  period: PeriodType
): ConsistencyData['trend'] => {
  // Only calculate trends for 4-month view
  if (period !== '4months' || restDaysData.length < 4) {
    return null;
  }

  const sorted = [...restDaysData].sort((a, b) => a.date.getTime() - b.date.getTime());
  const midPoint = Math.floor(sorted.length / 2);

  // Split into recent (last half) and past (first half)
  const recentData = sorted.slice(midPoint);
  const pastData = sorted.slice(0, midPoint);

  if (recentData.length < 2 || pastData.length < 2) {
    return {
      direction: 'insufficient',
      percentageChange: 0,
      recentMedian: calculateMedian(recentData.map(d => d.days)),
      pastMedian: calculateMedian(pastData.map(d => d.days))
    };
  }

  const recentMedian = calculateMedian(recentData.map(d => d.days));
  const pastMedian = calculateMedian(pastData.map(d => d.days));

  // Calculate percentage change
  // Lower median = more frequent = improving
  let percentageChange = 0;
  if (pastMedian > 0) {
    percentageChange = Math.round(((pastMedian - recentMedian) / pastMedian) * 100);
  }

  let direction: TrendDirection;
  if (percentageChange > 10) {
    direction = 'improving';
  } else if (percentageChange < -10) {
    direction = 'declining';
  } else {
    direction = 'stable';
  }

  return {
    direction,
    percentageChange,
    recentMedian,
    pastMedian
  };
};

export function useExerciseConsistencyData(
  workouts: Workout[],
  exerciseId: string,
  period: PeriodType
): ConsistencyData | null {
  return useMemo(() => {
    if (!exerciseId) return null;

    const filteredWorkouts = filterWorkoutsByPeriod(workouts, period);
    const restDaysData = calculateRestDays(filteredWorkouts, exerciseId);

    if (restDaysData.length === 0) {
      // Check if there are any workouts at all for this exercise
      const exerciseWorkouts = filteredWorkouts.filter(workout =>
        workout.sets.some(set => set.exerciseId === exerciseId)
      );

      return {
        medianRestDays: 0,
        minRestDays: 0,
        maxRestDays: 0,
        workoutCount: exerciseWorkouts.length,
        pattern: 'Stable',
        restDaysDistribution: new Map(),
        restDaysData: [],
        trend: null
      };
    }

    const restDays = restDaysData.map(d => d.days);
    const medianRestDays = calculateMedian(restDays);
    const minRestDays = Math.min(...restDays);
    const maxRestDays = Math.max(...restDays);

    // Calculate distribution
    const distribution = new Map<number, number>();
    restDays.forEach(days => {
      distribution.set(days, (distribution.get(days) || 0) + 1);
    });

    const pattern = getConsistencyPattern(restDays);
    const trend = calculateTrend(restDaysData, period);

    // Count unique workout days
    const exerciseWorkouts = filteredWorkouts.filter(workout =>
      workout.sets.some(set => set.exerciseId === exerciseId)
    );

    return {
      medianRestDays: Math.round(medianRestDays * 10) / 10,
      minRestDays,
      maxRestDays,
      workoutCount: exerciseWorkouts.length,
      pattern,
      restDaysDistribution: distribution,
      restDaysData,
      trend
    };
  }, [workouts, exerciseId, period]);
}

export function useExerciseYearComparison(
  workouts: Workout[],
  exerciseId: string
): YearComparisonData | null {
  return useMemo(() => {
    if (!exerciseId) return null;

    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    // Get current year data
    const currentYearWorkouts = filterWorkoutsByPeriod(workouts, 'currentYear');
    const currentRestDaysData = calculateRestDays(currentYearWorkouts, exerciseId);
    const currentRestDays = currentRestDaysData.map(d => d.days);
    const currentWorkouts = currentYearWorkouts.filter(workout =>
      workout.sets.some(set => set.exerciseId === exerciseId)
    );

    // Get last year data
    const lastYearWorkouts_filtered = filterWorkoutsByPeriod(workouts, 'lastYear');
    const lastRestDaysData = calculateRestDays(lastYearWorkouts_filtered, exerciseId);
    const lastRestDays = lastRestDaysData.map(d => d.days);
    const lastYearWorkoutsList = lastYearWorkouts_filtered.filter(workout =>
      workout.sets.some(set => set.exerciseId === exerciseId)
    );

    const currentMedian = currentRestDays.length > 0
      ? calculateMedian(currentRestDays)
      : 0;
    const lastMedian = lastRestDays.length > 0
      ? calculateMedian(lastRestDays)
      : 0;

    const workoutChange = currentWorkouts.length - lastYearWorkoutsList.length;
    const restDaysChange = lastMedian - currentMedian; // Positive = improved (lower rest days)
    const isImproved = workoutChange > 0 || (workoutChange === 0 && restDaysChange > 0);

    return {
      currentYear: {
        year: currentYear,
        workoutCount: currentWorkouts.length,
        medianRestDays: Math.round(currentMedian * 10) / 10,
        pattern: getConsistencyPattern(currentRestDays)
      },
      lastYear: {
        year: lastYear,
        workoutCount: lastYearWorkoutsList.length,
        medianRestDays: Math.round(lastMedian * 10) / 10,
        pattern: getConsistencyPattern(lastRestDays)
      },
      workoutChange,
      restDaysChange: Math.round(restDaysChange * 10) / 10,
      isImproved
    };
  }, [workouts, exerciseId]);
}
