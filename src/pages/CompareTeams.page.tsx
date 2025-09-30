import { useEffect, useMemo, useState } from 'react';

import { Box, Flex, MultiSelect, Stack, Text, Title } from '@mantine/core';
import cx from 'clsx';

import CompareLineChart2025 from '@/components/CompareLineChart2025/CompareLineChart2025';
import CompareZScoreChart2025 from '@/components/CompareZScoreChart2025/CompareZScoreChart2025';
import { useTeamMatchHistory, type TeamMatchHistoryResponse } from '@/api';
import classes from './CompareTeams.module.css';

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
      const availableTeamIds = new Set(
        matchHistory.map((team) => String(team.team_number)),
      );

      const existingSelection = previous
        .filter((teamId) => availableTeamIds.has(teamId))
        .slice(0, MAX_TEAMS);

      if (existingSelection.length > 0) {
        return existingSelection;
      }

      return matchHistory
        .slice(0, MAX_TEAMS)
        .map((team) => String(team.team_number));
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
    <Box p="md" className={classes.page}>
      <Stack gap="lg" className={classes.content}>
        <Stack gap={4}>
          <Title order={2}>Compare Teams</Title>
          <Text c="dimmed" size="sm">
            Select up to five teams to see how their performance compares.
          </Text>
        </Stack>
        <MultiSelect
          w={{ base: '100%' }}
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

        <Flex
          direction={{ base: 'column', lg: 'row' }}
          gap="lg"
          align="stretch"
          className={classes.chartsRow}
        >
          <Box className={cx(classes.chartPanel, classes.lineChartPanel)}>
            <CompareLineChart2025 teams={selectedTeamData} isLoading={isLoading} isError={isError} />
          </Box>
          <Box className={cx(classes.chartPanel, classes.radarChartPanel)}>
            <CompareZScoreChart2025 selectedTeams={selectedTeams} />
          </Box>
        </Flex>
      </Stack>
    </Box>
  );
}

export default CompareTeamsPage;
