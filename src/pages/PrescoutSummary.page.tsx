import { Box, Stack, Text, Title } from '@mantine/core';

export function PrescoutSummaryPage() {
  return (
    <Box p="md">
      <Stack gap="sm">
        <Title order={2}>Prescout Summary</Title>
        <Text c="dimmed">
          This page will soon showcase prescouting analytics and insights. Stay tuned!
        </Text>
      </Stack>
    </Box>
  );
}
