import { ScatterChart } from '@mantine/charts';
import type {
  ScatterChartProps,
  ScatterChartTooltipPayload,
} from '@mantine/charts';

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
  color?: ScatterChartProps['data'][number]['color'];
};

const tooltipProps = {
  labelFormatter: (_label: unknown, payload: ScatterChartTooltipPayload<ChartPoint>[]) => {
    const point = payload?.[0]?.payload;
    return point ? `Team ${point.teamNumber}` : '';
  },
  formatter: (_value: unknown, name: string, entry: ScatterChartTooltipPayload<ChartPoint>) => {
    const point = entry?.payload;
    if (!point) {
      return ['', name];
    }

    if (name === 'teleopAverage') {
      return [`${point.teleopAverage.toFixed(1)} pts`, 'Teleop avg'];
    }

    if (name === 'autoEndgameAverage') {
      return [`${point.autoEndgameAverage.toFixed(1)} pts`, 'Auto & endgame avg'];
    }

    const fallbackValue = point[name as keyof ChartPoint];

    return [
      typeof fallbackValue === 'number'
        ? fallbackValue.toString()
        : (fallbackValue as string | undefined) ?? '',
      name,
    ];
  },
} satisfies NonNullable<ScatterChartProps<ChartPoint>['tooltipProps']>;

export function ScatterChart2025({ teams = DEFAULT_TEAMS, color }: ScatterChart2025Props) {
  const series = [
    {
      name: 'Teleop vs Auto/Endgame averages',
      color: color ?? 'blue.5',
      data: teams.map<ChartPoint>((team) => ({
        teamNumber: team.teamNumber,
        teamLabel: `#${team.teamNumber}`,
        teleopAverage: team.teleopAverage,
        autoEndgameAverage: team.autoEndgameAverage,
      })),
    },
  ] satisfies ScatterChartProps['data'];

  return (
    <ScatterChart
      h={350}
      data={series}
      dataKey={{ x: 'teleopAverage', y: 'autoEndgameAverage' }}
      xAxisLabel="Teleop average"
      yAxisLabel="Auto & endgame average"
      pointLabels="teamLabel"
      tooltipProps={tooltipProps}
    />
  );
}
