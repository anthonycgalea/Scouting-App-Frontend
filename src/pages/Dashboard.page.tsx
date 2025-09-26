import { Card, Stack, Text, Title } from '@mantine/core';

export function DashboardPage() {
  return (
    <Stack p="xl" gap="md">
      <Title order={2}>Dashboard</Title>
      <Card shadow="sm" padding="lg" withBorder>
        <Text c="dimmed">
          This is a placeholder dashboard. Future scouting metrics and quick links
          will appear here.
        </Text>
      </Card>
    </Stack>
  );
}
