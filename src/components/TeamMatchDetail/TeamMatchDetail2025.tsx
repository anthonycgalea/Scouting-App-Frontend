import { type ReactNode, useMemo, useState } from 'react';
import cx from 'clsx';
import { Alert, Group, ScrollArea, Table, Text } from '@mantine/core';
import type {
  Endgame2025,
  TeamMatchData,
  TeamMatchValidationEntry,
  TeamMatchValidationStatus,
} from '@/api';
import { ValidationStatusIcon } from '../ValidationStatusIcon';
import classes from './TeamMatchDetail2025.module.css';

interface TeamMatchDetail2025Props {
  data: TeamMatchData[];
  validationData: TeamMatchValidationEntry[];
  isValidationLoading: boolean;
  isValidationError: boolean;
}

type ColumnAlignment = 'left' | 'center' | 'right';

interface ColumnDefinition {
  key: string;
  title: string;
  render: (row: TeamMatchData) => ReactNode;
  align?: ColumnAlignment;
}

interface ColumnGroupDefinition {
  title: string;
  columns: ColumnDefinition[];
}

interface SeasonMatchTableConfig {
  leadColumns: ColumnDefinition[];
  groups: ColumnGroupDefinition[];
  trailingColumns: ColumnDefinition[];
}

const ENDGAME_2025_LABELS: Record<Endgame2025, string> = {
  NONE: 'None',
  PARK: 'Park',
  SHALLOW: 'Shallow',
  DEEP: 'Deep',
};

const numberColumn = (key: keyof TeamMatchData & string, title: string): ColumnDefinition => ({
  key,
  title,
  align: 'center',
  render: (row) => row[key] ?? 0,
});

const formatMatchIdentifier = (row: TeamMatchData) => {
  const level = typeof row.match_level === 'string' ? row.match_level.toUpperCase() : String(row.match_level ?? '');
  return `${level}${row.match_number}`;
};

const buildValidationKey = (
  matchLevel: string | null | undefined,
  matchNumber: number | null | undefined,
  teamNumber: number | null | undefined
) => `${(matchLevel ?? '').toLowerCase()}-${matchNumber ?? 0}-${teamNumber ?? 0}`;

const MATCH_LEVEL_PRIORITY: Record<string, number> = {
  QM: 0,
  SF: 1,
  F: 2,
};

const getMatchLevelPriority = (level: string) =>
  MATCH_LEVEL_PRIORITY[level] ?? Number.MAX_SAFE_INTEGER;

const SEASON_TABLE_CONFIGS: Record<number, SeasonMatchTableConfig> = {
  1: {
    leadColumns: [
      {
        key: 'match',
        title: 'Match #',
        align: 'center',
        render: (row) => formatMatchIdentifier(row),
      },
    ],
    groups: [
      {
        title: 'Autonomous Coral',
        columns: [numberColumn('al4c', 'L4'), numberColumn('al3c', 'L3'), numberColumn('al2c', 'L2'), numberColumn('al1c', 'L1')],
      },
      {
        title: 'Autonomous Algae',
        columns: [numberColumn('aNet', 'Net'), numberColumn('aProcessor', 'Processor')],
      },
      {
        title: 'Teleop Coral',
        columns: [numberColumn('tl4c', 'L4'), numberColumn('tl3c', 'L3'), numberColumn('tl2c', 'L2'), numberColumn('tl1c', 'L1')],
      },
      {
        title: 'Teleop Algae',
        columns: [numberColumn('tNet', 'Net'), numberColumn('tProcessor', 'Processor')],
      },
    ],
    trailingColumns: [
      {
        key: 'endgame',
        title: 'Endgame',
        align: 'center',
        render: (row) => ENDGAME_2025_LABELS[row.endgame] ?? row.endgame,
      },
      {
        key: 'notes',
        title: 'Notes',
        render: (row) => row.notes?.trim() || '—',
      },
    ],
  },
};

export function TeamMatchDetail2025({
  data,
  validationData,
  isValidationLoading,
  isValidationError,
}: TeamMatchDetail2025Props) {
  const [scrolled, setScrolled] = useState(false);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const priorityA = getMatchLevelPriority(String(a.match_level ?? '').trim().toUpperCase());
      const priorityB = getMatchLevelPriority(String(b.match_level ?? '').trim().toUpperCase());

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return (a.match_number ?? 0) - (b.match_number ?? 0);
    });
  }, [data]);

  const season = data[0]?.season;

  const seasonConfig = useMemo(() => {
    if (season) {
      return SEASON_TABLE_CONFIGS[season];
    }

    return undefined;
  }, [season]);

  const validationLookup = useMemo(() => {
    const entries = new Map<string, TeamMatchValidationStatus>();

    validationData.forEach((entry) => {
      entries.set(
        buildValidationKey(entry.match_level, entry.match_number, entry.team_number),
        entry.validation_status
      );
    });

    return entries;
  }, [validationData]);

  const tableConfig = useMemo(() => {
    if (!seasonConfig) {
      return undefined;
    }

    const leadColumns = seasonConfig.leadColumns.map((column) => {
      if (column.key !== 'match') {
        return column;
      }

      return {
        ...column,
        render: (row: TeamMatchData) => {
          const status = validationLookup.get(
            buildValidationKey(row.match_level, row.match_number, row.team_number)
          );

          return (
            <Group justify="center" align="center" gap="xs" wrap="nowrap">
              <Text>{formatMatchIdentifier(row)}</Text>
              <ValidationStatusIcon
                status={status}
                isLoading={isValidationLoading}
                isError={isValidationError}
              />
            </Group>
          );
        },
      };
    });

    return {
      ...seasonConfig,
      leadColumns,
    };
  }, [isValidationError, isValidationLoading, seasonConfig, validationLookup]);

  if (!tableConfig) {
    return (
      <Alert color="yellow" title="Unsupported season">
        Match data for season {season ?? 'Unknown'} is not configured yet. Please update the table configuration.
      </Alert>
    );
  }

  const renderHeaderRow = (columns: ColumnDefinition[], options?: { rowSpan?: number }) =>
    columns.map((column) => (
      <Table.Th
        key={column.key}
        rowSpan={options?.rowSpan}
        style={{ textAlign: column.align ?? 'left', whiteSpace: 'nowrap' }}
      >
        {column.title}
      </Table.Th>
    ));

  const hasColumnGroups = tableConfig.groups.length > 0;

  const groupHeaderCells = tableConfig.groups.map((group) => (
    <Table.Th key={group.title} colSpan={group.columns.length} style={{ textAlign: 'center' }}>
      {group.title}
    </Table.Th>
  ));

  const groupColumnHeaders = tableConfig.groups.flatMap((group) =>
    group.columns.map((column) => (
      <Table.Th key={`${group.title}-${column.key}`} style={{ textAlign: column.align ?? 'left', whiteSpace: 'nowrap' }}>
        {column.title}
      </Table.Th>
    )),
  );

  const rows = sortedData.map((row, index) => (
    <Table.Tr key={`${row.match_level}-${row.match_number}-${row.user_id ?? index}`}>
      {tableConfig.leadColumns.map((column) => (
        <Table.Td key={column.key} style={{ textAlign: column.align ?? 'left', whiteSpace: 'nowrap' }}>
          {column.render(row)}
        </Table.Td>
      ))}
      {tableConfig.groups.flatMap((group) =>
        group.columns.map((column) => (
          <Table.Td key={`${group.title}-${column.key}`} style={{ textAlign: column.align ?? 'left' }}>
            {column.render(row)}
          </Table.Td>
        )),
      )}
      {tableConfig.trailingColumns.map((column) => (
        <Table.Td key={column.key} style={{ textAlign: column.align ?? 'left' }}>
          {column.render(row)}
        </Table.Td>
      ))}
    </Table.Tr>
  ));

  return (
    <>
      <ScrollArea h={400} onScrollPositionChange={({ y }) => setScrolled(y !== 0)}>
        <Table miw={900}>
          <Table.Thead className={cx(classes.header, { [classes.scrolled]: scrolled })}>
            <Table.Tr>
              {renderHeaderRow(tableConfig.leadColumns, hasColumnGroups ? { rowSpan: 2 } : undefined)}
              {hasColumnGroups ? groupHeaderCells : null}
              {renderHeaderRow(tableConfig.trailingColumns, hasColumnGroups ? { rowSpan: 2 } : undefined)}
            </Table.Tr>
            {hasColumnGroups ? <Table.Tr>{groupColumnHeaders}</Table.Tr> : null}
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </ScrollArea>
    </>
  );
}
