import { Card, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import clsx from 'clsx';
import type { MatchSimulation2025 } from '@/api';
import classes from './Simulation.module.css';

interface Simulation2025Props {
  simulation: MatchSimulation2025;
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

export const Simulation2025 = ({ simulation }: Simulation2025Props) => {
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
              <Text className={classes.metricLabel}>Auto RP</Text>
              <Text fw={600}>{formatPercentage(simulation.red_auto_rp)}</Text>
            </div>
            <div className={classes.metricGroup}>
              <Text className={classes.metricLabel}>Coral Success</Text>
              <div className={classes.metricSubGroup}>
                <div className={classes.metricSubRow}>
                  <Text className={classes.metricSubLabel}>Win</Text>
                  <Text fw={600}>{formatPercentage(simulation.red_w_coral_rp)}</Text>
                </div>
                <div className={classes.metricSubRow}>
                  <Text className={classes.metricSubLabel}>RP</Text>
                  <Text fw={600}>{formatPercentage(simulation.red_r_coral_rp)}</Text>
                </div>
              </div>
            </div>
            <div className={classes.metricRow}>
              <Text className={classes.metricLabel}>Endgame RP</Text>
              <Text fw={600}>{formatPercentage(simulation.red_endgame_rp)}</Text>
            </div>
          </Stack>
        </Card>

        <Card withBorder radius="md" padding="md" className={classes.allianceCard}>
          <Stack gap="sm">
            <Text fw={700} className={classes.blueTitle}>
              Blue RP
            </Text>
            <div className={classes.metricRow}>
              <Text className={classes.metricLabel}>Auto RP</Text>
              <Text fw={600}>{formatPercentage(simulation.blue_auto_rp)}</Text>
            </div>
            <div className={classes.metricGroup}>
              <Text className={classes.metricLabel}>Coral Success</Text>
              <div className={classes.metricSubGroup}>
                <div className={classes.metricSubRow}>
                  <Text className={classes.metricSubLabel}>Win</Text>
                  <Text fw={600}>{formatPercentage(simulation.blue_w_coral_rp)}</Text>
                </div>
                <div className={classes.metricSubRow}>
                  <Text className={classes.metricSubLabel}>RP</Text>
                  <Text fw={600}>{formatPercentage(simulation.blue_r_coral_rp)}</Text>
                </div>
              </div>
            </div>
            <div className={classes.metricRow}>
              <Text className={classes.metricLabel}>Endgame RP</Text>
              <Text fw={600}>{formatPercentage(simulation.blue_endgame_rp)}</Text>
            </div>
          </Stack>
        </Card>
      </SimpleGrid>
    </Stack>
  );
};
