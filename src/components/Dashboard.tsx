import React from 'react';
import { Calendar, Target, TrendingUp, Percent, Play } from 'lucide-react';
import { Workout, WorkoutStats, Exercise } from '../types';
import { formatDate, isToday, getDaysAgo } from '../utils/dateUtils';

interface DashboardProps {
  workouts: Workout[];
  stats: WorkoutStats;
  onStartWorkout: () => void;
  onUseWorkout: (workout: Workout) => void;
  exercises: Exercise[];
}

export function Dashboard({ workouts, stats, onStartWorkout, onUseWorkout, exercises }: DashboardProps) {
  const todaysWorkout = workouts.find(w => isToday(new Date(w.date)));
  const lastWorkout = workouts[0];
  const lastWorkoutDays = lastWorkout ? getDaysAgo(new Date(lastWorkout.date)) : null;

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

  const weekPercentage = getCurrentWeekPercentage();
  const monthPercentage = getCurrentMonthPercentage();
  const yearPercentage = getCurrentYearPercentage();

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

      {/* Today's Status */}
      <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
        <div className="flex items-center gap-3 mb-4">
          <Calendar size={20} className="text-solarized-blue" />
          <h2 className="text-lg font-semibold text-solarized-base02">Today's Workout</h2>
        </div>
        
        {todaysWorkout ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-solarized-green rounded-full"></div>
              <span className="text-solarized-green font-medium">Completed!</span>
            </div>
            <div className="bg-solarized-green/10 p-3 rounded-lg border border-solarized-green/20">
              <p className="text-sm text-solarized-base02">
                Great job! You completed {todaysWorkout.sets.length} sets today.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-solarized-base01 rounded-full"></div>
              <span className="text-solarized-base01">Not started yet</span>
            </div>
            <button
              onClick={onStartWorkout}
              className="w-full bg-solarized-blue text-solarized-base3 py-3 px-4 rounded-lg font-medium hover:bg-solarized-blue/90 transition-colors shadow-md"
            >
              Start Today's Workout
            </button>
          </div>
        )}
      </div>

      {/* Recent Workouts */}
      <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp size={20} className="text-solarized-blue" />
          <h2 className="text-lg font-semibold text-solarized-base02">Recent Workouts</h2>
        </div>
        
        {/* Filter workouts from last 60 days */}
        {(() => {
          const sixtyDaysAgo = new Date();
          sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
          const recentWorkouts = workouts.filter(workout => 
            new Date(workout.date) >= sixtyDaysAgo
          );

          if (recentWorkouts.length > 0) {
            return (
              <div className="space-y-3">
                {recentWorkouts.map((workout) => {
                  // Group exercises by exerciseId and count sets
                  const exerciseGroups = workout.sets.reduce((groups, set) => {
                    const exerciseId = set.exerciseId;
                    if (!groups[exerciseId]) {
                      groups[exerciseId] = { count: 0, exerciseId };
                    }
                    groups[exerciseId].count++;
                    return groups;
                  }, {} as Record<string, { count: number; exerciseId: string }>);

                  const groupedExercises = Object.values(exerciseGroups);

                  return (
                    <div key={workout.id} className="bg-solarized-base1/10 rounded-lg p-4 border border-solarized-base1/20">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-solarized-base02">
                            {formatDate(new Date(workout.date))}
                          </p>
                          <p className="text-sm text-solarized-base01">
                            {workout.sets.length} sets completed
                          </p>
                        </div>
                        <button
                          onClick={() => onUseWorkout(workout)}
                          className="p-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors shadow-md"
                          title="Recreate this workout"
                        >
                          <Play size={16} />
                        </button>
                      </div>
                      <div className="space-y-1">
                        {groupedExercises.map((group, index) => {
                          const exerciseName = exercises.find(ex => ex.id === group.exerciseId)?.name || 'Unknown Exercise';
                          return (
                            <div key={index} className="text-sm text-solarized-base01">
                              {exerciseName} - {group.count} {group.count === 1 ? 'set' : 'sets'}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          } else {
            return (
              <div className="text-center py-8">
                <p className="text-solarized-base01 mb-4">No workouts in the last 60 days</p>
                <button
                  onClick={onStartWorkout}
                  className="bg-solarized-blue text-solarized-base3 py-2 px-4 rounded-lg font-medium hover:bg-solarized-blue/90 transition-colors shadow-md"
                >
                  Start Your First Workout
                </button>
              </div>
            );
          }
        })()}
      </div>

      {/* Last Workout Info */}
      {lastWorkout && lastWorkoutDays !== null && (
        <div className="bg-solarized-blue/10 p-4 rounded-xl border border-solarized-blue/20">
          <p className="text-sm text-solarized-base02">
            Last workout was {lastWorkoutDays === 0 ? 'today' : 
                            lastWorkoutDays === 1 ? 'yesterday' : 
                            `${lastWorkoutDays} days ago`}
          </p>
        </div>
      )}
    </div>
  );
}