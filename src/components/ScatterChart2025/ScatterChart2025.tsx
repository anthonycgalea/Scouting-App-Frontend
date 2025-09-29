import { type TeamPerformanceSummary } from '@/types/analytics';
import {
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  type LabelProps,
  type TooltipProps,
} from 'recharts';

import classes from './ScatterChart2025.module.css';
export type TeamPerformancePoint = TeamPerformanceSummary;

type ChartPoint = TeamPerformancePoint & {
  teamLabel: string;
  autoEndgameAverage: number;
};

type ScatterChart2025Props = {
  teams?: TeamPerformancePoint[];
  color?: string;
};

type ChartTooltipProps = TooltipProps<number, string>;

const tooltipContent = ({ active, payload }: ChartTooltipProps) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0]?.payload as ChartPoint | undefined;

  if (!point) {
    return null;
  }

  const rows: { label: string; value: string }[] = [
    { label: 'Matches played', value: point.matchesPlayed.toString() },
    { label: 'Autonomous avg', value: `${point.autonomousAverage.toFixed(1)} pts` },
    { label: 'Teleop avg', value: `${point.teleopAverage.toFixed(1)} pts` },
    { label: 'Endgame avg', value: `${point.endgameAverage.toFixed(1)} pts` },
    { label: 'Auto + endgame', value: `${point.autoEndgameAverage.toFixed(1)} pts` },
    { label: 'Game piece avg', value: point.gamePieceAverage.toFixed(1) },
    { label: 'Total avg', value: `${point.totalAverage.toFixed(1)} pts` },
  ];

  return (
    <div
      style={{
        backgroundColor: 'var(--scatter2025-tooltip-bg)',
        border: `1px solid var(--scatter2025-border)`,
        borderRadius: 8,
        padding: '0.75rem 1rem',
        boxShadow: `0 4px 12px var(--scatter2025-tooltip-shadow)`,
        color: 'var(--scatter2025-text)',
        minWidth: 200,
      }}
    >
      <div
        style={{
          color: 'var(--scatter2025-label)',
          fontWeight: 600,
          marginBottom: '0.35rem',
        }}
      >
        {point.teamName ? `${point.teamName} • Team ${point.teamNumber}` : `Team ${point.teamNumber}`}
      </div>
      <div style={{ display: 'grid', gap: '0.2rem' }}>
        {rows.map((row) => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
            <span style={{ color: 'var(--scatter2025-axis)' }}>{row.label}</span>
            <span>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const renderTeamLabel = (props: LabelProps) => {
  const { x, y, value } = props;

  if (typeof x !== 'number' || typeof y !== 'number' || value == null) {
    return null;
  }

  return (
    <text
      x={x + 4}
      y={y + 12}
      textAnchor="middle"
      dominantBaseline="hanging"
      fill="var(--scatter2025-label)"
      fontSize={12}
      className={classes.pointLabel}
    >
      {value}
    </text>
  );
};

export function ScatterChart2025({ teams = [], color }: ScatterChart2025Props) {
  const data = teams.map<ChartPoint>((team) => ({
    teamNumber: team.teamNumber,
    teamLabel: `${team.teamNumber}`,
    teleopAverage: team.teleopAverage,
    autoEndgameAverage: team.autonomousAverage + team.endgameAverage,
    matchesPlayed: team.matchesPlayed,
    autonomousAverage: team.autonomousAverage,
    endgameAverage: team.endgameAverage,
    gamePieceAverage: team.gamePieceAverage,
    totalAverage: team.totalAverage,
    teamName: team.teamName,
  }));

  const pointFill = color ?? 'var(--scatter2025-point)';
  const axisTickStyle = { fill: 'var(--scatter2025-axis)', fontSize: 12 };

  return (
    <div
      className={classes.wrapper}
      role="figure"
      aria-label="Teleop versus auto and endgame averages scatter chart"
    >
      <ResponsiveContainer width="100%" height="100%" className={classes.chart}>
        <ScatterChart margin={{ top: 20, right: 32, bottom: 32, left: 48 }}>
          <CartesianGrid stroke="var(--scatter2025-grid)" strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="teleopAverage"
            name="Teleop average"
            tick={axisTickStyle}
            axisLine={{ stroke: 'var(--scatter2025-axis)' }}
            tickLine={{ stroke: 'var(--scatter2025-axis)' }}
            label={{
              value: 'Teleop average',
              position: 'insideBottom',
              offset: -12,
              fill: 'var(--scatter2025-axis)',
              style: { textAnchor: 'middle' },
              className: classes.axisLabel,
            }}
          />
          <YAxis
            type="number"
            dataKey="autoEndgameAverage"
            name="Auto & endgame average"
            tick={axisTickStyle}
            axisLine={{ stroke: 'var(--scatter2025-axis)' }}
            tickLine={{ stroke: 'var(--scatter2025-axis)' }}
            label={{
              value: 'Auto & endgame average',
              angle: -90,
              position: 'insideLeft',
              offset: -36,
              fill: 'var(--scatter2025-axis)',
              style: { textAnchor: 'middle' },
              className: classes.axisLabel,
            }}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3', stroke: 'var(--scatter2025-axis)' }}
            content={tooltipContent}
          />
          <Scatter name="Teleop vs Auto/Endgame averages" data={data} fill={pointFill}>
            <LabelList dataKey="teamLabel" content={renderTeamLabel} />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
