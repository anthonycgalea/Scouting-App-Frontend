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

export interface QuartileBreakdown {
  min: number;
  lowerQuartile: number;
  median: number;
  upperQuartile: number;
  max: number;
  average: number;
}

export interface TeamDetailedAnalyticsResponse {
  team_number: number;
  team_name?: string;
  matches_played: number;
  autonomous_points: QuartileBreakdown;
  teleop_points: QuartileBreakdown;
  game_pieces: QuartileBreakdown;
  total_points: QuartileBreakdown;
}

export const teamAnalyticsQueryKey = () => ['analytics', 'team-performance'] as const;

export const fetchTeamAnalytics = () =>
  apiFetch<TeamAnalyticsResponse[]>('analytics/eventSummary/teams');

export const teamDetailedAnalyticsQueryKey = () => ['analytics', 'team-performance-detailed'] as const;

export const fetchTeamDetailedAnalytics = () =>
  apiFetch<TeamDetailedAnalyticsResponse[]>('analytics/event/teams/detailed');

export const useTeamAnalytics = () =>
  useQuery({
    queryKey: teamAnalyticsQueryKey(),
    queryFn: fetchTeamAnalytics,
  });

export const useTeamDetailedAnalytics = () =>
  useQuery({
    queryKey: teamDetailedAnalyticsQueryKey(),
    queryFn: fetchTeamDetailedAnalytics,
  });
