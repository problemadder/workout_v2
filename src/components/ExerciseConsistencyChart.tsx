import React from 'react';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { PeriodType, ConsistencyData, TrendDirection } from '../hooks/useExerciseConsistencyData';

interface ExerciseConsistencyChartProps {
  data: ConsistencyData | null;
  period: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
}

const periodLabels: Record<PeriodType, string> = {
  '4months': '4 Months',
  'currentYear': 'Current Year',
  'lastYear': 'Last Year'
};

const patternColors: Record<string, { bg: string; text: string; border: string }> = {
  'Stable': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  'Variable': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  'Irregular': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' }
};

const trendConfig: Record<TrendDirection, { icon: React.ReactNode; label: string; color: string }> = {
  'improving': {
    icon: <TrendingUp size={16} />,
    label: 'Improving',
    color: 'text-green-600'
  },
  'declining': {
    icon: <TrendingDown size={16} />,
    label: 'Declining',
    color: 'text-red-600'
  },
  'stable': {
    icon: <Minus size={16} />,
    label: 'Stable',
    color: 'text-solarized-base01'
  },
  'insufficient': {
    icon: <Activity size={16} />,
    label: 'Insufficient Data',
    color: 'text-solarized-base01'
  }
};

export function ExerciseConsistencyChart({
  data,
  period,
  onPeriodChange
}: ExerciseConsistencyChartProps) {
  if (!data) return null;

  const { medianRestDays, workoutCount, pattern, restDaysDistribution, trend } = data;

  // Convert distribution map to sorted array for histogram
  const distributionEntries = Array.from(restDaysDistribution.entries())
    .sort((a, b) => a[0] - b[0]);

  const maxDistribution = distributionEntries.length > 0
    ? Math.max(...distributionEntries.map(([, count]) => count))
    : 1;

  const patternStyle = patternColors[pattern] || patternColors['Stable'];

  return (
    <div className="space-y-6">
      {/* Period Tabs */}
      <div className="flex rounded-lg bg-solarized-base1/30 p-1 gap-2 overflow-x-auto">
        {(Object.keys(periodLabels) as PeriodType[]).map((p) => (
          <button
            key={p}
            onClick={() => onPeriodChange(p)}
            className={`flex-none sm:flex-1 min-w-[120px] shrink-0 py-2 px-3 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              period === p
                ? 'bg-solarized-base3 text-solarized-blue shadow-sm'
                : 'text-solarized-base01 hover:text-solarized-base02'
            }`}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-solarized-base3 p-4 rounded-lg border border-solarized-base1">
          <div className="text-xs text-solarized-base01 mb-1">Median Rest Days</div>
          <div className="text-2xl font-bold text-solarized-base02">
            {medianRestDays > 0 ? medianRestDays : 'N/A'}
          </div>
        </div>
        <div className="bg-solarized-base3 p-4 rounded-lg border border-solarized-base1">
          <div className="text-xs text-solarized-base01 mb-1">Total Workouts</div>
          <div className="text-2xl font-bold text-solarized-base02">{workoutCount}</div>
        </div>
      </div>

      {/* Pattern and Trend */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <div
          className={`px-3 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap ${patternStyle.bg} ${patternStyle.text} ${patternStyle.border}`}
          title={`${pattern} consistency pattern`}
        >
          {pattern}
        </div>

        {trend && period === '4months' && (
          <div
            className={`flex items-center gap-1.5 text-sm font-medium min-w-[120px] whitespace-nowrap ${trendConfig[trend.direction].color}`}
            title={
              trend.direction === 'insufficient'
                ? trendConfig[trend.direction].label
                : `${trend.percentageChange >= 0 ? '+' : ''}${trend.percentageChange}% (${trendConfig[trend.direction].label})`
            }
          >
            {trendConfig[trend.direction].icon}
            <span>
              {trend.direction === 'insufficient'
                ? trendConfig[trend.direction].label
                : `${trend.percentageChange >= 0 ? '+' : ''}${trend.percentageChange}% (${trendConfig[trend.direction].label})`
              }
            </span>
          </div>
        )}
      </div>

      {/* Rest Days Distribution Histogram */}
      {distributionEntries.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-solarized-base02">
            Rest Days Distribution
          </h4>
          <div className="overflow-x-auto">
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 min-w-[300px]">
              {distributionEntries.map(([days, count]) => {
                const percentage = (count / maxDistribution) * 100;
                const label = `${days} ${days === 1 ? 'day' : 'days'}: ${count} ${count === 1 ? 'time' : 'times'}`;
                return (
                  <div key={days} className="flex items-center gap-3">
                    <div className="w-16 text-xs text-solarized-base01 font-medium">
                      {days} {days === 1 ? 'day' : 'days'}
                    </div>
                    <div
                      className="flex-1 bg-solarized-base1/20 rounded-full h-6 relative overflow-hidden"
                      title={label}
                    >
                      <div
                        className="bg-solarized-orange h-full rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-solarized-base02">
                          {count} {count === 1 ? 'time' : 'times'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {data.restDaysData.length > 0 && (
        <div className="bg-solarized-base1/20 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-solarized-base02 mb-3">
            Rest Days Summary
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-solarized-base01 mb-1">Minimum</div>
              <div className="text-lg font-semibold text-solarized-base02">
                {data.minRestDays} {data.minRestDays === 1 ? 'day' : 'days'}
              </div>
            </div>
            <div>
              <div className="text-xs text-solarized-base01 mb-1">Median</div>
              <div className="text-lg font-semibold text-solarized-base02">
                {medianRestDays} {medianRestDays === 1 ? 'day' : 'days'}
              </div>
            </div>
            <div>
              <div className="text-xs text-solarized-base01 mb-1">Maximum</div>
              <div className="text-lg font-semibold text-solarized-base02">
                {data.maxRestDays} {data.maxRestDays === 1 ? 'day' : 'days'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
