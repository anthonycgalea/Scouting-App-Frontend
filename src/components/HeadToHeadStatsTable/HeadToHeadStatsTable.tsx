import { Fragment } from 'react';

import {
  Center,
  Loader,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';

import { type TeamHeadToHeadSummary } from '@/types/analytics';

import classes from './HeadToHeadStatsTable.module.css';

type HeadToHeadStatsTableProps = {
  teams: TeamHeadToHeadSummary[];
  isLoading: boolean;
  isError: boolean;
};

type SummaryMetricKey = keyof Pick<
  TeamHeadToHeadSummary,
  | 'autonomousCoral'
  | 'autonomousNetAlgae'
  | 'autonomousProcessorAlgae'
  | 'autonomousPoints'
  | 'teleopCoral'
  | 'teleopGamePieces'
  | 'teleopPoints'
  | 'teleopNetAlgae'
  | 'teleopProcessorAlgae'
  | 'endgamePoints'
  | 'totalPoints'
  | 'totalNetAlgae'
>;

type ValueMetricKey = 'endgameSuccessRate';

type MetricDefinition =
  | { type: 'summary'; key: SummaryMetricKey; label: string; unit: string }
  | { type: 'value'; key: ValueMetricKey; label: string; unit: string };

type MetricSection = {
  label: string;
  metrics: MetricDefinition[];
};

const METRIC_SECTIONS: MetricSection[] = [
  {
    label: 'Autonomous',
    metrics: [
      { type: 'summary', key: 'autonomousCoral', label: 'Coral', unit: 'pcs' },
      { type: 'summary', key: 'autonomousNetAlgae', label: 'Net Algae', unit: 'pcs' },
      { type: 'summary', key: 'autonomousProcessorAlgae', label: 'Processor Algae', unit: 'pcs' },
      { type: 'summary', key: 'autonomousPoints', label: 'Points', unit: 'pts' },
    ],
  },
  {
    label: 'Teleop',
    metrics: [
      { type: 'summary', key: 'teleopCoral', label: 'Coral', unit: 'pcs' },
      { type: 'summary', key: 'teleopGamePieces', label: 'Game Pieces', unit: 'pcs' },
      { type: 'summary', key: 'teleopPoints', label: 'Points', unit: 'pts' },
      { type: 'summary', key: 'teleopNetAlgae', label: 'Net Algae', unit: 'pcs' },
      { type: 'summary', key: 'teleopProcessorAlgae', label: 'Processor Algae', unit: 'pcs' },
    ],
  },
  {
    label: 'Endgame',
    metrics: [
      { type: 'summary', key: 'endgamePoints', label: 'Points', unit: 'pts' },
      { type: 'value', key: 'endgameSuccessRate', label: 'Success Rate', unit: '%' },
    ],
  },
  {
    label: 'Overall',
    metrics: [
      { type: 'summary', key: 'totalPoints', label: 'Total Points', unit: 'pts' },
      { type: 'summary', key: 'totalNetAlgae', label: 'Total Net Algae', unit: 'pcs' },
    ],
  },
];

const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  return value.toFixed(1);
};

const formatNumberWithUnit = (value: number | null | undefined, unit: string) => {
  const formatted = formatNumber(value);

  if (!formatted) {
    return null;
  }

  if (!unit) {
    return formatted;
  }

  if (unit === '%') {
    return `${formatted}${unit}`;
  }

  return `${formatted} ${unit}`;
};

export function HeadToHeadStatsTable({ teams, isLoading, isError }: HeadToHeadStatsTableProps) {
  if (isLoading) {
    return (
      <Paper withBorder radius="md" p="xl" className={classes.card}>
        <Center h="100%">
          <Loader size="lg" />
        </Center>
      </Paper>
    );
  }

  if (isError) {
    return (
      <Paper withBorder radius="md" p="xl" className={classes.card}>
        <Center h="100%">
          <Text c="red" fw={600}>
            We couldn't load the head-to-head statistics. Please try again later.
          </Text>
        </Center>
      </Paper>
    );
  }

  if (teams.length === 0) {
    return (
      <Paper withBorder radius="md" p="xl" className={classes.card}>
        <Center h="100%">
          <Text className={classes.emptyState} fw={500}>
            Select at least one team to compare their head-to-head statistics.
          </Text>
        </Center>
      </Paper>
    );
  }

  return (
    <Paper withBorder radius="md" p="xl" className={classes.card}>
      <Stack gap="lg" className={classes.tableContainer}>
        <Title order={4} ta="center">
          Head-to-Head Summary
        </Title>

        <Table.ScrollContainer minWidth={600}>
          <Table verticalSpacing="md" highlightOnHover withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th />
                {teams.map((team) => (
                  <Table.Th key={team.teamNumber} ta="center">
                    <Stack gap={2} align="center">
                      <Text className={classes.headerTeamNumber}>{team.teamNumber}</Text>
                      {team.teamName ? (
                        <Text className={classes.headerTeamName}>{team.teamName}</Text>
                      ) : null}
                      <Text className={classes.headerMatches}>
                        Matches: {team.matchesPlayed}
                      </Text>
                    </Stack>
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {METRIC_SECTIONS.map((section) => (
                <Fragment key={section.label}>
                  <Table.Tr className={classes.sectionHeaderRow}>
                    <Table.Th colSpan={teams.length + 1} className={classes.sectionHeaderCell}>
                      {section.label}
                    </Table.Th>
                  </Table.Tr>
                  {section.metrics.map((metric) => {
                    if (metric.type === 'summary') {
                      return (
                        <Fragment key={`${section.label}-${metric.key}`}>
                          <Table.Tr key={`${section.label}-${metric.key}-average`}>
                            <Table.Th scope="row" className={classes.metricLabelCell}>
                              Average (σ)
                            </Table.Th>
                            {teams.map((team) => {
                              const summary = team[metric.key];
                              const cellKey = `${team.teamNumber}-${metric.key}-average`;

                              if (!summary) {
                                return (
                                  <Table.Td key={cellKey} className={classes.valueCell}>
                                    —
                                  </Table.Td>
                                );
                              }

                              const averageText = formatNumberWithUnit(summary.average, metric.unit);

                              if (!averageText) {
                                return (
                                  <Table.Td key={cellKey} className={classes.valueCell}>
                                    —
                                  </Table.Td>
                                );
                              }

                              const deviationNumber = formatNumber(summary.stdev);
                              const deviationUnitSuffix = metric.unit ? ` ${metric.unit}` : '';

                              return (
                                <Table.Td key={cellKey} className={classes.valueCell}>
                                  <Text component="span" fw={600}>
                                    {averageText}
                                  </Text>
                                  {deviationNumber ? (
                                    <Text component="span" className={classes.deviationText}>
                                      {` (±${deviationNumber}${deviationUnitSuffix})`}
                                    </Text>
                                  ) : null}
                                </Table.Td>
                              );
                            })}
                          </Table.Tr>
                          <Table.Tr key={`${section.label}-${metric.key}-median`}>
                            <Table.Th scope="row" className={classes.metricLabelCell}>
                              Median
                            </Table.Th>
                            {teams.map((team) => {
                              const summary = team[metric.key];
                              const cellKey = `${team.teamNumber}-${metric.key}-median`;
                              const medianText = summary
                                ? formatNumberWithUnit(summary.median, metric.unit)
                                : null;

                              return (
                                <Table.Td key={cellKey} className={classes.valueCell}>
                                  {medianText ?? '—'}
                                </Table.Td>
                              );
                            })}
                          </Table.Tr>
                          <Table.Tr key={`${section.label}-${metric.key}-range`}>
                            <Table.Th scope="row" className={classes.metricLabelCell}>
                              Min / Max
                            </Table.Th>
                            {teams.map((team) => {
                              const summary = team[metric.key];
                              const cellKey = `${team.teamNumber}-${metric.key}-range`;

                              if (!summary) {
                                return (
                                  <Table.Td key={cellKey} className={classes.valueCell}>
                                    —
                                  </Table.Td>
                                );
                              }

                              const minText = formatNumberWithUnit(summary.min, metric.unit);
                              const maxText = formatNumberWithUnit(summary.max, metric.unit);

                              if (!minText && !maxText) {
                                return (
                                  <Table.Td key={cellKey} className={classes.valueCell}>
                                    —
                                  </Table.Td>
                                );
                              }

                              return (
                                <Table.Td key={cellKey} className={classes.valueCell}>
                                  <div className={classes.rangeCell}>
                                    <div className={classes.rangeColumn}>
                                      <Text className={classes.rangeLabel}>Min</Text>
                                      <Text fw={600}>{minText ?? '—'}</Text>
                                    </div>
                                    <div className={classes.rangeColumn}>
                                      <Text className={classes.rangeLabel}>Max</Text>
                                      <Text fw={600}>{maxText ?? '—'}</Text>
                                    </div>
                                  </div>
                                </Table.Td>
                              );
                            })}
                          </Table.Tr>
                        </Fragment>
                      );
                    }

                    return (
                      <Table.Tr key={`${section.label}-${metric.key}`}>
                        <Table.Th scope="row" className={classes.metricLabelCell}>
                          {metric.label}
                        </Table.Th>
                        {teams.map((team) => {
                          const value = team[metric.key];
                          const cellKey = `${team.teamNumber}-${metric.key}`;
                          const displayValue = formatNumberWithUnit(value, metric.unit);

                          return (
                            <Table.Td key={cellKey} className={classes.valueCell}>
                              {displayValue ?? '—'}
                            </Table.Td>
                          );
                        })}
                      </Table.Tr>
                    );
                  })}
                </Fragment>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Stack>
    </Paper>
  );
}

export default HeadToHeadStatsTable;
