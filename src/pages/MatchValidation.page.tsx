import { Alert, Box, Center, Loader, Stack, Table, Text, Title } from '@mantine/core';
import { useQueries } from '@tanstack/react-query';
import { useParams, useSearch } from '@tanstack/react-router';
import {
  useAllianceMatchData,
  fetchScoutMatchData,
  scoutMatchQueryKey,
  type MatchIdentifierRequest,
  type TeamMatchData,
  type AllianceMatchIdentifierRequest,
  type Endgame2025,
} from '@/api';
import classes from './MatchValidation.module.css';

interface MatchValidationSearch {
  teams?: number[];
}

type NumericFieldKey =
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
  | 'tProcessor';

type SelectFieldKey = 'endgame';

type FieldKey = NumericFieldKey | SelectFieldKey;

interface FieldConfig {
  key: FieldKey;
  label: string;
  type: 'number' | 'select';
}

const FIELD_CONFIG: FieldConfig[] = [
  { key: 'al4c', label: 'Auto Coral L4', type: 'number' },
  { key: 'al3c', label: 'Auto Coral L3', type: 'number' },
  { key: 'al2c', label: 'Auto Coral L2', type: 'number' },
  { key: 'al1c', label: 'Auto Coral L1', type: 'number' },
  { key: 'aNet', label: 'Auto Algae Net', type: 'number' },
  { key: 'aProcessor', label: 'Auto Algae Processor', type: 'number' },
  { key: 'tl4c', label: 'Teleop Coral L4', type: 'number' },
  { key: 'tl3c', label: 'Teleop Coral L3', type: 'number' },
  { key: 'tl2c', label: 'Teleop Coral L2', type: 'number' },
  { key: 'tl1c', label: 'Teleop Coral L1', type: 'number' },
  { key: 'tNet', label: 'Teleop Algae Net', type: 'number' },
  { key: 'tProcessor', label: 'Teleop Algae Processor', type: 'number' },
  { key: 'endgame', label: 'Endgame', type: 'select' },
];

const ENDGAME_OPTIONS: { value: Endgame2025; label: string }[] = [
  { value: 'NONE', label: 'None' },
  { value: 'PARK', label: 'Park' },
  { value: 'SHALLOW', label: 'Shallow' },
  { value: 'DEEP', label: 'Deep' },
];

const formatAllianceTitle = (alliance: string, matchLevel: string, matchNumber: number) =>
  `${alliance} Alliance - ${matchLevel}${matchNumber}`;

const sanitizeTeams = (teams?: number[]): number[] => {
  if (!Array.isArray(teams)) {
    return [];
  }

  return teams
    .map((team) => Number.parseInt(String(team), 10))
    .filter((value) => Number.isFinite(value));
};

const formatEndgameLabel = (value: Endgame2025 | undefined) =>
  ENDGAME_OPTIONS.find((option) => option.value === value)?.label ?? '—';

export function MatchValidationPage() {
  const params = useParams({ from: '/dataValidation/matches/$matchLevel/$matchNumber/$alliance' });
  const search = useSearch({
    from: '/dataValidation/matches/$matchLevel/$matchNumber/$alliance',
  }) as MatchValidationSearch;

  const matchLevelParam = params.matchLevel ?? '';
  const matchNumberParam = Number.parseInt(params.matchNumber ?? '', 10);
  const allianceParam = (params.alliance ?? '').toUpperCase();
  const teams = sanitizeTeams(search.teams);

  const matchLevel = matchLevelParam.toUpperCase();
  const alliance = allianceParam === 'RED' || allianceParam === 'BLUE' ? allianceParam : undefined;
  const matchNumber = Number.isFinite(matchNumberParam) ? matchNumberParam : undefined;
  const hasValidTeams = teams.length === 3;

  const isRequestValid = Boolean(matchLevel && alliance && Number.isFinite(matchNumberParam) && hasValidTeams);

  const teamQueries = useQueries({
    queries: teams.map((teamNumber) => {
      const request: MatchIdentifierRequest = {
        matchLevel,
        matchNumber: matchNumber ?? 0,
        teamNumber,
      };

      return {
        queryKey: scoutMatchQueryKey(request),
        queryFn: () => fetchScoutMatchData(request),
        enabled: isRequestValid,
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: 'always' as const,
      };
    }),
  });

  const allianceRequest: AllianceMatchIdentifierRequest = {
    matchLevel,
    matchNumber: matchNumber ?? 0,
    alliance: alliance ?? 'RED',
  };

  const allianceQuery = useAllianceMatchData(allianceRequest, Boolean(alliance && matchNumber && isRequestValid));
  const allianceMatchData = allianceQuery.data;
  const allianceQueryLoading = allianceQuery.isLoading;
  const allianceQueryError = allianceQuery.isError;

  const isAnyTeamLoading = teamQueries.some((query) => query.isLoading);
  const isAnyTeamError = teamQueries.some((query) => query.isError);

  const teamData: Record<number, TeamMatchData | undefined> = Object.fromEntries(
    teams.map((teamNumber, index) => [teamNumber, teamQueries[index]?.data])
  );

  const hasLoadedTeams = teams.every((teamNumber) => Boolean(teamData[teamNumber]));

  const renderAllianceValue = (field: FieldConfig) => {
    if (field.type === 'select') {
      return <Text>—</Text>;
    }

    if (allianceQueryLoading) {
      return (
        <Center>
          <Loader size="sm" />
        </Center>
      );
    }

    const baseValue = allianceMatchData
      ? Number(allianceMatchData[field.key as NumericFieldKey] ?? 0)
      : undefined;

    if (baseValue === undefined || Number.isNaN(baseValue)) {
      return <Text>—</Text>;
    }

    return <Text>{baseValue}</Text>;
  };

  if (!isRequestValid) {
    return (
      <Box p="md">
        <Alert color="red" title="Invalid validation request">
          The match details provided are incomplete. Please use the validation links from the Data Validation table.
        </Alert>
      </Box>
    );
  }

  if (isAnyTeamError || allianceQueryError) {
    return (
      <Box p="md">
        <Alert color="red" title="Unable to load match data">
          We could not retrieve the scouting data for the selected match. Please try again later.
        </Alert>
      </Box>
    );
  }

  if (isAnyTeamLoading || allianceQueryLoading || !hasLoadedTeams) {
    return (
      <Center mih={240}>
        <Loader />
      </Center>
    );
  }

  return (
    <Box p="md">
      <Stack gap="md">
        <Title order={2}>{formatAllianceTitle(alliance ?? '', matchLevel, matchNumber ?? 0)}</Title>
        <Table highlightOnHover withRowBorders striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Metric</Table.Th>
              {teams.map((teamNumber) => (
                <Table.Th key={teamNumber}>Team {teamNumber}</Table.Th>
              ))}
              <Table.Th>{alliance} Total</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {FIELD_CONFIG.map((field) => (
              <Table.Tr key={field.key}>
                <Table.Td className={classes.metricCell}>{field.label}</Table.Td>
                {teams.map((teamNumber) => (
                  <Table.Td key={`${field.key}-${teamNumber}`}>
                    {field.type === 'select' ? (
                      <Text>{formatEndgameLabel(teamData[teamNumber]?.endgame)}</Text>
                    ) : (
                      <Text>{Number(teamData[teamNumber]?.[field.key as NumericFieldKey] ?? 0)}</Text>
                    )}
                  </Table.Td>
                ))}
                <Table.Td>{renderAllianceValue(field)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Stack>
    </Box>
  );
}
