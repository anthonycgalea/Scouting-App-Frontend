import { useEffect, useMemo, useState } from 'react';

import { Box, Flex, MultiSelect, Stack, Tabs, Text, Title } from '@mantine/core';
import cx from 'clsx';

import CompareLineChart2025 from '@/components/CompareLineChart2025/CompareLineChart2025';
import CompareZScoreChart2025 from '@/components/CompareZScoreChart2025/CompareZScoreChart2025';
import HeadToHeadStatsTable from '@/components/HeadToHeadStatsTable/HeadToHeadStatsTable';
import {
  useTeamHeadToHeadStats,
  useTeamMatchHistory,
  type TeamHeadToHeadResponse,
  type TeamMatchHistoryResponse,
} from '@/api';
import { type TeamHeadToHeadSummary } from '@/types/analytics';
import classes from './CompareTeams.module.css';

const MAX_TEAMS = 6;

export function CompareTeamsPage() {
  const { data: matchHistory, isLoading, isError } = useTeamMatchHistory();
  const {
    data: headToHeadStats,
    isLoading: isHeadToHeadLoading,
    isError: isHeadToHeadError,
  } = useTeamHeadToHeadStats();
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('charts');

  useEffect(() => {
    if (!matchHistory || matchHistory.length === 0) {
      setSelectedTeams([]);
      return;
    }

    setSelectedTeams((previous) => {
      const availableTeamIds = new Set(
        matchHistory.map((team) => String(team.team_number)),
      );

      return previous
        .filter((teamId) => availableTeamIds.has(teamId))
        .slice(0, MAX_TEAMS);
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

  const headToHeadSummaryMap = useMemo(() => {
    if (!headToHeadStats || headToHeadStats.length === 0) {
      return new Map<number, TeamHeadToHeadSummary>();
    }

    const mapResponse = (team: TeamHeadToHeadResponse): TeamHeadToHeadSummary => ({
      teamNumber: team.team_number,
      teamName: team.team_name,
      matchesPlayed: team.matches_played,
      autonomousCoral: team.autonomous_coral,
      autonomousNetAlgae: team.autonomous_net_algae,
      autonomousProcessorAlgae: team.autonomous_processor_algae,
      autonomousPoints: team.autonomous_points,
      teleopCoral: team.teleop_coral,
      teleopGamePieces: team.teleop_game_pieces,
      teleopPoints: team.teleop_points,
      teleopNetAlgae: team.teleop_net_algae,
      teleopProcessorAlgae: team.teleop_processor_algae,
      endgamePoints: team.endgame_points,
      totalPoints: team.total_points,
      totalNetAlgae: team.total_net_algae,
      endgameSuccessRate: team.endgame_success_rate,
    });

    return new Map<number, TeamHeadToHeadSummary>(
      headToHeadStats.map((team) => [team.team_number, mapResponse(team)]),
    );
  }, [headToHeadStats]);

  const headToHeadTeams = useMemo(() => {
    if (selectedTeams.length === 0) {
      return [] as TeamHeadToHeadSummary[];
    }

    const summaries: TeamHeadToHeadSummary[] = [];

    selectedTeams.forEach((teamId) => {
      const teamNumber = Number(teamId);

      if (!Number.isFinite(teamNumber)) {
        return;
      }

      const summary = headToHeadSummaryMap.get(teamNumber);

      if (summary) {
        summaries.push(summary);
      }
    });

    return summaries;
  }, [headToHeadSummaryMap, selectedTeams]);

  const handleTeamChange = (teams: string[]) => {
    setSelectedTeams(teams.slice(0, MAX_TEAMS));
  };

  return (
    <Box p="md" className={classes.page}>
      <Stack gap="lg" className={classes.content}>
        <Stack gap={4}>
          <Title order={2}>Compare Teams</Title>
          <Text c="dimmed" size="sm">
            Select up to six teams to see how their performance compares.
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
          placeholder="Select up to 6 teams"
          nothingFoundMessage="No teams found"
          checkIconPosition="right"
          comboboxProps={{ withinPortal: true }}
        />

        <Tabs
          value={activeTab}
          onChange={(value) => setActiveTab(value ?? 'charts')}
          keepMounted={false}
          classNames={{ root: classes.tabs, list: classes.tabList, panel: classes.tabPanel }}
        >
          <Tabs.List>
            <Tabs.Tab value="charts">Charts</Tabs.Tab>
            <Tabs.Tab value="head-to-head">Head to Head Stats</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="charts">
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
          </Tabs.Panel>

          <Tabs.Panel value="head-to-head">
            <HeadToHeadStatsTable
              teams={headToHeadTeams}
              isLoading={isHeadToHeadLoading}
              isError={isHeadToHeadError}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Box>
  );
}

export default CompareTeamsPage;
