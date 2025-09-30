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

import { type TeamDistributionSummary } from '@/types/analytics';

import classes from './HeadToHeadStatsTable.module.css';

type HeadToHeadStatsTableProps = {
  teams: TeamDistributionSummary[];
  isLoading: boolean;
  isError: boolean;
};

type MetricKey = 'gamePieces' | 'autonomous' | 'teleop';

type SummaryKey = 'max' | 'median' | 'min';

const METRICS: { key: MetricKey; label: string; unit: string }[] = [
  { key: 'gamePieces', label: 'Game Pieces', unit: 'pcs' },
  { key: 'autonomous', label: 'Autonomous Score', unit: 'pts' },
  { key: 'teleop', label: 'Teleop Score', unit: 'pts' },
];

const SUMMARY_ROWS: { key: SummaryKey; label: string }[] = [
  { key: 'max', label: 'Maximum' },
  { key: 'median', label: 'Median' },
  { key: 'min', label: 'Minimum' },
];

const formatValue = (value: number, unit: string) => `${value.toFixed(1)}${unit ? ` ${unit}` : ''}`;

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
              {METRICS.map((metric) => (
                <Fragment key={metric.key}>
                  <Table.Tr className={classes.sectionHeaderRow}>
                    <Table.Th colSpan={teams.length + 1} className={classes.sectionHeaderCell}>
                      {metric.label}
                    </Table.Th>
                  </Table.Tr>
                  {SUMMARY_ROWS.map((summaryRow) => (
                    <Table.Tr key={`${metric.key}-${summaryRow.key}`}>
                      <Table.Th scope="row" className={classes.metricLabelCell}>
                        {summaryRow.label}
                      </Table.Th>
                      {teams.map((team) => {
                        const summary = team[metric.key];

                        if (!summary) {
                          return (
                            <Table.Td key={`${team.teamNumber}-${metric.key}-${summaryRow.key}`} ta="center" className={classes.valueCell}>
                              —
                            </Table.Td>
                          );
                        }

                        const value = formatValue(summary[summaryRow.key], metric.unit);

                        return (
                          <Table.Td
                            key={`${team.teamNumber}-${metric.key}-${summaryRow.key}`}
                            className={classes.valueCell}
                          >
                            {value}
                          </Table.Td>
                        );
                      })}
                    </Table.Tr>
                  ))}
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
