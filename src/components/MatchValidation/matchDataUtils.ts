import type { Endgame2025, TeamMatchData } from '@/api';
import { MATCH_VALIDATION_NUMERIC_FIELDS } from './matchValidation.config';

export const ENDGAME_LABELS: Record<Endgame2025, string> = {
  NONE: 'None',
  PARK: 'Park',
  SHALLOW: 'Shallow',
  DEEP: 'Deep',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const parseTeamNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return undefined;
    }

    const numericMatch = trimmed.match(/(\d+)/);

    if (!numericMatch) {
      return undefined;
    }

    const parsed = Number.parseInt(numericMatch[1] ?? '', 10);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

export const parseNumericValue = (value: unknown): number | undefined => {
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

export interface TbaTeamEntry {
  teamNumber: number;
  data: Partial<TeamMatchData>;
}

const extractTeamEntryFromRecord = (
  record: Record<string, unknown>
): TbaTeamEntry | undefined => {
  const teamNumber = parseTeamNumber(
    record.teamNumber ?? record.team_number ?? record.team ?? record.team_id ?? record.key
  );

  if (!teamNumber) {
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

export const extractTbaTeamEntries = (raw: unknown): TbaTeamEntry[] => {
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

export const getAllianceTotalsRecord = (
  raw: unknown
): Record<string, unknown> | undefined => {
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

    const hasKnownField = Object.keys(candidate).some((key) =>
      ALLIANCE_TOTAL_FIELD_KEYS.has(key)
    );

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
  Record<(typeof MATCH_VALIDATION_NUMERIC_FIELDS)[number], readonly string[]>
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

export const getAllianceNumericValue = (
  record: Record<string, unknown>,
  field: (typeof MATCH_VALIDATION_NUMERIC_FIELDS)[number]
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

export const formatEndgameValue = (value: unknown): string | undefined => {
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

const SCOUT_MATCH_DATA_SOURCE_KEYS = ['matchData', 'match_data', 'data', 'json'] as const;

export const parseEndgameKey = (value: unknown): Endgame2025 | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();

  if ((normalized as Endgame2025) in ENDGAME_LABELS) {
    return normalized as Endgame2025;
  }

  return undefined;
};

export const extractScoutMatchData = (
  candidate: unknown
): Partial<TeamMatchData> | undefined => {
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

export const getTeamMatchData = (
  candidate: unknown
): Partial<TeamMatchData> | undefined => extractScoutMatchData(candidate);

export const isValidTeamNumber = (value: number | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value);
