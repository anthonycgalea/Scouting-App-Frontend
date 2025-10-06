import { useQuery } from '@tanstack/react-query';
import { apiFetch, apiFetchResponse } from './httpClient';
import type { TeamMatchData } from './teams';

export interface MatchScheduleEntry {
  event_key: string;
  match_number: number;
  match_level: string;
  red1_id: number;
  red2_id: number;
  red3_id: number;
  blue1_id: number;
  blue2_id: number;
  blue3_id: number;
  season?: number;
}

export const matchScheduleQueryKey = () => ['match-schedule'] as const;

export const fetchMatchSchedule = () => apiFetch<MatchScheduleEntry[]>('event/matches');

export type TeamMatchValidationStatus = 'PENDING' | 'NEEDS REVIEW' | 'VALID';

export interface TeamMatchValidationEntry {
  event_key: string;
  match_number: number;
  match_level: string;
  user_id: string;
  team_number: number;
  organization_id: number;
  timestamp: string;
  validation_status: TeamMatchValidationStatus;
  notes: string | null;
}

export const teamMatchValidationQueryKey = () => ['team-match-validation'] as const;

export const fetchTeamMatchValidation = () =>
  apiFetch<TeamMatchValidationEntry[]>('scout/dataValidation');

export interface ScoutMatchRequest {
  matchNumber: number;
  matchLevel: string;
  teamNumber: number;
}

export type ScoutMatchResponse = Record<string, unknown>;

export const scoutMatchQueryKey = ({ matchNumber, matchLevel, teamNumber }: ScoutMatchRequest) =>
  ['scout-match', matchLevel, matchNumber, teamNumber] as const;

export const fetchScoutMatch = ({ matchNumber, matchLevel, teamNumber }: ScoutMatchRequest) =>
  apiFetch<ScoutMatchResponse>('scout/matches', {
    method: 'POST',
    json: {
      matchNumber,
      matchLevel,
      teamNumber,
    },
  });

export type MatchExportType = 'csv' | 'json' | 'xls';

export const exportMatches = (fileType: MatchExportType) =>
  apiFetchResponse('organization/downloadData', {
    method: 'POST',
    json: { file_type: fileType },
  });

export const useMatchSchedule = () =>
  useQuery({
    queryKey: matchScheduleQueryKey(),
    queryFn: fetchMatchSchedule,
  });

export const useTeamMatchValidation = () =>
  useQuery({
    queryKey: teamMatchValidationQueryKey(),
    queryFn: fetchTeamMatchValidation,
  });

export const useScoutMatch = (params: ScoutMatchRequest) =>
  useQuery({
    queryKey: scoutMatchQueryKey(params),
    queryFn: () => fetchScoutMatch(params),
    enabled:
      Number.isFinite(params.matchNumber) &&
      Number.isFinite(params.teamNumber) &&
      Boolean(params.matchLevel),
  });

export const syncEventMatches = () =>
  apiFetch<void>('organization/event/matches/sync', { method: 'POST' });

export const syncScoutingData = () =>
  apiFetch<void>('scout/data/tbaUpdate', { method: 'POST' });

export const updateMatchDataBatch = (matchData: TeamMatchData[]) =>
  apiFetch<void>('scout/edit/batch', {
    method: 'PUT',
    json: { matchData },
  });

export interface ValidationStatusUpdate {
  matchNumber: number;
  matchLevel: string;
  teamNumber: number;
  validationStatus: TeamMatchValidationStatus;
  notes?: string | null;
}

export interface MatchValidationDataUpdate {
  season: number;
  eventKey: string;
  matchNumber: number;
  matchLevel: string;
  teamNumber: number;
  userId?: string;
  organizationId?: number;
  matchData: TeamMatchData;
  notes?: string | null;
}

const buildValidationPayload = (update: ValidationStatusUpdate) => ({
  matchNumber: update.matchNumber,
  matchLevel: update.matchLevel,
  teamNumber: update.teamNumber,
  validationStatus: update.validationStatus,
  notes: update.notes,
  match_number: update.matchNumber,
  match_level: update.matchLevel,
  team_number: update.teamNumber,
  validation_status: update.validationStatus,
});

export const updateValidationStatuses = (updates: ValidationStatusUpdate[]) =>
  apiFetch<void>('scout/dataValidation', {
    method: 'PATCH',
    json: { matches: updates.map((update) => buildValidationPayload(update)) },
});

const buildMatchDataPayload = (update: MatchValidationDataUpdate) => {
  const payload: TeamMatchData & { notes?: string | null } = {
    ...update.matchData,
    season: update.season,
    event_key: update.eventKey,
    match_number: update.matchNumber,
    match_level: update.matchLevel,
    team_number: update.teamNumber,
  };

  if (update.userId !== undefined) {
    payload.user_id = update.userId;
  }

  if (update.organizationId !== undefined) {
    payload.organization_id = update.organizationId;
  }

  if (update.notes !== undefined) {
    payload.notes = update.notes;
  }

  return payload;
};

export const submitMatchValidationData = async (updates: MatchValidationDataUpdate[]) => {
  await Promise.all(
    updates.map((update) =>
      apiFetch<void>('scout/dataValidation', {
        method: 'PUT',
        json: buildMatchDataPayload(update),
      })
    )
  );
};
