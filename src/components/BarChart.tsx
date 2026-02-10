import React, { useState, useMemo } from 'react';

type TrendDirection = 'improving' | 'declining' | 'stable' | 'insufficient';

interface TrendData {
  direction: TrendDirection;
  percentageChange: number;
  recentMedian: number;
  pastMedian: number;
}

interface BarChartData {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  workoutCount: number;
  pattern: 'Stable' | 'Variable' | 'Irregular';
  range: string;
  trendData?: TrendData;
}

interface BarChartProps {
  data: BarChartData[];
  emptyMessage?: string;
  title?: string;
  showTrendLegend?: boolean;
}

export function BarChart({ data, emptyMessage = 'No data', title, showTrendLegend = true }: BarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getTrendDisplay = (trendData?: TrendData) => {
    if (!trendData) return null;
    
    const { direction, percentageChange } = trendData;
    
    if (direction === 'insufficient') {
      return (
        <span className="text-xs text-solarized-base01 ml-2">Insufficient data</span>
      );
    }
    
    let icon: React.ReactNode;
    let colorClass: string;
    
    switch (direction) {
      case 'improving':
        icon = <span className="text-sm">↗</span>;
        colorClass = 'text-solarized-green';
        break;
      case 'declining':
        icon = <span className="text-sm">↘</span>;
        colorClass = 'text-solarized-red';
        break;
      case 'stable':
      default:
        icon = <span className="text-sm">—</span>;
        colorClass = 'text-solarized-blue';
        break;
    }
    
    const sign = percentageChange >= 0 ? '+' : '';
    
    return (
      <span className={`text-xs font-medium ml-2 ${colorClass}`}>
        {icon} {sign}{percentageChange}%
      </span>
    );
  };

  const getTrendLegend = () => {
    if (!showTrendLegend) return null;
    
    return (
      <div className="mt-4 pt-3 border-t border-solarized-base1/20">
        <p className="text-xs text-solarized-base01 mb-2">Trend indicators (last 6 weeks vs previous 6 weeks):</p>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-1 text-solarized-green">
            <span>↗</span> Improving (more frequent)
          </span>
          <span className="flex items-center gap-1 text-solarized-red">
            <span>↘</span> Declining (less frequent)
          </span>
          <span className="flex items-center gap-1 text-solarized-blue">
            <span>—</span> Stable
          </span>
        </div>
      </div>
    );
  };

  // Safely process data with error handling
  const validData = useMemo(() => {
    try {
      if (!Array.isArray(data)) {
        return [];
      }
      return data.filter(item => {
        if (!item || typeof item !== 'object') return false;
        return typeof item.workoutCount === 'number' && item.workoutCount > 0;
      });
    } catch (error) {
      console.error('Error processing BarChart data:', error);
      return [];
    }
  }, [data]);

  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center bg-solarized-base1/10 rounded-lg p-8">
        <span className="text-sm text-solarized-base01 text-center">
          {emptyMessage}
        </span>
      </div>
    );
  }

  const getPatternColor = (pattern: string) => {
    switch (pattern) {
      case 'Stable':
        return 'text-solarized-green bg-solarized-green/10 border-solarized-green/20';
      case 'Variable':
        return 'text-solarized-yellow bg-solarized-yellow/10 border-solarized-yellow/20';
      case 'Irregular':
        return 'text-solarized-red bg-solarized-red/10 border-solarized-red/20';
      default:
        return 'text-solarized-base01 bg-solarized-base1/10 border-solarized-base1/20';
    }
  };

  // Safely calculate max value for bar widths
  const safeMaxValue = useMemo(() => {
    try {
      const max = Math.max(...validData.map(item => item.maxValue || 1), 1);
      return max > 0 ? max : 1;
    } catch (error) {
      return 1;
    }
  }, [validData]);

  return (
    <div className="space-y-4">
      {title && (
        <h4 className="text-md font-semibold text-solarized-base02 mb-3">{title}</h4>
      )}
      {validData.map((item, index) => {
        try {
          const value = typeof item.value === 'number' ? item.value : 0;
          const maxValue = typeof item.maxValue === 'number' && item.maxValue > 0 ? item.maxValue : safeMaxValue;
          const barWidth = Math.min((value / maxValue) * 100, 100);
          const isHovered = hoveredIndex === index;
          const workoutCount = typeof item.workoutCount === 'number' ? item.workoutCount : 0;
          const label = item.label || 'Unknown';
          const pattern = item.pattern || 'Stable';
          const range = item.range || 'N/A';
          const color = item.color || '#93a1a1';

          return (
            <div
              key={index}
              className={`transition-all duration-200 ${isHovered ? 'bg-solarized-base1/30' : ''}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex items-start justify-between mb-1">
                <div>
                  <span className="font-medium text-solarized-base02">{label}</span>
                  <span className="text-sm text-solarized-base01 ml-2">
                    ({workoutCount} {workoutCount === 1 ? 'workout' : 'workouts'})
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getPatternColor(pattern)}`}>
                  {pattern}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-solarized-base1/20 rounded-lg h-6 relative overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-300 hover:opacity-80"
                    style={{ 
                      width: `${barWidth}%`,
                      backgroundColor: color
                    }}
                  />
                  <div className="absolute inset-0 flex items-center">
                    <span className="text-xs font-medium text-solarized-base02 ml-2">
                      {value} days median
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-solarized-base01 mt-1 flex items-center">
                Range: {range}
                {getTrendDisplay(item.trendData)}
              </div>
            </div>
          );
        } catch (itemError) {
          console.error(`Error rendering BarChart item at index ${index}:`, itemError);
          return null;
        }
      })}
      {getTrendLegend()}
    </div>
  );
}
