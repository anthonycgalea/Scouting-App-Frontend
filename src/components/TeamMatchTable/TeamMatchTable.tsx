import { type ReactNode, useMemo, useState } from 'react';
import cx from 'clsx';
import { Alert, Center, Loader, ScrollArea, Table, Text } from '@mantine/core';
import { Endgame2025, TeamMatchData, useTeamMatchData } from '@/api';
import classes from './TeamMatchTable.module.css';

interface TeamMatchTableProps {
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

export function TeamMatchTable({ teamNumber }: TeamMatchTableProps) {
  const [scrolled, setScrolled] = useState(false);
  const {
    data,
    isLoading,
    isError,
  } = useTeamMatchData(teamNumber);

  const season = data?.[0]?.season;

  const seasonConfig = useMemo(() => {
    if (season) {
      return SEASON_TABLE_CONFIGS[season];
    }

    return undefined;
  }, [season]);

  if (!Number.isFinite(teamNumber)) {
    return <Alert color="red" title="Invalid team number" />;
  }

  if (isLoading) {
    return (
      <Center mih={200}>
        <Loader />
      </Center>
    );
  }

  if (isError) {
    return (
      <Alert color="red" title="Unable to load match data">
        We couldn't retrieve match data for Team {teamNumber}. Please try again later.
      </Alert>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Alert color="blue" title="No match data available">
        We do not have any match data for Team {teamNumber} at this event yet.
      </Alert>
    );
  }

  if (!seasonConfig) {
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

  const hasColumnGroups = seasonConfig.groups.length > 0;

  const groupHeaderCells = seasonConfig.groups.map((group) => (
    <Table.Th key={group.title} colSpan={group.columns.length} style={{ textAlign: 'center' }}>
      {group.title}
    </Table.Th>
  ));

  const groupColumnHeaders = seasonConfig.groups.flatMap((group) =>
    group.columns.map((column) => (
      <Table.Th key={`${group.title}-${column.key}`} style={{ textAlign: column.align ?? 'left', whiteSpace: 'nowrap' }}>
        {column.title}
      </Table.Th>
    )),
  );

  const rows = data.map((row, index) => (
    <Table.Tr key={`${row.match_level}-${row.match_number}-${row.user_id ?? index}`}>
      {seasonConfig.leadColumns.map((column) => (
        <Table.Td key={column.key} style={{ textAlign: column.align ?? 'left', whiteSpace: 'nowrap' }}>
          {column.render(row)}
        </Table.Td>
      ))}
      {seasonConfig.groups.flatMap((group) =>
        group.columns.map((column) => (
          <Table.Td key={`${group.title}-${column.key}`} style={{ textAlign: column.align ?? 'left' }}>
            {column.render(row)}
          </Table.Td>
        )),
      )}
      {seasonConfig.trailingColumns.map((column) => (
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
              {renderHeaderRow(seasonConfig.leadColumns, hasColumnGroups ? { rowSpan: 2 } : undefined)}
              {hasColumnGroups ? groupHeaderCells : null}
              {renderHeaderRow(seasonConfig.trailingColumns, hasColumnGroups ? { rowSpan: 2 } : undefined)}
            </Table.Tr>
            {hasColumnGroups ? <Table.Tr>{groupColumnHeaders}</Table.Tr> : null}
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </ScrollArea>
    </>
  );
}