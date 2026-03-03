import { useMemo } from 'react';
import type { VitalsHistory } from '../../types';
import './BloodPressureChart.scss';

interface BloodPressureChartProps {
  data: VitalsHistory[];
}

const formatTimestamp = (ts: string) => {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts; // Already formatted or invalid — return as-is
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

export const BloodPressureChart = ({ data }: BloodPressureChartProps) => {
  const chartConfig = useMemo(() => {
    const minValue = Math.min(...data.map(d => d.diastolic)) - 10;
    const maxValue = Math.max(...data.map(d => d.systolic)) + 10;
    const range = maxValue - minValue;

    return {
      minValue,
      maxValue,
      range,
      width: 100,
      height: 80,
    };
  }, [data]);

  const getY = (value: number) => {
    const normalized = (value - chartConfig.minValue) / chartConfig.range;
    return chartConfig.height - (normalized * chartConfig.height);
  };

  const getX = (index: number) => {
    return (index / (data.length - 1)) * chartConfig.width;
  };

  const systolicPath = data.map((point, index) => {
    const x = getX(index);
    const y = getY(point.systolic);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const diastolicPath = data.map((point, index) => {
    const x = getX(index);
    const y = getY(point.diastolic);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const yAxisLabels = [chartConfig.maxValue, Math.round((chartConfig.maxValue + chartConfig.minValue) / 2), chartConfig.minValue];

  return (
    <div className="bp-chart">
      <div className="bp-chart__y-axis">
        {yAxisLabels.map((label) => (
          <span key={label} className="bp-chart__y-label">{label}</span>
        ))}
      </div>
      <div className="bp-chart__container">
        <svg
          viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`}
          preserveAspectRatio="none"
          className="bp-chart__svg"
        >
          {/* Grid lines */}
          {yAxisLabels.map((label) => (
            <line
              key={label}
              x1="0"
              y1={getY(label)}
              x2={chartConfig.width}
              y2={getY(label)}
              className="bp-chart__grid-line"
            />
          ))}

          {/* Systolic line */}
          <path
            d={systolicPath}
            className="bp-chart__line bp-chart__line--systolic"
            fill="none"
          />

          {/* Diastolic line */}
          <path
            d={diastolicPath}
            className="bp-chart__line bp-chart__line--diastolic"
            fill="none"
          />

          {/* Data points */}
          {data.map((point, index) => (
            <g key={index}>
              <circle
                cx={getX(index)}
                cy={getY(point.systolic)}
                r="2"
                className="bp-chart__point bp-chart__point--systolic"
              />
              <circle
                cx={getX(index)}
                cy={getY(point.diastolic)}
                r="2"
                className="bp-chart__point bp-chart__point--diastolic"
              />
            </g>
          ))}
        </svg>
        <div className="bp-chart__x-axis">
          {data.map((point, index) => (
            <span key={index} className="bp-chart__x-label">{formatTimestamp(point.timestamp)}</span>
          ))}
        </div>
      </div>
    </div>
  );
};
