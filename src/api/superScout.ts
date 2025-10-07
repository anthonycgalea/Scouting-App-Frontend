import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './httpClient';

export interface SuperScoutField {
  key: string;
  label: string;
}

export const superScoutFieldsQueryKey = () => ['super-scout-fields'] as const;

export const fetchSuperScoutFields = () =>
  apiFetch<SuperScoutField[]>('scout/superscout/fields');

export const useSuperScoutFields = () =>
  useQuery({
    queryKey: superScoutFieldsQueryKey(),
    queryFn: fetchSuperScoutFields,
  });

export interface SuperScoutMatchEntry extends Record<string, unknown> {
  season: number;
  team_number: number;
  event_key: string;
  match_number: number;
  match_level: string;
  user_id?: string;
  organization_id?: number;
  timestamp?: string;
  notes?: string | null;
  startPosition?: string | null;
  driver_rating?: number | null;
  robot_overall?: number | null;
  defense_rating?: number | null;
}

export const superScoutMatchDataQueryKey = (teamNumber: number) =>
  ['super-scout-match-data', teamNumber] as const;

export const fetchSuperScoutMatchData = (teamNumber: number) =>
  apiFetch<SuperScoutMatchEntry[]>(`scout/superscout?team_number=${teamNumber}`);

export const useSuperScoutMatchData = (teamNumber: number) =>
  useQuery({
    queryKey: superScoutMatchDataQueryKey(teamNumber),
    queryFn: () => fetchSuperScoutMatchData(teamNumber),
    enabled: Number.isFinite(teamNumber),
  });

export interface SuperScoutStatus {
  eventCode: string;
  matchLevel: string;
  matchNumber: number;
  red: boolean;
  blue: boolean;
}

export const superScoutStatusesQueryKey = () => ['super-scout-statuses'] as const;

export const fetchSuperScoutStatuses = () =>
  apiFetch<SuperScoutStatus[]>('scout/superscouted');

export const useSuperScoutStatuses = () =>
  useQuery({
    queryKey: superScoutStatusesQueryKey(),
    queryFn: fetchSuperScoutStatuses,
  });
