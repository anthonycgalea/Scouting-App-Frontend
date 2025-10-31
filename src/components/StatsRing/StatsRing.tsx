import { Center, Group, Paper, RingProgress, SimpleGrid, Text } from '@mantine/core';

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
      <Paper withBorder radius="sm" p="md" key={stat.label}>
        <Group gap="lg" align="center" wrap="nowrap">
          <RingProgress
            size={90}
            roundCaps
            thickness={8}
            sections={[{ value: progress, color: stat.color }]}
            label={
              <Center>
                <Text fw={700} size="sm">{`${progress}%`}</Text>
              </Center>
            }
          />

          <div>
            <Text c="dimmed" size="sm" tt="uppercase" fw={700}>
              {stat.label}
            </Text>
            <Text fw={700} size="md">
              {displayCurrent} / {displayTotal}
            </Text>
            {stat.description ? (
              <Text size="sm" c="dimmed">
                {stat.description}
              </Text>
            ) : null}
          </div>
        </Group>
      </Paper>
    );
  });

  return (
    <SimpleGrid
      cols={{ base: 1, sm: Math.min(2, data.length), md: data.length }}
      spacing="lg"
    >
      {stats}
    </SimpleGrid>
  );
}
