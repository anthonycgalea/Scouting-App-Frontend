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
  primaryLabel?: string;
  progress?: {
    current: number;
    total: number;
  };
  description?: string;
  secondary?: {
    label: string;
    current: number;
    total: number;
    color?: string;
  };
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

const toCssVar = (color: string) => color.replace(/\./g, '-');

const getBackgroundColor = (color: string) => {
  if (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('var(')) {
    return color;
  }

  return `var(--mantine-color-${toCssVar(color)})`;
};

export function StatsRing({ data }: StatsRingProps) {
  if (data.length === 0) {
    return null;
  }

  const stats = data.map((stat) => {
    const secondary = stat.secondary;
    const primaryPercentage = formatPercentage(stat.current, stat.total);
    const secondaryPercentage = secondary
      ? formatPercentage(secondary.current, secondary.total)
      : null;
    const displayTotal = stat.total.toLocaleString();
    const displayCurrent = stat.current.toLocaleString();
    const secondaryDisplayTotal = secondary ? secondary.total.toLocaleString() : null;
    const secondaryDisplayCurrent = secondary ? secondary.current.toLocaleString() : null;

    const primaryColor = stat.color;
    const secondaryColor = secondary?.color ?? 'teal.5';

    const sections = (() => {
      if (!secondary) {
        return [{ value: primaryPercentage, color: primaryColor }];
      }

      const values: { value: number; color: string }[] = [];

      if (secondaryPercentage !== null && secondaryPercentage > 0) {
        values.push({ value: secondaryPercentage, color: secondaryColor });
      }

      const remainingPrimary = Math.max(primaryPercentage - (secondaryPercentage ?? 0), 0);

      if (remainingPrimary > 0) {
        values.push({ value: remainingPrimary, color: primaryColor });
      }

      if (values.length === 0) {
        values.push({ value: 0, color: primaryColor });
      }

      return values;
    })();

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
            size={128}
            roundCaps
            thickness={12}
            sections={sections}
            label={
              <Center>
                {secondaryPercentage !== null ? (
                  <SimpleGrid cols={2} spacing={8} verticalSpacing={2}>
                    <Stack gap={2} align="center">
                      <Text size="xs" c="dimmed" fw={600}>
                        {stat.primaryLabel ?? stat.label}
                      </Text>
                      <Text fw={700} size="sm">{`${primaryPercentage}%`}</Text>
                    </Stack>
                    <Stack gap={2} align="center">
                      <Text size="xs" c="dimmed" fw={600}>
                        {secondary?.label}
                      </Text>
                      <Text fw={700} size="sm">{`${secondaryPercentage}%`}</Text>
                    </Stack>
                  </SimpleGrid>
                ) : (
                  <Stack gap={2} align="center">
                    <Text fw={700} size="lg">{`${primaryPercentage}%`}</Text>
                  </Stack>
                )}
              </Center>
            }
          />

          <Stack gap={10} style={{ flex: 1 }} align="stretch" justify="center">
            <Text fw={600} size="lg">
              {stat.label}
            </Text>

            <SimpleGrid cols={secondary ? 2 : 1} spacing={12} verticalSpacing={4}>
              <Stack gap={2} align="flex-start">
                <Group gap={6} align="center">
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: getBackgroundColor(primaryColor),
                    }}
                  />
                  <Text size="sm" fw={600}>
                    {stat.primaryLabel ?? stat.label}
                  </Text>
                </Group>
                <Text fw={600} size="sm" c="dimmed">
                  {displayCurrent} / {displayTotal}
                </Text>
              </Stack>

              {secondary ? (
                <Stack gap={2} align="flex-start">
                  <Group gap={6} align="center">
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: getBackgroundColor(secondaryColor),
                      }}
                    />
                    <Text size="sm" fw={600}>
                      {secondary.label}
                    </Text>
                  </Group>
                  <Text fw={600} size="sm" c="dimmed">
                    {secondaryDisplayCurrent} / {secondaryDisplayTotal}
                  </Text>
                </Stack>
              ) : null}
            </SimpleGrid>

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
