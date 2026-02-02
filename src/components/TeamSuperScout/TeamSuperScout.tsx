import { useMemo } from 'react';
import { Alert, Badge, Center, Group, Loader, Rating, ScrollArea, Stack, Table, Text } from '@mantine/core';
import { useSuperScoutFields, useSuperScoutMatchData } from '@/api';

type TeamSuperScoutProps = {
  teamNumber: number;
};

const MATCH_LEVEL_PRIORITY: Record<string, number> = {
  QM: 0,
  SF: 1,
  F: 2,
};

const getMatchLevelPriority = (level: string) =>
  MATCH_LEVEL_PRIORITY[level] ?? Number.MAX_SAFE_INTEGER;

const formatMatchIdentifier = (matchLevel: string | null | undefined, matchNumber: number | null | undefined) => {
  const level = typeof matchLevel === 'string' ? matchLevel.toUpperCase() : String(matchLevel ?? '');
  const numberLabel = typeof matchNumber === 'number' ? matchNumber : '';
  return `${level}${numberLabel}`;
};

const formatStartPosition = (value: string | null | undefined) => {
  if (!value) {
    return '—';
  }

  return value
    .trim()
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
};

export function TeamSuperScout({ teamNumber }: TeamSuperScoutProps) {
  const {
    data: superScoutData = [],
    isLoading: isSuperScoutLoading,
    isError: isSuperScoutError,
  } = useSuperScoutMatchData(teamNumber);
  const {
    data: superScoutFields = [],
    isLoading: isSuperScoutFieldsLoading,
    isError: isSuperScoutFieldsError,
  } = useSuperScoutFields();

  const sortedEntries = useMemo(() => {
    return [...superScoutData].sort((a, b) => {
      const priorityA = getMatchLevelPriority(String(a.match_level ?? '').trim().toUpperCase());
      const priorityB = getMatchLevelPriority(String(b.match_level ?? '').trim().toUpperCase());

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return (a.match_number ?? 0) - (b.match_number ?? 0);
    });
  }, [superScoutData]);

  const isLoading = isSuperScoutLoading || isSuperScoutFieldsLoading;
  const isError = isSuperScoutError || isSuperScoutFieldsError;

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
      <Alert color="red" title="Unable to load SuperScout data">
        We couldn&apos;t retrieve SuperScout observations for Team {teamNumber}. Please try again later.
      </Alert>
    );
  }

  if (sortedEntries.length === 0) {
    return (
      <Alert color="blue" title="No SuperScout data available">
        We do not have any SuperScout observations for Team {teamNumber} at this event yet.
      </Alert>
    );
  }

  const rows = sortedEntries.map((entry) => {
    const record = entry as Record<string, unknown>;
    const activeFields = superScoutFields.filter((field) => record[field.key] === true);
    const driverRating = typeof entry.driver_rating === 'number' ? entry.driver_rating : 0;
    const defenseRating = typeof entry.defense_rating === 'number' ? entry.defense_rating : 0;
    const overallRating = typeof entry.robot_overall === 'number' ? entry.robot_overall : 0;
    const notes = typeof entry.notes === 'string' ? entry.notes.trim() : '';

    return (
      <Table.Tr key={`${entry.match_level}-${entry.match_number}-${entry.team_number}`}>
        <Table.Td style={{ whiteSpace: 'nowrap' }}>
          {formatMatchIdentifier(entry.match_level, entry.match_number)}
        </Table.Td>
        <Table.Td>{formatStartPosition(entry.startPosition)}</Table.Td>
        <Table.Td>
          {activeFields.length === 0 ? (
            '—'
          ) : (
            <Group gap={4} wrap="wrap">
              {activeFields.map((field) => (
                <Badge key={field.key} variant="light" size="sm">
                  {field.label}
                </Badge>
              ))}
            </Group>
          )}
        </Table.Td>
        <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
          {driverRating ? <Rating value={driverRating} count={3} readOnly size="sm" /> : '—'}
        </Table.Td>
        <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
          {defenseRating ? <Rating value={defenseRating} count={3} readOnly size="sm" /> : 'N/A'}
        </Table.Td>
        <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
          {overallRating ? <Rating value={overallRating} count={3} readOnly size="sm" /> : '—'}
        </Table.Td>
        <Table.Td>{notes || '—'}</Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Stack gap="xs" h="100%" style={{ minHeight: 0 }}>
      <Text fw={600}>SuperScout</Text>
      <ScrollArea scrollbars="xy" style={{ flex: 1, minHeight: 0 }}>
        <Table miw={900} striped withColumnBorders highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Match</Table.Th>
              <Table.Th>Start Position</Table.Th>
              <Table.Th>Observations</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Driver Ability</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Defense</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Overall</Table.Th>
              <Table.Th>Notes</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </ScrollArea>
    </Stack>
  );
}
