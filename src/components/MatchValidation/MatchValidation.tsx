import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Group,
  Loader,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import cx from 'clsx';
import { IconDeviceFloppy } from '@tabler/icons-react';
import {
  type MatchValidationDataUpdate,
  type TeamMatchData,
  Endgame2025,
  scoutMatchQueryKey,
  submitMatchValidationData,
  teamMatchValidationQueryKey,
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
import classes from './MatchValidation.module.css';
import {
  ENDGAME_LABELS,
  extractTbaTeamEntries,
  formatEndgameValue,
  getAllianceNumericValue,
  getAllianceTotalsRecord,
  getTeamMatchData,
  isValidTeamNumber as isValidNumber,
  parseEndgameKey,
  parseNumericValue,
  type TbaTeamEntry,
} from './matchDataUtils';

const MATCH_LEVEL_LABELS: Record<string, string> = {
  QUALIFICATION: 'Qualification',
  QM: 'Qualification',
  QUARTERFINAL: 'Playoff',
  QF: 'Playoff',
  SEMIFINAL: 'Playoff',
  SF: 'Playoff',
  PLAYOFF: 'Playoff',
  FINAL: 'Finals',
  F: 'Finals',
  PRACTICE: 'Practice',
  PR: 'Practice',
};

const formatMatchLevelLabel = (value: string) => {
  const normalized = value.trim().toUpperCase();

  if (normalized.length === 0) {
    return '';
  }

  if (normalized in MATCH_LEVEL_LABELS) {
    return MATCH_LEVEL_LABELS[normalized];
  }

  const cleaned = normalized.replace(/[_-]+/g, ' ');

  return cleaned
    .split(' ')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

const formatAllianceLabel = (value: string) => {
  const normalized = value.trim().toUpperCase();

  if (normalized === 'RED') {
    return 'Red';
  }

  if (normalized === 'BLUE') {
    return 'Blue';
  }

  if (normalized.length === 0) {
    return '';
  }

  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
};

interface MatchMetadata {
  season?: number;
  eventKey?: string;
  matchNumber?: number;
  matchLevel?: string;
  teamNumber?: number;
  userId?: string;
  organizationId?: number;
  notes?: string | null;
}

const parseIntegerField = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return undefined;
    }

    const parsed = Number.parseInt(trimmed, 10);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const parseStringField = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
};

const mergeMatchMetadata = (primary: MatchMetadata, secondary: MatchMetadata | undefined): MatchMetadata => {
  if (!secondary) {
    return primary;
  }

  return {
    season: primary.season ?? secondary.season,
    eventKey: primary.eventKey ?? secondary.eventKey,
    matchNumber: primary.matchNumber ?? secondary.matchNumber,
    matchLevel: primary.matchLevel ?? secondary.matchLevel,
    teamNumber: primary.teamNumber ?? secondary.teamNumber,
    userId: primary.userId ?? secondary.userId,
    organizationId: primary.organizationId ?? secondary.organizationId,
    notes: primary.notes ?? secondary.notes,
  };
};

const hasRequiredMatchMetadataFields = (metadata: MatchMetadata | undefined): boolean =>
  Boolean(
    metadata &&
      typeof metadata.season === 'number' &&
      Number.isFinite(metadata.season) &&
      typeof metadata.eventKey === 'string' &&
      metadata.eventKey.length > 0 &&
      typeof metadata.matchNumber === 'number' &&
      Number.isFinite(metadata.matchNumber) &&
      typeof metadata.matchLevel === 'string' &&
      metadata.matchLevel.length > 0 &&
      typeof metadata.teamNumber === 'number' &&
      Number.isFinite(metadata.teamNumber) &&
      typeof metadata.userId === 'string' &&
      metadata.userId.length > 0 &&
      typeof metadata.organizationId === 'number' &&
      Number.isFinite(metadata.organizationId)
  );

const extractMatchMetadata = (candidate: unknown): MatchMetadata | undefined => {
  const visited = new Set<unknown>();

  const helper = (value: unknown): MatchMetadata | undefined => {
    if (!value || visited.has(value)) {
      return undefined;
    }

    visited.add(value);

    if (Array.isArray(value)) {
      for (const item of value) {
        const result = helper(item);

        if (result) {
          return result;
        }
      }

      return undefined;
    }

    if (typeof value !== 'object') {
      return undefined;
    }

    const record = value as Record<string, unknown>;
    const initial: MatchMetadata = {
      season: parseIntegerField(record.season),
      eventKey: parseStringField(record.eventKey ?? record.event_key),
      matchNumber: parseIntegerField(record.matchNumber ?? record.match_number),
      matchLevel: parseStringField(record.matchLevel ?? record.match_level),
      teamNumber: parseIntegerField(record.teamNumber ?? record.team_number),
      userId: parseStringField(record.userId ?? record.user_id),
      organizationId: parseIntegerField(record.organizationId ?? record.organization_id),
    };

    const notesValue = record.notes;

    if (notesValue === null || typeof notesValue === 'string') {
      initial.notes = notesValue;
    }

    let combined: MatchMetadata = { ...initial };

    if (!hasRequiredMatchMetadataFields(combined)) {
      for (const nested of Object.values(record)) {
        if (!nested || typeof nested !== 'object') {
          continue;
        }

        const nestedMetadata = helper(nested);

        if (!nestedMetadata) {
          continue;
        }

        combined = mergeMatchMetadata(combined, nestedMetadata);

        if (hasRequiredMatchMetadataFields(combined)) {
          break;
        }
      }
    }

    return Object.values(combined).some((value) => value !== undefined) ? combined : undefined;
  };

  return helper(candidate);
};

type CompleteMatchMetadata = MatchMetadata & {
  season: number;
  eventKey: string;
  matchNumber: number;
  matchLevel: string;
  teamNumber: number;
  userId: string;
  organizationId: number;
};

const isCompleteMetadata = (
  metadata: MatchMetadata | undefined
): metadata is CompleteMatchMetadata => hasRequiredMatchMetadataFields(metadata);


const ENDGAME_OPTIONS: Array<{ value: Endgame2025; label: string }> = (
  Object.entries(ENDGAME_LABELS) as Array<[Endgame2025, string]>
).map(([value, label]) => ({ value, label }));

const MAX_NUMERIC_FIELD_VALUE = 99;

export function MatchValidation() {
  const params = useParams({ from: '/dataValidation/matches/$matchLevel/$matchNumber/$alliance' });
  const navigate = useNavigate();

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

  const [teamEdits, setTeamEdits] = useState<Record<number, Partial<TeamMatchData>>>({});
  const [rowOverrides, setRowOverrides] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');
  const notesInitializedRef = useRef(false);
  const initialNotesRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    setTeamEdits({});
    setRowOverrides({});
    setNotes('');
    notesInitializedRef.current = false;
    initialNotesRef.current = undefined;
  }, [matchEntry?.match_level, matchEntry?.match_number, allianceParam]);

  useEffect(() => {
    if (notesInitializedRef.current) {
      return;
    }

    const metadataCandidates = [team1Query.data, team2Query.data, team3Query.data];

    for (const candidate of metadataCandidates) {
      const metadata = extractMatchMetadata(candidate);

      if (!isCompleteMetadata(metadata)) {
        continue;
      }

      notesInitializedRef.current = true;
      initialNotesRef.current = metadata.notes ?? null;
      setNotes(metadata.notes ?? '');

      break;
    }
  }, [team1Query.data, team2Query.data, team3Query.data]);

  const isRowOverridden = useCallback(
    (rowKey: string) => Boolean(rowOverrides[rowKey]),
    [rowOverrides]
  );

  const handleOverrideChange = useCallback((rowKey: string, checked: boolean) => {
    setRowOverrides((previous) => {
      if (checked) {
        return { ...previous, [rowKey]: true };
      }

      if (!previous[rowKey]) {
        return previous;
      }

      const next = { ...previous };
      delete next[rowKey];

      return next;
    });
  }, []);

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

  const allianceTotals = useMemo(
    () => getAllianceTotalsRecord(tbaMatchDataResponse),
    [tbaMatchDataResponse]
  );

  const aggregatedTbaData = useMemo(() => {
    const numericSums = new Map<MatchValidationNumericField, number>();
    const endgameMap = new Map<number, string>();

    if (tbaTeamEntries.length > 0) {
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
    }

    if (allianceTotals) {
      MATCH_VALIDATION_NUMERIC_FIELDS.forEach((field) => {
        const value = getAllianceNumericValue(allianceTotals, field);

        if (value !== undefined) {
          numericSums.set(field, value);
        }
      });

      allianceTeams.forEach((teamNumber, index) => {
        if (!isValidNumber(teamNumber)) {
          return;
        }

        const baseKey = `bot${index + 1}`;
        const rawValue =
          allianceTotals[`${baseKey}endgame`] ??
          allianceTotals[`${baseKey}Endgame`] ??
          allianceTotals[`${baseKey}_endgame`];
        const label = formatEndgameValue(rawValue);

        if (label) {
          endgameMap.set(teamNumber, label);
        }
      });
    }

    return { numericSums, endgame: endgameMap };
  }, [allianceTeams, allianceTotals, tbaTeamEntries]);

  type AggregatedTeamTotals = {
    total: number;
    hasValue: boolean;
    isLoading: boolean;
    isError: boolean;
  };

  type TbaTotals = {
    total: number;
    hasValue: boolean;
  };

  const getBaseNumericValue = useCallback(
    (teamNumber: number, field: MatchValidationNumericField): number | undefined => {
      const teamState = teamQueryStates.find((state) => state.teamNumber === teamNumber);

      if (!teamState) {
        return undefined;
      }

      const data = getTeamMatchData(teamState.query.data);

      return data ? parseNumericValue(data[field]) : undefined;
    },
    [teamQueryStates]
  );

  const getCurrentNumericValue = useCallback(
    (state: (typeof teamQueryStates)[number], field: MatchValidationNumericField): number | undefined => {
      if (!isValidNumber(state.teamNumber)) {
        return undefined;
      }

      const overrideValue = teamEdits[state.teamNumber]?.[field];

      if (typeof overrideValue === 'number' && Number.isFinite(overrideValue)) {
        return overrideValue;
      }

      const data = getTeamMatchData(state.query.data);

      return data ? parseNumericValue(data[field]) : undefined;
    },
    [teamEdits]
  );

  const clampNumericValue = (value: number) =>
    Math.max(0, Math.min(MAX_NUMERIC_FIELD_VALUE, Math.round(value)));

  const adjustTeamNumericValue = useCallback(
    (teamNumber: number, field: MatchValidationNumericField, delta: number) => {
      if (!isValidNumber(teamNumber) || delta === 0) {
        return;
      }

      setTeamEdits((previous) => {
        const previousEntry = previous[teamNumber];
        const previousOverride = previousEntry?.[field];
        const baseValue = getBaseNumericValue(teamNumber, field) ?? 0;
        const currentValue =
          typeof previousOverride === 'number' && Number.isFinite(previousOverride)
            ? previousOverride
            : baseValue;
        const nextValue = clampNumericValue(currentValue + delta);

        if (nextValue === currentValue) {
          return previous;
        }

        const next = { ...previous };
        const nextEntry = { ...(previousEntry ?? {}) };

        if (nextValue === baseValue) {
          delete nextEntry[field];

          if (Object.keys(nextEntry).length === 0) {
            delete next[teamNumber];
          } else {
            next[teamNumber] = nextEntry;
          }

          return next;
        }

        nextEntry[field] = nextValue;
        next[teamNumber] = nextEntry;

        return next;
      });
    },
    [getBaseNumericValue]
  );

  const getBaseEndgameValue = useCallback(
    (teamNumber: number): Endgame2025 => {
      const teamState = teamQueryStates.find((state) => state.teamNumber === teamNumber);

      if (!teamState) {
        return 'NONE';
      }

      const data = getTeamMatchData(teamState.query.data);
      const parsed = data ? parseEndgameKey(data.endgame) : undefined;

      return parsed ?? 'NONE';
    },
    [teamQueryStates]
  );

  const getCurrentEndgameValue = useCallback(
    (state: (typeof teamQueryStates)[number]): Endgame2025 => {
      if (!isValidNumber(state.teamNumber)) {
        return 'NONE';
      }

      const overrideValue = teamEdits[state.teamNumber]?.endgame;

      if (overrideValue && overrideValue in ENDGAME_LABELS) {
        return overrideValue;
      }

      const data = getTeamMatchData(state.query.data);
      const parsed = data ? parseEndgameKey(data.endgame) : undefined;

      return parsed ?? 'NONE';
    },
    [teamEdits]
  );

  const setTeamEndgameValue = useCallback(
    (teamNumber: number, value: Endgame2025) => {
      if (!isValidNumber(teamNumber)) {
        return;
      }

      setTeamEdits((previous) => {
        const baseValue = getBaseEndgameValue(teamNumber);

        if (value === baseValue) {
          if (!previous[teamNumber]) {
            return previous;
          }

          const next = { ...previous };
          const nextEntry = { ...next[teamNumber] };
          delete nextEntry.endgame;

          if (Object.keys(nextEntry).length === 0) {
            delete next[teamNumber];
          } else {
            next[teamNumber] = nextEntry;
          }

          return next;
        }

        const next = { ...previous };
        const nextEntry = { ...(next[teamNumber] ?? {}) };
        nextEntry.endgame = value;
        next[teamNumber] = nextEntry;

        return next;
      });
    },
    [getBaseEndgameValue]
  );

  const queryClient = useQueryClient();
  const { mutateAsync: submitMatchData, isPending: isSubmitting } = useMutation({
    mutationFn: submitMatchValidationData,
  });

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    const requiredUpdates = teamQueryStates.filter((state) => isValidNumber(state.teamNumber)).length;

    if (requiredUpdates === 0) {
      return;
    }

    const updates: MatchValidationDataUpdate[] = [];
    const initialNotes = initialNotesRef.current;
    const notesForSubmission = (() => {
      if (initialNotes === undefined) {
        return notes.length > 0 ? notes : null;
      }

      const initialValue = initialNotes ?? '';

      if (initialValue === notes) {
        return undefined;
      }

      return notes.length > 0 ? notes : null;
    })();

    for (const state of teamQueryStates) {
      if (!isValidNumber(state.teamNumber)) {
        continue;
      }

      const metadata = extractMatchMetadata(state.query.data);

      if (!isCompleteMetadata(metadata)) {
        return;
      }

      const updatedMatchData = {
        season: metadata.season,
        event_key: metadata.eventKey,
        match_number: metadata.matchNumber,
        match_level: metadata.matchLevel,
        team_number: metadata.teamNumber,
        user_id: metadata.userId,
        organization_id: metadata.organizationId,
        endgame: getCurrentEndgameValue(state),
      } as TeamMatchData;

      MATCH_VALIDATION_NUMERIC_FIELDS.forEach((field) => {
        const numericValue = getCurrentNumericValue(state, field);
        updatedMatchData[field] = numericValue ?? 0;
      });

      updates.push({
        season: metadata.season,
        eventKey: metadata.eventKey,
        matchNumber: metadata.matchNumber,
        matchLevel: metadata.matchLevel,
        teamNumber: metadata.teamNumber,
        userId: metadata.userId,
        organizationId: metadata.organizationId,
        matchData: updatedMatchData,
        ...(notesForSubmission !== undefined ? { notes: notesForSubmission } : {}),
      });
    }

    if (updates.length !== requiredUpdates) {
      return;
    }

    await submitMatchData(updates);

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: teamMatchValidationQueryKey() }),
      queryClient.invalidateQueries({ queryKey: scoutMatchQueryKey() }),
    ]);

    navigate({ to: '/dataValidation' });
  }, [
    getCurrentEndgameValue,
    getCurrentNumericValue,
    isSubmitting,
    notes,
    navigate,
    queryClient,
    submitMatchData,
    teamQueryStates,
  ]);

  const aggregateTeamFieldValues = (
    fields: MatchValidationNumericField[]
  ): AggregatedTeamTotals => {
    let total = 0;
    let hasValue = false;
    let isLoadingRow = false;
    let isErrorRow = false;

    teamQueryStates.forEach((state) => {
      if (!isValidNumber(state.teamNumber)) {
        return;
      }

      if (state.query.isLoading) {
        isLoadingRow = true;
        return;
      }

      if (state.query.isError) {
        isErrorRow = true;
        return;
      }

      const data = getTeamMatchData(state.query.data);
      const overrideEntry = state.teamNumber ? teamEdits[state.teamNumber] : undefined;

      if (data || (overrideEntry && fields.some((field) => typeof overrideEntry[field] === 'number'))) {
        hasValue = true;
      }

      fields.forEach((field) => {
        const value = getCurrentNumericValue(state, field);
        total += value ?? 0;
      });
    });

    return {
      total,
      hasValue,
      isLoading: isLoadingRow,
      isError: isErrorRow,
    };
  };

  const getTbaTotalsForFields = (fields: MatchValidationNumericField[]): TbaTotals => {
    let total = 0;
    let hasValue = false;

    fields.forEach((field) => {
      const value = aggregatedTbaData.numericSums.get(field);

      if (value !== undefined) {
        total += value;
        hasValue = true;
      }
    });

    return { total, hasValue };
  };

  const resolveRowHighlightClassName = (
    teamTotals: AggregatedTeamTotals,
    tbaTotals: TbaTotals,
    overrideKey?: string
  ) => {
    if (overrideKey && isRowOverridden(overrideKey)) {
      return classes.rowMatch;
    }

    if (
      !teamTotals.hasValue ||
      teamTotals.isLoading ||
      teamTotals.isError ||
      isTbaMatchDataLoading ||
      isTbaMatchDataError ||
      !tbaTotals.hasValue
    ) {
      return undefined;
    }

    return teamTotals.total === tbaTotals.total ? classes.rowMatch : classes.rowMismatch;
  };

  const renderTotalValue = (totals: AggregatedTeamTotals) => {
    if (totals.isLoading) {
      return getLoaderNode();
    }

    if (totals.isError) {
      return getErrorNode();
    }

    if (!totals.hasValue) {
      return getPlaceholderNode();
    }

    return totals.total;
  };

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

    const teamNumber = state.teamNumber;
    const numericValue = getCurrentNumericValue(state, field) ?? 0;

    const handleIncrement = () => adjustTeamNumericValue(teamNumber, field, 1);
    const handleDecrement = () => adjustTeamNumericValue(teamNumber, field, -1);

    return (
      <Group gap={4} justify="center" wrap="nowrap" className={classes.numericControlGroup}>
        <ActionIcon
          variant="transparent"
          size="sm"
          aria-label="Decrease value"
          onClick={handleDecrement}
          disabled={numericValue <= 0}
          className={classes.numericControlButton}
        >
          −
        </ActionIcon>
        <Text fz="sm" fw={500} className={classes.numericControlValue}>
          {numericValue}
        </Text>
        <ActionIcon
          variant="transparent"
          size="sm"
          aria-label="Increase value"
          onClick={handleIncrement}
          disabled={numericValue >= MAX_NUMERIC_FIELD_VALUE}
          className={classes.numericControlButton}
        >
          +
        </ActionIcon>
      </Group>
    );
  };

  const getTeamEndgameCell = (
    state: (typeof teamQueryStates)[number],
    isOverridden: boolean
  ) => {
    if (!isValidNumber(state.teamNumber)) {
      return { content: getPlaceholderNode(), className: undefined, isMismatch: false };
    }

    if (state.query.isLoading) {
      return { content: getLoaderNode(), className: undefined, isMismatch: false };
    }

    if (state.query.isError) {
      return { content: getErrorNode(), className: undefined, isMismatch: false };
    }

    const teamNumber = state.teamNumber;
    const currentValue = getCurrentEndgameValue(state);
    const label = ENDGAME_LABELS[currentValue] ?? ENDGAME_LABELS.NONE;

    const tbaLabel =
      isTbaMatchDataLoading || isTbaMatchDataError || !isValidNumber(state.teamNumber)
        ? undefined
        : aggregatedTbaData.endgame.get(state.teamNumber);

    const isMismatch = !isOverridden && tbaLabel !== undefined && label !== tbaLabel;

    const matchClass = isOverridden
      ? classes.cellMatch
      : tbaLabel !== undefined
        ? label === tbaLabel
          ? classes.cellMatch
          : classes.cellMismatch
        : undefined;

    return {
      content: (
        <Select
          size="xs"
          value={currentValue}
          data={ENDGAME_OPTIONS}
          onChange={(value) => {
            const resolvedValue = (value ?? 'NONE') as Endgame2025;
            setTeamEndgameValue(teamNumber, resolvedValue);
          }}
          allowDeselect={false}
          comboboxProps={{ withinPortal: true }}
          styles={{ input: { textAlign: 'center' } }}
        />
      ),
      className: matchClass,
      isMismatch,
    };
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

    const values = entries.map((entry) =>
      aggregatedTbaData.numericSums.get(entry.field)
    );

    const hasValue = values.some((value) => value !== undefined);

    if (!hasValue) {
      return getPlaceholderNode();
    }

    const totalValue = values.reduce<number>((total, value) => total + (value ?? 0), 0);

    return <Text fz="sm">{totalValue}</Text>;
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

  const renderOverrideCheckbox = (rowKey: string, options?: { rowSpan?: number }) => (
    <Table.Td
      rowSpan={options?.rowSpan}
      ta="center"
      className={classes.cell}
    >
      <Checkbox
        size="xs"
        aria-label="Override validation for row"
        checked={isRowOverridden(rowKey)}
        onChange={(event) => handleOverrideChange(rowKey, event.currentTarget.checked)}
      />
    </Table.Td>
  );

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

  const teamStatesWithMetadata = teamQueryStates.map((state) => {
    const metadata = extractMatchMetadata(state.query.data);

    return {
      ...state,
      metadata,
      isMetadataComplete:
        !state.query.isLoading && !state.query.isError && isCompleteMetadata(metadata),
    };
  });

  const hasTeamQueryLoading = teamStatesWithMetadata.some((state) => state.query.isLoading);
  const hasTeamQueryError = teamStatesWithMetadata.some((state) => state.query.isError);
  const hasMetadataGap = teamStatesWithMetadata.some(
    (state) =>
      isValidNumber(state.teamNumber) &&
      !state.query.isLoading &&
      !state.query.isError &&
      !state.isMetadataComplete
  );
  const hasAllAllianceTeamNumbers =
    allianceTeams.length > 0 && allianceTeams.every((teamNumber) => isValidNumber(teamNumber));
  const validTeamCount = teamStatesWithMetadata.filter((state) =>
    isValidNumber(state.teamNumber)
  ).length;
  const meetsNonMismatchRequirements =
    hasAllAllianceTeamNumbers &&
    validTeamCount === allianceTeams.length &&
    !hasTeamQueryLoading &&
    !hasTeamQueryError &&
    !hasMetadataGap &&
    !isTbaMatchDataLoading &&
    !isTbaMatchDataError;

  let isPageValid = meetsNonMismatchRequirements;

  const teamColumnCount = MATCH_VALIDATION_TEAM_HEADERS.length;
  const summaryColumnCount = 3;
  const sectionTitleColSpan = teamColumnCount + summaryColumnCount;
  const formattedMatchLevel = formatMatchLevelLabel(matchEntry.match_level ?? matchLevelParam);
  const formattedAlliance = formatAllianceLabel(allianceParam);
  const pageTitle = `${formattedMatchLevel} Match ${matchEntry.match_number} ${formattedAlliance} Alliance Validation`;

  return (
    <Box p="md">
      <Stack gap="lg">
        <Title order={2} ta="center">
          {pageTitle}
        </Title>

        {allianceTeams.length === 0 ? (
          <Text c="dimmed">No teams were found for this alliance.</Text>
        ) : (
          <Table striped withColumnBorders highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th ta="right" className={classes.cell} />
                {MATCH_VALIDATION_TEAM_HEADERS.map((header) => (
                  <Table.Th key={header} ta="center" className={classes.cell}>
                    {header}
                  </Table.Th>
                ))}
                <Table.Th ta="center" className={classes.cell}>
                  Total
                </Table.Th>
                <Table.Th ta="center" className={classes.cell}>
                  TBA
                </Table.Th>
                <Table.Th ta="center" className={classes.cell}>
                  Override
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Th scope="row" ta="right" className={classes.cell}>
                  Team Number
                </Table.Th>
                {teamQueryStates.map((state, index) => (
                  <Table.Td
                    key={`team-${state.teamNumber ?? index}`}
                    ta="center"
                    className={classes.cell}
                  >
                    {renderTeamNumberCell(state.teamNumber)}
                  </Table.Td>
                ))}
                <Table.Td ta="center" className={classes.cell}>
                  {getPlaceholderNode()}
                </Table.Td>
                <Table.Td ta="center" className={classes.cell}>
                  {isTbaMatchDataLoading
                    ? getLoaderNode()
                    : isTbaMatchDataError
                      ? getErrorNode()
                      : tbaMatchDataRequestBody
                        ? `${formatAllianceLabel(allianceParam)} Alliance`
                        : getPlaceholderNode()}
                </Table.Td>
                <Table.Td ta="center" className={classes.cell}>
                  {getPlaceholderNode()}
                </Table.Td>
              </Table.Tr>

              {MATCH_VALIDATION_TABLE_LAYOUT.map((section) => (
                <Fragment key={section.id}>
                  <Table.Tr>
                    <Table.Th scope="row" ta="right" className={classes.cell} />
                    <Table.Th colSpan={sectionTitleColSpan} ta="center" className={classes.cell}>
                      {section.title}
                    </Table.Th>
                  </Table.Tr>

                  {section.rows.map((row) => {
                    if (row.type === 'numeric') {
                      const teamTotals = aggregateTeamFieldValues([row.field]);
                      const tbaTotals = getTbaTotalsForFields([row.field]);
                      const overrideKey = `${section.id}-${row.id}`;
                      const rowHighlightClass = resolveRowHighlightClassName(
                        teamTotals,
                        tbaTotals,
                        overrideKey
                      );

                      if (rowHighlightClass === classes.rowMismatch) {
                        isPageValid = false;
                      }

                      return (
                        <Table.Tr
                          key={`${section.id}-${row.id}`}
                          className={cx(rowHighlightClass)}
                        >
                          <Table.Th scope="row" ta="right" className={classes.cell}>
                            {row.label}
                          </Table.Th>
                          {teamQueryStates.map((state, index) => (
                            <Table.Td
                              key={`${row.id}-${index}`}
                              ta="center"
                              className={classes.cell}
                            >
                              {renderTeamNumericValue(state, row.field)}
                            </Table.Td>
                          ))}
                          <Table.Td ta="center" className={classes.cell}>
                            {renderTotalValue(teamTotals)}
                          </Table.Td>
                          <Table.Td ta="center" className={classes.cell}>
                            {renderTbaNumericValue(aggregatedTbaData.numericSums.get(row.field))}
                          </Table.Td>
                          {renderOverrideCheckbox(overrideKey)}
                        </Table.Tr>
                      );
                    }

                    if (row.type === 'paired') {
                      const fields = row.rows.map((entry) => entry.field);
                      const teamTotals = aggregateTeamFieldValues(fields);
                      const tbaTotals = getTbaTotalsForFields(fields);
                      const overrideKey = `${section.id}-${row.id}`;
                      const rowHighlightClass = resolveRowHighlightClassName(
                        teamTotals,
                        tbaTotals,
                        overrideKey
                      );

                      if (rowHighlightClass === classes.rowMismatch) {
                        isPageValid = false;
                      }

                      return row.rows.map((entry, entryIndex) => (
                        <Table.Tr
                          key={`${section.id}-${row.id}-${entry.id}`}
                          className={cx(rowHighlightClass)}
                        >
                          <Table.Th scope="row" ta="right" className={classes.cell}>
                            {entry.label}
                          </Table.Th>
                          {teamQueryStates.map((state, index) => (
                            <Table.Td
                              key={`${row.id}-${entry.id}-${index}`}
                              ta="center"
                              className={classes.cell}
                            >
                              {renderTeamNumericValue(state, entry.field)}
                            </Table.Td>
                          ))}
                          {entryIndex === 0 ? (
                            <Table.Td
                              rowSpan={row.rows.length}
                              ta="center"
                              className={classes.cell}
                            >
                              {renderTotalValue(teamTotals)}
                            </Table.Td>
                          ) : null}
                          {entryIndex === 0 ? (
                            <Table.Td
                              rowSpan={row.rows.length}
                              ta="center"
                              className={classes.cell}
                            >
                              {renderTbaStackedValues(row.rows)}
                            </Table.Td>
                          ) : null}
                          {entryIndex === 0 ? renderOverrideCheckbox(overrideKey, { rowSpan: row.rows.length }) : null}
                        </Table.Tr>
                      ));
                    }

                    if (row.type === 'endgame') {
                      const endgameTeamNumbers = teamQueryStates.map((state) => state.teamNumber);
                      const rowSpan = Math.max(1, endgameTeamNumbers.length);
                      const [firstTeamNumber, ...remainingTeamNumbers] = endgameTeamNumbers;
                      const overrideKey = `${section.id}-${row.id}`;
                      const overrideChecked = isRowOverridden(overrideKey);

                      return (
                        <Fragment key={`${section.id}-${row.id}`}>
                          <Table.Tr>
                            <Table.Th
                              scope="row"
                              rowSpan={rowSpan}
                              ta="right"
                              className={classes.cell}
                            >
                              {row.label}
                            </Table.Th>
                            {teamQueryStates.map((state, index) => {
                              const cell = getTeamEndgameCell(state, overrideChecked);

                              if (cell.isMismatch) {
                                isPageValid = false;
                              }

                              return (
                                <Table.Td
                                  key={`${row.id}-team-${index}`}
                                  rowSpan={rowSpan}
                                  ta="center"
                                  className={cx(classes.cell, cell.className)}
                                >
                                  {cell.content}
                                </Table.Td>
                              );
                            })}
                            <Table.Td rowSpan={rowSpan} ta="center" className={classes.cell}>
                              {getPlaceholderNode()}
                            </Table.Td>
                            <Table.Td ta="center" className={classes.cell}>
                              {renderTbaEndgameValue(firstTeamNumber)}
                            </Table.Td>
                            {renderOverrideCheckbox(overrideKey, { rowSpan })}
                          </Table.Tr>
                          {remainingTeamNumbers.map((teamNumber, index) => (
                            <Table.Tr key={`${row.id}-tba-${index + 1}`}>
                              <Table.Td ta="center" className={classes.cell}>
                                {renderTbaEndgameValue(teamNumber)}
                              </Table.Td>
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

        <Textarea
          label="Notes"
          minRows={3}
          value={notes}
          onChange={(event) => setNotes(event.currentTarget.value)}
        />

        <Button
          leftSection={<IconDeviceFloppy size={16} />}
          onClick={handleSubmit}
          disabled={!isPageValid || isSubmitting}
          loading={isSubmitting}
        >
          Save Changes and Submit
        </Button>
      </Stack>
    </Box>
  );
}
