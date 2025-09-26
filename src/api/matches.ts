import { useQuery } from '@tanstack/react-query';
import { apiFetch, apiFetchResponse } from './httpClient';
import type { BaseTeamMatchData, TeamMatchData } from './teams';

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
}

export const matchScheduleQueryKey = (eventCode: string) => ['match-schedule', eventCode] as const;

export const fetchMatchSchedule = (_eventCode: string) =>
  apiFetch<MatchScheduleEntry[]>('event/matches');

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

export type MatchExportType = 'csv' | 'json' | 'xls';

export const exportMatches = (fileType: MatchExportType) =>
  apiFetchResponse('organization/downloadData', {
    method: 'POST',
    json: { file_type: fileType },
  });

export const useMatchSchedule = (eventCode = '2025micmp4') =>
  useQuery({
    queryKey: matchScheduleQueryKey(eventCode),
    queryFn: () => fetchMatchSchedule(eventCode),
  });

export const useTeamMatchValidation = () =>
  useQuery({
    queryKey: teamMatchValidationQueryKey(),
    queryFn: fetchTeamMatchValidation,
  });

export const syncEventMatches = () =>
  apiFetch<void>('organization/event/matches/sync', { method: 'POST' });

export const syncScoutingData = () =>
  apiFetch<void>('scout/data/tbaUpdate', { method: 'POST' });

export interface MatchIdentifierRequest {
  matchNumber: number;
  matchLevel: string;
  teamNumber: number;
}

export interface AllianceMatchIdentifierRequest extends Omit<MatchIdentifierRequest, 'teamNumber'> {
  alliance: 'RED' | 'BLUE';
}

const buildMatchRequestPayload = (request: MatchIdentifierRequest) => ({
  matchNumber: request.matchNumber,
  matchLevel: request.matchLevel,
  teamNumber: request.teamNumber,
});

const buildAllianceRequestPayload = (request: AllianceMatchIdentifierRequest) => ({
  matchNumber: request.matchNumber,
  matchLevel: request.matchLevel,
  alliance: request.alliance,
});

export const scoutMatchQueryKey = (request: MatchIdentifierRequest) =>
  ['scout-match', request.matchLevel, request.matchNumber, request.teamNumber] as const;

export const fetchScoutMatchData = (request: MatchIdentifierRequest) =>
  apiFetch<TeamMatchData>('scout/matches', {
    method: 'GET',
    json: buildMatchRequestPayload(request),
  });

export const useScoutMatchData = (request: MatchIdentifierRequest, enabled = true) =>
  useQuery({
    queryKey: scoutMatchQueryKey(request),
    queryFn: () => fetchScoutMatchData(request),
    enabled,
  });

export interface AllianceMatchData extends BaseTeamMatchData {
  alliance: 'RED' | 'BLUE';
  al4c: number;
  al3c: number;
  al2c: number;
  al1c: number;
  tl4c: number;
  tl3c: number;
  tl2c: number;
  tl1c: number;
  aNet: number;
  tNet: number;
  aProcessor: number;
  tProcessor: number;
}

export const allianceMatchQueryKey = (request: AllianceMatchIdentifierRequest) =>
  ['tba-match-data', request.matchLevel, request.matchNumber, request.alliance] as const;

export const fetchAllianceMatchData = (request: AllianceMatchIdentifierRequest) =>
  apiFetch<AllianceMatchData>('event/tbaMatchData', {
    method: 'GET',
    json: buildAllianceRequestPayload(request),
  });

export const useAllianceMatchData = (
  request: AllianceMatchIdentifierRequest,
  enabled = true
) =>
  useQuery({
    queryKey: allianceMatchQueryKey(request),
    queryFn: () => fetchAllianceMatchData(request),
    enabled,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

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
