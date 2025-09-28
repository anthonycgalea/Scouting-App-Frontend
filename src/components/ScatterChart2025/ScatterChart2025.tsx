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

export type TeamPerformancePoint = {
  teamNumber: number;
  teleopAverage: number;
  autoEndgameAverage: number;
};

export const DEFAULT_TEAMS: TeamPerformancePoint[] = [
  { teamNumber: 67, teleopAverage: 78, autoEndgameAverage: 82 },
  { teamNumber: 118, teleopAverage: 92, autoEndgameAverage: 88 },
  { teamNumber: 148, teleopAverage: 84, autoEndgameAverage: 73 },
  { teamNumber: 1678, teleopAverage: 87, autoEndgameAverage: 94 },
  { teamNumber: 2056, teleopAverage: 95, autoEndgameAverage: 97 },
  { teamNumber: 2910, teleopAverage: 72, autoEndgameAverage: 68 },
  { teamNumber: 4414, teleopAverage: 81, autoEndgameAverage: 79 },
  { teamNumber: 6328, teleopAverage: 76, autoEndgameAverage: 83 },
  { teamNumber: 7461, teleopAverage: 69, autoEndgameAverage: 64 },
  { teamNumber: 971, teleopAverage: 88, autoEndgameAverage: 86 },
];

type ChartPoint = {
  teamNumber: number;
  teamLabel: string;
  teleopAverage: number;
  autoEndgameAverage: number;
};

type ScatterChart2025Props = {
  teams?: TeamPerformancePoint[];
  color?: string;
};

type ChartTooltipProps = TooltipProps<number, string>;

const tooltipLabelFormatter: NonNullable<ChartTooltipProps['labelFormatter']> = (
  _label,
  payload,
) => {
  const point = payload?.[0]?.payload as ChartPoint | undefined;
  return point ? `Team ${point.teamNumber}` : '';
};

const tooltipFormatter: NonNullable<ChartTooltipProps['formatter']> = (
  value,
  name,
  item,
) => {
  const point = (item?.payload ?? {}) as ChartPoint;

  if (name === 'teleopAverage') {
    return [`${point.teleopAverage.toFixed(1)} pts`, 'Teleop avg'];
  }

  if (name === 'autoEndgameAverage') {
    return [`${point.autoEndgameAverage.toFixed(1)} pts`, 'Auto & endgame avg'];
  }

  return [value, name];
};

const renderTeamLabel = (props: LabelProps) => {
  const { x, y, value } = props;

  if (typeof x !== 'number' || typeof y !== 'number' || value == null) {
    return null;
  }

  return (
    <text
      x={x}
      y={y + 14}
      textAnchor="middle"
      fill="var(--scatter2025-label)"
      fontSize={12}
      className={classes.pointLabel}
    >
      {value}
    </text>
  );
};

export function ScatterChart2025({ teams = DEFAULT_TEAMS, color }: ScatterChart2025Props) {
  const data = teams.map<ChartPoint>((team) => ({
    teamNumber: team.teamNumber,
    teamLabel: `#${team.teamNumber}`,
    teleopAverage: team.teleopAverage,
    autoEndgameAverage: team.autoEndgameAverage,
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
        <ScatterChart margin={{ top: 20, right: 32, bottom: 48, left: 48 }}>
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
              position: 'insideBottomRight',
              offset: -10,
              fill: 'var(--scatter2025-axis)',
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
              fill: 'var(--scatter2025-axis)',
            }}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3', stroke: 'var(--scatter2025-axis)' }}
            labelFormatter={tooltipLabelFormatter}
            formatter={tooltipFormatter}
            contentStyle={{
              backgroundColor: 'var(--scatter2025-tooltip-bg)',
              borderColor: 'var(--scatter2025-border)',
              color: 'var(--scatter2025-text)',
              boxShadow: `0 4px 12px var(--scatter2025-tooltip-shadow)`,
            }}
            itemStyle={{ color: 'var(--scatter2025-text)', fontSize: 12 }}
            labelStyle={{ color: 'var(--scatter2025-label)', fontWeight: 600 }}
          />
          <Scatter name="Teleop vs Auto/Endgame averages" data={data} fill={pointFill}>
            <LabelList dataKey="teamLabel" content={renderTeamLabel} />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
