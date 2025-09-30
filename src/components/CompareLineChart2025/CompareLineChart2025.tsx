import { useMemo, useState } from 'react';
import {
  Card,
  Group,
  MultiSelect,
  Select,
  Stack,
  Text,
  Title,
  rem,
  useMantineColorScheme,
  useMantineTheme,
  rgba,
} from '@mantine/core';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';

const MAX_TEAMS = 5;
const MATCHES = Array.from({ length: 15 }, (_, index) => index + 1);

type TeamId = keyof typeof TEAM_SERIES;

type ChartPoint = {
  match: number;
  [teamId: TeamId]: number | null;
};

type CustomTooltipPayload = {
  color?: string;
  dataKey?: string;
  value?: number;
};

const TEAM_SERIES = {
  '1678': {
    name: 'Citrus Circuits',
    location: 'Davis, CA',
    values: [
      2.6, 2.7, 2.8, 2.9, 3.0, 3.1, 3.3, 3.5, 3.6, 3.7, 3.8, 3.9, 4.0, 4.1, 4.2,
    ],
  },
  '2056': {
    name: 'OP Robotics',
    location: 'Stoney Creek, ON',
    values: [
      3.1, 3.2, 3.4, 3.7, 4.0, 4.2, 4.3, 4.4, 4.6, 4.8, 5.0, 5.1, 5.2, 5.3, 5.4,
    ],
  },
  '254': {
    name: 'The Cheesy Poofs',
    location: 'San Jose, CA',
    values: [
      2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.0, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8,
    ],
  },
  '118': {
    name: 'Robonauts',
    location: 'League City, TX',
    values: [
      1.8, 1.9, 2.0, 2.1, 2.1, 2.2, 2.3, 2.4, 2.5, 2.5, 2.6, 2.7, 2.8, 2.9, 3.0,
    ],
  },
  '148': {
    name: 'Robowranglers',
    location: 'Greenville, TX',
    values: [
      2.0, 2.1, 2.1, 2.2, 2.3, 2.4, 2.5, 2.5, 2.6, 2.7, 2.8, 2.8, 2.9, 3.0, 3.1,
    ],
  },
} satisfies Record<
  string,
  {
    name: string;
    location: string;
    values: number[];
  }
>;

const METRIC_OPTIONS = [
  { value: 'total-epa', label: 'Total EPA' },
  { value: 'auto-epa', label: 'Autonomous EPA (coming soon)', disabled: true },
  { value: 'teleop-epa', label: 'Teleop EPA (coming soon)', disabled: true },
];

const getPalette = (colorScheme: 'dark' | 'light', theme: ReturnType<typeof useMantineTheme>) => {
  if (colorScheme === 'dark') {
    return [
      theme.colors.blue[4],
      theme.colors.orange[4],
      theme.colors.teal[3],
      theme.colors.red[4],
      theme.colors.grape[4],
    ];
  }

  return [
    theme.colors.blue[6],
    theme.colors.orange[5],
    theme.colors.teal[6],
    theme.colors.red[6],
    theme.colors.grape[5],
  ];
};

const buildChartData = (selectedTeams: TeamId[]): ChartPoint[] =>
  MATCHES.map((match, index) => {
    const point: ChartPoint = { match };

    selectedTeams.forEach((teamId) => {
      const value = TEAM_SERIES[teamId]?.values[index] ?? null;
      point[teamId] = value;
    });

    return point;
  });

const tooltipContent = (
  theme: ReturnType<typeof useMantineTheme>,
  colorScheme: 'dark' | 'light'
) =>
  ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const tooltipPayload = payload[0] as CustomTooltipPayload | undefined;

    if (!tooltipPayload?.dataKey) {
      return null;
    }

    const teamId = tooltipPayload.dataKey as TeamId;
    const team = TEAM_SERIES[teamId];

    if (!team) {
      return null;
    }

    const backgroundColor =
      colorScheme === 'dark' ? theme.colors.dark[6] : theme.white;
    const borderColor =
      colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3];
    const textColor =
      colorScheme === 'dark' ? theme.colors.gray[1] : theme.colors.dark[7];
    const labelColor =
      colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.gray[6];

    return (
      <div
        style={{
          backgroundColor,
          border: `1px solid ${borderColor}`,
          borderRadius: theme.radius.md,
          padding: '0.75rem 1rem',
          boxShadow:
            colorScheme === 'dark'
              ? `0 8px 20px ${rgba(theme.black, 0.45)}`
              : `0 8px 20px ${rgba(theme.black, 0.1)}`,
          color: textColor,
          minWidth: 220,
        }}
      >
        <Text fw={600} size="sm" c={textColor} mb={4}>
          {`Match ${label}`}
        </Text>
        <Text size="sm" fw={500} c={textColor} mb={6}>
          {`Team ${teamId} — ${team.name}`}
        </Text>
        <Text size="xs" c={labelColor}>
          {team.location}
        </Text>
        <Text size="lg" fw={700} mt={8}>
          {tooltipPayload.value?.toFixed(2)} EPA
        </Text>
      </div>
    );
  };

export default function CompareLineChart2025() {
  const theme = useMantineTheme();
  const { colorScheme: resolvedColorScheme } = useMantineColorScheme();
  const colorScheme = resolvedColorScheme === 'dark' ? 'dark' : 'light';

  const [selectedMetric, setSelectedMetric] = useState(METRIC_OPTIONS[0]?.value ?? 'total-epa');
  const [selectedTeams, setSelectedTeams] = useState<TeamId[]>([
    '2056',
    '1678',
    '254',
  ]);

  const palette = useMemo(
    () => getPalette(colorScheme, theme),
    [colorScheme, theme]
  );

  const chartData = useMemo(
    () => buildChartData(selectedTeams),
    [selectedTeams]
  );

  const axisColor = colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.gray[6];
  const gridColor =
    colorScheme === 'dark'
      ? rgba(theme.colors.dark[3], 0.6)
      : rgba(theme.colors.gray[3], 0.6);
  const legendTextColor =
    colorScheme === 'dark' ? theme.colors.gray[2] : theme.colors.dark[6];

  const handleTeamChange = (teams: string[]) => {
    const nextTeams = teams.slice(0, MAX_TEAMS) as TeamId[];
    setSelectedTeams(nextTeams);
  };

  return (
    <Card withBorder p="lg" radius="lg" shadow="sm">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <div>
            <Title order={3}>Team EPA Over Time</Title>
            <Text size="sm" c="dimmed">
              Compare up to five teams at once. Additional metrics and live data will be
              available soon.
            </Text>
          </div>

          <Group gap="md" wrap="wrap">
            <Select
              label="Metric"
              size="sm"
              value={selectedMetric}
              onChange={(value) => value && setSelectedMetric(value)}
              data={METRIC_OPTIONS}
              comboboxProps={{ withinPortal: true }}
              styles={{
                dropdown: {
                  backgroundColor:
                    colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
                },
              }}
            />

            <MultiSelect
              w={260}
              label="Teams"
              data={Object.entries(TEAM_SERIES).map(([teamId, team]) => ({
                value: teamId,
                label: `${teamId} • ${team.name}`,
              }))}
              value={selectedTeams}
              onChange={handleTeamChange}
              maxValues={MAX_TEAMS}
              searchable
              placeholder="Select up to 5 teams"
              nothingFoundMessage="No teams found"
              checkIconPosition="right"
              comboboxProps={{ withinPortal: true }}
            />
          </Group>
        </Group>

        <div style={{ height: rem(360) }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 32, left: 16, bottom: 12 }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
              <XAxis
                dataKey="match"
                tick={{ fill: axisColor }}
                tickLine={{ stroke: axisColor }}
                axisLine={{ stroke: axisColor }}
                label={{ value: 'Match', position: 'insideBottomRight', offset: -8, fill: axisColor }}
              />
              <YAxis
                tick={{ fill: axisColor }}
                tickLine={{ stroke: axisColor }}
                axisLine={{ stroke: axisColor }}
                width={60}
                label={{ value: 'Total EPA', angle: -90, position: 'insideLeft', fill: axisColor }}
                domain={['dataMin - 0.2', 'dataMax + 0.2']}
              />
              <Tooltip content={tooltipContent(theme, colorScheme)} />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{ color: legendTextColor }}
                iconType="circle"
              />
              {selectedTeams.length === 0 ? (
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  fill={legendTextColor}
                  style={{ fontSize: rem(16) }}
                >
                  Select teams to compare their progress.
                </text>
              ) : (
                selectedTeams.map((teamId, index) => (
                  <Line
                    key={teamId}
                    type="monotone"
                    dataKey={teamId}
                    name={`Team ${teamId}`}
                    stroke={palette[index % palette.length]}
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                ))
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Stack>
    </Card>
  );
}
