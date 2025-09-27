import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Box,
  Group,
  Loader,
  Select,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useParams } from '@tanstack/react-router';
import cx from 'clsx';
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
import classes from './MatchValidation.module.css';

const ENDGAME_LABELS: Record<Endgame2025, string> = {
  NONE: 'None',
  PARK: 'Park',
  SHALLOW: 'Shallow',
  DEEP: 'Deep',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const ALLIANCE_TOTAL_FIELD_KEYS = new Set([
  'al4c',
  'al3c',
  'al2c',
  'al1c',
  'tl4c',
  'tl3c',
  'tl2c',
  'tl1c',
  'anet',
  'aNet',
  'tnet',
  'tNet',
  'net',
  'aprocessor',
  'aProcessor',
  'tprocessor',
  'tProcessor',
  'processor',
  'bot1endgame',
  'bot2endgame',
  'bot3endgame',
  'bot1Endgame',
  'bot2Endgame',
  'bot3Endgame',
]);

const getAllianceTotalsRecord = (raw: unknown): Record<string, unknown> | undefined => {
  if (!isRecord(raw)) {
    return undefined;
  }

  const possibleNestedKeys = ['json', 'data', 'body', 'matchData', 'match_data'];
  const visited = new Set<Record<string, unknown>>();
  const queue: Record<string, unknown>[] = [raw];

  while (queue.length > 0) {
    const candidate = queue.shift();

    if (!candidate || visited.has(candidate)) {
      continue;
    }

    visited.add(candidate);

    const hasKnownField = Object.keys(candidate).some((key) => ALLIANCE_TOTAL_FIELD_KEYS.has(key));

    if (hasKnownField) {
      return candidate;
    }

    possibleNestedKeys.forEach((key) => {
      const value = candidate[key];

      if (isRecord(value)) {
        queue.push(value);
      }
    });
  }

  return undefined;
};

const ALLIANCE_NUMERIC_FIELD_ALIASES: Partial<
  Record<MatchValidationNumericField, readonly string[]>
> = {
  al4c: ['al4c'],
  al3c: ['al3c'],
  al2c: ['al2c'],
  al1c: ['al1c'],
  tl4c: ['tl4c'],
  tl3c: ['tl3c'],
  tl2c: ['tl2c'],
  tl1c: ['tl1c'],
  aNet: ['aNet', 'anet'],
  tNet: ['tNet', 'tnet', 'net'],
  aProcessor: ['aProcessor', 'aprocessor'],
  tProcessor: ['tProcessor', 'tprocessor', 'processor'],
};

const getAllianceNumericValue = (
  record: Record<string, unknown>,
  field: MatchValidationNumericField
) => {
  const aliases = ALLIANCE_NUMERIC_FIELD_ALIASES[field] ?? [field];

  for (const key of aliases) {
    if (key in record) {
      const parsed = parseNumericValue(record[key]);

      if (parsed !== undefined) {
        return parsed;
      }
    }
  }

  return undefined;
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

  if (!isValidNumber(teamNumber)) {
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

const formatAlliance = (value: string) => value.toUpperCase();

const SCOUT_MATCH_DATA_SOURCE_KEYS = ['matchData', 'match_data', 'data', 'json'] as const;

const parseEndgameKey = (value: unknown): Endgame2025 | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();

  if ((normalized as Endgame2025) in ENDGAME_LABELS) {
    return normalized as Endgame2025;
  }

  return undefined;
};

const extractScoutMatchData = (candidate: unknown): Partial<TeamMatchData> | undefined => {
  if (!candidate) {
    return undefined;
  }

  if (Array.isArray(candidate)) {
    for (const item of candidate) {
      const extracted = extractScoutMatchData(item);

      if (extracted) {
        return extracted;
      }
    }

    return undefined;
  }

  if (typeof candidate !== 'object') {
    return undefined;
  }

  const record = candidate as Record<string, unknown>;
  const result: Partial<TeamMatchData> = {};

  MATCH_VALIDATION_NUMERIC_FIELDS.forEach((field) => {
    const numericValue = parseNumericValue(record[field]);

    if (numericValue !== undefined) {
      result[field] = numericValue;
    }
  });

  const endgameValue = parseEndgameKey(record.endgame);

  if (endgameValue) {
    result.endgame = endgameValue;
  }

  if (Object.keys(result).length > 0) {
    return result;
  }

  for (const key of SCOUT_MATCH_DATA_SOURCE_KEYS) {
    if (record[key] !== undefined) {
      const nested = extractScoutMatchData(record[key]);

      if (nested) {
        return nested;
      }
    }
  }

  return undefined;
};

const getTeamMatchData = (candidate: unknown): Partial<TeamMatchData> | undefined =>
  extractScoutMatchData(candidate);

const ENDGAME_OPTIONS: Array<{ value: Endgame2025; label: string }> = (
  Object.entries(ENDGAME_LABELS) as Array<[Endgame2025, string]>
).map(([value, label]) => ({ value, label }));

const MAX_NUMERIC_FIELD_VALUE = 99;

export function MatchValidation() {
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

  const [teamEdits, setTeamEdits] = useState<Record<number, Partial<TeamMatchData>>>({});

  useEffect(() => {
    setTeamEdits({});
  }, [matchEntry?.match_level, matchEntry?.match_number, allianceParam]);

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
    tbaTotals: TbaTotals
  ) => {
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
          variant="light"
          size="sm"
          aria-label="Increase value"
          onClick={handleIncrement}
          disabled={numericValue >= MAX_NUMERIC_FIELD_VALUE}
        >
          +
        </ActionIcon>
        <Text fz="sm" fw={500} className={classes.numericControlValue}>
          {numericValue}
        </Text>
        <ActionIcon
          variant="light"
          size="sm"
          aria-label="Decrease value"
          onClick={handleDecrement}
          disabled={numericValue <= 0}
        >
          −
        </ActionIcon>
      </Group>
    );
  };

  const getTeamEndgameCell = (state: (typeof teamQueryStates)[number]) => {
    if (!isValidNumber(state.teamNumber)) {
      return { content: getPlaceholderNode(), className: undefined };
    }

    if (state.query.isLoading) {
      return { content: getLoaderNode(), className: undefined };
    }

    if (state.query.isError) {
      return { content: getErrorNode(), className: undefined };
    }

    const teamNumber = state.teamNumber;
    const currentValue = getCurrentEndgameValue(state);
    const label = ENDGAME_LABELS[currentValue] ?? ENDGAME_LABELS.NONE;

    const tbaLabel =
      isTbaMatchDataLoading || isTbaMatchDataError || !isValidNumber(state.teamNumber)
        ? undefined
        : aggregatedTbaData.endgame.get(state.teamNumber);

    const matchClass =
      tbaLabel !== undefined
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
          withinPortal
          styles={{ input: { textAlign: 'center' } }}
        />
      ),
      className: matchClass,
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

    const totalValue = values.reduce((total, value) => total + (value ?? 0), 0);

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
        <Title order={2}>Match Validation</Title>

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
                        ? `${formatAlliance(allianceParam)} Alliance`
                        : getPlaceholderNode()}
                </Table.Td>
              </Table.Tr>

              {MATCH_VALIDATION_TABLE_LAYOUT.map((section) => (
                <Fragment key={section.id}>
                  <Table.Tr>
                    <Table.Th scope="row" ta="right" className={classes.cell} />
                    <Table.Th colSpan={5} ta="center" className={classes.cell}>
                      {section.title}
                    </Table.Th>
                  </Table.Tr>

                  {section.rows.map((row) => {
                    if (row.type === 'numeric') {
                      const teamTotals = aggregateTeamFieldValues([row.field]);
                      const tbaTotals = getTbaTotalsForFields([row.field]);
                      const rowHighlightClass = resolveRowHighlightClassName(teamTotals, tbaTotals);

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
                        </Table.Tr>
                      );
                    }

                    if (row.type === 'paired') {
                      const fields = row.rows.map((entry) => entry.field);
                      const teamTotals = aggregateTeamFieldValues(fields);
                      const tbaTotals = getTbaTotalsForFields(fields);
                      const rowHighlightClass = resolveRowHighlightClassName(teamTotals, tbaTotals);

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
                            <Table.Th
                              scope="row"
                              rowSpan={rowSpan}
                              ta="right"
                              className={classes.cell}
                            >
                              {row.label}
                            </Table.Th>
                            {teamQueryStates.map((state, index) => {
                              const { content, className } = getTeamEndgameCell(state);

                              return (
                                <Table.Td
                                  key={`${row.id}-team-${index}`}
                                  rowSpan={rowSpan}
                                  ta="center"
                                  className={cx(classes.cell, className)}
                                >
                                  {content}
                                </Table.Td>
                              );
                            })}
                            <Table.Td rowSpan={rowSpan} ta="center" className={classes.cell}>
                              {getPlaceholderNode()}
                            </Table.Td>
                            <Table.Td ta="center" className={classes.cell}>
                              {renderTbaEndgameValue(firstTeamNumber)}
                            </Table.Td>
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
      </Stack>
    </Box>
  );
}
