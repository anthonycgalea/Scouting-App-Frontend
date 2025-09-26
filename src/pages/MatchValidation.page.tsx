import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Center,
  Loader,
  NumberInput,
  Select,
  Switch,
  Stack,
  Table,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useSearch } from '@tanstack/react-router';
import {
  useAllianceMatchData,
  fetchScoutMatchData,
  scoutMatchQueryKey,
  updateMatchDataBatch,
  updateValidationStatuses,
  type MatchIdentifierRequest,
  type TeamMatchData,
  type ValidationStatusUpdate,
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

type EditableFieldKey = NumericFieldKey | SelectFieldKey;

interface FieldConfig {
  key: EditableFieldKey;
  label: string;
  type: 'number' | 'select';
}

interface OverrideState {
  enabled: boolean;
  value: number;
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

const NUMERIC_FIELDS: NumericFieldKey[] = [
  'al4c',
  'al3c',
  'al2c',
  'al1c',
  'aNet',
  'aProcessor',
  'tl4c',
  'tl3c',
  'tl2c',
  'tl1c',
  'tNet',
  'tProcessor',
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

const sumTeamField = (teamData: Record<number, TeamMatchData | undefined>, field: NumericFieldKey, teams: number[]) =>
  teams.reduce((total, teamNumber) => total + Number(teamData[teamNumber]?.[field] ?? 0), 0);

export function MatchValidationPage() {
  const params = useParams({ from: '/dataValidation/matches/$matchLevel/$matchNumber/$alliance' });
  const search = useSearch({
    from: '/dataValidation/matches/$matchLevel/$matchNumber/$alliance',
  }) as MatchValidationSearch;

  const matchLevelParam = params.matchLevel ?? '';
  const matchNumberParam = Number.parseInt(params.matchNumber ?? '', 10);
  const allianceParam = (params.alliance ?? '').toUpperCase();
  const teams = sanitizeTeams(search.teams);

  const queryClient = useQueryClient();
  const [teamFormState, setTeamFormState] = useState<Record<number, TeamMatchData | undefined>>({});
  const [initialTeamState, setInitialTeamState] = useState<Record<number, TeamMatchData | undefined>>({});
  const [overrideState, setOverrideState] = useState<Partial<Record<NumericFieldKey, OverrideState>>>(
    {}
  );
  const [overrideNote, setOverrideNote] = useState('');

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

  useEffect(() => {
    teamQueries.forEach((query, index) => {
      const teamNumber = teams[index];
      if (!teamNumber || !query?.data) {
        return;
      }

      setTeamFormState((prev) => {
        if (prev[teamNumber]) {
          return prev;
        }

        return {
          ...prev,
          [teamNumber]: query.data,
        };
      });

      setInitialTeamState((prev) => {
        if (prev[teamNumber]) {
          return prev;
        }

        return {
          ...prev,
          [teamNumber]: query.data,
        };
      });
    });
  }, [teamQueries, teams]);

  useEffect(() => {
    if (!allianceMatchData) {
      return;
    }

    setOverrideState((prev) => {
      const next: Partial<Record<NumericFieldKey, OverrideState>> = { ...prev };
      NUMERIC_FIELDS.forEach((field) => {
        const baseValue = Number(allianceMatchData[field] ?? 0);
        const current = next[field];
        if (!current) {
          next[field] = { enabled: false, value: baseValue };
        } else if (!current.enabled) {
          next[field] = { ...current, value: baseValue };
        }
      });
      return next;
    });
  }, [allianceMatchData]);

  useEffect(() => {
    if (allianceQueryError) {
      notifications.show({
        color: 'orange',
        title: 'Alliance totals unavailable',
        message: 'We were unable to load the alliance totals from TBA.',
      });
    }
  }, [allianceQueryError]);

  const updateMatchDataMutation = useMutation({
    mutationFn: updateMatchDataBatch,
  });

  const updateValidationMutation = useMutation({
    mutationFn: (updates: ValidationStatusUpdate[]) => updateValidationStatuses(updates),
  });

  const [savingTeam, setSavingTeam] = useState<number | null>(null);

  const isAnyTeamLoading = teamQueries.some((query) => query.isLoading);
  const isAnyTeamError = teamQueries.some((query) => query.isError);
  const hasLoadedTeams = teams.every((teamNumber) => Boolean(teamFormState[teamNumber]));

  const anyOverrideEnabled = NUMERIC_FIELDS.some((field) => overrideState[field]?.enabled);
  const isNoteRequired = anyOverrideEnabled;
  const isNoteMissing = isNoteRequired && !overrideNote.trim();

  const handleNumericChange = (
    teamNumber: number,
    field: NumericFieldKey,
    value: string | number | null
  ) => {
    const numericValue = typeof value === 'number'
      ? value
      : Number.parseInt(value ?? '', 10) || 0;

    setTeamFormState((prev) => {
      const current = prev[teamNumber];
      if (!current) {
        return prev;
      }

      return {
        ...prev,
        [teamNumber]: {
          ...current,
          [field]: numericValue,
        },
      };
    });
  };

  const handleEndgameChange = (teamNumber: number, value: Endgame2025 | null) => {
    if (!value) {
      return;
    }

    setTeamFormState((prev) => {
      const current = prev[teamNumber];
      if (!current) {
        return prev;
      }

      return {
        ...prev,
        [teamNumber]: {
          ...current,
          endgame: value,
        },
      };
    });
  };

  const toggleOverride = (field: NumericFieldKey, enabled: boolean) => {
    setOverrideState((prev) => {
      const current = prev[field];
      const baseValue = Number(allianceMatchData?.[field] ?? 0);
      if (!current) {
        return {
          ...prev,
          [field]: {
            enabled,
            value: enabled ? baseValue : baseValue,
          },
        };
      }

      return {
        ...prev,
        [field]: {
          ...current,
          enabled,
          value: enabled ? current.value : baseValue,
        },
      };
    });
  };

  const handleOverrideValueChange = (
    field: NumericFieldKey,
    value: string | number | null
  ) => {
    const numericValue = typeof value === 'number'
      ? value
      : Number.parseInt(value ?? '', 10) || 0;

    setOverrideState((prev) => ({
      ...prev,
      [field]: {
        enabled: prev[field]?.enabled ?? false,
        value: numericValue,
      },
    }));
  };

  const isTeamDirty = (teamNumber: number) => {
    const current = teamFormState[teamNumber];
    const initial = initialTeamState[teamNumber];

    if (!current || !initial) {
      return false;
    }

    return FIELD_CONFIG.some(({ key }) => current[key] !== initial[key]);
  };

  const handleSaveTeam = async (teamNumber: number) => {
    const matchData = teamFormState[teamNumber];

    if (!matchData || !matchLevel || !matchNumber || !alliance) {
      return;
    }

    const updates: ValidationStatusUpdate[] = [
      {
        matchLevel,
        matchNumber,
        teamNumber,
        validationStatus: 'VALID',
        notes: anyOverrideEnabled ? overrideNote.trim() || null : null,
      },
    ];

    try {
      setSavingTeam(teamNumber);
      await updateMatchDataMutation.mutateAsync([matchData]);
      await updateValidationMutation.mutateAsync(updates);

      setInitialTeamState((prev) => ({
        ...prev,
        [teamNumber]: matchData,
      }));

      queryClient.setQueryData(scoutMatchQueryKey({ matchLevel, matchNumber, teamNumber }), matchData);

      notifications.show({
        color: 'green',
        title: 'Changes saved',
        message: `Match data saved for Team ${teamNumber}.`,
      });
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Unable to save changes',
        message: 'We could not save the updated match data. Please try again.',
      });
    } finally {
      setSavingTeam(null);
    }
  };

  const renderAllianceValue = (field: FieldConfig) => {
    if (field.type === 'select') {
      return <Text>—</Text>;
    }

    const override = overrideState[field.key as NumericFieldKey];
    const baseValue = allianceMatchData
      ? Number(allianceMatchData[field.key as NumericFieldKey] ?? 0)
      : undefined;

    if (override?.enabled) {
      return (
        <NumberInput
          min={0}
          value={override.value}
          onChange={(value) => handleOverrideValueChange(field.key as NumericFieldKey, value)}
        />
      );
    }

    if (allianceQueryLoading) {
      return (
        <Center>
          <Loader size="sm" />
        </Center>
      );
    }

    if (baseValue === undefined) {
      return <Text>—</Text>;
    }

    return <Text>{baseValue}</Text>;
  };

  const renderOverrideControl = (field: FieldConfig) => {
    if (field.type === 'select') {
      return <Text className={classes.overrideCell}>—</Text>;
    }

    const override = overrideState[field.key as NumericFieldKey];

    return (
      <Center>
        <Switch
          checked={override?.enabled ?? false}
          onChange={(event) => toggleOverride(field.key as NumericFieldKey, event.currentTarget.checked)}
          size="md"
        />
      </Center>
    );
  };

  const renderTeamInput = (teamNumber: number, field: FieldConfig) => {
    const matchData = teamFormState[teamNumber];
    if (!matchData) {
      return (
        <Center>
          <Loader size="sm" />
        </Center>
      );
    }

    if (field.type === 'select') {
      return (
        <Select
          data={ENDGAME_OPTIONS}
          value={matchData.endgame}
          onChange={(value) => handleEndgameChange(teamNumber, value as Endgame2025 | null)}
        />
      );
    }

    const numericKey = field.key as NumericFieldKey;

    return (
      <NumberInput
        min={0}
        value={matchData[numericKey] ?? 0}
        onChange={(value) => handleNumericChange(teamNumber, numericKey, value)}
      />
    );
  };

  const rowMatchesAlliance = (field: FieldConfig) => {
    if (field.type !== 'number') {
      return false;
    }

    if (!hasValidTeams) {
      return false;
    }

    if (!allianceMatchData && !overrideState[field.key as NumericFieldKey]?.enabled) {
      return false;
    }

    const allianceValue = overrideState[field.key as NumericFieldKey]?.enabled
      ? overrideState[field.key as NumericFieldKey]?.value ?? 0
      : Number(allianceMatchData?.[field.key as NumericFieldKey] ?? 0);

    const total = sumTeamField(teamFormState, field.key as NumericFieldKey, teams);

    return allianceValue === total;
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

  if (isAnyTeamError) {
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
              <Table.Th>Override</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {FIELD_CONFIG.map((field) => (
              <Table.Tr
                key={field.key}
                className={rowMatchesAlliance(field) ? classes.matchRowMatch : undefined}
              >
                <Table.Td className={classes.metricCell}>{field.label}</Table.Td>
                {teams.map((teamNumber) => (
                  <Table.Td key={`${field.key}-${teamNumber}`}>{renderTeamInput(teamNumber, field)}</Table.Td>
                ))}
                <Table.Td>{renderAllianceValue(field)}</Table.Td>
                <Table.Td className={classes.overrideCell}>{renderOverrideControl(field)}</Table.Td>
              </Table.Tr>
            ))}
            <Table.Tr>
              <Table.Td />
              {teams.map((teamNumber) => {
                const dirty = isTeamDirty(teamNumber);
                return (
                  <Table.Td key={`save-${teamNumber}`}>
                    <Button
                      fullWidth
                      disabled={!dirty || isNoteMissing}
                      loading={savingTeam === teamNumber && (updateMatchDataMutation.isPending || updateValidationMutation.isPending)}
                      onClick={() => handleSaveTeam(teamNumber)}
                    >
                      Save Team {teamNumber}
                    </Button>
                  </Table.Td>
                );
              })}
              <Table.Td colSpan={2}>
                {isNoteRequired ? (
                  <Textarea
                    label="Override note"
                    placeholder="Explain the override"
                    value={overrideNote}
                    onChange={(event) => setOverrideNote(event.currentTarget.value)}
                    required
                    autosize
                    minRows={2}
                    className={classes.overrideNote}
                    error={isNoteMissing ? 'A note is required when overriding alliance totals.' : undefined}
                  />
                ) : (
                  <Text c="dimmed">No override note required.</Text>
                )}
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Stack>
    </Box>
  );
}
