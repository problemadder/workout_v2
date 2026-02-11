import React from 'react';
import { ArrowRight, TrendingUp, TrendingDown, Minus, Calendar, Activity } from 'lucide-react';
import { YearComparisonData } from '../hooks/useExerciseConsistencyData';

interface ExerciseConsistencyComparisonProps {
  data: YearComparisonData | null;
}

const patternColors: Record<string, { bg: string; text: string; border: string }> = {
  'Stable': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  'Variable': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  'Irregular': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' }
};

export function ExerciseConsistencyComparison({
  data
}: ExerciseConsistencyComparisonProps) {
  if (!data) return null;

  const { currentYear, lastYear, workoutChange, restDaysChange, isImproved } = data;

  const currentPatternStyle = patternColors[currentYear.pattern] || patternColors['Stable'];
  const lastPatternStyle = patternColors[lastYear.pattern] || patternColors['Stable'];

  const hasCurrentData = currentYear.workoutCount > 0;
  const hasLastData = lastYear.workoutCount > 0;

  return (
    <div className="space-y-6">
      <h4 className="text-sm font-medium text-solarized-base02 flex items-center gap-2">
        <Calendar size={16} className="text-solarized-blue" />
        Year-over-Year Comparison
      </h4>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-2 gap-4">
        {/* Current Year */}
        <div className="bg-solarized-blue/10 p-4 rounded-lg border border-solarized-blue/20">
          <h5 className="font-semibold text-solarized-blue mb-3 text-sm">
            {currentYear.year}
          </h5>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-solarized-base01">Workouts</span>
              <span className="font-medium text-solarized-base02">
                {hasCurrentData ? currentYear.workoutCount : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-solarized-base01">Median Rest</span>
              <span className="font-medium text-solarized-base02">
                {hasCurrentData && currentYear.medianRestDays > 0
                  ? `${currentYear.medianRestDays} days`
                  : 'N/A'
                }
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-solarized-base01">Pattern</span>
              {hasCurrentData ? (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${currentPatternStyle.bg} ${currentPatternStyle.text} ${currentPatternStyle.border}`}>
                  {currentYear.pattern}
                </span>
              ) : (
                <span className="text-xs text-solarized-base01">N/A</span>
              )}
            </div>
          </div>
        </div>

        {/* Last Year */}
        <div className="bg-solarized-violet/10 p-4 rounded-lg border border-solarized-violet/20">
          <h5 className="font-semibold text-solarized-violet mb-3 text-sm">
            {lastYear.year}
          </h5>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-solarized-base01">Workouts</span>
              <span className="font-medium text-solarized-base02">
                {hasLastData ? lastYear.workoutCount : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-solarized-base01">Median Rest</span>
              <span className="font-medium text-solarized-base02">
                {hasLastData && lastYear.medianRestDays > 0
                  ? `${lastYear.medianRestDays} days`
                  : 'N/A'
                }
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-solarized-base01">Pattern</span>
              {hasLastData ? (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${lastPatternStyle.bg} ${lastPatternStyle.text} ${lastPatternStyle.border}`}>
                  {lastYear.pattern}
                </span>
              ) : (
                <span className="text-xs text-solarized-base01">N/A</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Changes Summary */}
      {(hasCurrentData || hasLastData) && (
        <div className={`p-4 rounded-lg border ${
          isImproved
            ? 'bg-green-50 border-green-200'
            : workoutChange === 0 && restDaysChange === 0
              ? 'bg-solarized-base1/30 border-solarized-base1'
              : 'bg-red-50 border-red-200'
        }`}>
          <h5 className={`font-semibold mb-3 text-sm flex items-center gap-2 ${
            isImproved ? 'text-green-700' : workoutChange === 0 && restDaysChange === 0 ? 'text-solarized-base01' : 'text-red-700'
          }`}>
            <Activity size={16} />
            Changes
          </h5>
          <div className="space-y-2 text-sm">
            {/* Workout Change */}
            <div className="flex items-center gap-2">
              {workoutChange > 0 ? (
                <TrendingUp size={16} className="text-green-600" />
              ) : workoutChange < 0 ? (
                <TrendingDown size={16} className="text-red-600" />
              ) : (
                <Minus size={16} className="text-solarized-base01" />
              )}
              <span className="text-solarized-base01">Workouts:</span>
              <span className={`font-medium ${
                workoutChange > 0 ? 'text-green-600' : workoutChange < 0 ? 'text-red-600' : 'text-solarized-base01'
              }`}>
                {workoutChange > 0 ? '+' : ''}{workoutChange}
              </span>
              {workoutChange !== 0 && (
                <ArrowRight size={14} className="text-solarized-base01" />
              )}
              {workoutChange > 0 ? (
                <span className="text-xs text-green-600">More frequent</span>
              ) : workoutChange < 0 ? (
                <span className="text-xs text-red-600">Less frequent</span>
              ) : null}
            </div>

            {/* Rest Days Change */}
            <div className="flex items-center gap-2">
              {restDaysChange > 0 ? (
                <TrendingUp size={16} className="text-green-600" />
              ) : restDaysChange < 0 ? (
                <TrendingDown size={16} className="text-red-600" />
              ) : (
                <Minus size={16} className="text-solarized-base01" />
              )}
              <span className="text-solarized-base01">Rest Days:</span>
              <span className={`font-medium ${
                restDaysChange > 0 ? 'text-green-600' : restDaysChange < 0 ? 'text-red-600' : 'text-solarized-base01'
              }`}>
                {restDaysChange > 0 ? '+' : ''}{restDaysChange} days
              </span>
              {restDaysChange !== 0 && (
                <ArrowRight size={14} className="text-solarized-base01" />
              )}
              {restDaysChange > 0 ? (
                <span className="text-xs text-green-600">Improved</span>
              ) : restDaysChange < 0 ? (
                <span className="text-xs text-red-600">Declined</span>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* No data message */}
      {!hasCurrentData && !hasLastData && (
        <div className="text-center py-4 text-solarized-base01 text-sm">
          No data available for comparison
        </div>
      )}
    </div>
  );
}
