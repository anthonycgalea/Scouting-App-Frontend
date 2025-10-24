import { Card, Center, Loader, Stack, Text, Title } from '@mantine/core';
import { StatsRing } from '@/components/StatsRing/StatsRing';
import { useScoutingProgressStats } from '@/hooks/useScoutingProgressStats';

export function DashboardPage() {
  const { stats, isLoading, isError } = useScoutingProgressStats();
  const hasStats = stats.length > 0;

  return (
    <Stack p="xl" gap="md">
      <Title order={2}>Dashboard</Title>
      <Card shadow="sm" padding="lg" withBorder>
        <Text c="dimmed">
          This is a placeholder dashboard. Future scouting metrics and quick links
          will appear here.
        </Text>
      </Card>
      <Card shadow="sm" padding="lg" withBorder>
        <Stack gap="md">
          <Title order={3} size="h4">
            Scouting Progress
          </Title>
          {isLoading ? (
            <Center mih={180}>
              <Loader />
            </Center>
          ) : isError ? (
            <Text c="red.6" fw={500}>
              Unable to load scouting progress.
            </Text>
          ) : hasStats ? (
            <StatsRing data={stats} />
          ) : (
            <Text c="dimmed">
              Scouting progress will appear once qualification matches are
              scheduled.
            </Text>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
