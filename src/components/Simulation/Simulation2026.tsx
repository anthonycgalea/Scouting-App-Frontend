import { Card, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import clsx from 'clsx';
import type { MatchSimulation2026 } from '@/api';
import classes from './Simulation.module.css';

interface Simulation2026Props {
  simulation: MatchSimulation2026;
}

const formatPercentage = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }

  const normalized = Math.max(0, Math.min(1, value));

  return `${(normalized * 100).toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
};

export const Simulation2026 = ({ simulation }: Simulation2026Props) => {
  const redWinPct = simulation.red_alliance_win_pct;
  const blueWinPct = simulation.blue_alliance_win_pct;

  const isRedFavorite = redWinPct > blueWinPct;
  const isBlueFavorite = blueWinPct > redWinPct;

  const winnerLabel = isRedFavorite
    ? 'Red Alliance'
    : isBlueFavorite
      ? 'Blue Alliance'
      : 'Evenly Matched';

  const winnerPct = isRedFavorite
    ? redWinPct
    : isBlueFavorite
      ? blueWinPct
      : redWinPct;

  const winnerBadgeClass = clsx(classes.winBadge, {
    [classes.winBadgeRed]: isRedFavorite,
    [classes.winBadgeBlue]: isBlueFavorite,
    [classes.winBadgeNeutral]: !isRedFavorite && !isBlueFavorite,
  });

  return (
    <Stack gap="md">
      <Card withBorder radius="md" padding="md" className={classes.predictionCard}>
        <Stack gap="xs">
          <Text fw={600}>Predicted Winner</Text>
          <Group gap="sm" align="center">
            <Text fw={600}>{winnerLabel}</Text>
            <Paper radius="sm" className={winnerBadgeClass}>
              <Text fw={700}>{formatPercentage(winnerPct)}</Text>
            </Paper>
          </Group>
          {!isRedFavorite && !isBlueFavorite ? (
            <Text fz="xs" c="dimmed">
              Both alliances have an equal chance of winning based on the current
              simulation.
            </Text>
          ) : null}
        </Stack>
      </Card>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Card withBorder radius="md" padding="md" className={classes.allianceCard}>
          <Stack gap="sm">
            <Text fw={700} className={classes.redTitle}>
              Red RP
            </Text>
            <div className={classes.metricRow}>
              <Text className={classes.metricLabel}>Energized RP</Text>
              <Text fw={600}>{formatPercentage(simulation.red_energized_rp)}</Text>
            </div>
            <div className={classes.metricRow}>
              <Text className={classes.metricLabel}>Supercharged RP</Text>
              <Text fw={600}>{formatPercentage(simulation.red_supercharged_rp)}</Text>
            </div>
            <div className={classes.metricRow}>
              <Text className={classes.metricLabel}>Traversal RP</Text>
              <Text fw={600}>{formatPercentage(simulation.red_traversal_rp)}</Text>
            </div>
          </Stack>
        </Card>

        <Card withBorder radius="md" padding="md" className={classes.allianceCard}>
          <Stack gap="sm">
            <Text fw={700} className={classes.blueTitle}>
              Blue RP
            </Text>
            <div className={classes.metricRow}>
              <Text className={classes.metricLabel}>Energized RP</Text>
              <Text fw={600}>{formatPercentage(simulation.blue_energized_rp)}</Text>
            </div>
            <div className={classes.metricRow}>
              <Text className={classes.metricLabel}>Supercharged RP</Text>
              <Text fw={600}>{formatPercentage(simulation.blue_supercharged_rp)}</Text>
            </div>
            <div className={classes.metricRow}>
              <Text className={classes.metricLabel}>Traversal RP</Text>
              <Text fw={600}>{formatPercentage(simulation.blue_traversal_rp)}</Text>
            </div>
          </Stack>
        </Card>
      </SimpleGrid>
    </Stack>
  );
};
