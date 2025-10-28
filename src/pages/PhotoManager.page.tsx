import {
  ActionIcon,
  Box,
  Button,
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
  useMantineTheme,
} from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { Fragment, useMemo, useState } from 'react';

import { useDeleteTeamImage, useEventTeamImages } from '@/api';
import { useRequireOrganizationAccess } from '@/hooks/useRequireOrganizationAccess';

export function PhotoManagerPage() {
  const theme = useMantineTheme();
  const { canAccessOrganizationPages, isCheckingAccess } = useRequireOrganizationAccess();
  const { data: teamImages = [], isLoading, isError } = useEventTeamImages({
    enabled: canAccessOrganizationPages,
  });
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(() => new Set());
  const [imagePendingDelete, setImagePendingDelete] = useState<{
    id: string;
    teamNumber: number;
    imageUrl: string;
  } | null>(null);
  const deleteTeamImageMutation = useDeleteTeamImage();
  const isDeletingImage = deleteTeamImageMutation.isPending;
  const isDeleteModalOpen = imagePendingDelete !== null;

  const closeDeleteModal = () => {
    deleteTeamImageMutation.reset();
    setImagePendingDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!imagePendingDelete) {
      return;
    }

    try {
      await deleteTeamImageMutation.mutateAsync({
        id: imagePendingDelete.id,
        teamNumber: imagePendingDelete.teamNumber,
      });
      closeDeleteModal();
    } catch (error) {
      // Handled by mutation state; keep modal open to show error message.
    }
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
                              {images.map((image, index) => {
                                const imageUrl = image.image_url;

                                return (
                                  <Box
                                    key={`${teamNumber}-${image.id}`}
                                    w={220}
                                    style={{ position: 'relative' }}
                                  >
                                    <ActionIcon
                                      aria-label="Delete image"
                                      variant="default"
                                      size="lg"
                                      style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setImagePendingDelete({
                                          id: image.id,
                                          teamNumber,
                                          imageUrl,
                                        });
                                      }}
                                    >
                                      <IconTrash size={18} color={theme.colors.red[6]} />
                                    </ActionIcon>
                                    <Image
                                      src={imageUrl}
                                      alt={`Team ${teamNumber} photo ${index + 1}`}
                                      radius="sm"
                                    />
                                  </Box>
                                );
                              })}
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
      <Modal
        opened={isDeleteModalOpen}
        onClose={closeDeleteModal}
        centered
        withCloseButton={!isDeletingImage}
        closeOnClickOutside={!isDeletingImage}
        closeOnEscape={!isDeletingImage}
      >
        <Text>Are you sure you'd like to delete this image?</Text>
        {deleteTeamImageMutation.isError ? (
          <Text c="red.6" mt="sm">
            Unable to delete this image. Please try again.
          </Text>
        ) : null}
        <Flex justify="flex-end" gap="sm" mt="lg">
          <Button
            variant="default"
            onClick={closeDeleteModal}
            disabled={isDeletingImage}
          >
            Cancel
          </Button>
          <Button
            color="red"
            onClick={handleConfirmDelete}
            loading={isDeletingImage}
          >
            Delete
          </Button>
        </Flex>
      </Modal>
    </Box>
  );
}
