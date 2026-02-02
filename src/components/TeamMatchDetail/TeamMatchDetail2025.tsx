import { type ReactNode, useCallback, useMemo, useState } from 'react';
import cx from 'clsx';
import {
  Alert,
  Anchor,
  Badge,
  Group,
  Loader,
  Rating,
  ScrollArea,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { Link } from '@tanstack/react-router';
import type { MatchScheduleEntry, SuperScoutField, SuperScoutMatchEntry, TeamMatchData } from '@/api';
import classes from './TeamMatchDetail2025.module.css';

interface TeamMatchDetail2025Props {
  data: TeamMatchData[];
  superScoutData: SuperScoutMatchEntry[];
  superScoutFields: SuperScoutField[];
  isSuperScoutLoading: boolean;
  isSuperScoutError: boolean;
  upcomingMatches: MatchScheduleEntry[];
  isUpcomingLoading: boolean;
  isUpcomingError: boolean;
  totalScheduledMatches: number;
  teamNumber: number;
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
        numberColumn('autoPass', 'Pass'),
        numberColumn('autoClimb', 'Climb'),
      ],
    },
    {
      title: 'Teleop',
      columns: [numberColumn('teleopFuel', 'Fuel'), numberColumn('teleopPass', 'Pass')],
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
          key: 'superScoutDefense',
          title: 'Defense',
          align: 'center',
          render: () => '—',
        },
        {
          key: 'superScoutOverall',
          title: 'Overall',
          align: 'center',
          render: () => '—',
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
            key: 'superScoutDefense',
            title: 'Defense',
            align: 'center',
            render: () => '—',
          },
          {
            key: 'superScoutOverall',
            title: 'Overall',
            align: 'center',
            render: () => '—',
          },
        ],
      },
    ],
  },
  2: SEASON_2026_MATCH_CONFIG,
  2026: SEASON_2026_MATCH_CONFIG,
};

const formatStartPosition = (value: string) =>
  value
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');

export function TeamMatchDetail2025({
  data,
  superScoutData,
  superScoutFields,
  isSuperScoutLoading,
  isSuperScoutError,
  upcomingMatches,
  isUpcomingLoading,
  isUpcomingError,
  totalScheduledMatches,
  teamNumber,
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
    (
      row: TeamMatchData,
      key: 'driver_rating' | 'defense_rating' | 'robot_overall',
      options?: { nullLabel?: string }
    ) => {
      if (isSuperScoutLoading) {
        return renderLoadingText();
      }

      const entry = getSuperScoutEntry(row);
      const nullLabel = options?.nullLabel ?? '—';
      const rawValue =
        key === 'driver_rating'
          ? entry?.driver_rating ?? null
          : key === 'defense_rating'
            ? entry?.defense_rating ?? null
            : entry?.robot_overall ?? null;
      const value = typeof rawValue === 'number' ? rawValue : 0;

      if (!value) {
        return nullLabel;
      }

      return <Rating value={value} count={3} readOnly size="sm" />;
    },
    [getSuperScoutEntry, isSuperScoutLoading, renderLoadingText]
  );

  const renderNotesCell = useCallback(
    (row: TeamMatchData) => {
      const matchNotes = typeof row.notes === 'string' ? row.notes.trim() : '';

      if (isSuperScoutLoading) {
        return matchNotes || renderLoadingText();
      }

      const superScoutNotes = (() => {
        const entry = getSuperScoutEntry(row);
        return typeof entry?.notes === 'string' ? entry.notes.trim() : '';
      })();

      const combinedNotes = [matchNotes, superScoutNotes].filter((value) => value.length > 0);

      if (combinedNotes.length === 0) {
        return '—';
      }

      return combinedNotes.join('; ');
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
        render: (row: TeamMatchData) => formatMatchIdentifier(row),
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

          if (column.key === 'superScoutDefense') {
            return {
              ...column,
              render: (row: TeamMatchData) =>
                renderSuperScoutRating(row, 'defense_rating', { nullLabel: 'N/A' }),
            };
          }

          if (column.key === 'superScoutOverall') {
            return {
              ...column,
              render: (row: TeamMatchData) => renderSuperScoutRating(row, 'robot_overall'),
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
    renderStartPositionCell,
    renderNotesCell,
    renderSuperScoutComments,
    renderSuperScoutRating,
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

  return (
    <Stack gap="lg" h="100%" style={{ flex: 1, minHeight: 0 }}>
      <Stack gap="sm" style={{ flex: 2, minHeight: 0 }}>
        {isSuperScoutError ? (
          <Alert color="red" title="Unable to load SuperScout data">
            We could not retrieve SuperScout observations for this team. The table may be missing
            supplemental comments.
          </Alert>
        ) : null}
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
      <Stack gap="xs" style={{ flex: 1, minHeight: 0 }}>
        <Text fw={600}>Upcoming Matches</Text>
        {renderUpcomingContent()}
      </Stack>
    </Stack>
  );
}
