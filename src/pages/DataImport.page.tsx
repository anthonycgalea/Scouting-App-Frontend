import { Box, Stack, Text, Title } from '@mantine/core';

export function DataImportPage() {
  return (
    <Box p="md">
      <Stack>
        <Title order={2}>Data Import</Title>
        <Text c="dimmed">
          Tools for importing scouting data will live here. Check back soon for more
          functionality.
        </Text>
      </Stack>
    </Box>
  );
}
