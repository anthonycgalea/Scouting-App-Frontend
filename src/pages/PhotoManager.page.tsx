import {
  ActionIcon,
  Box,
  Center,
  Flex,
  Image,
  Loader,
  Modal,
  Paper,
  ScrollArea,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { Fragment, useMemo, useState } from 'react';

import { useEventTeamImages } from '@/api';
import { useRequireOrganizationAccess } from '@/hooks/useRequireOrganizationAccess';

export function PhotoManagerPage() {
  const { canAccessOrganizationPages, isCheckingAccess } = useRequireOrganizationAccess();
  const { data: teamImages = [], isLoading, isError } = useEventTeamImages({
    enabled: canAccessOrganizationPages,
  });
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(() => new Set());
  const [imagePendingDelete, setImagePendingDelete] = useState<string | null>(null);

  const closeDeleteModal = () => {
    setImagePendingDelete(null);
  };

  const sortedTeamImages = useMemo(
    () =>
      [...teamImages].sort((teamA, teamB) => teamA.teamNumber - teamB.teamNumber),
    [teamImages],
  );

  const toggleTeam = (teamNumber: number) => {
    setExpandedTeams((current) => {
      const next = new Set(current);

      if (next.has(teamNumber)) {
        next.delete(teamNumber);
      } else {
        next.add(teamNumber);
      }

      return next;
    });
  };

  if (isCheckingAccess || !canAccessOrganizationPages) {
    return null;
  }

  return (
    <Box p="md">
      <Paper withBorder p="xl" radius="md">
        <Title order={2} mb="md">
          Photo Manager
        </Title>
        {isLoading ? (
          <Center mih={200}>
            <Loader />
          </Center>
        ) : isError ? (
          <Center mih={200}>
            <Text c="red.6" fw={500}>
              Unable to load event photos.
            </Text>
          </Center>
        ) : sortedTeamImages.length === 0 ? (
          <Center mih={200}>
            <Text fw={500}>No team photos have been uploaded for this event.</Text>
          </Center>
        ) : (
          <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Team #</Table.Th>
                <Table.Th>Photos</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sortedTeamImages.map(({ teamNumber, images }) => {
                const photoCount = images.length;
                const hasImages = photoCount > 0;
                const isExpanded = expandedTeams.has(teamNumber);

                return (
                  <Fragment key={teamNumber}>
                    <Table.Tr
                      onClick={hasImages ? () => toggleTeam(teamNumber) : undefined}
                      onKeyDown={
                        hasImages
                          ? (event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                toggleTeam(teamNumber);
                              }
                            }
                          : undefined
                      }
                      tabIndex={hasImages ? 0 : undefined}
                      role={hasImages ? 'button' : undefined}
                      style={{
                        cursor: hasImages ? 'pointer' : 'default',
                      }}
                      aria-expanded={hasImages ? isExpanded : undefined}
                    >
                      <Table.Td width={160}>{teamNumber}</Table.Td>
                      <Table.Td>
                        {photoCount}
                        {hasImages ? (
                          <Text component="span" c="dimmed" fz="sm" ml="sm">
                            {isExpanded ? 'Hide photos' : 'View photos'}
                          </Text>
                        ) : null}
                      </Table.Td>
                    </Table.Tr>
                    {hasImages && isExpanded ? (
                      <Table.Tr>
                        <Table.Td colSpan={2}>
                          <ScrollArea type="auto" offsetScrollbars>
                            <Flex gap="md" wrap="nowrap" py="sm">
                              {images.map((imageUrl, index) => (
                                <Box
                                  key={`${teamNumber}-${index}`}
                                  w={220}
                                  style={{ position: 'relative' }}
                                >
                                  <ActionIcon
                                    aria-label="Delete image"
                                    variant="light"
                                    color="red"
                                    size="lg"
                                    style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setImagePendingDelete(imageUrl);
                                    }}
                                  >
                                    <IconTrash size={18} />
                                  </ActionIcon>
                                  <Image
                                    src={imageUrl}
                                    alt={`Team ${teamNumber} photo ${index + 1}`}
                                    radius="sm"
                                  />
                                </Box>
                              ))}
                            </Flex>
                          </ScrollArea>
                        </Table.Td>
                      </Table.Tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Paper>
      <Modal opened={imagePendingDelete !== null} onClose={closeDeleteModal} centered>
        <Text>Are you sure you'd like to delete this image?</Text>
      </Modal>
    </Box>
  );
}
