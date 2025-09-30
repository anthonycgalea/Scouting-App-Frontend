import { useEffect, useMemo, useState } from 'react';

import { Box, MultiSelect, Stack, Text, Title } from '@mantine/core';

import CompareLineChart2025 from '@/components/CompareLineChart2025/CompareLineChart2025';
import { useTeamMatchHistory, type TeamMatchHistoryResponse } from '@/api';

const MAX_TEAMS = 5;

export function CompareTeamsPage() {
  const { data: matchHistory, isLoading, isError } = useTeamMatchHistory();
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  useEffect(() => {
    if (!matchHistory || matchHistory.length === 0) {
      setSelectedTeams([]);
      return;
    }

    setSelectedTeams((previous) => {
      const validPrevious = previous
        .filter((teamId) => matchHistory.some((team) => String(team.team_number) === teamId))
        .slice(0, MAX_TEAMS);

      if (validPrevious.length > 0) {
        return validPrevious;
      }

      return matchHistory.slice(0, MAX_TEAMS).map((team) => String(team.team_number));
    });
  }, [matchHistory]);

  const teamOptions = useMemo(
    () =>
      (matchHistory ?? []).map((team) => ({
        value: String(team.team_number),
        label: team.team_name ? `${team.team_number} • ${team.team_name}` : `${team.team_number}`,
      })),
    [matchHistory],
  );

  const selectedTeamData = useMemo(() => {
    if (!matchHistory) {
      return [] as TeamMatchHistoryResponse[];
    }

    return selectedTeams
      .map((teamId) => matchHistory.find((team) => String(team.team_number) === teamId) ?? null)
      .filter((team): team is TeamMatchHistoryResponse => team !== null);
  }, [matchHistory, selectedTeams]);

  const handleTeamChange = (teams: string[]) => {
    setSelectedTeams(teams.slice(0, MAX_TEAMS));
  };

  return (
    <Box p="md">
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={2}>Compare Teams</Title>
          <Text c="dimmed" size="sm">
            Explore trends in estimated performance averages (EPA) across multiple teams.
            Select up to five teams to see how their performance evolves over time.
          </Text>
        </Stack>
        <CompareLineChart2025
          teams={selectedTeamData}
          isLoading={isLoading}
          isError={isError}
          teamFilter={
            <MultiSelect
              w={260}
              label="Teams"
              data={teamOptions}
              value={selectedTeams}
              onChange={handleTeamChange}
              maxValues={MAX_TEAMS}
              searchable
              placeholder="Select up to 5 teams"
              nothingFoundMessage="No teams found"
              checkIconPosition="right"
              comboboxProps={{ withinPortal: true }}
            />
          }
        />
      </Stack>
    </Box>
  );
}

export default CompareTeamsPage;
