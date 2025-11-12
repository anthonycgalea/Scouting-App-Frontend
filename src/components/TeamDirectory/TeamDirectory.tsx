import { useMemo } from 'react';

import {
  useEventTeams,
  useEventPitScoutRecords,
  useEventTeamImages,
  useEventPrescoutRecords,
} from '@/api';
import { Badge, Button, Center, Loader, Table, Text, ThemeIcon } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { IconCheck } from '@tabler/icons-react';

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
  const {
    data: pitScoutRecords = [],
    isLoading: isLoadingPitScouts,
    isError: isPitScoutError,
  } = useEventPitScoutRecords();
  const {
    data: prescoutRecords = [],
    isLoading: isLoadingPrescouts,
    isError: isPrescoutError,
  } = useEventPrescoutRecords();
  const {
    data: teamImages = [],
    isLoading: isLoadingTeamImages,
    isError: isTeamImagesError,
  } = useEventTeamImages();

  const pitScoutTeamNumbers = useMemo(() => {
    return new Set(pitScoutRecords.map((record) => record.team_number));
  }, [pitScoutRecords]);

  const prescoutCountsByTeam = useMemo(() => {
    const counts = new Map<number, number>();

    for (const record of prescoutRecords) {
      counts.set(record.team_number, (counts.get(record.team_number) ?? 0) + 1);
    }

    return counts;
  }, [prescoutRecords]);

  const teamNumbersWithPhotos = useMemo(() => {
    return new Set(
      teamImages
        .filter((entry) => entry.images.length > 0)
        .map((entry) => entry.teamNumber),
    );
  }, [teamImages]);

  if (isLoading || isLoadingPitScouts || isLoadingTeamImages || isLoadingPrescouts) {
    return (
      <Center mih={200}>
        <Loader />
      </Center>
    );
  }

  if (isError || isPitScoutError || isTeamImagesError || isPrescoutError) {
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

      const hasPitScoutRecord = pitScoutTeamNumbers.has(team.team_number);
      const hasTeamPhoto = teamNumbersWithPhotos.has(team.team_number);
      const prescoutedMatches = prescoutCountsByTeam.get(team.team_number) ?? 0;

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
          <Table.Td>
            <Badge
              color={hasPitScoutRecord ? 'green' : 'gray'}
              variant={hasPitScoutRecord ? 'light' : 'outline'}
            >
              {hasPitScoutRecord ? 'Yes' : 'No'}
            </Badge>
          </Table.Td>
          <Table.Td>
            <Badge
              color={hasTeamPhoto ? 'blue' : 'gray'}
              variant={hasTeamPhoto ? 'light' : 'outline'}
            >
              {hasTeamPhoto ? 'Yes' : 'No'}
            </Badge>
          </Table.Td>
          <Table.Td>{location || <Text c="dimmed">Unknown</Text>}</Table.Td>
          <Table.Td>
            <TeamCommonCommentsCell teamNumber={team.team_number} />
          </Table.Td>
          <Table.Td>
            <Center inline>
              {prescoutedMatches >= 10 ? (
                <ThemeIcon
                  color="green"
                  variant="filled"
                  radius="xl"
                  size="sm"
                  aria-label="Prescouted for ten or more matches"
                >
                  <IconCheck size={16} />
                </ThemeIcon>
              ) : (
                <Text>{`${prescoutedMatches}/10`}</Text>
              )}
            </Center>
          </Table.Td>
        </Table.Tr>
      );
    });

  return (
    <Table.ScrollContainer minWidth={900}>
      <Table verticalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Team #</Table.Th>
            <Table.Th>Team Name</Table.Th>
            <Table.Th>Pit</Table.Th>
            <Table.Th>Photo</Table.Th>
            <Table.Th>Location</Table.Th>
            <Table.Th>Common Comments</Table.Th>
            <Table.Th>Prescouted</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}