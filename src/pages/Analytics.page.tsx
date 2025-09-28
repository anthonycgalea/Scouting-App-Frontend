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
        <Box>
          <ScatterChart2025 teams={DEFAULT_TEAMS} />
        </Box>
      </Stack>
    </Box>
  );
}
