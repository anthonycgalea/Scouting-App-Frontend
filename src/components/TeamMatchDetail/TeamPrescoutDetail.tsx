import { useMemo } from 'react';
import { Alert, Center, Loader } from '@mantine/core';
import { type TeamMatchData, type TeamMatchData2025, type TeamMatchData2026, useEventPrescoutRecords } from '@/api';
import { TeamMatchDetail2025 } from './TeamMatchDetail2025';

interface TeamPrescoutDetailProps {
  teamNumber: number;
}

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const getNumber = (record: Record<string, unknown>, key: string) => {
  const value = record[key];
  return isNumber(value) ? value : 0;
};

const mapToTeamMatchData = (record: Record<string, unknown>): TeamMatchData | null => {
  const teamNumber = record.team_number;
  const matchNumber = record.match_number;
  const season = record.season;
  const eventKey = record.event_key;
  const matchLevel = record.match_level;

  if (
    !isNumber(teamNumber) ||
    !isNumber(matchNumber) ||
    !isNumber(season) ||
    typeof eventKey !== 'string' ||
    typeof matchLevel !== 'string'
  ) {
    return null;
  }

  const base = {
    season,
    team_number: teamNumber,
    event_key: eventKey,
    match_number: matchNumber,
    match_level: matchLevel,
    user_id: typeof record.user_id === 'string' ? record.user_id : undefined,
    organization_id: isNumber(record.organization_id) ? record.organization_id : undefined,
    timestamp: typeof record.timestamp === 'string' ? record.timestamp : undefined,
    notes: typeof record.notes === 'string' ? record.notes : null,
  };

  const is2026Record =
    season === 2 ||
    season === 2026 ||
    'autoFuel' in record ||
    'teleopFuel' in record ||
    'autoPass' in record ||
    'teleopPass' in record;

  if (is2026Record) {
    const normalized: TeamMatchData2026 = {
      ...base,
      autoPass: getNumber(record, 'autoPass'),
      autoFuel: getNumber(record, 'autoFuel'),
      autoClimb: getNumber(record, 'autoClimb'),
      teleopFuel: getNumber(record, 'teleopFuel'),
      teleopPass: getNumber(record, 'teleopPass'),
      endgame: typeof record.endgame === 'string' ? record.endgame : 'NONE',
    };

    return normalized;
  }

  const endgame = typeof record.endgame === 'string' ? record.endgame : 'NONE';
  const normalized2025: TeamMatchData2025 = {
    ...base,
    al4c: getNumber(record, 'al4c'),
    al3c: getNumber(record, 'al3c'),
    al2c: getNumber(record, 'al2c'),
    al1c: getNumber(record, 'al1c'),
    tl4c: getNumber(record, 'tl4c'),
    tl3c: getNumber(record, 'tl3c'),
    tl2c: getNumber(record, 'tl2c'),
    tl1c: getNumber(record, 'tl1c'),
    aNet: getNumber(record, 'aNet'),
    tNet: getNumber(record, 'tNet'),
    aProcessor: getNumber(record, 'aProcessor'),
    tProcessor: getNumber(record, 'tProcessor'),
    endgame: endgame === 'PARK' || endgame === 'SHALLOW' || endgame === 'DEEP' ? endgame : 'NONE',
  };

  return normalized2025;
};

export function TeamPrescoutDetail({ teamNumber }: TeamPrescoutDetailProps) {
  const {
    data,
    isLoading,
    isError,
  } = useEventPrescoutRecords();

  const teamPrescoutData = useMemo(
    () =>
      (data ?? [])
        .filter((record) => record.team_number === teamNumber)
        .map((record) => mapToTeamMatchData(record))
        .filter((record): record is TeamMatchData => record !== null),
    [data, teamNumber]
  );

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
      <Alert color="red" title="Unable to load prescout match data">
        We couldn't retrieve prescout match data for Team {teamNumber}. Please try again later.
      </Alert>
    );
  }

  if (teamPrescoutData.length === 0) {
    return (
      <Alert color="blue" title="No prescout match data available">
        We do not have any prescout match data for Team {teamNumber} at this event yet.
      </Alert>
    );
  }

  return (
    <TeamMatchDetail2025
      data={teamPrescoutData}
      upcomingMatches={[]}
      isUpcomingLoading={false}
      isUpcomingError={false}
      totalScheduledMatches={0}
      teamNumber={teamNumber}
      showUpcomingMatches={false}
    />
  );
}
