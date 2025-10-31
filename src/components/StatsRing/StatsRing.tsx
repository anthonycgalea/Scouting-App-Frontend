import {
  Card,
  Center,
  Group,
  RingProgress,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';

export interface StatsRingDataItem {
  label: string;
  current: number;
  total: number;
  color: string;
  progress?: {
    current: number;
    total: number;
  };
  description?: string;
}

interface StatsRingProps {
  data: StatsRingDataItem[];
}

const formatPercentage = (current: number, total: number) => {
  if (total <= 0) {
    return 0;
  }

  const value = (current / total) * 100;

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
};

export function StatsRing({ data }: StatsRingProps) {
  if (data.length === 0) {
    return null;
  }

  const stats = data.map((stat) => {
    const progressCurrent = stat.progress?.current ?? stat.current;
    const progressTotal = stat.progress?.total ?? stat.total;
    const progress = formatPercentage(progressCurrent, progressTotal);
    const displayTotal = stat.total.toLocaleString();
    const displayCurrent = stat.current.toLocaleString();

    return (
      <Card
        key={stat.label}
        radius="md"
        p="lg"
        withBorder
        bg="var(--mantine-color-dark-7)"
      >
        <Group gap="lg" align="center" wrap="nowrap" justify="space-between">
          <RingProgress
            size={120}
            roundCaps
            thickness={12}
            sections={[{ value: progress, color: stat.color }]}
            label={
              <Center>
                <Text fw={700} size="lg">{`${progress}%`}</Text>
              </Center>
            }
          />

          <Stack gap={6} style={{ flex: 1 }} align="flex-start" justify="center">
            <Text fw={600} size="lg">
              {stat.label}
            </Text>
            <Text fw={600} size="sm" c="dimmed">
              {displayCurrent} / {displayTotal}
            </Text>
            {stat.description ? (
              <Text size="sm" c="dimmed">
                {stat.description}
              </Text>
            ) : null}
          </Stack>
        </Group>
      </Card>
    );
  });

  return (
    <SimpleGrid
      cols={{ base: 1, sm: Math.min(2, data.length), lg: Math.min(4, data.length) }}
      spacing="xl"
    >
      {stats}
    </SimpleGrid>
  );
}
