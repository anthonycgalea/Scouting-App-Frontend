import { useQuery } from '@tanstack/react-query';

import { apiFetch } from './httpClient';

export interface TeamAnalyticsResponse {
  team_number: number;
  team_name?: string;
  matches_played: number;
  autonomous_points_average: number;
  teleop_points_average: number;
  endgame_points_average: number;
  game_piece_average: number;
  total_points_average: number;
}

export const teamAnalyticsQueryKey = () => ['analytics', 'team-performance'] as const;

export const fetchTeamAnalytics = () =>
  apiFetch<TeamAnalyticsResponse[]>('analytics/eventSummary/teams');

export const useTeamAnalytics = () =>
  useQuery({
    queryKey: teamAnalyticsQueryKey(),
    queryFn: fetchTeamAnalytics,
  });
