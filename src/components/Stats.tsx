import React, { useState } from 'react';
import { TrendingUp, Target, Calendar, Percent, Dumbbell, BarChart3, Activity } from 'lucide-react';
import { Workout, WorkoutStats, Exercise } from '../types';
import { formatShortDate, getDaysAgo } from '../utils/dateUtils';

interface StatsProps {
  workouts: Workout[];
  exercises: Exercise[];
  stats: WorkoutStats;
}

export function Stats({ workouts, exercises, stats }: StatsProps) {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');

  const getExerciseStats = (year?: number) => {
    const filteredWorkouts = year 
      ? workouts.filter(workout => new Date(workout.date).getFullYear() === year)
      : workouts;

    const exerciseCount: Record<string, number> = {};
    filteredWorkouts.forEach(workout => {
      workout.sets.forEach(set => {
        exerciseCount[set.exerciseId] = (exerciseCount[set.exerciseId] || 0) + 1;
      });
    });

    return Object.entries(exerciseCount)
      .map(([exerciseId, count]) => ({
        exercise: exercises.find(e => e.id === exerciseId),
        count
      }))
      .filter(item => item.exercise)
      .sort((a, b) => b.count - a.count);
  };

  const getAvailableYears = () => {
    const years = new Set<number>();
    workouts.forEach(workout => {
      years.add(new Date(workout.date).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  const getExerciseYearComparison = (exerciseId: string) => {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    
    // Get workouts for current year and last year
    const currentYearWorkouts = workouts.filter(workout => 
      new Date(workout.date).getFullYear() === currentYear
    );
    const lastYearWorkouts = workouts.filter(workout => 
      new Date(workout.date).getFullYear() === lastYear
    );
    
    // Calculate total reps for each year
    const currentYearReps = currentYearWorkouts.reduce((total, workout) => {
      return total + workout.sets
        .filter(set => set.exerciseId === exerciseId)
        .reduce((setTotal, set) => setTotal + set.reps, 0);
    }, 0);
    
    const lastYearReps = lastYearWorkouts.reduce((total, workout) => {
      return total + workout.sets
        .filter(set => set.exerciseId === exerciseId)
        .reduce((setTotal, set) => setTotal + set.reps, 0);
    }, 0);
    
    // Calculate workout days for each year
    const currentYearWorkoutDays = new Set(
      currentYearWorkouts
        .filter(workout => workout.sets.some(set => set.exerciseId === exerciseId))
        .map(workout => new Date(workout.date).toDateString())
    ).size;
    
    const lastYearWorkoutDays = new Set(
      lastYearWorkouts
        .filter(workout => workout.sets.some(set => set.exerciseId === exerciseId))
        .map(workout => new Date(workout.date).toDateString())
    ).size;
    
    // Calculate daily averages
    const currentYearDailyAvg = currentYearWorkoutDays > 0 ? Math.round((currentYearReps / currentYearWorkoutDays) * 10) / 10 : 0;
    const lastYearDailyAvg = lastYearWorkoutDays > 0 ? Math.round((lastYearReps / lastYearWorkoutDays) * 10) / 10 : 0;
    
    // Calculate total days in each year (up to today for current year)
    const today = new Date();
    const currentYearTotalDays = today.getFullYear() === currentYear 
      ? Math.floor((today.getTime() - new Date(currentYear, 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 365;
    const lastYearTotalDays = 365; // Assume non-leap year for simplicity
    
    // Calculate reps per day per year (including rest days)
    const currentYearRepsPerDay = Math.round((currentYearReps / currentYearTotalDays) * 100) / 100;
    const lastYearRepsPerDay = Math.round((lastYearReps / lastYearTotalDays) * 100) / 100;
    
    return {
      currentYear: {
        year: currentYear,
        totalReps: currentYearReps,
        workoutDays: currentYearWorkoutDays,
        dailyAverage: currentYearDailyAvg,
        repsPerDay: currentYearRepsPerDay,
        totalDays: currentYearTotalDays
      },
      lastYear: {
        year: lastYear,
        totalReps: lastYearReps,
        workoutDays: lastYearWorkoutDays,
        dailyAverage: lastYearDailyAvg,
        repsPerDay: lastYearRepsPerDay,
        totalDays: lastYearTotalDays
      }
    };
  };

  const getWeeklyData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date;
    }).reverse();

    return last7Days.map(date => {
      const workout = workouts.find(w => 
        new Date(w.date).toDateString() === date.toDateString()
      );
      return {
        date,
        sets: workout?.sets.length || 0,
        reps: workout?.sets.reduce((total, set) => total + set.reps, 0) || 0
      };
    });
  };

  // Calculate current week percentage (Monday to Sunday)
  const getCurrentWeekPercentage = () => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Get Monday of current week
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const daysInWeek = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      daysInWeek.push(day);
    }

    const workoutDays = daysInWeek.filter(day => 
      workouts.some(workout => 
        new Date(workout.date).toDateString() === day.toDateString()
      )
    ).length;

    // Only count days up to today
    const today = new Date();
    const daysPassedThisWeek = daysInWeek.filter(day => day <= today).length;
    
    return Math.round((workoutDays / daysPassedThisWeek) * 100);
  };

  // Calculate current month percentage
  const getCurrentMonthPercentage = () => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = new Date();
    
    const daysInMonth = [];
    const currentDate = new Date(firstDayOfMonth);
    
    while (currentDate <= today) {
      daysInMonth.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const workoutDays = daysInMonth.filter(day => 
      workouts.some(workout => 
        new Date(workout.date).toDateString() === day.toDateString()
      )
    ).length;

    return Math.round((workoutDays / daysInMonth.length) * 100);
  };

  // Calculate current year percentage
  const getCurrentYearPercentage = () => {
    const now = new Date();
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
    const today = new Date();
    
    const daysInYear = [];
    const currentDate = new Date(firstDayOfYear);
    
    while (currentDate <= today) {
      daysInYear.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const workoutDays = daysInYear.filter(day => 
      workouts.some(workout => 
        new Date(workout.date).toDateString() === day.toDateString()
      )
    ).length;

    return Math.round((workoutDays / daysInYear.length) * 100);
  };

  // Calculate monthly training percentages for this year
  const getThisYearMonthlyData = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const monthlyData = [];

    for (let month = 0; month <= currentMonth; month++) {
      const firstDay = new Date(currentYear, month, 1);
      const lastDay = month === currentMonth 
        ? new Date() // Up to today for current month
        : new Date(currentYear, month + 1, 0); // Last day of month for past months

      const daysInPeriod = [];
      const currentDate = new Date(firstDay);
      
      while (currentDate <= lastDay) {
        daysInPeriod.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const workoutDays = daysInPeriod.filter(day => 
        workouts.some(workout => 
          new Date(workout.date).toDateString() === day.toDateString()
        )
      ).length;

      const percentage = Math.round((workoutDays / daysInPeriod.length) * 100);

      monthlyData.push({
        month: firstDay.toLocaleDateString('en-US', { month: 'short' }),
        percentage,
        workoutDays,
        totalDays: daysInPeriod.length
      });
    }

    return monthlyData;
  };

  // Calculate monthly training percentages for last year
  const getLastYearMonthlyData = () => {
    const lastYear = new Date().getFullYear() - 1;
    const monthlyData = [];

    for (let month = 0; month < 12; month++) {
      const firstDay = new Date(lastYear, month, 1);
      const lastDay = new Date(lastYear, month + 1, 0);

      const daysInMonth = [];
      const currentDate = new Date(firstDay);
      
      while (currentDate <= lastDay) {
        daysInMonth.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const workoutDays = daysInMonth.filter(day => 
        workouts.some(workout => 
          new Date(workout.date).toDateString() === day.toDateString()
        )
      ).length;

      const percentage = Math.round((workoutDays / daysInMonth.length) * 100);

      monthlyData.push({
        month: firstDay.toLocaleDateString('en-US', { month: 'short' }),
        percentage,
        workoutDays,
        totalDays: daysInMonth.length
      });
    }

    return monthlyData;
  };

  // Calculate sets per category for current week
  const getWeeklyCategoryStats = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weeklyWorkouts = workouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate >= monday && workoutDate <= sunday;
    });

    const categoryCounts: Record<string, number> = {};
    
    weeklyWorkouts.forEach(workout => {
      workout.sets.forEach(set => {
        const exercise = exercises.find(e => e.id === set.exerciseId);
        if (exercise) {
          categoryCounts[exercise.category] = (categoryCounts[exercise.category] || 0) + 1;
        }
      });
    });

    return categoryCounts;
  };

  // Calculate sets per category for current month
  const getMonthlyCategoryStats = () => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    lastDayOfMonth.setHours(23, 59, 59, 999);

    const monthlyWorkouts = workouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate >= firstDayOfMonth && workoutDate <= lastDayOfMonth;
    });

    const categoryCounts: Record<string, number> = {};
    
    monthlyWorkouts.forEach(workout => {
      workout.sets.forEach(set => {
        const exercise = exercises.find(e => e.id === set.exerciseId);
        if (exercise) {
          categoryCounts[exercise.category] = (categoryCounts[exercise.category] || 0) + 1;
        }
      });
    });

    return categoryCounts;
  };

  // Calculate sets per category for last month
  const getLastMonthlyCategoryStats = () => {
    const now = new Date();
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    lastDayOfLastMonth.setHours(23, 59, 59, 999);

    const lastMonthWorkouts = workouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate >= firstDayOfLastMonth && workoutDate <= lastDayOfLastMonth;
    });

    const categoryCounts: Record<string, number> = {};
    
    lastMonthWorkouts.forEach(workout => {
      workout.sets.forEach(set => {
        const exercise = exercises.find(e => e.id === set.exerciseId);
        if (exercise) {
          categoryCounts[exercise.category] = (categoryCounts[exercise.category] || 0) + 1;
        }
      });
    });

    return categoryCounts;
  };

  const exerciseStats = getExerciseStats(selectedYear);
  const availableYears = getAvailableYears();
  const weeklyData = getWeeklyData();
  const maxSets = Math.max(...weeklyData.map(d => d.sets), 1);
  const weekPercentage = getCurrentWeekPercentage();
  const monthPercentage = getCurrentMonthPercentage();
  const yearPercentage = getCurrentYearPercentage();
  const weeklyCategoryStats = getWeeklyCategoryStats();
  const monthlyCategoryStats = getMonthlyCategoryStats();
  const lastMonthlyCategoryStats = getLastMonthlyCategoryStats();
  const thisYearMonthlyData = getThisYearMonthlyData();
  const lastYearMonthlyData = getLastYearMonthlyData();

  // Sort exercises alphabetically for the dropdown
  const sortedExercises = [...exercises].sort((a, b) => a.name.localeCompare(b.name));
  
  // Get exercise comparison data
  const exerciseComparison = selectedExerciseId ? getExerciseYearComparison(selectedExerciseId) : null;
  const selectedExercise = exercises.find(e => e.id === selectedExerciseId);

  const categories = [
    { value: 'abs', label: 'Abs', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'legs', label: 'Legs', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'arms', label: 'Arms', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'back', label: 'Back', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { value: 'shoulders', label: 'Shoulders', color: 'bg-gray-100 text-gray-800 border-gray-200' },
    { value: 'chest', label: 'Chest', color: 'bg-pink-100 text-pink-800 border-pink-200' },
    { value: 'cardio', label: 'Cardio', color: 'bg-red-100 text-red-800 border-red-200' },
    { value: 'full-body', label: 'Full Body', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' }
  ];

  // Get month names for display
  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long' });
  const lastMonthName = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleDateString('en-US', { month: 'long' });
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  // Find max percentage for chart scaling
  const maxThisYearPercentage = Math.max(...thisYearMonthlyData.map(d => d.percentage), 1);
  const maxLastYearPercentage = Math.max(...lastYearMonthlyData.map(d => d.percentage), 1);
  const maxChartPercentage = Math.max(maxThisYearPercentage, maxLastYearPercentage, 100);

  return (
    <div className="p-6 pb-24 space-y-6 bg-solarized-base3 min-h-screen">
      {/* Training Percentages */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-solarized-blue to-solarized-cyan text-solarized-base3 p-3 rounded-xl shadow-lg">
          <div className="flex items-center gap-1 mb-1">
            <Percent size={16} />
            <span className="text-xs font-medium">Week</span>
          </div>
          <p className="text-xl font-bold">{weekPercentage}%</p>
          <p className="text-xs opacity-90">training</p>
        </div>
        
        <div className="bg-gradient-to-br from-solarized-green to-solarized-cyan text-solarized-base3 p-3 rounded-xl shadow-lg">
          <div className="flex items-center gap-1 mb-1">
            <Target size={16} />
            <span className="text-xs font-medium">Month</span>
          </div>
          <p className="text-xl font-bold">{monthPercentage}%</p>
          <p className="text-xs opacity-90">training</p>
        </div>

        <div className="bg-gradient-to-br from-solarized-violet to-solarized-magenta text-solarized-base3 p-3 rounded-xl shadow-lg">
          <div className="flex items-center gap-1 mb-1">
            <Calendar size={16} />
            <span className="text-xs font-medium">Year</span>
          </div>
          <p className="text-xl font-bold">{yearPercentage}%</p>
          <p className="text-xs opacity-90">training</p>
        </div>
      </div>

      {/* Exercise Year Comparison */}
      <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-solarized-base02">
          <Activity size={20} className="text-solarized-orange" />
          Exercise Year Comparison
        </h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-solarized-base01 mb-2">
            Select Exercise
          </label>
          <select
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            className="w-full p-3 border border-solarized-base1 rounded-lg focus:ring-2 focus:ring-solarized-orange focus:border-transparent bg-solarized-base3 text-solarized-base02"
          >
            <option value="">Choose an exercise...</option>
            {categories.map(category => {
              const categoryExercises = sortedExercises.filter(ex => ex.category === category.value);
              if (categoryExercises.length === 0) return null;
              
              return (
                <optgroup key={category.value} label={category.label}>
                  {categoryExercises.map(exercise => (
                    <option key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </div>

        {exerciseComparison && selectedExercise && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h4 className="text-lg font-semibold text-solarized-base02">{selectedExercise.name}</h4>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${
                categories.find(c => c.value === selectedExercise.category)?.color || 'bg-gray-100 text-gray-800 border-gray-200'
              }`}>
                {categories.find(c => c.value === selectedExercise.category)?.label}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Year */}
              <div className="bg-solarized-blue/10 p-4 rounded-lg border border-solarized-blue/20">
                <h5 className="font-semibold text-solarized-blue mb-3">{exerciseComparison.currentYear.year} (Current Year)</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-solarized-base01">Total Reps:</span>
                    <span className="font-medium text-solarized-base02">{exerciseComparison.currentYear.totalReps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-solarized-base01">Workout Days:</span>
                    <span className="font-medium text-solarized-base02">{exerciseComparison.currentYear.workoutDays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-solarized-base01">Avg per Workout:</span>
                    <span className="font-medium text-solarized-base02">{exerciseComparison.currentYear.dailyAverage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-solarized-base01">Reps per Day:</span>
                    <span className="font-medium text-solarized-base02">{exerciseComparison.currentYear.repsPerDay}</span>
                  </div>
                </div>
              </div>

              {/* Last Year */}
              <div className="bg-solarized-violet/10 p-4 rounded-lg border border-solarized-violet/20">
                <h5 className="font-semibold text-solarized-violet mb-3">{exerciseComparison.lastYear.year} (Last Year)</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-solarized-base01">Total Reps:</span>
                    <span className="font-medium text-solarized-base02">{exerciseComparison.lastYear.totalReps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-solarized-base01">Workout Days:</span>
                    <span className="font-medium text-solarized-base02">{exerciseComparison.lastYear.workoutDays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-solarized-base01">Avg per Workout:</span>
                    <span className="font-medium text-solarized-base02">{exerciseComparison.lastYear.dailyAverage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-solarized-base01">Reps per Day:</span>
                    <span className="font-medium text-solarized-base02">{exerciseComparison.lastYear.repsPerDay}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison Summary */}
            <div className="bg-solarized-green/10 p-4 rounded-lg border border-solarized-green/20">
              <h5 className="font-semibold text-solarized-green mb-2">Year-over-Year Change</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-solarized-base01">Total Reps: </span>
                  <span className={`font-medium ${
                    exerciseComparison.currentYear.totalReps >= exerciseComparison.lastYear.totalReps 
                      ? 'text-solarized-green' 
                      : 'text-solarized-red'
                  }`}>
                    {exerciseComparison.currentYear.totalReps >= exerciseComparison.lastYear.totalReps ? '+' : ''}
                    {exerciseComparison.currentYear.totalReps - exerciseComparison.lastYear.totalReps}
                  </span>
                </div>
                <div>
                  <span className="text-solarized-base01">Reps per Day: </span>
                  <span className={`font-medium ${
                    exerciseComparison.currentYear.repsPerDay >= exerciseComparison.lastYear.repsPerDay 
                      ? 'text-solarized-green' 
                      : 'text-solarized-red'
                  }`}>
                    {exerciseComparison.currentYear.repsPerDay >= exerciseComparison.lastYear.repsPerDay ? '+' : ''}
                    {(exerciseComparison.currentYear.repsPerDay - exerciseComparison.lastYear.repsPerDay).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!selectedExerciseId && (
          <p className="text-solarized-base01 text-center py-8">
            Select an exercise to see year-over-year comparison
          </p>
        )}
      </div>

      {/* Monthly Training Charts */}
      <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-solarized-base02">
          <BarChart3 size={20} className="text-solarized-blue" />
          Monthly Training Days - {currentYear}
        </h3>
        <div className="space-y-3">
          {thisYearMonthlyData.map((data, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-8 text-xs text-solarized-base01 font-medium">
                {data.month}
              </div>
              <div className="flex-1 bg-solarized-base1/20 rounded-full h-6 relative overflow-hidden">
                <div
                  className="bg-solarized-blue h-full rounded-full transition-all duration-300"
                  style={{ width: `${(data.percentage / maxChartPercentage) * 100}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-solarized-base02">
                    {data.percentage}%
                  </span>
                </div>
              </div>
              <div className="w-20 text-xs text-solarized-base01 text-right">
                {data.workoutDays}/{data.totalDays} days
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-solarized-base02">
          <BarChart3 size={20} className="text-solarized-violet" />
          Monthly Training Days - {lastYear}
        </h3>
        <div className="space-y-3">
          {lastYearMonthlyData.map((data, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-8 text-xs text-solarized-base01 font-medium">
                {data.month}
              </div>
              <div className="flex-1 bg-solarized-base1/20 rounded-full h-6 relative overflow-hidden">
                <div
                  className="bg-solarized-violet h-full rounded-full transition-all duration-300"
                  style={{ width: `${(data.percentage / maxChartPercentage) * 100}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-solarized-base02">
                    {data.percentage}%
                  </span>
                </div>
              </div>
              <div className="w-20 text-xs text-solarized-base01 text-right">
                {data.workoutDays}/{data.totalDays} days
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sets per Category - This Week */}
      <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-solarized-base02">
          <Dumbbell size={20} className="text-solarized-blue" />
          Sets per Category - This Week
        </h3>
        {Object.keys(weeklyCategoryStats).length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {categories.map(category => {
              const count = weeklyCategoryStats[category.value] || 0;
              if (count === 0) return null;
              
              return (
                <div key={category.value} className="flex items-center justify-between p-3 bg-solarized-base1/10 rounded-lg border border-solarized-base1/20">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-solarized-base02">{category.label}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-sm font-bold border ${category.color}`}>
                    {count} sets
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-solarized-base01 text-center py-4">No sets completed this week</p>
        )}
      </div>

      {/* Sets per Category - This Month */}
      <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-solarized-base02">
          <Calendar size={20} className="text-solarized-green" />
          Sets per Category - {currentMonthName}
        </h3>
        {Object.keys(monthlyCategoryStats).length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {categories.map(category => {
              const count = monthlyCategoryStats[category.value] || 0;
              if (count === 0) return null;
              
              return (
                <div key={category.value} className="flex items-center justify-between p-3 bg-solarized-base1/10 rounded-lg border border-solarized-base1/20">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-solarized-base02">{category.label}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-sm font-bold border ${category.color}`}>
                    {count} sets
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-solarized-base01 text-center py-4">No sets completed this month</p>
        )}
      </div>

      {/* Sets per Category - Last Month */}
      <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-solarized-base02">
          <Calendar size={20} className="text-solarized-violet" />
          Sets per Category - {lastMonthName}
        </h3>
        {Object.keys(lastMonthlyCategoryStats).length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {categories.map(category => {
              const count = lastMonthlyCategoryStats[category.value] || 0;
              if (count === 0) return null;
              
              return (
                <div key={category.value} className="flex items-center justify-between p-3 bg-solarized-base1/10 rounded-lg border border-solarized-base1/20">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-solarized-base02">{category.label}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-sm font-bold border ${category.color}`}>
                    {count} sets
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-solarized-base01 text-center py-4">No sets completed in {lastMonthName}</p>
        )}
      </div>

      {/* Weekly Activity */}
      <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-solarized-base02">
          <Calendar size={20} className="text-solarized-blue" />
          Last 7 Days
        </h3>
        <div className="space-y-3">
          {weeklyData.map((day, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-12 text-xs text-solarized-base01">
                {formatShortDate(day.date)}
              </div>
              <div className="flex-1 bg-solarized-base1/20 rounded-full h-6 relative overflow-hidden">
                {day.sets > 0 && (
                  <div
                    className="bg-solarized-blue h-full rounded-full transition-all duration-300"
                    style={{ width: `${(day.sets / maxSets) * 100}%` }}
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-solarized-base02">
                    {day.sets > 0 ? `${day.sets} sets` : 'Rest'}
                  </span>
                </div>
              </div>
              <div className="w-16 text-xs text-solarized-base01 text-right">
                {day.reps > 0 ? `${day.reps} reps` : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exercise Breakdown with Year Filter */}
      <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-solarized-base02">
            <TrendingUp size={20} className="text-solarized-blue" />
            Most Used Exercises
          </h3>
          {availableYears.length > 0 && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-solarized-base1 rounded-lg focus:ring-2 focus:ring-solarized-blue focus:border-transparent bg-solarized-base3 text-solarized-base02"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          )}
        </div>
        {exerciseStats.length > 0 ? (
          <div className="space-y-3">
            {exerciseStats.slice(0, 5).map((item, index) => (
              <div key={item.exercise!.id} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-solarized-blue/10 text-solarized-blue rounded-full flex items-center justify-center text-xs font-bold border border-solarized-blue/20">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-solarized-base02">{item.exercise!.name}</p>
                  <p className="text-sm text-solarized-base01">{item.count} sets completed in {selectedYear}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-solarized-base01 text-center py-4">No exercise data for {selectedYear}</p>
        )}
      </div>
    </div>
  );
}