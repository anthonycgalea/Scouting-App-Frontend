import { useState } from 'react';
import {
  ActionIcon,
  Box,
  Flex,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { useRequireOrganizationAccess } from '@/hooks/useRequireOrganizationAccess';
import { syncEventRankings, useEventRankings } from '@/api';

export function AllianceSelectionPage() {
  const { canAccessOrganizationPages, isCheckingAccess } = useRequireOrganizationAccess();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: rankings, isLoading, isError } = useEventRankings({
    enabled: canAccessOrganizationPages && !isCheckingAccess,
  });

  const handleRefreshRankings = async () => {
    try {
      setIsRefreshing(true);
      await syncEventRankings();
      window.location.reload();
    } catch (error) {
      setIsRefreshing(false);
      // eslint-disable-next-line no-console
      console.error('Failed to refresh event rankings', error);
    }
  };

  if (isCheckingAccess || !canAccessOrganizationPages) {
    return null;
  }

  return (
    <Box p="md">
      <Stack gap="lg">
        <Group justify="center" align="center" gap="sm">
          <Title order={2}>Alliance Selection</Title>
          <ActionIcon
            aria-label="Refresh event rankings"
            size="lg"
            radius="md"
            variant="default"
            style={{ backgroundColor: 'var(--mantine-color-body)' }}
            onClick={handleRefreshRankings}
            disabled={isRefreshing}
          >
            {isRefreshing ? <Loader size="sm" /> : <IconRefresh size={20} />}
          </ActionIcon>
        </Group>
        <Flex direction={{ base: 'column', md: 'row' }} gap="lg" align="flex-start">
          <Paper withBorder radius="md" p="md" w={{ base: '100%', md: 320 }}>
            <Stack gap="sm">
              <Title order={4}>Event Rankings</Title>
              {isLoading ? (
                <Group justify="center">
                  <Loader aria-label="Loading event rankings" />
                </Group>
              ) : isError ? (
                <Text c="red">Unable to load event rankings.</Text>
              ) : rankings && rankings.length > 0 ? (
                <ScrollArea h={400} type="auto">
                  <Table striped highlightOnHover stickyHeader>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Rank</Table.Th>
                        <Table.Th>Team</Table.Th>
                        <Table.Th>Name</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {rankings.map((ranking) => (
                        <Table.Tr
                          key={`${ranking.event_key}-${ranking.team_number}-${ranking.rank}`}
                        >
                          <Table.Td>{ranking.rank}</Table.Td>
                          <Table.Td>{ranking.team_number}</Table.Td>
                          <Table.Td>{ranking.team_name?.trim() || '—'}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              ) : (
                <Text c="dimmed">No rankings available.</Text>
              )}
            </Stack>
          </Paper>
          <Stack gap="sm" flex={1}>
            <Text c="dimmed">
              Alliance selection planning tools will be available on this page in a future
              release.
            </Text>
          </Stack>
        </Flex>
      </Stack>
    </Box>
  );
}
