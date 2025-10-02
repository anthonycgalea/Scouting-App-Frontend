import { useMemo } from 'react';
import { Alert, Box, Center, Flex, Loader, Stack, Text, Title } from '@mantine/core';

import CompareLineChart2025 from '@/components/CompareLineChart2025/CompareLineChart2025';
import CompareZScoreChart2025 from '@/components/CompareZScoreChart2025/CompareZScoreChart2025';
import { useTeamMatchHistory, type TeamMatchHistoryResponse } from '@/api';

type TeamAnalyticsProps = {
  teamNumber: number;
};

export function TeamAnalytics({ teamNumber }: TeamAnalyticsProps) {
  const {
    data: matchHistory,
    isLoading,
    isError,
  } = useTeamMatchHistory();

  const teamData = useMemo(() => {
    if (!matchHistory) {
      return null;
    }

    return (
      matchHistory.find((team) => team.team_number === teamNumber) ?? null
    );
  }, [matchHistory, teamNumber]);

  const chartTeams = useMemo<TeamMatchHistoryResponse[]>(
    () => (teamData ? [teamData] : []),
    [teamData],
  );

  const selectedTeamIds = useMemo(
    () => (teamData ? [String(teamData.team_number)] : []),
    [teamData],
  );

  if (isLoading) {
    return (
      <Center mih={240}>
        <Loader />
      </Center>
    );
  }

  if (isError) {
    return (
      <Alert color="red" title="Unable to load analytics">
        We ran into a problem while loading analytics for this team. Please try again later.
      </Alert>
    );
  }

  if (!teamData) {
    return (
      <Alert color="yellow" title="No analytics available">
        We don't have analytics data for this team yet.
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={2}>Analytics</Title>
        <Text size="sm" c="dimmed">
          Explore how this team performs across recent matches and z-score metrics.
        </Text>
      </Stack>

      <Flex direction={{ base: 'column', lg: 'row' }} gap="lg" align="stretch">
        <Box style={{ flex: 3, minWidth: 0 }}>
          <CompareLineChart2025 teams={chartTeams} isLoading={false} isError={false} />
        </Box>
        <Box style={{ flex: 2, minWidth: 0 }}>
          <CompareZScoreChart2025 selectedTeams={selectedTeamIds} />
        </Box>
      </Flex>
    </Stack>
  );
}
