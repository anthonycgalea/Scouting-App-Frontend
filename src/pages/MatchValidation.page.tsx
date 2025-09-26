import { Fragment, useMemo } from 'react';
import { Box, Loader, Stack, Table, Text, Title } from '@mantine/core';
import { useParams } from '@tanstack/react-router';
import {
  type TeamMatchData,
  Endgame2025,
  useEventTbaMatchData,
  useMatchSchedule,
  useScoutMatch,
} from '@/api';
import {
  MATCH_VALIDATION_NUMERIC_FIELDS,
  MATCH_VALIDATION_TABLE_LAYOUT,
  MATCH_VALIDATION_TEAM_HEADERS,
  type MatchValidationNumericField,
  type MatchValidationPairedRowEntry,
} from './matchValidation.config';

const ENDGAME_LABELS: Record<Endgame2025, string> = {
  NONE: 'None',
  PARK: 'Park',
  SHALLOW: 'Shallow',
  DEEP: 'Deep',
};

interface TbaTeamEntry {
  teamNumber: number;
  data: Partial<TeamMatchData>;
}

const parseNumericValue = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const parseTeamNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const digits = value.match(/\d+/);

    if (digits) {
      return Number.parseInt(digits[0] ?? '', 10);
    }
  }

  return undefined;
};

const extractTeamEntryFromRecord = (record: Record<string, unknown>): TbaTeamEntry | undefined => {
  const teamNumber = parseTeamNumber(
    record.teamNumber ?? record.team_number ?? record.team ?? record.team_id ?? record.key
  );

  if (!Number.isFinite(teamNumber)) {
    return undefined;
  }

  const dataCandidate = record.data && typeof record.data === 'object' ? record.data : record;

  return {
    teamNumber,
    data: dataCandidate as Partial<TeamMatchData>,
  };
};

const normalizeTbaTeamEntries = (candidate: unknown): TbaTeamEntry[] => {
  if (!candidate) {
    return [];
  }

  if (Array.isArray(candidate)) {
    return candidate
      .map((item) => (item && typeof item === 'object' ? extractTeamEntryFromRecord(item) : undefined))
      .filter((entry): entry is TbaTeamEntry => Boolean(entry));
  }

  if (typeof candidate === 'object') {
    const entries: TbaTeamEntry[] = [];

    Object.entries(candidate).forEach(([key, value]) => {
      const teamNumberFromKey = parseTeamNumber(key);

      if (teamNumberFromKey && value && typeof value === 'object') {
        entries.push({
          teamNumber: teamNumberFromKey,
          data: value as Partial<TeamMatchData>,
        });

        return;
      }

      if (value && typeof value === 'object') {
        const entry = extractTeamEntryFromRecord(value as Record<string, unknown>);

        if (entry) {
          entries.push(entry);
        }
      }
    });

    return entries;
  }

  return [];
};

const extractTbaTeamEntries = (raw: unknown): TbaTeamEntry[] => {
  if (!raw || typeof raw !== 'object') {
    return [];
  }

  const root = raw as Record<string, unknown>;

  const candidates: unknown[] = [
    root.teams,
    root.teamData,
    root.team_data,
    root.robots,
    root.robotData,
    root.robot_data,
    root.bots,
    root.botData,
    root.bot_data,
    root.matchData,
    root.match_data,
  ];

  for (const candidate of candidates) {
    const entries = normalizeTbaTeamEntries(candidate);

    if (entries.length > 0) {
      return entries;
    }
  }

  return normalizeTbaTeamEntries(raw);
};

const formatEndgameValue = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();

  if ((normalized as Endgame2025) in ENDGAME_LABELS) {
    return ENDGAME_LABELS[normalized as Endgame2025];
  }

  if (normalized.length === 0) {
    return undefined;
  }

  return value;
};

const isValidNumber = (value: number | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const formatMatchLevel = (level: string) => level.toUpperCase();
const formatAlliance = (value: string) => value.toUpperCase();

export function MatchValidationPage() {
  const params = useParams({ from: '/dataValidation/matches/$matchLevel/$matchNumber/$alliance' });

  const matchLevelParam = (params.matchLevel ?? '').trim();
  const matchNumberParam = Number.parseInt(params.matchNumber ?? '', 10);
  const allianceParam = (params.alliance ?? '').trim().toUpperCase();

  const hasMatchLevel = matchLevelParam.length > 0;
  const hasMatchNumber = Number.isFinite(matchNumberParam);
  const hasAlliance = allianceParam === 'RED' || allianceParam === 'BLUE';

  const { data: schedule = [], isLoading, isError } = useMatchSchedule();

  const matchEntry = useMemo(() => {
    if (!hasMatchLevel || !hasMatchNumber) {
      return undefined;
    }

    const normalizedLevel = matchLevelParam.toUpperCase();

    return schedule.find(
      (entry) =>
        entry.match_level.toUpperCase() === normalizedLevel &&
        entry.match_number === matchNumberParam
    );
  }, [hasMatchLevel, hasMatchNumber, matchLevelParam, matchNumberParam, schedule]);

  const allianceTeams = useMemo(() => {
    if (!matchEntry || !hasAlliance) {
      return [];
    }

    if (allianceParam === 'RED') {
      return [matchEntry.red1_id, matchEntry.red2_id, matchEntry.red3_id];
    }

    return [matchEntry.blue1_id, matchEntry.blue2_id, matchEntry.blue3_id];
  }, [allianceParam, hasAlliance, matchEntry]);

  const tbaMatchDataRequestBody = useMemo(() => {
    if (!matchEntry || allianceTeams.length === 0) {
      return undefined;
    }

    return {
      matchNumber: matchEntry.match_number,
      matchLevel: matchEntry.match_level,
      teamNumber: allianceTeams[0],
      alliance: allianceParam as 'RED' | 'BLUE',
    };
  }, [allianceParam, allianceTeams, matchEntry]);

  const {
    data: tbaMatchDataResponse,
    isLoading: isTbaMatchDataLoading,
    isError: isTbaMatchDataError,
  } = useEventTbaMatchData(tbaMatchDataRequestBody);


  const safeMatchNumber = matchEntry?.match_number ?? Number.NaN;
  const safeMatchLevel = matchEntry?.match_level ?? '';

  const rawTeamNumbers: Array<number | undefined> = [
    allianceTeams[0],
    allianceTeams[1],
    allianceTeams[2],
  ];

  const sanitizeTeamNumberForQuery = (value: number | undefined) =>
    isValidNumber(value) ? value : Number.NaN;

  const team1Query = useScoutMatch({
    matchNumber: safeMatchNumber,
    matchLevel: safeMatchLevel,
    teamNumber: sanitizeTeamNumberForQuery(rawTeamNumbers[0]),
  });
  const team2Query = useScoutMatch({
    matchNumber: safeMatchNumber,
    matchLevel: safeMatchLevel,
    teamNumber: sanitizeTeamNumberForQuery(rawTeamNumbers[1]),
  });
  const team3Query = useScoutMatch({
    matchNumber: safeMatchNumber,
    matchLevel: safeMatchLevel,
    teamNumber: sanitizeTeamNumberForQuery(rawTeamNumbers[2]),
  });

  const teamQueryStates = [
    { teamNumber: rawTeamNumbers[0], query: team1Query },
    { teamNumber: rawTeamNumbers[1], query: team2Query },
    { teamNumber: rawTeamNumbers[2], query: team3Query },
  ];

  const allianceTeamSet = useMemo(() => {
    const values = new Set<number>();

    allianceTeams.forEach((teamNumber) => {
      if (Number.isFinite(teamNumber)) {
        values.add(teamNumber);
      }
    });

    return values;
  }, [allianceTeams]);

  const tbaTeamEntries = useMemo(() => {
    if (!tbaMatchDataResponse) {
      return [] as TbaTeamEntry[];
    }

    const entries = extractTbaTeamEntries(tbaMatchDataResponse);

    if (entries.length === 0) {
      return [];
    }

    if (allianceTeamSet.size === 0) {
      return entries;
    }

    return entries.filter((entry) => allianceTeamSet.has(entry.teamNumber));
  }, [allianceTeamSet, tbaMatchDataResponse]);

  const aggregatedTbaData = useMemo(() => {
    const numericSums = new Map<MatchValidationNumericField, number>();
    const endgameMap = new Map<number, string>();

    if (tbaTeamEntries.length === 0) {
      return { numericSums, endgame: endgameMap };
    }

    const sumField = (field: MatchValidationNumericField) =>
      tbaTeamEntries.reduce((total, entry) => total + (parseNumericValue(entry.data[field]) ?? 0), 0);

    MATCH_VALIDATION_NUMERIC_FIELDS.forEach((field) => {
      numericSums.set(field, sumField(field));
    });

    tbaTeamEntries.forEach((entry) => {
      const label = formatEndgameValue(entry.data.endgame);

      if (label) {
        endgameMap.set(entry.teamNumber, label);
      }
    });

    return { numericSums, endgame: endgameMap };
  }, [tbaTeamEntries]);

  const getPlaceholderNode = () => (
    <Text c="dimmed" fz="sm">
      —
    </Text>
  );

  const getErrorNode = () => (
    <Text c="red.6" fz="xs">
      Error
    </Text>
  );

  const getLoaderNode = () => <Loader size="xs" />;

  const renderTeamNumericValue = (
    state: (typeof teamQueryStates)[number],
    field: MatchValidationNumericField
  ) => {
    if (!isValidNumber(state.teamNumber)) {
      return getPlaceholderNode();
    }

    if (state.query.isLoading) {
      return getLoaderNode();
    }

    if (state.query.isError) {
      return getErrorNode();
    }

    const data = state.query.data as Partial<TeamMatchData> | undefined;
    const numericValue = data ? parseNumericValue(data[field]) : undefined;

    return numericValue ?? 0;
  };

  const renderTeamEndgameValue = (state: (typeof teamQueryStates)[number]) => {
    if (!isValidNumber(state.teamNumber)) {
      return getPlaceholderNode();
    }

    if (state.query.isLoading) {
      return getLoaderNode();
    }

    if (state.query.isError) {
      return getErrorNode();
    }

    const data = state.query.data as Partial<TeamMatchData> | undefined;
    const label = data ? formatEndgameValue(data.endgame) ?? ENDGAME_LABELS.NONE : ENDGAME_LABELS.NONE;

    return label;
  };

  const renderTeamNumberCell = (teamNumber: number | undefined) => {
    if (!isValidNumber(teamNumber)) {
      return getPlaceholderNode();
    }

    return teamNumber;
  };

  const renderTbaNumericValue = (value: number | undefined) => {
    if (isTbaMatchDataLoading) {
      return getLoaderNode();
    }

    if (isTbaMatchDataError) {
      return getErrorNode();
    }

    if (value === undefined) {
      return getPlaceholderNode();
    }

    return value;
  };

  const renderTbaStackedValues = (entries: MatchValidationPairedRowEntry[]) => {
    if (isTbaMatchDataLoading) {
      return getLoaderNode();
    }

    if (isTbaMatchDataError) {
      return getErrorNode();
    }

    const hasValue = entries.some((entry) =>
      aggregatedTbaData.numericSums.get(entry.field) !== undefined
    );

    if (!hasValue) {
      return getPlaceholderNode();
    }

    return (
      <Stack gap={2} fz="sm">
        {entries.map((entry) => {
          const displayLabel = entry.displayLabel ?? entry.label;
          const value = aggregatedTbaData.numericSums.get(entry.field) ?? 0;

          return (
            <Text key={entry.id} fz="sm">
              {displayLabel}: {value}
            </Text>
          );
        })}
      </Stack>
    );
  };

  const renderTbaEndgameValue = (teamNumber: number | undefined) => {
    if (isTbaMatchDataLoading) {
      return getLoaderNode();
    }

    if (isTbaMatchDataError) {
      return getErrorNode();
    }

    if (!isValidNumber(teamNumber)) {
      return getPlaceholderNode();
    }

    return (
      <Text fz="sm">
        Team {teamNumber}: {aggregatedTbaData.endgame.get(teamNumber) ?? '—'}
      </Text>
    );
  };

  if (!hasMatchLevel || !hasMatchNumber || !hasAlliance) {
    return (
      <Box p="md">
        <Text c="red.6" fw={500}>
          The match details provided are incomplete. Please return to the Data Validation table and try again.
        </Text>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box p="md">
        <Loader />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box p="md">
        <Text c="red.6" fw={500}>
          Unable to load the match schedule. Please try again later.
        </Text>
      </Box>
    );
  }

  if (!matchEntry) {
    return (
      <Box p="md">
        <Text fw={500}>We couldn't find that match in the schedule.</Text>
      </Box>
    );
  }

  return (
    <Box p="md">
      <Stack gap="lg">
        <Stack gap="xs">
          <Title order={2}>Match Validation</Title>
          <Text>Match Level: {formatMatchLevel(matchLevelParam)}</Text>
          <Text>Match Number: {matchNumberParam}</Text>
          <Text>Alliance: {formatAlliance(allianceParam)}</Text>
          <Text>Teams: {allianceTeams.join(', ')}</Text>
        </Stack>

        {allianceTeams.length === 0 ? (
          <Text c="dimmed">No teams were found for this alliance.</Text>
        ) : (
          <Table striped withColumnBorders highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th />
                {MATCH_VALIDATION_TEAM_HEADERS.map((header) => (
                  <Table.Th key={header}>{header}</Table.Th>
                ))}
                <Table.Th>TBA</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Th scope="row">Team Number</Table.Th>
                {teamQueryStates.map((state, index) => (
                  <Table.Td key={`team-${state.teamNumber ?? index}`}>
                    {renderTeamNumberCell(state.teamNumber)}
                  </Table.Td>
                ))}
                <Table.Td>
                  {isTbaMatchDataLoading
                    ? getLoaderNode()
                    : isTbaMatchDataError
                      ? getErrorNode()
                      : tbaMatchDataRequestBody
                        ? `${formatAlliance(allianceParam)} Alliance`
                        : getPlaceholderNode()}
                </Table.Td>
              </Table.Tr>

              {MATCH_VALIDATION_TABLE_LAYOUT.map((section) => (
                <Fragment key={section.id}>
                  <Table.Tr>
                    <Table.Th scope="row" />
                    <Table.Th colSpan={4} ta="left">
                      {section.title}
                    </Table.Th>
                  </Table.Tr>

                  {section.rows.map((row) => {
                    if (row.type === 'numeric') {
                      return (
                        <Table.Tr key={`${section.id}-${row.id}`}>
                          <Table.Th scope="row">{row.label}</Table.Th>
                          {teamQueryStates.map((state, index) => (
                            <Table.Td key={`${row.id}-${index}`}>
                              {renderTeamNumericValue(state, row.field)}
                            </Table.Td>
                          ))}
                          <Table.Td>
                            {renderTbaNumericValue(aggregatedTbaData.numericSums.get(row.field))}
                          </Table.Td>
                        </Table.Tr>
                      );
                    }

                    if (row.type === 'paired') {
                      return row.rows.map((entry, entryIndex) => (
                        <Table.Tr key={`${section.id}-${row.id}-${entry.id}`}>
                          <Table.Th scope="row">{entry.label}</Table.Th>
                          {teamQueryStates.map((state, index) => (
                            <Table.Td key={`${row.id}-${entry.id}-${index}`}>
                              {renderTeamNumericValue(state, entry.field)}
                            </Table.Td>
                          ))}
                          {entryIndex === 0 ? (
                            <Table.Td rowSpan={row.rows.length} valign="top">
                              {renderTbaStackedValues(row.rows)}
                            </Table.Td>
                          ) : null}
                        </Table.Tr>
                      ));
                    }

                    if (row.type === 'endgame') {
                      const endgameTeamNumbers = teamQueryStates.map((state) => state.teamNumber);
                      const rowSpan = Math.max(1, endgameTeamNumbers.length);
                      const [firstTeamNumber, ...remainingTeamNumbers] = endgameTeamNumbers;

                      return (
                        <Fragment key={`${section.id}-${row.id}`}>
                          <Table.Tr>
                            <Table.Th scope="row" rowSpan={rowSpan} valign="top">
                              {row.label}
                            </Table.Th>
                            {teamQueryStates.map((state, index) => (
                              <Table.Td key={`${row.id}-team-${index}`} rowSpan={rowSpan} valign="top">
                                {renderTeamEndgameValue(state)}
                              </Table.Td>
                            ))}
                            <Table.Td>{renderTbaEndgameValue(firstTeamNumber)}</Table.Td>
                          </Table.Tr>
                          {remainingTeamNumbers.map((teamNumber, index) => (
                            <Table.Tr key={`${row.id}-tba-${index + 1}`}>
                              <Table.Td>{renderTbaEndgameValue(teamNumber)}</Table.Td>
                            </Table.Tr>
                          ))}
                        </Fragment>
                      );
                    }

                    return null;
                  })}
                </Fragment>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Stack>
    </Box>
  );
}
