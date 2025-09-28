import { Box, Stack, Text, Title } from '@mantine/core';

export function AllianceSelectionPage() {
  return (
    <Box p="md">
      <Stack gap="sm">
        <Title order={2}>Alliance Selection</Title>
        <Text c="dimmed">
          Alliance selection planning tools will be available on this page in a
          future release.
        </Text>
      </Stack>
    </Box>
  );
}
