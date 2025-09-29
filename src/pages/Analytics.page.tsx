import BarChart2025 from '@/components/BarChart2025/BarChart2025';
import {
  DEFAULT_TEAMS,
  ScatterChart2025,
} from '@/components/ScatterChart2025/ScatterChart2025';
import { Box, Stack, Text, Title } from '@mantine/core';

export function AnalyticsPage() {
  return (
    <Box p="md">
      <Stack gap="sm">
        <Title order={2}>Analytics</Title>
        <Text c="dimmed">
          Analytics dashboards and visualizations will appear here in a future
          update.
        </Text>
        <Box w={1100} h={600}>
          <ScatterChart2025 teams={DEFAULT_TEAMS} />
        </Box>
        <Box w={1100} h={600}>
          <BarChart2025 />
        </Box>
      </Stack>
    </Box>
  );
}
