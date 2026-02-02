import type { Endgame2025, TeamMatchData2025 } from '@/api/teams';
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

export type AllianceColor = 'RED' | 'BLUE';

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const parseIntegerLike = (value: unknown): number | undefined => {
  if (isFiniteNumber(value)) {
    return Math.trunc(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return undefined;
    }

    const match = trimmed.match(/(-?\d+)/);

    if (!match) {
      return undefined;
    }

    const parsed = Number.parseInt(match[1] ?? '', 10);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const parseStringLike = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (isFiniteNumber(value)) {
    return String(Math.trunc(value));
  }

  return undefined;
};

const normalizeMatchLevel = (value: string): string => value.trim().toUpperCase();

const parseMatchLevel = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  return trimmed.toUpperCase();
};

const parseAllianceValue = (value: unknown): AllianceColor | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();

  if (normalized === 'RED' || normalized === 'BLUE') {
    return normalized;
  }

  if (normalized === 'R') {
    return 'RED';
  }

  if (normalized === 'B') {
    return 'BLUE';
  }

  if (
    normalized.startsWith('RED') ||
    normalized.endsWith('RED') ||
    normalized.includes('RED_') ||
    normalized.includes('RED-') ||
    normalized.includes(' RED ')
  ) {
    return 'RED';
  }

  if (
    normalized.startsWith('BLUE') ||
    normalized.endsWith('BLUE') ||
    normalized.includes('BLUE_') ||
    normalized.includes('BLUE-') ||
    normalized.includes(' BLUE ')
  ) {
    return 'BLUE';
  }

  if (normalized.includes('RED ALLIANCE') || normalized.includes('ALLIANCE RED')) {
    return 'RED';
  }

  if (normalized.includes('BLUE ALLIANCE') || normalized.includes('ALLIANCE BLUE')) {
    return 'BLUE';
  }

  return undefined;
};

const parseAllianceKey = (key: string): AllianceColor | undefined =>
  parseAllianceValue(key);

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
  data: Partial<TeamMatchData2025>;
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
    data: dataCandidate as Partial<TeamMatchData2025>,
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
          data: value as Partial<TeamMatchData2025>,
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
): Partial<TeamMatchData2025> | undefined => {
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
  const result: Partial<TeamMatchData2025> = {};

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
): Partial<TeamMatchData2025> | undefined => extractScoutMatchData(candidate);

export const isValidTeamNumber = (value: number | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export type ScoutMatchLookup = Map<string, Record<string, unknown>>;

const scoutMatchLookupCache = new WeakMap<object, ScoutMatchLookup>();

interface ScoutMatchContext {
  matchLevel?: string;
  matchNumber?: number;
  eventKey?: string;
  season?: number;
  userId?: string;
  organizationId?: number;
  notes?: string | null;
}

const buildScoutContextRecord = (
  record: Record<string, unknown>,
  context: ScoutMatchContext,
  teamNumber: number
) => {
  const enriched: Record<string, unknown> = { ...record };

  if (context.matchLevel) {
    if (enriched.matchLevel === undefined) {
      enriched.matchLevel = context.matchLevel;
    }

    if (enriched.match_level === undefined) {
      enriched.match_level = context.matchLevel;
    }
  }

  if (context.matchNumber !== undefined) {
    if (enriched.matchNumber === undefined) {
      enriched.matchNumber = context.matchNumber;
    }

    if (enriched.match_number === undefined) {
      enriched.match_number = context.matchNumber;
    }
  }

  if (enriched.teamNumber === undefined) {
    enriched.teamNumber = teamNumber;
  }

  if (enriched.team_number === undefined) {
    enriched.team_number = teamNumber;
  }

  if (context.eventKey) {
    if (enriched.eventKey === undefined) {
      enriched.eventKey = context.eventKey;
    }

    if (enriched.event_key === undefined) {
      enriched.event_key = context.eventKey;
    }
  }

  if (context.season !== undefined && enriched.season === undefined) {
    enriched.season = context.season;
  }

  if (context.userId) {
    if (enriched.userId === undefined) {
      enriched.userId = context.userId;
    }

    if (enriched.user_id === undefined) {
      enriched.user_id = context.userId;
    }
  }

  if (
    context.organizationId !== undefined &&
    enriched.organizationId === undefined
  ) {
    enriched.organizationId = context.organizationId;
  }

  if (
    context.organizationId !== undefined &&
    enriched.organization_id === undefined
  ) {
    enriched.organization_id = context.organizationId;
  }

  if (context.notes !== undefined && enriched.notes === undefined) {
    enriched.notes = context.notes;
  }

  return enriched;
};

const collectScoutMatchEntries = (
  value: unknown,
  context: ScoutMatchContext,
  map: ScoutMatchLookup,
  visited: WeakSet<object>
) => {
  if (!value || typeof value !== 'object') {
    return;
  }

  if (visited.has(value as object)) {
    return;
  }

  visited.add(value as object);

  if (Array.isArray(value)) {
    value.forEach((item) => collectScoutMatchEntries(item, context, map, visited));

    return;
  }

  const record = value as Record<string, unknown>;
  const nextContext: ScoutMatchContext = { ...context };

  const matchLevelCandidate =
    parseMatchLevel(
      record.matchLevel ??
        record.match_level ??
        record.comp_level ??
        record.level ??
        record.matchType ??
        record.match_type ??
        record.type ??
        record.compLevel
    ) ?? nextContext.matchLevel;

  if (matchLevelCandidate) {
    nextContext.matchLevel = matchLevelCandidate;
  }

  const matchNumberCandidate =
    parseIntegerLike(
      record.matchNumber ??
        record.match_number ??
        record.match ??
        record.matchIndex ??
        record.match_index ??
        record.matchId ??
        record.match_id ??
        record.matchKey ??
        record.match_key ??
        record.bout ??
        record.bout_number ??
        record.number
    );

  if (matchNumberCandidate !== undefined) {
    nextContext.matchNumber = matchNumberCandidate;
  }

  const seasonCandidate = parseIntegerLike(
    record.season ?? record.year ?? record.season_year
  );

  if (seasonCandidate !== undefined) {
    nextContext.season = seasonCandidate;
  }

  const eventKeyCandidate = parseStringLike(
    record.eventKey ?? record.event_key ?? record.event ?? record.tournament_key
  );

  if (eventKeyCandidate) {
    nextContext.eventKey = eventKeyCandidate;
  }

  const userIdCandidate = parseStringLike(record.userId ?? record.user_id);

  if (userIdCandidate) {
    nextContext.userId = userIdCandidate;
  }

  const organizationIdCandidate = parseIntegerLike(
    record.organizationId ?? record.organization_id
  );

  if (organizationIdCandidate !== undefined) {
    nextContext.organizationId = organizationIdCandidate;
  }

  const notesValue = record.notes;

  if (notesValue === null || typeof notesValue === 'string') {
    nextContext.notes = notesValue;
  }

  const teamNumberCandidate = parseTeamNumber(
    record.teamNumber ??
      record.team_number ??
      record.team ??
      record.team_id ??
      record.teamKey ??
      record.team_key ??
      record.key ??
      record.participant ??
      record.participant_id ??
      record.robot ??
      record.robot_id
  );

  if (
    teamNumberCandidate !== undefined &&
    nextContext.matchLevel &&
    nextContext.matchNumber !== undefined
  ) {
    const key = buildScoutMatchKey(
      nextContext.matchLevel,
      nextContext.matchNumber,
      teamNumberCandidate
    );

    if (!map.has(key)) {
      map.set(
        key,
        buildScoutContextRecord(record, nextContext, teamNumberCandidate)
      );
    }
  }

  Object.values(record).forEach((child) => {
    if (child && typeof child === 'object') {
      collectScoutMatchEntries(child, nextContext, map, visited);
    }
  });
};

export const buildScoutMatchKey = (
  matchLevel: string,
  matchNumber: number,
  teamNumber: number
) => `${normalizeMatchLevel(matchLevel)}-${matchNumber}-${teamNumber}`;

export const createScoutMatchLookup = (root: unknown): ScoutMatchLookup => {
  if (!root || typeof root !== 'object') {
    return new Map();
  }

  const rootObject = root as object;
  const cached = scoutMatchLookupCache.get(rootObject);

  if (cached) {
    return cached;
  }

  const lookup: ScoutMatchLookup = new Map();
  const visited = new WeakSet<object>();

  collectScoutMatchEntries(rootObject, {}, lookup, visited);

  scoutMatchLookupCache.set(rootObject, lookup);

  return lookup;
};

export const findScoutMatchRecordInLookup = (
  lookup: ScoutMatchLookup,
  {
    matchLevel,
    matchNumber,
    teamNumber,
  }: { matchLevel: string; matchNumber: number; teamNumber: number }
): Record<string, unknown> | undefined => {
  if (
    !matchLevel ||
    !isFiniteNumber(matchNumber) ||
    !isFiniteNumber(teamNumber)
  ) {
    return undefined;
  }

  const key = buildScoutMatchKey(matchLevel, matchNumber, teamNumber);

  return lookup.get(key);
};

export const findScoutMatchRecord = (
  root: unknown,
  params: { matchLevel: string; matchNumber: number; teamNumber: number }
) => findScoutMatchRecordInLookup(createScoutMatchLookup(root), params);

export type TbaAllianceLookup = Map<string, Record<string, unknown>>;

const tbaAllianceLookupCache = new WeakMap<object, TbaAllianceLookup>();

interface TbaAllianceContext {
  matchLevel?: string;
  matchNumber?: number;
  eventKey?: string;
  season?: number;
  alliance?: AllianceColor;
}

const buildAllianceContextRecord = (
  record: Record<string, unknown>,
  context: TbaAllianceContext
) => {
  const enriched: Record<string, unknown> = { ...record };

  if (context.matchLevel) {
    if (enriched.matchLevel === undefined) {
      enriched.matchLevel = context.matchLevel;
    }

    if (enriched.match_level === undefined) {
      enriched.match_level = context.matchLevel;
    }
  }

  if (context.matchNumber !== undefined) {
    if (enriched.matchNumber === undefined) {
      enriched.matchNumber = context.matchNumber;
    }

    if (enriched.match_number === undefined) {
      enriched.match_number = context.matchNumber;
    }
  }

  if (context.eventKey) {
    if (enriched.eventKey === undefined) {
      enriched.eventKey = context.eventKey;
    }

    if (enriched.event_key === undefined) {
      enriched.event_key = context.eventKey;
    }
  }

  if (context.season !== undefined && enriched.season === undefined) {
    enriched.season = context.season;
  }

  if (context.alliance) {
    if (enriched.alliance === undefined) {
      enriched.alliance = context.alliance;
    }

    if (enriched.allianceColor === undefined) {
      enriched.allianceColor = context.alliance;
    }

    if (enriched.alliance_color === undefined) {
      enriched.alliance_color = context.alliance;
    }
  }

  return enriched;
};

const collectTbaAllianceEntries = (
  value: unknown,
  context: TbaAllianceContext,
  map: TbaAllianceLookup,
  visited: WeakSet<object>
) => {
  if (!value || typeof value !== 'object') {
    return;
  }

  if (visited.has(value as object)) {
    return;
  }

  visited.add(value as object);

  if (Array.isArray(value)) {
    value.forEach((item) => collectTbaAllianceEntries(item, context, map, visited));

    return;
  }

  const record = value as Record<string, unknown>;
  const nextContext: TbaAllianceContext = { ...context };

  const matchLevelCandidate =
    parseMatchLevel(
      record.matchLevel ??
        record.match_level ??
        record.comp_level ??
        record.level ??
        record.matchType ??
        record.match_type ??
        record.type ??
        record.compLevel
    ) ?? nextContext.matchLevel;

  if (matchLevelCandidate) {
    nextContext.matchLevel = matchLevelCandidate;
  }

  const matchNumberCandidate =
    parseIntegerLike(
      record.matchNumber ??
        record.match_number ??
        record.match ??
        record.matchIndex ??
        record.match_index ??
        record.matchId ??
        record.match_id ??
        record.matchKey ??
        record.match_key ??
        record.number
    );

  if (matchNumberCandidate !== undefined) {
    nextContext.matchNumber = matchNumberCandidate;
  }

  const seasonCandidate = parseIntegerLike(
    record.season ?? record.year ?? record.season_year
  );

  if (seasonCandidate !== undefined) {
    nextContext.season = seasonCandidate;
  }

  const eventKeyCandidate = parseStringLike(
    record.eventKey ?? record.event_key ?? record.event ?? record.tournament_key
  );

  if (eventKeyCandidate) {
    nextContext.eventKey = eventKeyCandidate;
  }

  const allianceCandidate =
    parseAllianceValue(
      record.alliance ??
        record.allianceColor ??
        record.alliance_color ??
        record.color ??
        record.station ??
        record.side ??
        record.teamColor ??
        record.team_color
    ) ?? nextContext.alliance;

  if (allianceCandidate) {
    nextContext.alliance = allianceCandidate;
  }

  const alliancesValue = record.alliances;

  if (alliancesValue && typeof alliancesValue === 'object') {
    Object.entries(alliancesValue as Record<string, unknown>).forEach(
      ([key, child]) => {
        if (!child || typeof child !== 'object') {
          return;
        }

        const allianceFromKey = parseAllianceKey(key);

        if (!allianceFromKey) {
          return;
        }

        collectTbaAllianceEntries(
          child,
          { ...nextContext, alliance: allianceFromKey },
          map,
          visited
        );
      }
    );
  }

  if (
    nextContext.matchLevel &&
    nextContext.matchNumber !== undefined &&
    nextContext.alliance
  ) {
    const key = buildTbaAllianceKey(
      nextContext.matchLevel,
      nextContext.matchNumber,
      nextContext.alliance
    );

    if (!map.has(key)) {
      map.set(key, buildAllianceContextRecord(record, nextContext));
    }
  }

  Object.entries(record).forEach(([key, child]) => {
    if (key === 'alliances') {
      return;
    }

    if (!child || typeof child !== 'object') {
      return;
    }

    const allianceFromKey = parseAllianceKey(key);

    if (allianceFromKey) {
      collectTbaAllianceEntries(
        child,
        { ...nextContext, alliance: allianceFromKey },
        map,
        visited
      );

      return;
    }

    collectTbaAllianceEntries(child, nextContext, map, visited);
  });
};

export const buildTbaAllianceKey = (
  matchLevel: string,
  matchNumber: number,
  alliance: AllianceColor
) => `${normalizeMatchLevel(matchLevel)}-${matchNumber}-${alliance}`;

export const createTbaAllianceLookup = (
  root: unknown
): TbaAllianceLookup => {
  if (!root || typeof root !== 'object') {
    return new Map();
  }

  const rootObject = root as object;
  const cached = tbaAllianceLookupCache.get(rootObject);

  if (cached) {
    return cached;
  }

  const lookup: TbaAllianceLookup = new Map();
  const visited = new WeakSet<object>();

  collectTbaAllianceEntries(rootObject, {}, lookup, visited);

  tbaAllianceLookupCache.set(rootObject, lookup);

  return lookup;
};

export const findTbaAllianceRecordInLookup = (
  lookup: TbaAllianceLookup,
  {
    matchLevel,
    matchNumber,
    alliance,
  }: { matchLevel: string; matchNumber: number; alliance: AllianceColor }
): Record<string, unknown> | undefined => {
  if (!matchLevel || !isFiniteNumber(matchNumber)) {
    return undefined;
  }

  const key = buildTbaAllianceKey(matchLevel, matchNumber, alliance);

  return lookup.get(key);
};

export const findTbaAllianceRecord = (
  root: unknown,
  params: { matchLevel: string; matchNumber: number; alliance: AllianceColor }
) => findTbaAllianceRecordInLookup(createTbaAllianceLookup(root), params);
