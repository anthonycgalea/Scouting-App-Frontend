import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Center,
  Group,
  Loader,
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
  type TooltipContentProps,
} from 'recharts';

import { useEventInfo, type TeamMatchHistoryResponse } from '@/api';

type TeamIdentifier = string;

type MetricKey =
  | 'total_points'
  | 'autonomous_points'
  | 'teleop_points'
  | 'endgame_points'
  | 'game_pieces'
  | 'autoFuel'
  | 'autoClimb'
  | 'teleopFuel'
  | 'teleopPass'
  | 'total_fuel';

type MetricOption = {
  value: MetricKey;
  label: string;
  axisLabel: string;
  valueSuffix: string;
};

type ChartPoint = {
  matchIndex: number;
  matchDetails: Record<TeamIdentifier, string | undefined>;
  [teamId: string]: number | null | Record<TeamIdentifier, string | undefined>;
};

type CustomTooltipPayload = {
  color?: string;
  dataKey?: string;
  value?: number;
  payload?: ChartPoint;
};

type TooltipTeam = {
  teamId: TeamIdentifier;
  value: number | null;
  color?: string;
  matchLabel?: string;
};

const METRIC_OPTIONS_2025: MetricOption[] = [
  { value: 'total_points', label: 'Total Points', axisLabel: 'Total Points', valueSuffix: 'Points' },
  {
    value: 'autonomous_points',
    label: 'Autonomous Points',
    axisLabel: 'Autonomous Points',
    valueSuffix: 'Points',
  },
  { value: 'teleop_points', label: 'Teleop Points', axisLabel: 'Teleop Points', valueSuffix: 'Points' },
  {
    value: 'endgame_points',
    label: 'Endgame Points',
    axisLabel: 'Endgame Points',
    valueSuffix: 'Points',
  },
  {
    value: 'game_pieces',
    label: 'Game Pieces',
    axisLabel: 'Game Pieces',
    valueSuffix: 'Game Pieces',
  },
];

const METRIC_OPTIONS_2026: MetricOption[] = [
  { value: 'autoFuel', label: 'Autonomous Fuel', axisLabel: 'Autonomous Fuel', valueSuffix: 'Fuel' },
  {
    value: 'endgame_points',
    label: 'Endgame Points',
    axisLabel: 'Endgame Points',
    valueSuffix: 'Points',
  },
  { value: 'total_fuel', label: 'Total Fuel', axisLabel: 'Total Fuel', valueSuffix: 'Fuel' },
  {
    value: 'autoClimb',
    label: 'Autonomous Climb',
    axisLabel: 'Autonomous Climb',
    valueSuffix: 'Climb',
  },
  { value: 'teleopFuel', label: 'Teleop Fuel', axisLabel: 'Teleop Fuel', valueSuffix: 'Fuel' },
  {
    value: 'teleopPass',
    label: 'Teleop Passing',
    axisLabel: 'Teleop Passing',
    valueSuffix: 'Passes',
  },
];

const getMetricValue = (match: TeamMatchHistoryResponse['matches'][number], metricKey: MetricKey) => {
  if (metricKey === 'total_fuel') {
    const autoFuel = typeof match.autoFuel === 'number' ? match.autoFuel : null;
    const teleopFuel = typeof match.teleopFuel === 'number' ? match.teleopFuel : null;

    if (autoFuel === null && teleopFuel === null) {
      return null;
    }

    return (autoFuel ?? 0) + (teleopFuel ?? 0);
  }

  const value = match[metricKey as keyof TeamMatchHistoryResponse['matches'][number]];
  return typeof value === 'number' ? value : null;
};

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

const buildChartData = (
  selectedTeams: TeamIdentifier[],
  metricKey: MetricKey,
  teamLookup: Map<TeamIdentifier, TeamMatchHistoryResponse>,
): ChartPoint[] => {
  if (selectedTeams.length === 0) {
    return [];
  }

  const maxMatches = selectedTeams.reduce((max, teamId) => {
    const team = teamLookup.get(teamId);
    return Math.max(max, team?.matches.length ?? 0);
  }, 0);

  if (maxMatches === 0) {
    return [];
  }

  return Array.from({ length: maxMatches }, (_, index) => {
    const matchIndex = index + 1;
    const point: ChartPoint = {
      matchIndex,
      matchDetails: {} as Record<TeamIdentifier, string | undefined>,
    };

    selectedTeams.forEach((teamId) => {
      const team = teamLookup.get(teamId);
      const match = team?.matches[index];

      if (!match) {
        point[teamId] = null;
        point.matchDetails[teamId] = undefined;
        return;
      }

      point[teamId] = getMetricValue(match, metricKey);

      const level = match.match_level?.toLowerCase() ?? '';
      const matchLabel =
        match.match_number !== undefined && match.match_number !== null
          ? `${level}${match.match_number}`
          : level;
      point.matchDetails[teamId] = matchLabel || undefined;
    });

    return point;
  });
};

const tooltipContent = (
  theme: ReturnType<typeof useMantineTheme>,
  colorScheme: 'dark' | 'light',
  teamLookup: Map<TeamIdentifier, TeamMatchHistoryResponse>,
  valueSuffix: string,
) =>
  ({ active, payload, label }: TooltipContentProps<number, string>) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const mappedTeams = payload.map((item): TooltipTeam | null => {
      const tooltipPayload = item as CustomTooltipPayload | undefined;

      if (!tooltipPayload?.dataKey) {
        return null;
      }

      const teamId = tooltipPayload.dataKey as TeamIdentifier;
      const team = teamLookup.get(teamId);

      if (!team) {
        return null;
      }

      return {
        teamId,
        value: typeof tooltipPayload.value === 'number' ? tooltipPayload.value : null,
        color: tooltipPayload.color,
        matchLabel: tooltipPayload.payload?.matchDetails?.[teamId],
      };
    });

    const teamsInTooltip = mappedTeams.filter(
      (team): team is TooltipTeam => team !== null,
    );

    if (teamsInTooltip.length === 0) {
      return null;
    }

    const backgroundColor = colorScheme === 'dark' ? theme.colors.dark[6] : theme.white;
    const borderColor = colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3];
    const textColor = colorScheme === 'dark' ? theme.colors.gray[1] : theme.colors.dark[7];
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
        <Stack gap={4} mt={6}>
          {teamsInTooltip.map(({ teamId, value, color, matchLabel }) => {
            const valueText =
              value !== null
                ? `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${valueSuffix}`
                : 'N/A';
            const matchText = matchLabel ? ` (${matchLabel})` : '';

            return (
              <Group key={teamId} gap={8} wrap="nowrap">
                <div
                  style={{
                    width: rem(10),
                    height: rem(10),
                    borderRadius: '50%',
                    backgroundColor: color ?? theme.colors.gray[5],
                    flexShrink: 0,
                  }}
                />
                <Text size="sm" fw={500} c={textColor}>
                  {`Team ${teamId}: ${valueText}${matchText}`}
                </Text>
              </Group>
            );
          })}
        </Stack>
      </div>
    );
  };

type CompareLineChart2025Props = {
  teams: TeamMatchHistoryResponse[];
  isLoading: boolean;
  isError: boolean;
};

export default function CompareLineChart2025({ teams, isLoading, isError }: CompareLineChart2025Props) {
  const theme = useMantineTheme();
  const { colorScheme: resolvedColorScheme } = useMantineColorScheme();
  const colorScheme = resolvedColorScheme === 'dark' ? 'dark' : 'light';
  const { data: eventInfo } = useEventInfo();

  const is2026Event = eventInfo?.year === 2026;
  const metricOptions = useMemo(
    () => (is2026Event ? METRIC_OPTIONS_2026 : METRIC_OPTIONS_2025),
    [is2026Event],
  );

  const [selectedMetric, setSelectedMetric] = useState<MetricKey>(METRIC_OPTIONS_2025[0].value);

  useEffect(() => {
    if (!metricOptions.some((option) => option.value === selectedMetric)) {
      setSelectedMetric(metricOptions[0].value);
    }
  }, [metricOptions, selectedMetric]);

  const teamLookup = useMemo(() => {
    return new Map<TeamIdentifier, TeamMatchHistoryResponse>(
      teams.map((team) => [String(team.team_number), team]),
    );
  }, [teams]);

  const selectedTeams = useMemo(
    () => teams.map((team) => String(team.team_number)),
    [teams],
  );

  const palette = useMemo(
    () => getPalette(colorScheme, theme),
    [colorScheme, theme],
  );

  const selectedMetricDefinition = useMemo(
    () => metricOptions.find((option) => option.value === selectedMetric) ?? metricOptions[0],
    [metricOptions, selectedMetric],
  );

  const chartData = useMemo(
    () => buildChartData(selectedTeams, selectedMetricDefinition.value, teamLookup),
    [selectedTeams, selectedMetricDefinition.value, teamLookup],
  );

  const axisColor = colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.gray[6];
  const gridColor =
    colorScheme === 'dark'
      ? rgba(theme.colors.dark[3], 0.6)
      : rgba(theme.colors.gray[3], 0.6);
  const legendTextColor = colorScheme === 'dark' ? theme.colors.gray[2] : theme.colors.dark[6];

  const tooltipRenderer = useMemo(
    () => tooltipContent(theme, colorScheme, teamLookup, selectedMetricDefinition.valueSuffix),
    [theme, colorScheme, teamLookup, selectedMetricDefinition.valueSuffix],
  );

  const metricSelectOptions = useMemo(
    () => metricOptions.map((option) => ({ value: option.value, label: option.label })),
    [metricOptions],
  );

  const hasData = chartData.length > 0 && selectedTeams.length > 0;

  return (
    <Card withBorder p="lg" radius="lg" shadow="sm" h="100%" w="100%">
      <Stack gap="lg" h="100%">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <div>
            <Title order={3}>Team Performance Over Time</Title>
            <Text size="sm" c="dimmed">
              Explore trends in performance.
            </Text>
          </div>

          <Group gap="md" wrap="wrap">
            <Select
              label="Metric"
              size="sm"
              value={selectedMetric}
              onChange={(value) => value && setSelectedMetric(value as MetricKey)}
              data={metricSelectOptions}
              comboboxProps={{ withinPortal: true }}
              styles={{
                dropdown: {
                  backgroundColor:
                    colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
                },
              }}
            />
          </Group>
        </Group>

        <div style={{ flex: 1, minHeight: rem(360) }}>
          {isLoading ? (
            <Center h="100%">
              <Loader size="sm" />
            </Center>
          ) : isError ? (
            <Center h="100%">
              <Text c="dimmed">Unable to load match history at this time.</Text>
            </Center>
          ) : !hasData ? (
            <Center h="100%">
              <Text c="dimmed">
                {selectedTeams.length === 0
                  ? 'Select teams to compare their progress.'
                  : 'No match data is available for the selected teams.'}
              </Text>
            </Center>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 32, left: 16, bottom: 12 }}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                <XAxis
                  dataKey="matchIndex"
                  tick={{ fill: axisColor }}
                  tickLine={{ stroke: axisColor }}
                  axisLine={{ stroke: axisColor }}
                  label={{
                    value: 'Match',
                    position: 'insideBottomRight',
                    offset: -8,
                    fill: axisColor,
                  }}
                />
                <YAxis
                  tick={{ fill: axisColor }}
                  tickLine={{ stroke: axisColor }}
                  axisLine={{ stroke: axisColor }}
                  width={60}
                  label={{
                    value: selectedMetricDefinition.axisLabel,
                    angle: -90,
                    position: 'insideLeft',
                    fill: axisColor,
                  }}
                  domain={[0, 'auto']}
                />
                <Tooltip content={tooltipRenderer} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{ color: legendTextColor }}
                  iconType="circle"
                />
                {selectedTeams.map((teamId, index) => (
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
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Stack>
    </Card>
  );
}
