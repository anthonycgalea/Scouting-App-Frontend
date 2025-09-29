import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useTeamAnalytics, type TeamAnalyticsResponse } from '@/api';
import BarChart2025 from '@/components/BarChart2025/BarChart2025';
import {
  AnalyticsViewToggle,
  type AnalyticsView,
} from '@/components/AnalyticsViewToggle/AnalyticsViewToggle';
import { ScatterChart2025 } from '@/components/ScatterChart2025/ScatterChart2025';
import { type TeamPerformanceSummary } from '@/types/analytics';
import {
  Box,
  Center,
  Checkbox,
  Flex,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Title,
} from '@mantine/core';

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

  const [selectedTeamNumbers, setSelectedTeamNumbers] = useState<number[]>([]);
  const previousTeamNumbersRef = useRef<number[]>([]);

  useEffect(() => {
    const currentTeamNumbers = teams.map((team) => team.teamNumber);

    setSelectedTeamNumbers((prevSelected) => {
      const previousTeamNumbers = previousTeamNumbersRef.current;
      previousTeamNumbersRef.current = currentTeamNumbers;

      if (currentTeamNumbers.length === 0) {
        return [];
      }

      if (previousTeamNumbers.length === 0) {
        return currentTeamNumbers;
      }

      const previouslySelectedAll =
        prevSelected.length === previousTeamNumbers.length && previousTeamNumbers.length > 0;
      const prevSelectedSet = new Set(prevSelected);
      const nextSelected = currentTeamNumbers.filter((teamNumber) => prevSelectedSet.has(teamNumber));

      if (previouslySelectedAll) {
        return currentTeamNumbers;
      }

      if (nextSelected.length === 0) {
        return currentTeamNumbers;
      }

      return nextSelected;
    });
  }, [teams]);

  const toggleTeamSelection = useCallback(
    (teamNumber: number) => {
      setSelectedTeamNumbers((prevSelected) => {
        const currentTeamNumbers = teams.map((team) => team.teamNumber);
        const selection = new Set(prevSelected);

        if (selection.has(teamNumber)) {
          selection.delete(teamNumber);
        } else {
          selection.add(teamNumber);
        }

        return currentTeamNumbers.filter((number) => selection.has(number));
      });
    },
    [teams]
  );

  const handleToggleAll = useCallback(() => {
    setSelectedTeamNumbers((prevSelected) => {
      if (prevSelected.length === teams.length) {
        return [];
      }

      return teams.map((team) => team.teamNumber);
    });
  }, [teams]);

  const hasTeams = teams.length > 0;
  const showLoadError = isError && !isLoading;
  const showNoDataMessage = !isLoading && !showLoadError && !hasTeams;
  const [view, setView] = useState<AnalyticsView>('scatter');

  const selectedTeamNumbersSet = useMemo(
    () => new Set(selectedTeamNumbers),
    [selectedTeamNumbers]
  );

  const filteredTeams = useMemo(
    () => teams.filter((team) => selectedTeamNumbersSet.has(team.teamNumber)),
    [teams, selectedTeamNumbersSet]
  );

  const allTeamsSelected = hasTeams && selectedTeamNumbers.length === teams.length;
  const hasSomeSelected = selectedTeamNumbers.length > 0;
  const showNoTeamsSelectedMessage = hasTeams && !isLoading && filteredTeams.length === 0;

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
          <Flex direction={{ base: 'column', md: 'row' }} gap="lg" align="flex-start">
            <Stack flex={1} gap="lg">
              {showNoTeamsSelectedMessage ? (
                <Center mih={420}>
                  <Text c="dimmed" fw={500}>
                    Select at least one team to view analytics.
                  </Text>
                </Center>
              ) : (
                <>
                <Box w="100%" maw={520} mx="auto">
              <AnalyticsViewToggle value={view} onChange={setView} />
            </Box>
            {view === 'scatter' ? (
                  <Box w="100%" maw={1200} h={420} mx="auto">
                    <ScatterChart2025 teams={filteredTeams} />
                  </Box>
                  ) : (
                  <Box w="100%" maw={1200} h={420} mx="auto" style={{ overflowY: 'auto' }}>
                    <BarChart2025 teams={filteredTeams} />
                  </Box>
                  )}
                </>
              )}
            </Stack>
            <Paper
              w={{ base: '100%', md: 280 }}
              maw={{ base: '100%', md: 320 }}
              withBorder
              radius="md"
              p="md"
              style={{ flexShrink: 0 }}
            >
              <Stack gap="sm">
                <Text fw={600}>Teams</Text>
                <Checkbox
                  label="All teams"
                  checked={allTeamsSelected}
                  indeterminate={!allTeamsSelected && hasSomeSelected}
                  onChange={handleToggleAll}
                />
                <ScrollArea h={320} type="auto">
                  <Stack gap="xs" pr="sm">
                    {teams.map((team) => {
                      const label = team.teamName
                        ? `Team ${team.teamNumber} — ${team.teamName}`
                        : `Team ${team.teamNumber}`;

                      return (
                        <Checkbox
                          key={team.teamNumber}
                          label={label}
                          checked={selectedTeamNumbersSet.has(team.teamNumber)}
                          onChange={() => toggleTeamSelection(team.teamNumber)}
                        />
                      );
                    })}
                  </Stack>
                </ScrollArea>
              </Stack>
            </Paper>
          </Flex>
        )}
      </Stack>
    </Box>
  );
}
