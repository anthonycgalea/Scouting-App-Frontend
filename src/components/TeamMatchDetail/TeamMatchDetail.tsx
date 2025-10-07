import { Alert, Center, Loader } from '@mantine/core';
import { type TeamMatchData, useTeamMatchData, useTeamMatchValidation } from '@/api';
import { TeamMatchDetail2025 } from './TeamMatchDetail2025';

interface TeamMatchDetailProps {
  teamNumber: number;
}

const getSeasonFromData = (data: TeamMatchData[] | undefined) => data?.[0]?.season;

export function TeamMatchDetail({ teamNumber }: TeamMatchDetailProps) {
  const {
    data,
    isLoading,
    isError,
  } = useTeamMatchData(teamNumber);
  const {
    data: validationData = [],
    isLoading: isValidationLoading,
    isError: isValidationError,
  } = useTeamMatchValidation();

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

  const season = getSeasonFromData(data);

  if (season !== 1) {
    return (
      <Alert color="yellow" title="Unsupported season">
        Match data for season {season ?? 'Unknown'} is not configured yet. Please update the table configuration.
      </Alert>
    );
  }

  return (
    <TeamMatchDetail2025
      data={data}
      validationData={validationData}
      isValidationLoading={isValidationLoading}
      isValidationError={isValidationError}
    />
  );
}
