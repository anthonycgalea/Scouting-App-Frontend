import { useMemo } from 'react';
import { useMantineColorScheme, useMantineTheme, rgba } from '@mantine/core';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';

import { type TeamPerformanceSummary } from '@/types/analytics';


const BAR_SIZE = 18;
const LABEL_FONT_SIZE = 12;
const CATEGORY_GAP = 6;
const MIN_CHART_HEIGHT = 320;
const CHART_MARGIN = {
  top: 20,
  right: 40,
  left: 40,
  bottom: 20,
};

type BarChart2025Props = {
  teams?: TeamPerformanceSummary[];
};

type ChartDatum = TeamPerformanceSummary & {
  teamLabel: string;
};

const tooltipContent = (
  themeColors: {
    background: string;
    border: string;
    text: string;
    label: string;
  },
) =>
  ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const point = payload[0]?.payload as ChartDatum | undefined;

    if (!point) {
      return null;
    }

    const rows: { label: string; value: string }[] = [
      { label: 'Matches played', value: point.matchesPlayed.toString() },
      { label: 'Autonomous avg', value: `${point.autonomousAverage.toFixed(1)} pts` },
      { label: 'Teleop avg', value: `${point.teleopAverage.toFixed(1)} pts` },
      { label: 'Endgame avg', value: `${point.endgameAverage.toFixed(1)} pts` },
      { label: 'Game piece avg', value: point.gamePieceAverage.toFixed(1) },
      { label: 'Total avg', value: `${point.totalAverage.toFixed(1)} pts` },
    ];

    return (
      <div
        style={{
          backgroundColor: themeColors.background,
          border: `1px solid ${themeColors.border}`,
          borderRadius: 8,
          padding: '0.75rem 1rem',
          color: themeColors.text,
          minWidth: 200,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: '0.35rem', color: themeColors.label }}>
          {point.teamName ? `${point.teamName} • Team ${point.teamNumber}` : `Team ${point.teamNumber}`}
        </div>
        <div style={{ display: 'grid', gap: '0.2rem' }}>
          {rows.map((row) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
              <span style={{ color: themeColors.label }}>{row.label}</span>
              <span>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

const sortByTotalDescending = (a: ChartDatum, b: ChartDatum) => b.totalAverage - a.totalAverage;



const BarChart2025 = ({ teams = [] }: BarChart2025Props) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  const cursorFill = useMemo(
    () =>
      colorScheme === 'dark'
        ? rgba(theme.colors.dark[3], 0.45)
        : rgba(theme.colors.gray[3], 0.35),
    [colorScheme, theme]
  );

  const colors = useMemo(() => {
    if (colorScheme === 'dark') {
      return {
        autonomous: theme.colors.blue[4],
        teleop: theme.colors.green[4],
        endgame: theme.colors.grape[4],
        background: theme.colors.dark[6],
        border: theme.colors.dark[4],
        text: theme.colors.gray[1],
        label: theme.colors.gray[3],
      };
    }

    return {
      autonomous: theme.colors.blue[6],
      teleop: theme.colors.green[6],
      endgame: theme.colors.grape[6],
      background: theme.white,
      border: theme.colors.gray[3],
      text: theme.colors.dark[7],
      label: theme.colors.gray[6],
    };
  }, [colorScheme, theme]);

  const data = useMemo<ChartDatum[]>(
    () =>
      teams
        .map<ChartDatum>((team) => ({
          ...team,
          teamLabel: `${team.teamNumber}`,
        }))
        .sort(sortByTotalDescending),
    [teams]
  );

  const chartHeight = useMemo(() => {
    if (data.length === 0) {
      return MIN_CHART_HEIGHT;
    }

    const categoriesHeight = data.length * BAR_SIZE + Math.max(data.length - 1, 0) * CATEGORY_GAP;

    return Math.max(categoriesHeight + CHART_MARGIN.top + CHART_MARGIN.bottom, MIN_CHART_HEIGHT);
  }, [data.length]);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={CHART_MARGIN}
        barCategoryGap={CATEGORY_GAP}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          tick={{ fill: colors.label }}
          label={{
            value: 'Average points per match',
            position: 'insideBottom',
            offset: -10,
            fill: colors.label,
          }}
        />
        <YAxis
          dataKey="teamLabel"
          type="category"
          width={120}
          interval={0}
          tick={{ fill: colors.label, fontSize: LABEL_FONT_SIZE }}
        />
        <Tooltip
          cursor={{ fill: cursorFill }}
          content={tooltipContent({
            background: colors.background,
            border: colors.border,
            text: colors.text,
            label: colors.label,
          })}
        />
        <Legend />
        <Bar
          dataKey="autonomousAverage"
          stackId="a"
          name="Autonomous"
          fill={colors.autonomous}
          barSize={BAR_SIZE}
        />
        <Bar
          dataKey="teleopAverage"
          stackId="a"
          name="Teleop"
          fill={colors.teleop}
          barSize={BAR_SIZE}
        />
        <Bar
          dataKey="endgameAverage"
          stackId="a"
          name="Endgame"
          fill={colors.endgame}
          barSize={BAR_SIZE}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BarChart2025;
