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
      </Stack>
    </Box>
  );
}
