import { useEventTeams } from '@/api';
import { Button, Center, Loader, Table, Text } from '@mantine/core';
import { Link } from '@tanstack/react-router';

import {
  TeamCommonCommentsBadgeList,
  useTeamCommonComments,
} from '@/components/SuperScout/TeamCommonComments';

function TeamCommonCommentsCell({ teamNumber }: { teamNumber: number }) {
  const result = useTeamCommonComments(teamNumber);

  return (
    <TeamCommonCommentsBadgeList
      result={result}
      badgeSize="sm"
      loaderSize="sm"
    />
  );
}

export function TeamDirectory() {
  const {
    data: teams = [],
    isLoading,
    isError,
  } = useEventTeams();

  if (isLoading) {
    return (
      <Center mih={200}>
        <Loader />
      </Center>
    );
  }

  if (isError) {
    return (
      <Center mih={200}>
        <Text c="red.6" fw={500}>
          Unable to load the team directory.
        </Text>
      </Center>
    );
  }

  if (teams.length === 0) {
    return (
      <Center mih={200}>
        <Text fw={500}>No teams are available for this event.</Text>
      </Center>
    );
  }

  const rows = [...teams]
    .sort((teamA, teamB) => teamA.team_number - teamB.team_number)
    .map((team) => {
      const location = team.location.trim();

      return (
        <Table.Tr key={team.team_number}>
          <Table.Td>
            <Button
              component={Link}
              to={`/teams/${team.team_number}`}
              aria-label={`${team.team_number}`}
              radius="md"
              variant="subtle"
            >
              {team.team_number}
            </Button>
          </Table.Td>
          <Table.Td>{team.team_name}</Table.Td>
          <Table.Td>{location || <Text c="dimmed">Unknown</Text>}</Table.Td>
          <Table.Td>
            <TeamCommonCommentsCell teamNumber={team.team_number} />
          </Table.Td>
        </Table.Tr>
      );
    });

  return (
    <Table.ScrollContainer minWidth={800}>
      <Table verticalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Team #</Table.Th>
            <Table.Th>Team Name</Table.Th>
            <Table.Th>Location</Table.Th>
            <Table.Th>Common Comments</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}