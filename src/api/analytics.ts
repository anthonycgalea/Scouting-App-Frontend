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

export interface HeadToHeadMetricResponse {
  min: number;
  max: number;
  median: number;
  average: number;
  stdev: number;
}

export interface TeamHeadToHeadResponse {
  team_number: number;
  team_name?: string;
  matches_played: number;
  autonomous_coral?: HeadToHeadMetricResponse;
  autonomous_net_algae?: HeadToHeadMetricResponse;
  autonomous_processor_algae?: HeadToHeadMetricResponse;
  autonomous_points?: HeadToHeadMetricResponse;
  teleop_coral?: HeadToHeadMetricResponse;
  teleop_game_pieces?: HeadToHeadMetricResponse;
  teleop_points?: HeadToHeadMetricResponse;
  teleop_net_algae?: HeadToHeadMetricResponse;
  teleop_processor_algae?: HeadToHeadMetricResponse;
  endgame_points?: HeadToHeadMetricResponse;
  total_points?: HeadToHeadMetricResponse;
  total_net_algae?: HeadToHeadMetricResponse;
  endgame_success_rate?: number | null;
}

export interface TeamMatchPerformanceResponse {
  team_number: number;
  match_level: string;
  match_number: number;
  autonomous_points: number;
  teleop_points: number;
  endgame_points: number;
  game_pieces: number;
  total_points: number;
  notes: string | null;
}

export interface TeamMatchHistoryResponse {
  team_number: number;
  team_name?: string;
  matches_played: number;
  matches: TeamMatchPerformanceResponse[];
}

export interface RankingPredictionResponse {
  event_key: string;
  organization_id: number;
  timestamp: string;
  team_number: number;
  rank_5: number;
  rank_95: number;
  median_rank: number;
  mean_rank: number;
  mean_rp: number;
}

export interface TeamZScoreExtreme {
  min: number;
  max: number;
}

export interface TeamZScoreExtremes {
  [metric: string]: TeamZScoreExtreme;
}

export interface TeamZScoreResponseTeam {
  team_number: number;
  team_name?: string;
  matches_played: number;
  [metric: string]: number | string | undefined;
}

export interface TeamZScoreResponse {
  teams: TeamZScoreResponseTeam[];
  z_score_extremes: TeamZScoreExtremes;
}

export const teamAnalyticsQueryKey = () => ['analytics', 'team-performance'] as const;

export const fetchTeamAnalytics = () =>
  apiFetch<TeamAnalyticsResponse[]>('analytics/eventSummary/teams');

export const teamDetailedAnalyticsQueryKey = () => ['analytics', 'team-performance-detailed'] as const;

export const fetchTeamDetailedAnalytics = () =>
  apiFetch<TeamDetailedAnalyticsResponse[]>('analytics/event/teams/detailed');

export const teamHeadToHeadQueryKey = () => ['analytics', 'team-head-to-head'] as const;

export const fetchTeamHeadToHeadStats = () =>
  apiFetch<TeamHeadToHeadResponse[]>('analytics/event/teams/headToHead');

export const teamMatchHistoryQueryKey = () => ['analytics', 'team-match-history'] as const;

export const fetchTeamMatchHistory = () =>
  apiFetch<TeamMatchHistoryResponse[]>('analytics/event/teams/matches');

export const teamZScoresQueryKey = () => ['analytics', 'team-z-scores'] as const;

export const fetchTeamZScores = () =>
  apiFetch<TeamZScoreResponse>('analytics/event/teams/zScores');

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

export const useTeamHeadToHeadStats = () =>
  useQuery({
    queryKey: teamHeadToHeadQueryKey(),
    queryFn: fetchTeamHeadToHeadStats,
  });

export const useTeamMatchHistory = () =>
  useQuery({
    queryKey: teamMatchHistoryQueryKey(),
    queryFn: fetchTeamMatchHistory,
  });

export const useTeamZScores = () =>
  useQuery({
    queryKey: teamZScoresQueryKey(),
    queryFn: fetchTeamZScores,
  });

export const rankingPredictionsQueryKey = () =>
  ['analytics', 'event', 'rankings', 'predictions'] as const;

export const fetchRankingPredictions = () =>
  apiFetch<RankingPredictionResponse[]>('analytics/event/rankings/prediction');

export const useRankingPredictions = () =>
  useQuery({
    queryKey: rankingPredictionsQueryKey(),
    queryFn: fetchRankingPredictions,
  });
