import { useMemo } from 'react';
import {
  Box,
  Flex,
  Group,
  Stack,
  Text,
  Tooltip,
  useMantineColorScheme,
  useMantineTheme,
  rgba,
} from '@mantine/core';
import { Link } from '@tanstack/react-router';

import { type TeamDistributionSummary } from '@/types/analytics';

const LABEL_WIDTH = 160;
const SUMMARY_WIDTH = 96;
const ROW_HEIGHT = 54;
const CHART_BORDER_RADIUS = 10;
const TICK_COUNT = 5;

const formatNumber = (value: number, unit: string) =>
  `${value.toFixed(1)}${unit ? ` ${unit}` : ''}`;

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

export type BoxMetric =  'gamePieces' | 'total' | 'autonomous' | 'teleop';

type BoxWhiskerChart2025Props = {
  teams?: TeamDistributionSummary[];
  metric: BoxMetric;
};

const METRIC_CONFIG: Record<
  BoxMetric,
  { label: string; unit: string; summaryLabel: string; formatter: (value: number) => string }
> = {
  gamePieces: {
    label: 'Game pieces',
    unit: 'pcs',
    summaryLabel: 'Avg game pieces',
    formatter: (value) => formatNumber(value, 'pcs'),
  },
  total: {
    label: 'Total points',
    unit: 'pts',
    summaryLabel: 'Avg total',
    formatter: (value) => formatNumber(value, 'pts'),
  },
  autonomous: {
    label: 'Autonomous points',
    unit: 'pts',
    summaryLabel: 'Avg auto',
    formatter: (value) => formatNumber(value, 'pts'),
  },
  teleop: {
    label: 'Teleop points',
    unit: 'pts',
    summaryLabel: 'Avg teleop',
    formatter: (value) => formatNumber(value, 'pts'),
  },
};

type Colors = {
  surface: string;
  border: string;
  grid: string;
  text: string;
  axis: string;
  dimmed: string;
  boxFill: string;
  boxBorder: string;
  whisker: string;
  median: string;
  averageFill: string;
  averageBorder: string;
};

const LegendItem = ({ color, label, textColor }: { color: string; label: string; textColor: string }) => (
  <Group gap={6} align="center">
    <Box
      w={12}
      h={12}
      style={{ borderRadius: 4, backgroundColor: color }}
    />
    <Text size="xs" style={{ color: textColor }}>
      {label}
    </Text>
  </Group>
);

const BoxWhiskerChart2025 = ({ teams = [], metric }: BoxWhiskerChart2025Props) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  const colors = useMemo<Colors>(() => {
    if (colorScheme === 'dark') {
      return {
        surface: theme.colors.dark[6],
        border: theme.colors.dark[4],
        grid: theme.colors.dark[4],
        text: theme.colors.gray[0],
        axis: theme.colors.gray[4],
        dimmed: theme.colors.gray[5],
        boxFill: rgba(theme.colors.blue[4], 0.4),
        boxBorder: theme.colors.blue[3],
        whisker: theme.colors.gray[3],
        median: theme.colors.yellow[3],
        averageFill: theme.colors.orange[4],
        averageBorder: theme.colors.orange[2],
      };
    }

    return {
      surface: theme.white,
      border: theme.colors.gray[3],
      grid: theme.colors.gray[2],
      text: theme.colors.dark[7],
      axis: theme.colors.gray[6],
      dimmed: theme.colors.gray[6],
      boxFill: rgba(theme.colors.blue[5], 0.35),
      boxBorder: theme.colors.blue[6],
      whisker: theme.colors.gray[7],
      median: theme.colors.yellow[6],
      averageFill: theme.colors.orange[5],
      averageBorder: theme.colors.orange[7],
    };
  }, [colorScheme, theme]);

  const metricConfig = METRIC_CONFIG[metric];

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => b[metric].average - a[metric].average);
  }, [metric, teams]);

  const domain = useMemo(() => {
    if (sortedTeams.length === 0) {
      return { min: 0, max: 1 };
    }

    const min = Math.min(...sortedTeams.map((team) => team[metric].min));
    const max = Math.max(...sortedTeams.map((team) => team[metric].max));

    if (min === max) {
      const baseline = min === 0 ? 0 : min - 5;
      return { min: baseline, max: min + 5 };
    }

    const padding = (max - min) * 0.05;

    return { min: min - padding, max: max + padding };
  }, [metric, sortedTeams]);

  const scaleValue = (value: number) => {
    const range = domain.max - domain.min;

    if (range <= 0) {
      return 0;
    }

    return clampPercent(((value - domain.min) / range) * 100);
  };

  const ticks = useMemo(() => {
    const range = domain.max - domain.min;

    if (range <= 0) {
      return [domain.min];
    }

    const steps = TICK_COUNT - 1;
    const tickValues = Array.from({ length: TICK_COUNT }, (_, index) => domain.min + (range / steps) * index);

    return tickValues;
  }, [domain.max, domain.min]);

  if (sortedTeams.length === 0) {
    return (
      <Flex justify="center" align="center" h={220}>
        <Text c="dimmed" fw={500}>
          No distribution data is available for the selected teams.
        </Text>
      </Flex>
    );
  }

  return (
    <Stack gap="md" h="100%">
      <Group justify="space-between" align="center" px="sm">
        <Text fw={600} c={colors.text}>
          {metricConfig.label} distribution per match
        </Text>
        <Group gap="lg">
          <LegendItem color={colors.boxFill} label="Interquartile range" textColor={colors.dimmed} />
          <LegendItem color={colors.median} label="Median" textColor={colors.dimmed} />
          <LegendItem color={colors.averageFill} label="Average" textColor={colors.dimmed} />
        </Group>
      </Group>
      <Box>
        <Flex align="flex-end">
          <Box w={LABEL_WIDTH} />
          <Box pos="relative" flex={1} h={32}>
            {ticks.map((tick) => {
              const position = scaleValue(tick);

              return (
                <Box
                  key={tick}
                  pos="absolute"
                  top={0}
                  bottom={0}
                  left={`${position}%`}
                  style={{ transform: 'translateX(-50%)' }}
                >
                  <Box h={16} w={1} bg={colors.grid} style={{ opacity: 0.45 }} />
                  <Text
                    size="xs"
                    mt={6}
                    ta="center"
                    c={colors.axis}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {`${tick.toFixed(0)}${metricConfig.unit ? ` ${metricConfig.unit}` : ''}`}
                  </Text>
                </Box>
              );
            })}
          </Box>
          <Box w={SUMMARY_WIDTH} />
        </Flex>
      </Box>
      <Stack gap="sm" flex={1}>
        {sortedTeams.map((team) => {
          const summary = team[metric];
          const minPosition = scaleValue(summary.min);
          const maxPosition = scaleValue(summary.max);
          const lowerQuartilePosition = scaleValue(summary.lowerQuartile);
          const upperQuartilePosition = scaleValue(summary.upperQuartile);
          const medianPosition = scaleValue(summary.median);
          const averagePosition = scaleValue(summary.average);

          const boxWidth = Math.max(upperQuartilePosition - lowerQuartilePosition, 0);

          const tooltipContent = (
            <Stack gap={2}>
              <Text fw={600}>
                {team.teamName ? `${team.teamName} • Team ${team.teamNumber}` : `Team ${team.teamNumber}`}
              </Text>
              <Text size="sm" c="dimmed">
                Matches played: {team.matchesPlayed}
              </Text>
              <Stack gap={2} mt="xs">
                <Text size="sm">Min: {metricConfig.formatter(summary.min)}</Text>
                <Text size="sm">Lower quartile: {metricConfig.formatter(summary.lowerQuartile)}</Text>
                <Text size="sm">Median: {metricConfig.formatter(summary.median)}</Text>
                <Text size="sm">Upper quartile: {metricConfig.formatter(summary.upperQuartile)}</Text>
                <Text size="sm">Max: {metricConfig.formatter(summary.max)}</Text>
                <Text size="sm">Average: {metricConfig.formatter(summary.average)}</Text>
              </Stack>
            </Stack>
          );

          return (
            <Flex key={team.teamNumber} align="center" gap="md">
              <Box w={LABEL_WIDTH}>
                <Text
                  fw={600}
                  c={colors.text}
                  component={Link}
                  to={`/teams/${team.teamNumber}`}
                  style={{ textDecoration: 'none', cursor: 'pointer' }}
                  aria-label={`View Team ${team.teamNumber} details`}
                >
                  {team.teamName
                    ? `Team ${team.teamNumber} — ${team.teamName}`
                    : `Team ${team.teamNumber}`}
                </Text>
                <Text size="xs" c={colors.dimmed}>
                  {team.matchesPlayed} matches played
                </Text>
              </Box>
              <Tooltip label={tooltipContent} position="top" withArrow color={colorScheme === 'dark' ? 'dark' : 'gray'}>
                <Box
                  pos="relative"
                  style={{
                    flex: 1,
                    height: ROW_HEIGHT,
                    borderRadius: CHART_BORDER_RADIUS,
                    backgroundColor: colors.surface,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  {ticks.map((tick) => {
                    const position = scaleValue(tick);
                    return (
                      <Box
                        key={tick}
                        pos="absolute"
                        top={8}
                        bottom={8}
                        left={`${position}%`}
                        style={{
                          width: 1,
                          backgroundColor: colors.grid,
                          opacity: 0.25,
                          transform: 'translateX(-0.5px)',
                        }}
                      />
                    );
                  })}
                  <Box
                    pos="absolute"
                    top="50%"
                    left={`${minPosition}%`}
                    style={{
                      width: `${Math.max(maxPosition - minPosition, 0)}%`,
                      height: 2,
                      backgroundColor: colors.whisker,
                      transform: 'translateY(-50%)',
                    }}
                  />
                  <Box
                    pos="absolute"
                    top="20%"
                    bottom="20%"
                    left={`${minPosition}%`}
                    style={{
                      width: 2,
                      backgroundColor: colors.whisker,
                      transform: 'translateX(-50%)',
                    }}
                  />
                  <Box
                    pos="absolute"
                    top="20%"
                    bottom="20%"
                    left={`${maxPosition}%`}
                    style={{
                      width: 2,
                      backgroundColor: colors.whisker,
                      transform: 'translateX(-50%)',
                    }}
                  />
                  <Box
                    pos="absolute"
                    top="18%"
                    bottom="18%"
                    left={`${lowerQuartilePosition}%`}
                    style={{
                      width: `${boxWidth}%`,
                      borderRadius: CHART_BORDER_RADIUS / 1.5,
                      backgroundColor: colors.boxFill,
                      border: `1px solid ${colors.boxBorder}`,
                      transformOrigin: 'left center',
                    }}
                  />
                  <Box
                    pos="absolute"
                    top="18%"
                    bottom="18%"
                    left={`${medianPosition}%`}
                    style={{
                      width: 2,
                      backgroundColor: colors.median,
                      transform: 'translateX(-50%)',
                    }}
                  />
                  <Box
                    pos="absolute"
                    top="50%"
                    left={`${averagePosition}%`}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: colors.averageFill,
                      border: `2px solid ${colors.averageBorder}`,
                      transform: 'translate(-50%, -50%)',
                      boxShadow: `0 0 6px ${rgba(colors.averageBorder, 0.35)}`,
                    }}
                  />
                </Box>
              </Tooltip>
              <Box w={SUMMARY_WIDTH} ta="right">
                <Text fw={600} c={colors.text}>
                  {metricConfig.formatter(summary.average)}
                </Text>
                <Text size="xs" c={colors.dimmed}>
                  {metricConfig.summaryLabel}
                </Text>
              </Box>
            </Flex>
          );
        })}
      </Stack>
    </Stack>
  );
};

export default BoxWhiskerChart2025;
