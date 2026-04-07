import { type ReactNode, useCallback, useMemo, useState } from 'react';
import cx from 'clsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Anchor,
  Button,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Link } from '@tanstack/react-router';
import {
  scoutMatchQueryKey,
  teamMatchDataQueryKey,
  teamMatchValidationQueryKey,
  updateMatchDataBatch,
  useUserRole,
  type MatchScheduleEntry,
  type TeamMatchData,
} from '@/api';
import classes from './TeamMatchDetail2025.module.css';

interface TeamMatchDetail2025Props {
  data: TeamMatchData[];
  upcomingMatches: MatchScheduleEntry[];
  isUpcomingLoading: boolean;
  isUpcomingError: boolean;
  totalScheduledMatches: number;
  teamNumber: number;
  showUpcomingMatches?: boolean;
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

type MatchDataEditableField =
  | 'al4c'
  | 'al3c'
  | 'al2c'
  | 'al1c'
  | 'tl4c'
  | 'tl3c'
  | 'tl2c'
  | 'tl1c'
  | 'aNet'
  | 'tNet'
  | 'aProcessor'
  | 'tProcessor'
  | 'autoPass'
  | 'autoFuel'
  | 'autoClimb'
  | 'teleopFuel'
  | 'teleopPass'
  | 'endgame'
  | 'notes';

const EDITABLE_FIELDS: readonly MatchDataEditableField[] = [
  'al4c',
  'al3c',
  'al2c',
  'al1c',
  'tl4c',
  'tl3c',
  'tl2c',
  'tl1c',
  'aNet',
  'tNet',
  'aProcessor',
  'tProcessor',
  'autoPass',
  'autoFuel',
  'autoClimb',
  'teleopFuel',
  'teleopPass',
  'endgame',
  'notes',
];

const formatEndgameLabel = (value: string | null | undefined) => {
  if (!value) {
    return '—';
  }

  const normalized = value.trim();

  if (normalized.toUpperCase() === 'NONE') {
    return 'None';
  }

  return normalized
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
};

const numberColumn = (key: string, title: string): ColumnDefinition => ({
  key,
  title,
  align: 'center',
  render: (row) => {
    const value = (row as unknown as Record<string, unknown>)[key];

    if (typeof value === 'number') {
      return value;
    }

    if (value === null || value === undefined) {
      return 0;
    }

    return String(value);
  },
});

const formatMatchIdentifier = (row: TeamMatchData) => {
  const level = typeof row.match_level === 'string' ? row.match_level.toUpperCase() : String(row.match_level ?? '');
  return `${level}${row.match_number}`;
};

const MATCH_LEVEL_PRIORITY: Record<string, number> = {
  QM: 0,
  SF: 1,
  F: 2,
};

const getMatchLevelPriority = (level: string) =>
  MATCH_LEVEL_PRIORITY[level] ?? Number.MAX_SAFE_INTEGER;

type Alliance = 'red' | 'blue';

type TeamPositionKey =
  | 'red1_id'
  | 'red2_id'
  | 'red3_id'
  | 'blue1_id'
  | 'blue2_id'
  | 'blue3_id';

const TEAM_POSITIONS: Array<{ key: TeamPositionKey; alliance: Alliance; position: number }> = [
  { key: 'red1_id', alliance: 'red', position: 1 },
  { key: 'red2_id', alliance: 'red', position: 2 },
  { key: 'red3_id', alliance: 'red', position: 3 },
  { key: 'blue1_id', alliance: 'blue', position: 1 },
  { key: 'blue2_id', alliance: 'blue', position: 2 },
  { key: 'blue3_id', alliance: 'blue', position: 3 },
];

const MATCH_LEVEL_LABELS: Record<string, string> = {
  qm: 'Qualification',
  sf: 'Playoff',
  f: 'Final',
};

const SEASON_2026_MATCH_CONFIG: SeasonMatchTableConfig = {
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
      title: 'Autonomous',
      columns: [
        numberColumn('autoFuel', 'Fuel'),
        numberColumn('autoClimb', 'Climb'),
      ],
    },
    {
      title: 'Teleop',
      columns: [numberColumn('teleopFuel', 'Fuel')],
    },
  ],
  trailingColumns: [
    {
      key: 'endgame',
      title: 'Endgame',
      align: 'center',
      render: (row) => formatEndgameLabel(row.endgame),
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
  ],
};

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
        render: (row) => formatEndgameLabel(row.endgame),
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
    ],
  },
  2: SEASON_2026_MATCH_CONFIG,
  2026: SEASON_2026_MATCH_CONFIG,
};

export function TeamMatchDetail2025({
  data,
  upcomingMatches,
  isUpcomingLoading,
  isUpcomingError,
  totalScheduledMatches,
  teamNumber,
  showUpcomingMatches = true,
}: TeamMatchDetail2025Props) {
  const [scrolled, setScrolled] = useState(false);
  const [editingMatchKey, setEditingMatchKey] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Record<MatchDataEditableField, string>>>({});
  const { data: userRole } = useUserRole();
  const canEditMatches = userRole?.role === 'ADMIN' || userRole?.role === 'LEAD';
  const queryClient = useQueryClient();
  const { mutateAsync: submitMatchEdit, isPending: isSubmittingEdit } = useMutation({
    mutationFn: updateMatchDataBatch,
  });

  const getMatchKey = useCallback(
    (row: TeamMatchData) => `${String(row.match_level ?? '').toLowerCase()}-${row.match_number}`,
    []
  );

  const startEditing = useCallback((row: TeamMatchData) => {
    const nextEditValues: Partial<Record<MatchDataEditableField, string>> = {};
    const rowValues = row as unknown as Record<string, unknown>;

    EDITABLE_FIELDS.forEach((field) => {
      const value = rowValues[field];

      if (value === undefined || value === null) {
        nextEditValues[field] = '';
        return;
      }

      nextEditValues[field] = String(value);
    });

    setEditingMatchKey(getMatchKey(row));
    setEditValues(nextEditValues);
  }, [getMatchKey]);

  const stopEditing = useCallback(() => {
    setEditingMatchKey(null);
    setEditValues({});
  }, []);

  const updateEditValue = useCallback((field: MatchDataEditableField, value: string) => {
    setEditValues((previous) => ({ ...previous, [field]: value }));
  }, []);

  const parseEditedValue = useCallback(
    (field: MatchDataEditableField, currentValue: unknown) => {
      const rawInput = editValues[field] ?? '';
      const trimmed = rawInput.trim();

      if (field === 'notes') {
        return trimmed.length > 0 ? trimmed : null;
      }

      if (typeof currentValue === 'number') {
        if (trimmed.length === 0) {
          return 0;
        }

        const parsedNumber = Number(trimmed);

        if (!Number.isFinite(parsedNumber)) {
          throw new Error(`"${rawInput}" is not a valid value for ${field}.`);
        }

        return parsedNumber;
      }

      if (trimmed.length === 0) {
        return currentValue;
      }

      return trimmed;
    },
    [editValues]
  );

  const handleSubmitEdit = useCallback(async (row: TeamMatchData) => {
    try {
      const updatedMatch = { ...row };
      const rowValues = row as unknown as Record<string, unknown>;
      const mutableMatch = updatedMatch as Record<string, unknown>;

      EDITABLE_FIELDS.forEach((field) => {
        if (rowValues[field] === undefined) {
          return;
        }

        mutableMatch[field] = parseEditedValue(field, rowValues[field]);
      });

      await submitMatchEdit([updatedMatch]);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: teamMatchDataQueryKey(teamNumber) }),
        queryClient.invalidateQueries({ queryKey: teamMatchValidationQueryKey() }),
        queryClient.invalidateQueries({ queryKey: scoutMatchQueryKey() }),
      ]);

      notifications.show({
        color: 'green',
        title: 'Match updated',
        message: `Saved edits for ${formatMatchIdentifier(row)}.`,
      });

      stopEditing();
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Unable to save match',
        message: error instanceof Error ? error.message : 'Failed to edit match data.',
      });
    }
  }, [parseEditedValue, queryClient, stopEditing, submitMatchEdit, teamNumber]);

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

  const inferredSeason = useMemo(() => {
    const firstRow = data[0];

    if (!firstRow) {
      return undefined;
    }

    if ('autoPass' in firstRow || 'autoFuel' in firstRow || 'teleopFuel' in firstRow) {
      return 2;
    }

    if ('al4c' in firstRow || 'aNet' in firstRow || 'tProcessor' in firstRow) {
      return 1;
    }

    return undefined;
  }, [data]);

  const resolvedSeason = inferredSeason ?? season;

  const seasonConfig = useMemo(() => {
    if (resolvedSeason) {
      return SEASON_TABLE_CONFIGS[resolvedSeason];
    }

    return undefined;
  }, [resolvedSeason]);

  const renderNotesCell = useCallback(
    (row: TeamMatchData) => row.notes?.trim() || '—',
    []
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
        render: (row: TeamMatchData) => formatMatchIdentifier(row),
      };
    });

    const groups = seasonConfig.groups;

    const trailingGroups = seasonConfig.trailingGroups?.map((group) => {
      if (group.title === 'Notes') {
        return {
          ...group,
          columns: group.columns.map((column) => {
            if (column.key === 'notes') {
              return {
                ...column,
                render: (row: TeamMatchData) => renderNotesCell(row),
              };
            }

            return column;
          }),
        };
      }

      return group;
    });

    return {
      ...seasonConfig,
      leadColumns,
      groups,
      trailingGroups,
    };
  }, [
    renderNotesCell,
    seasonConfig,
  ]);

  if (!tableConfig) {
    return (
      <Alert color="yellow" title="Unsupported season">
        Match data for season {resolvedSeason ?? 'Unknown'} is not configured yet. Please update the table configuration.
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

  const renderEditableCell = (row: TeamMatchData, column: ColumnDefinition) => {
    const fieldKey = column.key as MatchDataEditableField;
    const rowValue = (row as unknown as Record<string, unknown>)[fieldKey];

    if (!canEditMatches || editingMatchKey !== getMatchKey(row) || rowValue === undefined) {
      return column.render(row);
    }

    return (
      <TextInput
        size="xs"
        value={editValues[fieldKey] ?? ''}
        onChange={(event) => updateEditValue(fieldKey, event.currentTarget.value)}
      />
    );
  };

  const rows = sortedData.map((row, index) => (
    <Table.Tr key={`${row.match_level}-${row.match_number}-${row.user_id ?? index}`}>
      {tableConfig.leadColumns.map((column) => (
        <Table.Td key={column.key} style={{ textAlign: column.align ?? 'left', whiteSpace: 'nowrap' }}>
          {renderEditableCell(row, column)}
        </Table.Td>
      ))}
      {tableConfig.groups.flatMap((group) =>
        group.columns.map((column) => (
          <Table.Td key={`${group.title}-${column.key}`} style={{ textAlign: column.align ?? 'left' }}>
            {renderEditableCell(row, column)}
          </Table.Td>
        )),
      )}
      {tableConfig.trailingColumns.map((column) => (
        <Table.Td key={column.key} style={{ textAlign: column.align ?? 'left' }}>
          {renderEditableCell(row, column)}
        </Table.Td>
      ))}
      {trailingGroups.flatMap((group) =>
        group.columns.map((column) => (
          <Table.Td key={`${group.title}-${column.key}`} style={{ textAlign: column.align ?? 'left' }}>
            {renderEditableCell(row, column)}
          </Table.Td>
        )),
      )}
      {canEditMatches ? (
        <Table.Td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
          {editingMatchKey === getMatchKey(row) ? (
            <Group gap="xs" justify="flex-end">
              <Button size="xs" onClick={() => void handleSubmitEdit(row)} loading={isSubmittingEdit}>
                Submit
              </Button>
              <Button size="xs" variant="default" onClick={stopEditing} disabled={isSubmittingEdit}>
                Cancel
              </Button>
            </Group>
          ) : (
            <Button size="xs" variant="light" onClick={() => startEditing(row)}>
              Edit
            </Button>
          )}
        </Table.Td>
      ) : null}
    </Table.Tr>
  ));

  const allianceLabel = useCallback((alliance: Alliance | undefined, position: number | undefined) => {
    if (!alliance || !position) {
      return '—';
    }

    const label = alliance === 'red' ? 'Red' : 'Blue';

    return `${label} ${position}`;
  }, []);

  const formatTeamList = useCallback((teams: Array<number | null | undefined>, options?: { exclude?: number }) => {
    const filtered = teams
      .filter((team): team is number => typeof team === 'number' && Number.isFinite(team))
      .filter((team) => (options?.exclude !== undefined ? team !== options.exclude : true));

    if (filtered.length === 0) {
      return '—';
    }

    return filtered.join(', ');
  }, []);

  const upcomingMatchRows = useMemo(() => {
    return upcomingMatches.map((match) => {
      const matchKey = `${String(match.match_level ?? '').toLowerCase()}-${match.match_number}`;
      const assignment = TEAM_POSITIONS.find((position) => match[position.key] === teamNumber);
      const alliance = assignment?.alliance;
      const position = assignment?.position;
      const normalizedLevel = String(match.match_level ?? '').trim().toLowerCase();
      const levelLabel = MATCH_LEVEL_LABELS[normalizedLevel] ?? String(match.match_level ?? '').toUpperCase();
      const matchNumber = match.match_number;
      const matchLabel =
        typeof matchNumber === 'number' ? `${levelLabel} ${matchNumber}` : levelLabel;
      const hasPreviewLink = normalizedLevel.length > 0 && typeof matchNumber === 'number';
      const matchPreviewPath = hasPreviewLink
        ? `/matches/preview/${normalizedLevel}/${matchNumber}`
        : undefined;
      const alliedTeams: Array<number | null | undefined> =
        alliance === 'blue'
          ? [match.blue1_id, match.blue2_id, match.blue3_id]
          : [match.red1_id, match.red2_id, match.red3_id];
      const opponentTeams: Array<number | null | undefined> =
        alliance === 'blue'
          ? [match.red1_id, match.red2_id, match.red3_id]
          : [match.blue1_id, match.blue2_id, match.blue3_id];

      return (
        <Table.Tr key={matchKey}>
          <Table.Td>
            {matchPreviewPath ? (
              <Anchor component={Link} to={matchPreviewPath}>
                {matchLabel}
              </Anchor>
            ) : (
              matchLabel
            )}
          </Table.Td>
          <Table.Td>{allianceLabel(alliance, position)}</Table.Td>
          <Table.Td>{formatTeamList(alliedTeams, { exclude: teamNumber })}</Table.Td>
          <Table.Td>{formatTeamList(opponentTeams)}</Table.Td>
        </Table.Tr>
      );
    });
  }, [allianceLabel, formatTeamList, teamNumber, upcomingMatches]);

  const renderUpcomingContent = () => {
    if (isUpcomingLoading) {
      return (
        <Group gap="xs">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">
            Loading upcoming matches…
          </Text>
        </Group>
      );
    }

    if (isUpcomingError) {
      return (
        <Alert color="red" title="Unable to load upcoming matches">
          We could not retrieve the match schedule for this team. Upcoming matches will
          appear when the schedule is available.
        </Alert>
      );
    }

    if (totalScheduledMatches === 0) {
      return (
        <Text size="sm" c="dimmed">
          Upcoming matches will appear once the match schedule is available.
        </Text>
      );
    }

    if (upcomingMatches.length === 0) {
      return (
        <Text size="sm" c="dimmed">
          All scheduled matches for Team {teamNumber} currently have recorded scouting data.
        </Text>
      );
    }

    return (
      <ScrollArea
        scrollbars="xy"
        onScrollPositionChange={({ y }) => setScrolled(y !== 0)}
        style={{ flex: 1, minHeight: 0 }}
      >
        <Table striped withColumnBorders highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Match</Table.Th>
              <Table.Th>Alliance</Table.Th>
              <Table.Th>Partners</Table.Th>
              <Table.Th>Opponents</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{upcomingMatchRows}</Table.Tbody>
        </Table>
      </ScrollArea>
    );
  };

  const table = (
    <Stack gap="sm" style={{ flex: 2, minHeight: 0 }}>
      <ScrollArea
        scrollbars="xy"
        onScrollPositionChange={({ y }) => setScrolled(y !== 0)}
        style={{ flex: 1, minHeight: 0 }}
      >
        <Table miw={1100}>
          <Table.Thead className={cx(classes.header, { [classes.scrolled]: scrolled })}>
            <Table.Tr>
              {renderHeaderRow(tableConfig.leadColumns, hasColumnGroups ? { rowSpan: 2 } : undefined)}
              {hasColumnGroups ? groupHeaderCells : null}
              {renderHeaderRow(tableConfig.trailingColumns, hasColumnGroups ? { rowSpan: 2 } : undefined)}
              {hasColumnGroups ? trailingGroupHeaderCells : null}
              {canEditMatches ? (
                <Table.Th rowSpan={hasColumnGroups ? 2 : undefined} style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  Actions
                </Table.Th>
              ) : null}
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
    </Stack>
  );

  if (!showUpcomingMatches) {
    return table;
  }

  return (
    <Stack gap="lg" h="100%" style={{ flex: 1, minHeight: 0 }}>
      {table}
      <Stack gap="xs" style={{ flex: 1, minHeight: 0 }}>
        <Text fw={600}>Upcoming Matches</Text>
        {renderUpcomingContent()}
      </Stack>
    </Stack>
  );
}
