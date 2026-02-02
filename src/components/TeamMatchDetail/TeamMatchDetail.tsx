import { useMemo } from 'react';
import { Alert, Center, Loader } from '@mantine/core';
import {
  type TeamMatchData,
  useSuperScoutFields,
  useSuperScoutMatchData,
  useTeamMatchData,
  useMatchSchedule,
} from '@/api';
import { TeamMatchDetail2025 } from './TeamMatchDetail2025';

interface TeamMatchDetailProps {
  teamNumber: number;
}

const MATCH_LEVEL_SORT_ORDER: Record<string, number> = {
  qm: 0,
  sf: 1,
  f: 2,
};

const buildMatchKey = (
  matchLevel: string | null | undefined,
  matchNumber: number | null | undefined
) => `${String(matchLevel ?? '').trim().toLowerCase()}-${matchNumber ?? 0}`;

export function TeamMatchDetail({ teamNumber }: TeamMatchDetailProps) {
  const {
    data,
    isLoading,
    isError,
  } = useTeamMatchData(teamNumber);
  const {
    data: superScoutData = [],
    isLoading: isSuperScoutDataLoading,
    isError: isSuperScoutDataError,
  } = useSuperScoutMatchData(teamNumber);
  const {
    data: superScoutFields = [],
    isLoading: isSuperScoutFieldsLoading,
    isError: isSuperScoutFieldsError,
  } = useSuperScoutFields();
  const {
    data: matchSchedule = [],
    isLoading: isScheduleLoading,
    isError: isScheduleError,
  } = useMatchSchedule();

  const upcomingMatches = useMemo(() => {
    const completedMatches = new Set(
      (data ?? []).map((match) => buildMatchKey(match.match_level, match.match_number))
    );

    return matchSchedule
      .filter((match) => {
        const teams = [
          match.red1_id,
          match.red2_id,
          match.red3_id,
          match.blue1_id,
          match.blue2_id,
          match.blue3_id,
        ];
        const includesTeam = teams.some((value) => value === teamNumber);

        if (!includesTeam) {
          return false;
        }

        const matchKey = buildMatchKey(match.match_level, match.match_number);

        return !completedMatches.has(matchKey);
      })
      .sort((matchA, matchB) => {
        const normalizedLevelA = String(matchA.match_level ?? '').trim().toLowerCase();
        const normalizedLevelB = String(matchB.match_level ?? '').trim().toLowerCase();
        const levelDifference =
          (MATCH_LEVEL_SORT_ORDER[normalizedLevelA] ?? Number.POSITIVE_INFINITY) -
          (MATCH_LEVEL_SORT_ORDER[normalizedLevelB] ?? Number.POSITIVE_INFINITY);

        if (levelDifference !== 0) {
          return levelDifference;
        }

        return (matchA.match_number ?? 0) - (matchB.match_number ?? 0);
      });
  }, [data, matchSchedule, teamNumber]);

  if (!Number.isFinite(teamNumber)) {
    return <Alert color="red" title="Invalid team number" />;
  }

  if (isLoading) {
    return (
      <Center mih={200}>
        <Loader />
      </Center>
    );
  }

  if (isError) {
    return (
      <Alert color="red" title="Unable to load match data">
        We couldn't retrieve match data for Team {teamNumber}. Please try again later.
      </Alert>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Alert color="blue" title="No match data available">
        We do not have any match data for Team {teamNumber} at this event yet.
      </Alert>
    );
  }

  return (
    <TeamMatchDetail2025
      data={data}
      superScoutData={superScoutData}
      superScoutFields={superScoutFields}
      isSuperScoutLoading={isSuperScoutDataLoading || isSuperScoutFieldsLoading}
      isSuperScoutError={isSuperScoutDataError || isSuperScoutFieldsError}
      upcomingMatches={upcomingMatches}
      isUpcomingLoading={isScheduleLoading}
      isUpcomingError={isScheduleError}
      totalScheduledMatches={matchSchedule.length}
      teamNumber={teamNumber}
    />
  );
}
