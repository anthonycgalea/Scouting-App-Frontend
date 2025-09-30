import { Box, Stack, Text, Title } from '@mantine/core';
import CompareLineChart2025 from '@/components/CompareLineChart2025/CompareLineChart2025';

export function CompareTeamsPage() {
  return (
    <Box p="md">
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={2}>Compare Teams</Title>
          <Text c="dimmed" size="sm">
            Explore trends in estimated performance averages (EPA) across multiple teams.
            Select up to five teams to see how their performance evolves over time.
          </Text>
        </Stack>
        <CompareLineChart2025 />
      </Stack>
    </Box>
  );
}

export default CompareTeamsPage;
