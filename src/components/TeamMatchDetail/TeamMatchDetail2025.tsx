import { type ReactNode, useCallback, useMemo, useState } from 'react';
import cx from 'clsx';
import { Alert, Badge, Group, Rating, ScrollArea, Table, Text } from '@mantine/core';
import type {
  Endgame2025,
  SuperScoutField,
  SuperScoutMatchEntry,
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
  superScoutData: SuperScoutMatchEntry[];
  superScoutFields: SuperScoutField[];
  isSuperScoutLoading: boolean;
  isSuperScoutError: boolean;
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
  trailingGroups?: ColumnGroupDefinition[];
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
        columns: [
          {
            key: 'startPosition',
            title: 'Start Position',
            align: 'center',
            render: () => '—',
          },
          numberColumn('al4c', 'L4'),
          numberColumn('al3c', 'L3'),
          numberColumn('al2c', 'L2'),
          numberColumn('al1c', 'L1'),
        ],
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
    ],
    trailingGroups: [
      {
        title: 'Notes',
        columns: [
          {
            key: 'notes',
            title: 'Notes',
            render: (row) => row.notes?.trim() || '—',
          },
        ],
      },
      {
        title: 'SuperScout',
        columns: [
          {
            key: 'superScoutComments',
            title: 'Comments',
            render: () => '—',
          },
          {
            key: 'superScoutDriverAbility',
            title: 'Driver Ability',
            align: 'center',
            render: () => '—',
          },
          {
            key: 'superScoutOverall',
            title: 'Overall',
            align: 'center',
            render: () => '—',
          },
          {
            key: 'superScoutNotes',
            title: 'Notes',
            render: () => '—',
          },
        ],
      },
    ],
  },
};

const formatStartPosition = (value: string) =>
  value
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');

export function TeamMatchDetail2025({
  data,
  validationData,
  isValidationLoading,
  isValidationError,
  superScoutData,
  superScoutFields,
  isSuperScoutLoading,
  isSuperScoutError,
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

  const superScoutLookup = useMemo(() => {
    const entries = new Map<string, SuperScoutMatchEntry>();

    superScoutData.forEach((entry) => {
      entries.set(
        buildValidationKey(entry.match_level, entry.match_number, entry.team_number),
        entry
      );
    });

    return entries;
  }, [superScoutData]);

  const renderLoadingText = useCallback(
    () => (
      <Text size="sm" c="dimmed">
        Loading…
      </Text>
    ),
    []
  );

  const getSuperScoutEntry = useCallback(
    (row: TeamMatchData) =>
      superScoutLookup.get(
        buildValidationKey(row.match_level, row.match_number, row.team_number)
      ),
    [superScoutLookup]
  );

  const renderStartPositionCell = useCallback(
    (row: TeamMatchData) => {
      if (isSuperScoutLoading) {
        return renderLoadingText();
      }

      const entry = getSuperScoutEntry(row);
      const value = typeof entry?.startPosition === 'string' ? entry.startPosition.trim() : '';

      if (!value) {
        return '—';
      }

      return formatStartPosition(value);
    },
    [getSuperScoutEntry, isSuperScoutLoading, renderLoadingText]
  );

  const renderSuperScoutComments = useCallback(
    (row: TeamMatchData) => {
      if (isSuperScoutLoading) {
        return renderLoadingText();
      }

      const entry = getSuperScoutEntry(row);

      if (!entry) {
        return '—';
      }

      const record = entry as Record<string, unknown>;

      const activeFields = superScoutFields.filter((field) => record[field.key] === true);

      if (activeFields.length === 0) {
        return '—';
      }

      return (
        <Group gap={4} wrap="wrap" justify="flex-start">
          {activeFields.map((field) => (
            <Badge key={field.key} variant="light" size="sm">
              {field.label}
            </Badge>
          ))}
        </Group>
      );
    },
    [getSuperScoutEntry, isSuperScoutLoading, renderLoadingText, superScoutFields]
  );

  const renderSuperScoutRating = useCallback(
    (row: TeamMatchData, key: 'driver_rating' | 'robot_overall') => {
      if (isSuperScoutLoading) {
        return renderLoadingText();
      }

      const entry = getSuperScoutEntry(row);
      const rawValue =
        key === 'driver_rating' ? entry?.driver_rating ?? null : entry?.robot_overall ?? null;
      const value = typeof rawValue === 'number' ? rawValue : 0;

      if (!value) {
        return '—';
      }

      return <Rating value={value} count={5} readOnly size="sm" />;
    },
    [getSuperScoutEntry, isSuperScoutLoading, renderLoadingText]
  );

  const renderSuperScoutNotes = useCallback(
    (row: TeamMatchData) => {
      if (isSuperScoutLoading) {
        return renderLoadingText();
      }

      const entry = getSuperScoutEntry(row);
      const notes = typeof entry?.notes === 'string' ? entry.notes.trim() : '';

      return notes.length > 0 ? notes : '—';
    },
    [getSuperScoutEntry, isSuperScoutLoading, renderLoadingText]
  );

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

    const groups = seasonConfig.groups.map((group) => {
      if (group.title !== 'Autonomous Coral') {
        return group;
      }

      return {
        ...group,
        columns: group.columns.map((column) => {
          if (column.key !== 'startPosition') {
            return column;
          }

          return {
            ...column,
            render: (row: TeamMatchData) => renderStartPositionCell(row),
          };
        }),
      };
    });

    const trailingGroups = seasonConfig.trailingGroups?.map((group) => {
      if (group.title !== 'SuperScout') {
        return group;
      }

      return {
        ...group,
        columns: group.columns.map((column) => {
          if (column.key === 'superScoutComments') {
            return {
              ...column,
              render: (row: TeamMatchData) => renderSuperScoutComments(row),
            };
          }

          if (column.key === 'superScoutDriverAbility') {
            return {
              ...column,
              render: (row: TeamMatchData) => renderSuperScoutRating(row, 'driver_rating'),
            };
          }

          if (column.key === 'superScoutOverall') {
            return {
              ...column,
              render: (row: TeamMatchData) => renderSuperScoutRating(row, 'robot_overall'),
            };
          }

          if (column.key === 'superScoutNotes') {
            return {
              ...column,
              render: (row: TeamMatchData) => renderSuperScoutNotes(row),
            };
          }

          return column;
        }),
      };
    });

    return {
      ...seasonConfig,
      leadColumns,
      groups,
      trailingGroups,
    };
  }, [
    isValidationError,
    isValidationLoading,
    renderStartPositionCell,
    renderSuperScoutComments,
    renderSuperScoutNotes,
    renderSuperScoutRating,
    seasonConfig,
    validationLookup,
  ]);

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

  const trailingGroups = tableConfig.trailingGroups ?? [];
  const hasColumnGroups = tableConfig.groups.length > 0 || trailingGroups.length > 0;

  const groupHeaderCells = tableConfig.groups.map((group) => (
    <Table.Th key={group.title} colSpan={group.columns.length} style={{ textAlign: 'center' }}>
      {group.title}
    </Table.Th>
  ));

  const trailingGroupHeaderCells = trailingGroups.map((group) => (
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

  const trailingGroupColumnHeaders = trailingGroups.flatMap((group) =>
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
      {trailingGroups.flatMap((group) =>
        group.columns.map((column) => (
          <Table.Td key={`${group.title}-${column.key}`} style={{ textAlign: column.align ?? 'left' }}>
            {column.render(row)}
          </Table.Td>
        )),
      )}
    </Table.Tr>
  ));

  return (
    <>
      {isSuperScoutError ? (
        <Alert color="red" title="Unable to load SuperScout data" mb="sm">
          We could not retrieve SuperScout observations for this team. The table may be missing
          supplemental comments.
        </Alert>
      ) : null}
      <ScrollArea
        h={400}
        scrollbars="xy"
        onScrollPositionChange={({ y }) => setScrolled(y !== 0)}
      >
        <Table miw={1100}>
          <Table.Thead className={cx(classes.header, { [classes.scrolled]: scrolled })}>
            <Table.Tr>
              {renderHeaderRow(tableConfig.leadColumns, hasColumnGroups ? { rowSpan: 2 } : undefined)}
              {hasColumnGroups ? groupHeaderCells : null}
              {renderHeaderRow(tableConfig.trailingColumns, hasColumnGroups ? { rowSpan: 2 } : undefined)}
              {hasColumnGroups ? trailingGroupHeaderCells : null}
            </Table.Tr>
            {hasColumnGroups ? (
              <Table.Tr>
                {groupColumnHeaders}
                {trailingGroupColumnHeaders}
              </Table.Tr>
            ) : null}
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </ScrollArea>
    </>
  );
}
