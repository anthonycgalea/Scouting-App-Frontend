import { useQuery } from '@tanstack/react-query';
import { apiFetch, apiFetchResponse } from './httpClient';
import type { EventTeamImages, TeamMatchData } from './teams';

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

export interface MetricStatistics {
  average: number | null;
  standard_deviation: number | null;
}

export interface PhaseMetrics {
  level4: MetricStatistics;
  level3: MetricStatistics;
  level2: MetricStatistics;
  level1: MetricStatistics;
  net: MetricStatistics;
  processor: MetricStatistics;
  total_points: MetricStatistics;
}

export interface TeamMatchPreview {
  team_number: number;
  auto: PhaseMetrics;
  teleop: PhaseMetrics;
  endgame: MetricStatistics;
  total_points: MetricStatistics;
}

export interface AllianceLevelValues {
  level4: number | null;
  level3: number | null;
  level2: number | null;
  level1: number | null;
}

export interface AllianceLevelAverages {
  auto: AllianceLevelValues;
  teleop: AllianceLevelValues;
  adjusted: AllianceLevelValues;
}

export interface AllianceMatchPreview {
  teams: TeamMatchPreview[];
  alliance_level_averages: AllianceLevelAverages;
}

export interface MatchPreviewRequest {
  matchLevel: string;
  matchNumber: number;
}

export interface MatchPreviewResponse {
  season: number;
  red: AllianceMatchPreview;
  blue: AllianceMatchPreview;
}

export interface MatchImagesRequest {
  matchLevel: string;
  matchNumber: number;
}

export const matchPreviewQueryKey = (params?: MatchPreviewRequest) =>
  ['match-preview', params?.matchLevel, params?.matchNumber] as const;

export const fetchMatchPreview = ({ matchLevel, matchNumber }: MatchPreviewRequest) =>
  apiFetch<MatchPreviewResponse>(
    `event/match/${encodeURIComponent(matchLevel.toLowerCase())}/${matchNumber}/preview`
  );

export const matchImagesQueryKey = (params?: MatchImagesRequest) =>
  ['match-images', params?.matchLevel, params?.matchNumber] as const;

export const fetchMatchImages = ({ matchLevel, matchNumber }: MatchImagesRequest) =>
  apiFetch<EventTeamImages[]>(
    `event/match/${encodeURIComponent(matchLevel.toLowerCase())}/${matchNumber}/images`
  );

interface MatchSimulationBase {
  event_key: string;
  match_level: string;
  match_number: number;
  organization_id: number;
  season: number;
  timestamp: string;
  n_samples: number;
}

export interface MatchSimulation2025 extends MatchSimulationBase {
  red_alliance_win_pct: number;
  blue_alliance_win_pct: number;
  red_auto_rp: number;
  red_w_coral_rp: number;
  red_r_coral_rp: number;
  red_endgame_rp: number;
  red_wr_win_pct: number;
  red_rr_win_pct: number;
  red_rw_win_pct: number;
  blue_auto_rp: number;
  blue_w_coral_rp: number;
  blue_r_coral_rp: number;
  blue_endgame_rp: number;
  blue_wr_win_pct: number;
  blue_rr_win_pct: number;
  blue_rw_win_pct: number;
}

export type MatchSimulationResponse = MatchSimulation2025 | string;

export const matchSimulationQueryKey = (params?: MatchPreviewRequest) =>
  ['match-simulation', params?.matchLevel, params?.matchNumber] as const;

export const fetchMatchSimulation = ({ matchLevel, matchNumber }: MatchPreviewRequest) =>
  apiFetch<MatchSimulationResponse>(
    `event/match/${encodeURIComponent(matchLevel.toLowerCase())}/${matchNumber}/simulation`
  );

export const runMatchSimulation = ({ matchLevel, matchNumber }: MatchPreviewRequest) =>
  apiFetch<MatchSimulationResponse>(
    `event/match/${encodeURIComponent(matchLevel.toLowerCase())}/${matchNumber}/simulation`,
    { method: 'POST' }
  );

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

export const useMatchPreview = (params?: MatchPreviewRequest) =>
  useQuery({
    queryKey: matchPreviewQueryKey(params),
    queryFn: () => {
      if (!params) {
        throw new Error('Match preview parameters are required');
      }

      return fetchMatchPreview(params);
    },
    enabled:
      Boolean(params?.matchLevel) &&
      Number.isFinite(params?.matchNumber) &&
      (params?.matchNumber ?? 0) > 0,
  });

export const useMatchImages = (params?: MatchImagesRequest) =>
  useQuery({
    queryKey: matchImagesQueryKey(params),
    queryFn: () => {
      if (!params) {
        throw new Error('Match images parameters are required');
      }

      return fetchMatchImages(params);
    },
    enabled:
      Boolean(params?.matchLevel) &&
      Number.isFinite(params?.matchNumber) &&
      (params?.matchNumber ?? 0) > 0,
  });

export const useMatchSimulation = (params?: MatchPreviewRequest) =>
  useQuery({
    queryKey: matchSimulationQueryKey(params),
    queryFn: () => {
      if (!params) {
        throw new Error('Match simulation parameters are required');
      }

      return fetchMatchSimulation(params);
    },
    enabled:
      Boolean(params?.matchLevel) &&
      Number.isFinite(params?.matchNumber) &&
      (params?.matchNumber ?? 0) > 0,
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
  const payload: (TeamMatchData & { notes?: string | null }) & Record<string, unknown> = {
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
