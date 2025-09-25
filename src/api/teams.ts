import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './httpClient';

export interface EventTeam {
  team_number: number;
  team_name: string;
  location: string;
}

export interface TeamInfo {
  team_number: number;
  team_name: string;
  location: string;
  rookieYear: number | null;
}

export const eventTeamsQueryKey = (eventCode: string) =>
  ['event-teams', eventCode] as const;

export const fetchEventTeams = (_eventCode: string) => apiFetch<EventTeam[]>('event/teams');

export const useEventTeams = (eventCode = '2025micmp4') =>
  useQuery({
    queryKey: eventTeamsQueryKey(eventCode),
    queryFn: () => fetchEventTeams(eventCode),
  });

export const teamInfoQueryKey = (teamNumber: number) =>
  ['team-info', teamNumber] as const;

export const fetchTeamInfo = (teamNumber: number) =>
  apiFetch<TeamInfo>(`teams/${teamNumber}/info`);

export const useTeamInfo = (teamNumber: number) =>
  useQuery({
    queryKey: teamInfoQueryKey(teamNumber),
    queryFn: () => fetchTeamInfo(teamNumber),
    enabled: Number.isFinite(teamNumber),
  });
