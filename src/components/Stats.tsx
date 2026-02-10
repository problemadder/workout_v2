import React, { useEffect, useState } from 'react';
import { TrendingUp, Target, Calendar, Percent, Dumbbell, BarChart3, Activity, LineChart, Search, X, Clock, Repeat, Timer } from 'lucide-react';
import { Workout, Exercise } from '../types';
import { formatShortDate } from '../utils/dateUtils';
import { formatSingleDecimal } from '../utils/formatUtils';
import { PieChart } from './PieChart';

interface StatsProps {
  workouts: Workout[];
  exercises: Exercise[];
}

export function Stats({ workouts, exercises }: StatsProps) {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

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
    const currentYearDailyAvg = currentYearWorkoutDays > 0 ? formatSingleDecimal(currentYearReps / currentYearWorkoutDays) : 0;
    const lastYearDailyAvg = lastYearWorkoutDays > 0 ? formatSingleDecimal(lastYearReps / lastYearWorkoutDays) : 0;
    
    // Calculate total days in each year (up to today for current year)
    const today = new Date();
    const currentYearTotalDays = today.getFullYear() === currentYear 
      ? Math.floor((today.getTime() - new Date(currentYear, 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 365;
    const lastYearTotalDays = 365; // Assume non-leap year for simplicity
    
    // Calculate reps per day per year (including rest days)
    const currentYearRepsPerDay = formatSingleDecimal(currentYearReps / currentYearTotalDays);
    const lastYearRepsPerDay = formatSingleDecimal(lastYearReps / lastYearTotalDays);
    
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

  // Calculate yearly training percentages for all tracked years
  const getYearlyTrainingPercentages = () => {
    const years = getAvailableYears();
    const currentYear = new Date().getFullYear();
    
    return years.map(year => {
      const firstDayOfYear = new Date(year, 0, 1);
      const lastDayOfYear = year === currentYear 
        ? new Date() // Up to today for current year
        : new Date(year, 11, 31); // Full year for past years
      
      const daysInPeriod = [];
      const currentDate = new Date(firstDayOfYear);
      
      while (currentDate <= lastDayOfYear) {
        daysInPeriod.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      const workoutDays = daysInPeriod.filter(day => 
        workouts.some(workout => 
          new Date(workout.date).toDateString() === day.toDateString()
        )
      ).length;
      
      const percentage = Math.round((workoutDays / daysInPeriod.length) * 100);
      
      return {
        year,
        percentage,
        workoutDays,
        totalDays: daysInPeriod.length,
        isCurrent: year === currentYear
      };
    });
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

  // Get exercise sessions for the last 4 months
  const getExerciseSessions = (exerciseId: string) => {
    if (!exerciseId) return [];
    
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
    fourMonthsAgo.setHours(0, 0, 0, 0);
    
    return workouts
      .filter(workout => 
        new Date(workout.date) >= fourMonthsAgo &&
        workout.sets.some(set => set.exerciseId === exerciseId)
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Calculate sessions per month for last 4 months
  const getSessionsPerMonth = (exerciseId: string) => {
    const sessions = getExerciseSessions(exerciseId);
    const monthlyData: Record<string, number> = {};
    const last4Months = [];
    
    for (let i = 3; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toLocaleDateString('en-US', { month: 'short' });
      monthlyData[monthKey] = 0;
      last4Months.push(monthKey);
    }
    
    sessions.forEach(workout => {
      const monthKey = new Date(workout.date).toLocaleDateString('en-US', { month: 'short' });
      if (monthlyData[monthKey] !== undefined) {
        monthlyData[monthKey]++;
      }
    });
    
    return last4Months.map(month => ({
      month,
      count: monthlyData[month]
    }));
  };

  // Calculate volume per session for last 4 months
  const getVolumePerSession = (exerciseId: string) => {
    const sessions = getExerciseSessions(exerciseId);
    
    return sessions.map(workout => {
      const volume = workout.sets
        .filter(set => set.exerciseId === exerciseId)
        .reduce((total, set) => total + set.reps, 0);
      
      return {
        date: new Date(workout.date),
        volume
      };
    });
  };

  // Calculate rest days between sessions for last 4 months
  const getRestDaysBetweenSessions = (exerciseId: string) => {
    const sessions = getExerciseSessions(exerciseId);
    if (sessions.length < 2) return [];
    
    const restDaysData = [];
    for (let i = 1; i < sessions.length; i++) {
      const current = new Date(sessions[i].date);
      const previous = new Date(sessions[i-1].date);
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

  // Get max reps over time for selected exercise (last 3 years)
  const getMaxRepsOverTime = (exerciseId: string) => {
    if (!exerciseId) return [];
    
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    
    const relevantWorkouts = workouts.filter(workout => 
      new Date(workout.date) >= threeYearsAgo &&
      workout.sets.some(set => set.exerciseId === exerciseId)
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const maxData: Array<{ date: Date; maxReps: number; setPosition: number }> = [];
    let runningMax = 0;
    
    relevantWorkouts.forEach(workout => {
      const exerciseSets = workout.sets
        .filter(set => set.exerciseId === exerciseId)
        .map((set, index) => ({ ...set, position: index + 1 }));
      
      if (exerciseSets.length > 0) {
        const workoutMax = Math.max(...exerciseSets.map(set => set.reps));
        const maxSet = exerciseSets.find(set => set.reps === workoutMax);
        
        if (workoutMax > runningMax) {
          runningMax = workoutMax;
          maxData.push({
            date: new Date(workout.date),
            maxReps: workoutMax,
            setPosition: maxSet?.position || 1
          });
        }
      }
    });
    
    return maxData;
  };

  // Generate chart points for area chart
  const generateChartData = (exerciseId: string) => {
    const maxData = getMaxRepsOverTime(exerciseId);
    if (maxData.length === 0) return [];
    
    // Create a more complete timeline
    const chartData = [];
    let currentMax = 0;
    
    // Start from 3 years ago
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 3);
    
    // Add initial point
    chartData.push({
      date: startDate,
      maxReps: 0,
      setPosition: 0
    });
    
    // Add all max improvement points
    maxData.forEach(point => {
      chartData.push(point);
      currentMax = point.maxReps;
    });
    
    // Add current point if needed
    const lastPoint = maxData[maxData.length - 1];
    const today = new Date();
    if (!lastPoint || lastPoint.date.toDateString() !== today.toDateString()) {
      chartData.push({
        date: today,
        maxReps: currentMax,
        setPosition: lastPoint?.setPosition || 0
      });
    }
    
    return chartData;
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
  const yearlyTrainingData = getYearlyTrainingPercentages();

  const categories = [
    { value: 'abs', label: 'Abs', color: 'text-yellow-800 border-yellow-300', bgColor: '#FFE6A9' },
    { value: 'legs', label: 'Legs', color: 'text-green-800 border-green-300', bgColor: '#A7C1A8' },
    { value: 'arms', label: 'Arms', color: 'text-blue-800 border-blue-300', bgColor: '#9EC6F3' },
    { value: 'back', label: 'Back', color: 'text-purple-800 border-purple-300', bgColor: '#898AC4' },
    { value: 'shoulders', label: 'Shoulders', color: 'text-gray-700 border-gray-400', bgColor: '#E5E0D8' },
    { value: 'chest', label: 'Chest', color: 'text-green-800 border-green-300', bgColor: '#D1D8BE' },
    { value: 'cardio', label: 'Cardio', color: 'text-teal-800 border-teal-300', bgColor: '#819A91' },
    { value: 'full-body', label: 'Full Body', color: 'text-rose-800 border-rose-300', bgColor: '#E5989B' }
  ];

  const sortedCategories = [...categories].sort((a, b) => a.label.localeCompare(b.label));

  // Sort exercises alphabetically for the dropdown
  const sortedExercises = [...exercises].sort((a, b) => a.name.localeCompare(b.name));

  const searchFilteredExercises = searchQuery.trim()
    ? sortedExercises.filter(exercise => {
        const categoryLabel = categories.find(c => c.value === exercise.category)?.label ?? '';
        const description = exercise.description ?? '';
        const lowerQuery = searchQuery.toLowerCase();

        return (
          exercise.name.toLowerCase().includes(lowerQuery) ||
          description.toLowerCase().includes(lowerQuery) ||
          categoryLabel.toLowerCase().includes(lowerQuery)
        );
      })
    : sortedExercises;

  useEffect(() => {
    if (!searchQuery.trim()) {
      if (selectedExerciseId && !sortedExercises.find(exercise => exercise.id === selectedExerciseId)) {
        setSelectedExerciseId('');
      }
      return;
    }

    if (searchFilteredExercises.length === 1) {
      setSelectedExerciseId(searchFilteredExercises[0].id);
    } else if (
      searchFilteredExercises.length > 0 &&
      !searchFilteredExercises.find(exercise => exercise.id === selectedExerciseId)
    ) {
      setSelectedExerciseId(searchFilteredExercises[0].id);
    }
  }, [searchFilteredExercises, searchQuery, selectedExerciseId, sortedExercises]);

  // Get exercise comparison data
  const exerciseComparison = selectedExerciseId ? getExerciseYearComparison(selectedExerciseId) : null;
  const selectedExercise = exercises.find(e => e.id === selectedExerciseId);

  // Get max chart data
  const maxChartData = selectedExerciseId ? generateChartData(selectedExerciseId) : [];
  const maxChartExercise = selectedExercise;

  // Get sessions, volume and rest days data
  const sessionsPerMonth = selectedExerciseId ? getSessionsPerMonth(selectedExerciseId) : [];
  const volumePerSession = selectedExerciseId ? getVolumePerSession(selectedExerciseId) : [];
  const restDaysBetweenSessions = selectedExerciseId ? getRestDaysBetweenSessions(selectedExerciseId) : [];

  // Get month names for display
  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long' });
  const lastMonthName = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleDateString('en-US', { month: 'long' });
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  // Find max percentage for chart scaling
  const maxThisYearPercentage = Math.max(...thisYearMonthlyData.map(d => d.percentage), 1);
  const maxLastYearPercentage = Math.max(...lastYearMonthlyData.map(d => d.percentage), 1);
  const maxChartPercentage = Math.max(maxThisYearPercentage, maxLastYearPercentage, 100);
  const maxYearlyPercentage = Math.max(...yearlyTrainingData.map(d => d.percentage), 100);

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

      {/* Weekly Activity */}
      <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-solarized-base02">
          <Calendar size={20} className="text-solarized-blue" />
          Last 7 Days
        </h3>
        <div className="space-y-3">
          {weeklyData.map((day, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-16 text-xs text-solarized-base01">
                <div className="font-medium">
                  {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div>
                  {formatShortDate(day.date)}
                </div>
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

      {/* Exercise Chart Selector */}
      <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-solarized-base02">
          <Dumbbell size={20} className="text-solarized-orange" />
          Exercise Charts
        </h3>

        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className="text-solarized-base01" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercises..."
              className="w-full pl-10 pr-4 py-3 border border-solarized-base1 rounded-lg focus:ring-2 focus:ring-solarized-orange focus:border-transparent bg-solarized-base3 text-solarized-base02 placeholder-solarized-base01"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X size={16} className="text-solarized-base01 hover:text-solarized-base02" />
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-solarized-base01 mb-2">
              Exercise
            </label>
            <select
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              disabled={sortedExercises.length === 0}
              className="w-full p-3 border border-solarized-base1 rounded-lg focus:ring-2 focus:ring-solarized-orange focus:border-transparent bg-solarized-base3 text-solarized-base02 disabled:text-solarized-base01 disabled:bg-solarized-base2/60"
            >
              {sortedExercises.length > 0 && (
                <option value="">Choose an exercise...</option>
              )}
              {sortedExercises.length === 0 ? (
                <option value="" disabled>No exercises available</option>
              ) : searchQuery ? (
                searchFilteredExercises.length > 0 ? (
                  searchFilteredExercises.map(exercise => (
                    <option key={exercise.id} value={exercise.id}>
                      {exercise.name} ({categories.find(c => c.value === exercise.category)?.label})
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No exercises found matching "{searchQuery}"</option>
                )
              ) : (
                sortedCategories.map(category => {
                  const categoryExercises = searchFilteredExercises.filter(exercise => exercise.category === category.value);
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
                })
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Exercise Year Comparison */}
      <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-solarized-base02">
          <Activity size={20} className="text-solarized-orange" />
          Exercise Year Comparison
        </h3>

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
                    {formatSingleDecimal(exerciseComparison.currentYear.repsPerDay - exerciseComparison.lastYear.repsPerDay)}
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

      {/* Yearly Training Percentages */}
      <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-solarized-base02">
          <BarChart3 size={20} className="text-solarized-green" />
          Training Days by Year
        </h3>
        {yearlyTrainingData.length > 0 ? (
          <div className="space-y-3">
            {yearlyTrainingData.map((data, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-12 text-sm text-solarized-base01 font-medium">
                  {data.year}
                  {data.isCurrent && <span className="text-xs block text-solarized-blue">current</span>}
                </div>
                <div className="flex-1 bg-solarized-base1/20 rounded-full h-8 relative overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      data.isCurrent ? 'bg-solarized-blue' : 'bg-solarized-green'
                    }`}
                    style={{ width: `${(data.percentage / maxYearlyPercentage) * 100}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-solarized-base02">
                      {data.percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-24 text-xs text-solarized-base01 text-right">
                  {data.workoutDays}/{data.totalDays} days
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-solarized-base01 text-center py-4">No workout data available</p>
        )}
      </div>

      {/* Max over time chart */}
      <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-solarized-base02">
          <LineChart size={20} className="text-solarized-violet" />
          Max Reps Over Time
        </h3>

        {maxChartData.length > 0 && maxChartExercise ? (
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-solarized-base02">{maxChartExercise.name}</h4>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${
                categories.find(c => c.value === maxChartExercise.category)?.color || 'bg-gray-100 text-gray-800 border-gray-200'
              }`}>
                {categories.find(c => c.value === maxChartExercise.category)?.label}
              </span>
              <p className="text-sm text-solarized-base01 mt-2">
                Current Max: <span className="font-bold text-solarized-violet">{maxChartData[maxChartData.length - 1]?.maxReps || 0} reps</span>
              </p>
            </div>

            {/* Area Chart */}
            <div className="relative h-48 bg-solarized-base1/10 rounded-lg p-4 border border-solarized-base1/20">
              <svg className="w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgb(108, 113, 196)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="rgb(108, 113, 196)" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                
                {maxChartData.length > 1 && (() => {
                  const maxReps = Math.max(...maxChartData.map(d => d.maxReps), 1);
                  const minDate = maxChartData[0].date.getTime();
                  const maxDate = maxChartData[maxChartData.length - 1].date.getTime();
                  const dateRange = maxDate - minDate || 1;
                  
                  // Create path for area
                  let pathData = '';
                  maxChartData.forEach((point, index) => {
                    const x = ((point.date.getTime() - minDate) / dateRange) * 400;
                    const y = 160 - ((point.maxReps / maxReps) * 140) - 10;
                    
                    if (index === 0) {
                      pathData += `M ${x} 150 L ${x} ${y}`;
                    } else {
                      pathData += ` L ${x} ${y}`;
                    }
                  });
                  pathData += ` L 400 150 Z`;
                  
                  // Create line path
                  let linePath = '';
                  maxChartData.forEach((point, index) => {
                    const x = ((point.date.getTime() - minDate) / dateRange) * 400;
                    const y = 160 - ((point.maxReps / maxReps) * 140) - 10;
                    
                    if (index === 0) {
                      linePath += `M ${x} ${y}`;
                    } else {
                      linePath += ` L ${x} ${y}`;
                    }
                  });
                  
                  return (
                    <>
                      {/* Area fill */}
                      <path
                        d={pathData}
                        fill="url(#areaGradient)"
                        stroke="none"
                      />
                      
                      {/* Line */}
                      <path
                        d={linePath}
                        fill="none"
                        stroke="rgb(108, 113, 196)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Data points */}
                      {maxChartData.map((point, index) => {
                        const x = ((point.date.getTime() - minDate) / dateRange) * 400;
                        const y = 160 - ((point.maxReps / maxReps) * 140) - 10;
                        
                        return (
                          <circle
                            key={index}
                            cx={x}
                            cy={y}
                            r="4"
                            fill="rgb(108, 113, 196)"
                            stroke="white"
                            strokeWidth="2"
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
              
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-solarized-base01 py-2">
                <span>{Math.max(...maxChartData.map(d => d.maxReps), 1)}</span>
                <span>{Math.round(Math.max(...maxChartData.map(d => d.maxReps), 1) / 2)}</span>
                <span>0</span>
              </div>
              
              {/* X-axis labels */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-solarized-base01 px-4 pb-1">
                <span>{maxChartData[0]?.date.getFullYear()}</span>
                <span>{maxChartData[maxChartData.length - 1]?.date.getFullYear()}</span>
              </div>
            </div>
            
            {/* Progress milestones */}
            <div className="space-y-2">
              <h5 className="font-medium text-solarized-base02">Progress Milestones</h5>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {getMaxRepsOverTime(selectedExerciseId).slice(-5).reverse().map((milestone, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-solarized-violet/10 rounded border border-solarized-violet/20">
                    <span className="text-sm text-solarized-base02">
                      {milestone.date.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <span className="font-bold text-solarized-violet">
                      {milestone.maxReps} reps
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : selectedExerciseId ? (
          <p className="text-solarized-base01 text-center py-8">
            No data available for this exercise in the last 3 years
          </p>
        ) : (
          <p className="text-solarized-base01 text-center py-8">
            Select an exercise to see max reps progression over time
          </p>
        )}
      </div>

      {/* Sessions per Month Chart */}
      <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-solarized-base02">
          <Repeat size={20} className="text-solarized-green" />
          Sessions per Month (Last 4 Months)
        </h3>
        {selectedExerciseId && sessionsPerMonth.length > 0 ? (
          <div className="space-y-3">
            {sessionsPerMonth.map((data, index) => {
              const maxSessions = Math.max(...sessionsPerMonth.map(d => d.count), 1);
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 text-xs text-solarized-base01 font-medium">
                    {data.month}
                  </div>
                  <div className="flex-1 bg-solarized-base1/20 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-solarized-green h-full rounded-full transition-all duration-300"
                      style={{ width: `${(data.count / maxSessions) * 100}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-solarized-base02">
                        {data.count} sessions
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : selectedExerciseId ? (
          <p className="text-solarized-base01 text-center py-8">
            No sessions recorded for this exercise in the last 4 months
          </p>
        ) : (
          <p className="text-solarized-base01 text-center py-8">
            Select an exercise to see sessions per month
          </p>
        )}
      </div>

      {/* Volume per Session Chart */}
      <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-solarized-base02">
          <Clock size={20} className="text-solarized-blue" />
          Volume per Session (Last 4 Months)
        </h3>
        {selectedExerciseId && volumePerSession.length > 0 ? (
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {volumePerSession.map((data, index) => {
              const maxVolume = Math.max(...volumePerSession.map(d => d.volume), 1);
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-16 text-xs text-solarized-base01 font-medium">
                    {formatShortDate(data.date)}
                  </div>
                  <div className="flex-1 bg-solarized-base1/20 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-solarized-blue h-full rounded-full transition-all duration-300"
                      style={{ width: `${(data.volume / maxVolume) * 100}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-solarized-base02">
                        {data.volume} total reps
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : selectedExerciseId ? (
          <p className="text-solarized-base01 text-center py-8">
            No session volume data for the last 4 months
          </p>
        ) : (
          <p className="text-solarized-base01 text-center py-8">
            Select an exercise to see volume per session
          </p>
        )}
      </div>

      {/* Rest Days Between Sessions Chart */}
      <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-solarized-base02">
          <Timer size={20} className="text-solarized-orange" />
          Rest Days Between Sessions (Last 4 Months)
        </h3>
        {selectedExerciseId && restDaysBetweenSessions.length > 0 ? (
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {restDaysBetweenSessions.map((data, index) => {
              const maxDays = Math.max(...restDaysBetweenSessions.map(d => d.days), 1);
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-16 text-xs text-solarized-base01 font-medium">
                    {formatShortDate(data.date)}
                  </div>
                  <div className="flex-1 bg-solarized-base1/20 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-solarized-orange h-full rounded-full transition-all duration-300"
                      style={{ width: `${(data.days / maxDays) * 100}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-solarized-base02">
                        {data.days} {data.days === 1 ? 'day' : 'days'} rest
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : selectedExerciseId && getExerciseSessions(selectedExerciseId).length > 0 ? (
          <p className="text-solarized-base01 text-center py-8">
            Need at least 2 sessions to calculate rest days
          </p>
        ) : selectedExerciseId ? (
          <p className="text-solarized-base01 text-center py-8">
            No session data for the last 4 months
          </p>
        ) : (
          <p className="text-solarized-base01 text-center py-8">
            Select an exercise to see rest days between sessions
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
          <PieChart
            data={categories
              .filter(category => weeklyCategoryStats[category.value] > 0)
              .map(category => ({
                label: category.label,
                value: weeklyCategoryStats[category.value] || 0,
                color: category.bgColor
              }))}
            size={200}
            emptyMessage="No sets completed this week"
          />
        ) : (
          <PieChart data={[]} size={200} emptyMessage="No sets completed this week" />
        )}
      </div>

      {/* Sets per Category - This Month */}
      <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-solarized-base02">
          <Calendar size={20} className="text-solarized-green" />
          Sets per Category - {currentMonthName}
        </h3>
        {Object.keys(monthlyCategoryStats).length > 0 ? (
          <PieChart
            data={categories
              .filter(category => monthlyCategoryStats[category.value] > 0)
              .map(category => ({
                label: category.label,
                value: monthlyCategoryStats[category.value] || 0,
                color: category.bgColor
              }))}
            size={200}
            emptyMessage={`No sets completed in ${currentMonthName}`}
          />
        ) : (
          <PieChart data={[]} size={200} emptyMessage={`No sets completed in ${currentMonthName}`} />
        )}
      </div>

      {/* Sets per Category - Last Month */}
      <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-solarized-base02">
          <Calendar size={20} className="text-solarized-violet" />
          Sets per Category - {lastMonthName}
        </h3>
        {Object.keys(lastMonthlyCategoryStats).length > 0 ? (
          <PieChart
            data={categories
              .filter(category => lastMonthlyCategoryStats[category.value] > 0)
              .map(category => ({
                label: category.label,
                value: lastMonthlyCategoryStats[category.value] || 0,
                color: category.bgColor
              }))}
            size={200}
            emptyMessage={`No sets completed in ${lastMonthName}`}
          />
        ) : (
          <PieChart data={[]} size={200} emptyMessage={`No sets completed in ${lastMonthName}`} />
        )}
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