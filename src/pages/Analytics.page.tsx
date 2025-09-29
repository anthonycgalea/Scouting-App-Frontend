import { useMemo } from 'react';

import { useTeamAnalytics, type TeamAnalyticsResponse } from '@/api';
import BarChart2025 from '@/components/BarChart2025/BarChart2025';
import { ScatterChart2025 } from '@/components/ScatterChart2025/ScatterChart2025';
import { type TeamPerformanceSummary } from '@/types/analytics';
import { Box, Center, Loader, Stack, Text, Title } from '@mantine/core';

const mapAnalyticsResponse = (team: TeamAnalyticsResponse): TeamPerformanceSummary => ({
  teamNumber: team.team_number,
  teamName: team.team_name,
  matchesPlayed: team.matches_played,
  autonomousAverage: team.autonomous_points_average,
  teleopAverage: team.teleop_points_average,
  endgameAverage: team.endgame_points_average,
  gamePieceAverage: team.game_piece_average,
  totalAverage: team.total_points_average,
});

export function AnalyticsPage() {
  const {
    data: analyticsData,
    isLoading,
    isError,
  } = useTeamAnalytics();

  const teams = useMemo<TeamPerformanceSummary[]>(() => {
    if (!analyticsData || analyticsData.length === 0) {
      return [];
    }

    return analyticsData.map(mapAnalyticsResponse);
  }, [analyticsData]);

  const hasTeams = teams.length > 0;
  const showLoadError = isError && !isLoading;
  const showNoDataMessage = !isLoading && !showLoadError && !hasTeams;

  return (
    <Box p="md">
      <Stack gap="sm">
        <Title order={2}>Analytics</Title>
        <Text c="dimmed">
          Explore scoring trends across autonomous, teleop, and endgame phases
          with aggregated team performance metrics.
        </Text>
        {isLoading && (
          <Center mih={420}>
            <Loader />
          </Center>
        )}
        {showLoadError && (
          <Center mih={420}>
            <Text c="red.6" fw={500}>
              Unable to load analytics data at this time.
            </Text>
          </Center>
        )}
        {showNoDataMessage && (
          <Center mih={420}>
            <Text c="red.6" fw={500}>
              No analytics data is available at this time.
            </Text>
          </Center>
        )}
        {hasTeams && (
          <>
            <Box w="100%" maw={1200} h={420} mx="auto">
              <ScatterChart2025 teams={teams} />
            </Box>
            <Box w="100%" maw={1200} h={420} mx="auto">
              <BarChart2025 teams={teams} />
            </Box>
          </>
        )}
      </Stack>
    </Box>
  );
}
