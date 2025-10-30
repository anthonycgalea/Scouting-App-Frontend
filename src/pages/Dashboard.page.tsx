import { useMemo } from 'react';
import { Anchor, Card, Center, Loader, Stack, Text, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import type { MatchScheduleEntry } from '@/api';
import { useMatchSchedule, useTeamMatchValidation, useUserOrganization } from '@/api';
import { StatsRing } from '@/components/StatsRing/StatsRing';
import { useScoutingProgressStats } from '@/hooks/useScoutingProgressStats';

type Alliance = 'red' | 'blue';

interface UpcomingMatch extends MatchScheduleEntry {
  alliance: Alliance;
  position: number;
}

const MATCH_MIN_HEIGHT = 180;

const MATCH_LEVEL_PRIORITY: Record<string, number> = {
  qm: 0,
  sf: 1,
  f: 2,
};

type TeamPositionKey =
  | 'red1_id'
  | 'red2_id'
  | 'red3_id'
  | 'blue1_id'
  | 'blue2_id'
  | 'blue3_id';

const TEAM_POSITIONS: Array<{ key: TeamPositionKey; alliance: Alliance; position: number }> = [
  { key: 'red1_id', alliance: 'red', position: 1 },
  { key: 'red2_id', alliance: 'red', position: 2 },
  { key: 'red3_id', alliance: 'red', position: 3 },
  { key: 'blue1_id', alliance: 'blue', position: 1 },
  { key: 'blue2_id', alliance: 'blue', position: 2 },
  { key: 'blue3_id', alliance: 'blue', position: 3 },
];

const allianceDisplay = {
  red: { label: 'Red', color: 'red.6' as const },
  blue: { label: 'Blue', color: 'blue.6' as const },
};

const formatMatchLevel = (matchLevel: string) => matchLevel?.toUpperCase() ?? '';

export function DashboardPage() {
  const { stats, isLoading, isError } = useScoutingProgressStats();
  const hasStats = stats.length > 0;
  const {
    data: userOrganization,
    isLoading: isOrganizationLoading,
    isError: isOrganizationError,
  } = useUserOrganization();
  const {
    data: matchSchedule = [],
    isLoading: isScheduleLoading,
    isError: isScheduleError,
  } = useMatchSchedule();
  const {
    data: validationEntries = [],
    isLoading: isValidationLoading,
    isError: isValidationError,
  } = useTeamMatchValidation();

  const teamNumber =
    userOrganization?.team_number ?? userOrganization?.teamNumber ?? null;

  const upcomingMatches = useMemo(() => {
    if (!teamNumber) {
      return [];
    }

    const normalizeLevel = (value: string) => value.trim().toLowerCase();

    const matches = matchSchedule.reduce<UpcomingMatch[]>((accumulator, match) => {
      const allianceSlot = TEAM_POSITIONS.find(
        (position) => match[position.key] === teamNumber
      );

      if (!allianceSlot) {
        return accumulator;
      }

      const hasValidationRecord = validationEntries.some((entry) => {
        const sameMatchNumber = entry.match_number === match.match_number;
        const sameMatchLevel =
          normalizeLevel(entry.match_level) === normalizeLevel(match.match_level);
        const sameEvent = entry.event_key === match.event_key;

        return sameMatchNumber && sameMatchLevel && sameEvent;
      });

      if (hasValidationRecord) {
        return accumulator;
      }

      accumulator.push({
        ...match,
        alliance: allianceSlot.alliance,
        position: allianceSlot.position,
      });

      return accumulator;
    }, []);

    return matches.sort((matchA, matchB) => {
      const matchALevel = normalizeLevel(matchA.match_level);
      const matchBLevel = normalizeLevel(matchB.match_level);
      const levelDifference =
        (MATCH_LEVEL_PRIORITY[matchALevel] ?? Number.POSITIVE_INFINITY) -
        (MATCH_LEVEL_PRIORITY[matchBLevel] ?? Number.POSITIVE_INFINITY);

      if (levelDifference !== 0) {
        return levelDifference;
      }

      return matchA.match_number - matchB.match_number;
    });
  }, [matchSchedule, validationEntries, teamNumber]);

  const isUpcomingLoading =
    isOrganizationLoading || isScheduleLoading || isValidationLoading;
  const isUpcomingError =
    isOrganizationError || isScheduleError || isValidationError;
  const hasUpcomingMatches = upcomingMatches.length > 0;
  const isTeamNumberMissing = teamNumber === null;

  return (
    <Stack p="xl" gap="md">
      <Title order={2}>Dashboard</Title>
      <Card shadow="sm" padding="lg" withBorder>
        <Stack gap="md">
          <Title order={3} size="h4">
            Scouting Progress
          </Title>
          {isLoading ? (
            <Center mih={180}>
              <Loader />
            </Center>
          ) : isError ? (
            <Text c="red.6" fw={500}>
              Unable to load scouting progress.
            </Text>
          ) : hasStats ? (
            <StatsRing data={stats} />
          ) : (
            <Text c="dimmed">
              Scouting progress will appear once qualification matches are
              scheduled.
            </Text>
          )}
        </Stack>
      </Card>
      <Card shadow="sm" padding="lg" withBorder>
        <Stack gap="md">
          <Title order={3} size="h4">
            Upcoming Matches{teamNumber ? ` for Team ${teamNumber}` : ''}
          </Title>
          {isUpcomingLoading ? (
            <Center mih={MATCH_MIN_HEIGHT}>
              <Loader />
            </Center>
          ) : isUpcomingError ? (
            <Text c="red.6" fw={500}>
              Unable to load upcoming matches.
            </Text>
          ) : isTeamNumberMissing ? (
            <Text c="dimmed">
              Assign a team number to your organization to view upcoming matches.
            </Text>
          ) : hasUpcomingMatches ? (
            <Stack gap="sm">
              {upcomingMatches.map((match) => {
                const allianceInfo = allianceDisplay[match.alliance];
                const key = `${match.match_level}-${match.match_number}`;
                const redAlliance = [match.red1_id, match.red2_id, match.red3_id];
                const blueAlliance = [match.blue1_id, match.blue2_id, match.blue3_id];

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
                      to={`/matches/preview/${match.match_level}/${match.match_number}`}
                      fw={600}
                    >
                      {formatMatchLevel(match.match_level)} {match.match_number}
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
          ) : matchSchedule.length === 0 ? (
            <Text c="dimmed">
              Upcoming matches will appear once the match schedule is available.
            </Text>
          ) : (
            <Text c="dimmed">
              All scheduled matches for your team have scouting data.
            </Text>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
