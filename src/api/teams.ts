import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './httpClient';

export interface EventTeam {
  team_number: number;
  team_name: string;
  location: string;
}

export const eventTeamsQueryKey = (eventCode: string) =>
  ['event-teams', eventCode] as const;

export const fetchEventTeams = (eventCode: string) =>
  apiFetch<EventTeam[]>(`event/${eventCode}/teams`);

export const useEventTeams = (eventCode = '2025mimid') =>
  useQuery({
    queryKey: eventTeamsQueryKey(eventCode),
    queryFn: () => fetchEventTeams(eventCode),
  });
