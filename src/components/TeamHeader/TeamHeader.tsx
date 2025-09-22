import { Alert, Skeleton, Title } from '@mantine/core';
import { useTeamInfo } from '@/api';

interface TeamHeaderProps {
  teamNumber: number;
}

export const TeamHeader = ({ teamNumber }: TeamHeaderProps) => {
  const {
    data: teamInfoData = [],
    isLoading,
    isError,
  } = useTeamInfo(teamNumber);

  if (isLoading) {
    return <Skeleton height={34} width="50%" radius="sm" />;
  }

  if (isError) {
    return (
      <Alert color="red" title="Unable to load team information">
        Team {teamNumber}
      </Alert>
    );
  }

  const [teamInfo] = teamInfoData;

  if (!teamInfo) {
    return <Title order={2}>Team {teamNumber}</Title>;
  }

  return <Title order={2}>Team {teamInfo.team_number} - {teamInfo.team_name}</Title>;
};
