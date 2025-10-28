import {
  Box,
  Card,
  Center,
  Flex,
  Loader,
  ScrollArea,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useMemo } from 'react';

import { useRankingPredictions } from '@/api';

export function RankingPredictionsPage() {
  const {
    data: predictions,
    isLoading,
    isError,
  } = useRankingPredictions();

  const sortedPredictions = useMemo(() => {
    if (!predictions) {
      return [];
    }

    return [...predictions].sort((a, b) => a.mean_rank - b.mean_rank);
  }, [predictions]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <Center style={{ flex: 1 }}>
          <Loader />
        </Center>
      );
    }

    if (isError) {
      return (
        <Center style={{ flex: 1 }}>
          <Text c="red.6" fw={500}>
            Failed to load ranking predictions.
          </Text>
        </Center>
      );
    }

    if (sortedPredictions.length === 0) {
      return (
        <Center style={{ flex: 1 }}>
          <Text c="dimmed">Ranking predictions are not available yet.</Text>
        </Center>
      );
    }

    return (
      <ScrollArea type="auto" style={{ flex: 1 }}>
        <Table highlightOnHover stickyHeader verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Predicted Rank</Table.Th>
              <Table.Th>Team</Table.Th>
              <Table.Th>Mean Rank</Table.Th>
              <Table.Th>Median Rank</Table.Th>
              <Table.Th>5th Percentile</Table.Th>
              <Table.Th>95th Percentile</Table.Th>
              <Table.Th>Mean RP</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sortedPredictions.map((prediction, index) => (
              <Table.Tr key={prediction.team_number}>
                <Table.Td>{index + 1}</Table.Td>
                <Table.Td>{prediction.team_number}</Table.Td>
                <Table.Td>{prediction.mean_rank.toFixed(2)}</Table.Td>
                <Table.Td>{prediction.median_rank}</Table.Td>
                <Table.Td>{prediction.rank_5}</Table.Td>
                <Table.Td>{prediction.rank_95}</Table.Td>
                <Table.Td>{prediction.mean_rp.toFixed(2)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    );
  };

  return (
    <Box p="xl" style={{ height: '100%' }}>
      <Flex direction="column" gap="md" style={{ height: '100%' }}>
        <Title order={2}>Ranking Predictions</Title>
        <Card
          withBorder
          radius="md"
          shadow="sm"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
        >
          <Flex direction="column" gap="md" style={{ flex: 1, minHeight: 0 }}>
            <Text c="dimmed">Sorted by predicted mean rank from lowest to highest.</Text>
            {renderContent()}
          </Flex>
        </Card>
      </Flex>
    </Box>
  );
}
