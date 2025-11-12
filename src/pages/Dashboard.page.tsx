import { useMemo } from 'react';
import {
  Anchor,
  Card,
  Center,
  Flex,
  Loader,
  ScrollArea,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { useOrganizationDashboard } from '@/api';
import { StatsRing, type StatsRingDataItem } from '@/components/StatsRing/StatsRing';

type Alliance = 'red' | 'blue';

interface UpcomingMatch {
  matchLevel: string;
  matchNumber: number;
  alliances: {
    red: { teams: number[] };
    blue: { teams: number[] };
  };
  alliance: Alliance;
  position: number;
}

const MATCH_MIN_HEIGHT = 180;

const MATCH_LEVEL_PRIORITY: Record<string, number> = {
  qm: 0,
  sf: 1,
  f: 2,
};

const allianceDisplay = {
  red: { label: 'Red', color: 'red.6' as const },
  blue: { label: 'Blue', color: 'blue.6' as const },
};

const formatMatchLevel = (matchLevel: string) => matchLevel?.toUpperCase() ?? '';

const TEAMS_PER_MATCH = 6;
const ALLIANCES_PER_MATCH = 2;

const getNumber = (value?: number | null) =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

export function DashboardPage() {
  const {
    data: dashboardData,
    isLoading,
    isError,
  } = useOrganizationDashboard();

  const stats = useMemo<StatsRingDataItem[]>(() => {
    const eventInfo = dashboardData?.eventInfo;
    const progress = dashboardData?.progress;

    const items: StatsRingDataItem[] = [];

    const qualificationMatches = getNumber(eventInfo?.qualificationMatches);
    const totalPossibleRecords = qualificationMatches * TEAMS_PER_MATCH;

    if (totalPossibleRecords > 0) {
      const scouted = Math.min(getNumber(progress?.scouted), totalPossibleRecords);
      const validated = Math.min(getNumber(progress?.validated), totalPossibleRecords);

      items.push(
        {
          label: 'Team Matches Scouted',
          current: scouted,
          total: totalPossibleRecords,
          color: 'yellow.6',
        },
        {
          label: 'Matches Validated',
          current: validated,
          total: totalPossibleRecords,
          color: 'teal.5',
        }
      );
    }

    const teamCount = getNumber(eventInfo?.teamCount);

    if (teamCount > 0) {
      const expectedPrescoutRecords = teamCount * 10;

      if (expectedPrescoutRecords > 0) {
        const prescout = Math.min(
          getNumber(progress?.prescout),
          expectedPrescoutRecords
        );

        items.push({
          label: 'Prescout Progress',
          current: prescout,
          total: expectedPrescoutRecords,
          color: 'grape.6',
        });
      }

      const pitScouting = Math.min(getNumber(progress?.pitScouting), teamCount);
      const photos = Math.min(getNumber(progress?.photos), teamCount);

      items.push(
        {
          label: 'Teams Pit Scouted',
          current: pitScouting,
          total: teamCount,
          color: 'indigo.6',
        },
        {
          label: 'Robot Photos Taken',
          current: photos,
          total: teamCount,
          color: 'cyan.6',
        }
      );
    }

    const totalQualificationAlliances = qualificationMatches * ALLIANCES_PER_MATCH;

    if (totalQualificationAlliances > 0) {
      const superScout = Math.min(
        getNumber(progress?.superScout),
        totalQualificationAlliances
      );

      items.push({
        label: 'Alliances SuperScouted',
        current: superScout,
        total: totalQualificationAlliances,
        color: 'orange.6',
      });
    }

    return items;
  }, [dashboardData]);

  const teamNumber = dashboardData?.loggedInTeam?.number ?? null;

  const upcomingMatches = useMemo(() => {
    if (!teamNumber) {
      return [];
    }

    const normalizeLevel = (value: string) => value.trim().toLowerCase();

    const matches = (dashboardData?.upcomingMatches ?? []).reduce<UpcomingMatch[]>(
      (accumulator, match) => {
        const redTeams = match.alliances?.red?.teams ?? [];
        const blueTeams = match.alliances?.blue?.teams ?? [];

        const redIndex = redTeams.findIndex((team) => team === teamNumber);
        const blueIndex = blueTeams.findIndex((team) => team === teamNumber);

        if (redIndex === -1 && blueIndex === -1) {
          return accumulator;
        }

        const alliance: Alliance = redIndex !== -1 ? 'red' : 'blue';
        const position = (alliance === 'red' ? redIndex : blueIndex) + 1;

        accumulator.push({
          ...match,
          alliances: {
            red: { teams: redTeams },
            blue: { teams: blueTeams },
          },
          alliance,
          position,
        });

        return accumulator;
      },
      []
    );

    return matches.sort((matchA, matchB) => {
      const matchALevel = normalizeLevel(matchA.matchLevel);
      const matchBLevel = normalizeLevel(matchB.matchLevel);
      const levelDifference =
        (MATCH_LEVEL_PRIORITY[matchALevel] ?? Number.POSITIVE_INFINITY) -
        (MATCH_LEVEL_PRIORITY[matchBLevel] ?? Number.POSITIVE_INFINITY);

      if (levelDifference !== 0) {
        return levelDifference;
      }

      return matchA.matchNumber - matchB.matchNumber;
    });
  }, [dashboardData?.upcomingMatches, teamNumber]);

  const eventQualificationMatches =
    dashboardData?.eventInfo?.qualificationMatches ?? 0;

  const isUpcomingLoading = isLoading;
  const isUpcomingError = isError;
  const hasStats = stats.length > 0;
  const hasUpcomingMatches = upcomingMatches.length > 0;
  const isTeamNumberMissing = teamNumber === null;

  return (
    <Stack p="xl" gap="md" style={{ minHeight: '100vh' }}>
      <Title order={2}>Dashboard</Title>
      <Flex gap="md" align="stretch" style={{ flex: 1 }}>
        <Card
          shadow="sm"
          padding="lg"
          withBorder
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          <Stack gap="md" style={{ flex: 1 }}>
            <Title order={3} size="h4">
              Scouting Progress
            </Title>
            {isLoading ? (
              <Center mih={180} style={{ flex: 1 }}>
                <Loader />
              </Center>
            ) : isError ? (
              <Text c="red.6" fw={500}>
                Unable to load scouting progress.
              </Text>
            ) : hasStats ? (
              <ScrollArea style={{ flex: 1 }} type="auto" offsetScrollbars>
                <StatsRing data={stats} />
              </ScrollArea>
            ) : (
              <Text c="dimmed">
                Scouting progress will appear once qualification matches are
                scheduled.
              </Text>
            )}
          </Stack>
        </Card>
        <Card
          shadow="sm"
          padding="lg"
          withBorder
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          <Stack gap="md" style={{ flex: 1 }}>
            <Title order={3} size="h4">
              Upcoming Matches{teamNumber ? ` for Team ${teamNumber}` : ''}
            </Title>
            {isUpcomingLoading ? (
              <Center mih={MATCH_MIN_HEIGHT} style={{ flex: 1 }}>
                <Loader />
              </Center>
            ) : isUpcomingError ? (
              <Text c="red.6" fw={500}>
                Unable to load upcoming matches.
              </Text>
            ) : isTeamNumberMissing ? (
              <Text c="dimmed">
                Assign a team number to your organization to view upcoming
                matches.
              </Text>
            ) : hasUpcomingMatches ? (
              <ScrollArea style={{ flex: 1 }} type="auto" offsetScrollbars>
                <Stack gap="sm" pr="sm">
                  {upcomingMatches.map((match) => {
                    const allianceInfo = allianceDisplay[match.alliance];
                    const key = `${match.matchLevel}-${match.matchNumber}`;
                    const redAlliance = match.alliances.red.teams;
                    const blueAlliance = match.alliances.blue.teams;

                    const renderAllianceTeams = (teams: number[]) =>
                      teams.map((team, index) => (
                        <Text
                          key={`${key}-${team}-${index}`}
                          component="span"
                          fw={team === teamNumber ? 700 : undefined}
                        >
                          {team}
                          {index < teams.length - 1 ? ', ' : ''}
                        </Text>
                      ));

                    return (
                      <Text key={key}>
                        <Anchor
                          component={Link}
                          to={`/matches/preview/${match.matchLevel}/${match.matchNumber}`}
                          fw={600}
                        >
                          {formatMatchLevel(match.matchLevel)} {match.matchNumber}
                        </Anchor>
                        {': '}
                        {renderAllianceTeams(redAlliance)}
                        {' vs '}
                        {renderAllianceTeams(blueAlliance)}
                        {' - '}
                        <Text component="span" fw={600} c={allianceInfo.color}>
                          {allianceInfo.label} {match.position}
                        </Text>
                      </Text>
                    );
                  })}
                </Stack>
              </ScrollArea>
            ) : eventQualificationMatches === 0 ? (
              <Text c="dimmed">
                Upcoming matches will appear once the match schedule is
                available.
              </Text>
            ) : (
              <Text c="dimmed">
                All scheduled matches for your team have scouting data.
              </Text>
            )}
          </Stack>
        </Card>
      </Flex>
    </Stack>
  );
}
