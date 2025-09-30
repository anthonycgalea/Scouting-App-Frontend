import { Fragment, useMemo, useState } from 'react';

import {
  ActionIcon,
  Center,
  Group,
  Loader,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import cx from 'clsx';

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

const getHighestValueIndices = (values: (number | null | undefined)[]) => {
  let maxValue: number | null = null;
  const indices = new Set<number>();

  values.forEach((value, index) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return;
    }

    if (maxValue === null || value > maxValue) {
      maxValue = value;
      indices.clear();
      indices.add(index);
      return;
    }

    if (value === maxValue) {
      indices.add(index);
    }
  });

  return indices;
};

export function HeadToHeadStatsTable({ teams, isLoading, isError }: HeadToHeadStatsTableProps) {
  const [expandedMetrics, setExpandedMetrics] = useState<string[]>([]);

  const metricHasData = useMemo(
    () =>
      new Map(
        METRIC_SECTIONS.flatMap((section) =>
          section.metrics.map((metric) => {
            if (metric.type === 'summary') {
              const hasSummary = teams.some((team) => team[metric.key]);
              return [`${section.label}-${metric.key}`, hasSummary] as const;
            }

            const hasValue = teams.some((team) => {
              const value = team[metric.key];
              return value !== null && value !== undefined && !Number.isNaN(value);
            });

            return [`${section.label}-${metric.key}`, hasValue] as const;
          }),
        ),
      ),
    [teams],
  );

  const toggleMetric = (metricKey: string) => {
    setExpandedMetrics((prev) =>
      prev.includes(metricKey) ? prev.filter((key) => key !== metricKey) : [...prev, metricKey],
    );
  };

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
                      const metricKey = `${section.label}-${metric.key}`;
                      const isExpanded = expandedMetrics.includes(metricKey);
                      const hasData = metricHasData.get(metricKey) ?? false;
                      const averages = teams.map((team) => team[metric.key]?.average ?? null);
                      const averageHighlights = getHighestValueIndices(averages);
                      const medianValues = teams.map((team) => team[metric.key]?.median ?? null);
                      const medianHighlights = getHighestValueIndices(medianValues);
                      const minValues = teams.map((team) => team[metric.key]?.min ?? null);
                      const minHighlights = getHighestValueIndices(minValues);
                      const maxValues = teams.map((team) => team[metric.key]?.max ?? null);
                      const maxHighlights = getHighestValueIndices(maxValues);

                      return (
                        <Fragment key={`${section.label}-${metric.key}`}>
                          <Table.Tr
                            key={`${section.label}-${metric.key}-average`}
                            className={cx(classes.metricRow, hasData && classes.metricRowInteractive)}
                            onClick={() => (hasData ? toggleMetric(metricKey) : undefined)}
                          >
                            <Table.Th scope="row" className={classes.metricLabelCell}>
                              <Group gap="xs" wrap="nowrap">
                                <ActionIcon
                                  size="sm"
                                  variant="subtle"
                                  radius="xl"
                                  className={classes.expandIcon}
                                  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${metric.label}`}
                                  disabled={!hasData}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    if (hasData) {
                                      toggleMetric(metricKey);
                                    }
                                  }}
                                >
                                  {isExpanded ? (
                                    <IconChevronUp size={16} stroke={1.5} />
                                  ) : (
                                    <IconChevronDown size={16} stroke={1.5} />
                                  )}
                                </ActionIcon>
                                <div className={classes.metricLabelContent}>
                                  <Text fw={600}>{metric.label}</Text>
                                  <Text className={classes.metricSubLabel}>Average (±σ)</Text>
                                </div>
                              </Group>
                            </Table.Th>
                            {teams.map((team, index) => {
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
                              const isHighlighted = averageHighlights.has(index);

                              return (
                                <Table.Td
                                  key={cellKey}
                                  className={cx(
                                    classes.valueCell,
                                    isHighlighted && averageText ? classes.highlightCell : null,
                                  )}
                                >
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
                          {isExpanded ? (
                            <Table.Tr key={`${section.label}-${metric.key}-range`}>
                              <Table.Th scope="row" className={classes.subMetricLabelCell}>
                                <Text className={classes.subMetricLabel}>Min / Median / Max</Text>
                              </Table.Th>
                              {teams.map((team, index) => {
                                const summary = team[metric.key];
                                const cellKey = `${team.teamNumber}-${metric.key}-range`;

                                const minText = formatNumberWithUnit(summary?.min, metric.unit) ?? '—';
                                const medianText =
                                  formatNumberWithUnit(summary?.median, metric.unit) ?? '—';
                                const maxText = formatNumberWithUnit(summary?.max, metric.unit) ?? '—';

                                const isMinHighlighted = minText !== '—' && minHighlights.has(index);
                                const isMedianHighlighted =
                                  medianText !== '—' && medianHighlights.has(index);
                                const isMaxHighlighted = maxText !== '—' && maxHighlights.has(index);

                                return (
                                  <Table.Td key={cellKey} className={cx(classes.valueCell, classes.rangeCell)}>
                                    <div className={classes.rangeValues}>
                                      <div className={classes.rangeValue}>
                                        <Text component="span" className={classes.rangeValueLabel}>
                                          Min
                                        </Text>
                                        <Text
                                          component="span"
                                          className={cx(
                                            classes.rangeValueText,
                                            isMinHighlighted ? classes.rangeValueHighlight : null,
                                          )}
                                        >
                                          {minText}
                                        </Text>
                                      </div>
                                      <div className={classes.rangeValue}>
                                        <Text component="span" className={classes.rangeValueLabel}>
                                          Median
                                        </Text>
                                        <Text
                                          component="span"
                                          className={cx(
                                            classes.rangeValueText,
                                            isMedianHighlighted ? classes.rangeValueHighlight : null,
                                          )}
                                        >
                                          {medianText}
                                        </Text>
                                      </div>
                                      <div className={classes.rangeValue}>
                                        <Text component="span" className={classes.rangeValueLabel}>
                                          Max
                                        </Text>
                                        <Text
                                          component="span"
                                          className={cx(
                                            classes.rangeValueText,
                                            isMaxHighlighted ? classes.rangeValueHighlight : null,
                                          )}
                                        >
                                          {maxText}
                                        </Text>
                                      </div>
                                    </div>
                                  </Table.Td>
                                );
                              })}
                            </Table.Tr>
                          ) : null}
                        </Fragment>
                      );
                    }

                    return (
                      <Table.Tr key={`${section.label}-${metric.key}`}>
                        <Table.Th scope="row" className={classes.metricLabelCell}>
                          <Text fw={600}>{metric.label}</Text>
                        </Table.Th>
                        {(() => {
                          const values = teams.map((teamValue) => teamValue[metric.key] ?? null);
                          const highlights = getHighestValueIndices(values);

                          return teams.map((team, index) => {
                            const value = team[metric.key];
                            const cellKey = `${team.teamNumber}-${metric.key}`;
                            const displayValue = formatNumberWithUnit(value, metric.unit);
                            const isHighlighted = highlights.has(index);

                            return (
                              <Table.Td
                                key={cellKey}
                                className={cx(
                                  classes.valueCell,
                                  isHighlighted && displayValue ? classes.highlightCell : null,
                                )}
                              >
                                {displayValue ?? '—'}
                              </Table.Td>
                            );
                          });
                        })()}
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
