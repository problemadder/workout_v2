import React, { useState, useMemo } from 'react';

interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
  emptyMessage?: string;
}

export function PieChart({ data, size = 200, emptyMessage = 'No data' }: PieChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  const { total, validData } = useMemo(() => {
    const filtered = data.filter(item => item.value > 0);
    const sum = filtered.reduce((acc, item) => acc + item.value, 0);
    return { total: sum, validData: filtered };
  }, [data]);

  const chartData = useMemo(() => {
    if (total === 0) return [];
    
    return validData.map(item => ({
      ...item,
      percentage: (item.value / total) * 100
    }));
  }, [validData, total]);

  const segments = useMemo(() => {
    if (total === 0 || chartData.length === 0) return [];

    let currentAngle = -90; // Start from top
    const center = size / 2;
    const radius = (size / 2) - 10;
    const innerRadius = radius * 0.5; // Donut hole size

    return chartData.map((item, index) => {
      const angle = (item.value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      // Calculate path for donut segment
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);
      
      const x3 = center + innerRadius * Math.cos(endRad);
      const y3 = center + innerRadius * Math.sin(endRad);
      const x4 = center + innerRadius * Math.cos(startRad);
      const y4 = center + innerRadius * Math.sin(startRad);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const path = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
        'Z'
      ].join(' ');

      currentAngle += angle;

      return {
        path,
        item,
        index,
        startAngle,
        endAngle,
        midAngle: startAngle + angle / 2
      };
    });
  }, [chartData, total, size]);

  const handleMouseEnter = (index: number, e: React.MouseEvent) => {
    setHoveredIndex(index);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (hoveredIndex !== null) {
      setTooltipPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setTooltipPosition(null);
  };

  if (total === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-solarized-base1/10 rounded-full"
        style={{ width: size, height: size }}
      >
        <span className="text-sm text-solarized-base01 text-center px-4">
          {emptyMessage}
        </span>
      </div>
    );
  }

  const center = size / 2;

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="cursor-pointer"
        role="img"
        aria-label={`Pie chart showing ${chartData.length} categories`}
      >
        {segments.map((segment, index) => {
          const isHovered = hoveredIndex === index;
          const scale = isHovered ? 1.05 : 1;
          
          // Calculate translation for hover effect
          const midRad = (segment.midAngle * Math.PI) / 180;
          const translateX = isHovered ? Math.cos(midRad) * 3 : 0;
          const translateY = isHovered ? Math.sin(midRad) * 3 : 0;

          return (
            <path
              key={index}
              d={segment.path}
              fill={segment.item.color}
              stroke="#fdf6e3"
              strokeWidth="2"
              transform={`translate(${translateX}, ${translateY}) scale(${scale})`}
              style={{ transformOrigin: `${center}px ${center}px` }}
              onMouseEnter={(e) => handleMouseEnter(index, e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="transition-all duration-200"
            />
          );
        })}
        
        {/* Center text showing total */}
        <text
          x={center}
          y={center - 5}
          textAnchor="middle"
          className="fill-solarized-base02 text-sm font-semibold"
          style={{ fontSize: '14px' }}
        >
          {total}
        </text>
        <text
          x={center}
          y={center + 12}
          textAnchor="middle"
          className="fill-solarized-base01 text-xs"
          style={{ fontSize: '10px' }}
        >
          sets
        </text>
      </svg>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 w-full max-w-xs">
        {chartData.map((item, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 text-sm cursor-pointer transition-opacity duration-200 ${
              hoveredIndex !== null && hoveredIndex !== index ? 'opacity-40' : 'opacity-100'
            }`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="truncate text-solarized-base02">{item.label}</span>
            <span className="text-solarized-base01 whitespace-nowrap ml-auto">
              {Math.round(item.percentage)}%
            </span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {hoveredIndex !== null && tooltipPosition && (
        <div
          className="fixed z-50 px-3 py-2 bg-solarized-base02 text-solarized-base3 rounded-lg shadow-lg text-sm pointer-events-none"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 40
          }}
        >
          <div className="font-medium">{chartData[hoveredIndex].label}</div>
          <div className="text-solarized-base1">
            {chartData[hoveredIndex].value} sets ({Math.round(chartData[hoveredIndex].percentage)}%)
          </div>
        </div>
      )}
    </div>
  );
}
