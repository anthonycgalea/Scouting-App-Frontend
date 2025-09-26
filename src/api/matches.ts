import { useQuery } from '@tanstack/react-query';
import { apiFetch, apiFetchResponse } from './httpClient';

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

export const syncEventMatches = () =>
  apiFetch<void>('organization/event/matches/sync', { method: 'POST' });
