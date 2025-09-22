import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './httpClient';

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

export const fetchMatchSchedule = (eventCode: string) =>
  apiFetch<MatchScheduleEntry[]>(`event/${eventCode}/matches`);

export const useMatchSchedule = (eventCode = '2025mimid') =>
  useQuery({
    queryKey: matchScheduleQueryKey(eventCode),
    queryFn: () => fetchMatchSchedule(eventCode),
  });
